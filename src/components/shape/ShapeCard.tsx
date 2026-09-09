import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { Shape } from '../../types/shape.types';
import { filterVisibleShapeAttributes } from '../../utils/shapeAttributeUtils';

interface ShapeCardProps {
  shape: Shape;
  onPress: (shape: Shape) => void;
  stylePreview?: {
    fillColor: string;
    strokeColor: string;
    opacity: number;
    strokeWidth: number;
    markShape: string;
  };
}

export const ShapeCard: React.FC<ShapeCardProps> = ({
  shape,
  onPress,
  stylePreview,
}) => {
  const normType = shape.type?.toUpperCase() || 'POINT';

  const getTypeIcon = () => {
    if (normType.includes('POLYGON')) return 'prism-outline';
    if (normType.includes('LINE')) return 'analytics-outline';
    return 'radio-button-on-outline';
  };

  const getTypeColor = () => {
    if (normType.includes('POLYGON')) return '#20c997';
    if (normType.includes('LINE')) return '#3b82f6';
    return Colors.secondary;
  };

  const attributesCount = filterVisibleShapeAttributes(shape.attributes || []).length;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(shape)}
      activeOpacity={0.85}
    >
      <View style={styles.topRow}>
        {/* Style / Shape Preview Thumbnail */}
        <View
          style={[
            styles.previewBox,
            {
              backgroundColor: stylePreview?.fillColor
                ? `${stylePreview.fillColor}33`
                : 'rgba(255, 156, 92, 0.15)',
              borderColor: stylePreview?.strokeColor || getTypeColor(),
            },
          ]}
        >
          <Ionicons name={getTypeIcon() as any} size={22} color={getTypeColor()} />
        </View>

        {/* Title & Type Badge */}
        <View style={styles.titleArea}>
          <View style={styles.nameBadgeRow}>
            <Text style={styles.shapeName} numberOfLines={1}>
              {shape.name}
            </Text>
            <View
              style={[
                styles.typeBadge,
                { backgroundColor: `${getTypeColor()}22` },
              ]}
            >
              <Text style={[styles.typeBadgeText, { color: getTypeColor() }]}>
                {shape.type || 'POINT'}
              </Text>
            </View>
          </View>

          {shape.description ? (
            <Text style={styles.description} numberOfLines={2}>
              {shape.description}
            </Text>
          ) : (
            <Text style={styles.descriptionPlaceholder}>No description</Text>
          )}
        </View>
      </View>

      {/* Meta Footer */}
      <View style={styles.footerRow}>
        <View style={styles.metaChip}>
          <Ionicons name="list-outline" size={12} color={Colors.textMuted} />
          <Text style={styles.metaChipText}>
            {attributesCount} Attribute{attributesCount === 1 ? '' : 's'}
          </Text>
        </View>

        {stylePreview?.fillColor && (
          <View style={styles.colorSwatchRow}>
            <View
              style={[
                styles.swatchCircle,
                { backgroundColor: stylePreview.fillColor },
              ]}
            />
            <View
              style={[
                styles.swatchBorderCircle,
                { borderColor: stylePreview.strokeColor },
              ]}
            />
          </View>
        )}

        <View style={styles.arrowContainer}>
          <Text style={styles.detailsText}>Attributes</Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.secondary} />
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
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  previewBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleArea: {
    flex: 1,
  },
  nameBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  shapeName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  description: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  descriptionPlaceholder: {
    fontSize: 12,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: 10,
    marginTop: 12,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  metaChipText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  colorSwatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  swatchCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  swatchBorderCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  arrowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  detailsText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.secondary,
  },
});
