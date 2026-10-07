/**
 * Soft Talk · live voice conversation with Gemini (browser).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { Screen } from '@/components/Screen';
import {
  createGeminiPcmPlayer,
  startGeminiMicCapture,
  type GeminiMicCapture,
  type GeminiPcmPlayer,
} from '@/lib/geminiAudio';
import {
  GeminiLiveSession,
  hasGeminiApiKey,
  isGeminiLiveSupported,
  type GeminiLiveStatus,
} from '@/lib/geminiLive';
import { useMusicPlayer } from '@/lib/MusicPlayerProvider';
import { fonts, radii, spacing } from '@/lib/theme';

type Line = { id: string; role: 'you' | 'companion'; text: string };

function statusLabel(status: GeminiLiveStatus): string {
  switch (status) {
    case 'connecting':
      return 'Connecting…';
    case 'ready':
    case 'listening':
      return 'Listening — speak when you’re ready';
    case 'speaking':
      return 'Companion is speaking';
    case 'error':
      return 'Something went quiet';
    case 'ended':
      return 'Conversation ended';
    default:
      return 'Ready when you are';
  }
}

export default function SoftTalkLiveScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { stop: stopMusic } = useMusicPlayer();

  const [status, setStatus] = useState<GeminiLiveStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [lines, setLines] = useState<Line[]>([]);
  const [supported] = useState(() => isGeminiLiveSupported());

  const sessionRef = useRef<GeminiLiveSession | null>(null);
  const micRef = useRef<GeminiMicCapture | null>(null);
  const playerRef = useRef<GeminiPcmPlayer | null>(null);
  const inputBuf = useRef('');
  const outputBuf = useRef('');

  const appendLine = useCallback((role: 'you' | 'companion', text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setLines((prev) => [
      ...prev,
      { id: `${role}-${Date.now()}-${prev.length}`, role, text: trimmed },
    ]);
  }, []);

  const endSession = useCallback(() => {
    micRef.current?.stop();
    micRef.current = null;
    playerRef.current?.close();
    playerRef.current = null;
    sessionRef.current?.close();
    sessionRef.current = null;
    setStatus('ended');
  }, []);

  const startSession = useCallback(async () => {
    setError(null);
    setLines([]);
    inputBuf.current = '';
    outputBuf.current = '';

    if (!supported) {
      setError(
        'Live voice works in the browser right now. Open Me Time on web to talk with Gemini.',
      );
      setStatus('error');
      return;
    }

    if (!(await hasGeminiApiKey())) {
      setError(
        'Add a Gemini API key in Settings → Soft Talk companion (or EXPO_PUBLIC_GEMINI_API_KEY in .env).',
      );
      setStatus('error');
      return;
    }

    try {
      await stopMusic().catch(() => {});
    } catch {
      // ignore
    }

    try {
      playerRef.current = createGeminiPcmPlayer();
      const session = new GeminiLiveSession({
        onStatus: setStatus,
        onError: (message) => {
          setError(message);
          setStatus('error');
        },
        onInterrupted: () => {
          playerRef.current?.clear();
        },
        onAudioPcm24k: (pcm) => {
          playerRef.current?.enqueue(pcm);
        },
        onInputTranscript: (text, finished) => {
          inputBuf.current = text;
          if (finished) {
            appendLine('you', inputBuf.current);
            inputBuf.current = '';
          }
        },
        onOutputTranscript: (text, finished) => {
          outputBuf.current = text;
          if (finished) {
            appendLine('companion', outputBuf.current);
            outputBuf.current = '';
          }
        },
      });
      sessionRef.current = session;
      await session.connect();

      micRef.current = await startGeminiMicCapture({
        onPcm16k: (pcm) => session.sendPcm16k(pcm),
        onError: (message) => setError(message),
      });
      setStatus('listening');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Couldn’t start the conversation.';
      setError(message);
      setStatus('error');
      endSession();
    }
  }, [appendLine, endSession, stopMusic, supported]);

  useEffect(() => {
    return () => {
      endSession();
    };
  }, [endSession]);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    micRef.current?.setMuted(next);
  };

  const inactive = status === 'idle' || status === 'error' || status === 'ended';

  return (
    <Screen scroll={false} edges={['left', 'right']} style={styles.darkRoot} padded={false}>
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable
          onPress={() => {
            endSession();
            router.back();
          }}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Leave conversation"
        >
          <Ionicons name="chevron-back" size={20} color="#F6F1EA" />
        </Pressable>
        <AppText style={styles.topTitle}>Talk with Me</AppText>
        <View style={styles.iconBtn} />
      </View>

      <View style={styles.statusBlock}>
        {status === 'connecting' && (
          <ActivityIndicator color="#C08B7A" style={{ marginBottom: spacing.sm }} />
        )}
        <View style={styles.pulseWrap}>
          <View
            style={[
              styles.pulse,
              status === 'speaking' && styles.pulseSpeaking,
              status === 'listening' && styles.pulseListening,
            ]}
          >
            <Ionicons
              name={status === 'speaking' ? 'volume-high-outline' : 'mic-outline'}
              size={28}
              color="#F6F1EA"
            />
          </View>
        </View>
        <AppText style={styles.statusText}>{statusLabel(status)}</AppText>
        {!!error && <AppText style={styles.errorText}>{error}</AppText>}
        {Platform.OS !== 'web' && (
          <AppText style={styles.hint}>
            Tip: use the browser build for full voice-to-voice.
          </AppText>
        )}
      </View>

      <ScrollView
        style={styles.transcript}
        contentContainerStyle={styles.transcriptContent}
      >
        {lines.length === 0 ? (
          <AppText style={styles.emptyTranscript}>
            Your words and replies will appear here softly as you talk.
          </AppText>
        ) : (
          lines.map((line) => (
            <View
              key={line.id}
              style={[
                styles.bubble,
                line.role === 'you' ? styles.bubbleYou : styles.bubbleThem,
              ]}
            >
              <AppText style={styles.bubbleRole}>
                {line.role === 'you' ? 'You' : 'Companion'}
              </AppText>
              <AppText style={styles.bubbleText}>{line.text}</AppText>
            </View>
          ))
        )}
      </ScrollView>

      <View style={[styles.controls, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {inactive ? (
          <>
            <Pressable
              onPress={() => {
                void startSession();
              }}
              style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
            >
              <AppText style={styles.primaryBtnText}>
                {status === 'idle' ? 'Start talking' : 'Try again'}
              </AppText>
            </Pressable>
            <Pressable
              onPress={() => router.push('/(tabs)/settings')}
              style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
            >
              <AppText style={styles.secondaryBtnText}>Open Settings</AppText>
            </Pressable>
          </>
        ) : (
          <>
            <Pressable
              onPress={toggleMute}
              style={({ pressed }) => [styles.roundBtn, pressed && styles.pressed]}
              accessibilityLabel={muted ? 'Unmute microphone' : 'Mute microphone'}
            >
              <Ionicons
                name={muted ? 'mic-off-outline' : 'mic-outline'}
                size={22}
                color="#F6F1EA"
              />
            </Pressable>
            <Pressable
              onPress={() => {
                endSession();
                router.back();
              }}
              style={({ pressed }) => [styles.endBtn, pressed && styles.pressed]}
              accessibilityLabel="End conversation"
            >
              <Ionicons name="call" size={22} color="#F6F1EA" />
              <AppText style={styles.endBtnText}>End</AppText>
            </Pressable>
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  darkRoot: {
    flex: 1,
    backgroundColor: '#181412',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: '#F6F1EA',
  },
  statusBlock: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  pulseWrap: {
    marginBottom: spacing.md,
  },
  pulse: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(192,139,122,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseListening: {
    backgroundColor: 'rgba(192,139,122,0.45)',
  },
  pulseSpeaking: {
    backgroundColor: 'rgba(143,101,88,0.7)',
  },
  statusText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: '#E8DFD6',
    textAlign: 'center',
  },
  errorText: {
    marginTop: spacing.sm,
    fontFamily: fonts.body,
    fontSize: 14,
    color: '#E8B4A8',
    textAlign: 'center',
    lineHeight: 20,
  },
  hint: {
    marginTop: spacing.sm,
    fontFamily: fonts.body,
    fontSize: 13,
    color: 'rgba(246,241,234,0.55)',
    textAlign: 'center',
  },
  transcript: {
    flex: 1,
    marginTop: spacing.lg,
  },
  transcriptContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  emptyTranscript: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: 'rgba(246,241,234,0.45)',
    textAlign: 'center',
    marginTop: spacing.xl,
    lineHeight: 20,
  },
  bubble: {
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  bubbleYou: {
    backgroundColor: 'rgba(246,241,234,0.08)',
    alignSelf: 'flex-end',
    maxWidth: '88%',
  },
  bubbleThem: {
    backgroundColor: 'rgba(192,139,122,0.18)',
    alignSelf: 'flex-start',
    maxWidth: '88%',
  },
  bubbleRole: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: 'rgba(246,241,234,0.5)',
    marginBottom: 4,
  },
  bubbleText: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: '#F6F1EA',
    lineHeight: 22,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  roundBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(246,241,234,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  endBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#8F6558',
    paddingHorizontal: 22,
    height: 56,
    borderRadius: 28,
  },
  endBtnText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    color: '#F6F1EA',
  },
  primaryBtn: {
    backgroundColor: '#C08B7A',
    paddingHorizontal: 22,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: '#181412',
  },
  secondaryBtn: {
    paddingHorizontal: 16,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: '#E8DFD6',
    textDecorationLine: 'underline',
  },
  pressed: { opacity: 0.85 },
});
