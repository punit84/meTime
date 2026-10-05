/**
 * Ensures a Spotify session exists before running a music action.
 * Uses in-app UI state — never hangs on Alert.alert (broken on web).
 */
import { useCallback, useState } from 'react';
import {
  SpotifyAuthRequiredError,
  connectSpotify,
  friendlySpotifyError,
  getSpotifyRedirectUri,
  hasSpotifySession,
} from './spotify';

export type SpotifyGateState = {
  connecting: boolean;
  needsConnect: boolean;
  error: string | null;
  redirectUri: string;
  ensureSpotify: () => Promise<boolean>;
  connect: () => Promise<boolean>;
  runWithSpotify: <T>(action: () => Promise<T>) => Promise<T | null>;
  clearError: () => void;
};

export function useSpotifyGate(): SpotifyGateState {
  const [connecting, setConnecting] = useState(false);
  const [needsConnect, setNeedsConnect] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const redirectUri = getSpotifyRedirectUri();

  const clearError = useCallback(() => setError(null), []);

  const connect = useCallback(async (): Promise<boolean> => {
    setConnecting(true);
    setError(null);
    try {
      const ok = await connectSpotify();
      if (!ok) {
        setNeedsConnect(true);
        setError(
          `Connection paused. In Spotify Dashboard → Redirect URIs, add:\n${redirectUri}`,
        );
        return false;
      }
      setNeedsConnect(false);
      return true;
    } catch (err) {
      setNeedsConnect(true);
      setError(
        `${friendlySpotifyError(err)}\n\nRedirect URI to register:\n${redirectUri}`,
      );
      return false;
    } finally {
      setConnecting(false);
    }
  }, [redirectUri]);

  const ensureSpotify = useCallback(async (): Promise<boolean> => {
    if (await hasSpotifySession()) {
      setNeedsConnect(false);
      return true;
    }
    setNeedsConnect(true);
    // Auto-start connect on user gesture path (caller should be from a press).
    return connect();
  }, [connect]);

  const runWithSpotify = useCallback(
    async <T,>(action: () => Promise<T>): Promise<T | null> => {
      try {
        if (!(await hasSpotifySession())) {
          setNeedsConnect(true);
          return null;
        }
        return await action();
      } catch (err) {
        if (err instanceof SpotifyAuthRequiredError) {
          setNeedsConnect(true);
          return null;
        }
        throw err;
      }
    },
    [],
  );

  return {
    connecting,
    needsConnect,
    error,
    redirectUri,
    ensureSpotify,
    connect,
    runWithSpotify,
    clearError,
  };
}
