import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../config/constants';

export interface RecentProjectEntry {
  projectId: number;
  viewedAt: number;
}

const MAX_RECENT_PROJECTS = 10;
const STORAGE_BASE_KEY = STORAGE_KEYS.RECENT_PROJECTS || 'smartown_recent_projects';

class RecentProjectsCache {
  // Layer 1: Synchronous In-Memory RAM Cache for 0ms UI reactivity
  private memoryCache: RecentProjectEntry[] = [];
  private isLoaded: boolean = false;
  private currentUserId: number | string = 'guest';
  private listeners: Set<() => void> = new Set();
  private saveTimeout: any = null;

  private getStorageKey(userId?: number | string): string {
    const uid = userId !== undefined ? userId : this.currentUserId;
    return `${STORAGE_BASE_KEY}_user_${uid}`;
  }

  /**
   * Initialize in-memory cache from persistent AsyncStorage
   */
  public async init(userId?: number | string): Promise<RecentProjectEntry[]> {
    if (userId !== undefined) {
      this.currentUserId = userId;
    }
    const key = this.getStorageKey();
    try {
      const raw = await AsyncStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.memoryCache = parsed.filter(
            (item) =>
              item &&
              typeof item.projectId === 'number' &&
              !isNaN(item.projectId) &&
              typeof item.viewedAt === 'number'
          );
        } else {
          this.memoryCache = [];
        }
      } else {
        this.memoryCache = [];
      }
    } catch (e) {
      console.warn('Failed to load recent projects from cache storage:', e);
      this.memoryCache = [];
    } finally {
      this.isLoaded = true;
      this.notifyListeners();
    }
    return this.memoryCache;
  }

  /**
   * Synchronous memory cache read (0 ms latency)
   */
  public getRecentEntriesSync(): RecentProjectEntry[] {
    return this.memoryCache;
  }

  /**
   * Async get ensuring initialization has happened
   */
  public async getRecentEntries(): Promise<RecentProjectEntry[]> {
    if (!this.isLoaded) {
      await this.init();
    }
    return this.memoryCache;
  }

  /**
   * Mark a project as recently viewed. Moves it to the top (index 0).
   */
  public async addRecentProject(projectId: number, userId?: number | string): Promise<void> {
    if (typeof projectId !== 'number' || isNaN(projectId)) return;

    if (userId !== undefined && userId !== this.currentUserId) {
      this.currentUserId = userId;
    }

    const now = Date.now();
    // Remove previous entry if it existed and prepend to the top
    const remaining = this.memoryCache.filter((item) => item.projectId !== projectId);
    this.memoryCache = [{ projectId, viewedAt: now }, ...remaining].slice(0, MAX_RECENT_PROJECTS);
    this.isLoaded = true;

    // Immediately notify subscribers so UI updates synchronously
    this.notifyListeners();

    // Schedule debounced persistent save
    this.scheduleSave();
  }

  /**
   * Remove a single project from recent cache
   */
  public async removeRecentProject(projectId: number): Promise<void> {
    this.memoryCache = this.memoryCache.filter((item) => item.projectId !== projectId);
    this.notifyListeners();
    this.scheduleSave();
  }

  /**
   * Clear all recent projects for the current user
   */
  public async clearRecentProjects(): Promise<void> {
    this.memoryCache = [];
    this.notifyListeners();
    try {
      const key = this.getStorageKey();
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.warn('Failed to clear recent projects cache:', e);
    }
  }

  public isRecent(projectId: number): boolean {
    return this.memoryCache.some((item) => item.projectId === projectId);
  }

  public getRecentViewedAt(projectId: number): number | null {
    const entry = this.memoryCache.find((item) => item.projectId === projectId);
    return entry ? entry.viewedAt : null;
  }

  /**
   * Observer subscription for real-time reactivity
   */
  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (e) {
        console.error('Error in recent projects cache listener:', e);
      }
    });
  }

  private scheduleSave(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(async () => {
      try {
        const key = this.getStorageKey();
        await AsyncStorage.setItem(key, JSON.stringify(this.memoryCache));
      } catch (e) {
        console.warn('Failed to persist recent projects cache to AsyncStorage:', e);
      }
    }, 150);
  }
}

export const recentProjectsCache = new RecentProjectsCache();
