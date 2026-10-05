/**
 * Spotify Web API service.
 *
 * Auth: Authorization Code + PKCE (public client — no client secret in the app).
 * Screens call these helpers; they never talk to Spotify directly.
 */
import Constants from 'expo-constants';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  MusicAlbum,
  MusicArtist,
  MusicCategoryId,
  MusicPlaylist,
  MusicSearchResults,
  MusicTrack,
} from './types';
import { pickCategoryQuery } from './music';

WebBrowser.maybeCompleteAuthSession();

const TOKEN_KEY = '@metime/spotify-tokens';
const API_BASE = 'https://api.spotify.com/v1';

const discovery: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: 'https://accounts.spotify.com/authorize',
  tokenEndpoint: 'https://accounts.spotify.com/api/token',
};

type TokenBundle = {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // epoch ms
};

export class SpotifyAuthRequiredError extends Error {
  constructor(message = 'Spotify connection needed') {
    super(message);
    this.name = 'SpotifyAuthRequiredError';
  }
}

export class SpotifyApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'SpotifyApiError';
    this.status = status;
  }
}

// ─── In-memory response cache ────────────────────────────

type CacheEntry<T> = { at: number; data: T };
const memoryCache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL_MS = 5 * 60 * 1000;

function cacheGet<T>(key: string): T | null {
  const hit = memoryCache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    memoryCache.delete(key);
    return null;
  }
  return hit.data as T;
}

function cacheSet<T>(key: string, data: T): void {
  memoryCache.set(key, { at: Date.now(), data });
}

export function clearSpotifyMemoryCache(): void {
  memoryCache.clear();
}

// ─── Client ID ───────────────────────────────────────────

export function getSpotifyClientId(): string {
  const fromEnv = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID;
  const fromExtra = Constants.expoConfig?.extra?.spotifyClientId;
  const id =
    (typeof fromEnv === 'string' && fromEnv.trim()) ||
    (typeof fromExtra === 'string' && fromExtra.trim()) ||
    '';
  return id;
}

function requireClientId(): string {
  const id = getSpotifyClientId();
  if (!id) {
    throw new SpotifyApiError(
      'Music isn’t configured yet. Add your Spotify client id to the environment.',
    );
  }
  return id;
}

function makeRedirectUri(): string {
  return AuthSession.makeRedirectUri({
    scheme: 'metime',
    path: 'spotify-callback',
  });
}

/** Expose redirect URI so it can be registered in the Spotify Dashboard. */
export function getSpotifyRedirectUri(): string {
  return makeRedirectUri();
}

export function getSpotifyEmbedUrl(trackId: string): string {
  return `https://open.spotify.com/embed/track/${encodeURIComponent(trackId)}?utm_source=generator&theme=0`;
}

export function getSpotifyOpenUrl(track: MusicTrack): string {
  if (track.spotifyUrl) return track.spotifyUrl;
  if (track.uri?.startsWith('spotify:')) {
    return `https://open.spotify.com/track/${track.id}`;
  }
  return `https://open.spotify.com/track/${track.id}`;
}

/** Prefer tracks that still expose a preview URL. */
export function preferPlayableTracks(tracks: MusicTrack[]): MusicTrack[] {
  return [...tracks].sort((a, b) => {
    const ap = a.previewUrl ? 1 : 0;
    const bp = b.previewUrl ? 1 : 0;
    return bp - ap;
  });
}

// ─── Token persistence ───────────────────────────────────

