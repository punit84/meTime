import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { MiniPlayer } from '@/components/MiniPlayer';
import { MusicTrackRow } from '@/components/MusicTrackRow';
import { Screen } from '@/components/Screen';
import { getMusicCategory, isMusicCategoryId } from '@/lib/music';
import { useMusicPlayer } from '@/lib/MusicPlayerProvider';
import {
  SpotifyAuthRequiredError,
  friendlySpotifyError,
  getCategoryTracks,
  hasSpotifySession,
  type TrackPage,
} from '@/lib/spotify';
import { useSpotifyGate } from '@/lib/useSpotifyGate';
import { colors, fonts, radii, spacing } from '@/lib/theme';
import type { MusicTrack } from '@/lib/types';

export default function MusicCategoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string; surprise?: string }>();
  const { playTrack, track: activeTrack, status } = useMusicPlayer();
  const {
    connecting,
    needsConnect,
    error: gateError,
    redirectUri,
    connect,
  } = useSpotifyGate();

  const categoryId = isMusicCategoryId(params.id) ? params.id : null;
  const isSurpriseEntry = params.surprise === '1';
  const config = categoryId ? getMusicCategory(categoryId) : null;

  const [page, setPage] = useState<TrackPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seed] = useState(() => Date.now());
  const [surpriseTrack, setSurpriseTrack] = useState<MusicTrack | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const didPickSurprise = useRef(false);

  const tracks = useMemo(() => page?.tracks ?? [], [page?.tracks]);

  const fetchPage = useCallback(
    async (opts?: { append?: boolean; offset?: number }) => {
      if (!categoryId) return;
      const append = opts?.append ?? false;

      const next = await getCategoryTracks(categoryId, {
        limit: 20,
        offset: opts?.offset ?? 0,
        seed,
      });

      setPage((prev) =>
        append && prev
          ? {
              ...next,
              tracks: [...prev.tracks, ...next.tracks],
            }
          : next,
      );

      if (!append && !didPickSurprise.current && next.tracks.length > 0) {
        const pick =
          next.tracks[Math.floor(Math.random() * next.tracks.length)] ?? null;
        if (pick) {
          setSurpriseTrack(pick);
          didPickSurprise.current = true;
        }
      }
    },
    [categoryId, seed],
  );

  const load = useCallback(
    async (opts?: { append?: boolean; offset?: number }) => {
      if (!categoryId) return;
      const append = opts?.append ?? false;
      if (append) setLoadingMore(true);
      else {
        setLoading(true);
        setError(null);
      }

      try {
        const ok = await hasSpotifySession();
        if (!ok) {
          setSessionReady(false);
          setLoading(false);
          setLoadingMore(false);
          return;
        }
        setSessionReady(true);
        await fetchPage(opts);
      } catch (err) {
        if (err instanceof SpotifyAuthRequiredError) {
          setSessionReady(false);
          setError(null);
        } else {
          setError(friendlySpotifyError(err));
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [categoryId, fetchPage],
  );

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      if (!cancelled) {
        load().catch(() => {});
      }
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [load]);

  const handleConnect = async () => {
    const ok = await connect();
    if (ok) {
      await load();
    }
  };

  const handlePlay = async (item: MusicTrack) => {
    await playTrack(item, { categoryId });
    router.push('/music/player');
  };

  const handleSurpriseFromList = () => {
    if (!tracks.length) return;
    const pick = tracks[Math.floor(Math.random() * tracks.length)];
    if (pick) {
      setSurpriseTrack(pick);
      handlePlay(pick).catch(() => {});
    }
  };

  const subtitle = useMemo(() => {
    if (!config) return '';
    if (isSurpriseEntry) return 'Your mood picked this for you.';
    return config.subtitle;
  }, [config, isSurpriseEntry]);

  if (!config || !categoryId) {
    return (
      <Screen>
        <AppText variant="title">Music</AppText>
        <AppText muted style={{ marginTop: spacing.md }}>
          That listening space couldn’t be found.
        </AppText>
      </Screen>
    );
  }

  const showConnect = !sessionReady || needsConnect;

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
        {!showConnect && (
          <Pressable
            onPress={handleSurpriseFromList}
            disabled={!tracks.length}
            style={({ pressed }) => [styles.surpriseBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Surprise me from this mood"
          >
            <Ionicons name="shuffle-outline" size={16} color={colors.accentDeep} />
            <AppText style={styles.surpriseText}>Surprise Me</AppText>
          </Pressable>
        )}
      </View>

      <AppText variant="title">{config.title}</AppText>
      <AppText muted style={styles.subtitle}>
        {subtitle}
      </AppText>

      {isSurpriseEntry && sessionReady && (
        <View style={styles.pickedCard}>
          <AppText muted style={styles.pickedLabel}>
            Your mood picked
          </AppText>
          <AppText style={styles.pickedTitle}>{config.title}</AppText>
        </View>
      )}

      {showConnect ? (
        <View style={styles.connectCard}>
          <View style={styles.connectIcon}>
            <Ionicons name="musical-notes-outline" size={22} color={colors.accentDeep} />
          </View>
          <AppText style={styles.connectTitle}>Connect Spotify</AppText>
          <AppText muted style={styles.connectBody}>
            Me Time uses Spotify to find music for this mood. Connect once, then listen here.
          </AppText>
          {(gateError || error) && (
            <AppText style={styles.connectError}>{gateError || error}</AppText>
          )}
          <AppText muted style={styles.redirectHint}>
            If login fails, add this Redirect URI in Spotify Dashboard:{'\n'}
            {redirectUri}
          </AppText>
          <Pressable
            onPress={() => {
              handleConnect().catch(() => {});
            }}
            disabled={connecting}
            style={({ pressed }) => [
              styles.connectBtn,
              connecting && styles.connectDisabled,
              pressed && styles.pressed,
            ]}
          >
            <AppText style={styles.connectBtnText}>
              {connecting ? 'Connecting…' : 'Connect Spotify'}
            </AppText>
          </Pressable>
        </View>
      ) : loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.textMuted} />
          <AppText muted style={styles.stateText}>
            Finding something for you…
          </AppText>
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <AppText style={styles.stateTitle}>Music couldn’t load right now.</AppText>
          <AppText muted style={styles.stateText}>
            {error}
          </AppText>
          <Pressable
            onPress={() => {
              load().catch(() => {});
            }}
            style={({ pressed }) => [styles.retryBtn, pressed && styles.pressed]}
          >
            <AppText style={styles.retryText}>Try again</AppText>
          </Pressable>
        </View>
      ) : tracks.length === 0 ? (
        <View style={styles.centerState}>
          <AppText style={styles.stateTitle}>No music found.</AppText>
          <AppText muted style={styles.stateText}>
            Try another search or mood.
          </AppText>
          <Pressable
            onPress={() => router.push('/music/search')}
            style={({ pressed }) => [styles.retryBtn, pressed && styles.pressed]}
          >
            <AppText style={styles.retryText}>Search again</AppText>
          </Pressable>
        </View>
      ) : (
        <View>
          {surpriseTrack && (
            <View style={styles.spotlight}>
              <AppText muted style={styles.pickedLabel}>
                A soft pick for you
              </AppText>
              <MusicTrackRow
                track={surpriseTrack}
                active={activeTrack?.id === surpriseTrack.id}
                playing={
                  activeTrack?.id === surpriseTrack.id &&
                  (status === 'playing' || status === 'loading')
                }
                onPress={() => {
                  handlePlay(surpriseTrack).catch(() => {});
                }}
              />
            </View>
          )}

          {tracks.map((item) => (
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

          {page?.nextOffset != null && (
            <Pressable
              onPress={() => {
                load({ append: true, offset: page.nextOffset ?? 0 }).catch(() => {});
              }}
              disabled={loadingMore}
              style={({ pressed }) => [styles.loadMore, pressed && styles.pressed]}
            >
              <AppText style={styles.loadMoreText}>
                {loadingMore ? 'Loading…' : 'Load more'}
              </AppText>
            </Pressable>
          )}
        </View>
      )}

      <MiniPlayer bottomOffset={Math.max(insets.bottom, 12)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  surpriseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceSage,
    borderWidth: 1,
    borderColor: colors.border,
  },
  surpriseText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.accentDeep,
  },
  subtitle: {
    marginTop: 4,
    marginBottom: spacing.lg,
    maxWidth: 300,
  },
  pickedCard: {
    backgroundColor: colors.surfaceWarm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  pickedLabel: {
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  pickedTitle: {
    fontFamily: fonts.display,
    fontSize: 22,
    marginTop: 2,
    color: colors.textPrimary,
  },
  spotlight: {
    marginBottom: spacing.sm,
  },
  connectCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
  },
  connectIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surfaceSage,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  connectTitle: {
    fontFamily: fonts.display,
    fontSize: 24,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  connectBody: {
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: spacing.md,
  },
  connectError: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.accentDeep,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  redirectHint: {
    fontSize: 11,
    textAlign: 'center',
    marginBottom: spacing.lg,
    maxWidth: 320,
  },
  connectBtn: {
    backgroundColor: colors.selected,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.pill,
  },
  connectDisabled: {
    opacity: 0.6,
  },
  connectBtnText: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: colors.white,
  },
  centerState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.md,
  },
  stateTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 16,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  stateText: {
    marginTop: spacing.sm,
    textAlign: 'center',
    maxWidth: 280,
  },
  retryBtn: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.selected,
  },
  retryText: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.white,
  },
  loadMore: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  loadMoreText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.accentDeep,
  },
  pressed: { opacity: 0.9 },
});
