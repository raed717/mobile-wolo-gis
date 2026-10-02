/**
 * synced: stored on the backend (survey_image + shape instance)
 * pending: saved on the device, waiting for upload
 * uploading: upload in progress (runtime only)
 * failed: last upload attempt failed, will be retried
 */
export type SurveySyncStatus = 'synced' | 'pending' | 'uploading' | 'failed';

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
  /** Missing on captures saved before backend sync existed: treated as pending */
  syncStatus?: SurveySyncStatus;
  syncError?: string;
  /** survey_image id on the backend */
  remoteId?: number;
  shapeInstanceId?: string;
  imageMimeType?: string;
  createdByName?: string;
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
