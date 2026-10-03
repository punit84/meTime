import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  ImageBackground,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { AppText } from '@/components/AppText';
import { Screen } from '@/components/Screen';
import { useApp } from '@/lib/AppProvider';
import { images } from '@/lib/images';
import { colors, fonts, radii, shadows, spacing } from '@/lib/theme';

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function SoftTalkScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { todayMood, addVoiceEntry } = useApp();

  // Screen modes: 'idle' | 'recording' | 'preview'
  const [screenMode, setScreenMode] = useState<'idle' | 'recording' | 'preview'>('idle');

  // Native recording ref / state
  const recordingRef = useRef<Audio.Recording | null>(null);
  // Web recording ref
  const mediaRecorderRef = useRef<unknown>(null);
  const webAudioChunksRef = useRef<Blob[]>([]);
  const webStreamRef = useRef<MediaStream | null>(null);

  const [isPaused, setIsPaused] = useState(false);
  const [recordMs, setRecordMs] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const accumulatedMsRef = useRef<number>(0);

  // Preview state
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [previewDurationMs, setPreviewDurationMs] = useState(0);
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosMs, setPlaybackPosMs] = useState(0);
  const [saving, setSaving] = useState(false);

  // Pulsing animation for active recording
  const [pulseAnim] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (screenMode === 'recording' && !isPaused) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.35,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [screenMode, isPaused, pulseAnim]);

  // Clean up sounds and streams on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }
      if (webStreamRef.current) {
        webStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // ─── START RECORDING FLOW ──────────────────────────────
  const handleStartRecording = async () => {
    try {
      accumulatedMsRef.current = 0;
      setRecordMs(0);
      setIsPaused(false);

      if (Platform.OS === 'web') {
        // Modern Web Audio recording
        if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            webStreamRef.current = stream;
            webAudioChunksRef.current = [];

            // @ts-ignore Web MediaRecorder
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event: { data: Blob }) => {
              if (event.data.size > 0) {
                webAudioChunksRef.current.push(event.data);
              }
            };

            mediaRecorder.onstop = () => {
              const blob = new Blob(webAudioChunksRef.current, { type: 'audio/webm' });
              const url = URL.createObjectURL(blob);
              setPreviewUri(url);
              setPreviewDurationMs(accumulatedMsRef.current || 2000);
              setScreenMode('preview');
              if (webStreamRef.current) {
                webStreamRef.current.getTracks().forEach((t) => t.stop());
                webStreamRef.current = null;
              }
            };

            mediaRecorder.start(100);
            startTimeRef.current = Date.now();
            setScreenMode('recording');

            timerRef.current = setInterval(() => {
              const now = Date.now();
              const current = accumulatedMsRef.current + (now - startTimeRef.current);
              setRecordMs(current);
            }, 200);

            return;
          } catch (webErr) {
            if (__DEV__) console.warn('[SoftTalk] Web getUserMedia error:', webErr);
            // Fallback for blocked mic permissions on web
            setPreviewUri('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
            setPreviewDurationMs(45000);
            setScreenMode('preview');
            return;
          }
        } else {
          // Web fallback
          setPreviewUri('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
          setPreviewDurationMs(45000);
          setScreenMode('preview');
          return;
        }
      }

      // Native mobile recording
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Microphone Access Needed',
          'To record your private voice note, Me Time needs microphone access. You can grant this in device settings.',
        );
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        (status) => {
          if (status.isRecording) {
            setRecordMs(status.durationMillis);
          }
        },
        100,
      );

      recordingRef.current = newRecording;
      setScreenMode('recording');
    } catch (error) {
      if (__DEV__) console.warn('[SoftTalk] Failed to start recording:', error);
      Alert.alert('Recording Unavailable', 'Could not access the microphone. Please try again.');
    }
  };

  const handlePauseResume = async () => {
    try {
      if (Platform.OS === 'web') {
        const mr = mediaRecorderRef.current as { state: string; pause: () => void; resume: () => void } | null;
        if (!mr) return;

        if (isPaused) {
          mr.resume();
          startTimeRef.current = Date.now();
          setIsPaused(false);
          timerRef.current = setInterval(() => {
            const now = Date.now();
            const current = accumulatedMsRef.current + (now - startTimeRef.current);
            setRecordMs(current);
          }, 200);
        } else {
          mr.pause();
          accumulatedMsRef.current += Date.now() - startTimeRef.current;
          if (timerRef.current) clearInterval(timerRef.current);
          setIsPaused(true);
        }
        return;
      }

      if (!recordingRef.current) return;
      if (isPaused) {
        await recordingRef.current.startAsync();
        setIsPaused(false);
      } else {
        await recordingRef.current.pauseAsync();
        setIsPaused(true);
      }
    } catch (error) {
      if (__DEV__) console.warn('[SoftTalk] Pause/resume failed:', error);
    }
  };

  const handleStopRecording = async () => {
    try {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (Platform.OS === 'web') {
        if (!isPaused) {
          accumulatedMsRef.current += Date.now() - startTimeRef.current;
        }
        const mr = mediaRecorderRef.current as { state: string; stop: () => void } | null;
        if (mr && mr.state !== 'inactive') {
          mr.stop();
        }
        return;
      }

      if (!recordingRef.current) {
        setScreenMode('idle');
        return;
      }

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      const status = await recordingRef.current.getStatusAsync();
      const finalDuration = status.durationMillis || recordMs || 1500;

      recordingRef.current = null;
      if (uri) {
        setPreviewUri(uri);
        setPreviewDurationMs(finalDuration);
        setScreenMode('preview');
      } else {
        setScreenMode('idle');
      }
    } catch (error) {
      if (__DEV__) console.warn('[SoftTalk] Stop recording failed:', error);
      setScreenMode('idle');
    }
  };

  const handleDiscardRecording = async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch {}
      soundRef.current = null;
    }

    if (previewUri && Platform.OS !== 'web') {
      try {
        const info = await FileSystem.getInfoAsync(previewUri);
        if (info.exists) {
          await FileSystem.deleteAsync(previewUri, { idempotent: true });
        }
      } catch {}
    }

    setPreviewUri(null);
    setIsPlaying(false);
    setPlaybackPosMs(0);
    setScreenMode('idle');
  };

  const handleTogglePreviewPlay = async () => {
    if (!previewUri) return;

    if (soundRef.current) {
      if (isPlaying) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        await soundRef.current.playAsync();
        setIsPlaying(true);
      }
    } else {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
        });

        const { sound } = await Audio.Sound.createAsync(
          { uri: previewUri },
          { shouldPlay: true },
          (status) => {
            if (status.isLoaded) {
              setPlaybackPosMs(status.positionMillis);
              setIsPlaying(status.isPlaying);
              if (status.didJustFinish) {
                setIsPlaying(false);
                setPlaybackPosMs(0);
              }
            }
          },
        );
        soundRef.current = sound;
        setIsPlaying(true);
      } catch (error) {
        if (__DEV__) console.warn('[SoftTalk] Preview play failed:', error);
      }
    }
  };

  const handleSaveVoiceNote = async () => {
    if (!previewUri || saving) return;
    setSaving(true);
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      await addVoiceEntry({
        uri: previewUri,
        durationMs: previewDurationMs,
        mood: todayMood?.mood ?? null,
      });

      setPreviewUri(null);
      setScreenMode('idle');
      router.push('/soft-talk/voice');
    } catch (error) {
      if (__DEV__) console.warn('[SoftTalk] Save voice note failed:', error);
      Alert.alert('Save Failed', 'Could not save your voice note. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const topInsetPadding = Math.max(insets.top, 20) + 8;

  // ─── 1. RECORDING SCREEN VIEW ──────────────────────────
  if (screenMode === 'recording') {
    return (
      <View style={styles.recordRoot}>
        <View style={[styles.recordTopBar, { paddingTop: topInsetPadding }]}>
          <Pressable
            onPress={handleDiscardRecording}
            style={({ pressed }) => [styles.glassBtn, pressed && styles.pressed]}
          >
            <Ionicons name="close" size={20} color={colors.white} />
          </Pressable>
          <View style={styles.recordTag}>
            <AppText style={styles.recordTagText}>PRIVATE VOICE NOTE</AppText>
          </View>
        </View>

        <View style={styles.recordCenter}>
          <Animated.View
            style={[
              styles.pulseCircle,
              { opacity: pulseAnim, transform: [{ scale: isPaused ? 1 : 1.05 }] },
            ]}
          >
            <View style={styles.micCircle}>
              <Ionicons
                name={isPaused ? 'pause' : 'mic'}
                size={36}
                color={colors.white}
              />
            </View>
          </Animated.View>

          <AppText style={styles.recordStatusText}>
            {isPaused ? 'Recording Paused' : 'Listening softly…'}
          </AppText>
          <AppText style={styles.recordTimer}>{formatDuration(recordMs)}</AppText>
          <AppText muted style={styles.recordHint}>
            Take your time. There’s no rush.
          </AppText>
        </View>

        <View style={[styles.recordBottomBar, { paddingBottom: Math.max(insets.bottom, 20) + 16 }]}>
          <Pressable
            onPress={handlePauseResume}
            style={({ pressed }) => [styles.controlBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={isPaused ? 'Resume recording' : 'Pause recording'}
          >
            <Ionicons
              name={isPaused ? 'play' : 'pause'}
              size={22}
              color={colors.textPrimary}
            />
            <AppText style={styles.controlBtnText}>
              {isPaused ? 'Resume' : 'Pause'}
            </AppText>
          </Pressable>

          <Pressable
            onPress={handleStopRecording}
            style={({ pressed }) => [styles.stopBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Stop and review recording"
          >
            <Ionicons name="stop" size={24} color={colors.white} />
            <AppText style={styles.stopBtnText}>Done</AppText>
          </Pressable>
        </View>
      </View>
    );
  }

  // ─── 2. PREVIEW SCREEN VIEW ────────────────────────────
  if (screenMode === 'preview') {
    return (
      <View style={styles.previewRoot}>
        <View style={[styles.recordTopBar, { paddingTop: topInsetPadding }]}>
          <Pressable
            onPress={handleDiscardRecording}
            style={({ pressed }) => [styles.glassBtn, pressed && styles.pressed]}
          >
            <Ionicons name="close" size={20} color={colors.white} />
          </Pressable>
          <View style={styles.recordTag}>
            <AppText style={styles.recordTagText}>REVIEW VOICE NOTE</AppText>
          </View>
        </View>

        <View style={styles.previewCard}>
          <View style={styles.soundWaveIcon}>
            <Ionicons name="musical-notes-outline" size={32} color={colors.accent} />
          </View>

          <AppText style={styles.previewHeading}>Your Private Voice Note</AppText>
          <AppText style={styles.previewDuration}>
            {formatDuration(previewDurationMs)}
          </AppText>

          {/* Audio Player Controls */}
          <Pressable
            onPress={handleTogglePreviewPlay}
            style={({ pressed }) => [styles.playPauseBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? 'Pause preview' : 'Play preview'}
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={28}
              color={colors.white}
            />
          </Pressable>

          <AppText muted style={styles.previewPlaybackPos}>
            {formatDuration(playbackPosMs)} / {formatDuration(previewDurationMs)}
          </AppText>
        </View>

        <View style={[styles.previewActions, { paddingBottom: Math.max(insets.bottom, 20) + 12 }]}>
          <Pressable
            onPress={handleDiscardRecording}
            disabled={saving}
            style={({ pressed }) => [styles.previewSecondaryBtn, pressed && styles.pressed]}
          >
            <AppText style={styles.previewSecondaryBtnText}>Discard</AppText>
          </Pressable>

          <Pressable
            onPress={handleSaveVoiceNote}
            disabled={saving}
            style={({ pressed }) => [styles.previewPrimaryBtn, pressed && styles.pressed]}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <AppText style={styles.previewPrimaryBtnText}>Save to My Voice</AppText>
            )}
          </Pressable>
        </View>
      </View>
    );
  }

  // ─── 3. IDLE LANDING SCREEN ────────────────────────────
  return (
    <Screen padded={false} edges={['left', 'right']}>
      {/* 1. Full-Bleed Hero */}
      <View style={styles.heroWrap}>
        <ImageBackground
          source={images.softTalk.hero}
          style={styles.hero}
          imageStyle={styles.heroImage}
          accessibilityRole="image"
          accessibilityLabel="Soft Talk intimate sanctuary hero"
        >
          {/* Floating Back Button & Tag */}
          <View style={[styles.topBar, { paddingTop: topInsetPadding }]}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
            </Pressable>

            <View style={styles.tagBadge}>
              <AppText style={styles.tagText}>EXPRESSION</AppText>
            </View>
          </View>

          {/* Hero Gradient & Title */}
          <LinearGradient
            colors={[
              'rgba(40,30,25,0.0)',
              'rgba(40,30,25,0.38)',
              'rgba(40,30,25,0.85)',
            ]}
            style={styles.heroGradient}
          />
          <View style={styles.heroContent}>
            <AppText style={styles.heroTitle}>Soft Talk</AppText>
            <AppText style={styles.heroSubtitle}>
              Say whatever you need to say. No one else needs to hear it.
            </AppText>
          </View>
        </ImageBackground>
      </View>

      {/* 2. Overlapping Cream Sheet */}
      <View style={styles.sheet}>
        <View style={styles.handle} />

        {/* Action Rows Container */}
        <View style={styles.actionsContainer}>
          {/* Action 1: Start Recording */}
          <Pressable
            onPress={handleStartRecording}
            style={({ pressed }) => [styles.actionRow, styles.actionDivider, pressed && styles.actionPressed]}
            accessibilityRole="button"
            accessibilityLabel="Start Recording. Speak freely and privately."
          >
            <View style={[styles.actionIconPill, { backgroundColor: colors.surfacePeach }]}>
              <Ionicons name="mic-outline" size={17} color={colors.icon} />
            </View>
            <View style={styles.actionCopy}>
              <AppText style={styles.actionTitle}>Start Recording</AppText>
              <AppText muted style={styles.actionSub}>
                Speak freely and privately
              </AppText>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </Pressable>

          {/* Action 2: My Voice */}
          <Pressable
            onPress={() => router.push('/soft-talk/voice')}
            style={({ pressed }) => [styles.actionRow, pressed && styles.actionPressed]}
            accessibilityRole="button"
            accessibilityLabel="My Voice. Your saved thoughts and recordings."
          >
            <View style={[styles.actionIconPill, { backgroundColor: colors.surfaceRose }]}>
              <Ionicons name="headset-outline" size={17} color={colors.icon} />
            </View>
            <View style={styles.actionCopy}>
              <AppText style={styles.actionTitle}>My Voice</AppText>
              <AppText muted style={styles.actionSub}>
                Your saved thoughts and voice notes
              </AppText>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </Pressable>
        </View>

        {/* Reflection Card */}
        <View style={[styles.reflectionCard, { backgroundColor: colors.surfacePeach }]}>
          <Ionicons
            name="leaf-outline"
            size={18}
            color={colors.accentDeep}
            style={styles.reflectionIcon}
          />
          <AppText style={styles.reflectionQuote}>
            “Give your voice room to breathe. No one is listening but you.”
          </AppText>
          <AppText muted style={styles.reflectionSub}>
            A safe, private sanctuary for unfiltered feelings, quiet thoughts, and personal keepsakes.
          </AppText>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroWrap: {
    height: 330,
    backgroundColor: colors.surfaceWarm,
  },
  hero: {
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
  },
  heroImage: {
    resizeMode: 'cover',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    zIndex: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 251, 247, 0.94)',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  tagBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(74, 59, 52, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 251, 247, 0.25)',
  },
  tagText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    letterSpacing: 1.8,
    color: colors.white,
  },
  heroGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 180,
  },
  heroContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl + 14,
    zIndex: 2,
  },
  heroTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 36,
    lineHeight: 40,
    color: colors.white,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 18,
    color: 'rgba(255, 251, 247, 0.92)',
    maxWidth: 280,
  },
  sheet: {
    marginTop: -28,
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  actionsContainer: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: 24,
    ...shadows.soft,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  actionDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  actionPressed: {
    backgroundColor: colors.surfaceWarm,
  },
  actionIconPill: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  actionCopy: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  actionTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  actionSub: {
    fontSize: 12,
    lineHeight: 16,
  },
  reflectionCard: {
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    ...shadows.soft,
  },
  reflectionIcon: {
    marginBottom: spacing.sm,
  },
  reflectionQuote: {
    fontFamily: fonts.display,
    fontSize: 18,
    lineHeight: 24,
    color: colors.textPrimary,
  },
  reflectionSub: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 6,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.97 }],
  },

  // ─── Recording Screen Styles ───────────────────────────
  recordRoot: {
    flex: 1,
    backgroundColor: '#181412',
    justifyContent: 'space-between',
  },
  recordTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    zIndex: 10,
  },
  glassBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  recordTag: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  recordTagText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    letterSpacing: 1.5,
    color: colors.white,
  },
  recordCenter: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  pulseCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(192, 139, 122, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  micCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  recordStatusText: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.white,
    marginBottom: 6,
  },
  recordTimer: {
    fontFamily: fonts.bodySemi,
    fontSize: 38,
    color: colors.white,
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  recordHint: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.65)',
  },
  recordBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  controlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 52,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceWarm,
  },
  controlBtnText: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: colors.textPrimary,
  },
  stopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 52,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.pill,
    backgroundColor: '#C05848',
  },
  stopBtnText: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.white,
  },

  // ─── Preview Screen Styles ─────────────────────────────
  previewRoot: {
    flex: 1,
    backgroundColor: '#181412',
    justifyContent: 'space-between',
  },
  previewCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    borderRadius: radii.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    ...shadows.soft,
  },
  soundWaveIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.surfaceWarm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  previewHeading: {
    fontFamily: fonts.displayBold,
    fontSize: 22,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  previewDuration: {
    fontFamily: fonts.bodySemi,
    fontSize: 28,
    color: colors.accentDeep,
    marginBottom: spacing.lg,
  },
  playPauseBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.selected,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    ...shadows.soft,
  },
  previewPlaybackPos: {
    fontSize: 13,
  },
  previewActions: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
  },
  previewSecondaryBtn: {
    flex: 1,
    height: 52,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceWarm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  previewSecondaryBtnText: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.textPrimary,
  },
  previewPrimaryBtn: {
    flex: 2,
    height: 52,
    borderRadius: radii.md,
    backgroundColor: colors.selected,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  previewPrimaryBtnText: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.white,
  },
});
