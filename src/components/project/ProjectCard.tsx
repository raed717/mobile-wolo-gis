import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { Project } from '../../types/project.types';

interface ProjectCardProps {
  project: Project;
  onPress: (project: Project) => void;
  onViewOnMap?: (project: Project) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onPress,
  onViewOnMap,
}) => {
  const hasCoordinates =
    typeof project.lat === 'number' &&
    typeof project.lng === 'number' &&
    !isNaN(project.lat) &&
    !isNaN(project.lng);

  const formattedDate = project.createdAt
    ? new Date(project.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(project)}
      activeOpacity={0.85}
    >
      {/* Top row: Name & Privacy Badge */}
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <Text style={styles.projectName} numberOfLines={1}>
            {project.name}
          </Text>
          {project.location ? (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={13} color={Colors.secondary} />
              <Text style={styles.locationText} numberOfLines={1}>
                {project.location}
              </Text>
            </View>
          ) : null}
        </View>

        <View
          style={[
            styles.badge,
            project.isPrivate ? styles.privateBadge : styles.publicBadge,
          ]}
        >
          <Ionicons
            name={project.isPrivate ? 'lock-closed' : 'globe-outline'}
            size={11}
            color={project.isPrivate ? Colors.secondary : Colors.success}
          />
          <Text
            style={[
              styles.badgeText,
              { color: project.isPrivate ? Colors.secondary : Colors.success },
            ]}
          >
            {project.isPrivate ? 'Private' : 'Public'}
          </Text>
        </View>
      </View>

      {/* Description */}
      {project.description ? (
        <Text style={styles.description} numberOfLines={2}>
          {project.description}
        </Text>
      ) : null}

      {/* Tags / Metadata Chips */}
      <View style={styles.metaRow}>
        {project.organization?.name ? (
          <View style={styles.metaChip}>
            <Ionicons name="business-outline" size={12} color={Colors.textMuted} />
            <Text style={styles.metaText} numberOfLines={1}>
              {project.organization.name}
            </Text>
          </View>
        ) : (
          <View style={styles.metaChip}>
            <Ionicons name="business-outline" size={12} color={Colors.textMuted} />
            <Text style={styles.metaText}>Org #{project.organizationId}</Text>
          </View>
        )}

        {hasCoordinates && (
          <View style={styles.metaChip}>
            <Ionicons name="navigate-outline" size={12} color={Colors.textMuted} />
            <Text style={styles.metaText}>
              {project.lat?.toFixed(3)}, {project.lng?.toFixed(3)}
            </Text>
          </View>
        )}

        {formattedDate && (
          <View style={styles.metaChip}>
            <Ionicons name="calendar-outline" size={12} color={Colors.textMuted} />
            <Text style={styles.metaText}>{formattedDate}</Text>
          </View>
        )}
      </View>

      {/* Footer / Indicator & Actions */}
      <View style={styles.footerRow}>
        <View style={styles.featuresRow}>
          {project.orthophotoUrl && project.orthophotoUrl.length > 0 && (
            <View style={styles.featureBadge}>
              <Ionicons name="images-outline" size={12} color={Colors.textSecondary} />
              <Text style={styles.featureText}>Orthophoto</Text>
            </View>
          )}
          {project.cloudUrl && project.cloudUrl.length > 0 && (
            <View style={styles.featureBadge}>
              <Ionicons name="cube-outline" size={12} color={Colors.textSecondary} />
              <Text style={styles.featureText}>3D Cloud</Text>
            </View>
          )}
        </View>

        <View style={styles.actionsRow}>
          {hasCoordinates && onViewOnMap && (
            <TouchableOpacity
              style={styles.mapButton}
              onPress={() => onViewOnMap(project)}
              activeOpacity={0.7}
            >
              <Ionicons name="map" size={14} color={Colors.secondary} />
              <Text style={styles.mapButtonText}>Map</Text>
            </TouchableOpacity>
          )}

          <View style={styles.arrowContainer}>
            <Text style={styles.viewDetailsText}>Details</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.textSecondary} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#161a2e',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    marginRight: 10,
  },
  projectName: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  locationText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  privateBadge: {
    backgroundColor: 'rgba(255, 156, 92, 0.12)',
  },
  publicBadge: {
    backgroundColor: 'rgba(40, 167, 69, 0.12)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  description: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: 10,
    marginTop: 4,
  },
  featuresRow: {
    flexDirection: 'row',
    gap: 6,
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(80, 36, 111, 0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  featureText: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 156, 92, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 156, 92, 0.3)',
    gap: 4,
  },
  mapButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.secondary,
  },
  arrowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});