async function readTokens(): Promise<TokenBundle | null> {
  try {
    const raw = await AsyncStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TokenBundle;
    if (!parsed?.accessToken || typeof parsed.expiresAt !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

async function writeTokens(bundle: TokenBundle): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, JSON.stringify(bundle));
}

export async function clearSpotifyTokens(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

export async function hasSpotifySession(): Promise<boolean> {
  const tokens = await readTokens();
  return !!tokens?.accessToken;
}

function bundleFromTokenResponse(
  token: AuthSession.TokenResponse,
  previous?: TokenBundle | null,
): TokenBundle {
  const expiresIn = token.expiresIn ?? 3600;
  return {
    accessToken: token.accessToken,
    refreshToken: token.refreshToken ?? previous?.refreshToken,
    expiresAt: Date.now() + expiresIn * 1000 - 30_000,
  };
}

/**
 * Interactive Spotify connect using Authorization Code + PKCE.
 * This is the supported mobile/SPA flow when no client secret is available.
 */
export async function connectSpotify(): Promise<boolean> {
  const clientId = requireClientId();
  const redirectUri = makeRedirectUri();

  if (__DEV__) {
    console.log('[MeTime Spotify] Redirect URI →', redirectUri);
    console.log('[MeTime Spotify] Client ID length →', clientId.length);
  }

  const request = new AuthSession.AuthRequest({
    clientId,
    redirectUri,
    scopes: ['user-read-email'],
    usePKCE: true,
    responseType: AuthSession.ResponseType.Code,
  });

  const authUrl = await request.makeAuthUrlAsync(discovery);
  if (__DEV__) {
    console.log('[MeTime Spotify] Auth URL ready');
  }

  const result = await request.promptAsync(discovery, {
    showInRecents: true,
    // Prefer the auth URL we just built
    url: authUrl,
  });

  if (__DEV__) {
    console.log('[MeTime Spotify] Auth result type →', result.type);
  }

  if (result.type !== 'success') {
    return false;
  }

  const code = result.params.code;
  if (!code) {
    // Legacy apps that still return an access_token in the redirect.
    const accessToken = result.params.access_token;
    if (accessToken) {
      const expiresIn = Number(result.params.expires_in || 3600);
      await writeTokens({
        accessToken,
        expiresAt: Date.now() + expiresIn * 1000 - 30_000,
      });
      return true;
    }
    throw new SpotifyApiError(
      'Spotify login didn’t return a code. Add the Redirect URI shown on the Connect dialog to your Spotify Dashboard.',
    );
  }

  if (!request.codeVerifier) {
    throw new SpotifyApiError('Couldn’t finish connecting securely. Please try again.');
  }

  const token = await AuthSession.exchangeCodeAsync(
    {
      clientId,
      code,
      redirectUri,
      extraParams: {
        code_verifier: request.codeVerifier,
      },
    },
    discovery,
  );

  if (!token.accessToken) {
    throw new SpotifyApiError('Spotify didn’t return an access token. Please try again.');
  }

  await writeTokens(bundleFromTokenResponse(token));
  return true;
}

async function refreshAccessToken(refreshToken: string): Promise<TokenBundle> {
  const clientId = requireClientId();
  const token = await AuthSession.refreshAsync(
    {
      clientId,
      refreshToken,
    },
    discovery,
  );
  const previous = await readTokens();
  const bundle = bundleFromTokenResponse(token, previous);
  await writeTokens(bundle);
  return bundle;
}

async function getValidAccessToken(): Promise<string> {
  let tokens = await readTokens();
  if (!tokens?.accessToken) {
    throw new SpotifyAuthRequiredError();
  }

  if (Date.now() >= tokens.expiresAt) {
    if (!tokens.refreshToken) {
      await clearSpotifyTokens();
      throw new SpotifyAuthRequiredError();
    }
    try {
      tokens = await refreshAccessToken(tokens.refreshToken);
    } catch {
      await clearSpotifyTokens();
      throw new SpotifyAuthRequiredError();
    }
  }

  return tokens.accessToken;
}

// ─── HTTP ────────────────────────────────────────────────

async function spotifyFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const accessToken = await getValidAccessToken();
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
        ...(init?.headers || {}),
      },
    });
  } catch {
    throw new SpotifyApiError('Check your connection and try again.');
  }

  if (response.status === 401) {
    await clearSpotifyTokens();
    throw new SpotifyAuthRequiredError();
  }

  if (response.status === 429) {
    throw new SpotifyApiError('Music is resting for a moment. Try again shortly.', 429);
  }

  if (!response.ok) {
    throw new SpotifyApiError('Music couldn’t load right now.', response.status);
  }

  return (await response.json()) as T;
}

// ─── Normalization ───────────────────────────────────────

type SpotifyImage = { url?: string };
type SpotifyExternalUrls = { spotify?: string };

type RawTrack = {
  id?: string;
  name?: string;
  duration_ms?: number;
  preview_url?: string | null;
  uri?: string;
  external_urls?: SpotifyExternalUrls;
  artists?: Array<{ name?: string }>;
  album?: {
    name?: string;
    images?: SpotifyImage[];
  };
};

type RawArtist = {
  id?: string;
  name?: string;
  images?: SpotifyImage[];
  external_urls?: SpotifyExternalUrls;
};

type RawAlbum = {
  id?: string;
  name?: string;
  images?: SpotifyImage[];
  external_urls?: SpotifyExternalUrls;
  artists?: Array<{ name?: string }>;
};

type RawPlaylist = {
  id?: string;
  name?: string;
  description?: string | null;
  images?: SpotifyImage[];
  external_urls?: SpotifyExternalUrls;
};

function pickImage(images?: SpotifyImage[]): string | undefined {
  if (!images?.length) return undefined;
  // Prefer mid-size when available
  const mid = images[1]?.url || images[0]?.url || images[images.length - 1]?.url;
  return typeof mid === 'string' && mid.length > 0 ? mid : undefined;
}

export function normalizeTrack(raw: RawTrack): MusicTrack | null {
  if (!raw?.id || !raw.name) return null;
  const artist =
    raw.artists
      ?.map((a) => a.name)
      .filter((n): n is string => typeof n === 'string' && n.length > 0)
      .join(', ') || 'Unknown artist';

  return {
    id: raw.id,
    title: raw.name,
    artist,
    albumName: raw.album?.name,
    albumImage: pickImage(raw.album?.images),
    durationMs: typeof raw.duration_ms === 'number' ? raw.duration_ms : undefined,
    spotifyUrl: raw.external_urls?.spotify,
    previewUrl: raw.preview_url ?? null,
    uri: raw.uri,
  };
}

