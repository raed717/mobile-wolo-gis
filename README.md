# SMARTOWN Mobile (React Native / Expo)

Mobile application for the **SMARTOWN** GIS and Smart City management platform.

---

## 📱 Features

- **Authentication System**:
  - Direct integration with NestJS backend (`/auth/login`, `/auth/logout`, `/users/:id`).
  - JWT token decoding and persistent secure session storage.
  - Active account verification.
  - Automatic session restoration on app launch.
- **Visual Design**:
  - Styled with the SMARTOWN cosmic starry GIS aesthetic.
  - Custom branding colors (`#50246f` WOLO Purple & `#ff9c5c` Coral/Orange).
  - Smooth form inputs with password visibility toggle and error indicators.
- **Developer Experience**:
  - Configurable backend server URL directly from the login screen (ideal for switching between Localhost, Android Emulator `10.0.2.2`, LAN IP, or Production).
  - TypeScript with full type safety.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- [Expo Go](https://expo.dev/go) app installed on your physical device (iOS/Android) OR Android Studio / Xcode emulators.

### 2. Run the App

From the project root:
```bash
cd mobile-wolo-gis
npm start
```

Or target specific platforms:
```bash
# Android Emulator
npm run android

# iOS Simulator
npm run ios

# Web Preview
npm run web
```

---

## 📁 Project Architecture

```
mobile-wolo-gis/
├── assets/                  # Brand logos, icons, map wallpapers
│   ├── images/
│   └── ...
├── src/
│   ├── components/          # Reusable UI components
│   │   └── common/
│   │       ├── CustomButton.tsx
│   │       ├── CustomInput.tsx
│   │       └── StarryBackground.tsx
│   ├── config/              # Constants, server defaults & app metadata
│   │   └── constants.ts
│   ├── context/             # Global Auth state and session management
│   │   └── AuthContext.tsx
│   ├── navigation/          # Route controller (Auth vs Home)
│   │   └── RootNavigator.tsx
│   ├── screens/             # Screen views
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── SettingsModal.tsx
│   │   └── home/
│   │       └── HomeScreen.tsx
│   ├── services/
│   │   ├── api/             # Axios client & NestJS auth endpoints
│   │   │   ├── apiClient.ts
│   │   │   └── authService.ts
│   │   └── storage/         # AsyncStorage wrapper
│   │       └── storageService.ts
│   ├── theme/               # Color palette & styling variables
│   │   └── colors.ts
│   └── types/               # TypeScript interfaces
│       └── auth.types.ts
├── App.tsx                  # Root application entry
├── app.json                 # Expo app configuration
└── package.json
```
