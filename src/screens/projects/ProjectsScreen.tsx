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
import { useProjects } from '../../hooks/useProjects';
import { ProjectCard } from '../../components/project/ProjectCard';
import { ProjectSearchBar } from '../../components/project/ProjectSearchBar';
import { ProjectFilterChips } from '../../components/project/ProjectFilterChips';
import { RecentlyViewedProjects } from '../../components/project/RecentlyViewedProjects';
import { ProjectDetailModal } from '../../components/project/ProjectDetailModal';
import { ProjectMapModal } from '../map/ProjectMapModal';
import { EmptyState } from '../../components/common/EmptyState';
import { Project } from '../../types/project.types';

interface ProjectsScreenProps {
  onBack: () => void;
}

export const ProjectsScreen: React.FC<ProjectsScreenProps> = ({ onBack }) => {
  const {
    projects,
    recentProjects,
    recentCount,
    allProjectsCount,
    isLoading,
    isRefreshing,
    error,
    isAdmin,
    userOrgId,
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    markAsViewed,
    clearRecent,
    isRecent,
    getRecentViewedAt,
    refresh,
    retry,
  } = useProjects();

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [mapProject, setMapProject] = useState<Project | null>(null);

  const handleSelectProject = (project: Project) => {
    markAsViewed(project.id);
    setSelectedProject(project);
  };

  const handleOpenMap = (project: Project) => {
    markAsViewed(project.id);
    setMapProject(project);
  };

  const renderHeader = () => (
    <View style={styles.listHeaderContainer}>
      {/* Search Bar */}
      <ProjectSearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {/* Filter Tabs */}
      <ProjectFilterChips
        activeFilter={activeFilter}
        onSelectFilter={setActiveFilter}
        totalCount={allProjectsCount}
        recentCount={recentCount}
        isAdmin={isAdmin}
      />

      {/* Recently Viewed Projects on Top of the List (from Cache Memory) */}
      {!searchQuery && recentProjects.length > 0 && activeFilter !== 'recent' && (
        <RecentlyViewedProjects
          recentProjects={recentProjects}
          onSelectProject={handleSelectProject}
          onViewOnMap={handleOpenMap}
          onClear={clearRecent}
        />
      )}

      {/* Section Title & Subtitle */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>
            {activeFilter === 'recent'
              ? 'Recently Viewed'
              : isAdmin
              ? 'All System Projects'
              : 'Organization Projects'}
          </Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{projects.length}</Text>
          </View>
        </View>
        <Text style={styles.sectionSubtitle}>
          {activeFilter === 'recent'
            ? 'Projects you recently viewed (stored in cache memory)'
            : isAdmin
            ? 'Administrator Access • Viewing projects across all organizations'
            : userOrgId
            ? `Viewing projects for Organization #${userOrgId}`
            : 'Viewing your assigned projects'}
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
            <Text style={styles.navTitle}>Projects Management</Text>
            <Text style={styles.navSub}>GIS Projects & Maps</Text>
          </View>

          <View style={{ width: 36 }} />
        </View>

        {/* Main List */}
        {isLoading && !isRefreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.secondary} />
            <Text style={styles.loadingText}>Loading projects...</Text>
          </View>
        ) : error ? (
          <EmptyState
            iconName="alert-circle-outline"
            title="Failed to Load Projects"
            description={error}
            actionTitle="Try Again"
            onAction={retry}
          />
        ) : (
          <FlatList
            data={projects}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <ProjectCard
                project={item}
                onPress={handleSelectProject}
                onViewOnMap={(p) => handleOpenMap(p)}
                isRecent={isRecent(item.id)}
                recentViewedAt={getRecentViewedAt(item.id)}
              />
            )}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={
              <EmptyState
                iconName={
                  searchQuery
                    ? 'search-outline'
                    : activeFilter === 'recent'
                    ? 'time-outline'
                    : 'folder-open-outline'
                }
                title={
                  searchQuery
                    ? 'No Projects Found'
                    : activeFilter === 'recent'
                    ? 'No Recently Viewed Projects'
                    : 'No Projects Available'
                }
                description={
                  searchQuery
                    ? `No projects match "${searchQuery}". Try a different keyword or reset filters.`
                    : activeFilter === 'recent'
                    ? 'You have not opened any projects recently. Tap on any project below to view its details or explore its map.'
                    : isAdmin
                    ? 'No projects exist on the server yet.'
                    : 'There are no projects assigned to your organization at this time.'
                }
                actionTitle={
                  searchQuery
                    ? 'Clear Search'
                    : activeFilter === 'recent'
                    ? 'View All Projects'
                    : 'Refresh'
                }
                onAction={
                  searchQuery
                    ? () => setSearchQuery('')
                    : activeFilter === 'recent'
                    ? () => setActiveFilter('all')
                    : refresh
                }
              />
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={refresh}
                tintColor={Colors.secondary}
                colors={[Colors.secondary, Colors.primary]}
              />
            }
          />
        )}

        {/* Project Detail Modal */}
        <ProjectDetailModal
          project={selectedProject}
          visible={!!selectedProject}
          onClose={() => setSelectedProject(null)}
          onViewOnMap={(p) => handleOpenMap(p)}
        />

        {/* Project Map Modal (Single Project Focus) */}
        <ProjectMapModal
          visible={!!mapProject}
          project={mapProject}
          onClose={() => setMapProject(null)}
          onOpenDetails={(p) => {
            setMapProject(null);
            markAsViewed(p.id);
            setTimeout(() => setSelectedProject(p), 250);
          }}
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
    color: Colors.secondary,
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
    backgroundColor: 'rgba(255, 156, 92, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.secondary,
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
