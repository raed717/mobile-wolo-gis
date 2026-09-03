import React from 'react';
import { StyleSheet, View, ActivityIndicator, Image, Text } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { HomeScreen } from '../screens/home/HomeScreen';
import { StarryBackground } from '../components/common/StarryBackground';
import { Colors } from '../theme/colors';
import { APP_CONFIG } from '../config/constants';
import { AppAssets } from '../config/assets';

export const RootNavigator: React.FC = () => {
  const { token, isLoading } = useAuth();

  // Splash Loading Screen while verifying stored session
  if (isLoading && !token) {
    return (
      <StarryBackground>
        <View style={styles.splashContainer}>
          <Image
            source={AppAssets.logo}
            style={styles.splashLogo}
            resizeMode="contain"
          />
          <Text style={styles.splashTitle}>{APP_CONFIG.appName}</Text>
          <ActivityIndicator
            size="large"
            color={Colors.secondary}
            style={styles.spinner}
          />
        </View>
      </StarryBackground>
    );
  }

  return token ? <HomeScreen /> : <LoginScreen />;
};

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashLogo: {
    width: 160,
    height: 80,
    marginBottom: 12,
  },
  splashTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 2,
    marginBottom: 24,
  },
  spinner: {
    marginTop: 12,
  },
});
