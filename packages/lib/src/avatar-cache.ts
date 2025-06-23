// アバター画像キャッシュ管理
export interface AvatarCacheEntry {
  url: string;
  timestamp: number;
  storageId?: string;
  userId: string;
  size?: number;
}

export interface AvatarCacheConfig {
  maxEntries: number;
  maxAgeMs: number;
  maxSizeBytes: number;
}

// デフォルト設定
const DEFAULT_CONFIG: AvatarCacheConfig = {
  maxEntries: 100, // 最大100ユーザー分のアバター
  maxAgeMs: 24 * 60 * 60 * 1000, // 24時間
  maxSizeBytes: 50 * 1024 * 1024, // 50MB
};

/**
 * アバターキャッシュ管理クラス
 * Web/Mobile 共通の実装
 */
export class AvatarCache {
  private cache = new Map<string, AvatarCacheEntry>();
  private config: AvatarCacheConfig;
  private totalSize = 0;

  constructor(config: Partial<AvatarCacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.loadFromStorage();
  }

  /**
   * アバターURLをキャッシュに保存
   */
  async set(userId: string, entry: Omit<AvatarCacheEntry, 'userId' | 'timestamp'>): Promise<void> {
    const cacheEntry: AvatarCacheEntry = {
      ...entry,
      userId,
      timestamp: Date.now(),
    };

    // 既存エントリがある場合は削除
    if (this.cache.has(userId)) {
      await this.delete(userId);
    }

    // サイズ制限チェック
    const entrySize = this.estimateEntrySize(cacheEntry);
    if (entrySize > this.config.maxSizeBytes) {
      return;
    }

    // 容量制限チェック
    while (
      this.cache.size >= this.config.maxEntries ||
      this.totalSize + entrySize > this.config.maxSizeBytes
    ) {
      await this.evictOldest();
    }

    this.cache.set(userId, cacheEntry);
    this.totalSize += entrySize;

    await this.saveToStorage();
  }

  /**
   * キャッシュからアバターURLを取得
   */
  async get(userId: string): Promise<string | null> {
    const entry = this.cache.get(userId);

    if (!entry) {
      return null;
    }

    // 期限切れチェック
    if (Date.now() - entry.timestamp > this.config.maxAgeMs) {
      await this.delete(userId);
      return null;
    }

    return entry.url;
  }

  /**
   * キャッシュエントリを削除
   */
  async delete(userId: string): Promise<void> {
    const entry = this.cache.get(userId);
    if (entry) {
      this.cache.delete(userId);
      this.totalSize -= this.estimateEntrySize(entry);
      await this.saveToStorage();
    }
  }

  /**
   * キャッシュ全体をクリア
   */
  async clear(): Promise<void> {
    this.cache.clear();
    this.totalSize = 0;
    await this.saveToStorage();
  }

  /**
   * 期限切れエントリを削除
   */
  async cleanup(): Promise<void> {
    const now = Date.now();
    const expiredUsers: string[] = [];

    for (const [userId, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.config.maxAgeMs) {
        expiredUsers.push(userId);
      }
    }

    for (const userId of expiredUsers) {
      await this.delete(userId);
    }
  }

  /**
   * キャッシュ統計情報
   */
  getStats() {
    return {
      entryCount: this.cache.size,
      totalSizeBytes: this.totalSize,
      maxEntries: this.config.maxEntries,
      maxSizeBytes: this.config.maxSizeBytes,
      usage: {
        entries: Math.round((this.cache.size / this.config.maxEntries) * 100),
        size: Math.round((this.totalSize / this.config.maxSizeBytes) * 100),
      },
    };
  }

  /**
   * 最も古いエントリを削除
   */
  private async evictOldest(): Promise<void> {
    let oldestUserId: string | null = null;
    let oldestTimestamp = Date.now();

    for (const [userId, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestUserId = userId;
      }
    }

    if (oldestUserId) {
      await this.delete(oldestUserId);
    }
  }

  /**
   * エントリサイズを推定
   */
  private estimateEntrySize(entry: AvatarCacheEntry): number {
    // URL文字列 + メタデータのサイズを推定
    return (
      entry.url.length * 2 + // URL (UTF-16 approximation)
      entry.userId.length * 2 + // userId
      32 + // timestamp and other metadata
      (entry.size ?? 1024) // actual image size estimate
    );
  }

  /**
   * ストレージからキャッシュデータを読み込み
   */
  private async loadFromStorage(): Promise<void> {
    try {
      if (typeof window === 'undefined') {
        // Node.js環境では何もしない
        return;
      }

      const cached = localStorage.getItem('smartnippo_avatar_cache');
      if (cached) {
        const data = JSON.parse(cached);
        this.cache = new Map(data.entries);
        this.totalSize = data.totalSize ?? 0;

        // 起動時クリーンアップ
        await this.cleanup();
      }
    } catch {
      this.cache.clear();
      this.totalSize = 0;
    }
  }

  /**
   * キャッシュデータをストレージに保存
   */
  private async saveToStorage(): Promise<void> {
    try {
      if (typeof window === 'undefined') {
        // Node.js環境では何もしない
        return;
      }

      const data = {
        entries: Array.from(this.cache.entries()),
        totalSize: this.totalSize,
        lastSaved: Date.now(),
      };

      localStorage.setItem('smartnippo_avatar_cache', JSON.stringify(data));
    } catch {
      return;
    }
  }
}

// グローバルキャッシュインスタンス
let globalAvatarCache: AvatarCache | null = null;

/**
 * グローバルアバターキャッシュインスタンスを取得
 */
export function getAvatarCache(config?: Partial<AvatarCacheConfig>): AvatarCache {
  globalAvatarCache ??= new AvatarCache(config);
  return globalAvatarCache;
}

/**
 * アバターURL取得（キャッシュ付き）
 */
export async function getCachedAvatarUrl(
  userId: string,
  fetchUrl: () => Promise<string | null>
): Promise<string | null> {
  const cache = getAvatarCache();

  // キャッシュから取得を試行
  const cachedUrl = await cache.get(userId);
  if (cachedUrl) {
    return cachedUrl;
  }

  // キャッシュにない場合は新規取得
  const url = await fetchUrl();
  if (url) {
    await cache.set(userId, { url });
  }

  return url;
}

/**
 * アバターキャッシュを無効化
 */
export async function invalidateAvatarCache(userId: string): Promise<void> {
  const cache = getAvatarCache();
  await cache.delete(userId);
}

/**
 * キャッシュ統計情報を取得
 */
export function getAvatarCacheStats() {
  const cache = getAvatarCache();
  return cache.getStats();
}