function normalizeArtist(raw: RawArtist): MusicArtist | null {
  if (!raw?.id || !raw.name) return null;
  return {
    id: raw.id,
    name: raw.name,
    image: pickImage(raw.images),
    spotifyUrl: raw.external_urls?.spotify,
  };
}

function normalizeAlbum(raw: RawAlbum): MusicAlbum | null {
  if (!raw?.id || !raw.name) return null;
  const artist =
    raw.artists
      ?.map((a) => a.name)
      .filter((n): n is string => typeof n === 'string' && n.length > 0)
      .join(', ') || 'Unknown artist';
  return {
    id: raw.id,
    name: raw.name,
    artist,
    image: pickImage(raw.images),
    spotifyUrl: raw.external_urls?.spotify,
  };
}

function normalizePlaylist(raw: RawPlaylist): MusicPlaylist | null {
  if (!raw?.id || !raw.name) return null;
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description || undefined,
    image: pickImage(raw.images),
    spotifyUrl: raw.external_urls?.spotify,
  };
}

// ─── Public API ──────────────────────────────────────────

export type TrackPage = {
  tracks: MusicTrack[];
  offset: number;
  limit: number;
  total: number;
  nextOffset: number | null;
  query: string;
};

type SearchApiResponse = {
  tracks?: { items?: RawTrack[]; total?: number };
  artists?: { items?: RawArtist[] };
  albums?: { items?: RawAlbum[] };
  playlists?: { items?: Array<RawPlaylist | null> };
};

export async function searchTracks(
  query: string,
  options?: { limit?: number; offset?: number },
): Promise<TrackPage> {
  const q = query.trim();
  if (!q) {
    return { tracks: [], offset: 0, limit: 0, total: 0, nextOffset: null, query: q };
  }

  const limit = Math.min(Math.max(options?.limit ?? 20, 1), 30);
  const offset = Math.max(options?.offset ?? 0, 0);
  const cacheKey = `tracks:${q}:${limit}:${offset}`;
  const cached = cacheGet<TrackPage>(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({
    q,
    type: 'track',
    limit: String(limit),
    offset: String(offset),
    market: 'US',
  });

  const data = await spotifyFetch<SearchApiResponse>(`/search?${params.toString()}`);
  const items = Array.isArray(data.tracks?.items) ? data.tracks.items : [];
  const tracks = preferPlayableTracks(
    items.map(normalizeTrack).filter((t): t is MusicTrack => t !== null),
  );
  const total = typeof data.tracks?.total === 'number' ? data.tracks.total : tracks.length;
  const nextOffset = offset + tracks.length < total ? offset + tracks.length : null;

  const page: TrackPage = { tracks, offset, limit, total, nextOffset, query: q };
  cacheSet(cacheKey, page);
  return page;
}

export async function searchMusic(
  query: string,
  options?: { limit?: number },
): Promise<MusicSearchResults> {
  const q = query.trim();
  if (!q) {
    return { tracks: [], artists: [], albums: [], playlists: [] };
  }

  const limit = Math.min(Math.max(options?.limit ?? 12, 1), 20);
  const cacheKey = `search:${q}:${limit}`;
  const cached = cacheGet<MusicSearchResults>(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({
    q,
    type: 'track,artist,album,playlist',
    limit: String(limit),
    market: 'US',
  });

  const data = await spotifyFetch<SearchApiResponse>(`/search?${params.toString()}`);

  const results: MusicSearchResults = {
    tracks: preferPlayableTracks(
      (data.tracks?.items || [])
        .map(normalizeTrack)
        .filter((t): t is MusicTrack => t !== null),
    ),
    artists: (data.artists?.items || [])
      .map(normalizeArtist)
      .filter((a): a is MusicArtist => a !== null),
    albums: (data.albums?.items || [])
      .map(normalizeAlbum)
      .filter((a): a is MusicAlbum => a !== null),
    playlists: (data.playlists?.items || [])
      .filter((p): p is RawPlaylist => !!p)
      .map(normalizePlaylist)
      .filter((p): p is MusicPlaylist => p !== null),
  };

  cacheSet(cacheKey, results);
  return results;
}

export async function getCategoryTracks(
  categoryId: MusicCategoryId,
  options?: { limit?: number; offset?: number; seed?: number },
): Promise<TrackPage> {
  const seed = options?.seed ?? Date.now();
  const query = pickCategoryQuery(categoryId, seed);
  // Randomize offset a little for Surprise Me variety (Spotify has no true random).
  const baseOffset = options?.offset ?? 0;
  const jitter =
    baseOffset > 0 ? 0 : (seed % 5) * (options?.limit ?? 20);
  return searchTracks(query, {
    limit: options?.limit ?? 20,
    offset: baseOffset + jitter,
  });
}

export function friendlySpotifyError(error: unknown): string {
  if (error instanceof SpotifyAuthRequiredError) {
    return 'Connect Spotify to explore music.';
  }
  if (error instanceof SpotifyApiError) {
    return error.message;
  }
  return 'Music couldn’t load right now.';
}
