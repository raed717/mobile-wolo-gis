import { useState, useEffect, useCallback } from 'react';
import { SurveyCaptureItem } from '../types/survey.types';
import { surveyStorageService } from '../services/storage/surveyStorageService';

export function useSurveyCaptures(projectId: number | null | undefined) {
  const [captures, setCaptures] = useState<SurveyCaptureItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadCaptures = useCallback(async () => {
    if (!projectId) {
      setCaptures([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const items = await surveyStorageService.getProjectCaptures(projectId);
      setCaptures(items);
    } catch (e) {
      console.error('Error loading project survey captures:', e);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadCaptures();
  }, [loadCaptures]);

  const addCapture = useCallback(
    async (item: SurveyCaptureItem) => {
      if (!projectId) return;
      await surveyStorageService.saveCapture(projectId, item);
      setCaptures((prev) => [item, ...prev.filter((c) => c.id !== item.id)]);
    },
    [projectId]
  );

  const removeCapture = useCallback(
    async (captureId: string) => {
      if (!projectId) return;
      await surveyStorageService.deleteCapture(projectId, captureId);
      setCaptures((prev) => prev.filter((c) => c.id !== captureId));
    },
    [projectId]
  );

  return {
    captures,
    isLoading,
    addCapture,
    removeCapture,
    reloadCaptures: loadCaptures,
  };
}
