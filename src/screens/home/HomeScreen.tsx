import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { APP_CONFIG } from '../../config/constants';
import { CustomButton } from '../../components/common/CustomButton';
import { useAuth } from '../../context/AuthContext';

export const HomeScreen: React.FC = () => {
  const { user, logout, isLoading } = useAuth();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bgDark} />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.appName}>{APP_CONFIG.appName}</Text>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>
              {user?.firstName && user?.lastName
                ? `${user.firstName} ${user.lastName}`
                : user?.email || 'Authenticated User'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.logoutIconButton}
            onPress={logout}
            disabled={isLoading}
          >
            <Ionicons name="log-out-outline" size={22} color={Colors.secondary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Status Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="shield-checkmark" size={20} color={Colors.success} />
              <Text style={styles.cardTitle}>Session Active</Text>
            </View>
            <Text style={styles.cardSubtitle}>
              Connected securely to the SMARTOWN backend server.
            </Text>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>User ID:</Text>
              <Text style={styles.infoValue}>{user?.id ?? 'N/A'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{user?.email ?? 'N/A'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Role:</Text>
              <Text style={[styles.infoValue, styles.roleBadge]}>
                {user?.role ?? 'User'}
              </Text>
            </View>

            {user?.organizationId && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Org ID:</Text>
                <Text style={styles.infoValue}>#{user.organizationId}</Text>
              </View>
            )}

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status:</Text>
              <Text style={[styles.infoValue, { color: Colors.success }]}>
                {user?.status ?? 'Active'}
              </Text>
            </View>
          </View>

          {/* Quick Actions / Modules Placeholder */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Smartown Mobile Modules</Text>
          </View>

          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <Ionicons name="map-outline" size={32} color={Colors.secondary} />
              <Text style={styles.gridItemTitle}>GIS Map</Text>
              <Text style={styles.gridItemSubtitle}>Layers & Markers</Text>
            </View>

            <View style={styles.gridItem}>
              <Ionicons name="camera-outline" size={32} color={Colors.secondary} />
              <Text style={styles.gridItemTitle}>360° Survey</Text>
              <Text style={styles.gridItemSubtitle}>Field Inspection</Text>
            </View>

            <View style={styles.gridItem}>
              <Ionicons name="cube-outline" size={32} color={Colors.secondary} />
              <Text style={styles.gridItemTitle}>3D Objects</Text>
              <Text style={styles.gridItemSubtitle}>Orthomosaic & GIS</Text>
            </View>

            <View style={styles.gridItem}>
              <Ionicons name="stats-chart-outline" size={32} color={Colors.secondary} />
              <Text style={styles.gridItemTitle}>Analytics</Text>
              <Text style={styles.gridItemSubtitle}>Project Reports</Text>
            </View>
          </View>

          {/* Logout Action */}
          <View style={styles.logoutWrapper}>
            <CustomButton
              title="Sign Out"
              onPress={logout}
              loading={isLoading}
              variant="outline"
            />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  appName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.secondary,
    letterSpacing: 1.5,
  },
  greeting: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  logoutIconButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  content: {
    padding: 20,
  },
  card: {
    backgroundColor: '#161a2e',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  roleBadge: {
    color: Colors.secondary,
    backgroundColor: 'rgba(255, 156, 92, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  sectionHeader: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  gridItem: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'flex-start',
  },
  gridItemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 10,
  },
  gridItemSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  logoutWrapper: {
    marginTop: 8,
    marginBottom: 30,
  },
});
