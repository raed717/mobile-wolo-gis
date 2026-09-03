import { Platform } from 'react-native';

export const DEFAULT_DEV_API_URL = Platform.select({
  android: 'http://10.0.2.2:3000',
  ios: 'http://localhost:3000',
  default: 'http://localhost:3000',
});

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'smartown_auth_token',
  USER_DATA: 'smartown_user_data',
  API_URL: 'smartown_api_url',
};

export const APP_CONFIG = {
  appName: 'SMARTOWN',
  tagline: 'GIS & Asset Management',
  copyright: 'WOLO © 2025 SmarThink',
  poweredBy: 'wolo.tn',
  poweredByUrl: 'https://wolo.tn',
};
