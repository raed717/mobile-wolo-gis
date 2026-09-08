import React, { useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Animated,
  PanResponder,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const BUTTON_SIZE = 52;
const PADDING = 14;

interface DraggableMapSettingsButtonProps {
  onPress: () => void;
  shapesCount?: number;
  hasActiveFilters?: boolean;
  isLoading?: boolean;
}

export const DraggableMapSettingsButton: React.FC<DraggableMapSettingsButtonProps> = ({
  onPress,
  shapesCount = 0,
  hasActiveFilters = false,
  isLoading = false,
}) => {
  // Initial position: Floating on top right
  const initialX = SCREEN_WIDTH - BUTTON_SIZE - PADDING;
  const initialY = Platform.OS === 'ios' ? 70 : 50;

  const pan = useRef(new Animated.ValueXY({ x: initialX, y: initialY })).current;
  const lastOffset = useRef({ x: initialX, y: initialY });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only take over if dragged more than 4px
        return Math.hypot(gestureState.dx, gestureState.dy) > 4;
      },
      onPanResponderGrant: () => {
        pan.setOffset({
          x: lastOffset.current.x,
          y: lastOffset.current.y,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gestureState) => {
        pan.flattenOffset();

        const moveDistance = Math.hypot(gestureState.dx, gestureState.dy);

        // Treat small movements (< 8px) as a tap
        if (moveDistance < 8) {
          onPress();
          return;
        }

        // Clamp inside screen bounds
        let newX = lastOffset.current.x + gestureState.dx;
        let newY = lastOffset.current.y + gestureState.dy;

        const minX = PADDING;
        const maxX = SCREEN_WIDTH - BUTTON_SIZE - PADDING;
        const minY = 50;
        const maxY = SCREEN_HEIGHT - 170; // Keep above bottom FABs and bars

        newX = Math.max(minX, Math.min(maxX, newX));
        newY = Math.max(minY, Math.min(maxY, newY));

        lastOffset.current = { x: newX, y: newY };

        Animated.spring(pan, {
          toValue: { x: newX, y: newY },
          useNativeDriver: false,
          friction: 6,
          tension: 40,
        }).start();
      },
    })
  ).current;

  // Format count for compact pill
  const formattedCount =
    shapesCount > 999
      ? `${(shapesCount / 1000).toFixed(1)}k`
      : `${shapesCount}`;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: pan.getTranslateTransform(),
        },
      ]}
      {...panResponder.panHandlers}
    >
      <View style={[styles.button, hasActiveFilters && styles.buttonActiveFilter]}>
        <Ionicons name="options" size={22} color={Colors.secondary} />

        {/* Count Badge */}
        {shapesCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{formattedCount}</Text>
          </View>
        )}

        {/* Active Filter Glow Dot */}
        {hasActiveFilters && <View style={styles.filterActiveDot} />}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 9999,
    elevation: 12,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: '#16192e',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 156, 92, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 10,
    elevation: 10,
  },
  buttonActiveFilter: {
    borderColor: Colors.secondary,
    shadowColor: Colors.secondary,
    shadowOpacity: 0.4,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: Colors.secondary,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#16192e',
    minWidth: 18,
    alignItems: 'center',
  },
  badgeText: {
    color: '#1a1024',
    fontSize: 9,
    fontWeight: '800',
  },
  filterActiveDot: {
    position: 'absolute',
    bottom: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38bdf8',
  },
});
