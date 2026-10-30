import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, ScrollView,
} from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { Radius, Spacing } from '../constants/spacing';
import { useGitHub } from '../context/GitHubContext';
import { useTheme } from '../context/ThemeContext';

const NAV_ITEMS = [
  { name: 'Dashboard',    icon: '⬡', screen: 'Dashboard',    accent: Colors.indigo[400] },
  { name: 'Repositories', icon: '⎇', screen: 'Repositories', accent: Colors.sky[400]   },
  { name: 'Explore OS',   icon: '🌐', screen: 'Explore',      accent: Colors.teal[400]  },
  { name: 'Settings',     icon: '◈', screen: 'Settings',      accent: Colors.purple[400]},
];

const NavItem = ({ item, isActive, onPress, colors }) => (
  <TouchableOpacity
    style={[
      styles.navItem,
      isActive && {
        backgroundColor: `${item.accent}18`,
        borderColor: `${item.accent}40`,
        borderWidth: 1,
      },
    ]}
    onPress={() => onPress(item.screen)}
    activeOpacity={0.65}
    accessibilityRole="button"
    accessibilityState={{ selected: isActive }}
    accessibilityLabel={`Go to ${item.name}`}
    accessibilityHint={`Opens ${item.name} screen`}
  >
    <View style={[styles.navIcon, { backgroundColor: `${item.accent}20` }]} aria-hidden="true">
      <Text style={[styles.navIconText, { color: item.accent }]}>{item.icon}</Text>
    </View>
    <Text
      style={[
        styles.navLabel,
        { color: isActive ? item.accent : colors.text.secondary, fontWeight: isActive ? '700' : '500' },
      ]}
    >
      {item.name}
    </Text>
    {isActive && (
      <View style={[styles.activeIndicator, { backgroundColor: item.accent }]} aria-hidden="true" />
    )}
  </TouchableOpacity>
);

const RecentRepoItem = ({ repo, colors }) => (
  <View
    style={[
      styles.recentRepo,
      {
        backgroundColor: colors.bg.card,
        borderColor: colors.border.subtle,
      },
    ]}
    accessible={true}
    accessibilityLabel={`Recent repository ${repo.name}`}
  >
    <View style={[styles.repoLangDot, { backgroundColor: repo.languageColor || colors.indigo[400] }]} aria-hidden="true" />
    <Text style={[styles.repoRecentName, { color: colors.text.primary }]} numberOfLines={1}>{repo.name}</Text>
    <View style={styles.spacer} />
  </View>
);

