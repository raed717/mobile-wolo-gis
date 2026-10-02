import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { SurveyCaptureItem } from '../../types/survey.types';
import { MODAL_SUPPORTED_ORIENTATIONS } from '../../config/orientation';
import { formatOffset } from '../../utils/geoUtils';
import { getSurveyImageSource } from '../../services/api/surveyService';

interface SurveyPointDetailModalProps {
  capture: SurveyCaptureItem | null;
  visible: boolean;
  onClose: () => void;
  /** Rejects when the deletion failed (the sheet then stays open) */
  onDelete: (capture: SurveyCaptureItem) => Promise<void>;
  onAdjustPosition?: (capture: SurveyCaptureItem) => void;
  onRetrySync?: () => void;
  isSyncing?: boolean;
}

export const SurveyPointDetailModal: React.FC<SurveyPointDetailModalProps> = ({
  capture,
  visible,
  onClose,
  onDelete,
  onAdjustPosition,
  onRetrySync,
  isSyncing,
}) => {
  const insets = useSafeAreaInsets();
  const [fullPhotoVisible, setFullPhotoVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!visible || !capture) return null;

  const formattedDate = capture.timestamp
    ? new Date(capture.timestamp).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'N/A';

  const isSynced = capture.syncStatus === 'synced';
  const isUploading = capture.syncStatus === 'uploading';
  const imageSource = getSurveyImageSource(capture);

  const status = isSynced
    ? { label: 'Synced to server', color: Colors.success, icon: 'cloud-done-outline' as const }
    : isUploading
    ? { label: 'Uploading…', color: Colors.secondary, icon: 'cloud-upload-outline' as const }
    : capture.syncStatus === 'failed'
    ? { label: 'Upload failed', color: Colors.danger, icon: 'cloud-offline-outline' as const }
    : { label: 'Waiting for upload', color: Colors.secondary, icon: 'time-outline' as const };

  const handleDelete = () => {
    Alert.alert(
      'Delete Survey Point',
      isSynced
        ? 'This removes the survey point, its shape and its photo from the project for all users. Continue?'
        : 'This survey point has not been uploaded yet. Remove it and its photo from this device?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await onDelete(capture);
              onClose();
            } catch (e) {
              Alert.alert('Delete Failed', 'Could not delete the survey point. Please try again.');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <>
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
              <View style={styles.titleCol}>
                <View style={styles.badgeRow}>
                  <Text style={styles.shapeName}>{capture.shapeName}</Text>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>{capture.shapeType}</Text>
                  </View>
                </View>
                <Text style={styles.captureDate}>{formattedDate}</Text>
              </View>

              <View style={styles.headerActions}>
                <TouchableOpacity
                  style={styles.deleteIconBtn}
                  onPress={handleDelete}
                  disabled={isDeleting || isUploading}
                >
                  {isDeleting ? (
                    <ActivityIndicator size="small" color={Colors.danger} />
                  ) : (
                    <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                  <Ionicons name="close" size={20} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              {/* Photo Preview */}
              <TouchableOpacity
                style={styles.photoBox}
                onPress={() => setFullPhotoVisible(true)}
                activeOpacity={0.9}
              >
                <Image source={imageSource} style={styles.photo} resizeMode="cover" />
                <View style={styles.expandBadge}>
                  <Ionicons name="expand-outline" size={14} color={Colors.white} />
                  <Text style={styles.expandText}>Tap to view full</Text>
                </View>
              </TouchableOpacity>

              {/* GPS Coordinates HUD */}
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Coordinates</Text>
                  <Text style={styles.value}>
                    {capture.latitude.toFixed(6)}, {capture.longitude.toFixed(6)}
                  </Text>
                </View>

                {capture.isPositionAdjusted &&
                  capture.gpsLatitude !== undefined &&
                  capture.gpsLongitude !== undefined && (
                    <View style={styles.infoRow}>
                      <View style={styles.adjustedBadge}>
                        <Ionicons name="move" size={11} color={Colors.secondary} />
                        <Text style={styles.adjustedBadgeText}>Manually adjusted</Text>
                      </View>
                      <Text style={[styles.value, styles.originalGpsValue]}>
                        GPS: {capture.gpsLatitude.toFixed(6)}, {capture.gpsLongitude.toFixed(6)}
                        {(() => {
                          const off = formatOffset(
                            { lat: capture.gpsLatitude, lng: capture.gpsLongitude },
                            { lat: capture.latitude, lng: capture.longitude }
                          );
                          return off ? `\nMoved ${off}` : '';
                        })()}
                      </Text>
                    </View>
                  )}

                {onAdjustPosition && !isUploading && (
                  <TouchableOpacity
                    style={styles.adjustBtn}
                    onPress={() => onAdjustPosition(capture)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="move-outline" size={15} color={Colors.secondary} />
                    <Text style={styles.adjustBtnText}>Adjust position on map</Text>
                  </TouchableOpacity>
                )}

                {capture.altitude !== undefined && capture.altitude !== null && (
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Altitude / Elevation</Text>
                    <Text style={styles.value}>{capture.altitude.toFixed(1)} m</Text>
                  </View>
                )}

                {capture.accuracy !== undefined && capture.accuracy !== null && (
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>GPS Accuracy</Text>
                    <Text style={[styles.value, { color: Colors.success }]}>
                      ±{capture.accuracy.toFixed(1)} m
                    </Text>
                  </View>
                )}

                {capture.createdByName ? (
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Surveyed by</Text>
                    <Text style={styles.value}>{capture.createdByName}</Text>
                  </View>
                ) : null}

                <View style={styles.infoRow}>
                  <Text style={styles.label}>Storage Status</Text>
                  <View style={styles.statusValue}>
                    <Ionicons name={status.icon} size={14} color={status.color} />
                    <Text style={[styles.value, { color: status.color }]}>{status.label}</Text>
                  </View>
                </View>

                {!isSynced && capture.syncError ? (
                  <Text style={styles.syncErrorText}>{capture.syncError}</Text>
                ) : null}

                {!isSynced && !isUploading && onRetrySync && (
                  <TouchableOpacity
                    style={styles.adjustBtn}
                    onPress={onRetrySync}
                    disabled={isSyncing}
                    activeOpacity={0.8}
                  >
                    {isSyncing ? (
                      <ActivityIndicator size="small" color={Colors.secondary} />
                    ) : (
                      <Ionicons name="cloud-upload-outline" size={15} color={Colors.secondary} />
                    )}
                    <Text style={styles.adjustBtnText}>Upload now</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Notes */}
              {capture.notes ? (
                <View style={styles.notesBox}>
                  <Text style={styles.sectionTitle}>Field Notes</Text>
                  <Text style={styles.notesText}>{capture.notes}</Text>
                </View>
              ) : null}

              {/* Attribute Values */}
              {capture.attributeValues && Object.keys(capture.attributeValues).length > 0 && (
                <View style={styles.attributesSection}>
                  <Text style={styles.sectionTitle}>Recorded Attributes</Text>
                  <View style={styles.attrTable}>
                    {Object.entries(capture.attributeValues).map(([key, val]) => (
                      <View key={key} style={styles.attrRow}>
                        <Text style={styles.attrKey}>{key}</Text>
                        <Text style={styles.attrVal}>{val || '—'}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Full Photo Modal */}
      <Modal supportedOrientations={MODAL_SUPPORTED_ORIENTATIONS} visible={fullPhotoVisible} transparent animationType="fade">
        <View style={styles.fullPhotoOverlay}>
          <TouchableOpacity
            style={styles.fullPhotoClose}
            onPress={() => setFullPhotoVisible(false)}
          >
            <Ionicons name="close" size={28} color={Colors.white} />
          </TouchableOpacity>
          <Image
            source={imageSource}
            style={styles.fullPhoto}
            resizeMode="contain"
          />
        </View>
      </Modal>
    </>
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
    maxHeight: '90%',
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
  statusValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  syncErrorText: {
    fontSize: 11,
    color: Colors.danger,
    marginTop: -4,
    marginBottom: 8,
  },
  titleCol: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shapeName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  typeBadge: {
    backgroundColor: 'rgba(255, 156, 92, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.secondary,
    textTransform: 'uppercase',
  },
  captureDate: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteIconBtn: {
    padding: 8,
    backgroundColor: 'rgba(220, 53, 69, 0.15)',
    borderRadius: 20,
  },
  closeBtn: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
  },
  scrollContent: {
    padding: 20,
  },
  photoBox: {
    borderRadius: 16,
    overflow: 'hidden',
    height: 200,
    backgroundColor: '#000',
    marginBottom: 16,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  expandBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  expandText: {
    color: Colors.white,
    fontSize: 11,
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  value: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  originalGpsValue: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textMuted,
    textAlign: 'right',
  },
  adjustedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 156, 92, 0.15)',
  },
  adjustedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.secondary,
  },
  adjustBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
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
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  notesBox: {
    marginBottom: 16,
  },
  notesText: {
    fontSize: 13,
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  attributesSection: {
    marginBottom: 10,
  },
  attrTable: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 12,
    gap: 8,
  },
  attrRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  attrKey: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  attrVal: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.secondary,
  },
  fullPhotoOverlay: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullPhotoClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 10,
    borderRadius: 20,
  },
  fullPhoto: {
    width: '100%',
    height: '100%',
  },
});
