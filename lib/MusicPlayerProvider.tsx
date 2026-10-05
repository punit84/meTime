/**
 * Single active audio player for Listen previews.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Audio, type AVPlaybackStatus } from 'expo-av';
import type { MusicCategoryId, MusicTrack } from './types';
import { useApp } from './AppProvider';

type PlayerStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error';

type MusicPlayerContextValue = {
  track: MusicTrack | null;
  categoryId: MusicCategoryId | null;
  status: PlayerStatus;
  positionMs: number;
  durationMs: number;
  errorMessage: string | null;
  playTrack: (
    track: MusicTrack,
    options?: { categoryId?: MusicCategoryId | null },
  ) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  stop: () => Promise<void>;
  clear: () => Promise<void>;
};

const MusicPlayerContext = createContext<MusicPlayerContextValue | null>(null);

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
  const { recordRecentlyPlayed } = useApp();
  const soundRef = useRef<Audio.Sound | null>(null);

  const [track, setTrack] = useState<MusicTrack | null>(null);
  const [categoryId, setCategoryId] = useState<MusicCategoryId | null>(null);
  const [status, setStatus] = useState<PlayerStatus>('idle');
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const unloadCurrent = useCallback(async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
      } catch {
        // ignore
      }
      try {
        await soundRef.current.unloadAsync();
      } catch {
        // ignore
      }
      soundRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      unloadCurrent().catch(() => {});
    };
  }, [unloadCurrent]);

  const onPlaybackStatus = useCallback((playback: AVPlaybackStatus) => {
    if (!playback.isLoaded) {
      if (playback.error) {
        setStatus('error');
        setErrorMessage('This preview couldn’t play.');
      }
      return;
    }

    setPositionMs(playback.positionMillis ?? 0);
    setDurationMs(playback.durationMillis ?? 0);

    if (playback.didJustFinish) {
      setStatus('ended');
      setPositionMs(0);
      return;
    }

    setStatus(playback.isPlaying ? 'playing' : 'paused');
  }, []);

  const playTrack = useCallback(
    async (
      next: MusicTrack,
      options?: { categoryId?: MusicCategoryId | null },
    ) => {
      setErrorMessage(null);
      setTrack(next);
      setCategoryId(options?.categoryId ?? null);
      setPositionMs(0);
      setDurationMs(next.durationMs ?? 0);

      await unloadCurrent();

      if (!next.previewUrl) {
        setStatus('idle');
        setErrorMessage('Preview unavailable');
        await recordRecentlyPlayed({
          id: next.id,
          title: next.title,
          artist: next.artist,
          albumImage: next.albumImage,
          spotifyUrl: next.spotifyUrl,
          categoryId: options?.categoryId ?? null,
        });
        return;
      }

      setStatus('loading');
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });

        const { sound } = await Audio.Sound.createAsync(
          { uri: next.previewUrl },
          { shouldPlay: true },
          onPlaybackStatus,
        );
        soundRef.current = sound;
        setStatus('playing');

        await recordRecentlyPlayed({
          id: next.id,
          title: next.title,
          artist: next.artist,
          albumImage: next.albumImage,
          spotifyUrl: next.spotifyUrl,
          categoryId: options?.categoryId ?? null,
        });
      } catch (error) {
        if (__DEV__) console.warn('[MusicPlayer] play failed:', error);
        setStatus('error');
        setErrorMessage('This preview couldn’t play.');
      }
    },
    [onPlaybackStatus, recordRecentlyPlayed, unloadCurrent],
  );

  const togglePlayPause = useCallback(async () => {
    const sound = soundRef.current;
    if (!sound || !track?.previewUrl) return;
    try {
      const current = await sound.getStatusAsync();
      if (!current.isLoaded) return;
      if (current.isPlaying) {
        await sound.pauseAsync();
        setStatus('paused');
      } else {
        await sound.playAsync();
        setStatus('playing');
      }
    } catch {
      setStatus('error');
      setErrorMessage('This preview couldn’t play.');
    }
  }, [track?.previewUrl]);

  const stop = useCallback(async () => {
    await unloadCurrent();
    setStatus('idle');
    setPositionMs(0);
  }, [unloadCurrent]);

  const clear = useCallback(async () => {
    await unloadCurrent();
    setTrack(null);
    setCategoryId(null);
    setStatus('idle');
    setPositionMs(0);
    setDurationMs(0);
    setErrorMessage(null);
  }, [unloadCurrent]);

  const value = useMemo(
    () => ({
      track,
      categoryId,
      status,
      positionMs,
      durationMs,
      errorMessage,
      playTrack,
      togglePlayPause,
      stop,
      clear,
    }),
    [
      track,
      categoryId,
      status,
      positionMs,
      durationMs,
      errorMessage,
      playTrack,
      togglePlayPause,
      stop,
      clear,
    ],
  );

  return (
    <MusicPlayerContext.Provider value={value}>
      {children}
    </MusicPlayerContext.Provider>
  );
}

export function useMusicPlayer(): MusicPlayerContextValue {
  const ctx = useContext(MusicPlayerContext);
  if (!ctx) {
    throw new Error('useMusicPlayer must be used within <MusicPlayerProvider>');
  }
  return ctx;
}
