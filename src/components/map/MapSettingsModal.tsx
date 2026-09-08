import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Switch,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { ShapeStats, ObjNameFilterItem } from '../../types/shapeInstance.types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export type BasemapType = 'streets' | 'satellite' | 'dark';

interface MapSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  // Basemap
  currentBasemap: BasemapType;
  onSelectBasemap: (type: BasemapType) => void;
  // Shapes
  showShapesLayer: boolean;
  onToggleShapesLayer: (show: boolean) => void;
  filterCategory: 'ALL' | 'POLYGON' | 'LINE' | 'POINT';
  onSelectCategory: (cat: 'ALL' | 'POLYGON' | 'LINE' | 'POINT') => void;
  showNative: boolean;
  onToggleNative: (show: boolean) => void;
  showImported: boolean;
  onToggleImported: (show: boolean) => void;
  shapeStats: ShapeStats;
  // Obj Name Filtering
  objNamesList: ObjNameFilterItem[];
  selectedObjNames: string[];
  onToggleObjName: (name: string) => void;
  onSelectAllObjNames: (names?: string[]) => void;
  onDeselectObjNames: (names?: string[]) => void;
  hasObjNameFilter: boolean;
  // Actions
  onFitAllShapes: () => void;
  onRecenterProject: () => void;
  onLocateMe: () => void;
}

