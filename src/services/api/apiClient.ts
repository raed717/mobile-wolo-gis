import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { DEFAULT_DEV_API_URL } from '../../config/constants';
import { storageService } from '../storage/storageService';

class ApiClient {
  private instance: AxiosInstance;
  private currentBaseUrl: string;
  private currentToken: string | null = null;

  constructor() {
    this.currentBaseUrl = DEFAULT_DEV_API_URL || 'http://localhost:3000';
    this.instance = axios.create({
      baseURL: this.currentBaseUrl,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    this.setupInterceptors();
    this.initSavedBaseUrl();
  }

  private async initSavedBaseUrl() {
    const saved = await storageService.getApiUrl();
    if (saved) {
      this.setBaseUrl(saved);
    }
    const token = await storageService.getToken();
    if (token) {
      this.currentToken = token;
    }
  }

  private setupInterceptors() {
    this.instance.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const token = this.currentToken || (await storageService.getToken());
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        return Promise.reject(error);
      }
    );
  }

  public setAuthToken(token: string | null) {
    this.currentToken = token;
  }

  public setBaseUrl(url: string) {
    this.currentBaseUrl = url.replace(/\/$/, '');
    this.instance.defaults.baseURL = this.currentBaseUrl;
    storageService.setApiUrl(this.currentBaseUrl);
  }

  public getBaseUrl(): string {
    return this.currentBaseUrl;
  }

  public get client(): AxiosInstance {
    return this.instance;
  }
}

export const apiService = new ApiClient();
export const apiClient = apiService.client;
