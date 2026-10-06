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
  JournalDraft,
  JournalEntry,
  JournalPhoto,
  MirrorEntry,
  MirrorMediaType,
  MoodEntry,
  MoodType,
  MusicCategoryId,
  PrivateNote,
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
  clearJournalDraft as storageClearJournalDraft,
  completeOnboarding,
  createSkinCareRoutine as storageCreateSkinCareRoutine,
  deleteJournalEntry as storageDeleteJournalEntry,
  deleteJournalPhoto as storageDeleteJournalPhoto,
  deleteMirrorEntry,
  deletePrivateNote as storageDeletePrivateNote,
  deleteSkinCareStep as storageDeleteSkinCareStep,
  deleteVoiceEntry,
  getJournalDraft as storageGetJournalDraft,
  getJournalEntries,
  getJournalPhotos,
  getMirrorEntries,
  getPrivateNotes,
  getSkinCareHistory,
  getSkinCareToday,
  getVoiceEntries,
  initializeApp,
  reorderSkinCareSteps as storageReorderSkinCareSteps,
  resetTodaySkinCare as storageResetTodaySkinCare,
  saveJournalDraft as storageSaveJournalDraft,
  saveJournalEntry,
  saveJournalPhoto as storageSaveJournalPhoto,
  saveMirrorEntry,
  savePreferences,
  savePrivateNote as storageSavePrivateNote,
  saveTodayMood,
  saveVoiceEntry,
  toggleSkinCareStep as storageToggleSkinCareStep,
  updateJournalEntry as storageUpdateJournalEntry,
  updatePrivateNote as storageUpdatePrivateNote,
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
  journalEntries: JournalEntry[];
  journalPhotos: JournalPhoto[];
  privateNotes: PrivateNote[];
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
  journalEntries: [],
  journalPhotos: [],
  privateNotes: [],
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
        journalEntries: JournalEntry[];
        journalPhotos: JournalPhoto[];
        privateNotes: PrivateNote[];
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
  | { type: 'SET_MUSIC_RECENT_SEARCHES'; payload: string[] }
  | { type: 'SET_JOURNAL_ENTRIES'; payload: JournalEntry[] }
  | { type: 'ADD_JOURNAL_ENTRY'; payload: JournalEntry }
  | { type: 'UPDATE_JOURNAL_ENTRY'; payload: JournalEntry }
  | { type: 'REMOVE_JOURNAL_ENTRY'; payload: string }
  | { type: 'SET_JOURNAL_PHOTOS'; payload: JournalPhoto[] }
  | { type: 'ADD_JOURNAL_PHOTO'; payload: JournalPhoto }
  | { type: 'REMOVE_JOURNAL_PHOTO'; payload: string }
  | { type: 'SET_PRIVATE_NOTES'; payload: PrivateNote[] }
  | { type: 'ADD_PRIVATE_NOTE'; payload: PrivateNote }
  | { type: 'UPDATE_PRIVATE_NOTE'; payload: PrivateNote }
  | { type: 'REMOVE_PRIVATE_NOTE'; payload: string };

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
        journalEntries: action.payload.journalEntries,
        journalPhotos: action.payload.journalPhotos,
        privateNotes: action.payload.privateNotes,
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
    case 'SET_JOURNAL_ENTRIES':
      return { ...state, journalEntries: action.payload };
    case 'ADD_JOURNAL_ENTRY':
      return {
        ...state,
        journalEntries: [action.payload, ...state.journalEntries.filter((e) => e.id !== action.payload.id)],
      };
    case 'UPDATE_JOURNAL_ENTRY':
      return {
        ...state,
        journalEntries: state.journalEntries.map((e) => (e.id === action.payload.id ? action.payload : e)),
      };
    case 'REMOVE_JOURNAL_ENTRY':
      return {
        ...state,
        journalEntries: state.journalEntries.filter((e) => e.id !== action.payload),
      };
    case 'SET_JOURNAL_PHOTOS':
      return { ...state, journalPhotos: action.payload };
    case 'ADD_JOURNAL_PHOTO':
      return {
        ...state,
        journalPhotos: [action.payload, ...state.journalPhotos.filter((p) => p.id !== action.payload.id)],
      };
    case 'REMOVE_JOURNAL_PHOTO':
      return {
        ...state,
        journalPhotos: state.journalPhotos.filter((p) => p.id !== action.payload),
      };
    case 'SET_PRIVATE_NOTES':
      return { ...state, privateNotes: action.payload };
    case 'ADD_PRIVATE_NOTE':
      return {
        ...state,
        privateNotes: [action.payload, ...state.privateNotes.filter((n) => n.id !== action.payload.id)],
      };
    case 'UPDATE_PRIVATE_NOTE':
      return {
        ...state,
        privateNotes: state.privateNotes.map((n) => (n.id === action.payload.id ? action.payload : n)),
      };
    case 'REMOVE_PRIVATE_NOTE':
      return {
        ...state,
        privateNotes: state.privateNotes.filter((n) => n.id !== action.payload),
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
  /** Add a journal entry to Write. */
  addJournalEntry: (data: {
    title?: string | null;
    content: string;
    mood?: MoodType | null;
    photoIds?: string[];
  }) => Promise<JournalEntry>;
  /** Update an existing journal entry. */
  updateJournalEntry: (
    id: string,
    updates: Partial<{
      title: string | null;
      content: string;
      mood: MoodType | null;
      photoIds: string[];
    }>,
  ) => Promise<JournalEntry | null>;
  /** Delete a journal entry and its attached photos. */
  deleteJournalEntry: (id: string) => Promise<void>;
  /** Refresh journal entries list from storage. */
  refreshJournalEntries: () => Promise<void>;
  /** Add a standalone journal photo to Write. */
  addJournalPhoto: (data: {
    uri: string;
    caption?: string | null;
    entryId?: string | null;
  }) => Promise<JournalPhoto>;
  /** Delete a journal photo. */
  deleteJournalPhoto: (id: string) => Promise<void>;
  /** Refresh journal photos list from storage. */
  refreshJournalPhotos: () => Promise<void>;
  /** Add a private note. */
  addPrivateNote: (content: string) => Promise<PrivateNote>;
  /** Update a private note. */
  updatePrivateNote: (id: string, content: string) => Promise<PrivateNote | null>;
  /** Delete a private note. */
  deletePrivateNote: (id: string) => Promise<void>;
  /** Refresh private notes list from storage. */
  refreshPrivateNotes: () => Promise<void>;
  /** Save journal editor draft. */
  saveJournalDraft: (draft: {
    title: string;
    content: string;
    mood?: MoodType | null;
    photoUris?: string[];
  }) => Promise<void>;
  /** Get journal editor draft. */
  getJournalDraft: () => Promise<JournalDraft | null>;
  /** Clear journal editor draft. */
  clearJournalDraft: () => Promise<void>;
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
              journalEntries: data.journalEntries,
              journalPhotos: data.journalPhotos,
              privateNotes: data.privateNotes,
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
              journalEntries: [],
              journalPhotos: [],
              privateNotes: [],
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

  // ─── Journal Actions ─────────────────────────────────────

  const addJournalEntry = useCallback(
    async (data: {
      title?: string | null;
      content: string;
      mood?: MoodType | null;
      photoIds?: string[];
    }) => {
      const entry = await saveJournalEntry(data);
      dispatch({ type: 'ADD_JOURNAL_ENTRY', payload: entry });
      // Clear draft on successful save
      await storageClearJournalDraft();
      return entry;
    },
    [],
  );

  const updateJournalEntry = useCallback(
    async (
      id: string,
      updates: Partial<{
        title: string | null;
        content: string;
        mood: MoodType | null;
        photoIds: string[];
      }>,
    ) => {
      const entry = await storageUpdateJournalEntry(id, updates);
      if (entry) {
        dispatch({ type: 'UPDATE_JOURNAL_ENTRY', payload: entry });
        await storageClearJournalDraft();
      }
      return entry;
    },
    [],
  );

  const deleteJournalEntry = useCallback(async (id: string) => {
    await storageDeleteJournalEntry(id);
    dispatch({ type: 'REMOVE_JOURNAL_ENTRY', payload: id });
    const photos = await getJournalPhotos();
    dispatch({ type: 'SET_JOURNAL_PHOTOS', payload: photos });
  }, []);

  const refreshJournalEntries = useCallback(async () => {
    const entries = await getJournalEntries();
    dispatch({ type: 'SET_JOURNAL_ENTRIES', payload: entries });
  }, []);

  const addJournalPhoto = useCallback(
    async (data: { uri: string; caption?: string | null; entryId?: string | null }) => {
      const photo = await storageSaveJournalPhoto(data);
      dispatch({ type: 'ADD_JOURNAL_PHOTO', payload: photo });
      return photo;
    },
    [],
  );

  const deleteJournalPhoto = useCallback(async (id: string) => {
    await storageDeleteJournalPhoto(id);
    dispatch({ type: 'REMOVE_JOURNAL_PHOTO', payload: id });
    // Also refresh entries in case this photo was attached to one
    const entries = await getJournalEntries();
    dispatch({ type: 'SET_JOURNAL_ENTRIES', payload: entries });
  }, []);

  const refreshJournalPhotos = useCallback(async () => {
    const photos = await getJournalPhotos();
    dispatch({ type: 'SET_JOURNAL_PHOTOS', payload: photos });
  }, []);

  const addPrivateNote = useCallback(async (content: string) => {
    const note = await storageSavePrivateNote(content);
    dispatch({ type: 'ADD_PRIVATE_NOTE', payload: note });
    return note;
  }, []);

  const updatePrivateNote = useCallback(async (id: string, content: string) => {
    const note = await storageUpdatePrivateNote(id, content);
    if (note) {
      dispatch({ type: 'UPDATE_PRIVATE_NOTE', payload: note });
    }
    return note;
  }, []);

  const deletePrivateNote = useCallback(async (id: string) => {
    await storageDeletePrivateNote(id);
    dispatch({ type: 'REMOVE_PRIVATE_NOTE', payload: id });
  }, []);

  const refreshPrivateNotes = useCallback(async () => {
    const notes = await getPrivateNotes();
    dispatch({ type: 'SET_PRIVATE_NOTES', payload: notes });
  }, []);

  const saveJournalDraft = useCallback(
    async (draft: {
      title: string;
      content: string;
      mood?: MoodType | null;
      photoUris?: string[];
    }) => {
      await storageSaveJournalDraft(draft);
    },
    [],
  );

  const getJournalDraft = useCallback(async () => {
    return storageGetJournalDraft();
  }, []);

  const clearJournalDraft = useCallback(async () => {
    await storageClearJournalDraft();
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
      addJournalEntry,
      updateJournalEntry,
      deleteJournalEntry,
      refreshJournalEntries,
      addJournalPhoto,
      deleteJournalPhoto,
      refreshJournalPhotos,
      addPrivateNote,
      updatePrivateNote,
      deletePrivateNote,
      refreshPrivateNotes,
      saveJournalDraft,
      getJournalDraft,
      clearJournalDraft,
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
      addJournalEntry,
      updateJournalEntry,
      deleteJournalEntry,
      refreshJournalEntries,
      addJournalPhoto,
      deleteJournalPhoto,
      refreshJournalPhotos,
      addPrivateNote,
      updatePrivateNote,
      deletePrivateNote,
      refreshPrivateNotes,
      saveJournalDraft,
      getJournalDraft,
      clearJournalDraft,
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
