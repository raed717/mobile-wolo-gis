import { useState, useEffect, useCallback, useMemo } from 'react';
import { recentProjectsCache, RecentProjectEntry } from '../services/cache/recentProjectsCache';
import { useAuth } from '../context/AuthContext';
import { Project } from '../types/project.types';

export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - timestamp) / 1000));

  if (diffSec < 45) return 'Just now';
  if (diffSec < 90) return '1m ago';

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export function useRecentProjects(allProjects: Project[] = []) {
  const { user } = useAuth();
  const userId = user?.id;

  const [entries, setEntries] = useState<RecentProjectEntry[]>(() =>
    recentProjectsCache.getRecentEntriesSync()
  );

  // Initialize and load from storage for this user
  useEffect(() => {
    recentProjectsCache.init(userId).then((loaded) => {
      setEntries([...loaded]);
    });

    const unsubscribe = recentProjectsCache.subscribe(() => {
      setEntries([...recentProjectsCache.getRecentEntriesSync()]);
    });

    return () => {
      unsubscribe();
    };
  }, [userId]);

  const markAsViewed = useCallback(
    (projectId: number) => {
      recentProjectsCache.addRecentProject(projectId, userId);
    },
    [userId]
  );

  const removeRecent = useCallback((projectId: number) => {
    recentProjectsCache.removeRecentProject(projectId);
  }, []);

  const clearRecent = useCallback(() => {
    recentProjectsCache.clearRecentProjects();
  }, []);

  // Map entries to full Project objects, strictly preserving the most recently viewed order
  const recentProjects = useMemo(() => {
    if (!Array.isArray(allProjects) || allProjects.length === 0) return [];
    const projectMap = new Map<number, Project>();
    allProjects.forEach((p) => projectMap.set(p.id, p));

    const result: (Project & { recentViewedAt: number })[] = [];
    entries.forEach((entry) => {
      const project = projectMap.get(entry.projectId);
      if (project) {
        result.push({
          ...project,
          recentViewedAt: entry.viewedAt,
        });
      }
    });
    return result;
  }, [allProjects, entries]);

  const recentProjectIdsSet = useMemo(() => {
    return new Set(entries.map((e) => e.projectId));
  }, [entries]);

  const isRecent = useCallback(
    (projectId: number) => {
      return recentProjectIdsSet.has(projectId);
    },
    [recentProjectIdsSet]
  );

  const getRecentViewedAt = useCallback(
    (projectId: number) => {
      const found = entries.find((e) => e.projectId === projectId);
      return found ? found.viewedAt : null;
    },
    [entries]
  );

  return {
    recentProjects,
    recentEntries: entries,
    recentCount: recentProjects.length,
    markAsViewed,
    removeRecent,
    clearRecent,
    isRecent,
    getRecentViewedAt,
    formatRelativeTime,
  };
}
