import { apiClient } from './apiClient';
import { Shape } from '../../types/shape.types';

export const shapeService = {
  /**
   * Fetch all shapes
   */
  async getAllShapes(): Promise<Shape[]> {
    const response = await apiClient.get<Shape[]>('/shape');
    return response.data;
  },

  /**
   * Fetch shapes by organization ID
   */
  async getShapesByOrgId(orgId: number): Promise<Shape[]> {
    const response = await apiClient.get<Shape[]>(`/shape/byOrg/${orgId}`);
    return response.data;
  },

  /**
   * Fetch shape by ID
   */
  async getShapeById(id: number): Promise<Shape> {
    const response = await apiClient.get<Shape>(`/shape/${id}`);
    return response.data;
  },
};
