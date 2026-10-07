/**
 * Native stub — Gemini Live mic/playback is web-first for now.
 * Signature matches `geminiAudio.web.ts` so TypeScript stays aligned.
 */
type CaptureHandlers = {
  onPcm16k: (pcm: ArrayBuffer) => void;
  onError?: (message: string) => void;
};

export type GeminiMicCapture = {
  stop: () => void;
  setMuted: (muted: boolean) => void;
};

export type GeminiPcmPlayer = {
  enqueue: (pcm24k: ArrayBuffer) => void;
  clear: () => void;
  close: () => void;
};

export async function startGeminiMicCapture(
  _handlers: CaptureHandlers,
): Promise<GeminiMicCapture> {
  throw new Error(
    'Live voice works in the browser right now. Open Me Time on web to talk with Gemini.',
  );
}

export function createGeminiPcmPlayer(): GeminiPcmPlayer {
  throw new Error(
    'Live voice works in the browser right now. Open Me Time on web to talk with Gemini.',
  );
}
