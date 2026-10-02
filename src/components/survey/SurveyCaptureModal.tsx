import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { CustomButton } from '../common/CustomButton';
import { useShapes } from '../../hooks/useShapes';
import { Shape } from '../../types/shape.types';
import { LatLng, SurveyCaptureItem, UserLocation } from '../../types/survey.types';
import { filterVisibleShapeAttributes } from '../../utils/shapeAttributeUtils';
import { formatOffset } from '../../utils/geoUtils';
import { MODAL_SUPPORTED_ORIENTATIONS } from '../../config/orientation';

// A survey is saved as a Point shape instance, so only POINT shapes can be used
const isPointShape = (shape: Shape) => (shape.type || '').toUpperCase() === 'POINT';

interface SurveyCaptureModalProps {
  visible: boolean;
  projectId: number;
  imageUri: string | null;
  imageMimeType?: string | null;
  location: UserLocation | null;
  /** Manually corrected position; when set it replaces the GPS lat/lng on save */
  adjustedPosition?: LatLng | null;
  onAdjustPosition?: () => void;
  onClose: () => void;
  /** Rejects when the capture could not be saved at all (the form then stays open) */
  onSave: (item: SurveyCaptureItem) => Promise<void>;
  onRetake: () => void;
}

export const SurveyCaptureModal: React.FC<SurveyCaptureModalProps> = ({
  visible,
  projectId,
  imageUri,
  imageMimeType,
  location,
  adjustedPosition,
  onAdjustPosition,
  onClose,
  onSave,
  onRetake,
}) => {
  const insets = useSafeAreaInsets();
  const { shapes, isLoading: isShapesLoading, getShapeStyle } = useShapes();

  const [selectedShape, setSelectedShape] = useState<Shape | null>(null);
  const [attributeValues, setAttributeValues] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const pointShapes = useMemo(() => shapes.filter(isPointShape), [shapes]);

  // Auto-select the first POINT shape (the last used shape is kept between captures)
  useEffect(() => {
    if (pointShapes.length === 0) return;
    const current = selectedShape && pointShapes.find((s) => s.id === selectedShape.id);
    if (!current) {
      handleSelectShape(pointShapes[0]);
    }
  }, [pointShapes]);

  // New photo -> fresh form (attribute defaults, empty notes)
  useEffect(() => {
    if (!imageUri) return;
    setNotes('');
    if (selectedShape) {
      handleSelectShape(selectedShape);
    }
  }, [imageUri]);

  const handleSelectShape = (shape: Shape) => {
    setSelectedShape(shape);
    const initialAttrs: Record<string, string> = {};
    // Styling attributes and "Obj Name" are set by the backend, like the web app does
    filterVisibleShapeAttributes(shape.attributes || []).forEach((attr) => {
      initialAttrs[attr.name] = attr.defaultValue || '';
    });
    setAttributeValues(initialAttrs);
  };

  const handleAttributeChange = (name: string, value: string) => {
    setAttributeValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!imageUri || !location || !selectedShape || isSaving) return;

    setIsSaving(true);
    const effectiveShape = selectedShape;
    const shapeStyle = getShapeStyle(effectiveShape);

    const captureItem: SurveyCaptureItem = {
      id: `capture_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      projectId,
      imageUri,
      imageMimeType: imageMimeType || 'image/jpeg',
      latitude: adjustedPosition ? adjustedPosition.lat : location.latitude,
      longitude: adjustedPosition ? adjustedPosition.lng : location.longitude,
      ...(adjustedPosition && {
        gpsLatitude: location.latitude,
        gpsLongitude: location.longitude,
        isPositionAdjusted: true,
      }),
      altitude: location.altitude,
      accuracy: location.accuracy,
      timestamp: new Date().toISOString(),
      shapeId: effectiveShape.id,
      shapeName: effectiveShape.name,
      shapeType: effectiveShape.type || 'POINT',
      shapeStyle: {
        fillColor: shapeStyle.fillColor || '#ff9c5c',
        strokeColor: shapeStyle.strokeColor || '#50246f',
        opacity: shapeStyle.opacity || 0.8,
        strokeWidth: shapeStyle.strokeWidth || 2,
      },
      attributeValues,
      notes: notes.trim() || undefined,
    };

    try {
      await onSave(captureItem);
      onClose();
    } catch (e: any) {
      console.error('Failed to save survey capture:', e);
      Alert.alert('Save Failed', 'The survey point could not be saved on this device. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!visible || !imageUri) return null;

  const displayShapes = pointShapes;

  return (
    <Modal supportedOrientations={MODAL_SUPPORTED_ORIENTATIONS} visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(20, insets.bottom + 10) },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>New Survey Point</Text>
              <Text style={styles.headerSubtitle}>Geo-Tagged Photo & Shape Binding</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Photo & Retake bar */}
            <View style={styles.photoContainer}>
              <Image source={{ uri: imageUri }} style={styles.photoPreview} resizeMode="cover" />
              <TouchableOpacity style={styles.retakeBadge} onPress={onRetake} activeOpacity={0.8}>
                <Ionicons name="camera-reverse-outline" size={16} color={Colors.white} />
                <Text style={styles.retakeText}>Retake Photo</Text>
              </TouchableOpacity>
            </View>

            {/* GPS HUD Pill */}
            {location && (() => {
              const gps = { lat: location.latitude, lng: location.longitude };
              const shown = adjustedPosition || gps;
              const offset = adjustedPosition ? formatOffset(gps, adjustedPosition) : null;
              return (
                <>
                  <View style={styles.gpsPill}>
                    <Ionicons
                      name={adjustedPosition ? 'move' : 'navigate'}
                      size={16}
                      color={Colors.secondary}
                    />
                    <View style={styles.gpsTextCol}>
                      <Text style={styles.gpsCoords}>
                        {shown.lat.toFixed(6)}, {shown.lng.toFixed(6)}
                      </Text>
                      <Text style={styles.gpsMeta}>
                        {adjustedPosition
                          ? `Adjusted${offset ? ` · ${offset} of GPS` : ''}`
                          : `Accuracy: ±${location.accuracy?.toFixed(1) || '0'}m • Alt: ${location.altitude?.toFixed(0) || '0'}m`}
                      </Text>
                    </View>
                    <View style={styles.liveGpsDot} />
                  </View>
                  {onAdjustPosition && (
                    <TouchableOpacity
                      style={styles.adjustBtn}
                      onPress={onAdjustPosition}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="move-outline" size={16} color={Colors.secondary} />
                      <Text style={styles.adjustBtnText}>
                        {adjustedPosition ? 'Re-adjust position' : 'Adjust position on map'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              );
            })()}

            {/* Shape Selector */}
            <Text style={styles.sectionLabel}>Select Shape from Library</Text>
            {isShapesLoading && shapes.length === 0 ? (
              <ActivityIndicator size="small" color={Colors.secondary} style={{ marginVertical: 12 }} />
            ) : displayShapes.length === 0 ? (
              <View style={styles.noShapesBox}>
                <Ionicons name="alert-circle-outline" size={16} color={Colors.secondary} />
                <Text style={styles.noShapesText}>
                  No POINT shape is available. Create a POINT shape in the web platform to save survey points.
                </Text>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.shapeCarousel}
              >
                {displayShapes.map((shape) => {
                  const isSelected = selectedShape?.id === shape.id;
                  const style = getShapeStyle(shape);
                  return (
                    <TouchableOpacity
                      key={shape.id}
                      style={[styles.shapeChip, isSelected && styles.shapeChipSelected]}
                      onPress={() => handleSelectShape(shape)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.shapeSwatch,
                          {
                            backgroundColor: style.fillColor || Colors.secondary,
                            borderColor: style.strokeColor || Colors.primary,
                          },
                        ]}
                      />
                      <View style={styles.shapeChipInfo}>
                        <Text
                          style={[styles.shapeChipName, isSelected && styles.shapeChipNameSelected]}
                          numberOfLines={1}
                        >
                          {shape.name}
                        </Text>
                        <Text
                          style={[styles.shapeChipType, isSelected && styles.shapeChipTypeSelected]}
                        >
                          {shape.type || 'POINT'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            {/* Dynamic Attribute Fields (excluding styling metadata) */}
            {(() => {
              const visibleAttrs = filterVisibleShapeAttributes(selectedShape?.attributes || []);
              if (!selectedShape || visibleAttrs.length === 0) return null;
              return (
                <View style={styles.attributesSection}>
                  <Text style={styles.sectionLabel}>
                    {selectedShape.name} Attributes ({visibleAttrs.length})
                  </Text>
                  {visibleAttrs.map((attr) => (
                    <View key={attr.id} style={styles.attributeField}>
                      <Text style={styles.attrLabel}>{attr.name}</Text>
                      <TextInput
                        style={styles.attrInput}
                        value={attributeValues[attr.name] || ''}
                        onChangeText={(val) => handleAttributeChange(attr.name, val)}
                        placeholder={attr.defaultValue || `Enter ${attr.name}`}
                        placeholderTextColor={Colors.textPlaceholder}
                      />
                    </View>
                  ))}
                </View>
              );
            })()}

            {/* Optional Field Notes */}
            <View style={styles.notesSection}>
              <Text style={styles.sectionLabel}>Field Inspection Notes</Text>
              <TextInput
                style={styles.notesInput}
                value={notes}
                onChangeText={setNotes}
                placeholder="Add field observations or notes…"
                placeholderTextColor={Colors.textPlaceholder}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Save Button */}
            <View style={styles.actionRow}>
              <CustomButton
                title="Save Survey Point"
                onPress={handleSave}
                loading={isSaving}
                disabled={!selectedShape || displayShapes.length === 0}
                variant="secondary"
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#16192e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    maxHeight: '92%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.secondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
  },
  scrollContent: {
    padding: 20,
  },
  photoContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    height: 180,
    backgroundColor: '#000',
    position: 'relative',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  retakeBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  retakeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  gpsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 156, 92, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 156, 92, 0.25)',
    gap: 10,
    marginBottom: 18,
  },
  adjustBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: -10,
    marginBottom: 18,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 156, 92, 0.45)',
  },
  adjustBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.secondary,
  },
  gpsTextCol: {
    flex: 1,
  },
  gpsCoords: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  gpsMeta: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  liveGpsDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  noShapesBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    marginBottom: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 156, 92, 0.3)',
    backgroundColor: 'rgba(255, 156, 92, 0.08)',
  },
  noShapesText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  shapeCarousel: {
    gap: 10,
    paddingBottom: 14,
  },
  shapeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 8,
    maxWidth: 180,
  },
  shapeChipSelected: {
    backgroundColor: 'rgba(255, 156, 92, 0.2)',
    borderColor: Colors.secondary,
  },
  shapeSwatch: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
  shapeChipInfo: {
    flexShrink: 1,
  },
  shapeChipName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  shapeChipNameSelected: {
    color: Colors.secondary,
  },
  shapeChipType: {
    fontSize: 10,
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  shapeChipTypeSelected: {
    color: Colors.secondaryLight,
  },
  attributesSection: {
    marginTop: 10,
    marginBottom: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  attributeField: {
    marginBottom: 10,
  },
  attrLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  attrInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: Colors.textPrimary,
    fontSize: 13,
  },
  notesSection: {
    marginBottom: 18,
  },
  notesInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.textPrimary,
    fontSize: 13,
    textAlignVertical: 'top',
    minHeight: 70,
  },
  actionRow: {
    marginTop: 6,
    marginBottom: 20,
  },
});
