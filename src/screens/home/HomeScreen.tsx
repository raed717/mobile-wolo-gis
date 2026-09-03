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
import { APP_CONFIG } from '../../config/constants';
import { useAuth } from '../../context/AuthContext';
import { useProjects } from '../../hooks/useProjects';
import { ProjectCard } from '../../components/project/ProjectCard';
import { ProjectSearchBar } from '../../components/project/ProjectSearchBar';
import { ProjectFilterChips } from '../../components/project/ProjectFilterChips';
import { ProjectDetailModal } from '../../components/project/ProjectDetailModal';
import { ProjectMapModal } from '../map/ProjectMapModal';
import { EmptyState } from '../../components/common/EmptyState';
import { Project } from '../../types/project.types';

export const HomeScreen: React.FC = () => {
  const { user, logout, isLoading: isAuthLoading } = useAuth();
  const {
    projects,
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
    refresh,
    retry,
  } = useProjects();

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [mapProject, setMapProject] = useState<Project | null>(null);

  const handleOpenMap = (project: Project) => {
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
        isAdmin={isAdmin}
      />

      {/* Section Title & Subtitle */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>
            {isAdmin ? 'All System Projects' : 'Organization Projects'}
          </Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{projects.length}</Text>
          </View>
        </View>
        <Text style={styles.sectionSubtitle}>
          {isAdmin
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
        {/* Top Navbar */}
        <View style={styles.navbar}>
          <View style={styles.navLeft}>
            <View style={styles.brandRow}>
              <Text style={styles.appBadge}>{APP_CONFIG.appName}</Text>
              <View style={[styles.roleBadge, isAdmin ? styles.adminBadge : styles.userBadge]}>
                <Ionicons
                  name={isAdmin ? 'shield-checkmark' : 'person-outline'}
                  size={11}
                  color={isAdmin ? Colors.secondary : Colors.textSecondary}
                />
                <Text
                  style={[
                    styles.roleBadgeText,
                    isAdmin ? styles.adminBadgeText : styles.userBadgeText,
                  ]}
                >
                  {user?.role || 'User'}
                </Text>
              </View>
            </View>

            <Text style={styles.welcomeText}>
              Welcome,{' '}
              <Text style={styles.welcomeName}>
                {user?.userName || user?.email?.split('@')[0] || 'User'}
              </Text>
            </Text>
          </View>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={logout}
            disabled={isAuthLoading}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={20} color={Colors.secondary} />
          </TouchableOpacity>
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
                onPress={setSelectedProject}
                onViewOnMap={(p) => handleOpenMap(p)}
              />
            )}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={
              <EmptyState
                iconName={searchQuery ? 'search-outline' : 'folder-open-outline'}
                title={searchQuery ? 'No Projects Found' : 'No Projects Available'}
                description={
                  searchQuery
                    ? `No projects match "${searchQuery}". Try a different keyword or reset filters.`
                    : isAdmin
                    ? 'No projects exist on the server yet.'
                    : 'There are no projects assigned to your organization at this time.'
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
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  navLeft: {
    flex: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.secondary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 4,
  },
  adminBadge: {
    backgroundColor: 'rgba(255, 156, 92, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 156, 92, 0.3)',
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.secondary,
  },
  userBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  userBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  roleBadgeText: {
    fontSize: 10,
  },
  welcomeText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 3,
  },
  welcomeName: {
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    padding: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
