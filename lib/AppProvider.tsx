/**
 * Me Time — App State Provider
 *
 * Lightweight React Context that provides:
 *   - user profile
 *   - current mood
 *   - preferences
 *   - mirror / soft talk / skin care
 *   - initialization state
 *
 * All screens consume this context rather than loading
 * data independently, preventing prop drilling and
 * duplicate storage reads.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import type {
  AppPreferences,
  MirrorEntry,
  MirrorMediaType,
  MoodEntry,
  MoodType,
  MusicCategoryId,
  RecentlyPlayedTrack,
  SkinCareCategory,
  SkinCareDayRecord,
  SkinCarePeriod,
  SkinCareReminders,
  SkinCareRoutine,
  SkinCareStep,
  UserProfile,
  VoiceEntry,
} from './types';
import {
  DEFAULT_PREFERENCES,
  DEFAULT_SKIN_CARE_REMINDERS,
  EMPTY_SKIN_CARE_ROUTINE,
} from './types';
import {
  addMusicRecentSearch as storageAddMusicRecentSearch,
  addRecentlyPlayedTrack as storageAddRecentlyPlayedTrack,
  addSkinCareStep as storageAddSkinCareStep,
  completeOnboarding,
  createSkinCareRoutine as storageCreateSkinCareRoutine,
  deleteMirrorEntry,
  deleteSkinCareStep as storageDeleteSkinCareStep,
  deleteVoiceEntry,
  getMirrorEntries,
  getSkinCareHistory,
  getSkinCareToday,
  getVoiceEntries,
  initializeApp,
  reorderSkinCareSteps as storageReorderSkinCareSteps,
  resetTodaySkinCare as storageResetTodaySkinCare,
  saveMirrorEntry,
  savePreferences,
  saveTodayMood,
  saveVoiceEntry,
  toggleSkinCareStep as storageToggleSkinCareStep,
  updateProfileName,
  updateSkinCareReminders as storageUpdateSkinCareReminders,
  updateSkinCareStep as storageUpdateSkinCareStep,
} from './storage';
import { localDateKey } from './skinCare';

// ─── State Shape ─────────────────────────────────────────

type AppState = {
  isReady: boolean;
  needsOnboarding: boolean;
  user: UserProfile;
  todayMood: MoodEntry | null;
  preferences: AppPreferences;
  mirrorEntries: MirrorEntry[];
  voiceEntries: VoiceEntry[];
  skinCareRoutine: SkinCareRoutine;
  skinCareToday: SkinCareDayRecord;
  skinCareHistory: SkinCareDayRecord[];
  recentlyPlayed: RecentlyPlayedTrack[];
  musicRecentSearches: string[];
};

const INITIAL_STATE: AppState = {
  isReady: false,
  needsOnboarding: true,
  user: {
    id: '',
    name: '',
    createdAt: '',
    updatedAt: '',
    onboardingComplete: false,
  },
  todayMood: null,
  preferences: { ...DEFAULT_PREFERENCES },
  mirrorEntries: [],
  voiceEntries: [],
  skinCareRoutine: {
    ...EMPTY_SKIN_CARE_ROUTINE,
    reminders: { ...DEFAULT_SKIN_CARE_REMINDERS },
  },
  skinCareToday: { date: localDateKey(), completedStepIds: [] },
  skinCareHistory: [],
  recentlyPlayed: [],
  musicRecentSearches: [],
};

// ─── Actions ─────────────────────────────────────────────

type Action =
  | {
      type: 'INIT';
      payload: {
        user: UserProfile;
        todayMood: MoodEntry | null;
        preferences: AppPreferences;
        mirrorEntries: MirrorEntry[];
        voiceEntries: VoiceEntry[];
        skinCareRoutine: SkinCareRoutine;
        skinCareToday: SkinCareDayRecord;
        skinCareHistory: SkinCareDayRecord[];
        recentlyPlayed: RecentlyPlayedTrack[];
        musicRecentSearches: string[];
        needsOnboarding: boolean;
      };
    }
  | { type: 'SET_USER'; payload: UserProfile }
  | { type: 'SET_MOOD'; payload: MoodEntry }
  | { type: 'SET_PREFERENCES'; payload: AppPreferences }
  | { type: 'COMPLETE_ONBOARDING'; payload: UserProfile }
  | { type: 'SET_MIRROR_ENTRIES'; payload: MirrorEntry[] }
  | { type: 'ADD_MIRROR_ENTRY'; payload: MirrorEntry }
  | { type: 'REMOVE_MIRROR_ENTRY'; payload: string }
  | { type: 'SET_VOICE_ENTRIES'; payload: VoiceEntry[] }
  | { type: 'ADD_VOICE_ENTRY'; payload: VoiceEntry }
  | { type: 'REMOVE_VOICE_ENTRY'; payload: string }
  | { type: 'SET_SKIN_CARE_ROUTINE'; payload: SkinCareRoutine }
  | {
      type: 'SET_SKIN_CARE_PROGRESS';
      payload: {
        today: SkinCareDayRecord;
        history: SkinCareDayRecord[];
      };
    }
  | { type: 'SET_SKIN_CARE_HISTORY'; payload: SkinCareDayRecord[] }
  | { type: 'SET_RECENTLY_PLAYED'; payload: RecentlyPlayedTrack[] }
  | { type: 'SET_MUSIC_RECENT_SEARCHES'; payload: string[] };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'INIT':
      return {
        ...state,
        isReady: true,
        user: action.payload.user,
        todayMood: action.payload.todayMood,
        preferences: action.payload.preferences,
        mirrorEntries: action.payload.mirrorEntries,
        voiceEntries: action.payload.voiceEntries,
        skinCareRoutine: action.payload.skinCareRoutine,
        skinCareToday: action.payload.skinCareToday,
        skinCareHistory: action.payload.skinCareHistory,
        recentlyPlayed: action.payload.recentlyPlayed,
        musicRecentSearches: action.payload.musicRecentSearches,
        needsOnboarding: action.payload.needsOnboarding,
      };
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_MOOD':
      return { ...state, todayMood: action.payload };
    case 'SET_PREFERENCES':
      return { ...state, preferences: action.payload };
    case 'COMPLETE_ONBOARDING':
      return {
        ...state,
        user: action.payload,
        needsOnboarding: false,
      };
    case 'SET_MIRROR_ENTRIES':
      return { ...state, mirrorEntries: action.payload };
    case 'ADD_MIRROR_ENTRY':
      return {
        ...state,
        mirrorEntries: [action.payload, ...state.mirrorEntries],
      };
    case 'REMOVE_MIRROR_ENTRY':
      return {
        ...state,
        mirrorEntries: state.mirrorEntries.filter((e) => e.id !== action.payload),
      };
    case 'SET_VOICE_ENTRIES':
      return { ...state, voiceEntries: action.payload };
    case 'ADD_VOICE_ENTRY':
      return {
        ...state,
        voiceEntries: [action.payload, ...state.voiceEntries],
      };
    case 'REMOVE_VOICE_ENTRY':
      return {
        ...state,
        voiceEntries: state.voiceEntries.filter((e) => e.id !== action.payload),
      };
    case 'SET_SKIN_CARE_ROUTINE':
      return { ...state, skinCareRoutine: action.payload };
    case 'SET_SKIN_CARE_PROGRESS':
      return {
        ...state,
        skinCareToday: action.payload.today,
        skinCareHistory: action.payload.history,
      };
    case 'SET_SKIN_CARE_HISTORY':
      return { ...state, skinCareHistory: action.payload };
    case 'SET_RECENTLY_PLAYED':
      return { ...state, recentlyPlayed: action.payload };
    case 'SET_MUSIC_RECENT_SEARCHES':
      return { ...state, musicRecentSearches: action.payload };
    default:
      return state;
  }
}

// ─── Context ─────────────────────────────────────────────

type AppContextValue = AppState & {
  /** Complete first-time setup with user's name. */
  finishOnboarding: (name: string) => Promise<void>;
  /** Select or update today's mood. */
  selectMood: (mood: MoodType) => Promise<void>;
  /** Update the user's display name. */
  changeName: (name: string) => Promise<void>;
  /** Update app preferences. */
  updatePreferences: (prefs: AppPreferences) => Promise<void>;
  /** Add a photo or video memory to My Mirror. */
  addMirrorEntry: (data: {
    type: MirrorMediaType;
    uri: string;
    mood?: MoodType | null;
  }) => Promise<MirrorEntry>;
  /** Remove a memory by ID. */
  removeMirrorEntry: (id: string) => Promise<void>;
  /** Reload all mirror entries from storage. */
  refreshMirrorEntries: () => Promise<void>;
  /** Add a voice note memory to Soft Talk. */
  addVoiceEntry: (data: {
    uri: string;
    durationMs: number;
    mood?: MoodType | null;
    title?: string | null;
  }) => Promise<VoiceEntry>;
  /** Remove a voice note by ID. */
  removeVoiceEntry: (id: string) => Promise<void>;
  /** Reload all voice entries from storage. */
  refreshVoiceEntries: () => Promise<void>;
  /** Seed the default morning + evening ritual. */
  createSkinCareRoutine: () => Promise<void>;
  /** Add a custom ritual step. */
  addSkinCareStep: (data: {
    period: SkinCarePeriod;
    name: string;
    productName?: string | null;
    notes?: string | null;
    category: SkinCareCategory;
  }) => Promise<SkinCareStep | null>;
  /** Update an existing ritual step. */
  updateSkinCareStep: (
    id: string,
    patch: Partial<{
      period: SkinCarePeriod;
      name: string;
      productName: string | null;
      notes: string | null;
      category: SkinCareCategory;
    }>,
  ) => Promise<void>;
  /** Remove a ritual step. */
  deleteSkinCareStep: (id: string) => Promise<void>;
  /** Reorder steps within a morning/evening ritual. */
  reorderSkinCareSteps: (
    period: SkinCarePeriod,
    orderedIds: string[],
  ) => Promise<void>;
  /** Toggle today's completion for a step. */
  toggleSkinCareStep: (stepId: string) => Promise<void>;
  /** Clear today's checkmarks (keeps the ritual). */
  resetTodaySkinCare: () => Promise<void>;
  /** Update reminder preferences (local preference layer only). */
  updateSkinCarePreferences: (reminders: SkinCareReminders) => Promise<void>;
  /** Ensure today's completion matches the calendar day. */
  refreshSkinCareDay: () => Promise<void>;
  /** Record a lightweight recently-played entry (metadata only). */
  recordRecentlyPlayed: (data: {
    id: string;
    title: string;
    artist: string;
    albumImage?: string;
    spotifyUrl?: string;
    categoryId?: MusicCategoryId | null;
  }) => Promise<void>;
  /** Remember a music search query. */
  rememberMusicSearch: (query: string) => Promise<void>;
};

