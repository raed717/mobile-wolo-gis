import { ImageURISource } from 'react-native';
import { apiClient, apiService } from './apiClient';
import { SurveyCaptureItem } from '../../types/survey.types';

/** Shape returned by the backend /survey endpoints */
interface SurveyResponse {
  id: number;
  shapeInstanceId: string;
  projectId: number;
  shapeId: number | null;
  shapeName: string | null;
  shapeType: string | null;
  latitude: number;
  longitude: number;
  gpsLatitude: number | null;
  gpsLongitude: number | null;
  accuracy: number | null;
  altitude: number | null;
  isPositionAdjusted: boolean;
  notes: string | null;
  capturedAt: string | null;
  createdAt: string;
  createdBy: { id: number; userName: string } | null;
  fileName: string;
  mimeType: string;
  size: number;
  imageUrl: string;
  attributeValues: Record<string, string>;
}

const UPLOAD_TIMEOUT_MS = 120000;

function toCaptureItem(s: SurveyResponse): SurveyCaptureItem {
  return {
    id: `remote_${s.id}`,
    remoteId: s.id,
    shapeInstanceId: s.shapeInstanceId,
    projectId: s.projectId,
    imageUri: `${apiService.getBaseUrl()}${s.imageUrl}`,
    imageMimeType: s.mimeType,
    latitude: s.latitude,
    longitude: s.longitude,
    altitude: s.altitude,
    accuracy: s.accuracy,
    timestamp: s.capturedAt || s.createdAt,
    shapeId: s.shapeId ?? 0,
    shapeName: s.shapeName || 'Survey Point',
    shapeType: s.shapeType || 'POINT',
    attributeValues: s.attributeValues || {},
    notes: s.notes || undefined,
    gpsLatitude: s.gpsLatitude ?? undefined,
    gpsLongitude: s.gpsLongitude ?? undefined,
    isPositionAdjusted: s.isPositionAdjusted,
    createdByName: s.createdBy?.userName,
    syncStatus: 'synced',
  };
}

/** Image source for a capture: remote images need the bearer token */
export function getSurveyImageSource(capture: SurveyCaptureItem): ImageURISource {
  if (capture.syncStatus === 'synced') {
    const token = apiService.getAuthToken();
    return {
      uri: capture.imageUri,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    };
  }
  return { uri: capture.imageUri };
}

export const surveyService = {
  async getProjectSurveys(projectId: number): Promise<SurveyCaptureItem[]> {
    const response = await apiClient.get<SurveyResponse[]>(`/survey/by-project/${projectId}`);
    return Array.isArray(response.data) ? response.data.map(toCaptureItem) : [];
  },

  /** Uploads a locally saved capture; returns the synced item */
  async uploadCapture(item: SurveyCaptureItem): Promise<SurveyCaptureItem> {
    const mimeType = item.imageMimeType || 'image/jpeg';
    const ext = mimeType.split('/')[1] || 'jpg';

    const form = new FormData();
    form.append('image', {
      uri: item.imageUri,
      name: `${item.id}.${ext}`,
      type: mimeType,
    } as any);
    form.append(
      'data',
      JSON.stringify({
        projectId: item.projectId,
        shapeId: item.shapeId,
        latitude: item.latitude,
        longitude: item.longitude,
        gpsLatitude: item.gpsLatitude ?? null,
        gpsLongitude: item.gpsLongitude ?? null,
        accuracy: item.accuracy ?? null,
        altitude: item.altitude ?? null,
        isPositionAdjusted: !!item.isPositionAdjusted,
        notes: item.notes ?? null,
        capturedAt: item.timestamp,
        attributeValues: item.attributeValues || {},
      })
    );

    const response = await apiClient.post<SurveyResponse>('/survey', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      // Keep RN's native FormData as-is (axios would otherwise try to serialize it)
      transformRequest: (data) => data,
      timeout: UPLOAD_TIMEOUT_MS,
    });
    return toCaptureItem(response.data);
  },

  async updatePosition(remoteId: number, lat: number, lng: number): Promise<SurveyCaptureItem> {
    const response = await apiClient.patch<SurveyResponse>(`/survey/${remoteId}/position`, {
      latitude: lat,
      longitude: lng,
    });
    return toCaptureItem(response.data);
  },

  async deleteSurvey(remoteId: number): Promise<void> {
    await apiClient.delete(`/survey/${remoteId}`);
  },
};

/** Human readable reason for a failed request */
export function describeSurveyError(e: any): string {
  const data = e?.response?.data;
  const message = Array.isArray(data?.message) ? data.message.join(', ') : data?.message;
  if (message) return String(message);
  if (!e?.response) return 'No connection to the server';
  return e?.message || 'Upload failed';
}

