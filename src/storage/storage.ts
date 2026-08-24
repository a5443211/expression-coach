import type {
  ApiConfig,
  TrainingSession,
  WeaknessTag,
} from '../types';

// localStorage 键名
const KEYS = {
  sessions: 'ecc_sessions',
  weakness: 'ecc_weakness',
  apiConfig: 'ecc_api_config',
} as const;

// 安全读取并解析 JSON
function safeRead<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

// 安全写入 JSON
function safeWrite(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    // 存储受限兜底：仅提示失败，最低保障本次会话上下文不丢失（由运行时内存承接）
    console.warn('[storage] 写入失败，可能存储空间受限:', err);
    return false;
  }
}

// ---------- 会话管理 ----------

export function loadSessions(): TrainingSession[] {
  return safeRead<TrainingSession[]>(KEYS.sessions, []);
}

export function saveSessions(sessions: TrainingSession[]): boolean {
  return safeWrite(KEYS.sessions, sessions);
}

export function saveSession(session: TrainingSession): boolean {
  const sessions = loadSessions();
  const idx = sessions.findIndex((s) => s.id === session.id);
  if (idx >= 0) {
    sessions[idx] = session;
  } else {
    sessions.unshift(session);
  }
  return saveSessions(sessions);
}

export function deleteSession(id: string): boolean {
  const sessions = loadSessions().filter((s) => s.id !== id);
  return saveSessions(sessions);
}

export function clearAllSessions(): boolean {
  return saveSessions([]);
}

// ---------- 弱点档案 ----------

export function loadWeaknessTags(): WeaknessTag[] {
  return safeRead<WeaknessTag[]>(KEYS.weakness, []);
}

export function saveWeaknessTags(tags: WeaknessTag[]): boolean {
  return safeWrite(KEYS.weakness, tags);
}

// 合并新提取的弱点标签到档案
export function mergeWeaknessTags(newTags: string[]): WeaknessTag[] {
  const existing = loadWeaknessTags();
  const map = new Map(existing.map((t) => [t.tag, t]));
  const now = Date.now();
  for (const tag of newTags) {
    const item = map.get(tag);
    if (item) {
      item.count += 1;
      item.lastSeen = now;
    } else {
      map.set(tag, { tag, count: 1, lastSeen: now });
    }
  }
  const merged = Array.from(map.values()).sort(
    (a, b) => b.count - a.count || b.lastSeen - a.lastSeen,
  );
  saveWeaknessTags(merged);
  return merged;
}

export function clearWeaknessTags(): boolean {
  return saveWeaknessTags([]);
}

// ---------- API 配置 ----------

const DEFAULT_API_CONFIG: ApiConfig = {
  baseUrl: 'https://api.deepseek.com/v1',
  apiKey: '',
  model: 'deepseek-chat',
};

export function loadApiConfig(): ApiConfig {
  return safeRead<ApiConfig>(KEYS.apiConfig, DEFAULT_API_CONFIG);
}

export function saveApiConfig(config: ApiConfig): boolean {
  return safeWrite(KEYS.apiConfig, config);
}
