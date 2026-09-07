import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Project } from '../../types/project.types';
import { SurveyCaptureItem, UserLocation } from '../../types/survey.types';
import { Colors } from '../../theme/colors';
import { ProjectMapView, ProjectMapViewRef } from '../../components/map/ProjectMapView';
import { SurveyCaptureModal } from '../../components/survey/SurveyCaptureModal';
import { SurveyPointDetailModal } from '../../components/survey/SurveyPointDetailModal';
import { ShapeInstanceDetailModal } from '../../components/shape/ShapeInstanceDetailModal';
import { useDeviceLocation } from '../../hooks/useDeviceLocation';
import { useSurveyCaptures } from '../../hooks/useSurveyCaptures';
import { useProjectShapeInstances } from '../../hooks/useProjectShapeInstances';
import { GeoJsonFeature } from '../../types/shapeInstance.types';

interface ProjectMapModalProps {
  visible: boolean;
  project: Project | null;
  onClose: () => void;
  onOpenDetails?: (project: Project) => void;
}

export const ProjectMapModal: React.FC<ProjectMapModalProps> = ({
  visible,
  project,
  onClose,
  onOpenDetails,
}) => {
  const mapRef = useRef<ProjectMapViewRef>(null);

  // Device GPS
  const { location, isLocating, getCurrentLocation } = useDeviceLocation(visible);

  // Local survey captures for this project
  const { captures, addCapture, removeCapture } = useSurveyCaptures(project?.id);

  // Project Shapes Instances (Native & Imported) with smart rendering data
  const {
    features: shapeFeatures,
    allFeaturesCount,
    stats: shapeStats,
    isLoading: isShapesLoading,
    filterCategory,
    setFilterCategory,
    showImported,
    setShowImported,
    showNative,
    setShowNative,
    stylesMap,
    refresh: refreshShapes,
  } = useProjectShapeInstances(project?.id, visible);

  // Modals & UI state
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);
  const [capturedLocation, setCapturedLocation] = useState<UserLocation | null>(null);
  const [isCaptureModalVisible, setIsCaptureModalVisible] = useState<boolean>(false);
  const [selectedCapture, setSelectedCapture] = useState<SurveyCaptureItem | null>(null);
  const [selectedShapeFeature, setSelectedShapeFeature] = useState<GeoJsonFeature | null>(null);
  const [showShapesLayer, setShowShapesLayer] = useState<boolean>(true);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState<boolean>(false);
  const [isCapturesListOpen, setIsCapturesListOpen] = useState<boolean>(false);
  const [isCameraLaunching, setIsCameraLaunching] = useState<boolean>(false);

  if (!visible || !project) return null;

  // Handle Locate & Auto-zoom to exact GPS coordinates
  const handleLocateMe = async () => {
    const loc = await getCurrentLocation();
    const target = loc || location;
    if (target && mapRef.current) {
      mapRef.current.flyToLocation(target.latitude, target.longitude, 18);
    }
  };

  // Handle taking a photo with device camera
  const handleTakePhoto = async () => {
    try {
      setIsCameraLaunching(true);

      // 1. Get exact GPS coordinates first
      const loc = await getCurrentLocation();
      const effectiveLoc: UserLocation = loc ||
        location || {
          latitude: project.lat || 36.8065,
          longitude: project.lng || 10.1815,
          altitude: 0,
          accuracy: 5,
          timestamp: Date.now(),
        };

      // 2. Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Camera Permission',
          'Camera permission is required to capture field photos. Would you like to select a photo from your gallery instead?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Choose from Gallery', onPress: () => handlePickPhoto(effectiveLoc) },
          ]
        );
        setIsCameraLaunching(false);
        return;
      }

      // 3. Launch Camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setCapturedPhotoUri(result.assets[0].uri);
        setCapturedLocation(effectiveLoc);
        setIsCaptureModalVisible(true);
      }
    } catch (e: any) {
      console.error('Error launching camera:', e);
      Alert.alert('Camera Error', 'Could not open the camera. You can select a photo from your gallery instead.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Gallery', onPress: () => handlePickPhoto() },
      ]);
    } finally {
      setIsCameraLaunching(false);
    }
  };

  // Alternative: Pick photo from gallery
  const handlePickPhoto = async (customLoc?: UserLocation) => {
    try {
      const loc = customLoc || (await getCurrentLocation()) || location || {
        latitude: project.lat || 36.8065,
        longitude: project.lng || 10.1815,
        altitude: 0,
        accuracy: 10,
        timestamp: Date.now(),
      };

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setCapturedPhotoUri(result.assets[0].uri);
        setCapturedLocation(loc);
        setIsCaptureModalVisible(true);
      }
    } catch (e) {
      console.error('Error picking photo:', e);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#16192e" />
        <SafeAreaView style={styles.safeArea}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={22} color={Colors.white} />
            </TouchableOpacity>

            <View style={styles.titleContainer}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {project.name}
              </Text>
              <View style={styles.subRow}>
                <View style={styles.liveGpsDot} />
                <Text style={styles.headerSubtitle} numberOfLines={1}>
                  {location
                    ? `GPS: ${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`
                    : project.location || 'Field Survey Mode'}
                </Text>
              </View>
            </View>

            {onOpenDetails && (
              <TouchableOpacity
                style={styles.infoButton}
                onPress={() => onOpenDetails(project)}
                activeOpacity={0.8}
              >
                <Ionicons name="information-circle-outline" size={22} color={Colors.secondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Interactive Map with GPS, Survey Pins & Smart Vector Shapes */}
          <View style={styles.mapContainer}>
            <ProjectMapView
              ref={mapRef}
              project={project}
              userLocation={location}
              captures={captures}
              shapes={shapeFeatures}
              stylesMap={stylesMap}
              showShapes={showShapesLayer}
              onSelectCapture={setSelectedCapture}
              onSelectShape={setSelectedShapeFeature}
            />

            {/* Top Floating GIS Shapes HUD */}
            <View style={styles.topHudContainer}>
              <TouchableOpacity
                style={[
                  styles.shapesHudPill,
                  !showShapesLayer && styles.shapesHudPillDisabled,
                ]}
                onPress={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                activeOpacity={0.85}
              >
                <Ionicons
                  name={showShapesLayer ? 'layers' : 'layers-outline'}
                  size={16}
                  color={showShapesLayer ? Colors.secondary : Colors.textMuted}
                />
                <Text style={styles.shapesHudCount}>
                  {isShapesLoading ? 'Loading...' : `${shapeFeatures.length} Shapes`}
                </Text>
                {filterCategory !== 'ALL' && (
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>{filterCategory}</Text>
                  </View>
                )}
                {isShapesLoading ? (
                  <ActivityIndicator size="small" color={Colors.secondary} style={{ marginLeft: 2 }} />
                ) : (
                  <Ionicons
                    name={isFilterMenuOpen ? 'chevron-up' : 'chevron-down'}
                    size={14}
                    color={Colors.textMuted}
                  />
                )}
              </TouchableOpacity>

              {/* Fit All Shapes into Viewport Button */}
              {shapeFeatures.length > 0 && (
                <TouchableOpacity
                  style={styles.fitBoundsBtn}
                  onPress={() => {
                    if (mapRef.current) {
                      mapRef.current.fitBoundsToShapes();
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="scan-outline" size={16} color={Colors.white} />
                  <Text style={styles.fitBoundsText}>Fit All</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Shapes Filter & Origin Dropdown Panel */}
            {isFilterMenuOpen && (
              <View style={styles.filterMenuPanel}>
                <View style={styles.filterMenuHeader}>
                  <Text style={styles.filterMenuTitle}>GIS Vector Layers</Text>
                  <TouchableOpacity
                    onPress={() => setShowShapesLayer(!showShapesLayer)}
                    style={[
                      styles.toggleLayerBtn,
                      showShapesLayer ? styles.toggleLayerBtnActive : styles.toggleLayerBtnInactive,
                    ]}
                  >
                    <Ionicons
                      name={showShapesLayer ? 'eye' : 'eye-off'}
                      size={14}
                      color={showShapesLayer ? Colors.secondary : Colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.toggleLayerText,
                        { color: showShapesLayer ? Colors.secondary : Colors.textMuted },
                      ]}
                    >
                      {showShapesLayer ? 'Layer Visible' : 'Hidden'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Geometry Filter Chips */}
                <Text style={styles.filterGroupLabel}>Filter by Geometry Type:</Text>
                <View style={styles.filterChipsRow}>
                  {(['ALL', 'POLYGON', 'LINE', 'POINT'] as const).map((cat) => {
                    const count =
                      cat === 'ALL'
                        ? shapeStats.total
                        : cat === 'POLYGON'
                        ? shapeStats.polygons
                        : cat === 'LINE'
                        ? shapeStats.lines
                        : shapeStats.points;

                    const isActive = filterCategory === cat;

                    return (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.filterChip,
                          isActive && styles.filterChipActive,
                        ]}
                        onPress={() => setFilterCategory(cat)}
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            isActive && styles.filterChipTextActive,
                          ]}
                        >
                          {cat === 'ALL' ? 'All' : cat} ({count})
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Origin Source Filter */}
                <Text style={styles.filterGroupLabel}>Shape Origin Source:</Text>
                <View style={styles.originRow}>
                  <TouchableOpacity
                    style={[
                      styles.originChip,
                      showNative && styles.originChipActive,
                    ]}
                    onPress={() => setShowNative(!showNative)}
                  >
                    <Ionicons
                      name={showNative ? 'checkmark-circle' : 'ellipse-outline'}
                      size={14}
                      color={showNative ? '#38bdf8' : Colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.originText,
                        showNative && { color: '#38bdf8', fontWeight: '700' },
                      ]}
                    >
                      Native Web ({shapeStats.native})
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.originChip,
                      showImported && styles.originChipActive,
                    ]}
                    onPress={() => setShowImported(!showImported)}
                  >
                    <Ionicons
                      name={showImported ? 'checkmark-circle' : 'ellipse-outline'}
                      size={14}
                      color={showImported ? '#c084fc' : Colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.originText,
                        showImported && { color: '#c084fc', fontWeight: '700' },
                      ]}
                    >
                      Imported ({shapeStats.imported})
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Floating Action Buttons */}
            <View style={styles.fabContainer}>
              {/* Recenter / GPS Button -> Autozoom to exact location */}
              <TouchableOpacity
                style={styles.gpsFab}
                onPress={handleLocateMe}
                activeOpacity={0.8}
              >
                {isLocating ? (
                  <ActivityIndicator size="small" color={Colors.secondary} />
                ) : (
                  <Ionicons name="locate" size={22} color={Colors.secondary} />
                )}
              </TouchableOpacity>

              {/* Captures Drawer Toggle */}
              {captures.length > 0 && (
                <TouchableOpacity
                  style={styles.drawerFab}
                  onPress={() => setIsCapturesListOpen(!isCapturesListOpen)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="images-outline" size={20} color={Colors.white} />
                  <View style={styles.fabCountBadge}>
                    <Text style={styles.fabCountText}>{captures.length}</Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Primary Capture Photo FAB */}
              <TouchableOpacity
                style={styles.captureFab}
                onPress={handleTakePhoto}
                disabled={isCameraLaunching}
                activeOpacity={0.85}
              >
                {isCameraLaunching ? (
                  <ActivityIndicator size="small" color="#1a1024" />
                ) : (
                  <>
                    <Ionicons name="camera" size={24} color="#1a1024" />
                    <Text style={styles.captureFabText}>Take Photo</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom Captures Drawer (When Open) */}
          {isCapturesListOpen && captures.length > 0 && (
            <View style={styles.capturesDrawer}>
              <View style={styles.drawerTopRow}>
                <Text style={styles.drawerHeaderTitle}>
                  Local Survey Captures ({captures.length})
                </Text>
                <TouchableOpacity onPress={() => setIsCapturesListOpen(false)}>
                  <Ionicons name="chevron-down" size={20} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.drawerCardsScroll}
              >
                {captures.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.captureCard}
                    onPress={() => {
                      if (mapRef.current) {
                        mapRef.current.flyToLocation(item.latitude, item.longitude, 18);
                      }
                      setSelectedCapture(item);
                    }}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri: item.imageUri }} style={styles.cardThumb} />
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardShapeName} numberOfLines={1}>
                        {item.shapeName}
                      </Text>
                      <Text style={styles.cardCoords} numberOfLines={1}>
                        {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Capture Shape & Attribute Binding Modal */}
          <SurveyCaptureModal
            visible={isCaptureModalVisible}
            projectId={project.id}
            imageUri={capturedPhotoUri}
            location={capturedLocation}
            onClose={() => setIsCaptureModalVisible(false)}
            onSave={(item) => {
              addCapture(item);
              if (mapRef.current) {
                mapRef.current.flyToLocation(item.latitude, item.longitude, 18);
              }
              setSelectedCapture(item);
            }}
            onRetake={handleTakePhoto}
          />

          {/* Survey Point Detail Sheet */}
          <SurveyPointDetailModal
            visible={!!selectedCapture}
            capture={selectedCapture}
            onClose={() => setSelectedCapture(null)}
            onDelete={(id) => removeCapture(id)}
          />

          {/* Shape Instance Attribute & Inspection Detail Sheet */}
          <ShapeInstanceDetailModal
            visible={!!selectedShapeFeature}
            feature={selectedShapeFeature}
            onClose={() => setSelectedShapeFeature(null)}
          />
        </SafeAreaView>
      </View>
    </Modal>
  );
};

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
  backButton: {
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
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  liveGpsDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.secondary,
  },
  infoButton: {
    padding: 6,
    backgroundColor: 'rgba(255, 156, 92, 0.12)',
    borderRadius: 10,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 999,
  },
  gpsFab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#16192e',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 156, 92, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  drawerFab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#16192e',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  fabCountBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.secondary,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 10,
  },
  fabCountText: {
    color: '#1a1024',
    fontSize: 10,
    fontWeight: '800',
  },
  captureFab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary,
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 28,
    gap: 8,
    shadowColor: '#ff9c5c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  captureFabText: {
    color: '#1a1024',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  capturesDrawer: {
    backgroundColor: '#16192e',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  drawerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  drawerHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  drawerCardsScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  captureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 10,
    width: 170,
  },
  cardThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#000',
  },
  cardInfo: {
    flex: 1,
  },
  cardShapeName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  cardCoords: {
    fontSize: 11,
    color: Colors.secondary,
    marginTop: 2,
  },
  topHudContainer: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 998,
    pointerEvents: 'box-none',
  },
  shapesHudPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16192e',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 156, 92, 0.4)',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  shapesHudPillDisabled: {
    borderColor: 'rgba(255, 255, 255, 0.15)',
    opacity: 0.75,
  },
  shapesHudCount: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  categoryBadge: {
    backgroundColor: 'rgba(255, 156, 92, 0.18)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  categoryBadgeText: {
    color: Colors.secondary,
    fontSize: 10,
    fontWeight: '800',
  },
  fitBoundsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16192e',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    gap: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  fitBoundsText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  filterMenuPanel: {
    position: 'absolute',
    top: 58,
    left: 14,
    right: 14,
    backgroundColor: '#16192e',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    padding: 14,
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 14,
    elevation: 10,
  },
  filterMenuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: 8,
  },
  filterMenuTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  toggleLayerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  toggleLayerBtnActive: {
    backgroundColor: 'rgba(255, 156, 92, 0.15)',
    borderColor: Colors.secondary,
  },
  toggleLayerBtnInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  toggleLayerText: {
    fontSize: 11,
    fontWeight: '700',
  },
  filterGroupLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 6,
    marginTop: 2,
  },
  filterChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  filterChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterChipActive: {
    backgroundColor: 'rgba(255, 156, 92, 0.2)',
    borderColor: Colors.secondary,
  },
  filterChipText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: Colors.secondary,
    fontWeight: '700',
  },
  originRow: {
    flexDirection: 'row',
    gap: 8,
  },
  originChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    flex: 1,
  },
  originChipActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  originText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
  },
});
