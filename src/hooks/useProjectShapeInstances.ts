import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  GeoJsonFeature,
  ShapeStats,
  ShapeStyleDefinition,
} from '../types/shapeInstance.types';
import { shapeInstanceService } from '../services/api/shapeInstanceService';
import { shapeService } from '../services/api/shapeService';
import { Shape } from '../types/shape.types';

export function useProjectShapeInstances(projectId?: number, enabled = true) {
  const [features, setFeatures] = useState<GeoJsonFeature[]>([]);
  const [stats, setStats] = useState<ShapeStats>({
    total: 0,
    polygons: 0,
    lines: 0,
    points: 0,
    imported: 0,
    native: 0,
  });
  const [shapesCatalog, setShapesCatalog] = useState<Shape[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'POLYGON' | 'LINE' | 'POINT'>('ALL');
  const [showImported, setShowImported] = useState<boolean>(true);
  const [showNative, setShowNative] = useState<boolean>(true);

  // Fetch shapes catalog to resolve styling by shapeId and shape name
  useEffect(() => {
    let isMounted = true;
    async function loadCatalog() {
      try {
        const shapes = await shapeService.getAllShapes();
        if (isMounted && Array.isArray(shapes)) {
          setShapesCatalog(shapes);
        }
      } catch (e) {
        console.warn('[useProjectShapeInstances] Could not load shapes catalog for styling:', e);
      }
    }
    loadCatalog();
    return () => {
      isMounted = false;
    };
  }, []);

  // Precompute style mappings for lightning-fast lookup during rendering
  const stylesMap = useMemo(() => {
    const byId: Record<number, ShapeStyleDefinition> = {};
    const byName: Record<string, ShapeStyleDefinition> = {};

    shapesCatalog.forEach((shape) => {
      const attrs = shape.attributes || [];
      const getVal = (name: string) =>
        attrs.find((a) => a.name?.toLowerCase() === name.toLowerCase())?.defaultValue;

      const styleDef: ShapeStyleDefinition = {
        fillColor: getVal('Fill Color') || '#ff9c5c',
        strokeColor: getVal('Stroke Col') || '#50246f',
        opacity: parseFloat(getVal('Opacity') || '0.8'),
        fillOpacity: parseFloat(getVal('Opacity') || '0.45'),
        strokeWidth: parseFloat(getVal('Stroke Wid') || '2.5'),
        dashArray: getVal('dashArray') || undefined,
        markShape: getVal('markShape') || 'circle',
      };

      if (shape.id) byId[shape.id] = styleDef;
      if (shape.name) byName[shape.name.toLowerCase().trim()] = styleDef;
    });

    return { byId, byName };
  }, [shapesCatalog]);

  const loadInstances = useCallback(async () => {
    if (!projectId || !enabled) {
      setFeatures([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { collection, stats: newStats } =
        await shapeInstanceService.getAllProjectShapeInstances(projectId);

      setFeatures(collection.features || []);
      setStats(newStats);
    } catch (err: any) {
      console.error('[useProjectShapeInstances] Error:', err);
      setError(err?.message || 'Failed to load project shape instances');
    } finally {
      setIsLoading(false);
    }
  }, [projectId, enabled]);

  useEffect(() => {
    loadInstances();
  }, [loadInstances]);

  // Filter features according to active user filters
  const filteredFeatures = useMemo(() => {
    return features.filter((f) => {
      // 1. Origin filter
      if (f.isImported && !showImported) return false;
      if (!f.isImported && !showNative) return false;

      // 2. Geometry category filter
      if (filterCategory === 'ALL') return true;

      const gType = f.geometry?.type?.toUpperCase() || '';
      return gType.includes(filterCategory);
    });
  }, [features, filterCategory, showImported, showNative]);

  return {
    features: filteredFeatures,
    allFeaturesCount: features.length,
    stats,
    isLoading,
    error,
    refresh: loadInstances,
    filterCategory,
    setFilterCategory,
    showImported,
    setShowImported,
    showNative,
    setShowNative,
    stylesMap,
  };
}
