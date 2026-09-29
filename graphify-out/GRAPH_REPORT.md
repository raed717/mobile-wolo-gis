# Graph Report - .  (2026-09-29)

## Corpus Check
- 66 files · ~65,185 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 329 nodes · 666 edges · 14 communities (12 shown, 2 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 20 edges (avg confidence: 0.8)
- Token cost: 110,484 input · 0 output

## Community Hubs (Navigation)
- Shapes Catalog & Survey Capture
- GIS Map Rendering & Filters
- App Shell & Login UI
- Projects List & Details
- Runtime Dependencies
- Expo App Config
- Auth & API Client
- Platform Architecture Concepts
- Recent Projects Cache
- Package Manifest & Scripts
- Brand & Template Icons
- TypeScript Config
- Adaptive Icon Background
- Adaptive Icon Monochrome

## God Nodes (most connected - your core abstractions)
1. `Colors` - 26 edges
2. `useAuth()` - 17 edges
3. `Project` - 15 edges
4. `RecentProjectsCache` - 14 edges
5. `ApiClient` - 13 edges
6. `expo` - 11 edges
7. `Shape` - 10 edges
8. `SurveyCaptureItem` - 10 edges
9. `ProjectMapView` - 9 edges
10. `MODAL_SUPPORTED_ORIENTATIONS` - 9 edges

## Surprising Connections (you probably didn't know these)
- `MapSettingsModal()` --implements--> `GIS Filters (Geometry Type, Data Source Origin, Obj Name)`  [EXTRACTED]
  src/components/map/MapSettingsModal.tsx → README.md
- `ProjectMapView` --implements--> `Level of Detail & Vertex Simplification`  [INFERRED]
  src/components/map/ProjectMapView.tsx → README.md
- `ProjectMapView` --implements--> `Orthomosaic WMS Overlay`  [INFERRED]
  src/components/map/ProjectMapView.tsx → README.md
- `ProjectMapView` --implements--> `Time-Sliced Chunked Rendering`  [INFERRED]
  src/components/map/ProjectMapView.tsx → README.md
- `ProjectMapView` --implements--> `Viewport-Aware Spatial Culling`  [INFERRED]
  src/components/map/ProjectMapView.tsx → README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Smart High-Performance Map Rendering** — readme_canvas_vector_renderer, readme_viewport_spatial_culling, readme_time_sliced_chunking, readme_lod_simplification, src_components_map_projectmapview_projectmapview [EXTRACTED 1.00]
- **Geo-Tagged Survey Capture Flow** — src_components_survey_surveycapturemodal_surveycapturemodal, src_hooks_usedevicelocation_usedevicelocation, src_hooks_usesurveycaptures_usesurveycaptures, src_services_storage_surveystorageservice, src_components_survey_surveypointdetailmodal_surveypointdetailmodal [INFERRED 0.85]
- **Authentication & Single-Session Flow** — src_context_authcontext_authcontext, src_services_api_apiclient, readme_current_jwt_token, readme_be_wolo_gis [INFERRED 0.75]
- **Android Adaptive Icon Layer Set** — assets_android_icon_background_android_adaptive_icon_background, assets_android_icon_foreground_android_adaptive_icon_foreground, assets_android_icon_monochrome_android_adaptive_icon_monochrome [EXTRACTED 1.00]
- **Expo Template Placeholder Launcher/Web Icons** — assets_icon_app_icon, assets_favicon_web_favicon, assets_android_icon_foreground_android_adaptive_icon_foreground, assets_splash_icon_splash_icon [INFERRED 0.85]

## Communities (14 total, 2 thin omitted)

### Community 0 - "Shapes Catalog & Survey Capture"
Cohesion: 0.07
Nodes (39): Shape Attribute Schema (text, number, boolean, color), expo-image-picker, Field Survey & Geo-Tagged Photo Capture, Real-Time GPS Tracking (expo-location), Shapes Catalog Management, EmptyState(), EmptyStateProps, styles (+31 more)

### Community 1 - "GIS Map Rendering & Filters"
Cohesion: 0.09
Nodes (37): Captures Carousel Drawer & Map Camera Pins, GIS Filters (Geometry Type, Data Source Origin, Obj Name), Imported Shape Instances (Shapefile / GeoJSON), Native Shape Instances, Offline Local Persistence (AsyncStorage per project), BasemapType, MapSettingsModalProps, styles (+29 more)

### Community 2 - "App Shell & Login UI"
Cohesion: 0.10
Nodes (29): App(), Map Wallpaper (dark world map of night-light/road density), DEV_MACHINE_IP, Developer Server Selector, CustomButton(), CustomButtonProps, styles, CustomInput() (+21 more)

### Community 3 - "Projects List & Details"
Cohesion: 0.12
Nodes (26): ProjectCard(), ProjectCardProps, styles, ProjectDetailModal(), ProjectDetailModalProps, styles, ProjectFilterChips(), ProjectFilterChipsProps (+18 more)

### Community 4 - "Runtime Dependencies"
Cohesion: 0.06
Nodes (33): axios, expo, expo-asset, expo-constants, expo-font, expo-image-picker, expo-linear-gradient, expo-location (+25 more)

### Community 5 - "Expo App Config"
Cohesion: 0.07
Nodes (27): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, permissions, expo, android (+19 more)

### Community 6 - "Auth & API Client"
Cohesion: 0.15
Nodes (12): Single-Session Enforcement & Multi-Device Auto-Logout, DEFAULT_DEV_API_URL, AuthContext, ApiClient, apiService, authService, storageService, AuthContextType (+4 more)

### Community 7 - "Platform Architecture Concepts"
Cohesion: 0.10
Nodes (20): react, react, be-wolo-gis NestJS Backend, HTML5 Canvas Vector Renderer (L.canvas), currentJwtToken Session Mechanism, Leaflet, Level of Detail & Vertex Simplification, Multi-Basemap Switcher (OSM, Esri Satellite, CARTO Dark) (+12 more)

### Community 8 - "Recent Projects Cache"
Cohesion: 0.21
Nodes (3): STORAGE_KEYS, RecentProjectEntry, RecentProjectsCache

### Community 9 - "Package Manifest & Scripts"
Cohesion: 0.13
Nodes (14): devDependencies, @types/react, typescript, main, name, private, scripts, android (+6 more)

### Community 10 - "Brand & Template Icons"
Cohesion: 0.33
Nodes (6): Android Adaptive Icon Foreground (blue Expo chevron), Web Favicon (Expo chevron), App Icon (default Expo template chevron on blueprint), Expo Default Template Branding (unreplaced placeholder icons), Brand Logo (orange-to-purple gradient curly-brace/bracket connector mark), Splash Icon (default Expo template grid with concentric circles)

### Community 11 - "TypeScript Config"
Cohesion: 0.40
Nodes (4): expo/tsconfig.base, compilerOptions, strict, extends

## Ambiguous Edges - Review These
- `Brand Logo (orange-to-purple gradient curly-brace/bracket connector mark)` → `Expo Default Template Branding (unreplaced placeholder icons)`  [AMBIGUOUS]
  assets/images/logo.png · relation: conceptually_related_to

## Knowledge Gaps
- **106 isolated node(s):** `name`, `slug`, `version`, `orientation`, `icon` (+101 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Brand Logo (orange-to-purple gradient curly-brace/bracket connector mark)` and `Expo Default Template Branding (unreplaced placeholder icons)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `MapSettingsModal()` connect `Platform Architecture Concepts` to `GIS Map Rendering & Filters`?**
  _High betweenness centrality (0.235) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Runtime Dependencies` to `Package Manifest & Scripts`, `Platform Architecture Concepts`?**
  _High betweenness centrality (0.233) - this node is a cross-community bridge._
- **Why does `react` connect `Platform Architecture Concepts` to `Runtime Dependencies`?**
  _High betweenness centrality (0.224) - this node is a cross-community bridge._
- **What connects `name`, `slug`, `version` to the rest of the system?**
  _106 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Shapes Catalog & Survey Capture` be split into smaller, more focused modules?**
  _Cohesion score 0.07428571428571429 - nodes in this community are weakly interconnected._
- **Should `GIS Map Rendering & Filters` be split into smaller, more focused modules?**
  _Cohesion score 0.09224489795918367 - nodes in this community are weakly interconnected._