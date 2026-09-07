import { apiClient } from './apiClient';
import {
  GeoJsonFeature,
  GeoJsonFeatureCollection,
  ImportedShapeInstanceRaw,
  ShapeStats,
} from '../../types/shapeInstance.types';

export const shapeInstanceService = {
  /**
   * Fetch native shape instances created in the web platform for a project.
   * Returns a GeoJSON FeatureCollection.
   */
  async getNativeShapeInstances(projectId: number): Promise<GeoJsonFeatureCollection> {
    try {
      const response = await apiClient.get<GeoJsonFeatureCollection>(
        `/shape-instance/by-project/${projectId}`
      );
      if (response.data && response.data.features) {
        // Tag features as native
        const features = response.data.features.map((f) => ({
          ...f,
          isImported: false,
        }));
        return {
          type: 'FeatureCollection',
          features,
        };
      }
      return { type: 'FeatureCollection', features: [] };
    } catch (error: any) {
      console.warn(`[shapeInstanceService] Error fetching native shapes for project ${projectId}:`, error?.message);
      return { type: 'FeatureCollection', features: [] };
    }
  },

  /**
   * Fetch imported shape instances (from shapefiles / geojson uploads) for a project.
   */
  async getImportedShapeInstances(projectId: number): Promise<ImportedShapeInstanceRaw[]> {
    try {
      const response = await apiClient.get<ImportedShapeInstanceRaw[]>(
        `/imported-shape-instance/by-project/${projectId}`
      );
      return Array.isArray(response.data) ? response.data : [];
    } catch (error: any) {
      console.warn(`[shapeInstanceService] Error fetching imported shapes for project ${projectId}:`, error?.message);
      return [];
    }
  },

  /**
   * Convert imported shapes raw records into standard GeoJSON Features.
   */
  convertImportedToGeoJson(rawItems: ImportedShapeInstanceRaw[]): GeoJsonFeature[] {
    if (!Array.isArray(rawItems)) return [];

    return rawItems
      .filter((item) => item && item.geometry)
      .map((item) => {
        let geometry = item.geometry;
        if (typeof geometry === 'string') {
          try {
            geometry = JSON.parse(geometry);
          } catch (e) {
            console.warn('Failed to parse imported geometry JSON:', e);
          }
        }

        const properties = item.properties || {};

        return {
          type: 'Feature' as const,
          id: item.id,
          shapeId: item.shapeId ?? null,
          geometry: geometry,
          properties: {
            ...properties,
            id: item.id,
            projectId: item.projectId,
            createdAt: item.createdAt,
            createdBy: item.createdBy,
            isImported: true,
          },
          isImported: true,
        };
      });
  },

  /**
   * Fetch both native and imported shapes concurrently, normalize and merge them.
   */
  async getAllProjectShapeInstances(
    projectId: number
  ): Promise<{ collection: GeoJsonFeatureCollection; stats: ShapeStats }> {
    const [nativeRes, importedRes] = await Promise.allSettled([
      this.getNativeShapeInstances(projectId),
      this.getImportedShapeInstances(projectId),
    ]);

    const nativeCollection =
      nativeRes.status === 'fulfilled' ? nativeRes.value : { type: 'FeatureCollection', features: [] };
    const importedList =
      importedRes.status === 'fulfilled' ? importedRes.value : [];

    const importedFeatures = this.convertImportedToGeoJson(importedList);

    const mergedFeatures: GeoJsonFeature[] = [
      ...(nativeCollection.features || []),
      ...importedFeatures,
    ];

    // Compute stats
    let polygons = 0;
    let lines = 0;
    let points = 0;

    mergedFeatures.forEach((f) => {
      const gType = f.geometry?.type?.toUpperCase() || '';
      if (gType.includes('POLYGON')) polygons++;
      else if (gType.includes('LINE')) lines++;
      else if (gType.includes('POINT')) points++;
    });

    const stats: ShapeStats = {
      total: mergedFeatures.length,
      polygons,
      lines,
      points,
      imported: importedFeatures.length,
      native: (nativeCollection.features || []).length,
    };

    return {
      collection: {
        type: 'FeatureCollection',
        features: mergedFeatures,
      },
      stats,
    };
  },
};
