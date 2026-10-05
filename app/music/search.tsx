import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { MiniPlayer } from '@/components/MiniPlayer';
import { MusicTrackRow } from '@/components/MusicTrackRow';
import { Screen } from '@/components/Screen';
import { useApp } from '@/lib/AppProvider';
import { useMusicPlayer } from '@/lib/MusicPlayerProvider';
import { friendlySpotifyError, searchMusic } from '@/lib/spotify';
import { useSpotifyGate } from '@/lib/useSpotifyGate';
import { colors, fonts, radii, spacing } from '@/lib/theme';
import type { MusicSearchResults, MusicTrack } from '@/lib/types';

const DEBOUNCE_MS = 450;

export default function MusicSearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { musicRecentSearches, rememberMusicSearch } = useApp();
  const { playTrack, track: activeTrack, status } = useMusicPlayer();
  const {
    connecting,
    needsConnect,
    error: gateError,
    redirectUri,
    connect,
    runWithSpotify,
  } = useSpotifyGate();

  const [query, setQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [results, setResults] = useState<MusicSearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  const trimmed = query.trim();
  const canSearch = trimmed.length >= 2;

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!canSearch) return;

    debounceRef.current = setTimeout(() => {
      const reqId = ++requestIdRef.current;
      const q = trimmed;
      setLoading(true);
      setError(null);
      setActiveQuery(q);

      runWithSpotify(() => searchMusic(q, { limit: 12 }))
        .then(async (data) => {
          if (reqId !== requestIdRef.current) return;
          if (!data) {
            setLoading(false);
            return;
          }
          setResults(data);
          await rememberMusicSearch(q);
        })
        .catch((err) => {
          if (reqId !== requestIdRef.current) return;
          setError(friendlySpotifyError(err));
        })
        .finally(() => {
          if (reqId === requestIdRef.current) setLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [canSearch, trimmed, rememberMusicSearch, runWithSpotify]);

  const showResults = canSearch && activeQuery === trimmed && !!results;

  const hasResults = useMemo(
    () =>
      !!results &&
      (results.tracks.length > 0 ||
        results.artists.length > 0 ||
        results.albums.length > 0 ||
        results.playlists.length > 0),
    [results],
  );

  const handlePlay = async (item: MusicTrack) => {
    await playTrack(item);
    router.push('/music/player');
  };

  return (
    <Screen contentStyle={{ paddingBottom: 120 }}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
        </Pressable>
      </View>

      <AppText variant="title">Search</AppText>
      <AppText muted style={styles.subtitle}>
        Songs, artists, albums — whatever fits the moment.
      </AppText>

      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search songs, artists, albums..."
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          autoFocus
          returnKeyType="search"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        )}
      </View>

      {!canSearch && musicRecentSearches.length > 0 && (
        <View style={styles.recentBlock}>
          <AppText variant="label" style={styles.sectionLabel}>
            Recent
          </AppText>
          {musicRecentSearches.map((item) => (
            <Pressable
              key={item}
              onPress={() => setQuery(item)}
              style={({ pressed }) => [styles.recentRow, pressed && styles.pressed]}
            >
              <Ionicons name="time-outline" size={16} color={colors.textMuted} />
              <AppText style={styles.recentText}>{item}</AppText>
            </Pressable>
          ))}
        </View>
      )}

      {needsConnect && (
        <View style={styles.connectCard}>
          <AppText style={styles.connectTitle}>Connect Spotify</AppText>
          <AppText muted style={styles.connectBody}>
            Connect once to search songs, artists, and albums.
          </AppText>
          {!!gateError && (
            <AppText style={styles.connectError}>{gateError}</AppText>
          )}
          <AppText muted style={styles.redirectHint}>
            Redirect URI:{'\n'}
            {redirectUri}
          </AppText>
          <Pressable
            onPress={() => {
              connect().catch(() => {});
            }}
            disabled={connecting}
            style={({ pressed }) => [styles.connectBtn, pressed && styles.pressed]}
          >
            <AppText style={styles.connectBtnText}>
              {connecting ? 'Connecting…' : 'Connect Spotify'}
            </AppText>
          </Pressable>
        </View>
      )}

      {canSearch && loading && (
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.textMuted} />
          <AppText muted style={styles.stateText}>
            Finding something for you…
          </AppText>
        </View>
      )}

      {canSearch && !loading && error && (
        <View style={styles.centerState}>
          <AppText style={styles.stateTitle}>Music couldn’t load right now.</AppText>
          <AppText muted style={styles.stateText}>
            {error}
          </AppText>
        </View>
      )}

      {showResults && !loading && !error && !hasResults && (
        <View style={styles.centerState}>
          <AppText style={styles.stateTitle}>No music found.</AppText>
          <AppText muted style={styles.stateText}>
            Try another search or mood.
          </AppText>
        </View>
      )}

      {showResults && !loading && results && hasResults && (
        <View>
          {results.tracks.length > 0 && (
            <>
              <AppText variant="label" style={styles.sectionLabel}>
                Tracks
              </AppText>
              {results.tracks.map((item) => (
                <MusicTrackRow
                  key={item.id}
                  track={item}
                  active={activeTrack?.id === item.id}
                  playing={
                    activeTrack?.id === item.id &&
                    (status === 'playing' || status === 'loading')
                  }
                  onPress={() => {
                    handlePlay(item).catch(() => {});
                  }}
                />
              ))}
            </>
          )}

          {results.artists.length > 0 && (
            <>
              <AppText variant="label" style={styles.sectionLabel}>
                Artists
              </AppText>
              {results.artists.map((artist) => (
                <Pressable
                  key={artist.id}
                  onPress={() => {
                    if (artist.spotifyUrl) {
                      Linking.openURL(artist.spotifyUrl).catch(() => {});
                    } else {
                      setQuery(artist.name);
                    }
                  }}
                  style={({ pressed }) => [styles.entityRow, pressed && styles.pressed]}
                >
                  {artist.image ? (
                    <Image source={{ uri: artist.image }} style={styles.entityArt} />
                  ) : (
                    <View style={[styles.entityArt, styles.artFallback]}>
                      <Ionicons name="person-outline" size={16} color={colors.textMuted} />
                    </View>
                  )}
                  <AppText style={styles.entityTitle} numberOfLines={1}>
                    {artist.name}
                  </AppText>
                </Pressable>
              ))}
            </>
          )}

          {results.albums.length > 0 && (
            <>
              <AppText variant="label" style={styles.sectionLabel}>
                Albums
              </AppText>
              {results.albums.map((album) => (
                <Pressable
                  key={album.id}
                  onPress={() => {
                    if (album.spotifyUrl) {
                      Linking.openURL(album.spotifyUrl).catch(() => {});
                    }
                  }}
                  style={({ pressed }) => [styles.entityRow, pressed && styles.pressed]}
                >
                  {album.image ? (
                    <Image source={{ uri: album.image }} style={styles.entityArt} />
                  ) : (
                    <View style={[styles.entityArt, styles.artFallback]}>
                      <Ionicons name="disc-outline" size={16} color={colors.textMuted} />
                    </View>
                  )}
                  <View style={styles.entityCopy}>
                    <AppText style={styles.entityTitle} numberOfLines={1}>
                      {album.name}
                    </AppText>
                    <AppText muted style={styles.entitySub} numberOfLines={1}>
                      {album.artist}
                    </AppText>
                  </View>
                </Pressable>
              ))}
            </>
          )}
        </View>
      )}

      <MiniPlayer bottomOffset={Math.max(insets.bottom, 12)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    marginTop: 4,
    marginBottom: spacing.lg,
    maxWidth: 300,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
  },
  input: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textPrimary,
    paddingVertical: 6,
  },
  sectionLabel: {
    color: colors.textMuted,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  recentBlock: {
    marginBottom: spacing.md,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  recentText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textPrimary,
  },
  connectCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  connectTitle: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  connectBody: {
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  connectError: {
    color: colors.accentDeep,
    textAlign: 'center',
    marginBottom: spacing.sm,
    fontSize: 13,
  },
  redirectHint: {
    fontSize: 11,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  connectBtn: {
    backgroundColor: colors.selected,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.pill,
  },
  connectBtnText: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: colors.white,
  },
  centerState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  stateTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 16,
    color: colors.textPrimary,
  },
  stateText: {
    marginTop: spacing.sm,
    textAlign: 'center',
    maxWidth: 280,
  },
  entityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  entityArt: {
    width: 48,
    height: 48,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceWarm,
  },
  artFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  entityCopy: { flex: 1, minWidth: 0 },
  entityTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.textPrimary,
    flex: 1,
  },
  entitySub: {
    fontSize: 12,
    marginTop: 2,
  },
  pressed: { opacity: 0.9 },
});
