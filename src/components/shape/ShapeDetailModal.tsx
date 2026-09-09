import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { Shape } from '../../types/shape.types';
import { filterVisibleShapeAttributes } from '../../utils/shapeAttributeUtils';

interface ShapeDetailModalProps {
  shape: Shape | null;
  visible: boolean;
  onClose: () => void;
}

export const ShapeDetailModal: React.FC<ShapeDetailModalProps> = ({
  shape,
  visible,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  if (!shape) return null;

  const visibleAttributes = filterVisibleShapeAttributes(shape.attributes || []);
  const formattedDate = shape.createdAt
    ? new Date(shape.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'N/A';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(20, insets.bottom + 10) },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleArea}>
              <View style={styles.badgeRow}>
                <Text style={styles.shapeName}>{shape.name}</Text>
                <View style={styles.typeBadge}>
                  <Text style={styles.typeBadgeText}>{shape.type || 'POINT'}</Text>
                </View>
              </View>
              <Text style={styles.createdDate}>Created on {formattedDate}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={22} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            {/* Description */}
            {shape.description ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.sectionText}>{shape.description}</Text>
              </View>
            ) : null}

            {/* General Info */}
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Shape ID</Text>
                <Text style={styles.value}>#{shape.id}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Geometry Type</Text>
                <Text style={[styles.value, { color: Colors.secondary }]}>
                  {shape.type || 'POINT'}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Total Attributes</Text>
                <Text style={styles.value}>{visibleAttributes.length}</Text>
              </View>
            </View>

            {/* Attributes List */}
            <Text style={styles.sectionTitle}>Configured Attributes</Text>
            {visibleAttributes.length === 0 ? (
              <Text style={styles.emptyAttributes}>No business attributes defined for this shape.</Text>
            ) : (
              <View style={styles.attributesList}>
                {visibleAttributes.map((attr, idx) => (
                  <View key={attr.id || idx} style={styles.attributeItem}>
                    <View style={styles.attrHeader}>
                      <Text style={styles.attrName}>{attr.name}</Text>
                      <View style={styles.attrTypeBadge}>
                        <Text style={styles.attrTypeText}>{attr.type || 'string'}</Text>
                      </View>
                    </View>

                    <View style={styles.attrMetaRow}>
                      <Text style={styles.attrLabel}>Default Value:</Text>
                      <Text style={styles.attrValue}>{attr.defaultValue || '—'}</Text>
                    </View>

                    {attr.labelDisplay !== undefined && (
                      <View style={styles.attrMetaRow}>
                        <Text style={styles.attrLabel}>Show Label on GIS:</Text>
                        <Text
                          style={[
                            styles.attrValue,
                            { color: attr.labelDisplay ? Colors.success : Colors.textMuted },
                          ]}
                        >
                          {attr.labelDisplay ? 'Yes' : 'No'}
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
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
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shapeName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  typeBadge: {
    backgroundColor: 'rgba(255, 156, 92, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.secondary,
    textTransform: 'uppercase',
  },
  createdDate: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 3,
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
  emptyAttributes: {
    color: Colors.textMuted,
    fontSize: 13,
    fontStyle: 'italic',
    paddingVertical: 10,
  },
  attributesList: {
    gap: 10,
  },
  attributeItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  attrHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  attrName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  attrTypeBadge: {
    backgroundColor: 'rgba(80, 36, 111, 0.4)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  attrTypeText: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  attrMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  attrLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  attrValue: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});
