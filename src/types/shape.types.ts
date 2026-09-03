export type ShapeCategory = 'ALL' | 'POLYGON' | 'LINE' | 'POINT';

export interface ShapeAttribute {
  id: number;
  type: string;
  name: string;
  defaultValue?: string;
  labelDisplay?: boolean;
  shapeId?: number;
}

export interface Shape {
  id: number;
  name: string;
  description?: string;
  type: string; // 'POLYGON' | 'LINE' | 'POINT' or ShapeType enum
  createdById?: number;
  createdAt: string;
  updatedAt?: string;
  createdByName?: string;
  attributes?: ShapeAttribute[];
  organizations?: any[];
  projects?: any[];
}
