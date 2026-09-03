import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Project } from '../../types/project.types';
import { Colors } from '../../theme/colors';
import { ProjectMapView } from '../../components/map/ProjectMapView';

interface ProjectMapModalProps {
  visible: boolean;
  project: Project | null;
  onClose: () => void;
  onOpenDetails?: (project: Project) => void;
}

export const ProjectMapModal: React.FC<ProjectMapModalProps> = ({
  visible,
  project,
  onClose,
  onOpenDetails,
}) => {
  if (!visible || !project) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#16192e" />
        <SafeAreaView style={styles.safeArea}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={22} color={Colors.white} />
            </TouchableOpacity>

            <View style={styles.titleContainer}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {project.name}
              </Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {project.location ||
                  (project.lat !== undefined && project.lng !== undefined
                    ? `Lat: ${project.lat.toFixed(5)}, Lng: ${project.lng.toFixed(5)}`
                    : 'Project Location')}
              </Text>
            </View>

            {onOpenDetails && (
              <TouchableOpacity
                style={styles.infoButton}
                onPress={() => onOpenDetails(project)}
                activeOpacity={0.8}
              >
                <Ionicons name="information-circle-outline" size={22} color={Colors.secondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Map View Focused Exclusively on This Project */}
          <View style={styles.mapContainer}>
            <ProjectMapView project={project} />
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16192e',
  },
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#16192e',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    gap: 12,
  },
  backButton: {
    padding: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
  },
  titleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.secondary,
    marginTop: 2,
  },
  infoButton: {
    padding: 6,
    backgroundColor: 'rgba(255, 156, 92, 0.12)',
    borderRadius: 10,
  },
  mapContainer: {
    flex: 1,
  },
});
