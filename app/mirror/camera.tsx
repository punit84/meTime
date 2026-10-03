import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, useMicrophonePermissions, type CameraType } from 'expo-camera';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { AppText } from '@/components/AppText';
import { useApp } from '@/lib/AppProvider';
import { colors, fonts, radii, shadows, spacing } from '@/lib/theme';
import type { MirrorMediaType } from '@/lib/types';

type CapturedMedia = {
  type: MirrorMediaType;
  uri: string;
};

export default function CameraScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const insets = useSafeAreaInsets();
  const { todayMood, addMirrorEntry } = useApp();

  // Mode: photo or video
  const initialMode: MirrorMediaType = params.mode === 'video' ? 'video' : 'photo';
  const [mode, setMode] = useState<MirrorMediaType>(initialMode);
  const [facing, setFacing] = useState<CameraType>('front');
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [saving, setSaving] = useState(false);

  // Captured media for preview
  const [captured, setCaptured] = useState<CapturedMedia | null>(null);

  // Permissions
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();

  const cameraRef = useRef<CameraView>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Web recording refs
  const webMediaRecorderRef = useRef<unknown>(null);
  const webVideoChunksRef = useRef<Blob[]>([]);
  const webStreamRef = useRef<MediaStream | null>(null);

  // Recording pulse animation
  const [pulseAnim] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (isRecording) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.3,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording, pulseAnim]);

  // Handle timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  // Clean up web stream on unmount
  useEffect(() => {
    return () => {
      if (webStreamRef.current) {
        webStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const toggleFacing = () => {
    setFacing((prev) => (prev === 'front' ? 'back' : 'front'));
  };

  const handleCapturePhoto = async () => {
    if (Platform.OS === 'web') {
      setCaptured({
        type: 'photo',
        uri: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&q=80',
      });
      return;
    }

    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
      });
      if (photo?.uri) {
        setCaptured({ type: 'photo', uri: photo.uri });
      }
    } catch (error) {
      if (__DEV__) console.warn('[Mirror Camera] Capture failed:', error);
    }
  };

  const handleToggleRecord = async () => {
    // ─── STOP RECORDING ───
    if (isRecording) {
      if (Platform.OS === 'web') {
        const mr = webMediaRecorderRef.current as { state: string; stop: () => void } | null;
        if (mr && mr.state !== 'inactive') {
          mr.stop();
        }
        setIsRecording(false);
        return;
      }

      if (cameraRef.current) {
        try {
          cameraRef.current.stopRecording();
        } catch (error) {
          if (__DEV__) console.warn('[Mirror Camera] Stop recording failed:', error);
        }
      }
      return;
    }

    // ─── START RECORDING ───
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          webStreamRef.current = stream;
          webVideoChunksRef.current = [];

          // @ts-ignore Web MediaRecorder
          const mediaRecorder = new MediaRecorder(stream);
          webMediaRecorderRef.current = mediaRecorder;

          mediaRecorder.ondataavailable = (event: { data: Blob }) => {
            if (event.data.size > 0) {
              webVideoChunksRef.current.push(event.data);
            }
          };

          mediaRecorder.onstop = () => {
            const blob = new Blob(webVideoChunksRef.current, { type: 'video/mp4' });
            const url = URL.createObjectURL(blob);
            setCaptured({ type: 'video', uri: url });
            if (webStreamRef.current) {
              webStreamRef.current.getTracks().forEach((t) => t.stop());
              webStreamRef.current = null;
            }
          };

          mediaRecorder.start(100);
          setRecordSeconds(0);
          setIsRecording(true);
          return;
        } catch (webErr) {
          if (__DEV__) console.warn('[Mirror Camera] Web recording fallback:', webErr);
          setCaptured({
            type: 'video',
            uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          });
          return;
        }
      } else {
        setCaptured({
          type: 'video',
          uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        });
        return;
      }
    }

    // Native mobile recording
    if (!cameraRef.current) return;

    try {
      let micGranted = microphonePermission?.granted;
      if (!micGranted) {
        const result = await requestMicrophonePermission();
        micGranted = result?.granted;
      }

      if (!micGranted) {
        Alert.alert(
          'Microphone Permission',
          'Microphone access is needed to record video moments. Please enable it in device settings.',
        );
        return;
      }

      setRecordSeconds(0);
      setIsRecording(true);

      cameraRef.current
        .recordAsync({ maxDuration: 60 })
        .then((video) => {
          if (video?.uri) {
            setCaptured({ type: 'video', uri: video.uri });
          }
          setIsRecording(false);
        })
        .catch((error) => {
          if (__DEV__) console.warn('[Mirror Camera] recordAsync error:', error);
          setIsRecording(false);
        });
    } catch (error) {
      if (__DEV__) console.warn('[Mirror Camera] Failed to initiate recording:', error);
      setIsRecording(false);
    }
  };

  const handleRetake = async () => {
    if (captured?.uri) {
      try {
        if (Platform.OS !== 'web') {
          const info = await FileSystem.getInfoAsync(captured.uri);
          if (info.exists) {
            await FileSystem.deleteAsync(captured.uri, { idempotent: true });
          }
        }
      } catch {
        // Ignore cleanup errors
      }
    }
    setCaptured(null);
  };

  const handleSave = async () => {
    if (!captured || saving) return;
    setSaving(true);
    try {
      await addMirrorEntry({
        type: captured.type,
        uri: captured.uri,
        mood: todayMood?.mood ?? null,
      });
      setCaptured(null);
      router.replace('/mirror/gallery');
    } catch (error) {
      if (__DEV__) console.warn('[Mirror Camera] Save failed:', error);
      setSaving(false);
    }
  };

  // Helper formatting for timer
  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // ─── 1. PREVIEW SCREEN ─────────────────────────────────
  if (captured) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />

        {/* Media Display */}
        <View style={styles.previewWrap}>
          {captured.type === 'photo' ? (
            <Image
              source={{ uri: captured.uri }}
              style={styles.previewMedia}
              resizeMode="cover"
            />
          ) : (
            <Video
              source={{ uri: captured.uri }}
              style={styles.previewMedia}
              resizeMode={ResizeMode.COVER}
              isLooping
              shouldPlay
              useNativeControls={false}
            />
          )}

          {/* Top subtle bar */}
          <View style={[styles.previewTopBar, { paddingTop: Math.max(insets.top, 20) + 8 }]}>
            <Pressable
              onPress={handleRetake}
              style={({ pressed }) => [styles.glassBtn, pressed && styles.pressed]}
              accessibilityLabel="Retake"
            >
              <Ionicons name="close" size={22} color={colors.white} />
            </Pressable>
            <View style={styles.previewTag}>
              <AppText style={styles.previewTagText}>
                {captured.type === 'photo' ? 'PHOTO MOMENT' : 'VIDEO MOMENT'}
              </AppText>
            </View>
          </View>
        </View>

        {/* Bottom Actions */}
        <View style={[styles.previewBottomBar, { paddingBottom: Math.max(insets.bottom, 20) + 12 }]}>
          <Pressable
            onPress={handleRetake}
            disabled={saving}
            style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Retake"
          >
            <AppText style={styles.secondaryBtnText}>Retake</AppText>
          </Pressable>

          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={({ pressed }) => [
              styles.primaryBtn,
              pressed && styles.pressed,
              saving && styles.btnDisabled,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Save to My Mirror"
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <AppText style={styles.primaryBtnText}>Save to My Mirror</AppText>
            )}
          </Pressable>
        </View>
      </View>
    );
  }

  // ─── 2. PERMISSION DENIED OR NOT GRANTED ───────────────
  if (!cameraPermission?.granted && Platform.OS !== 'web') {
    return (
      <View style={[styles.container, styles.permissionContainer]}>
        <StatusBar style="light" />

        {/* Top bar with back button */}
        <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 20) + 8 }]}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.glassBtn, pressed && styles.pressed]}
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={22} color={colors.white} />
          </Pressable>
        </View>

        <View style={styles.permissionCard}>
          <View style={styles.permissionIconCircle}>
            <Ionicons name="camera-outline" size={32} color={colors.accent} />
          </View>
          <AppText style={styles.permissionTitle}>Camera Access</AppText>
          <AppText style={styles.permissionText}>
            Camera access is needed to capture your private moment. Your photos and videos always stay safely on your device.
          </AppText>

          <Pressable
            onPress={async () => {
              await requestCameraPermission();
            }}
            style={({ pressed }) => [styles.permissionBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Allow camera access"
          >
            <AppText style={styles.permissionBtnText}>Allow Camera Access</AppText>
          </Pressable>
        </View>
      </View>
    );
  }

  // ─── 3. LIVE CAMERA VIEW ───────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Full screen Camera */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        mode={mode === 'video' ? 'video' : 'picture'}
      />

      {/* Top Controls Overlay */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 20) + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.glassBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Close camera"
        >
          <Ionicons name="chevron-back" size={22} color={colors.white} />
        </Pressable>

        {isRecording && (
          <View style={styles.recordingTimerWrap}>
            <Animated.View style={[styles.recordingDot, { opacity: pulseAnim }]} />
            <AppText style={styles.recordingTimerText}>
              {formatTime(recordSeconds)}
            </AppText>
          </View>
        )}

        <Pressable
          onPress={toggleFacing}
          style={({ pressed }) => [styles.glassBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Switch camera"
        >
          <Ionicons name="camera-reverse-outline" size={22} color={colors.white} />
        </Pressable>
      </View>

      {/* Bottom Controls Overlay */}
      <View style={[styles.bottomControls, { paddingBottom: Math.max(insets.bottom, 20) + 12 }]}>
        {/* Mode Selector Pill */}
        {!isRecording && (
          <View style={styles.modePill}>
            <Pressable
              onPress={() => setMode('photo')}
              style={[styles.modeTab, mode === 'photo' && styles.modeTabActive]}
            >
              <AppText
                style={[
                  styles.modeTabText,
                  mode === 'photo' && styles.modeTabTextActive,
                ]}
              >
                PHOTO
              </AppText>
            </Pressable>
            <Pressable
              onPress={() => setMode('video')}
              style={[styles.modeTab, mode === 'video' && styles.modeTabActive]}
            >
              <AppText
                style={[
                  styles.modeTabText,
                  mode === 'video' && styles.modeTabTextActive,
                ]}
              >
                VIDEO
              </AppText>
            </Pressable>
          </View>
        )}

        {/* Shutter Button */}
        <View style={styles.shutterRow}>
          {mode === 'photo' ? (
            <Pressable
              onPress={handleCapturePhoto}
              style={({ pressed }) => [styles.shutterOuter, pressed && styles.shutterPressed]}
              accessibilityRole="button"
              accessibilityLabel="Take Photo"
            >
              <View style={styles.shutterPhotoInner} />
            </Pressable>
          ) : (
            <Pressable
              onPress={handleToggleRecord}
              style={({ pressed }) => [
                styles.shutterOuter,
                styles.shutterVideoOuter,
                pressed && styles.shutterPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={isRecording ? 'Stop Recording' : 'Start Recording'}
            >
              <View
                style={[
                  styles.shutterVideoInner,
                  isRecording && styles.shutterVideoRecordingInner,
                ]}
              />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#161311',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    zIndex: 20,
  },
  glassBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(30, 24, 22, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingTimerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(192, 96, 80, 0.85)',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.white,
  },
  recordingTimerText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.white,
    letterSpacing: 1,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
  },
  modePill: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30, 24, 22, 0.65)',
    borderRadius: radii.pill,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginBottom: spacing.xl,
  },
  modeTab: {
    paddingHorizontal: spacing.md + 4,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  modeTabActive: {
    backgroundColor: colors.surfaceWarm,
  },
  modeTabText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 1.5,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  modeTabTextActive: {
    color: colors.textPrimary,
  },
  shutterRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  shutterOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  shutterVideoOuter: {
    borderColor: 'rgba(240, 100, 90, 0.9)',
  },
  shutterPhotoInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.white,
  },
  shutterVideoInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#E04838',
  },
  shutterVideoRecordingInner: {
    width: 30,
    height: 30,
    borderRadius: 6,
  },
  shutterPressed: {
    transform: [{ scale: 0.94 }],
    opacity: 0.9,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },

  // Preview Mode
  previewWrap: {
    flex: 1,
    width: '100%',
    backgroundColor: '#0E0C0B',
    position: 'relative',
  },
  previewMedia: {
    width: '100%',
    height: '100%',
  },
  previewTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    zIndex: 30,
  },
  previewTag: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  previewTagText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    letterSpacing: 1.5,
    color: colors.white,
  },
  previewBottomBar: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
  },
  secondaryBtn: {
    flex: 1,
    height: 52,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceWarm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  secondaryBtnText: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.textPrimary,
  },
  primaryBtn: {
    flex: 2,
    height: 52,
    borderRadius: radii.md,
    backgroundColor: colors.selected,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  primaryBtnText: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.white,
  },
  btnDisabled: {
    opacity: 0.6,
  },

  // Permission UI
  permissionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  permissionCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    ...shadows.soft,
  },
  permissionIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surfaceRose,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  permissionTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 22,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  permissionBtn: {
    width: '100%',
    height: 50,
    borderRadius: radii.md,
    backgroundColor: colors.selected,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionBtnText: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.white,
  },
});
