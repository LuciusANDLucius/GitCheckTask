import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { Radius } from '../constants/spacing';

/**
 * StatusPill — Priority status badge.
 * Renders a pill with background tint, border, and text color based on priority.
 *
 * Props:
 *   priority — 'critical' | 'normal' | 'low'
 *   size     — 'sm' | 'md' (default 'md')
 */
const ICONS = { critical: '⚡', normal: '◉', low: '○' };
const LABELS = { critical: 'Critical', normal: 'Normal', low: 'Low' };

const StatusPill = ({ priority = 'normal', size = 'md' }) => {
  const config = Colors.priority[priority] ?? Colors.priority.normal;
  const isSm = size === 'sm';

  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: config.bg,
          borderColor:     config.border,
          paddingHorizontal: isSm ? 7 : 10,
          paddingVertical:   isSm ? 2 : 4,
        },
      ]}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={`Priority: ${LABELS[priority] ?? priority}`}
    >
      <Text
        style={[
          styles.icon,
          { color: config.text, fontSize: isSm ? 9 : 11 },
        ]}
      >
        {ICONS[priority]}
      </Text>
      <Text
        style={[
          styles.label,
          { color: config.text, fontSize: isSm ? 10 : 11 },
        ]}
      >
        {LABELS[priority]}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection:  'row',
    alignItems:     'center',
    borderRadius:   Radius.full,
    borderWidth:    1,
    gap:            4,
    alignSelf:      'flex-start',
  },
  icon: {
    lineHeight: 16,
  },
  label: {
    ...Typography.styles.label,
    fontSize: 11,
  },
});

export default StatusPill;
