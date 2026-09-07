import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { GeoJsonFeature } from '../../types/shapeInstance.types';

interface ShapeInstanceDetailModalProps {
  visible: boolean;
  feature: GeoJsonFeature | null;
  onClose: () => void;
  onFocus?: (feature: GeoJsonFeature) => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const ShapeInstanceDetailModal: React.FC<ShapeInstanceDetailModalProps> = ({
  visible,
  feature,
  onClose,
  onFocus,
}) => {
  if (!visible || !feature) return null;

  const geomType = feature.geometry?.type || 'Geometry';
  const properties = feature.properties || {};
  const isImported = !!feature.isImported;
  const objName = properties['Obj Name'] || properties['name'] || `Feature #${feature.id}`;

  // Filter out internal/noisy keys
  const hiddenKeys = new Set([
    'id',
    'projectId',
    'createdAt',
    'createdBy',
    'isImported',
    'markShape',
    'markerSize',
    'Obj Name',
    'name',
  ]);

  const displayProperties = Object.entries(properties).filter(
    ([key]) => !hiddenKeys.has(key)
  );

  const getGeometryIcon = () => {
    const t = geomType.toUpperCase();
    if (t.includes('POLYGON')) return 'cube-outline';
    if (t.includes('LINE')) return 'git-branch-outline';
    return 'location-outline';
  };

  const getGeometryColor = () => {
    const t = geomType.toUpperCase();
    if (t.includes('POLYGON')) return '#ff9c5c';
    if (t.includes('LINE')) return '#4ade80';
    return '#38bdf8';
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: `${getGeometryColor()}22` },
                ]}
              >
                <Ionicons
                  name={getGeometryIcon() as any}
                  size={20}
                  color={getGeometryColor()}
                />
              </View>
              <View style={styles.titleTextContainer}>
                <Text style={styles.shapeTitle} numberOfLines={1}>
                  {objName}
                </Text>
                <View style={styles.badgesRow}>
                  <View style={[styles.badge, { borderColor: getGeometryColor() }]}>
                    <Text style={[styles.badgeText, { color: getGeometryColor() }]}>
                      {geomType}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.originBadge,
                      {
                        backgroundColor: isImported
                          ? 'rgba(168, 85, 247, 0.2)'
                          : 'rgba(56, 189, 248, 0.2)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.originBadgeText,
                        { color: isImported ? '#c084fc' : '#38bdf8' },
                      ]}
                    >
                      {isImported ? 'Imported Shape' : 'Native Platform'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={22} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Metadata Summary Card */}
            <View style={styles.metaCard}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Feature ID</Text>
                <Text style={styles.metaValue}>#{feature.id}</Text>
              </View>
              <View style={styles.metaDivider} />
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Geometry</Text>
                <Text style={styles.metaValue}>{geomType}</Text>
              </View>
              <View style={styles.metaDivider} />
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Origin</Text>
                <Text style={styles.metaValue}>
                  {isImported ? 'Shapefile/JSON' : 'Native'}
                </Text>
              </View>
            </View>

            {/* Properties & Attributes Table */}
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="list-outline" size={16} color={Colors.secondary} />
              <Text style={styles.sectionTitle}>Attributes & Properties</Text>
              <View style={styles.countPill}>
                <Text style={styles.countText}>{displayProperties.length}</Text>
              </View>
            </View>

            {displayProperties.length === 0 ? (
              <View style={styles.emptyPropertiesBox}>
                <Ionicons name="information-circle-outline" size={20} color={Colors.textMuted} />
                <Text style={styles.emptyPropertiesText}>
                  No additional custom attributes for this shape.
                </Text>
              </View>
            ) : (
              <View style={styles.propertiesContainer}>
                {displayProperties.map(([key, value], idx) => (
                  <View
                    key={key}
                    style={[
                      styles.propRow,
                      idx === displayProperties.length - 1 && styles.lastPropRow,
                    ]}
                  >
                    <Text style={styles.propKey}>{key}</Text>
                    <Text style={styles.propValue} numberOfLines={3} selectable>
                      {value !== null && value !== undefined ? String(value) : '—'}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <View style={{ height: 28 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#16192e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    maxHeight: SCREEN_HEIGHT * 0.75,
    paddingTop: 8,
  },
  handle: {
    width: 44,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleTextContainer: {
    flex: 1,
  },
  shapeTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.3,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  originBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  originBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  closeButton: {
    padding: 6,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  metaCard: {
    flexDirection: 'row',
    backgroundColor: '#1d223a',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  metaItem: {
    flex: 1,
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
    marginBottom: 3,
  },
  metaValue: {
    fontSize: 13,
    color: Colors.white,
    fontWeight: '700',
  },
  metaDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  countPill: {
    backgroundColor: 'rgba(255, 156, 92, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 10,
  },
  countText: {
    fontSize: 11,
    color: Colors.secondary,
    fontWeight: '700',
  },
  emptyPropertiesBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    backgroundColor: '#1d223a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  emptyPropertiesText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  propertiesContainer: {
    backgroundColor: '#1d223a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  propRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  lastPropRow: {
    borderBottomWidth: 0,
  },
  propKey: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
    flex: 1,
    marginRight: 10,
  },
  propValue: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.white,
    flex: 1.3,
    textAlign: 'right',
  },
});
