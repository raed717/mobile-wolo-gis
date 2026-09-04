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
import { useDeviceLocation } from '../../hooks/useDeviceLocation';
import { useSurveyCaptures } from '../../hooks/useSurveyCaptures';

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

  // Modals state
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);
  const [capturedLocation, setCapturedLocation] = useState<UserLocation | null>(null);
  const [isCaptureModalVisible, setIsCaptureModalVisible] = useState<boolean>(false);
  const [selectedCapture, setSelectedCapture] = useState<SurveyCaptureItem | null>(null);
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

          {/* Interactive Map with GPS & Survey Pins */}
          <View style={styles.mapContainer}>
            <ProjectMapView
              ref={mapRef}
              project={project}
              userLocation={location}
              captures={captures}
              onSelectCapture={setSelectedCapture}
            />

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
});
