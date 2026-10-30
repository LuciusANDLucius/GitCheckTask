import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Colors } from '../constants/colors';
import { Radius } from '../constants/spacing';

/**
 * GlowCard — Base card component with colored glow shadow effect.
 * Wraps children in a styled card surface with optional glow accent.
 *
 * Props:
 *   glowColor  — hex/rgba color for the iOS shadow + border tint
 *   style      — additional style overrides for the outer container
 *   children   — card content
 *   padding    — inner padding (default 16)
 *   radius     — border radius (default Radius.lg)
 */
const GlowCard = ({
  glowColor = Colors.glow.indigo,
  style,
  children,
  padding = 16,
  radius = Radius.lg,
}) => {
  const glowShadow = Platform.select({
    ios: {
      shadowColor:   glowColor,
      shadowOffset:  { width: 0, height: 4 },
      shadowOpacity: 0.55,
      shadowRadius:  14,
    },
    android: {
      elevation: 8,
    },
  });

  return (
    <View
      style={[
        styles.card,
        { padding, borderRadius: radius },
        glowShadow,
        style,
      ]}
    >
      {/* Subtle border gradient effect via inner border view */}
      <View
        style={[
          StyleSheet.absoluteFillObject,
          styles.glowBorder,
          {
            borderRadius: radius,
            borderColor:  `${glowColor}55`,
          },
        ]}
        pointerEvents="none"
      />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bg.card,
    borderWidth:     1,
    borderColor:     Colors.border.subtle,
    overflow:        'hidden',
  },
  glowBorder: {
    borderWidth: 1,
    borderColor: 'transparent',
  },
});

export default GlowCard;
