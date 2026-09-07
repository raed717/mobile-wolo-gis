import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { CustomInput } from '../../components/common/CustomInput';
import { CustomButton } from '../../components/common/CustomButton';
import { useAuth } from '../../context/AuthContext';
import { DEV_MACHINE_IP, DEV_MACHINE_PORT } from '../../config/constants';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ visible, onClose }) => {
  const { apiUrl, setApiUrl } = useAuth();
  const [urlInput, setUrlInput] = useState(apiUrl);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const handleSave = async () => {
    if (!urlInput.trim()) return;
    await setApiUrl(urlInput.trim());
    setSavedMessage('Server URL updated successfully!');
    setTimeout(() => {
      setSavedMessage(null);
      onClose();
    }, 1200);
  };

  const handlePreset = (presetUrl: string) => {
    setUrlInput(presetUrl);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="server-outline" size={22} color={Colors.secondary} />
              <Text style={styles.title}>Backend Connection</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={styles.description}>
            Configure the NestJS API server endpoint for SMARTOWN.
          </Text>

          {/* Input */}
          <CustomInput
            label="API Base URL"
            value={urlInput}
            onChangeText={setUrlInput}
            placeholder="http://192.168.1.X:3000"
            iconName="globe-outline"
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* Quick Presets */}
          <Text style={styles.presetsLabel}>Quick Presets:</Text>
          <View style={styles.presetButtons}>
            <TouchableOpacity
              style={styles.presetChip}
              onPress={() => handlePreset(`http://${DEV_MACHINE_IP}:${DEV_MACHINE_PORT}`)}
            >
              <Text style={styles.presetText}>📱 {DEV_MACHINE_IP}:{DEV_MACHINE_PORT} (LAN / iPhone)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.presetChip}
              onPress={() => handlePreset('http://10.0.2.2:3000')}
            >
              <Text style={styles.presetText}>🤖 10.0.2.2:3000 (Android Emu)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.presetChip}
              onPress={() => handlePreset('http://localhost:3000')}
            >
              <Text style={styles.presetText}>💻 localhost:3000 (iOS Sim)</Text>
            </TouchableOpacity>
          </View>

          {savedMessage && <Text style={styles.successText}>{savedMessage}</Text>}

          {/* Actions */}
          <View style={styles.actions}>
            <CustomButton
              title="Save Configuration"
              onPress={handleSave}
              variant="secondary"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#16192e',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  description: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 18,
    lineHeight: 18,
  },
  presetsLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 8,
    fontWeight: '600',
  },
  presetButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  presetChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  presetText: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  successText: {
    color: Colors.success,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  actions: {
    marginTop: 6,
  },
});
