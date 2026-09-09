# SMARTOWN Mobile (React Native / Expo)

A cross-platform mobile GIS, asset management, and field survey application for the **SMARTOWN** smart city platform. Built with React Native, Expo, Leaflet, and TypeScript, connected to the SMARTOWN NestJS backend (`be-wolo-gis`).

---

## 📱 Core Features

### 1. 🔐 Role-Based Authentication & Navigation
- **Direct Backend Integration**: Connects to NestJS authentication (`/auth/login`, `/auth/logout`, `/users/:id`).
- **Role-Based Access Control (RBAC)**:
  - **Admin**: Full visibility into all system projects (`GET /project`).
  - **Standard User**: Filtered access restricted to the user's specific organization (`GET /project/organization/:id`).
- **Main Menu Hub (`MenuScreen`)**: Post-login dashboard providing direct access to **Projects Management** and **Shapes Management**.
- **Developer Server Selector**: Fast configuration modal on the login screen to switch between **Localhost**, **Android Emulator (`10.0.2.2:3000`)**, **LAN IP (`DEV_MACHINE_IP:3000`)** for physical iPhones/iPads, or remote servers.

### 2. 🗺️ Interactive GIS Map & Smart Rendering System
- **Multi-Basemap Switcher**: Switch between **OpenStreetMap Streets**, **Esri World Imagery Satellite**, and **CARTO Dark GIS**.
- **Native & Imported Shape Instances**:
  - Automatically fetches and renders native shapes created on the web platform (`GET /shape-instance/by-project/:id`).
  - Automatically loads and normalizes imported Shapefiles / GeoJSON records (`GET /imported-shape-instance/by-project/:id`).
- **Smart High-Performance Rendering (Large Datasets)**:
  - **HTML5 Canvas Vector Renderer**: Vector shapes (Polygons, Lines, Points) render directly onto an accelerated canvas (`L.canvas`), avoiding DOM/SVG node bottlenecks that degrade mobile performance.
  - **Viewport-Aware Spatial Culling**: For projects containing hundreds or thousands of shapes, an in-memory spatial index only renders geometries intersecting the visible screen area (+30% padding buffer).
  - **Time-Sliced Chunking**: Renders features asynchronously in 150-feature batches using `requestAnimationFrame` / `setTimeout`, maintaining a fluid **60 FPS** during pan, zoom, and gestures.
  - **Level of Detail (LOD) & Simplification**: Vector geometries use vertex simplification (`smoothFactor: 1.5`) and suppress micro-points when zoomed out.
- **HUD & GIS Layer Controls**:
  - **Draggable Map Settings & Filter Button (`DraggableMapSettingsButton`)**: High-priority floating button draggable across the screen, avoiding visual overlap with Leaflet zoom buttons or native map controls. Features live asset count badge and active-filter indicator.
  - **Map Settings & GIS Filter Modal (`MapSettingsModal`)**:
    - **Multi-Basemap Switcher**: Instant switching between OpenStreetMap, Satellite, and Dark GIS.
    - **Orthomosaïque WMS Overlay**: High-resolution georeferenced aerial imagery layer served directly from the backend / NAS server (`project.orthophotoUrl`). Seamlessly overlays on top of streets or satellite basemaps with automatic opacity and multi-layer support up to zoom 26.
    - **Master Toggle**: Show or hide the entire shapes layer.
    - **Geometry Type Filter**: Filter by `ALL`, `POLYGON`, `LINE`, and `POINT`.
    - **Data Source Origin Filter**: Toggle between `Native Web` and `Imported Files`.
    - **Object Name Sub-Filter (`Obj Name`)**: Filter by specific shape object names (e.g. Building, Road, Pipeline) within any geometry category. Includes search bar, item counts, color swatches, and "Select All" / "Clear All" controls.
    - **Quick Actions**: "Fit All Shapes" auto-bounding box zoom, "Locate Me", and "Project Center" re-centering.
  - **Interactive Shape Tap & Inspection**: Tap any shape to view an inline popup and open the **Shape Details Bottom Sheet** (`ShapeInstanceDetailModal`) displaying all custom properties and attribute key-value pairs.

### 3. 📷 Field Survey & Geo-Tagged Photo Capture MVP
- **Real-Time GPS Tracking**: Tracks device location using `expo-location` with a pulsing live blue radar dot.
- **One-Tap Auto-Zoom (`Locate Me`)**: Smoothly flies the camera to the user's exact coordinates at zoom level 18.
- **Field Photo Capture**:
  - Snap field photos via device camera or pick from image library (`expo-image-picker`).
  - Geo-tags the photo with real-time GPS metadata (`latitude`, `longitude`, `altitude`, `accuracy`, `timestamp`).
  - Select an associated shape from the library and populate dynamic custom attribute fields.
- **Local Persistence (`AsyncStorage`)**: Captures are persisted locally per project (`smartown_survey_captures_<projectId>`) for resilient offline fieldwork.
- **Map Camera Pins**: Rendered as high-contrast pins (`📷`) with pulsing rings at capture coordinates. Tapping a pin opens the **Survey Point Details Sheet** with tap-to-zoom photo preview, coordinates HUD, and attributes table.
- **Captures Carousel Drawer**: Horizontal thumbnail carousel on the map for browsing and flying to local captures.

### 4. 🔷 Shapes Catalog Management
- **Visual Library**: Browse all GIS shape templates (`GET /shape` or `/shape/byOrg/:orgId`).
- **Geometry Badges**: Visual indicators for `POLYGON`, `LINE`, and `POINT`.
- **Style Swatches**: Visual preview of fill colors, stroke colors, opacities, and stroke widths.
- **Schema Inspector**: Inspect predefined attribute schemas and data types (`text`, `number`, `boolean`, `color`).

