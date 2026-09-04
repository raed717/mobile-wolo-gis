import AsyncStorage from '@react-native-async-storage/async-storage';
import { SurveyCaptureItem } from '../../types/survey.types';

const STORAGE_PREFIX = 'smartown_survey_captures_';

export const surveyStorageService = {
  /**
   * Get all captures saved locally for a given project
   */
  async getProjectCaptures(projectId: number): Promise<SurveyCaptureItem[]> {
    try {
      const key = `${STORAGE_PREFIX}${projectId}`;
      const raw = await AsyncStorage.getItem(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error(`Failed to load survey captures for project #${projectId}:`, e);
      return [];
    }
  },

  /**
   * Save a new capture item to local storage
   */
  async saveCapture(projectId: number, item: SurveyCaptureItem): Promise<void> {
    try {
      const key = `${STORAGE_PREFIX}${projectId}`;
      const existing = await this.getProjectCaptures(projectId);
      const updated = [item, ...existing.filter((c) => c.id !== item.id)];
      await AsyncStorage.setItem(key, JSON.stringify(updated));
    } catch (e) {
      console.error(`Failed to save survey capture for project #${projectId}:`, e);
      throw e;
    }
  },

  /**
   * Delete a capture item from local storage
   */
  async deleteCapture(projectId: number, captureId: string): Promise<void> {
    try {
      const key = `${STORAGE_PREFIX}${projectId}`;
      const existing = await this.getProjectCaptures(projectId);
      const updated = existing.filter((c) => c.id !== captureId);
      await AsyncStorage.setItem(key, JSON.stringify(updated));
    } catch (e) {
      console.error(`Failed to delete capture #${captureId}:`, e);
      throw e;
    }
  },

  /**
   * Clear all captures for a given project
   */
  async clearProjectCaptures(projectId: number): Promise<void> {
    try {
      const key = `${STORAGE_PREFIX}${projectId}`;
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.error(`Failed to clear captures for project #${projectId}:`, e);
    }
  },
};
