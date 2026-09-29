import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { Project } from '../../types/project.types';
import { LatLng, SurveyCaptureItem, UserLocation } from '../../types/survey.types';
import { GeoJsonFeature, ShapeStyleDefinition } from '../../types/shapeInstance.types';
import { ProjectMapView, ProjectMapViewRef, BasemapType } from '../map/ProjectMapView';
import { CustomButton } from '../common/CustomButton';
import { MODAL_SUPPORTED_ORIENTATIONS } from '../../config/orientation';
import { distanceMeters, formatOffset, offsetByMeters } from '../../utils/geoUtils';

const STEP_OPTIONS = [0.5, 1, 5];
const ADJUST_ZOOM = 20;
const HOLD_REPEAT_MS = 150;

interface PositionAdjustModalProps {
  visible: boolean;
  project: Project;
  shapes: GeoJsonFeature[];
  stylesMap?: {
    byId: Record<number, ShapeStyleDefinition>;
    byName: Record<string, ShapeStyleDefinition>;
  };
  backendUrl?: string;
  /** Other captures shown for context (exclude the one being adjusted) */
  captures: SurveyCaptureItem[];
  /** Where the crosshair starts (current point position) */
  initialPosition: LatLng;
  /** Raw GPS fix the offset is measured against */
  gpsPosition: LatLng;
  accuracy?: number | null;
  onCancel: () => void;
  onConfirm: (position: LatLng) => void;
}

type Direction = 'N' | 'S' | 'E' | 'W';