---

## 📁 Project Architecture

```
mobile-wolo-gis/
├── assets/                          # Brand logos, icons, map wallpapers
├── src/
│   ├── components/
│   │   ├── common/                  # Reusable UI widgets (Button, Input, StarryBackground)
│   │   ├── map/
│   │   │   ├── DraggableMapSettingsButton.tsx # Floating pan-responder GIS settings trigger
│   │   │   ├── MapSettingsModal.tsx           # Basemaps, layers & Obj Name filter modal
│   │   │   └── ProjectMapView.tsx             # Leaflet WebView with Canvas smart rendering engine
│   │   ├── project/
│   │   │   ├── ProjectCard.tsx      # Project summary card with badges and actions
│   │   │   ├── ProjectDetailModal.tsx # Full project inspector
│   │   │   └── ProjectFilterChips.tsx # Status filter chips (All, Pending, In Progress, Done)
│   │   ├── shape/
│   │   │   ├── ShapeCard.tsx        # Shape catalog card with style preview
│   │   │   ├── ShapeDetailModal.tsx # Attribute schema viewer
│   │   │   ├── ShapeFilterChips.tsx # Category filter chips (All, Polygon, Line, Point)
│   │   │   └── ShapeInstanceDetailModal.tsx # Inspector for shapes tapped on the map
│   │   └── survey/
│   │       ├── SurveyCaptureModal.tsx     # Form modal to bind photo + GPS + shape attributes
│   │       └── SurveyPointDetailModal.tsx # Full inspection sheet for captured survey photos
│   ├── config/
│   │   ├── assets.ts                # Asset registry
│   │   └── constants.ts             # Server URLs, LAN IP, storage keys, branding
│   ├── context/
│   │   └── AuthContext.tsx          # Global authentication and API URL state
│   ├── hooks/
│   │   ├── useDeviceLocation.ts     # expo-location tracking & permission hook
│   │   ├── useProjects.ts           # Project fetching & RBAC filtering
│   │   ├── useProjectShapeInstances.ts # Shape instances loader & client-side filter
│   │   ├── useShapes.ts             # Shape library catalog and style resolution
│   │   └── useSurveyCaptures.ts     # Local AsyncStorage CRUD for field captures
│   ├── navigation/
│   │   └── RootNavigator.tsx        # Navigation controller (Login -> Menu <-> Projects | Shapes)
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx      # Login form with server badge
│   │   │   └── SettingsModal.tsx    # Server URL config modal with LAN/Emulator presets
│   │   ├── map/
│   │   │   └── ProjectMapModal.tsx  # Full-screen GIS survey map with HUD and layer controls
│   │   ├── menu/
│   │   │   └── MenuScreen.tsx       # Main landing hub with navigation cards
│   │   ├── projects/
│   │   │   └── ProjectsScreen.tsx   # Projects list view with search and filters
│   │   └── shapes/
│   │       └── ShapesScreen.tsx     # Shapes catalog screen
│   ├── services/
│   │   ├── api/
│   │   │   ├── apiClient.ts         # Axios instance with auth interceptors
│   │   │   ├── authService.ts       # Login, token verification, logout
│   │   │   ├── projectService.ts    # Project API endpoints
│   │   │   ├── shapeInstanceService.ts # Native & imported shape instances & GeoJSON conversion
│   │   │   └── shapeService.ts      # Shape catalog endpoints
│   │   └── storage/
│   │       ├── storageService.ts    # Auth token & user storage
│   │       └── surveyStorageService.ts # Local survey captures storage per project
│   ├── theme/
│   │   └── colors.ts                # WOLO Purple (#50246f), Coral (#ff9c5c), and Dark GIS theme
│   └── types/
│       ├── auth.types.ts
│       ├── project.types.ts
│       ├── shape.types.ts
│       ├── shapeInstance.types.ts   # GeoJSON & shape instance types
│       └── survey.types.ts          # Survey captures & GPS location types
├── App.tsx                          # App root
├── app.json                         # Expo configuration (permissions, plugins)
├── package.json
└── tsconfig.json
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18+ recommended)
- **npm** (v9+)
- [Expo Go](https://expo.dev/go) on your physical device (iOS or Android) OR Android Studio / Xcode emulators.

### 2. Installation
```bash
cd mobile-wolo-gis
npm install
```

### 3. Configure the Backend URL
When testing on a **physical device** (iPhone or Android), the app must connect to your computer's local network IP (e.g. `192.168.0.x:3000`), as `localhost` only refers to the phone itself:
1. Check your computer's LAN IP:
   - Windows: `ipconfig`
   - macOS / Linux: `ifconfig`
2. Update `DEV_MACHINE_IP` in [`src/config/constants.ts`](file:///src/config/constants.ts):
   ```typescript
   export const DEV_MACHINE_IP = '192.168.0.189'; // Your computer's IP
   ```
3. Alternatively, tap the **Server Badge** on the app's login screen to select the **📱 LAN / iPhone** preset.

### 4. Start the Development Server
```bash
npx expo start -c
```
- Scan the QR code with **Expo Go** (Android) or the **Camera app** (iOS).
- Press `a` to run on Android Emulator.
- Press `i` to run on iOS Simulator.

---

## 🧪 Verification & Code Quality

The codebase is strictly typed and verified against Expo SDK 52 standards:
- **TypeScript Compilation**: `npx tsc --noEmit` (0 errors)
- **Expo Doctor**: `npx expo-doctor` (21/21 checks passed)
