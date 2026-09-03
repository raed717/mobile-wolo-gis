import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { Project } from '../../types/project.types';
import { CustomButton } from '../common/CustomButton';

interface ProjectDetailModalProps {
  project: Project | null;
  visible: boolean;
  onClose: () => void;
  onViewOnMap?: (project: Project) => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  project,
  visible,
  onClose,
  onViewOnMap,
}) => {
  if (!project) return null;

  const hasCoords =
    typeof project.lat === 'number' &&
    typeof project.lng === 'number' &&
    !isNaN(project.lat) &&
    !isNaN(project.lng);

  const formattedDate = project.createdAt
    ? new Date(project.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'N/A';

  const handleMapPress = () => {
    onClose();
    if (onViewOnMap) {
      setTimeout(() => onViewOnMap(project), 200);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleArea}>
              <Text style={styles.projectName}>{project.name}</Text>
              {project.location && (
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={14} color={Colors.secondary} />
                  <Text style={styles.locationText}>{project.location}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={22} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            {/* Description */}
            {project.description ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.sectionText}>{project.description}</Text>
              </View>
            ) : null}

            {/* General Info Card */}
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Project ID</Text>
                <Text style={styles.value}>#{project.id}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Visibility</Text>
                <Text
                  style={[
                    styles.value,
                    { color: project.isPrivate ? Colors.secondary : Colors.success },
                  ]}
                >
                  {project.isPrivate ? 'Private' : 'Public'}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Organization</Text>
                <Text style={styles.value}>
                  {project.organization?.name || `#${project.organizationId}`}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Created On</Text>
                <Text style={styles.value}>{formattedDate}</Text>
              </View>

              {hasCoords && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>GPS Coordinates</Text>
                  <Text style={styles.value}>
                    {project.lat?.toFixed(5)}, {project.lng?.toFixed(5)}
                  </Text>
                </View>
              )}
            </View>

            {/* GIS & Media Assets */}
            <Text style={styles.sectionTitle}>GIS & Field Data</Text>
            <View style={styles.assetsGrid}>
              <View style={styles.assetItem}>
                <Ionicons name="images-outline" size={22} color={Colors.secondary} />
                <Text style={styles.assetTitle}>Orthophoto</Text>
                <Text style={styles.assetCount}>
                  {project.orthophotoUrl?.length || 0} Layers
                </Text>
              </View>

              <View style={styles.assetItem}>
                <Ionicons name="cube-outline" size={22} color={Colors.secondary} />
                <Text style={styles.assetTitle}>Point Cloud</Text>
                <Text style={styles.assetCount}>
                  {project.cloudUrl?.length || 0} Models
                </Text>
              </View>

              <View style={styles.assetItem}>
                <Ionicons name="document-text-outline" size={22} color={Colors.secondary} />
                <Text style={styles.assetTitle}>CSV / Metadata</Text>
                <Text style={styles.assetCount}>
                  {project.csvUrl?.length || 0} Files
                </Text>
              </View>
            </View>

            {/* Actions */}
            {hasCoords && (
              <View style={styles.actionContainer}>
                <CustomButton
                  title="View on Map"
                  onPress={handleMapPress}
                  variant="secondary"
                />
              </View>
            )}
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
    maxHeight: '85%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  titleArea: {
    flex: 1,
    marginRight: 10,
  },
  projectName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  locationText: {
    fontSize: 13,
    color: Colors.secondary,
  },
  closeBtn: {
    padding: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
  },
  body: {
    padding: 20,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  sectionText: {
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 20,
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
  assetsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
    marginBottom: 20,
  },
  assetItem: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  assetTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 6,
  },
  assetCount: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  actionContainer: {
    marginTop: 10,
  },
});
