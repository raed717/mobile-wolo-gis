import { useState, useEffect, useCallback, useMemo } from 'react';
import { Project, ProjectFilterType } from '../types/project.types';
import { projectService } from '../services/api/projectService';
import { useAuth } from '../context/AuthContext';
import { useRecentProjects } from './useRecentProjects';

export function useProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<ProjectFilterType>('all');

  const isAdmin = user?.role === 'Admin';
  const userOrgId = user?.organizationId;

  // Cache Memory: Recently viewed projects hook
  const {
    recentProjects,
    recentCount,
    markAsViewed,
    clearRecent,
    isRecent,
    getRecentViewedAt,
  } = useRecentProjects(projects);

  const fetchProjects = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        let data: Project[] = [];
        if (isAdmin) {
          // Admin can see all projects
          data = await projectService.getAllProjects();
        } else if (userOrgId) {
          // Normal user sees projects of their organization only
          data = await projectService.getProjectsByOrganization(userOrgId);
        } else {
          // Fallback if organizationId is not yet assigned
          data = [];
        }

        setProjects(Array.isArray(data) ? data : []);
      } catch (err: any) {
        console.error('Error fetching projects:', err);
        const errorMsg =
          err.response?.data?.message ||
          err.message ||
          'Failed to load projects. Please pull down to retry.';
        setError(errorMsg);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [isAdmin, userOrgId]
  );

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const filteredProjects = useMemo(() => {
    const list = projects.filter((project) => {
      // 1. Search text filter
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        project.name?.toLowerCase().includes(query) ||
        project.description?.toLowerCase().includes(query) ||
        project.location?.toLowerCase().includes(query) ||
        project.organization?.name?.toLowerCase().includes(query);

      if (!matchesSearch) return false;

      // 2. Tab filter
      if (activeFilter === 'recent') {
        return isRecent(project.id);
      }
      if (activeFilter === 'organization' && userOrgId) {
        return project.organizationId === userOrgId;
      }
      if (activeFilter === 'public') {
        return !project.isPrivate;
      }
      if (activeFilter === 'private') {
        return project.isPrivate;
      }

      return true;
    });

    // If viewing recent tab, strictly sort by last viewed time descending
    if (activeFilter === 'recent') {
      return list.sort((a, b) => {
        const timeA = getRecentViewedAt(a.id) || 0;
        const timeB = getRecentViewedAt(b.id) || 0;
        return timeB - timeA;
      });
    }

    return list;
  }, [projects, searchQuery, activeFilter, userOrgId, isRecent, getRecentViewedAt]);

  return {
    projects: filteredProjects,
    rawProjects: projects,
    recentProjects,
    recentCount,
    allProjectsCount: projects.length,
    isLoading,
    isRefreshing,
    error,
    isAdmin,
    userOrgId,
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    markAsViewed,
    clearRecent,
    isRecent,
    getRecentViewedAt,
    refresh: () => fetchProjects(true),
    retry: () => fetchProjects(false),
  };
}
