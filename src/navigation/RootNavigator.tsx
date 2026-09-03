import React, { useState } from 'react';
import { StyleSheet, View, ActivityIndicator, Image, Text } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { MenuScreen } from '../screens/menu/MenuScreen';
import { ProjectsScreen } from '../screens/projects/ProjectsScreen';
import { ShapesScreen } from '../screens/shapes/ShapesScreen';
import { StarryBackground } from '../components/common/StarryBackground';
import { Colors } from '../theme/colors';
import { APP_CONFIG } from '../config/constants';
import { AppAssets } from '../config/assets';

type AuthenticatedScreen = 'menu' | 'projects' | 'shapes';

export const RootNavigator: React.FC = () => {
  const { token, isLoading } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<AuthenticatedScreen>('menu');

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

  // Not logged in -> Show Login
  if (!token) {
    return <LoginScreen />;
  }

  // Logged in -> Route between Menu, Projects, Shapes
  switch (currentScreen) {
    case 'projects':
      return <ProjectsScreen onBack={() => setCurrentScreen('menu')} />;
    case 'shapes':
      return <ShapesScreen onBack={() => setCurrentScreen('menu')} />;
    case 'menu':
    default:
      return (
        <MenuScreen
          onNavigateToProjects={() => setCurrentScreen('projects')}
          onNavigateToShapes={() => setCurrentScreen('shapes')}
        />
      );
  }
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
