import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { useShapes } from '../../hooks/useShapes';
import { ShapeCard } from '../../components/shape/ShapeCard';
import { ShapeFilterChips } from '../../components/shape/ShapeFilterChips';
import { ShapeDetailModal } from '../../components/shape/ShapeDetailModal';
import { ProjectSearchBar } from '../../components/project/ProjectSearchBar';
import { EmptyState } from '../../components/common/EmptyState';
import { Shape } from '../../types/shape.types';

interface ShapesScreenProps {
  onBack: () => void;
}

export const ShapesScreen: React.FC<ShapesScreenProps> = ({ onBack }) => {
  const {
    shapes,
    allShapesCount,
    isLoading,
    isRefreshing,
    error,
    isAdmin,
    searchQuery,
    setSearchQuery,
    activeCategory,
    setActiveCategory,
    getShapeStyle,
    refresh,
    retry,
  } = useShapes();

  const [selectedShape, setSelectedShape] = useState<Shape | null>(null);

  const renderHeader = () => (
    <View style={styles.listHeaderContainer}>
      {/* Search Bar */}
      <ProjectSearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search shapes by name, attribute…"
      />

      {/* Filter Tabs */}
      <ShapeFilterChips
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        totalCount={allShapesCount}
      />

      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Shape Catalog</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{shapes.length}</Text>
          </View>
        </View>
        <Text style={styles.sectionSubtitle}>
          {isAdmin
            ? 'Viewing all system shape schemas & attributes'
            : 'Viewing shapes assigned to your organization'}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bgDark} />
      <SafeAreaView style={styles.safeArea}>
        {/* Top Navbar with Back Button */}
        <View style={styles.navbar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={22} color={Colors.white} />
          </TouchableOpacity>

          <View style={styles.navTitleContainer}>
            <Text style={styles.navTitle}>Shapes Management</Text>
            <Text style={styles.navSub}>GIS Geometry & Attributes</Text>
          </View>

          <View style={{ width: 36 }} />
        </View>

        {/* Main List */}
        {isLoading && !isRefreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#20c997" />
            <Text style={styles.loadingText}>Loading shapes...</Text>
          </View>
        ) : error ? (
          <EmptyState
            iconName="alert-circle-outline"
            title="Failed to Load Shapes"
            description={error}
            actionTitle="Try Again"
            onAction={retry}
          />
        ) : (
          <FlatList
            data={shapes}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <ShapeCard
                shape={item}
                onPress={setSelectedShape}
                stylePreview={getShapeStyle(item)}
              />
            )}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={
              <EmptyState
                iconName={searchQuery ? 'search-outline' : 'shapes-outline'}
                title={searchQuery ? 'No Shapes Found' : 'No Shapes Available'}
                description={
                  searchQuery
                    ? `No shapes match "${searchQuery}". Try a different keyword or reset filters.`
                    : 'There are currently no shapes configured for your organization.'
                }
                actionTitle={searchQuery ? 'Clear Search' : 'Refresh'}
                onAction={searchQuery ? () => setSearchQuery('') : refresh}
              />
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={refresh}
                tintColor="#20c997"
                colors={['#20c997', Colors.secondary]}
              />
            }
          />
        )}

        {/* Shape Detail Modal */}
        <ShapeDetailModal
          shape={selectedShape}
          visible={!!selectedShape}
          onClose={() => setSelectedShape(null)}
        />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDark,
  },
  safeArea: {
    flex: 1,
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
  },
  navTitleContainer: {
    alignItems: 'center',
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  navSub: {
    fontSize: 11,
    color: '#20c997',
    marginTop: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  listHeaderContainer: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionHeader: {
    marginTop: 8,
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
  countBadge: {
    backgroundColor: 'rgba(32, 201, 151, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#20c997',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 3,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
