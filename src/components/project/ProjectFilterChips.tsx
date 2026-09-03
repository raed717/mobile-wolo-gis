import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Colors } from '../../theme/colors';
import { ProjectFilterType } from '../../types/project.types';

interface ProjectFilterChipsProps {
  activeFilter: ProjectFilterType;
  onSelectFilter: (filter: ProjectFilterType) => void;
  totalCount: number;
  isAdmin?: boolean;
}

export const ProjectFilterChips: React.FC<ProjectFilterChipsProps> = ({
  activeFilter,
  onSelectFilter,
  totalCount,
  isAdmin = false,
}) => {
  const filters: { id: ProjectFilterType; label: string }[] = isAdmin
    ? [
        { id: 'all', label: 'All Projects' },
        { id: 'organization', label: 'My Organization' },
        { id: 'public', label: 'Public' },
        { id: 'private', label: 'Private' },
      ]
    : [
        { id: 'all', label: 'All My Projects' },
        { id: 'public', label: 'Public' },
        { id: 'private', label: 'Private' },
      ];

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filters.map((tab) => {
          const isActive = activeFilter === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.chip, isActive && styles.activeChip]}
              onPress={() => onSelectFilter(tab.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, isActive && styles.activeChipText]}>
                {tab.label}
              </Text>
              {tab.id === 'all' && (
                <View style={[styles.countBadge, isActive && styles.activeCountBadge]}>
                  <Text style={[styles.countText, isActive && styles.activeCountText]}>
                    {totalCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  scrollContent: {
    gap: 8,
    paddingRight: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 6,
  },
  activeChip: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  chipText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  activeChipText: {
    color: '#1a1024',
    fontWeight: '700',
  },
  countBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  activeCountBadge: {
    backgroundColor: '#1a1024',
  },
  countText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  activeCountText: {
    color: Colors.secondary,
  },
});
