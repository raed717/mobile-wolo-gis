import React, { useRef, useMemo, useEffect, useImperativeHandle, forwardRef } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { Project } from '../../types/project.types';
import { SurveyCaptureItem, UserLocation } from '../../types/survey.types';
import { Colors } from '../../theme/colors';

export interface ProjectMapViewRef {
  flyToLocation: (lat: number, lng: number, zoom?: number) => void;
}

interface ProjectMapViewProps {
  project: Project;
  userLocation?: UserLocation | null;
  captures?: SurveyCaptureItem[];
  onSelectCapture?: (capture: SurveyCaptureItem) => void;
  style?: any;
}

export const ProjectMapView = forwardRef<ProjectMapViewRef, ProjectMapViewProps>(
  ({ project, userLocation = null, captures = [], onSelectCapture, style }, ref) => {
    const webViewRef = useRef<WebView>(null);

    const lat = typeof project.lat === 'number' && !isNaN(project.lat) ? project.lat : 36.8065;
    const lng = typeof project.lng === 'number' && !isNaN(project.lng) ? project.lng : 10.1815;

    // Expose flyToLocation method to parent via ref
    useImperativeHandle(ref, () => ({
      flyToLocation: (targetLat: number, targetLng: number, zoom = 18) => {
        if (webViewRef.current) {
          const js = `
            if (window.map) {
              window.map.flyTo([${targetLat}, ${targetLng}], ${zoom}, { animate: true, duration: 1.2 });
            }
            true;
          `;
          webViewRef.current.injectJavaScript(js);
        }
      },
    }));

    // Inject JS updates directly when captures or userLocation changes
    useEffect(() => {
      if (webViewRef.current && captures) {
        const capturesJson = JSON.stringify(captures);
        const js = `
          if (window.renderCaptures) {
            window.renderCaptures(${capturesJson});
          }
          true;
        `;
        webViewRef.current.injectJavaScript(js);
      }
    }, [captures]);

    useEffect(() => {
      if (webViewRef.current && userLocation) {
        const locJson = JSON.stringify(userLocation);
        const js = `
          if (window.renderUserLocation) {
            window.renderUserLocation(${locJson});
          }
          true;
        `;
        webViewRef.current.injectJavaScript(js);
      }
    }, [userLocation]);

    const htmlContent = useMemo(() => {
      const initialCapturesJson = JSON.stringify(captures);
      const initialLocationJson = JSON.stringify(userLocation);

      return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; background: #0c0d13; }
    
    /* Leaflet Controls */
    .leaflet-bar {
      border: none !important;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4) !important;
      border-radius: 8px !important;
      overflow: hidden;
    }
    .leaflet-bar a {
      background-color: #16192e !important;
      color: #cbd5e1 !important;
      border-bottom: 1px solid rgba(255,255,255,0.1) !important;
    }
    .leaflet-bar a:hover {
      background-color: #252b48 !important;
      color: #ff9c5c !important;
    }

    /* Live GPS User Location Marker */
    .user-gps-container {
      position: relative;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .user-gps-dot {
      width: 14px;
      height: 14px;
      background-color: #007aff;
      border: 2.5px solid #ffffff;
      border-radius: 50%;
      box-shadow: 0 0 10px rgba(0, 122, 255, 0.9);
      z-index: 2;
    }
    .user-gps-pulse {
      position: absolute;
      width: 36px;
      height: 36px;
      background-color: rgba(0, 122, 255, 0.35);
      border-radius: 50%;
      animation: gps-pulse 2s infinite ease-out;
    }
    @keyframes gps-pulse {
      0% { transform: scale(0.4); opacity: 1; }
      100% { transform: scale(1.6); opacity: 0; }
    }

    /* Custom Camera Marker Pin */
    .camera-pin-wrapper {
      position: relative;
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .camera-pin-head {
      width: 40px;
      height: 40px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      background: #ff9c5c;
      border: 2.5px solid #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 6px 16px rgba(0,0,0,0.6);
      transition: transform 0.15s ease;
    }
    .camera-pin-icon {
      transform: rotate(45deg);
      font-size: 18px;
      line-height: 1;
    }
    .camera-pin-ring {
      position: absolute;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      border: 2px solid #ff9c5c;
      animation: cam-ring 2s infinite ease-out;
      pointer-events: none;
    }
    @keyframes cam-ring {
      0% { transform: scale(0.6); opacity: 1; }
      100% { transform: scale(1.4); opacity: 0; }
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const lat = ${lat};
    const lng = ${lng};
    let captures = ${initialCapturesJson};
    let userLoc = ${initialLocationJson};

    // Tile Layers
    const streets = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    });

    const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: '© Esri Satellite'
    });

    const dark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '© CARTO Dark'
    });

    // Initialize Map
    const initialCenter = userLoc && userLoc.latitude ? [userLoc.latitude, userLoc.longitude] : [lat, lng];
    const initialZoom = userLoc && userLoc.latitude ? 17 : 16;

    const map = L.map('map', {
      center: initialCenter,
      zoom: initialZoom,
      layers: [streets],
      zoomControl: true
    });
    window.map = map;

    const baseMaps = {
      "Streets": streets,
      "Satellite": satellite,
      "Dark GIS": dark
    };
    L.control.layers(baseMaps, null, { position: 'topright' }).addTo(map);

    // User GPS Location Marker
    let userGpsMarker = null;
    window.renderUserLocation = function(loc) {
      if (!loc || typeof loc.latitude !== 'number') return;
      if (userGpsMarker) {
        userGpsMarker.setLatLng([loc.latitude, loc.longitude]);
      } else {
        const userIcon = L.divIcon({
          className: 'user-gps-wrapper',
          html: '<div class="user-gps-container"><div class="user-gps-pulse"></div><div class="user-gps-dot"></div></div>',
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });
        userGpsMarker = L.marker([loc.latitude, loc.longitude], { icon: userIcon, zIndexOffset: 1000 }).addTo(map);
      }
    };
    if (userLoc) {
      window.renderUserLocation(userLoc);
    }

    // Survey Captures Layer Group
    const capturesLayer = L.layerGroup().addTo(map);

    window.renderCaptures = function(items) {
      capturesLayer.clearLayers();
      if (!Array.isArray(items)) return;

      items.forEach(cap => {
        const capLat = parseFloat(cap.latitude);
        const capLng = parseFloat(cap.longitude);
        if (isNaN(capLat) || isNaN(capLng)) return;

        const fillColor = cap.shapeStyle?.fillColor || '#ff9c5c';
        const strokeColor = cap.shapeStyle?.strokeColor || '#ffffff';

        const capHtml = 
          '<div class="camera-pin-wrapper">' +
            '<div class="camera-pin-ring" style="border-color: ' + fillColor + '"></div>' +
            '<div class="camera-pin-head" style="background: ' + fillColor + '; border-color: ' + strokeColor + ';">' +
              '<span class="camera-pin-icon">📷</span>' +
            '</div>' +
          '</div>';

        const capIcon = L.divIcon({
          className: 'camera-pin-container',
          html: capHtml,
          iconSize: [44, 44],
          iconAnchor: [22, 40],
          popupAnchor: [0, -40]
        });

        const capMarker = L.marker([capLat, capLng], { icon: capIcon, zIndexOffset: 5000 }).addTo(capturesLayer);

        capMarker.on('click', () => {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'CAPTURE_SELECTED',
              captureId: cap.id,
              capture: cap
            }));
          }
        });
      });
    };

    window.renderCaptures(captures);

    // Message Listener for React Native postMessage
    function handleMsg(event) {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data.type === 'UPDATE_USER_LOCATION') {
          window.renderUserLocation(data);
        } else if (data.type === 'UPDATE_CAPTURES') {
          window.renderCaptures(data.captures);
        } else if (data.type === 'FLY_TO' && data.lat && data.lng) {
          map.flyTo([data.lat, data.lng], data.zoom || 18, { animate: true, duration: 1.2 });
        }
      } catch (e) {}
    }

    window.addEventListener('message', handleMsg);
    document.addEventListener('message', handleMsg);

    setTimeout(() => {
      map.invalidateSize();
    }, 200);
  </script>
</body>
</html>
      `;
    }, [lat, lng, captures]);

    const handleMessage = (event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'CAPTURE_SELECTED' && onSelectCapture) {
          const found = captures.find((c) => c.id === data.captureId) || data.capture;
          if (found) {
            onSelectCapture(found);
          }
        }
      } catch (e) {
        console.error('Error handling map webview message:', e);
      }
    };

    return (
      <View style={[styles.container, style]}>
        <WebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html: htmlContent }}
          style={styles.webview}
          onMessage={handleMessage}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color={Colors.secondary} />
            </View>
          )}
        />
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDark,
  },
  webview: {
    flex: 1,
    backgroundColor: '#0c0d13',
  },
  loader: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#0c0d13',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
