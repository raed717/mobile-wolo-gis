import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Polygon, Line, Circle, Rect } from 'react-native-svg';

export interface ShapeStyleConfig {
  fillColor?: string;
  strokeColor?: string;
  opacity?: number;
  strokeWidth?: number;
  markShape?: string;
}

interface ShapeGeometryPreviewProps {
  type?: string;
  stylePreview?: ShapeStyleConfig;
  size?: number;
  containerStyle?: ViewStyle;
}

export const ShapeGeometryPreview: React.FC<ShapeGeometryPreviewProps> = ({
  type = 'POLYGON',
  stylePreview,
  size = 48,
  containerStyle,
}) => {
  const normType = (type || 'POLYGON').toUpperCase();

  const fillColor = stylePreview?.fillColor || '#ff9c5c';
  const strokeColor = stylePreview?.strokeColor || '#50246f';
  const opacity = typeof stylePreview?.opacity === 'number' ? stylePreview.opacity : 0.75;
  const strokeWidth =
    typeof stylePreview?.strokeWidth === 'number'
      ? Math.max(1.5, Math.min(stylePreview.strokeWidth, 4))
      : 2;
  const markShape = (stylePreview?.markShape || 'circle').toLowerCase();

  const svgSize = Math.round(size * 0.74);

  const renderShapeGeometry = () => {
    if (normType.includes('LINE')) {
      return (
        <Svg viewBox="0 0 50 50" width={svgSize} height={svgSize}>
          <Line
            x1="9"
            y1="41"
            x2="41"
            y2="9"
            stroke={strokeColor}
            strokeWidth={strokeWidth || 3}
            strokeLinecap="round"
          />
        </Svg>
      );
    }

    if (normType.includes('POINT')) {
      return (
        <Svg viewBox="0 0 50 50" width={svgSize} height={svgSize}>
          {markShape === 'square' ? (
            <Rect
              x="13"
              y="13"
              width="24"
              height="24"
              rx="2"
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              fillOpacity={opacity}
            />
          ) : markShape === 'triangle' ? (
            <Polygon
              points="25,10 40,38 10,38"
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              fillOpacity={opacity}
            />
          ) : (
            <Circle
              cx="25"
              cy="25"
              r="13"
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              fillOpacity={opacity}
            />
          )}
        </Svg>
      );
    }

    // Default & POLYGON: Flat regular hexagon polygon
    return (
      <Svg viewBox="0 0 50 50" width={svgSize} height={svgSize}>
        <Polygon
          points="25,5 43.3,15 43.3,35 25,45 6.7,35 6.7,15"
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fillOpacity={opacity}
          strokeLinejoin="round"
        />
      </Svg>
    );
  };

  return (
    <View
      style={[
        styles.whiteFrame,
        {
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.25),
        },
        containerStyle,
      ]}
    >
      {renderShapeGeometry()}
    </View>
  );
};

const styles = StyleSheet.create({
  whiteFrame: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
});
