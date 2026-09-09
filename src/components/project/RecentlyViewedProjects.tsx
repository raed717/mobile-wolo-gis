import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { Project } from '../../types/project.types';
import { formatRelativeTime } from '../../hooks/useRecentProjects';

interface RecentlyViewedProjectsProps {
  recentProjects: (Project & { recentViewedAt?: number })[];
  onSelectProject: (project: Project) => void;
  onViewOnMap?: (project: Project) => void;
  onClear?: () => void;
}

export const RecentlyViewedProjects: React.FC<RecentlyViewedProjectsProps> = ({
  recentProjects,
  onSelectProject,
  onViewOnMap,
  onClear,
}) => {
  if (!recentProjects || recentProjects.length === 0) return null;

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <View style={styles.iconCircle}>
            <Ionicons name="time" size={14} color={Colors.secondary} />
          </View>
          <Text style={styles.sectionTitle}>Recently Viewed</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{recentProjects.length}</Text>
          </View>
        </View>

        {onClear && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={onClear}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={13} color={Colors.textMuted} />
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Horizontal Cards Scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {recentProjects.map((project) => {
          const hasCoordinates =
            typeof project.lat === 'number' &&
            typeof project.lng === 'number' &&
            !isNaN(project.lat) &&
            !isNaN(project.lng);

          const timeAgo = project.recentViewedAt
            ? formatRelativeTime(project.recentViewedAt)
            : null;

          return (
            <TouchableOpacity
              key={`recent-${project.id}`}
              style={styles.card}
              onPress={() => onSelectProject(project)}
              activeOpacity={0.85}
            >
              {/* Card Top Row: Privacy/Type & Relative Time */}
              <View style={styles.cardHeaderRow}>
                <View
                  style={[
                    styles.privacyTag,
                    project.isPrivate ? styles.privateTag : styles.publicTag,
                  ]}
                >
                  <Ionicons
                    name={project.isPrivate ? 'lock-closed' : 'globe-outline'}
                    size={9}
                    color={project.isPrivate ? Colors.secondary : Colors.success}
                  />
                  <Text
                    style={[
                      styles.privacyText,
                      { color: project.isPrivate ? Colors.secondary : Colors.success },
                    ]}
                  >
                    {project.isPrivate ? 'Private' : 'Public'}
                  </Text>
                </View>

                {timeAgo && (
                  <View style={styles.timeBadge}>
                    <Ionicons name="time-outline" size={10} color="#ff9c5c" />
                    <Text style={styles.timeText}>{timeAgo}</Text>
                  </View>
                )}
              </View>

              {/* Project Name */}
              <Text style={styles.projectName} numberOfLines={1}>
                {project.name}
              </Text>

              {/* Location or Org */}
              <View style={styles.locationRow}>
                <Ionicons
                  name={project.location ? 'location-outline' : 'business-outline'}
                  size={12}
                  color={Colors.textMuted}
                />
                <Text style={styles.locationText} numberOfLines={1}>
                  {project.location || project.organization?.name || `Org #${project.organizationId}`}
                </Text>
              </View>

              {/* Card Footer: Map Action & Details Arrow */}
              <View style={styles.cardFooter}>
                {hasCoordinates && onViewOnMap ? (
                  <TouchableOpacity
                    style={styles.mapActionBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      onViewOnMap(project);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="map" size={12} color={Colors.secondary} />
                    <Text style={styles.mapActionText}>Map</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={{ flex: 1 }} />
                )}

                <View style={styles.arrowRow}>
                  <Text style={styles.arrowText}>Open</Text>
                  <Ionicons name="chevron-forward" size={12} color={Colors.textSecondary} />
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  iconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 156, 92, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 0.2,
  },
  countBadge: {
    backgroundColor: 'rgba(255, 156, 92, 0.18)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.secondary,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  clearText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  scrollContent: {
    paddingRight: 10,
    gap: 10,
  },
  card: {
    width: 200,
    backgroundColor: '#161a2e',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 156, 92, 0.25)',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  privacyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  publicTag: {
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
  },
  privateTag: {
    backgroundColor: 'rgba(255, 156, 92, 0.1)',
  },
  privacyText: {
    fontSize: 9,
    fontWeight: '600',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255, 156, 92, 0.12)',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  timeText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#ff9c5c',
  },
  projectName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  locationText: {
    fontSize: 11,
    color: Colors.textMuted,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: 8,
  },
  mapActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 156, 92, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 156, 92, 0.25)',
  },
  mapActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.secondary,
  },
  arrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  arrowText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
});
