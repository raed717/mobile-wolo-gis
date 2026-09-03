import React, { useRef, useMemo } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { Project } from '../../types/project.types';
import { Colors } from '../../theme/colors';

interface ProjectMapViewProps {
  project: Project;
  style?: any;
}

export const ProjectMapView: React.FC<ProjectMapViewProps> = ({ project, style }) => {
  const webViewRef = useRef<WebView>(null);

  const lat = typeof project.lat === 'number' && !isNaN(project.lat) ? project.lat : 36.8065;
  const lng = typeof project.lng === 'number' && !isNaN(project.lng) ? project.lng : 10.1815;

  const htmlContent = useMemo(() => {
    const projectJson = JSON.stringify(project);

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

    /* Custom Popup */
    .leaflet-popup-content-wrapper {
      background: #16192e !important;
      color: #ffffff !important;
      border-radius: 12px !important;
      border: 1px solid rgba(255, 156, 92, 0.4) !important;
      box-shadow: 0 10px 25px rgba(0,0,0,0.6) !important;
      padding: 4px;
    }
    .leaflet-popup-tip {
      background: #16192e !important;
      border: 1px solid rgba(255, 156, 92, 0.4) !important;
    }
    .leaflet-popup-content {
      margin: 10px 14px !important;
      line-height: 1.4;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .popup-title {
      font-size: 15px;
      font-weight: 700;
      color: #ff9c5c;
      margin-bottom: 4px;
    }
    .popup-meta {
      font-size: 12px;
      color: #94a3b8;
    }
    .popup-coords {
      font-size: 11px;
      color: #64748b;
      margin-top: 4px;
    }

    /* Custom Marker Pin */
    .custom-pin {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 50% 50% 50% 0;
      background: #50246f;
      border: 2px solid #ff9c5c;
      transform: rotate(-45deg);
      box-shadow: 0 0 18px rgba(255, 156, 92, 0.6);
      animation: pulse 2s infinite ease-in-out;
    }
    .custom-pin::after {
      content: '';
      width: 12px;
      height: 12px;
      background: #ffffff;
      border-radius: 50%;
      position: absolute;
    }

    @keyframes pulse {
      0%, 100% { transform: rotate(-45deg) scale(1); }
      50% { transform: rotate(-45deg) scale(1.1); box-shadow: 0 0 24px rgba(255, 156, 92, 0.9); }
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const p = ${projectJson};
    const lat = ${lat};
    const lng = ${lng};

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

    // Initialize Map directly on project coordinates
    const map = L.map('map', {
      center: [lat, lng],
      zoom: 16,
      layers: [streets],
      zoomControl: true
    });

    // Layer Control
    const baseMaps = {
      "Streets": streets,
      "Satellite": satellite,
      "Dark GIS": dark
    };
    L.control.layers(baseMaps, null, { position: 'topright' }).addTo(map);

    // Custom Project Marker
    const customIcon = L.divIcon({
      className: 'custom-pin-container',
      html: '<div class="custom-pin"></div>',
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -36]
    });

    const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
    
    const popupContent = 
      '<div class="popup-title">' + (p.name || 'Project') + '</div>' +
      '<div class="popup-meta">' + (p.location || (p.organization ? p.organization.name : '')) + '</div>' +
      '<div class="popup-coords">Lat: ' + lat.toFixed(5) + ', Lng: ' + lng.toFixed(5) + '</div>';

    marker.bindPopup(popupContent).openPopup();

    // Auto-fit & ensure map bounds render smoothly
    setTimeout(() => {
      map.invalidateSize();
      map.setView([lat, lng], 16, { animate: true });
    }, 200);
  </script>
</body>
</html>
    `;
  }, [project, lat, lng]);

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={styles.webview}
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
};

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
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0c0d13',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
