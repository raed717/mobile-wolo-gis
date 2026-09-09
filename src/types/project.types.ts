export interface Project {
  id: number;
  name: string;
  description?: string;
  geoLocation?: string;
  lat?: number;
  lng?: number;
  location?: string;
  organizationId: number;
  organization?: {
    id: number;
    name: string;
    description?: string;
  };
  isPrivate: boolean;
  orthophotoUrl?: string[];
  cloudUrl?: string[];
  csvUrl?: string[];
  createdAt: string;
  updatedAt?: string;
}

export type ProjectFilterType = 'all' | 'recent' | 'organization' | 'public' | 'private';
