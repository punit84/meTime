/**
 * Gemini Live API (voice ↔ voice) over WebSockets.
 * Soft Talk screens call this module; they never open sockets directly.
 *
 * Auth: API key from EXPO_PUBLIC_GEMINI_API_KEY or device Settings storage.
 * Prefer a backend + ephemeral tokens before shipping publicly.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const API_KEY_STORAGE = '@metime/gemini-api-key';
const WS_PATH =
  'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent';

/** Current Live native-audio model from Gemini Live docs. */
export const GEMINI_LIVE_MODEL = 'gemini-3.8-live';

export const GEMINI_SOFT_TALK_INSTRUCTION =
  'You are a warm, gentle companion inside Me Time Soft Talk. ' +
  'Speak briefly and kindly, like a calm friend. ' +
  'Help the user feel heard. Do not judge. ' +
  'Keep replies short enough for spoken conversation. ' +
  'If the user seems distressed, encourage resting, breathing, or reaching a trusted person — you are not a therapist or crisis service.';

export type GeminiLiveStatus =
  | 'idle'
  | 'connecting'
  | 'ready'
  | 'listening'
  | 'speaking'
  | 'error'
  | 'ended';

export type GeminiLiveCallbacks = {
  onStatus?: (status: GeminiLiveStatus) => void;
  onError?: (message: string) => void;
  onInputTranscript?: (text: string, finished: boolean) => void;
  onOutputTranscript?: (text: string, finished: boolean) => void;
  onAudioPcm24k?: (pcm: ArrayBuffer) => void;
  onInterrupted?: () => void;
};

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  if (typeof btoa !== 'function') {
    throw new Error('Base64 encoding isn’t available in this environment.');
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  if (typeof atob !== 'function') {
    throw new Error('Base64 decoding isn’t available in this environment.');
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

export async function getGeminiApiKey(): Promise<string> {
  try {
    const stored = await AsyncStorage.getItem(API_KEY_STORAGE);
    if (stored?.trim()) return stored.trim();
  } catch {
    // ignore
  }
  const fromEnv = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  const fromExtra = Constants.expoConfig?.extra?.geminiApiKey;
  return (
    (typeof fromEnv === 'string' && fromEnv.trim()) ||
    (typeof fromExtra === 'string' && fromExtra.trim()) ||
    ''
  );
}

export async function setGeminiApiKey(key: string): Promise<void> {
  const trimmed = key.trim();
  if (!trimmed) {
    await AsyncStorage.removeItem(API_KEY_STORAGE);
    return;
  }
  await AsyncStorage.setItem(API_KEY_STORAGE, trimmed);
}

export async function hasGeminiApiKey(): Promise<boolean> {
  return !!(await getGeminiApiKey());
}

export function isGeminiLiveSupported(): boolean {
  return Platform.OS === 'web' && typeof WebSocket !== 'undefined';
}

export class GeminiLiveSession {
  private ws: WebSocket | null = null;
  private callbacks: GeminiLiveCallbacks;
  private closed = false;

  constructor(callbacks: GeminiLiveCallbacks = {}) {
    this.callbacks = callbacks;
  }

  async connect(options?: { voiceName?: string }): Promise<void> {
    if (!isGeminiLiveSupported()) {
      throw new Error(
        'Voice conversation works in the browser for now. Open Me Time on web to talk with Gemini.',
      );
    }

    const apiKey = await getGeminiApiKey();
    if (!apiKey) {
      throw new Error(
        'Add a Gemini API key in Settings → Soft Talk companion, or set EXPO_PUBLIC_GEMINI_API_KEY in .env.',
      );
    }

    this.closed = false;
    this.callbacks.onStatus?.('connecting');

    const url = `${WS_PATH}?key=${encodeURIComponent(apiKey)}`;
    const ws = new WebSocket(url);
    this.ws = ws;

    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Couldn’t reach Gemini. Check your connection and API key.'));
      }, 15_000);

      ws.onopen = () => {
        clearTimeout(timer);
        const setup = {
          setup: {
            model: `models/${GEMINI_LIVE_MODEL}`,
            responseModalities: ['AUDIO'],
            systemInstruction: {
              parts: [{ text: GEMINI_SOFT_TALK_INSTRUCTION }],
            },
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: options?.voiceName ?? 'Kore',
                },
              },
            },
            inputAudioTranscription: {},
            outputAudioTranscription: {},
          },
        };
        ws.send(JSON.stringify(setup));
        resolve();
      };

      ws.onerror = () => {
        clearTimeout(timer);
        reject(new Error('Gemini connection failed. Check your API key.'));
      };
    });

    ws.onmessage = (event) => {
      void this.handleMessage(event.data);
    };

    ws.onclose = () => {
      if (!this.closed) {
        this.callbacks.onStatus?.('ended');
      }
      this.ws = null;
    };
  }

  private async handleMessage(raw: unknown): Promise<void> {
    try {
      let text: string;
      if (typeof raw === 'string') {
        text = raw;
      } else if (typeof Blob !== 'undefined' && raw instanceof Blob) {
        text = await raw.text();
      } else if (raw instanceof ArrayBuffer) {
        text = new TextDecoder().decode(raw);
      } else {
        return;
      }

      const message = JSON.parse(text) as Record<string, unknown>;

      if (message.error && typeof message.error === 'object') {
        const err = message.error as { message?: string };
        this.callbacks.onError?.(err.message || 'Gemini returned an error.');
        this.callbacks.onStatus?.('error');
        return;
      }

      if (message.setupComplete !== undefined) {
        this.callbacks.onStatus?.('ready');
        return;
      }

      const serverContent = message.serverContent as
        | {
            interrupted?: boolean;
            turnComplete?: boolean;
            modelTurn?: { parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }> };
            inputTranscription?: { text?: string; finished?: boolean };
            outputTranscription?: { text?: string; finished?: boolean };
          }
        | undefined;

      if (!serverContent) return;

      if (serverContent.interrupted) {
        this.callbacks.onInterrupted?.();
        this.callbacks.onStatus?.('listening');
      }

      if (serverContent.inputTranscription?.text) {
        this.callbacks.onInputTranscript?.(
          serverContent.inputTranscription.text,
          !!serverContent.inputTranscription.finished,
        );
        this.callbacks.onStatus?.('listening');
      }

      if (serverContent.outputTranscription?.text) {
        this.callbacks.onOutputTranscript?.(
          serverContent.outputTranscription.text,
          !!serverContent.outputTranscription.finished,
        );
      }

      const parts = serverContent.modelTurn?.parts || [];
      for (const part of parts) {
        const data = part.inlineData?.data;
        if (data) {
          this.callbacks.onStatus?.('speaking');
          this.callbacks.onAudioPcm24k?.(base64ToArrayBuffer(data));
        }
      }

      if (serverContent.turnComplete) {
        this.callbacks.onStatus?.('listening');
      }
    } catch (err) {
      if (__DEV__) console.warn('[GeminiLive] message parse failed', err);
    }
  }

  /** Send raw 16-bit PCM @ 16 kHz little-endian. */
  sendPcm16k(pcm: ArrayBuffer): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(
      JSON.stringify({
        realtimeInput: {
          audio: {
            data: arrayBufferToBase64(pcm),
            mimeType: 'audio/pcm;rate=16000',
          },
        },
      }),
    );
  }

  sendText(text: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const trimmed = text.trim();
    if (!trimmed) return;
    this.ws.send(
      JSON.stringify({
        realtimeInput: { text: trimmed },
      }),
    );
  }

  close(): void {
    this.closed = true;
    this.callbacks.onStatus?.('ended');
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // ignore
      }
      this.ws = null;
    }
  }
}

export function floatTo16BitPcm(float32: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(float32.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < float32.length; i += 1) {
    const s = Math.max(-1, Math.min(1, float32[i] ?? 0));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buffer;
}

/** Downsample Float32 audio to ~16 kHz for Live API. */
export function downsampleTo16k(
  float32: Float32Array,
  inputSampleRate: number,
): Float32Array {
  if (inputSampleRate === 16000) return float32;
  const ratio = inputSampleRate / 16000;
  const newLength = Math.max(1, Math.round(float32.length / ratio));
  const result = new Float32Array(newLength);
  for (let i = 0; i < newLength; i += 1) {
    const idx = Math.min(float32.length - 1, Math.floor(i * ratio));
    result[i] = float32[idx] ?? 0;
  }
  return result;
}
