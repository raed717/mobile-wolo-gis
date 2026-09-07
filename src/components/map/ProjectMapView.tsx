import React, { useRef, useMemo, useEffect, useImperativeHandle, forwardRef } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { Project } from '../../types/project.types';
import { SurveyCaptureItem, UserLocation } from '../../types/survey.types';
import { GeoJsonFeature, ShapeStyleDefinition } from '../../types/shapeInstance.types';
import { Colors } from '../../theme/colors';

export interface ProjectMapViewRef {
  flyToLocation: (lat: number, lng: number, zoom?: number) => void;
  fitBoundsToShapes: () => void;
}

interface ProjectMapViewProps {
  project: Project;
  userLocation?: UserLocation | null;
  captures?: SurveyCaptureItem[];
  shapes?: GeoJsonFeature[];
  stylesMap?: {
    byId: Record<number, ShapeStyleDefinition>;
    byName: Record<string, ShapeStyleDefinition>;
  };
  showShapes?: boolean;
  onSelectCapture?: (capture: SurveyCaptureItem) => void;
  onSelectShape?: (feature: GeoJsonFeature) => void;
  style?: any;
}

export const ProjectMapView = forwardRef<ProjectMapViewRef, ProjectMapViewProps>(
  (
    {
      project,
      userLocation = null,
      captures = [],
      shapes = [],
      stylesMap,
      showShapes = true,
      onSelectCapture,
      onSelectShape,
      style,
    },
    ref
  ) => {
    const webViewRef = useRef<WebView>(null);

    const lat = typeof project.lat === 'number' && !isNaN(project.lat) ? project.lat : 36.8065;
    const lng = typeof project.lng === 'number' && !isNaN(project.lng) ? project.lng : 10.1815;

    // Expose methods to parent via ref
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
      fitBoundsToShapes: () => {
        if (webViewRef.current) {
          const js = `
            if (window.fitShapesBounds) {
              window.fitShapesBounds();
            }
            true;
          `;
          webViewRef.current.injectJavaScript(js);
        }
      },
    }));

    // Inject JS updates directly when captures, shapes, or userLocation changes
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
      if (webViewRef.current && shapes) {
        const shapesJson = JSON.stringify(shapes);
        const stylesJson = JSON.stringify(stylesMap || { byId: {}, byName: {} });
        const js = `
          if (window.updateShapesData) {
            window.updateShapesData(${shapesJson}, ${stylesJson}, ${showShapes});
          }
          true;
        `;
        webViewRef.current.injectJavaScript(js);
      }
    }, [shapes, stylesMap, showShapes]);

    useEffect(() => {
      if (webViewRef.current) {
        const js = `
          if (window.setShapesVisible) {
            window.setShapesVisible(${showShapes});
          }
          true;
        `;
        webViewRef.current.injectJavaScript(js);
      }
    }, [showShapes]);

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
      const initialShapesJson = JSON.stringify(shapes);
      const initialStylesJson = JSON.stringify(stylesMap || { byId: {}, byName: {} });

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

    /* Custom GIS Popup */
    .leaflet-popup-content-wrapper {
      background: #16192e !important;
      color: #fff !important;
      border-radius: 12px !important;
      border: 1px solid rgba(255,255,255,0.15) !important;
      box-shadow: 0 8px 24px rgba(0,0,0,0.6) !important;
      padding: 0 !important;
    }
    .leaflet-popup-content {
      margin: 10px 12px !important;
      line-height: 1.4 !important;
    }
    .leaflet-popup-tip {
      background: #16192e !important;
      border: 1px solid rgba(255,255,255,0.15) !important;
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
    let allShapes = ${initialShapesJson};
    let stylesData = ${initialStylesJson};
    let shapesVisible = ${showShapes};

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
      zoomControl: true,
      preferCanvas: true
    });
    window.map = map;

    const baseMaps = {
      "Streets": streets,
      "Satellite": satellite,
      "Dark GIS": dark
    };
    L.control.layers(baseMaps, null, { position: 'topright' }).addTo(map);

    // High-performance HTML5 Canvas Vector Renderer
    const canvasRenderer = L.canvas({ padding: 0.5, tolerance: 10 });

    // Layers
    const shapesLayer = L.featureGroup().addTo(map);
    const capturesLayer = L.layerGroup().addTo(map);
    let userGpsMarker = null;
    let selectedShapeLayer = null;

    // ─────────────────────────────────────────────────────────────
    // SMART RENDERING ENGINE FOR LARGE SHAPE DATASETS
    // ─────────────────────────────────────────────────────────────
    let currentRenderGen = 0;

    function getFeatureStyle(feature, isSelected) {
      const shapeId = feature.shapeId;
      const objName = (feature.properties && feature.properties['Obj Name']) ? String(feature.properties['Obj Name']).toLowerCase().trim() : '';
      const byId = stylesData.byId || {};
      const byName = stylesData.byName || {};
      const s = (shapeId && byId[shapeId]) ? byId[shapeId] : (objName && byName[objName] ? byName[objName] : null);

      const geomType = feature.geometry ? String(feature.geometry.type).toUpperCase() : '';
      const isPoint = geomType.includes('POINT');
      const isLine = geomType.includes('LINE');

      const defaultStroke = isPoint ? '#38bdf8' : (isLine ? '#4ade80' : '#ff9c5c');
      const defaultFill = isPoint ? '#0284c7' : (isLine ? '#22c55e' : '#ff9c5c');

      if (isSelected) {
        return {
          renderer: canvasRenderer,
          color: '#ffffff',
          weight: 4,
          fillColor: '#facc15',
          fillOpacity: 0.85,
          opacity: 1,
          dashArray: null
        };
      }

      return {
        renderer: canvasRenderer,
        color: s && s.strokeColor ? s.strokeColor : defaultStroke,
        weight: s && s.strokeWidth ? s.strokeWidth : (isPoint ? 2 : 2.5),
        fillColor: s && s.fillColor ? s.fillColor : defaultFill,
        fillOpacity: s && s.fillOpacity ? s.fillOpacity : 0.45,
        opacity: s && s.opacity ? s.opacity : 0.9,
        dashArray: s && s.dashArray ? s.dashArray : undefined,
        smoothFactor: 1.5
      };
    }

    function onShapeClicked(feature, layer, latlng) {
      if (selectedShapeLayer && selectedShapeLayer !== layer) {
        if (selectedShapeLayer.setStyle && selectedShapeLayer.feature) {
          selectedShapeLayer.setStyle(getFeatureStyle(selectedShapeLayer.feature, false));
        }
      }
      selectedShapeLayer = layer;
      if (layer.setStyle) {
        layer.setStyle(getFeatureStyle(feature, true));
      }

      const props = feature.properties || {};
      const name = props['Obj Name'] || props['name'] || ('Feature #' + feature.id);
      const geomType = feature.geometry ? feature.geometry.type : 'Geometry';
      const origin = feature.isImported ? 'Imported Shape' : 'Native Shape';

      const popupHtml = 
        '<div style="font-family: sans-serif; font-size: 13px; color: #fff; padding: 4px;">' +
          '<div style="font-weight: 700; color: #ff9c5c; margin-bottom: 3px; font-size: 14px;">' + name + '</div>' +
          '<div style="font-size: 11px; color: #94a3b8; margin-bottom: 6px;">' +
            '<span style="background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px;">' + geomType + '</span> ' +
            '<span style="background: rgba(56,189,248,0.15); color: #38bdf8; padding: 2px 6px; border-radius: 4px;">' + origin + '</span>' +
          '</div>' +
          '<div style="font-size: 11px; color: #cbd5e1; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 4px; text-align: right;">' +
            'Tap for full attributes &rarr;' +
          '</div>' +
        '</div>';

      let targetLatLng = latlng;
      if (!targetLatLng && layer.getBounds) {
        targetLatLng = layer.getBounds().getCenter();
      } else if (!targetLatLng && layer.getLatLng) {
        targetLatLng = layer.getLatLng();
      }

      if (targetLatLng) {
        L.popup({ offset: [0, -6], className: 'custom-gis-popup' })
          .setLatLng(targetLatLng)
          .setContent(popupHtml)
          .openOn(map);
      }

      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'SHAPE_SELECTED',
          feature: feature
        }));
      }
    }

    function isFeatureInBounds(feature, bounds) {
      if (!feature || !feature.geometry) return false;
      const geom = feature.geometry;

      if (geom.type === 'Point' && Array.isArray(geom.coordinates)) {
        return bounds.contains([geom.coordinates[1], geom.coordinates[0]]);
      }

      // Quick bounding check if pre-computed
      if (feature._bbox) {
        const [minLng, minLat, maxLng, maxLat] = feature._bbox;
        const fBounds = L.latLngBounds([[minLat, minLng], [maxLat, maxLng]]);
        return bounds.intersects(fBounds);
      }

      // Compute simple bounding box once
      let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
      function scanCoords(c) {
        if (!Array.isArray(c)) return;
        if (typeof c[0] === 'number' && typeof c[1] === 'number') {
          const cLng = c[0], cLat = c[1];
          if (cLat < minLat) minLat = cLat;
          if (cLat > maxLat) maxLat = cLat;
          if (cLng < minLng) minLng = cLng;
          if (cLng > maxLng) maxLng = cLng;
        } else {
          for (let i = 0; i < c.length; i++) scanCoords(c[i]);
        }
      }
      scanCoords(geom.coordinates);

      if (minLat <= maxLat) {
        feature._bbox = [minLng, minLat, maxLng, maxLat];
        const fBounds = L.latLngBounds([[minLat, minLng], [maxLat, maxLng]]);
        return bounds.intersects(fBounds);
      }

      return true;
    }

    // Chunked progressive rendering to keep the WebView at 60 FPS
    function renderFeaturesProgressively(featuresToRender, gen) {
      shapesLayer.clearLayers();
      if (!featuresToRender || featuresToRender.length === 0 || !shapesVisible) return;

      const chunkSize = 150;
      let index = 0;

      function renderNextChunk() {
        if (gen !== currentRenderGen || !shapesVisible) return;

        const slice = featuresToRender.slice(index, index + chunkSize);
        if (slice.length === 0) return;

        const chunkGroup = L.geoJSON({ type: 'FeatureCollection', features: slice }, {
          renderer: canvasRenderer,
          style: function(f) {
            return getFeatureStyle(f, false);
          },
          pointToLayer: function(f, latlng) {
            const s = getFeatureStyle(f, false);
            return L.circleMarker(latlng, {
              ...s,
              radius: 6
            });
          },
          onEachFeature: function(f, layer) {
            layer.on('click', function(e) {
              L.DomEvent.stopPropagation(e);
              onShapeClicked(f, layer, e.latlng);
            });
          }
        });

        chunkGroup.addTo(shapesLayer);
        index += chunkSize;

        if (index < featuresToRender.length) {
          if (window.requestAnimationFrame) {
            window.requestAnimationFrame(renderNextChunk);
          } else {
            setTimeout(renderNextChunk, 0);
          }
        }
      }

      renderNextChunk();
    }

    function updateSmartRendering() {
      if (!shapesVisible) {
        shapesLayer.clearLayers();
        return;
      }
      if (!allShapes || allShapes.length === 0) {
        shapesLayer.clearLayers();
        return;
      }

      currentRenderGen++;
      const gen = currentRenderGen;

      // Small dataset: render all directly
      if (allShapes.length <= 350) {
        renderFeaturesProgressively(allShapes, gen);
        return;
      }

      // Large dataset: apply Viewport Culling with 30% padding buffer
      const currentZoom = map.getZoom();
      const paddedBounds = map.getBounds().pad(0.3);

      const visibleSlice = allShapes.filter(f => {
        // Suppress tiny points at very far zoom levels (LOD)
        if (f.geometry && f.geometry.type === 'Point' && currentZoom < 11) {
          return false;
        }
        return isFeatureInBounds(f, paddedBounds);
      });

      renderFeaturesProgressively(visibleSlice, gen);
    }

    // Debounced viewport updates on pan/zoom
    let moveTimer = null;
    map.on('moveend', function() {
      if (allShapes && allShapes.length > 350 && shapesVisible) {
        clearTimeout(moveTimer);
        moveTimer = setTimeout(updateSmartRendering, 120);
      }
    });

    window.updateShapesData = function(newShapes, newStyles, isVisible) {
      allShapes = Array.isArray(newShapes) ? newShapes : [];
      if (newStyles) stylesData = newStyles;
      if (typeof isVisible === 'boolean') shapesVisible = isVisible;
      updateSmartRendering();
    };

    window.setShapesVisible = function(isVisible) {
      shapesVisible = !!isVisible;
      updateSmartRendering();
    };

    window.fitShapesBounds = function() {
      if (shapesLayer && shapesLayer.getLayers().length > 0) {
        try {
          const b = shapesLayer.getBounds();
          if (b.isValid()) {
            map.fitBounds(b, { padding: [30, 30], maxZoom: 18 });
          }
        } catch (e) {}
      }
    };

    // Initial shape render
    if (allShapes && allShapes.length > 0) {
      updateSmartRendering();
    }

    // ─────────────────────────────────────────────────────────────
    // USER GPS LOCATION & SURVEY CAPTURES
    // ─────────────────────────────────────────────────────────────
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
        } else if (data.type === 'UPDATE_SHAPES') {
          window.updateShapesData(data.shapes, data.styles, data.visible);
        } else if (data.type === 'FIT_SHAPES_BOUNDS') {
          window.fitShapesBounds();
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
        } else if (data.type === 'SHAPE_SELECTED' && onSelectShape) {
          if (data.feature) {
            onSelectShape(data.feature);
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
