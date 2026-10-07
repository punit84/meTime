/**
 * Browser mic capture + PCM playback for Gemini Live.
 */
import { downsampleTo16k, floatTo16BitPcm } from './geminiLive';

type CaptureHandlers = {
  onPcm16k: (pcm: ArrayBuffer) => void;
  onError?: (message: string) => void;
};

export type GeminiMicCapture = {
  stop: () => void;
  setMuted: (muted: boolean) => void;
};

export async function startGeminiMicCapture(
  handlers: CaptureHandlers,
): Promise<GeminiMicCapture> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    throw new Error('Microphone isn’t available in this browser.');
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      channelCount: 1,
    },
  });

  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const context = new AudioCtx();
  const source = context.createMediaStreamSource(stream);

  const processor = context.createScriptProcessor(4096, 1, 1);
  let muted = false;

  processor.onaudioprocess = (event) => {
    if (muted) return;
    const input = event.inputBuffer.getChannelData(0);
    const down = downsampleTo16k(input, context.sampleRate);
    handlers.onPcm16k(floatTo16BitPcm(down));
  };

  source.connect(processor);
  processor.connect(context.destination);

  return {
    setMuted: (value: boolean) => {
      muted = value;
    },
    stop: () => {
      try {
        processor.disconnect();
        source.disconnect();
      } catch {
        // ignore
      }
      stream.getTracks().forEach((t) => t.stop());
      void context.close();
    },
  };
}

export type GeminiPcmPlayer = {
  enqueue: (pcm24k: ArrayBuffer) => void;
  clear: () => void;
  close: () => void;
};

export function createGeminiPcmPlayer(): GeminiPcmPlayer {
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const context = new AudioCtx({ sampleRate: 24000 });
  let nextStart = 0;
  let closed = false;

  const enqueue = (pcm24k: ArrayBuffer) => {
    if (closed) return;
    const int16 = new Int16Array(pcm24k);
    if (!int16.length) return;
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i += 1) {
      float32[i] = (int16[i] ?? 0) / 0x8000;
    }
    const buffer = context.createBuffer(1, float32.length, 24000);
    buffer.copyToChannel(float32, 0);
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    const now = context.currentTime;
    const startAt = Math.max(now, nextStart);
    source.start(startAt);
    nextStart = startAt + buffer.duration;
  };

  return {
    enqueue,
    clear: () => {
      nextStart = context.currentTime;
    },
    close: () => {
      closed = true;
      void context.close();
    },
  };
}
