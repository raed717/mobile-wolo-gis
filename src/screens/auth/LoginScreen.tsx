import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  TouchableOpacity,
  Linking,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../theme/colors';
import { APP_CONFIG } from '../../config/constants';
import { StarryBackground } from '../../components/common/StarryBackground';
import { CustomInput } from '../../components/common/CustomInput';
import { CustomButton } from '../../components/common/CustomButton';
import { SettingsModal } from './SettingsModal';
import { useAuth } from '../../context/AuthContext';
import { AppAssets } from '../../config/assets';

export const LoginScreen: React.FC = () => {
  const { login, isLoading, apiUrl } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [settingsVisible, setSettingsVisible] = useState(false);

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validate = (): boolean => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(trimmedEmail)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    }

    return isValid;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setErrorMessage(null);
    const result = await login({
      email: email.trim(),
      password,
    });

    if (!result.success && result.error) {
      setErrorMessage(result.error);
    }
  };

  return (
    <StarryBackground>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          {/* Top Bar for Settings / Server URL Config */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.serverBadge}
              onPress={() => setSettingsVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="server" size={14} color={Colors.secondary} />
              <Text style={styles.serverBadgeText} numberOfLines={1}>
                {apiUrl.replace(/^https?:\/\//, '')}
              </Text>
              <Ionicons name="settings-outline" size={14} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Main Login Card */}
            <View style={styles.card}>
              {/* Header / Brand */}
              <View style={styles.header}>
                <Image
                  source={AppAssets.logo}
                  style={styles.logo}
                  resizeMode="contain"
                />
                <Text style={styles.brandTitle}>{APP_CONFIG.appName}</Text>
                <Text style={styles.brandSubtitle}>{APP_CONFIG.tagline}</Text>
              </View>

              {/* Error Message Box */}
              {errorMessage && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={20} color={Colors.danger} />
                  <Text style={styles.errorBoxText}>{errorMessage}</Text>
                </View>
              )}

              {/* Form Fields */}
              <View style={styles.form}>
                <CustomInput
                  label="Email Address"
                  placeholder="name@domain.com"
                  iconName="mail-outline"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (emailError) setEmailError('');
                  }}
                  error={emailError}
                  keyboardType="email-address"
                  autoComplete="email"
                />

                <CustomInput
                  label="Password"
                  placeholder="Enter your password"
                  iconName="lock-closed-outline"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (passwordError) setPasswordError('');
                  }}
                  error={passwordError}
                  isPassword
                  autoComplete="password"
                />

                <View style={styles.buttonWrapper}>
                  <CustomButton
                    title="Sign In"
                    onPress={handleLogin}
                    loading={isLoading}
                    variant="primary"
                  />
                </View>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.copyrightText}>{APP_CONFIG.copyright}</Text>
              <View style={styles.poweredRow}>
                <Text style={styles.poweredText}>Powered by </Text>
                <TouchableOpacity
                  onPress={() => Linking.openURL(APP_CONFIG.poweredByUrl)}
                >
                  <Text style={styles.poweredLink}>{APP_CONFIG.poweredBy}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Server Settings Modal */}
        <SettingsModal
          visible={settingsVisible}
          onClose={() => setSettingsVisible(false)}
        />
      </SafeAreaView>
    </StarryBackground>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  serverBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    gap: 6,
    maxWidth: 220,
  },
  serverBadgeText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    flexShrink: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Colors.cardBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 140,
    height: 70,
    marginBottom: 8,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  brandSubtitle: {
    fontSize: 13,
    color: Colors.secondary,
    letterSpacing: 1,
    marginTop: 2,
    fontWeight: '500',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220, 53, 69, 0.2)',
    borderLeftWidth: 4,
    borderLeftColor: Colors.danger,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 10,
  },
  errorBoxText: {
    color: '#ffc9c9',
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  form: {
    width: '100%',
  },
  buttonWrapper: {
    marginTop: 10,
  },
  footer: {
    marginTop: 28,
    alignItems: 'center',
    gap: 4,
  },
  copyrightText: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  poweredRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  poweredText: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  poweredLink: {
    color: Colors.secondary,
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