export const MapSettingsModal: React.FC<MapSettingsModalProps> = ({
  visible,
  onClose,
  currentBasemap,
  onSelectBasemap,
  showShapesLayer,
  onToggleShapesLayer,
  filterCategory,
  onSelectCategory,
  showNative,
  onToggleNative,
  showImported,
  onToggleImported,
  shapeStats,
  objNamesList,
  selectedObjNames,
  onToggleObjName,
  onSelectAllObjNames,
  onDeselectObjNames,
  hasObjNameFilter,
  onFitAllShapes,
  onRecenterProject,
  onLocateMe,
}) => {
  const [objSearchText, setObjSearchText] = React.useState('');

  if (!visible) return null;

  // Filter object names based on search text
  const filteredObjNames = objNamesList.filter((item) =>
    item.name.toLowerCase().includes(objSearchText.toLowerCase().trim())
  );

  const areAllCurrentSelected =
    filteredObjNames.length > 0 &&
    filteredObjNames.every((item) => selectedObjNames.includes(item.name));

  const basemaps: { id: BasemapType; label: string; icon: string; desc: string }[] = [
    {
      id: 'streets',
      label: 'Streets',
      icon: 'map-outline',
      desc: 'OpenStreetMap Road Network',
    },
    {
      id: 'satellite',
      label: 'Satellite',
      icon: 'earth',
      desc: 'Esri World Imagery Aerials',
    },
    {
      id: 'dark',
      label: 'Dark GIS',
      icon: 'moon',
      desc: 'CARTO High-Contrast Dark',
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Top Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={styles.headerIcon}>
                <Ionicons name="options" size={20} color={Colors.secondary} />
              </View>
              <View>
                <Text style={styles.title}>Map Settings & Layers</Text>
                <Text style={styles.subtitle}>Basemaps, GIS filters, & navigation</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={22} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Quick Actions Bar */}
            <View style={styles.actionsBar}>
              {shapeStats.total > 0 && (
                <TouchableOpacity
                  style={styles.actionBtnPrimary}
                  onPress={() => {
                    onFitAllShapes();
                    onClose();
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="scan" size={18} color="#1a1024" />
                  <Text style={styles.actionBtnPrimaryText}>Fit All Shapes</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.actionBtnSecondary}
                onPress={() => {
                  onLocateMe();
                  onClose();
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="locate" size={16} color={Colors.secondary} />
                <Text style={styles.actionBtnSecondaryText}>Locate Me</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtnSecondary}
                onPress={() => {
                  onRecenterProject();
                  onClose();
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="radio-button-on" size={16} color={Colors.white} />
                <Text style={styles.actionBtnSecondaryText}>Project Center</Text>
              </TouchableOpacity>
            </View>

            {/* SECTION 1: BASEMAP LAYERS */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="layers-outline" size={16} color={Colors.secondary} />
                <Text style={styles.sectionTitle}>Basemap Imagery</Text>
              </View>

              <View style={styles.basemapsGrid}>
                {basemaps.map((item) => {
                  const isSelected = currentBasemap === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.basemapCard, isSelected && styles.basemapCardActive]}
                      onPress={() => onSelectBasemap(item.id)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={item.icon as any}
                        size={20}
                        color={isSelected ? Colors.secondary : Colors.textMuted}
                      />
                      <Text
                        style={[
                          styles.basemapLabel,
                          isSelected && styles.basemapLabelActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                      <Text style={styles.basemapDesc} numberOfLines={1}>
                        {item.desc}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* SECTION 2: SHAPES & VECTOR LAYERS */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderBetween}>
                <View style={styles.sectionHeaderRow}>
                  <Ionicons name="shapes-outline" size={16} color={Colors.secondary} />
                  <Text style={styles.sectionTitle}>Project Shapes Layer</Text>
                  <View style={styles.badgePill}>
                    <Text style={styles.badgePillText}>{shapeStats.total}</Text>
                  </View>
                </View>

                {/* Master Switch */}
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>
                    {showShapesLayer ? 'Visible' : 'Hidden'}
                  </Text>
                  <Switch
                    value={showShapesLayer}
                    onValueChange={onToggleShapesLayer}
                    trackColor={{ false: 'rgba(255,255,255,0.1)', true: Colors.secondary }}
                    thumbColor={showShapesLayer ? '#16192e' : '#94a3b8'}
                  />
                </View>
              </View>

              {showShapesLayer && (
                <>
                  {/* Geometry Type Filter Chips */}
                  <Text style={styles.subSectionTitle}>Geometry Type:</Text>
                  <View style={styles.filterChipsRow}>
                    {(['ALL', 'POLYGON', 'LINE', 'POINT'] as const).map((cat) => {
                      const count =
                        cat === 'ALL'
                          ? shapeStats.total
                          : cat === 'POLYGON'
                          ? shapeStats.polygons
                          : cat === 'LINE'
                          ? shapeStats.lines
                          : shapeStats.points;

                      const isActive = filterCategory === cat;

                      return (
                        <TouchableOpacity
                          key={cat}
                          style={[styles.filterChip, isActive && styles.filterChipActive]}
                          onPress={() => onSelectCategory(cat)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.filterChipText,
                              isActive && styles.filterChipTextActive,
                            ]}
                          >
                            {cat === 'ALL' ? 'All' : cat} ({count})
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Origin Source Filter */}
                  <Text style={styles.subSectionTitle}>Data Source Origin:</Text>
                  <View style={styles.originRow}>
                    <TouchableOpacity
                      style={[styles.originChip, showNative && styles.originChipActive]}
                      onPress={() => onToggleNative(!showNative)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={showNative ? 'checkmark-circle' : 'ellipse-outline'}
                        size={16}
                        color={showNative ? '#38bdf8' : Colors.textMuted}
                      />
                      <View>
                        <Text
                          style={[
                            styles.originTitle,
                            showNative && { color: '#38bdf8', fontWeight: '700' },
                          ]}
                        >
                          Native Web
                        </Text>
                        <Text style={styles.originCount}>{shapeStats.native} items</Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.originChip, showImported && styles.originChipActive]}
                      onPress={() => onToggleImported(!showImported)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={showImported ? 'checkmark-circle' : 'ellipse-outline'}
                        size={16}
                        color={showImported ? '#c084fc' : Colors.textMuted}
                      />
                      <View>
                        <Text
                          style={[
                            styles.originTitle,
                            showImported && { color: '#c084fc', fontWeight: '700' },
                          ]}
                        >
                          Imported Files
                        </Text>
                        <Text style={styles.originCount}>{shapeStats.imported} items</Text>
                      </View>
                    </TouchableOpacity>
                  </View>

                  {/* Object Name (Obj Name) Sub-Filtering */}
                  {objNamesList.length > 0 && (
                    <View style={styles.objNamesContainer}>
                      <View style={styles.objNamesHeaderRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Ionicons name="filter" size={14} color={Colors.secondary} />
                          <Text style={styles.subSectionTitleNoMargin}>
                            Filter by Object Name ({filterCategory}):
                          </Text>
                        </View>

                        {/* Select All / Clear All Quick Buttons */}
                        <View style={styles.objQuickActions}>
                          <TouchableOpacity
                            style={styles.quickActionTextBtn}
                            onPress={() => {
                              if (areAllCurrentSelected) {
                                // Clear currently shown
                                onDeselectObjNames(filteredObjNames.map((o) => o.name));
                              } else {
                                // Select currently shown
                                onSelectAllObjNames(filteredObjNames.map((o) => o.name));
                              }
                            }}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.quickActionText}>
                              {areAllCurrentSelected ? 'Clear All' : 'Select All'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Search Bar for Object Names (when > 4 items) */}
                      {objNamesList.length > 4 && (
                        <View style={styles.searchBarContainer}>
                          <Ionicons name="search" size={15} color={Colors.textMuted} />
                          <TextInput
                            style={styles.searchInput}
                            placeholder="Search object names..."
                            placeholderTextColor={Colors.textMuted}
                            value={objSearchText}
                            onChangeText={setObjSearchText}
                            autoCapitalize="none"
                            autoCorrect={false}
                          />
                          {objSearchText.length > 0 && (
                            <TouchableOpacity
                              onPress={() => setObjSearchText('')}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                              <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
                            </TouchableOpacity>
                          )}
                        </View>
                      )}

                      {/* Object Names List / Chips */}
                      <View style={styles.objListContainer}>
                        {filteredObjNames.length === 0 ? (
                          <Text style={styles.emptyObjText}>
                            No object names matching "{objSearchText}"
                          </Text>
                        ) : (
                          filteredObjNames.map((item) => {
                            const isSelected = selectedObjNames.includes(item.name);
                            const dotColor = item.color || Colors.secondary;

                            return (
                              <TouchableOpacity
                                key={item.name}
                                style={[
                                  styles.objItemRow,
                                  isSelected && styles.objItemRowSelected,
                                ]}
                                onPress={() => onToggleObjName(item.name)}
                                activeOpacity={0.7}
                              >
                                <View style={styles.objItemLeft}>
                                  <Ionicons
                                    name={isSelected ? 'checkbox' : 'square-outline'}
                                    size={18}
                                    color={isSelected ? Colors.secondary : Colors.textMuted}
                                  />
                                  <View
                                    style={[styles.colorDot, { backgroundColor: dotColor }]}
                                  />
                                  <Text
                                    style={[
                                      styles.objItemName,
                                      isSelected && styles.objItemNameSelected,
                                    ]}
                                    numberOfLines={1}
                                  >
                                    {item.name}
                                  </Text>
                                </View>

                                <View style={styles.objCountBadge}>
                                  <Text style={styles.objCountText}>{item.count}</Text>
                                </View>
                              </TouchableOpacity>
                            );
                          })
                        )}
                      </View>
                    </View>
                  )}
                </>
              )}
            </View>

            <View style={{ height: 32 }} />
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
    maxHeight: SCREEN_HEIGHT * 0.85,
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
    gap: 12,
  },
  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 156, 92, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  actionsBar: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  actionBtnPrimary: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.secondary,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 6,
    shadowColor: '#ff9c5c',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  actionBtnPrimaryText: {
    color: '#1a1024',
    fontSize: 13,
    fontWeight: '800',
  },
  actionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1d223a',
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 5,
  },
  actionBtnSecondaryText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#1d223a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionHeaderBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  badgePill: {
    backgroundColor: 'rgba(255, 156, 92, 0.18)',
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 10,
  },
  badgePillText: {
    fontSize: 11,
    color: Colors.secondary,
    fontWeight: '800',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  basemapsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  basemapCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 4,
  },
  basemapCardActive: {
    backgroundColor: 'rgba(255, 156, 92, 0.12)',
    borderColor: Colors.secondary,
  },
  basemapLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
    marginTop: 2,
  },
  basemapLabelActive: {
    color: Colors.secondary,
    fontWeight: '700',
  },
  basemapDesc: {
    fontSize: 9,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  subSectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 8,
    marginTop: 10,
  },
  filterChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  filterChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterChipActive: {
    backgroundColor: 'rgba(255, 156, 92, 0.2)',
    borderColor: Colors.secondary,
  },
  filterChipText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: Colors.secondary,
    fontWeight: '700',
  },
  originRow: {
    flexDirection: 'row',
    gap: 8,
  },
  originChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  originChipActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  originTitle: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: '500',
  },
  originCount: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 1,
  },
  // Obj Name filtering styles
  objNamesContainer: {
    marginTop: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  objNamesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  subSectionTitleNoMargin: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  objQuickActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickActionTextBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 156, 92, 0.12)',
  },
  quickActionText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.secondary,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: Colors.white,
    padding: 0,
  },
  objListContainer: {
    gap: 4,
    maxHeight: 180,
  },
  emptyObjText: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: 8,
    fontStyle: 'italic',
  },
  objItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  objItemRowSelected: {
    backgroundColor: 'rgba(255, 156, 92, 0.08)',
  },
  objItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  objItemName: {
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
  },
  objItemNameSelected: {
    color: Colors.white,
    fontWeight: '600',
  },
  objCountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 6,
  },
  objCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
  },
});

