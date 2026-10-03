/**
 * Me Time — App State Provider
 *
 * Lightweight React Context that provides:
 *   - user profile
 *   - current mood
 *   - preferences
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
  UserProfile,
  VoiceEntry,
} from './types';
import { DEFAULT_PREFERENCES } from './types';
import {
  completeOnboarding,
  deleteMirrorEntry,
  deleteVoiceEntry,
  getMirrorEntries,
  getVoiceEntries,
  initializeApp,
  saveMirrorEntry,
  savePreferences,
  saveTodayMood,
  saveVoiceEntry,
  updateProfileName,
} from './storage';

// ─── State Shape ─────────────────────────────────────────

type AppState = {
  isReady: boolean;
  needsOnboarding: boolean;
  user: UserProfile;
  todayMood: MoodEntry | null;
  preferences: AppPreferences;
  mirrorEntries: MirrorEntry[];
  voiceEntries: VoiceEntry[];
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
  | { type: 'REMOVE_VOICE_ENTRY'; payload: string };

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
