import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { DEFAULT_DEV_API_URL } from '../../config/constants';
import { storageService } from '../storage/storageService';

class ApiClient {
  private instance: AxiosInstance;
  private currentBaseUrl: string;
  private currentToken: string | null = null;
  private onUnauthorizedHandler: ((message?: string) => void) | null = null;
  private isHandling401 = false;

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
        if (error.response && error.response.status === 401) {
          const url = error.config?.url || '';
          // Avoid triggering session-expired on standard login attempts that fail with 401
          const isLoginEndpoint = url.includes('/auth/login');

          if (!isLoginEndpoint && this.onUnauthorizedHandler && !this.isHandling401) {
            this.isHandling401 = true;

            const resData = error.response.data;
            const errorMessage =
              typeof resData === 'string'
                ? resData
                : resData?.message || 'Session expired or logged in elsewhere';

            try {
              this.onUnauthorizedHandler(errorMessage);
            } finally {
              // Reset debounce after a brief delay
              setTimeout(() => {
                this.isHandling401 = false;
              }, 2000);
            }
          }
        }
        return Promise.reject(error);
      }
    );
  }

  public setOnUnauthorized(handler: ((message?: string) => void) | null) {
    this.onUnauthorizedHandler = handler;
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
