import { Platform } from 'react-native';

// ──────────────────────────────────────────────────────────────────────────────
// DEV MACHINE IP — update this to your computer's local network IP address.
// Run `ipconfig` (Windows) or `ifconfig` (Mac/Linux) to find it.
// Physical iOS/Android devices CANNOT reach `localhost` — they need this IP.
// ──────────────────────────────────────────────────────────────────────────────
export const DEV_MACHINE_IP = '192.168.0.189';
export const DEV_MACHINE_PORT = '3000';

export const DEFAULT_DEV_API_URL = Platform.select({
  android: 'http://10.0.2.2:3000',   // Android emulator special loopback
  ios: `http://${DEV_MACHINE_IP}:${DEV_MACHINE_PORT}`,
  default: `http://${DEV_MACHINE_IP}:${DEV_MACHINE_PORT}`,
});

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'smartown_auth_token',
  USER_DATA: 'smartown_user_data',
  API_URL: 'smartown_api_url',
  RECENT_PROJECTS: 'smartown_recent_projects',
};

export const APP_CONFIG = {
  appName: 'SMARTOWN',
  tagline: 'GIS & Asset Management',
  copyright: 'WOLO © 2025 SmarThink',
  poweredBy: 'wolo.tn',
  poweredByUrl: 'https://wolo.tn',
};
