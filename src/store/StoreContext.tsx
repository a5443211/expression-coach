import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type {
  ApiConfig,
  AppView,
  TrainingSession,
  WeaknessTag,
} from '../types';
import {
  loadApiConfig,
  loadSessions,
  loadWeaknessTags,
  saveApiConfig,
  saveSession,
  mergeWeaknessTags,
  clearWeaknessTags,
  deleteSession as deleteSessionStorage,
  clearAllSessions,
} from '../storage/storage';

interface StoreValue {
  // 导航
  view: AppView;
  setView: (v: AppView) => void;

  // 当前会话（训练中）
  currentSession: TrainingSession | null;
  setCurrentSession: (s: TrainingSession | null) => void;
  upsertCurrentSession: (patch: Partial<TrainingSession>) => void;

  // 会话列表
  sessions: TrainingSession[];
  refreshSessions: () => void;
  removeSession: (id: string) => void;
  removeAllSessions: () => void;

  // 弱点档案
  weaknessTags: WeaknessTag[];
  addWeaknesses: (tags: string[]) => WeaknessTag[];
  clearWeakness: () => void;

  // API 配置
  apiConfig: ApiConfig;
  updateApiConfig: (c: ApiConfig) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<AppView>('home');
  const [currentSession, setCurrentSessionState] =
    useState<TrainingSession | null>(null);
  const [sessions, setSessions] = useState<TrainingSession[]>(() =>
    loadSessions(),
  );
  const [weaknessTags, setWeaknessTags] = useState<WeaknessTag[]>(() =>
    loadWeaknessTags(),
  );
  const [apiConfig, setApiConfig] = useState<ApiConfig>(() => loadApiConfig());

  // 持久化当前会话
  const persistSession = useCallback((s: TrainingSession) => {
    saveSession(s);
    setSessions(loadSessions());
  }, []);

  const setCurrentSession = useCallback(
    (s: TrainingSession | null) => {
      setCurrentSessionState(s);
      if (s) persistSession(s);
    },
    [persistSession],
  );

  const upsertCurrentSession = useCallback(
    (patch: Partial<TrainingSession>) => {
      setCurrentSessionState((prev) => {
        if (!prev) return prev;
        const next = { ...prev, ...patch, updatedAt: Date.now() };
        persistSession(next);
        return next;
      });
    },
    [persistSession],
  );

  const refreshSessions = useCallback(() => setSessions(loadSessions()), []);

  const removeSession = useCallback((id: string) => {
    deleteSessionStorage(id);
    setSessions(loadSessions());
  }, []);

  const removeAllSessions = useCallback(() => {
    clearAllSessions();
    setSessions([]);
  }, []);

  const addWeaknesses = useCallback((tags: string[]) => {
    const merged = mergeWeaknessTags(tags);
    setWeaknessTags(merged);
    return merged;
  }, []);

  const clearWeakness = useCallback(() => {
    clearWeaknessTags();
    setWeaknessTags([]);
  }, []);

  const updateApiConfig = useCallback((c: ApiConfig) => {
    saveApiConfig(c);
    setApiConfig(c);
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      view,
      setView,
      currentSession,
      setCurrentSession,
      upsertCurrentSession,
      sessions,
      refreshSessions,
      removeSession,
      removeAllSessions,
      weaknessTags,
      addWeaknesses,
      clearWeakness,
      apiConfig,
      updateApiConfig,
    }),
    [
      view,
      currentSession,
      setCurrentSession,
      upsertCurrentSession,
      sessions,
      refreshSessions,
      removeSession,
      removeAllSessions,
      weaknessTags,
      addWeaknesses,
      clearWeakness,
      apiConfig,
      updateApiConfig,
    ],
  );

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
