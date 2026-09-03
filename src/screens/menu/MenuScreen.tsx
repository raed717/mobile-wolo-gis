import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../theme/colors';
import { APP_CONFIG } from '../../config/constants';
import { useAuth } from '../../context/AuthContext';

interface MenuScreenProps {
  onNavigateToProjects: () => void;
  onNavigateToShapes: () => void;
}

export const MenuScreen: React.FC<MenuScreenProps> = ({
  onNavigateToProjects,
  onNavigateToShapes,
}) => {
  const { user, logout, isLoading } = useAuth();
  const isAdmin = user?.role === 'Admin';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bgDark} />
      <SafeAreaView style={styles.safeArea}>
        {/* Top Navbar */}
        <View style={styles.navbar}>
          <View style={styles.brandRow}>
            <Text style={styles.appName}>{APP_CONFIG.appName}</Text>
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

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={logout}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={20} color={Colors.secondary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Welcome Greeting Card */}
          <LinearGradient
            colors={['#25153a', '#171a2e']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.greetingCard}
          >
            <Text style={styles.welcomeLabel}>Welcome back,</Text>
            <Text style={styles.userName}>
              {user?.userName || user?.email?.split('@')[0] || 'User'}
            </Text>
            <Text style={styles.userEmail}>{user?.email}</Text>

            {user?.organizationId && (
              <View style={styles.orgTag}>
                <Ionicons name="business-outline" size={13} color={Colors.secondary} />
                <Text style={styles.orgTagText}>
                  Organization #{user.organizationId}
                </Text>
              </View>
            )}
          </LinearGradient>

          {/* Section Title */}
          <Text style={styles.menuHeaderTitle}>Main Modules</Text>

          {/* Menu Cards */}
          <View style={styles.menuGrid}>
            {/* 1. Projects Button */}
            <TouchableOpacity
              style={styles.menuCard}
              onPress={onNavigateToProjects}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['rgba(80, 36, 111, 0.4)', 'rgba(22, 26, 46, 0.9)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <View style={[styles.iconContainer, { backgroundColor: 'rgba(80, 36, 111, 0.6)' }]}>
                  <Ionicons name="folder-open" size={28} color={Colors.secondary} />
                </View>

                <View style={styles.cardTextContainer}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardTitle}>Projects Management</Text>
                    <Ionicons name="chevron-forward" size={18} color={Colors.secondary} />
                  </View>
                  <Text style={styles.cardSubtitle}>
                    Browse, search, and view geolocated GIS projects on interactive maps.
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* 2. Shapes Management Button */}
            <TouchableOpacity
              style={styles.menuCard}
              onPress={onNavigateToShapes}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['rgba(32, 201, 151, 0.15)', 'rgba(22, 26, 46, 0.9)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <View style={[styles.iconContainer, { backgroundColor: 'rgba(32, 201, 151, 0.2)' }]}>
                  <Ionicons name="shapes" size={28} color="#20c997" />
                </View>

                <View style={styles.cardTextContainer}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardTitle}>Shapes Management</Text>
                    <Ionicons name="chevron-forward" size={18} color="#20c997" />
                  </View>
                  <Text style={styles.cardSubtitle}>
                    Inspect shape types (Polygons, Lines, Points) and configured attribute schemas.
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Secondary GIS Modules placeholder */}
            <View style={styles.subGrid}>
              <View style={styles.subCard}>
                <Ionicons name="cube-outline" size={24} color={Colors.secondary} />
                <Text style={styles.subCardTitle}>3D Objects</Text>
                <Text style={styles.subCardSub}>Orthomosaic & GIS</Text>
              </View>

              <View style={styles.subCard}>
                <Ionicons name="camera-outline" size={24} color={Colors.secondary} />
                <Text style={styles.subCardTitle}>Field Survey</Text>
                <Text style={styles.subCardSub}>360° Panorama</Text>
              </View>
            </View>
          </View>
        </ScrollView>
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
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appName: {
    fontSize: 13,
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
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    padding: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  content: {
    padding: 20,
    paddingBottom: 36,
  },
  greetingCard: {
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  },
  welcomeLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  userEmail: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  orgTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
    marginTop: 14,
  },
  orgTagText: {
    fontSize: 12,
    color: Colors.secondary,
    fontWeight: '600',
  },
  menuHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
    marginBottom: 14,
    textTransform: 'uppercase',
  },
  menuGrid: {
    gap: 14,
  },
  menuCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  cardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  subGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  subCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  subCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 8,
  },
  subCardSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
