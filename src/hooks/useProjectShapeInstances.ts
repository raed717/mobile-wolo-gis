import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  GeoJsonFeature,
  ShapeStats,
  ShapeStyleDefinition,
  ObjNameFilterItem,
} from '../types/shapeInstance.types';
import { shapeInstanceService } from '../services/api/shapeInstanceService';
import { shapeService } from '../services/api/shapeService';
import { Shape } from '../types/shape.types';

export const getFeatureObjName = (
  f: GeoJsonFeature,
  shapesCatalog?: Shape[]
): string => {
  const p = f.properties;
  if (p) {
    if (p['Obj Name']) return String(p['Obj Name']).trim();
    if (p['obj Name']) return String(p['obj Name']).trim();
    if (p['obj_name']) return String(p['obj_name']).trim();
    if (p['name']) return String(p['name']).trim();
    if (p['Name']) return String(p['Name']).trim();
  }
  if (f.shapeId && shapesCatalog) {
    const found = shapesCatalog.find((s) => s.id === f.shapeId);
    if (found?.name) return found.name.trim();
  }
  return 'General / Unnamed';
};

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

  // Filter states
  const [filterCategory, setFilterCategory] = useState<
    'ALL' | 'POLYGON' | 'LINE' | 'POINT'
  >('ALL');
  const [showImported, setShowImported] = useState<boolean>(true);
  const [showNative, setShowNative] = useState<boolean>(true);
  const [selectedObjNames, setSelectedObjNames] = useState<string[]>([]);
  const [hasUserModifiedObjFilters, setHasUserModifiedObjFilters] =
    useState<boolean>(false);

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
        console.warn(
          '[useProjectShapeInstances] Could not load shapes catalog for styling:',
          e
        );
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
        attrs.find((a) => a.name?.toLowerCase() === name.toLowerCase())
          ?.defaultValue;

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

      const items = collection.features || [];
      setFeatures(items);
      setStats(newStats);

      // Collect all unique Obj Names to initialize selection
      const allNamesSet = new Set<string>();
      items.forEach((f) => {
        allNamesSet.add(getFeatureObjName(f, shapesCatalog));
      });
      setSelectedObjNames(Array.from(allNamesSet));
      setHasUserModifiedObjFilters(false);
    } catch (err: any) {
      console.error('[useProjectShapeInstances] Error:', err);
      setError(err?.message || 'Failed to load project shape instances');
    } finally {
      setIsLoading(false);
    }
  }, [projectId, enabled, shapesCatalog]);

  useEffect(() => {
    loadInstances();
  }, [loadInstances]);

  // Group unique Obj Names by geometry type with counts & colors
  const objNamesByCategory = useMemo(() => {
    const countsMap: Record<
      string,
      { count: number; geometryType: 'POLYGON' | 'LINE' | 'POINT'; color?: string }
    > = {};

    features.forEach((f) => {
      const name = getFeatureObjName(f, shapesCatalog);
      const gType = f.geometry?.type?.toUpperCase() || '';
      const geomType: 'POLYGON' | 'LINE' | 'POINT' = gType.includes('POLYGON')
        ? 'POLYGON'
        : gType.includes('LINE')
        ? 'LINE'
        : 'POINT';

      if (!countsMap[name]) {
        // Resolve color
        const style =
          (f.shapeId && stylesMap.byId[f.shapeId]) ||
          stylesMap.byName[name.toLowerCase()] ||
          null;

        const defaultColor =
          geomType === 'POLYGON'
            ? '#ff9c5c'
            : geomType === 'LINE'
            ? '#4ade80'
            : '#38bdf8';

        countsMap[name] = {
          count: 0,
          geometryType: geomType,
          color: style?.fillColor || style?.strokeColor || defaultColor,
        };
      }
      countsMap[name].count++;
    });

    const allList: ObjNameFilterItem[] = [];
    const polygonList: ObjNameFilterItem[] = [];
    const lineList: ObjNameFilterItem[] = [];
    const pointList: ObjNameFilterItem[] = [];

    Object.entries(countsMap).forEach(([name, meta]) => {
      const item: ObjNameFilterItem = {
        name,
        count: meta.count,
        geometryType: meta.geometryType,
        color: meta.color,
      };
      allList.push(item);
      if (meta.geometryType === 'POLYGON') polygonList.push(item);
      else if (meta.geometryType === 'LINE') lineList.push(item);
      else if (meta.geometryType === 'POINT') pointList.push(item);
    });

    // Sort alphabetically
    const sortFn = (a: ObjNameFilterItem, b: ObjNameFilterItem) =>
      a.name.localeCompare(b.name);

    return {
      ALL: allList.sort(sortFn),
      POLYGON: polygonList.sort(sortFn),
      LINE: lineList.sort(sortFn),
      POINT: pointList.sort(sortFn),
    };
  }, [features, shapesCatalog, stylesMap]);

  // Toggle individual Obj Name selection
  const toggleObjName = useCallback((name: string) => {
    setHasUserModifiedObjFilters(true);
    setSelectedObjNames((prev) => {
      if (prev.includes(name)) {
        return prev.filter((n) => n !== name);
      } else {
        return [...prev, name];
      }
    });
  }, []);

  // Select all or specific names
  const selectAllObjNames = useCallback((namesToSelect?: string[]) => {
    setHasUserModifiedObjFilters(true);
    if (namesToSelect && namesToSelect.length > 0) {
      setSelectedObjNames((prev) => Array.from(new Set([...prev, ...namesToSelect])));
    } else {
      // Select all in project
      const allNames = objNamesByCategory.ALL.map((item) => item.name);
      setSelectedObjNames(allNames);
      setHasUserModifiedObjFilters(false);
    }
  }, [objNamesByCategory]);

  // Deselect all or specific category names
  const deselectObjNames = useCallback((namesToDeselect?: string[]) => {
    setHasUserModifiedObjFilters(true);
    if (namesToDeselect && namesToDeselect.length > 0) {
      const toRemove = new Set(namesToDeselect);
      setSelectedObjNames((prev) => prev.filter((n) => !toRemove.has(n)));
    } else {
      setSelectedObjNames([]);
    }
  }, []);

  // Filter features according to active user filters (origin, geometry, objName)
  const filteredFeatures = useMemo(() => {
    return features.filter((f) => {
      // 1. Origin filter
      if (f.isImported && !showImported) return false;
      if (!f.isImported && !showNative) return false;

      // 2. Geometry category filter
      const gType = f.geometry?.type?.toUpperCase() || '';
      if (filterCategory !== 'ALL') {
        if (!gType.includes(filterCategory)) return false;
      }

      // 3. Object Name filter
      const name = getFeatureObjName(f, shapesCatalog);
      if (!selectedObjNames.includes(name)) {
        return false;
      }

      return true;
    });
  }, [
    features,
    filterCategory,
    showImported,
    showNative,
    selectedObjNames,
    shapesCatalog,
  ]);

  const allAvailableObjNames = useMemo(
    () => objNamesByCategory.ALL.map((item) => item.name),
    [objNamesByCategory]
  );

  const hasObjNameFilter =
    hasUserModifiedObjFilters &&
    selectedObjNames.length < allAvailableObjNames.length;

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
    // Obj Name filtering
    objNamesByCategory,
    selectedObjNames,
    toggleObjName,
    selectAllObjNames,
    deselectObjNames,
    hasObjNameFilter,
  };
}

