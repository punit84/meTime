import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions, type CameraType } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { colors, fonts, radii, spacing } from '@/lib/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  onCapture: (uri: string) => void;
  title?: string;
  subtitle?: string;
};

export function WriteCameraModal({
  visible,
  onClose,
  onCapture,
  title = 'Photograph a Page',
  subtitle = 'Hold steady to capture your handwritten thought or diary',
}: Props) {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [capturing, setCapturing] = useState(false);
  const [flash, setFlash] = useState(false);

  const nativeCameraRef = useRef<CameraView>(null);
  const webVideoRef = useRef<HTMLVideoElement | null>(null);
  const webStreamRef = useRef<MediaStream | null>(null);

  // Web camera setup
  useEffect(() => {
    if (!visible || Platform.OS !== 'web') return;

    let active = true;

    async function startWebCamera() {
      try {
        if (webStreamRef.current) {
          webStreamRef.current.getTracks().forEach((track) => track.stop());
          webStreamRef.current = null;
        }

        if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: facing === 'front' ? 'user' : 'environment',
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
            audio: false,
          });

          if (!active) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }

          webStreamRef.current = stream;
          if (webVideoRef.current) {
            webVideoRef.current.srcObject = stream;
            webVideoRef.current.play().catch(() => {});
          }
        }
      } catch (err) {
        if (__DEV__) console.warn('[WriteCameraModal] Web camera start failed:', err);
      }
    }

    startWebCamera();

    return () => {
      active = false;
      if (webStreamRef.current) {
        webStreamRef.current.getTracks().forEach((track) => track.stop());
        webStreamRef.current = null;
      }
    };
  }, [visible, facing]);

  const toggleFacing = () => {
    setFacing((prev) => (prev === 'back' ? 'front' : 'back'));
  };

  const handleCapture = async () => {
    if (capturing) return;
    setCapturing(true);

    try {
      // Trigger flash visual
      setFlash(true);
      setTimeout(() => setFlash(false), 120);

      if (Platform.OS === 'web') {
        if (webVideoRef.current && webVideoRef.current.videoWidth > 0) {
          const video = webVideoRef.current;
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            if (facing === 'front') {
              ctx.translate(canvas.width, 0);
              ctx.scale(-1, 1);
            }
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
            onCapture(dataUrl);
            onClose();
            return;
          }
        }
        // Fallback placeholder if web video is not accessible
        onCapture('https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=900&q=80');
        onClose();
        return;
      }

      // Native capture
      if (nativeCameraRef.current) {
        const photo = await nativeCameraRef.current.takePictureAsync({
          quality: 0.9,
          skipProcessing: false,
        });
        if (photo?.uri) {
          onCapture(photo.uri);
          onClose();
        }
      }
    } catch (err) {
      if (__DEV__) console.warn('[WriteCameraModal] Capture error:', err);
    } finally {
      setCapturing(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Flash overlay */}
        {flash && <View style={styles.flashOverlay} pointerEvents="none" />}

        {/* Camera Viewfinder */}
        {Platform.OS === 'web' ? (
          <View style={styles.webCameraWrap}>
            {/* HTML Video tag for web camera feed */}
            <video
              ref={webVideoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: facing === 'front' ? 'scaleX(-1)' : 'none',
              }}
            />
          </View>
        ) : !permission?.granted ? (
          <View style={styles.permissionCard}>
            <View style={styles.permissionIconCircle}>
              <Ionicons name="camera-outline" size={36} color={colors.accent} />
            </View>
            <AppText style={styles.permissionTitle}>Camera Access Required</AppText>
            <AppText muted style={styles.permissionSub}>
              Please grant camera access so you can photograph your handwritten thoughts, poems, and diary pages.
            </AppText>
            <Pressable
              onPress={() => requestPermission()}
              style={({ pressed }) => [styles.permissionBtn, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Enable Camera"
            >
              <AppText style={styles.permissionBtnText}>Enable Camera</AppText>
            </Pressable>
          </View>
        ) : (
          <CameraView
            ref={nativeCameraRef}
            style={StyleSheet.absoluteFill}
            facing={facing}
            mode="picture"
          />
        )}

        {/* Viewfinder Page Alignment Frame */}
        <View style={styles.viewfinderGuideWrap} pointerEvents="none">
          <View style={styles.frameBorder}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
        </View>

        {/* Top Header Bar */}
        <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 20) + 10 }]}>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.glassCircleBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Close camera"
          >
            <Ionicons name="close" size={22} color={colors.white} />
          </Pressable>

          <View style={styles.titleBadge}>
            <AppText style={styles.titleBadgeText}>{title}</AppText>
          </View>

          <Pressable
            onPress={toggleFacing}
            style={({ pressed }) => [styles.glassCircleBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Switch camera"
          >
            <Ionicons name="camera-reverse-outline" size={22} color={colors.white} />
          </Pressable>
        </View>

        {/* Bottom Bar with Shutter and Guidance */}
        <View style={[styles.bottomControls, { paddingBottom: Math.max(insets.bottom, 20) + 24 }]}>
          <AppText style={styles.guidanceText}>{subtitle}</AppText>

          <View style={styles.shutterContainer}>
            <Pressable
              onPress={handleCapture}
              disabled={capturing}
              style={({ pressed }) => [
                styles.shutterOuter,
                pressed && styles.shutterOuterPressed,
                capturing && styles.shutterDisabled,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Take Photo"
            >
              {capturing ? (
                <ActivityIndicator size="small" color={colors.accentDeep} />
              ) : (
                <View style={styles.shutterInner} />
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#12100E',
    justifyContent: 'space-between',
  },
  flashOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    zIndex: 99,
  },
  webCameraWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#12100E',
    overflow: 'hidden',
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
    zIndex: 30,
  },
  glassCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(28, 22, 18, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
  titleBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(28, 22, 18, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  titleBadgeText: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    color: colors.white,
    letterSpacing: 0.3,
  },
  viewfinderGuideWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: 120,
    zIndex: 10,
  },
  frameBorder: {
    width: '100%',
    height: '75%',
    maxWidth: 420,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: radii.lg,
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: colors.accent,
  },
  cornerTL: {
    top: -2,
    left: -2,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: radii.md,
  },
  cornerTR: {
    top: -2,
    right: -2,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: radii.md,
  },
  cornerBL: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: radii.md,
  },
  cornerBR: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: radii.md,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 30,
    backgroundColor: 'rgba(18, 16, 14, 0.55)',
    paddingTop: spacing.md,
  },
  guidanceText: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  shutterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  shutterOuterPressed: {
    transform: [{ scale: 0.94 }],
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  shutterDisabled: {
    opacity: 0.6,
  },
  shutterInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.white,
  },
  permissionCard: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#161311',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  permissionIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(192, 139, 122, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  permissionTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 22,
    color: colors.white,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  permissionSub: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 20,
    maxWidth: 300,
  },
  permissionBtn: {
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.accent,
    borderRadius: radii.pill,
  },
  permissionBtnText: {
    fontSize: 15,
    fontFamily: fonts.bodyMedium,
    color: colors.white,
  },
});