export const PositionAdjustModal: React.FC<PositionAdjustModalProps> = ({
  visible,
  project,
  shapes,
  stylesMap,
  backendUrl,
  captures,
  initialPosition,
  gpsPosition,
  accuracy,
  onCancel,
  onConfirm,
}) => {
  const mapRef = useRef<ProjectMapViewRef>(null);
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  // Stable for the lifetime of this modal instance so the map HTML is built once
  const [initialView] = useState(() => ({
    lat: initialPosition.lat,
    lng: initialPosition.lng,
    zoom: ADJUST_ZOOM,
  }));
  const gpsMarker = useMemo<UserLocation>(
    () => ({
      latitude: gpsPosition.lat,
      longitude: gpsPosition.lng,
      accuracy: accuracy ?? null,
      timestamp: Date.now(),
    }),
    [gpsPosition.lat, gpsPosition.lng, accuracy]
  );

  const [current, setCurrent] = useState<LatLng>(initialPosition);
  // Ref mirrors state so rapid / held arrow presses always build on the latest position
  const currentRef = useRef<LatLng>(initialPosition);
  const [step, setStep] = useState<number>(1);
  const [basemap, setBasemap] = useState<BasemapType>('satellite');
  const holdTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => stopHold(), []);

  const moveTo = (pos: LatLng) => {
    currentRef.current = pos;
    setCurrent(pos);
    mapRef.current?.setView(pos.lat, pos.lng);
  };

  const nudge = (dir: Direction) => {
    const north = dir === 'N' ? step : dir === 'S' ? -step : 0;
    const east = dir === 'E' ? step : dir === 'W' ? -step : 0;
    moveTo(offsetByMeters(currentRef.current, north, east));
  };

  const startHold = (dir: Direction) => {
    stopHold();
    holdTimer.current = setInterval(() => nudge(dir), HOLD_REPEAT_MS);
  };

  function stopHold() {
    if (holdTimer.current) {
      clearInterval(holdTimer.current);
      holdTimer.current = null;
    }
  }

  const handleCenterChange = (lat: number, lng: number) => {
    currentRef.current = { lat, lng };
    setCurrent({ lat, lng });
  };

  const toggleBasemap = () => {
    const next: BasemapType = basemap === 'satellite' ? 'streets' : 'satellite';
    setBasemap(next);
    mapRef.current?.switchBasemap(next);
  };

  const offsetLabel = formatOffset(gpsPosition, current);
  const offsetM = distanceMeters(gpsPosition, current);
  const warnThreshold = Math.max(3 * (accuracy || 0), 20);
  const isFarFromGps = offsetM > warnThreshold;

  if (!visible) return null;

  const renderArrow = (dir: Direction, icon: keyof typeof Ionicons.glyphMap) => (
    <TouchableOpacity
      style={styles.arrowBtn}
      onPress={() => nudge(dir)}
      onLongPress={() => startHold(dir)}
      onPressOut={stopHold}
      delayLongPress={350}
      activeOpacity={0.7}
      accessibilityLabel={`Move ${step} meters ${dir}`}
    >
      <Ionicons name={icon} size={24} color={Colors.white} />
    </TouchableOpacity>
  );

  const controls = (
    <View style={[styles.controls, isLandscape && styles.controlsLandscape]}>
      <View style={styles.stepRow}>
        <Text style={styles.stepLabel}>Step</Text>
        {STEP_OPTIONS.map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.stepChip, step === s && styles.stepChipActive]}
            onPress={() => setStep(s)}
            activeOpacity={0.8}
          >
            <Text style={[styles.stepChipText, step === s && styles.stepChipTextActive]}>
              {s} m
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.padRow}>
        <View style={styles.pad}>
          <View style={styles.padLine}>{renderArrow('N', 'chevron-up')}</View>
          <View style={styles.padLine}>
            {renderArrow('W', 'chevron-back')}
            <View style={styles.padCenter}>
              <Ionicons name="locate-outline" size={18} color={Colors.textMuted} />
            </View>
            {renderArrow('E', 'chevron-forward')}
          </View>
          <View style={styles.padLine}>{renderArrow('S', 'chevron-down')}</View>
        </View>
      </View>

      <CustomButton
        title="Confirm Position"
        onPress={() => onConfirm(currentRef.current)}
        variant="secondary"
      />
    </View>
  );

  return (
    <Modal
      supportedOrientations={MODAL_SUPPORTED_ORIENTATIONS}
      visible={visible}
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#16192e" />
        <SafeAreaView style={styles.safeArea}>
          {/* Top Bar */}
          <View style={[styles.topBar, isLandscape && styles.topBarCompact]}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onCancel}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={22} color={Colors.white} />
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <Text style={styles.headerTitle}>Adjust Position</Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                Move the map so the crosshair sits on the feature
              </Text>
            </View>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => moveTo(gpsPosition)}
              disabled={!offsetLabel}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={16} color={offsetLabel ? Colors.secondary : Colors.textMuted} />
              <Text style={[styles.resetText, !offsetLabel && { color: Colors.textMuted }]}>Reset</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.body, isLandscape && styles.bodyLandscape]}>
            {/* Map with fixed center crosshair */}
            <View style={styles.mapContainer}>
              <ProjectMapView
                ref={mapRef}
                project={project}
                userLocation={gpsMarker}
                captures={captures}
                shapes={shapes}
                stylesMap={stylesMap}
                backendUrl={backendUrl}
                initialView={initialView}
                initialBasemap="satellite"
                onCenterChange={handleCenterChange}
              />

              <View style={styles.crosshair} pointerEvents="none">
                <View style={styles.crosshairLineH} />
                <View style={styles.crosshairLineV} />
                <View style={styles.crosshairDot} />
              </View>

              {/* Coordinates / offset HUD */}
              <View style={styles.hud} pointerEvents="none">
                <Text style={styles.hudCoords}>
                  {current.lat.toFixed(6)}, {current.lng.toFixed(6)}
                </Text>
                <Text style={[styles.hudOffset, isFarFromGps && { color: Colors.warning }]}>
                  {offsetLabel ? `Moved ${offsetLabel} of GPS` : 'At GPS position'}
                  {accuracy ? `  •  GPS ±${accuracy.toFixed(1)} m` : ''}
                </Text>
                {isFarFromGps && (
                  <Text style={styles.hudWarning}>
                    Far from the GPS fix — double-check the location
                  </Text>
                )}
              </View>

              <TouchableOpacity style={styles.basemapToggle} onPress={toggleBasemap} activeOpacity={0.8}>
                <Ionicons
                  name={basemap === 'satellite' ? 'map-outline' : 'earth'}
                  size={20}
                  color={Colors.secondary}
                />
              </TouchableOpacity>
            </View>

            {controls}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const CROSSHAIR_SIZE = 44;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16192e',
  },
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#16192e',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    gap: 12,
  },
  topBarCompact: {
    paddingVertical: 6,
  },
  iconButton: {
    padding: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
  },
  titleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 156, 92, 0.12)',
    borderRadius: 10,
  },
  resetText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.secondary,
  },
  body: {
    flex: 1,
  },
  bodyLandscape: {
    flexDirection: 'row',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  crosshair: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: CROSSHAIR_SIZE,
    height: CROSSHAIR_SIZE,
    marginLeft: -CROSSHAIR_SIZE / 2,
    marginTop: -CROSSHAIR_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crosshairLineH: {
    position: 'absolute',
    width: CROSSHAIR_SIZE,
    height: 2,
    backgroundColor: Colors.secondary,
  },
  crosshairLineV: {
    position: 'absolute',
    width: 2,
    height: CROSSHAIR_SIZE,
    backgroundColor: Colors.secondary,
  },
  crosshairDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: Colors.white,
    backgroundColor: Colors.secondary,
  },
  hud: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 64,
    backgroundColor: 'rgba(22, 25, 46, 0.9)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 156, 92, 0.35)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  hudCoords: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  hudOffset: {
    fontSize: 12,
    color: Colors.secondary,
    marginTop: 2,
  },
  hudWarning: {
    fontSize: 11,
    color: Colors.warning,
    marginTop: 4,
  },
  basemapToggle: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#16192e',
    borderWidth: 1,
    borderColor: 'rgba(255, 156, 92, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controls: {
    backgroundColor: '#16192e',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 10,
  },
  controlsLandscape: {
    width: 260,
    borderTopWidth: 0,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginRight: 4,
  },
  stepChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  stepChipActive: {
    borderColor: Colors.secondary,
    backgroundColor: 'rgba(255, 156, 92, 0.18)',
  },
  stepChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  stepChipTextActive: {
    color: Colors.secondary,
  },
  padRow: {
    alignItems: 'center',
  },
  pad: {
    alignItems: 'center',
    gap: 4,
  },
  padLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  arrowBtn: {
    width: 52,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  padCenter: {
    width: 52,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
