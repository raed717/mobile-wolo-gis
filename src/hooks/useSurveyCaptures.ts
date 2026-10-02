import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { LatLng, SurveyCaptureItem } from '../types/survey.types';
import { surveyStorageService } from '../services/storage/surveyStorageService';
import { surveyPhotoStorage } from '../services/storage/surveyPhotoStorage';
import { describeSurveyError, surveyService } from '../services/api/surveyService';

interface UseSurveyCapturesOptions {
  /** Called after the backend data changed (new/moved/deleted survey) so shapes can be refreshed */
  onRemoteChange?: () => void;
}

/**
 * Survey captures of a project = surveys stored on the backend + captures still waiting
 * on the device (offline queue in AsyncStorage, photo in the document directory).
 * New captures are queued locally first, then uploaded; failed uploads are retried
 * on the next load or with syncPending().
 */
export function useSurveyCaptures(
  projectId: number | null | undefined,
  { onRemoteChange }: UseSurveyCapturesOptions = {}
) {
  const [remoteCaptures, setRemoteCaptures] = useState<SurveyCaptureItem[]>([]);
  const [localCaptures, setLocalCaptures] = useState<SurveyCaptureItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [remoteError, setRemoteError] = useState<string | null>(null);

  const onRemoteChangeRef = useRef(onRemoteChange);
  onRemoteChangeRef.current = onRemoteChange;
  const syncingRef = useRef(false);

  const setLocalStatus = useCallback((id: string, patch: Partial<SurveyCaptureItem>) => {
    setLocalCaptures((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }, []);

  /** Uploads one local capture; returns the synced item, or the failed local item */
  const uploadOne = useCallback(
    async (item: SurveyCaptureItem): Promise<SurveyCaptureItem> => {
      if (!projectId) return item;
      setLocalStatus(item.id, { syncStatus: 'uploading', syncError: undefined });
      try {
        if (!surveyPhotoStorage.exists(item.imageUri)) {
          throw new Error('Photo file is missing on this device');
        }
        const synced = await surveyService.uploadCapture(item);

        await surveyStorageService.deleteCapture(projectId, item.id);
        surveyPhotoStorage.remove(item.imageUri);
        setLocalCaptures((prev) => prev.filter((c) => c.id !== item.id));
        setRemoteCaptures((prev) => [synced, ...prev.filter((c) => c.id !== synced.id)]);
        onRemoteChangeRef.current?.();
        return synced;
      } catch (e: any) {
        const failed: SurveyCaptureItem = {
          ...item,
          syncStatus: 'failed',
          syncError: e?.response ? describeSurveyError(e) : e?.message || describeSurveyError(e),
        };
        console.warn(`[useSurveyCaptures] Upload of ${item.id} failed:`, failed.syncError);
        await surveyStorageService.updateCapture(projectId, failed).catch(() => {});
        setLocalStatus(item.id, { syncStatus: 'failed', syncError: failed.syncError });
        return failed;
      }
    },
    [projectId, setLocalStatus]
  );

  const syncPending = useCallback(
    async (items?: SurveyCaptureItem[]) => {
      if (!projectId || syncingRef.current) return;
      const queue = items ?? (await surveyStorageService.getProjectCaptures(projectId));
      if (queue.length === 0) return;

      syncingRef.current = true;
      setIsSyncing(true);
      try {
        // Oldest first, one at a time to keep memory and bandwidth low in the field
        for (const item of [...queue].reverse()) {
          await uploadOne(item);
        }
      } finally {
        syncingRef.current = false;
        setIsSyncing(false);
      }
    },
    [projectId, uploadOne]
  );

  const loadCaptures = useCallback(async () => {
    if (!projectId) {
      setRemoteCaptures([]);
      setLocalCaptures([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const local = await surveyStorageService.getProjectCaptures(projectId);
    setLocalCaptures(local.map((c) => ({ ...c, syncStatus: c.syncStatus === 'failed' ? 'failed' : 'pending' })));

    try {
      setRemoteCaptures(await surveyService.getProjectSurveys(projectId));
      setRemoteError(null);
    } catch (e: any) {
      console.warn('[useSurveyCaptures] Could not load project surveys:', e?.message);
      setRemoteError(describeSurveyError(e));
    } finally {
      setIsLoading(false);
    }

    syncPending(local);
  }, [projectId, syncPending]);

  useEffect(() => {
    loadCaptures();
  }, [loadCaptures]);

  /**
   * Saves a new capture on the device (photo copied out of the picker cache), then uploads it.
   * Resolves with the synced item, or the local one if the upload failed (kept for retry).
   * Rejects only if the capture could not even be stored locally.
   */
  const addCapture = useCallback(
    async (item: SurveyCaptureItem): Promise<SurveyCaptureItem> => {
      if (!projectId) throw new Error('No project selected');

      const imageUri = await surveyPhotoStorage.persist(item.imageUri, item.id, item.imageMimeType);
      const local: SurveyCaptureItem = { ...item, imageUri, syncStatus: 'pending', syncError: undefined };
      try {
        await surveyStorageService.saveCapture(projectId, local);
      } catch (e) {
        surveyPhotoStorage.remove(imageUri);
        throw e;
      }
      setLocalCaptures((prev) => [local, ...prev.filter((c) => c.id !== local.id)]);

      return uploadOne(local);
    },
    [projectId, uploadOne]
  );

  /** Moves a capture to a manually corrected position */
  const updatePosition = useCallback(
    async (item: SurveyCaptureItem, pos: LatLng): Promise<SurveyCaptureItem> => {
      if (!projectId) return item;

      if (item.syncStatus === 'synced' && item.remoteId) {
        const updated = await surveyService.updatePosition(item.remoteId, pos.lat, pos.lng);
        setRemoteCaptures((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        onRemoteChangeRef.current?.();
        return updated;
      }

      const updated: SurveyCaptureItem = {
        ...item,
        latitude: pos.lat,
        longitude: pos.lng,
        gpsLatitude: item.gpsLatitude ?? item.latitude,
        gpsLongitude: item.gpsLongitude ?? item.longitude,
        isPositionAdjusted: true,
      };
      await surveyStorageService.updateCapture(projectId, updated);
      setLocalCaptures((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      return updated;
    },
    [projectId]
  );

  const removeCapture = useCallback(
    async (item: SurveyCaptureItem) => {
      if (!projectId) return;

      if (item.syncStatus === 'synced' && item.remoteId) {
        await surveyService.deleteSurvey(item.remoteId);
        setRemoteCaptures((prev) => prev.filter((c) => c.id !== item.id));
        onRemoteChangeRef.current?.();
        return;
      }

      await surveyStorageService.deleteCapture(projectId, item.id);
      surveyPhotoStorage.remove(item.imageUri);
      setLocalCaptures((prev) => prev.filter((c) => c.id !== item.id));
    },
    [projectId]
  );

  const captures = useMemo(
    () =>
      [...localCaptures, ...remoteCaptures].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ),
    [localCaptures, remoteCaptures]
  );

  return {
    captures,
    pendingCount: localCaptures.length,
    isLoading,
    isSyncing,
    remoteError,
    addCapture,
    updatePosition,
    removeCapture,
    syncPending: () => syncPending(),
    reloadCaptures: loadCaptures,
  };
}
