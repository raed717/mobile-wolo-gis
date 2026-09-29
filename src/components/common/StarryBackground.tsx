import React, { useMemo } from 'react';
import { StyleSheet, View, ImageBackground, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../theme/colors';
import { AppAssets } from '../../config/assets';

interface Star {
  id: number;
  top: number;
  left: number;
  size: number;
  opacity: number;
}

export const StarryBackground: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { width, height } = useWindowDimensions();
  // Scatter over the longest side in both axes so stars cover the screen in any orientation
  const span = Math.max(width, height);
  const stars: Star[] = useMemo(() => {
    return Array.from({ length: 45 }).map((_, i) => ({
      id: i,
      top: Math.random() * span,
      left: Math.random() * span,
      size: Math.random() * 2.5 + 1,
      opacity: Math.random() * 0.7 + 0.3,
    }));
  }, [span]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.bgGradientStart, Colors.bgDark, Colors.bgGradientEnd]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Map Wallpaper Subtle Texture */}
      <ImageBackground
        source={AppAssets.mapWallpaper}
        style={StyleSheet.absoluteFill}
        imageStyle={{ opacity: 0.18, resizeMode: 'cover' }}
      />

      {/* Star Particles */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {stars.map((star) => (
          <View
            key={star.id}
            style={[
              styles.star,
              {
                top: star.top,
                left: star.left,
                width: star.size,
                height: star.size,
                borderRadius: star.size / 2,
                opacity: star.opacity,
              },
            ]}
          />
        ))}
      </View>

      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDark,
    overflow: 'hidden',
  },
  star: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
  },
});
