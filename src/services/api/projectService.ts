import { apiClient } from './apiClient';
import { Project } from '../../types/project.types';

export const projectService = {
  /**
   * Fetch all projects from the backend
   */
  async getAllProjects(): Promise<Project[]> {
    const response = await apiClient.get<Project[]>('/project');
    return response.data;
  },

  /**
   * Fetch projects belonging to a specific organization
   */
  async getProjectsByOrganization(organizationId: number): Promise<Project[]> {
    const response = await apiClient.get<Project[]>(`/project/organization/${organizationId}`);
    return response.data;
  },

  /**
   * Fetch single project details by ID
   */
  async getProjectById(id: number): Promise<Project> {
    const response = await apiClient.get<Project>(`/project/${id}`);
    return response.data;
  },
};
