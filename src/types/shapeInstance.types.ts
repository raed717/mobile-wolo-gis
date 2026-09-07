export interface GeoJsonGeometry {
  type: 'Point' | 'LineString' | 'Polygon' | 'MultiPoint' | 'MultiLineString' | 'MultiPolygon' | 'GeometryCollection';
  coordinates: any;
}

export interface GeoJsonFeature {
  type: 'Feature';
  id: string | number;
  shapeId?: number | null;
  geometry: GeoJsonGeometry;
  properties: Record<string, any>;
  attributeMetadata?: Record<string, any>;
  isImported?: boolean;
}

export interface GeoJsonFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJsonFeature[];
}

export interface ImportedShapeInstanceRaw {
  id: number;
  geometry: any;
  properties: Record<string, any> | null;
  projectId: number;
  shapeId?: number | null;
  createdAt: string;
  updatedAt?: string;
  createdBy?: number;
}

export interface ShapeStyleDefinition {
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  opacity?: number;
  fillOpacity?: number;
  dashArray?: string;
  markShape?: string;
}

export interface ShapeStats {
  total: number;
  polygons: number;
  lines: number;
  points: number;
  imported: number;
  native: number;
}
