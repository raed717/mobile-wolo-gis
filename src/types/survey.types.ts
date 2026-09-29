export interface SurveyCaptureItem {
  id: string;
  projectId: number;
  imageUri: string;
  latitude: number;
  longitude: number;
  altitude?: number | null;
  accuracy?: number | null;
  timestamp: string;
  shapeId: number;
  shapeName: string;
  shapeType: string;
  shapeStyle?: {
    fillColor: string;
    strokeColor: string;
    opacity?: number;
    strokeWidth?: number;
  };
  attributeValues: Record<string, string>;
  notes?: string;
  // Raw GPS fix, kept when the user manually corrects latitude/longitude
  gpsLatitude?: number;
  gpsLongitude?: number;
  isPositionAdjusted?: boolean;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  altitude?: number | null;
  accuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
  timestamp: number;
}
