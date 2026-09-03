import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { ShapeCategory } from '../../types/shape.types';

interface ShapeFilterChipsProps {
  activeCategory: ShapeCategory;
  onSelectCategory: (category: ShapeCategory) => void;
  totalCount: number;
}

const CATEGORIES: { id: ShapeCategory; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'ALL', label: 'All Shapes', icon: 'layers-outline' },
  { id: 'POLYGON', label: 'Polygons', icon: 'prism-outline' },
  { id: 'LINE', label: 'Lines', icon: 'analytics-outline' },
  { id: 'POINT', label: 'Points', icon: 'radio-button-on-outline' },
];

export const ShapeFilterChips: React.FC<ShapeFilterChipsProps> = ({
  activeCategory,
  onSelectCategory,
  totalCount,
}) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {CATEGORIES.map((tab) => {
          const isActive = activeCategory === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.chip, isActive && styles.activeChip]}
              onPress={() => onSelectCategory(tab.id)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={tab.icon}
                size={14}
                color={isActive ? '#1a1024' : Colors.secondary}
              />
              <Text style={[styles.chipText, isActive && styles.activeChipText]}>
                {tab.label}
              </Text>
              {tab.id === 'ALL' && (
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