export default function DrawerContent(props) {
  const { state, navigation } = props;
  const { user, repos, tasks, signOut } = useGitHub();
  const { isDark, toggleTheme, colors } = useTheme();
  const activeRouteName = state?.routeNames?.[state?.index] ?? 'Dashboard';

  const totalStars = repos.reduce((s, r) => s + (r.stars || 0), 0);
  const pendingTasksCount = tasks.filter((t) => !t.completed).length;
  const displayUser = user || {
    displayName: 'Guest Developer',
    username: 'guest',
    avatarInitials: 'GD',
  };

  const navigateTo = (screen) => {
    navigation.navigate(screen);
    navigation.closeDrawer?.();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg.secondary }]}>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Profile header ──────────────────────────────── */}
        <View style={[styles.profileSection, { borderBottomColor: colors.border.subtle }]}>
          {/* Background glow */}
          <View style={styles.profileGlow} />

          <View style={[styles.profileAvatar, { borderColor: `${colors.indigo[500]}70` }]}>
            {displayUser.avatarUrl || (displayUser.username && displayUser.username !== 'guest') ? (
              <Image
                source={{ uri: displayUser.avatarUrl || `https://github.com/${displayUser.username}.png` }}
                style={styles.profileAvatarImage}
                resizeMode="cover"
              />
            ) : (
              <Text style={[styles.profileAvatarText, { color: colors.indigo[400] }]}>{displayUser.avatarInitials || 'DEV'}</Text>
            )}
          </View>

          <Text style={[styles.profileName, { color: colors.text.primary }]}>{displayUser.displayName || displayUser.username}</Text>
          <Text style={[styles.profileUsername, { color: colors.text.muted }]}>@{displayUser.username}</Text>

          {/* Real quick stats */}
          <View style={[styles.statsRow, { backgroundColor: colors.bg.card, borderColor: colors.border.subtle, borderWidth: 1, borderRadius: Radius.lg, padding: 8 }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.indigo[400] }]}>
                {displayUser.publicRepos ?? repos.length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.text.muted }]}>Repos</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border.subtle }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.purple[400] }]}>
                {displayUser.followers ?? 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.text.muted }]}>Followers</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border.subtle }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.amber[400] }]}>
                {displayUser.following ?? 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.text.muted }]}>Following</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border.subtle }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.emerald[400] }]}>
                {pendingTasksCount}
              </Text>
              <Text style={[styles.statLabel, { color: colors.text.muted }]}>Tasks</Text>
            </View>
          </View>
        </View>

        {/* ── Navigation ──────────────────────────────────── */}
        <View style={styles.navSection}>
          <Text style={[styles.sectionLabel, { color: colors.text.muted }]}>NAVIGATION</Text>
          {NAV_ITEMS.map((item) => (
            <NavItem
              key={item.name}
              item={item}
              isActive={activeRouteName === item.screen}
              onPress={navigateTo}
              colors={colors}
            />
          ))}
        </View>

        {/* ── Recent repos ─────────────────────────────────── */}
        <View style={styles.recentSection}>
          <Text style={[styles.sectionLabel, { color: colors.text.muted }]}>RECENT REPOS</Text>
          {repos.length > 0 ? (
            repos.slice(0, 3).map((repo) => (
              <RecentRepoItem key={repo.id || repo.name} repo={repo} colors={colors} />
            ))
          ) : (
            <Text style={[styles.emptyRepoText, { color: colors.text.muted }]}>No synced repos yet</Text>
          )}
        </View>
      </DrawerContentScrollView>

      {/* ── Bottom ─────────────────────────────────────────── */}
      <View style={[styles.bottomSection, { borderTopColor: colors.border.subtle }]}>
        <View style={[styles.bottomDivider, { backgroundColor: colors.border.subtle }]} />

        <TouchableOpacity
          onPress={toggleTheme}
          style={styles.bottomItem}
          activeOpacity={0.65}
          accessibilityRole="button"
          accessibilityLabel="Chuyển chế độ giao diện Sáng / Tối"
        >
          <Text style={styles.bottomIcon} aria-hidden="true">{isDark ? '☀️' : '🌙'}</Text>
          <Text style={[styles.bottomLabel, { color: colors.text.secondary }]}>
            {isDark ? 'Chuyển Chế Độ Sáng' : 'Chuyển Chế Độ Tối'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => signOut()}
          style={[styles.bottomItem, styles.bottomItemDanger]}
          activeOpacity={0.65}
          accessibilityRole="button"
          accessibilityLabel="Sign Out"
          accessibilityHint="Signs out and returns to login"
        >
          <Text style={styles.bottomIcon} aria-hidden="true">⊗</Text>
          <Text style={[styles.bottomLabel, styles.bottomLabelDanger]}>Đăng Xuất</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: Colors.bg.secondary,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },

  // ── Profile
  profileSection: {
    alignItems:     'center',
    paddingTop:     Spacing['2xl'],
    paddingBottom:  Spacing.xl,
    paddingHorizontal: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
    marginBottom:   Spacing.md,
    position:       'relative',
    overflow:       'hidden',
  },
  profileGlow: {
    position:        'absolute',
    top:             -60,
    left:            '50%',
    width:           180,
    height:          180,
    borderRadius:    90,
    backgroundColor: Colors.glow.indigo,
    transform:       [{ translateX: -90 }],
  },
  profileAvatar: {
    width:           70,
    height:          70,
    borderRadius:    Radius.full,
    backgroundColor: `${Colors.indigo[500]}25`,
    borderWidth:     2.5,
    borderColor:     `${Colors.indigo[500]}70`,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    Spacing.md,
    overflow:        'hidden',
  },
  profileAvatarImage: {
    width:  '100%',
    height: '100%',
    borderRadius: Radius.full,
  },
  profileAvatarText: {
    ...Typography.styles.headingLg,
    color:      Colors.indigo[400],
    fontWeight: '800',
  },
  profileName: {
    ...Typography.styles.headingMd,
    color: Colors.text.primary,
  },
  profileUsername: {
    ...Typography.styles.monoSm,
    color:      Colors.text.muted,
    marginTop:  2,
    marginBottom: Spacing.md,
  },
  statsRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            Spacing.xl,
  },
  statItem: {
    alignItems: 'center',
    gap:        2,
  },
  statValue: {
    ...Typography.styles.headingMd,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    ...Typography.styles.bodySm,
    color: Colors.text.muted,
  },
  statDivider: {
    width:           1,
    height:          24,
    backgroundColor: Colors.border.subtle,
  },

  // ── Nav section
  navSection: {
    paddingHorizontal: Spacing.cardPadding,
    gap:               Spacing.xs,
    marginBottom:      Spacing.xl,
  },
  sectionLabel: {
    ...Typography.styles.label,
    color:          Colors.text.dimmed,
    fontSize:       9,
    paddingHorizontal: Spacing.sm,
    marginBottom:   Spacing.xs,
  },
  navItem: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:              Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.md,
    borderRadius:     Radius.lg,
    position:         'relative',
  },
  navItemActive: {
    backgroundColor: `${Colors.indigo[500]}14`,
    borderWidth:     1,
    borderColor:     `${Colors.indigo[500]}30`,
  },
  navIcon: {
    width:          38,
    height:         38,
    borderRadius:   Radius.md,
    alignItems:     'center',
    justifyContent: 'center',
  },
  navIconText: {
    fontSize:   18,
    lineHeight: 22,
  },
  navLabel: {
    ...Typography.styles.headingSm,
    color:  Colors.text.secondary,
    flex:   1,
  },
  navLabelActive: {
    color: Colors.indigo[400],
  },
  activeIndicator: {
    width:        4,
    height:       4,
    borderRadius: Radius.full,
  },

  // ── Recent repos
  recentSection: {
    paddingHorizontal: Spacing.cardPadding,
    gap:               Spacing.xs,
  },
  recentRepo: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:              Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.sm + 2,
    backgroundColor:  Colors.bg.card,
    borderRadius:     Radius.md,
    borderWidth:      1,
    borderColor:      Colors.border.subtle,
    marginBottom:     Spacing.xs,
  },
  repoLangDot: {
    width:        8,
    height:       8,
    borderRadius: Radius.full,
  },
  repoRecentName: {
    ...Typography.styles.monoSm,
    color: Colors.text.secondary,
    flex:  1,
  },
  spacer: { flex: 1 },
  repoTaskBadge: {
    backgroundColor:  `${Colors.indigo[500]}20`,
    borderRadius:     Radius.full,
    minWidth:         20,
    height:           20,
    paddingHorizontal: 5,
    alignItems:       'center',
    justifyContent:   'center',
    borderWidth:      1,
    borderColor:      `${Colors.indigo[500]}40`,
  },
  repoTaskBadgeText: {
    ...Typography.styles.label,
    color:    Colors.indigo[400],
    fontSize: 9,
  },
  emptyRepoText: {
    ...Typography.styles.bodySm,
    color: Colors.text.muted,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontStyle: 'italic',
  },

  // ── Bottom
  bottomSection: {
    paddingHorizontal: Spacing.cardPadding,
    paddingBottom:     Spacing.xl + Spacing.sm,
    gap:               Spacing.xs,
  },
  bottomDivider: {
    height:          1,
    backgroundColor: Colors.border.subtle,
    marginBottom:    Spacing.sm,
  },
  bottomItem: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:              Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.md,
    borderRadius:     Radius.lg,
  },
  bottomItemDanger: {
    // danger tint on press only via activeOpacity
  },
  bottomIcon: {
    color:    Colors.text.muted,
    fontSize: 18,
    width:    22,
    textAlign: 'center',
  },
  bottomLabel: {
    ...Typography.styles.headingSm,
    color: Colors.text.secondary,
  },
  bottomLabelDanger: {
    color: Colors.rose[400],
  },
});
