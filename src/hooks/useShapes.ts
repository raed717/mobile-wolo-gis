import { useState, useEffect, useCallback, useMemo } from 'react';
import { Shape, ShapeCategory } from '../types/shape.types';
import { shapeService } from '../services/api/shapeService';
import { useAuth } from '../context/AuthContext';

export function useShapes() {
  const { user } = useAuth();
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<ShapeCategory>('ALL');

  const isAdmin = user?.role === 'Admin';
  const userOrgId = user?.organizationId;

  const fetchShapes = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        let data: Shape[] = [];
        if (isAdmin) {
          data = await shapeService.getAllShapes();
        } else if (userOrgId) {
          data = await shapeService.getShapesByOrgId(userOrgId);
        } else {
          data = [];
        }

        setShapes(Array.isArray(data) ? data : []);
      } catch (err: any) {
        console.error('Error fetching shapes:', err);
        const errorMsg =
          err.response?.data?.message ||
          err.message ||
          'Failed to load shapes. Please pull down to retry.';
        setError(errorMsg);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [isAdmin, userOrgId]
  );

  useEffect(() => {
    fetchShapes();
  }, [fetchShapes]);

  // Helper to extract visual styles from shape attributes
  const getShapeStyle = useCallback((shape: Shape) => {
    const attrs = shape.attributes || [];
    const getVal = (name: string) =>
      attrs.find((a) => a.name?.toLowerCase() === name.toLowerCase())?.defaultValue;

    return {
      fillColor: getVal('Fill Color') || '#ff9c5c',
      strokeColor: getVal('Stroke Col') || '#50246f',
      opacity: parseFloat(getVal('Opacity') || '0.7'),
      strokeWidth: parseFloat(getVal('Stroke Wid') || '2'),
      markShape: getVal('markShape') || 'circle',
    };
  }, []);

  const filteredShapes = useMemo(() => {
    return shapes.filter((shape) => {
      // 1. Search Query Filter
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        shape.name?.toLowerCase().includes(query) ||
        shape.description?.toLowerCase().includes(query) ||
        shape.type?.toLowerCase().includes(query) ||
        shape.attributes?.some((a) => a.name?.toLowerCase().includes(query));

      if (!matchesSearch) return false;

      // 2. Category Filter (POLYGON, LINE, POINT)
      if (activeCategory === 'ALL') return true;

      const normType = shape.type?.toUpperCase() || '';
      return normType.includes(activeCategory);
    });
  }, [shapes, searchQuery, activeCategory]);

  return {
    shapes: filteredShapes,
    allShapesCount: shapes.length,
    isLoading,
    isRefreshing,
    error,
    isAdmin,
    searchQuery,
    setSearchQuery,
    activeCategory,
    setActiveCategory,
    getShapeStyle,
    refresh: () => fetchShapes(true),
    retry: () => fetchShapes(false),
  };
}