const AppContext = createContext<AppContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  // Load all data on mount — single async call
  useEffect(() => {
    let cancelled = false;

    initializeApp()
      .then((data) => {
        if (!cancelled) {
          dispatch({
            type: 'INIT',
            payload: {
              user: data.profile,
              todayMood: data.todayMood,
              preferences: data.preferences,
              mirrorEntries: data.mirrorEntries,
              voiceEntries: data.voiceEntries,
              skinCareRoutine: data.skinCareRoutine,
              skinCareToday: data.skinCareToday,
              skinCareHistory: data.skinCareHistory,
              recentlyPlayed: data.recentlyPlayed,
              musicRecentSearches: data.musicRecentSearches,
              needsOnboarding: data.needsOnboarding,
            },
          });
        }
      })
      .catch((err) => {
        if (__DEV__) console.warn('[MeTime] Init failed:', err);
        // Still mark as ready so the app is usable
        if (!cancelled) {
          dispatch({
            type: 'INIT',
            payload: {
              user: INITIAL_STATE.user,
              todayMood: null,
              preferences: { ...DEFAULT_PREFERENCES },
              mirrorEntries: [],
              voiceEntries: [],
              skinCareRoutine: INITIAL_STATE.skinCareRoutine,
              skinCareToday: INITIAL_STATE.skinCareToday,
              skinCareHistory: [],
              recentlyPlayed: [],
              musicRecentSearches: [],
              needsOnboarding: true,
            },
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const finishOnboarding = useCallback(async (name: string) => {
    const profile = await completeOnboarding(name);
    dispatch({ type: 'COMPLETE_ONBOARDING', payload: profile });
  }, []);

  const selectMood = useCallback(async (mood: MoodType) => {
    const entry = await saveTodayMood(mood);
    dispatch({ type: 'SET_MOOD', payload: entry });
  }, []);

  const changeName = useCallback(async (name: string) => {
    const updated = await updateProfileName(name);
    dispatch({ type: 'SET_USER', payload: updated });
  }, []);

  const updatePreferences = useCallback(async (prefs: AppPreferences) => {
    await savePreferences(prefs);
    dispatch({ type: 'SET_PREFERENCES', payload: prefs });
  }, []);

  const addMirrorEntry = useCallback(
    async (data: { type: MirrorMediaType; uri: string; mood?: MoodType | null }) => {
      const entry = await saveMirrorEntry(data);
      dispatch({ type: 'ADD_MIRROR_ENTRY', payload: entry });
      return entry;
    },
    [],
  );

  const removeMirrorEntry = useCallback(async (id: string) => {
    await deleteMirrorEntry(id);
    dispatch({ type: 'REMOVE_MIRROR_ENTRY', payload: id });
  }, []);

  const refreshMirrorEntries = useCallback(async () => {
    const entries = await getMirrorEntries();
    dispatch({ type: 'SET_MIRROR_ENTRIES', payload: entries });
  }, []);

  const addVoiceEntry = useCallback(
    async (data: {
      uri: string;
      durationMs: number;
      mood?: MoodType | null;
      title?: string | null;
    }) => {
      const entry = await saveVoiceEntry(data);
      dispatch({ type: 'ADD_VOICE_ENTRY', payload: entry });
      return entry;
    },
    [],
  );

  const removeVoiceEntry = useCallback(async (id: string) => {
    await deleteVoiceEntry(id);
    dispatch({ type: 'REMOVE_VOICE_ENTRY', payload: id });
  }, []);

  const refreshVoiceEntries = useCallback(async () => {
    const entries = await getVoiceEntries();
    dispatch({ type: 'SET_VOICE_ENTRIES', payload: entries });
  }, []);

  const createSkinCareRoutine = useCallback(async () => {
    const { routine, today } = await storageCreateSkinCareRoutine();
    const history = await getSkinCareHistory();
    dispatch({ type: 'SET_SKIN_CARE_ROUTINE', payload: routine });
    dispatch({
      type: 'SET_SKIN_CARE_PROGRESS',
      payload: { today, history },
    });
  }, []);

  const addSkinCareStep = useCallback(
    async (data: {
      period: SkinCarePeriod;
      name: string;
      productName?: string | null;
      notes?: string | null;
      category: SkinCareCategory;
    }) => {
      const { routine, step } = await storageAddSkinCareStep(data);
      dispatch({ type: 'SET_SKIN_CARE_ROUTINE', payload: routine });
      return step;
    },
    [],
  );

  const updateSkinCareStep = useCallback(
    async (
      id: string,
      patch: Partial<{
        period: SkinCarePeriod;
        name: string;
        productName: string | null;
        notes: string | null;
        category: SkinCareCategory;
      }>,
    ) => {
      const routine = await storageUpdateSkinCareStep(id, patch);
      dispatch({ type: 'SET_SKIN_CARE_ROUTINE', payload: routine });
    },
    [],
  );

  const deleteSkinCareStep = useCallback(async (id: string) => {
    const { routine, today, history } = await storageDeleteSkinCareStep(id);
    dispatch({ type: 'SET_SKIN_CARE_ROUTINE', payload: routine });
    dispatch({
      type: 'SET_SKIN_CARE_PROGRESS',
      payload: { today, history },
    });
  }, []);

  const reorderSkinCareSteps = useCallback(
    async (period: SkinCarePeriod, orderedIds: string[]) => {
      const routine = await storageReorderSkinCareSteps(period, orderedIds);
      dispatch({ type: 'SET_SKIN_CARE_ROUTINE', payload: routine });
    },
    [],
  );

  const toggleSkinCareStep = useCallback(async (stepId: string) => {
    const { today, history } = await storageToggleSkinCareStep(stepId);
    dispatch({
      type: 'SET_SKIN_CARE_PROGRESS',
      payload: { today, history },
    });
  }, []);

  const resetTodaySkinCare = useCallback(async () => {
    const { today, history } = await storageResetTodaySkinCare();
    dispatch({
      type: 'SET_SKIN_CARE_PROGRESS',
      payload: { today, history },
    });
  }, []);

  const updateSkinCarePreferences = useCallback(
    async (reminders: SkinCareReminders) => {
      const routine = await storageUpdateSkinCareReminders(reminders);
      dispatch({ type: 'SET_SKIN_CARE_ROUTINE', payload: routine });
    },
    [],
  );

  const refreshSkinCareDay = useCallback(async () => {
    const [today, history] = await Promise.all([
      getSkinCareToday(),
      getSkinCareHistory(),
    ]);
    dispatch({
      type: 'SET_SKIN_CARE_PROGRESS',
      payload: { today, history },
    });
  }, []);

  const recordRecentlyPlayed = useCallback(
    async (data: {
      id: string;
      title: string;
      artist: string;
      albumImage?: string;
      spotifyUrl?: string;
      categoryId?: MusicCategoryId | null;
    }) => {
      const list = await storageAddRecentlyPlayedTrack(data);
      dispatch({ type: 'SET_RECENTLY_PLAYED', payload: list });
    },
    [],
  );

  const rememberMusicSearch = useCallback(async (query: string) => {
    const list = await storageAddMusicRecentSearch(query);
    dispatch({ type: 'SET_MUSIC_RECENT_SEARCHES', payload: list });
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      ...state,
      finishOnboarding,
      selectMood,
      changeName,
      updatePreferences,
      addMirrorEntry,
      removeMirrorEntry,
      refreshMirrorEntries,
      addVoiceEntry,
      removeVoiceEntry,
      refreshVoiceEntries,
      createSkinCareRoutine,
      addSkinCareStep,
      updateSkinCareStep,
      deleteSkinCareStep,
      reorderSkinCareSteps,
      toggleSkinCareStep,
      resetTodaySkinCare,
      updateSkinCarePreferences,
      refreshSkinCareDay,
      recordRecentlyPlayed,
      rememberMusicSearch,
    }),
    [
      state,
      finishOnboarding,
      selectMood,
      changeName,
      updatePreferences,
      addMirrorEntry,
      removeMirrorEntry,
      refreshMirrorEntries,
      addVoiceEntry,
      removeVoiceEntry,
      refreshVoiceEntries,
      createSkinCareRoutine,
      addSkinCareStep,
      updateSkinCareStep,
      deleteSkinCareStep,
      reorderSkinCareSteps,
      toggleSkinCareStep,
      resetTodaySkinCare,
      updateSkinCarePreferences,
      refreshSkinCareDay,
      recordRecentlyPlayed,
      rememberMusicSearch,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// ─── Hook ────────────────────────────────────────────────

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within <AppProvider>');
  }
  return ctx;
}
