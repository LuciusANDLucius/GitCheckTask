import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Image } from 'react-native';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { Radius, Spacing } from '../constants/spacing';
import { useTheme } from '../context/ThemeContext';

/**
 * GreetingHeader — Dynamic dashboard greeting.
 * Features:
 *   • Time-based greeting (Good morning / afternoon / evening / night)
 *   • Live clock updating every second
 *   • Formatted date display
 *   • Real GitHub Avatar Image with initials fallback
 *   • GitHub Account Stats (followers, following, repos, location, bio)
 *   • Quick Light/Dark Mode toggle (☀️ / 🌙)
 *   • Notification bell with unread badge
 *   • Slide-down entrance animation
 */

const getGreeting = (hour) => {
  if (hour >= 5  && hour < 12) return { text: 'Chào buổi sáng',  emoji: '☀️' };
  if (hour >= 12 && hour < 17) return { text: 'Chào buổi chiều', emoji: '🌤' };
  if (hour >= 17 && hour < 21) return { text: 'Chào buổi tối',   emoji: '🌅' };
  return                                { text: 'Chúc ngủ ngon',  emoji: '🌙' };
};

const formatTime = (date) =>
  date.toLocaleTimeString('en-US', {
    hour:   '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

const formatDate = (date) =>
  date.toLocaleDateString('vi-VN', {
    weekday: 'long',
    month:   'long',
    day:     'numeric',
    year:    'numeric',
  });

const GreetingHeader = ({ user, notificationCount = 0, onNotifPress, onPressRepos }) => {
  const { isDark, toggleTheme, colors, scaleFont } = useTheme();
  const [now, setNow] = useState(new Date());
  const [imgError, setImgError] = useState(false);
  const translateY = useRef(new Animated.Value(-24)).current;
  const opacity    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setImgError(false);
  }, [user?.avatarUrl, user?.username]);

  useEffect(() => {
    // Start live clock
    const id = setInterval(() => setNow(new Date()), 1000);

    // Entrance animation
    Animated.parallel([
      Animated.spring(translateY, {
        toValue:         0,
        tension:         70,
        friction:        12,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue:         1,
        duration:        500,
        useNativeDriver: true,
      }),
    ]).start();

    return () => clearInterval(id);
  }, []);

  const hour     = now.getHours();
  const greeting = getGreeting(hour);
  const avatarUri = !imgError && (user?.avatarUrl || (user?.username && user.username !== 'guest' ? `https://github.com/${user.username}.png` : null));

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          transform: [{ translateY }],
          backgroundColor: colors.bg.card,
          borderColor: colors.border.subtle,
        },
      ]}
    >
      {/* Top row: avatar + greeting + theme toggle + notification bell */}
      <View style={styles.topRow}>
        {/* Avatar */}
        <View
          style={styles.avatarContainer}
          accessible={true}
          accessibilityRole="image"
          accessibilityLabel={`Profile avatar for ${user?.displayName ?? 'Developer'}`}
        >
          <View style={[styles.avatar, { borderColor: colors.indigo[400] }]}>
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={styles.avatarImage}
                resizeMode="cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <Text style={[styles.avatarText, { color: colors.indigo[400], fontSize: scaleFont(16) }]}>
                {user?.avatarInitials ?? 'GH'}
              </Text>
            )}
          </View>
          {/* Online indicator */}
          <View style={styles.onlineDot} aria-hidden="true" />
        </View>

        {/* Greeting + username */}
        <View style={styles.greetingBlock}>
          <View style={styles.greetingRow}>
            <Text
              style={[styles.greetingText, { color: colors.text.primary, fontSize: scaleFont(18) }]}
              accessibilityRole="header"
            >
              {greeting.text}
            </Text>
            <Text style={styles.greetingEmoji} aria-hidden="true">{greeting.emoji}</Text>
          </View>
          <Text style={[styles.usernameText, { color: colors.text.muted, fontSize: scaleFont(13) }]}>
            @{user?.username ?? 'developer'}
          </Text>
        </View>

        <View style={styles.spacer} />

        {/* Actions: Theme Toggle + Notif */}
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.themeBtn, { backgroundColor: colors.bg.cardElevated, borderColor: colors.border.default }]}
            onPress={toggleTheme}
            activeOpacity={0.65}
            accessibilityRole="button"
            accessibilityLabel={`Chuyển sang giao diện ${isDark ? 'sáng' : 'tối'}`}
          >
            <Text style={styles.themeIcon}>{isDark ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.notifButton, { backgroundColor: colors.bg.cardElevated, borderColor: colors.border.default }]}
            onPress={onNotifPress}
            activeOpacity={0.65}
            accessibilityRole="button"
            accessibilityLabel={`Thông báo, ${notificationCount} việc quá hạn`}
          >
            <Text style={styles.notifIcon} aria-hidden="true">🔔</Text>
            {notificationCount > 0 && (
              <View style={styles.badge} aria-hidden="true">
                <Text style={styles.badgeText}>
                  {notificationCount > 9 ? '9+' : notificationCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* GitHub Account Stats Bar */}
      {user?.username && (
        <View style={[styles.ghStatsCard, { backgroundColor: colors.bg.cardElevated, borderColor: colors.border.subtle }]}>
          {user?.bio ? (
            <Text style={[styles.ghBio, { color: colors.text.secondary, fontSize: scaleFont(12) }]} numberOfLines={2}>
              "{user.bio}"
            </Text>
          ) : null}

          <View style={styles.ghStatsRow}>
            <TouchableOpacity
              style={[
                styles.ghStatPill,
                {
                  backgroundColor: colors.bg.card,
                  borderColor: colors.border.default,
                },
              ]}
              onPress={onPressRepos}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Xem ${user.publicRepos ?? 0} repositories`}
            >
              <Text style={[styles.ghStatPillNum, { color: colors.indigo[500], fontSize: scaleFont(12) }]}>
                {user.publicRepos ?? 0}
              </Text>
              <Text style={[styles.ghStatPillLabel, { color: colors.text.muted, fontSize: scaleFont(11) }]}>
                repos ↗
              </Text>
            </TouchableOpacity>

            <View style={[styles.ghStatPill, { backgroundColor: colors.bg.card, borderColor: colors.border.default }]}>
              <Text style={[styles.ghStatPillNum, { color: colors.indigo[500], fontSize: scaleFont(12) }]}>
                {user.followers ?? 0}
              </Text>
              <Text style={[styles.ghStatPillLabel, { color: colors.text.muted, fontSize: scaleFont(11) }]}>
                followers
              </Text>
            </View>

            <View style={[styles.ghStatPill, { backgroundColor: colors.bg.card, borderColor: colors.border.default }]}>
              <Text style={[styles.ghStatPillNum, { color: colors.indigo[500], fontSize: scaleFont(12) }]}>
                {user.following ?? 0}
              </Text>
              <Text style={[styles.ghStatPillLabel, { color: colors.text.muted, fontSize: scaleFont(11) }]}>
                following
              </Text>
            </View>

            {user.location ? (
              <View style={[styles.ghStatPill, { backgroundColor: colors.bg.card, borderColor: colors.border.default }]}>
                <Text style={[styles.ghStatPillLabel, { color: colors.text.muted, fontSize: scaleFont(11) }]}>
                  📍 {user.location}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      )}

      {/* Date + time strip */}
      <View
        style={[
          styles.datetimeStrip,
          {
            backgroundColor: colors.bg.cardElevated,
            borderColor: colors.border.subtle,
          },
        ]}
        accessible={true}
        accessibilityLabel={`Today is ${formatDate(now)}, current time is ${formatTime(now)}`}
      >
        <View style={styles.dateBlock}>
          <Text style={[styles.dateLabel, { color: colors.text.muted, fontSize: scaleFont(9) }]}>DATE</Text>
          <Text style={[styles.dateValue, { color: colors.text.secondary, fontSize: scaleFont(13) }]}>
            {formatDate(now)}
          </Text>
        </View>

        <View style={styles.timeBlock}>
          <Text style={[styles.timeValue, styles.timeFont, { color: colors.indigo[500], fontSize: scaleFont(20) }]}>
            {formatTime(now)}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: Spacing.cardPadding,
  },
  topRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.md,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width:           48,
    height:          48,
    borderRadius:    Radius.full,
    backgroundColor: `${Colors.indigo[500]}25`,
    borderWidth:     2,
    borderColor:     `${Colors.indigo[500]}70`,
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
    ...Typography.styles.headingSm,
    color:      Colors.indigo[400],
    fontWeight: '700',
  },
  ghStatsCard: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    padding: Spacing.md,
    gap: 8,
  },
  ghBio: {
    ...Typography.styles.bodySm,
    color: Colors.text.secondary,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  ghStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  ghStatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.bg.cardElevated,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  ghStatPillNum: {
    ...Typography.styles.monoSm,
    color: Colors.indigo[400],
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    fontSize: 11,
  },
  ghStatPillLabel: {
    ...Typography.styles.bodySm,
    color: Colors.text.muted,
    fontSize: 11,
  },
  onlineDot: {
    position:        'absolute',
    bottom:          1,
    right:           1,
    width:           11,
    height:          11,
    borderRadius:    Radius.full,
    backgroundColor: Colors.emerald[500],
    borderWidth:     2,
    borderColor:     Colors.bg.secondary,
  },
  greetingBlock: {
    gap: 2,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           6,
  },
  greetingText: {
    ...Typography.styles.headingMd,
    color: Colors.text.primary,
  },
  greetingEmoji: {
    fontSize: 18,
  },
  usernameText: {
    ...Typography.styles.monoSm,
    color: Colors.text.muted,
  },
  spacer: { flex: 1 },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  themeBtn: {
    width:           40,
    height:          40,
    borderRadius:    Radius.md,
    borderWidth:     1,
    alignItems:      'center',
    justifyContent:  'center',
  },
  themeIcon: {
    fontSize: 18,
  },
  notifButton: {
    width:           40,
    height:          40,
    borderRadius:    Radius.md,
    borderWidth:     1,
    alignItems:      'center',
    justifyContent:  'center',
    position:        'relative',
  },
  notifIcon: {
    fontSize: 18,
  },
  badge: {
    position:        'absolute',
    top:             -5,
    right:           -5,
    minWidth:        18,
    height:          18,
    borderRadius:    Radius.full,
    backgroundColor: Colors.rose[500],
    borderWidth:     2,
    borderColor:     Colors.bg.secondary,
    alignItems:      'center',
    justifyContent:  'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    ...Typography.styles.label,
    color:    '#fff',
    fontSize: 9,
  },
  datetimeStrip: {
    flexDirection:    'row',
    alignItems:       'center',
    justifyContent:   'space-between',
    backgroundColor:  Colors.bg.card,
    borderRadius:     Radius.lg,
    borderWidth:      1,
    borderColor:      Colors.border.subtle,
    paddingHorizontal: Spacing.cardPadding,
    paddingVertical:   Spacing.md,
  },
  dateBlock: {
    gap: 2,
  },
  dateLabel: {
    ...Typography.styles.label,
    color:    Colors.text.muted,
    fontSize: 9,
  },
  dateValue: {
    ...Typography.styles.bodySm,
    color:      Colors.text.secondary,
    fontWeight: '500',
  },
  timeBlock: {
    alignItems: 'flex-end',
  },
  timeValue: {
    ...Typography.styles.headingMd,
    color: Colors.indigo[400],
  },
  timeFont: {
    fontFamily:    'monospace',
    fontVariant:   ['tabular-nums'],
    letterSpacing: 1,
  },
});

export default GreetingHeader;
