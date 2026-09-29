import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Animated,
  PanResponder,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';

const BUTTON_SIZE = 52;
const PADDING = 14;
const BOTTOM_CLEARANCE = 90; // Keep safely above the bottom FAB row

interface DraggableMapSettingsButtonProps {
  onPress: () => void;
  shapesCount?: number;
  hasActiveFilters?: boolean;
  isLoading?: boolean;
  /** Size of the parent map container; falls back to the window size until measured */
  containerSize?: { width: number; height: number } | null;
}

export const DraggableMapSettingsButton: React.FC<DraggableMapSettingsButtonProps> = ({
  onPress,
  shapesCount = 0,
  hasActiveFilters = false,
  isLoading = false,
  containerSize,
}) => {
  const window = useWindowDimensions();
  const boundsWidth = containerSize?.width ?? window.width;
  const boundsHeight = containerSize?.height ?? window.height;

  // Latest bounds for the PanResponder callbacks (created once)
  const boundsRef = useRef({ width: boundsWidth, height: boundsHeight });
  boundsRef.current = { width: boundsWidth, height: boundsHeight };
  const onPressRef = useRef(onPress);
  onPressRef.current = onPress;

  const clamp = (x: number, y: number) => {
    const { width, height } = boundsRef.current;
    const minX = PADDING;
    const maxX = Math.max(minX, width - BUTTON_SIZE - PADDING);
    const minY = PADDING;
    const maxY = Math.max(minY, height - BUTTON_SIZE - BOTTOM_CLEARANCE);
    return {
      x: Math.max(minX, Math.min(maxX, x)),
      y: Math.max(minY, Math.min(maxY, y)),
    };
  };

  // Initial position: top right of the map
  const initial = { x: boundsWidth - BUTTON_SIZE - PADDING, y: PADDING };

  const pan = useRef(new Animated.ValueXY(initial)).current;
  const lastOffset = useRef(initial);
  // Whether the user has moved the button; if not, keep it pinned to the top-right corner
  const hasBeenDragged = useRef(false);

  // Re-position when the container resizes (device rotation)
  useEffect(() => {
    const target = hasBeenDragged.current
      ? clamp(lastOffset.current.x, lastOffset.current.y)
      : clamp(boundsWidth - BUTTON_SIZE - PADDING, PADDING);
    lastOffset.current = target;
    pan.setValue(target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boundsWidth, boundsHeight]);

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
          onPressRef.current();
          return;
        }

        // Clamp inside the map container
        const target = clamp(
          lastOffset.current.x + gestureState.dx,
          lastOffset.current.y + gestureState.dy
        );
        lastOffset.current = target;
        hasBeenDragged.current = true;

        Animated.spring(pan, {
          toValue: target,
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
