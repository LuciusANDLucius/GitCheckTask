import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { Radius, Spacing } from '../constants/spacing';
import { relativeTime } from '../utils/dateUtils';
import { useTheme } from '../context/ThemeContext';

/**
 * ActivityCard — GitHub Activity Feed card.
 * Features:
 *   • Colored left-border accent based on activity type
 *   • Actor avatar bubble
 *   • Repository tag chip
 *   • Branch indicator (when applicable)
 *   • Relative timestamp
 *   • Staggered fade-slide entrance animation
 *   • Dynamic Theme (Light / Dark) & Font Scaling support
 */

const ACTIVITY_ICONS = {
  push:         '↑',
  pull_request: '⇄',
  issue:        '!',
  review:       '✓',
  fork:         '⑂',
  star:         '★',
  release:      '◈',
  comment:      '◎',
};

const ACTIVITY_LABELS = {
  push:         'Push',
  pull_request: 'Pull Request',
  issue:        'Issue',
  review:       'Review',
  fork:         'Fork',
  star:         'Star',
  release:      'Release',
  comment:      'Comment',
};

const ActivityCard = ({ activity, index = 0 }) => {
  const { colors, isDark, scaleFont } = useTheme();
  const accentColor = colors.activity?.[activity.type] ?? Colors.activity[activity.type] ?? colors.text.secondary;
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue:         1,
        duration:        260,
        delay:           index * 50,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue:         0,
        delay:           index * 50,
        tension:         90,
        friction:        12,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: colors.bg.card,
          borderColor: colors.border.subtle,
          opacity,
          transform: [{ translateY }],
        },
      ]}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={`${ACTIVITY_LABELS[activity.type] ?? 'Activity'}: ${activity.message} in ${activity.repo}, ${relativeTime(activity.timestamp)}`}
    >
      {/* Left accent border */}
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} aria-hidden="true" />

      <View style={styles.body}>
        {/* Top row — avatar + type + timestamp */}
        <View style={styles.topRow}>
          {/* Avatar bubble */}
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: colors.bg.cardElevated,
                borderColor: `${accentColor}60`,
              },
            ]}
            aria-hidden="true"
          >
            {activity.avatarUrl ? (
              <Image
                source={{ uri: activity.avatarUrl }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <Text style={[styles.avatarText, { color: accentColor }]}>
                {activity.avatarInitials}
              </Text>
            )}
          </View>

          {/* Type chip */}
          <View style={[styles.typeChip, { backgroundColor: `${accentColor}18` }]} aria-hidden="true">
            <Text style={[styles.typeIcon, { color: accentColor }]}>
              {ACTIVITY_ICONS[activity.type]}
            </Text>
            <Text style={[styles.typeLabel, { color: accentColor }]}>
              {ACTIVITY_LABELS[activity.type]}
            </Text>
          </View>

          <View style={styles.spacer} />

          {/* Timestamp */}
          <Text style={[styles.timestamp, { color: colors.text.muted, fontSize: scaleFont(11) }]}>
            {relativeTime(activity.timestamp)}
          </Text>
        </View>

        {/* Message */}
        <Text
          style={[
            styles.message,
            { color: colors.text.primary, fontSize: scaleFont(13) },
          ]}
          numberOfLines={2}
        >
          {activity.message}
        </Text>

        {/* Bottom row — repo tag + branch */}
        <View style={styles.bottomRow}>
          <View
            style={[
              styles.repoTag,
              {
                backgroundColor: colors.bg.cardElevated,
                borderColor: colors.border.subtle,
              },
            ]}
          >
            <Text style={[styles.repoIcon, { color: colors.text.muted }]} aria-hidden="true">⎇</Text>
            <Text style={[styles.repoName, { color: colors.text.secondary, fontSize: scaleFont(11) }]}>
              {activity.repo}
            </Text>
          </View>

          {activity.branch && (
            <View
              style={[
                styles.branchTag,
                {
                  backgroundColor: `${colors.indigo[500]}18`,
                  borderColor: `${colors.indigo[500]}40`,
                },
              ]}
            >
              <Text style={[styles.branchText, { color: colors.indigo[400], fontSize: scaleFont(11) }]}>
                {activity.branch}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection:   'row',
    backgroundColor: Colors.bg.card,
    borderRadius:    Radius.lg,
    borderWidth:     1,
    borderColor:     Colors.border.subtle,
    marginBottom:    Spacing.sm,
    overflow:        'hidden',
  },
  accentBar: {
    width:        3,
    borderRadius: 0,
  },
  body: {
    flex:    1,
    padding: Spacing.cardPadding,
    gap:     Spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.sm,
  },
  avatar: {
    width:           30,
    height:          30,
    borderRadius:    Radius.full,
    borderWidth:     1.5,
    backgroundColor: Colors.bg.cardElevated,
    alignItems:      'center',
    justifyContent:  'center',
    overflow:        'hidden',
  },
  avatarImage: {
    width:  '100%',
    height: '100%',
    borderRadius: Radius.full,
  },
  avatarText: {
    ...Typography.styles.label,
    fontSize: 9,
  },
  typeChip: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:              4,
    paddingHorizontal: 8,
    paddingVertical:   3,
    borderRadius:     Radius.full,
  },
  typeIcon: {
    fontSize:   11,
    lineHeight: 15,
  },
  typeLabel: {
    ...Typography.styles.label,
    fontSize: 10,
  },
  spacer: { flex: 1 },
  timestamp: {
    ...Typography.styles.bodySm,
    color: Colors.text.muted,
    fontVariant: ['tabular-nums'],
  },
  message: {
    ...Typography.styles.bodyMd,
    color:      Colors.text.secondary,
    lineHeight: 20,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.sm,
    marginTop:     Spacing[0.5],
  },
  repoTag: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:              4,
    backgroundColor:  Colors.bg.cardElevated,
    borderRadius:     Radius.sm,
    paddingHorizontal: 8,
    paddingVertical:   3,
    borderWidth:      1,
    borderColor:      Colors.border.subtle,
  },
  repoIcon: {
    color:    Colors.text.muted,
    fontSize: 11,
  },
  repoName: {
    ...Typography.styles.monoSm,
    color: Colors.text.secondary,
  },
  branchTag: {
    backgroundColor:  `${Colors.indigo[500]}18`,
    borderRadius:     Radius.sm,
    paddingHorizontal: 8,
    paddingVertical:   3,
    borderWidth:      1,
    borderColor:      `${Colors.indigo[500]}40`,
  },
  branchText: {
    ...Typography.styles.monoSm,
    color: Colors.indigo[400],
  },
});

export default ActivityCard;
