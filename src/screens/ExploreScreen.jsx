/**
 * ExploreScreen — Open Source Repository Explorer
 * ─────────────────────────────────────────────────────────────────────────────
 * Features:
 *   • Search public GitHub repositories with live query execution
 *   • Quick query suggestion chips (#React-Native, #AI, #TypeScript, etc.)
 *   • Sort filters (Most Stars, Most Forks, Recently Updated)
 *   • Skeleton loading cards for responsive feedback
 *   • Interactive [⋮] Context Menu per repository:
 *       - ⭐ Star Repository (calls GitHub Star API)
 *       - 🍴 Fork Repository (calls GitHub Fork API)
 *       - 📥 Copy Clone URL to Clipboard
 *       - 📌 Track / Untrack Repository in local bookmarks
 *   • Dark mode glassmorphism styled with typeui.sh & ibelick/ui-skills tokens
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, Animated, RefreshControl, Image,
  Alert, Clipboard, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { Radius, Spacing, Shadow } from '../constants/spacing';
import ContextMenu, { OPEN_SOURCE_MENU_ACTIONS } from '../components/ContextMenu';
import githubService from '../services/githubService';
import { useGitHub } from '../context/GitHubContext';
import { useTheme } from '../context/ThemeContext';

const QUICK_TOPICS = [
  'react-native',
  'typescript',
  'ai',
  'nextjs',
  'tailwindcss',
  'rust',
  'golang',
  'python',
];

const SORT_OPTIONS = [
  { id: 'stars',   label: 'Most Stars', icon: '★' },
  { id: 'forks',   label: 'Most Forks', icon: '⑂' },
  { id: 'updated', label: 'Updated',    icon: '🕒' },
];

/** Skeleton loading card while fetching */
const SkeletonCard = () => {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.7,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  return (
    <Animated.View style={[styles.card, styles.skeletonCard, { opacity: pulseAnim }]}>
      <View style={styles.skeletonHeader}>
        <View style={styles.skeletonAvatar} />
        <View style={styles.skeletonTitle} />
      </View>
      <View style={styles.skeletonLine} />
      <View style={[styles.skeletonLine, { width: '65%' }]} />
      <View style={styles.skeletonFooter}>
        <View style={styles.skeletonPill} />
        <View style={styles.skeletonPill} />
      </View>
    </Animated.View>
  );
};

/** Open Source Repository Card */
const ExploreRepoCard = ({ repo, onMenuPress, isTracked }) => {
  const { colors, isDark, scaleFont } = useTheme();
  const [ownerName, repoName] = repo.fullName.split('/');

  return (
    <View style={[styles.card, { backgroundColor: colors.bg.card, borderColor: colors.border.subtle }]}>
      {/* Top accent line */}
      <View style={[styles.topAccent, { backgroundColor: repo.languageColor }]} aria-hidden="true" />

      {/* Header: Owner Avatar + Repo Name + Menu Trigger */}
      <View style={styles.cardHeader}>
        <View style={styles.repoIdentity}>
          {repo.ownerAvatar ? (
            <Image
              source={{ uri: repo.ownerAvatar }}
              style={[styles.ownerAvatar, { borderColor: colors.border.subtle }]}
              accessibilityLabel={`${repo.owner} avatar`}
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarFallbackText}>
                {(repo.owner || 'OS').slice(0, 2).toUpperCase()}
              </Text>
            </View>
          )}

          <View style={styles.titleWrap}>
            <Text style={[styles.ownerText, { color: colors.text.muted, fontSize: scaleFont(11) }]} numberOfLines={1}>
              {ownerName || repo.owner} /
            </Text>
            <Text style={[styles.repoNameText, { color: colors.text.primary, fontSize: scaleFont(15) }]} numberOfLines={1}>
              {repoName || repo.name}
            </Text>
          </View>
        </View>

        {/* Status indicators: Tracked bookmark badge + Context Menu */}
        <View style={styles.headerRight}>
          {isTracked && (
            <View
              style={styles.trackedBadge}
              accessible={true}
              accessibilityLabel="Tracked repository"
            >
              <Text style={styles.trackedBadgeText}>📌 Tracked</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.menuBtn, { backgroundColor: colors.bg.cardElevated, borderColor: colors.border.default }]}
            onPress={() => onMenuPress(repo)}
            activeOpacity={0.65}
            accessibilityRole="button"
            accessibilityLabel={`Options for ${repo.name}`}
            accessibilityHint="Opens star, fork, clone, and track actions"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.menuDots, { color: colors.text.secondary }]} aria-hidden="true">⋮</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Description */}
      <Text style={[styles.description, { color: colors.text.secondary, fontSize: scaleFont(13) }]} numberOfLines={2}>
        {repo.description}
      </Text>

      {/* Topics */}
      {repo.topics?.length > 0 && (
        <View style={styles.topicsRow}>
          {repo.topics.slice(0, 3).map((topic) => (
            <View key={topic} style={[styles.topicChip, { backgroundColor: colors.bg.cardElevated, borderColor: colors.border.subtle }]}>
              <Text style={[styles.topicText, { color: colors.sky[400], fontSize: scaleFont(10) }]}>#{topic}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Meta Footer */}
      <View style={styles.metaRow}>
        {/* Language */}
        <View style={styles.metaItem}>
          <View style={[styles.langDot, { backgroundColor: repo.languageColor }]} aria-hidden="true" />
          <Text style={[styles.metaText, { color: colors.text.secondary, fontSize: scaleFont(12) }]}>{repo.language}</Text>
        </View>

        {/* Stars */}
        <View style={styles.metaItem} accessible={true} accessibilityLabel={`${repo.stars} stars`}>
          <Text style={[styles.starIcon, { color: colors.amber[400] }]} aria-hidden="true">★</Text>
          <Text style={[styles.metaNumber, { color: colors.text.secondary, fontSize: scaleFont(12) }]}>
            {repo.stars >= 1000 ? `${(repo.stars / 1000).toFixed(1)}k` : repo.stars}
          </Text>
        </View>

        {/* Forks */}
        <View style={styles.metaItem} accessible={true} accessibilityLabel={`${repo.forks} forks`}>
          <Text style={[styles.forkIcon, { color: colors.sky[400] }]} aria-hidden="true">⑂</Text>
          <Text style={[styles.metaNumber, { color: colors.text.secondary, fontSize: scaleFont(12) }]}>
            {repo.forks >= 1000 ? `${(repo.forks / 1000).toFixed(1)}k` : repo.forks}
          </Text>
        </View>

        {/* License */}
        {repo.license && (
          <View style={[styles.licenseBadge, { backgroundColor: colors.bg.cardElevated, borderColor: colors.border.subtle }]}>
            <Text style={[styles.licenseText, { color: colors.text.muted, fontSize: scaleFont(10) }]} numberOfLines={1}>{repo.license}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default function ExploreScreen() {
  const { trackRepo, untrackRepo, isTracked, starRepo, forkRepo } = useGitHub();
  const { colors, isDark, scaleFont } = useTheme();

  const [query, setQuery] = useState('react-native');
  const [activeSort, setActiveSort] = useState('stars');
  const [results, setResults] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);

  // Search repositories execution
  const executeSearch = useCallback(async (searchQuery, sortOption) => {
    setLoading(true);
    try {
      const res = await githubService.searchRepositories(searchQuery, sortOption, 1, 25);
      setResults(res.items || []);
      setTotalCount(res.totalCount || 0);
    } catch (err) {
      Alert.alert(
        'Search Notice',
        err.message || 'Could not fetch repositories. Please check connection or API rate limit.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    executeSearch(query, activeSort);
  }, []);

  const handleSearchSubmit = () => {
    if (query.trim().length > 0) {
      executeSearch(query, activeSort);
    }
  };

  const handleTopicPress = (topic) => {
    setQuery(topic);
    executeSearch(topic, activeSort);
  };

  const handleSortChange = (sortId) => {
    setActiveSort(sortId);
    executeSearch(query, sortId);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await executeSearch(query, activeSort);
    setRefreshing(false);
  }, [query, activeSort, executeSearch]);

  const handleOpenMenu = useCallback((repo) => {
    setSelectedRepo(repo);
    setMenuVisible(true);
  }, []);

  // Action dispatcher for the popover context menu
  const handleMenuAction = useCallback(async (actionId, repo) => {
    if (!repo) return;
    const [owner, name] = (repo.fullName || '').split('/');

    switch (actionId) {
      case 'star': {
        try {
          await starRepo(owner || repo.owner, name || repo.name);
          Alert.alert('⭐ Starred!', `Successfully starred ${repo.fullName} on GitHub.`);
        } catch (err) {
          Alert.alert('Star Repository', err.message);
        }
        break;
      }
      case 'fork': {
        try {
          const forked = await forkRepo(owner || repo.owner, name || repo.name);
          Alert.alert('🍴 Fork Created!', `Created fork ${forked.fullName || repo.name} in your account.`);
        } catch (err) {
          Alert.alert('Fork Repository', err.message);
        }
        break;
      }
      case 'clone': {
        const url = repo.cloneUrl || `https://github.com/${repo.fullName}.git`;
        Clipboard.setString(url);
        Alert.alert('📥 Clone URL Copied', `${url}\n\nCopied to device clipboard.`);
        break;
      }
      case 'track': {
        if (isTracked(repo.id)) {
          untrackRepo(repo.id);
          Alert.alert('📌 Removed', `Removed ${repo.name} from My Tracked Repos.`);
        } else {
          trackRepo(repo);
          Alert.alert('📌 Tracked!', `Added ${repo.name} to My Tracked Repos.`);
        }
        break;
      }
    }
  }, [starRepo, forkRepo, trackRepo, untrackRepo, isTracked]);

  // Dynamic context menu action labels based on track state
  const contextMenuActions = OPEN_SOURCE_MENU_ACTIONS.map((action) => {
    if (action.id === 'track' && selectedRepo && isTracked(selectedRepo.id)) {
      return {
        ...action,
        icon: '✕',
        label: 'Untrack Repository',
        color: Colors.rose[400],
        desc: 'Remove from My Tracked Repos',
      };
    }
    return action;
  });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg.secondary }]} edges={['top']}>
      {/* ── Search & Header Section ──────────────────────────────── */}
      <View style={[styles.header, { borderBottomColor: colors.border.subtle }]}>
        <View style={styles.titleRow}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text.primary, fontSize: scaleFont(22) }]}>
              Explore Open Source
            </Text>
            <Text style={[styles.headerSub, { color: colors.text.muted, fontSize: scaleFont(12) }]}>
              Search millions of public repositories on GitHub
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchBar, { backgroundColor: colors.bg.card, borderColor: colors.border.default }]}>
          <Text style={[styles.searchIcon, { color: colors.text.muted }]} aria-hidden="true">⌕</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.text.primary, fontSize: scaleFont(13) }]}
            placeholder="Search repos (e.g. react-native, ai, spring-boot)…"
            placeholderTextColor={colors.text.muted}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
            selectionColor={colors.sky[400]}
            accessibilityRole="search"
            accessibilityLabel="Search public open source repositories"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => setQuery('')}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Clear search input"
            >
              <Text style={[styles.searchClear, { color: colors.text.muted }]} aria-hidden="true">✕</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.searchActionBtn}
            onPress={handleSearchSubmit}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Submit search"
          >
            <Text style={styles.searchActionText}>Search</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Topics Pills */}
        <View style={styles.topicsScroll}>
          <FlatList
            horizontal
            data={QUICK_TOPICS}
            keyExtractor={(item) => item}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.topicsScrollContent}
            renderItem={({ item }) => {
              const isSelected = query.toLowerCase() === item.toLowerCase();
              return (
                <TouchableOpacity
                  style={[
                    styles.quickTopicChip,
                    {
                      backgroundColor: isSelected ? `${colors.sky[500]}22` : colors.bg.card,
                      borderColor: isSelected ? colors.sky[500] : colors.border.subtle,
                    },
                  ]}
                  onPress={() => handleTopicPress(item)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`Search ${item}`}
                >
                  <Text
                    style={[
                      styles.quickTopicText,
                      {
                        color: isSelected ? colors.sky[400] : colors.text.secondary,
                        fontWeight: isSelected ? '700' : '500',
                        fontSize: scaleFont(11),
                      },
                    ]}
                  >
                    #{item}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {/* Sort Chips */}
        <View style={styles.sortRow} accessibilityRole="tablist">
          {SORT_OPTIONS.map((opt) => {
            const isSelected = activeSort === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[
                  styles.sortChip,
                  {
                    backgroundColor: isSelected ? `${colors.indigo[500]}22` : colors.bg.card,
                    borderColor: isSelected ? colors.indigo[500] : colors.border.subtle,
                  },
                ]}
                onPress={() => handleSortChange(opt.id)}
                activeOpacity={0.7}
                accessibilityRole="tab"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`Sort by ${opt.label}`}
              >
                <Text
                  style={[
                    styles.sortIcon,
                    { color: isSelected ? colors.indigo[400] : colors.text.muted },
                  ]}
                  aria-hidden="true"
                >
                  {opt.icon}
                </Text>
                <Text
                  style={[
                    styles.sortLabel,
                    {
                      color: isSelected ? colors.indigo[400] : colors.text.secondary,
                      fontWeight: isSelected ? '700' : '500',
                      fontSize: scaleFont(11),
                    },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── Results List ─────────────────────────────────────────── */}
      {loading && results.length === 0 ? (
        <View style={styles.skeletonList}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ExploreRepoCard
              repo={item}
              onMenuPress={handleOpenMenu}
              isTracked={isTracked(item.id)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={5}
          maxToRenderPerBatch={6}
          windowSize={5}
          removeClippedSubviews={Platform.OS === 'android'}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.sky[400]}
              colors={[Colors.sky[400]]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji} aria-hidden="true">🌐</Text>
              <Text style={styles.emptyTitle}>No repositories found</Text>
              <Text style={styles.emptySubtitle}>
                Try adjusting your search terms or pick a popular topic above.
              </Text>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={() => handleTopicPress('react-native')}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Explore React Native repositories"
              >
                <Text style={styles.retryBtnText}>Explore #react-native</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* ── Interactive Popover Context Menu ─────────────────────── */}
      <ContextMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onAction={handleMenuAction}
        repo={selectedRepo}
        actions={contextMenuActions}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex:            1,
    backgroundColor: Colors.bg.secondary,
  },
  header: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop:        Spacing.xl,
    paddingBottom:     Spacing.md,
    gap:               Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  titleRow: {
    flexDirection:   'row',
    alignItems:      'flex-end',
    justifyContent:  'space-between',
  },
  headerTitle: {
    ...Typography.styles.displayMd,
    color: Colors.text.primary,
  },
  headerSub: {
    ...Typography.styles.bodySm,
    color: Colors.text.muted,
  },
  searchBar: {
    flexDirection:    'row',
    alignItems:       'center',
    backgroundColor:  Colors.bg.card,
    borderRadius:     Radius.lg,
    borderWidth:      1,
    borderColor:      Colors.border.default,
    paddingHorizontal: Spacing.cardPadding,
    gap:              Spacing.sm,
    height:           48,
  },
  searchIcon: {
    color:    Colors.text.muted,
    fontSize: 18,
  },
  searchInput: {
    flex:     1,
    ...Typography.styles.bodyMd,
    color:    Colors.text.primary,
    height:   48,
  },
  searchClear: {
    color:    Colors.text.muted,
    fontSize: 14,
    padding:  4,
  },
  searchActionBtn: {
    backgroundColor:  Colors.sky[600],
    borderRadius:     Radius.md,
    paddingHorizontal: 12,
    paddingVertical:   6,
  },
  searchActionText: {
    ...Typography.styles.label,
    color: '#fff',
    fontSize: 11,
  },
  topicsScroll: {
    marginHorizontal: -Spacing.screenPadding,
  },
  topicsScrollContent: {
    paddingHorizontal: Spacing.screenPadding,
    gap:               Spacing.sm,
  },
  quickTopicChip: {
    backgroundColor:  Colors.bg.card,
    borderRadius:     Radius.full,
    paddingHorizontal: 12,
    paddingVertical:   6,
    borderWidth:      1,
    borderColor:      Colors.border.subtle,
  },
  quickTopicChipActive: {
    backgroundColor: `${Colors.sky[500]}22`,
    borderColor:     Colors.sky[500],
  },
  quickTopicText: {
    ...Typography.styles.label,
    color:    Colors.text.secondary,
    fontSize: 11,
  },
  quickTopicTextActive: {
    color: Colors.sky[400],
  },
  sortRow: {
    flexDirection: 'row',
    gap:           Spacing.sm,
  },
  sortChip: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:              4,
    backgroundColor:  Colors.bg.card,
    borderRadius:     Radius.sm,
    paddingHorizontal: 10,
    paddingVertical:   6,
    borderWidth:      1,
    borderColor:      Colors.border.subtle,
  },
  sortChipActive: {
    backgroundColor: `${Colors.indigo[500]}20`,
    borderColor:     Colors.indigo[500],
  },
  sortIcon: {
    color:    Colors.text.muted,
    fontSize: 12,
  },
  sortIconActive: {
    color: Colors.indigo[400],
  },
  sortLabel: {
    ...Typography.styles.bodySm,
    color:    Colors.text.muted,
    fontSize: 11,
  },
  sortLabelActive: {
    color:      Colors.indigo[400],
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop:        Spacing.md,
    paddingBottom:     Spacing['3xl'],
  },
  card: {
    backgroundColor: Colors.bg.card,
    borderRadius:    Radius.xl,
    borderWidth:     1,
    borderColor:     Colors.border.subtle,
    padding:         Spacing.cardPadding,
    marginBottom:    Spacing.md,
    gap:             Spacing.sm,
    overflow:        'hidden',
    position:        'relative',
  },
  topAccent: {
    position:        'absolute',
    top:             0,
    left:            Spacing.xl,
    right:           Spacing.xl,
    height:          2,
    opacity:         0.55,
    borderRadius:    Radius.full,
  },
  cardHeader: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingTop:     2,
  },
  repoIdentity: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.md,
    flex:          1,
  },
  ownerAvatar: {
    width:        36,
    height:       36,
    borderRadius: Radius.md,
    borderWidth:  1,
    borderColor:  Colors.border.subtle,
  },
  avatarFallback: {
    width:           36,
    height:          36,
    borderRadius:    Radius.md,
    backgroundColor: `${Colors.sky[500]}20`,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     1,
    borderColor:     `${Colors.sky[500]}40`,
  },
  avatarFallbackText: {
    ...Typography.styles.label,
    color: Colors.sky[400],
  },
  titleWrap: {
    flex: 1,
    gap:  1,
  },
  ownerText: {
    ...Typography.styles.bodySm,
    color: Colors.text.muted,
  },
  repoNameText: {
    ...Typography.styles.headingSm,
    color:      Colors.text.primary,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.sm,
  },
  trackedBadge: {
    backgroundColor:  `${Colors.emerald[500]}18`,
    borderRadius:     Radius.full,
    paddingHorizontal: 8,
    paddingVertical:   3,
    borderWidth:      1,
    borderColor:      `${Colors.emerald[500]}40`,
  },
  trackedBadgeText: {
    ...Typography.styles.label,
    color:    Colors.emerald[400],
    fontSize: 9,
  },
  menuBtn: {
    width:           32,
    height:          32,
    borderRadius:    Radius.md,
    backgroundColor: Colors.bg.cardElevated,
    borderWidth:     1,
    borderColor:     Colors.border.default,
    alignItems:      'center',
    justifyContent:  'center',
  },
  menuDots: {
    color:      Colors.text.secondary,
    fontSize:   18,
    lineHeight: 20,
    fontWeight: '700',
  },
  description: {
    ...Typography.styles.bodyMd,
    color: Colors.text.secondary,
  },
  topicsRow: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           Spacing.xs,
  },
  topicChip: {
    backgroundColor:  `${Colors.indigo[500]}15`,
    borderRadius:     Radius.sm,
    paddingHorizontal: 7,
    paddingVertical:   2,
    borderWidth:      1,
    borderColor:      `${Colors.indigo[500]}30`,
  },
  topicText: {
    ...Typography.styles.label,
    color:    Colors.indigo[400],
    fontSize: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.md,
    marginTop:     4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           5,
  },
  langDot: {
    width:        8,
    height:       8,
    borderRadius: Radius.full,
  },
  metaText: {
    ...Typography.styles.bodySm,
    color: Colors.text.muted,
  },
  starIcon: {
    color:    Colors.amber[400],
    fontSize: 12,
  },
  forkIcon: {
    color:    Colors.cyan[400],
    fontSize: 12,
  },
  metaNumber: {
    ...Typography.styles.bodySm,
    color:       Colors.text.secondary,
    fontVariant: ['tabular-nums'],
    fontWeight:  '600',
  },
  licenseBadge: {
    marginLeft:        'auto',
    backgroundColor:   Colors.bg.cardElevated,
    borderRadius:      Radius.sm,
    paddingHorizontal: 7,
    paddingVertical:   2,
    borderWidth:       1,
    borderColor:       Colors.border.subtle,
  },
  licenseText: {
    ...Typography.styles.monoSm,
    color:    Colors.text.muted,
    fontSize: 9,
  },
  skeletonList: {
    padding: Spacing.screenPadding,
    gap:     Spacing.md,
  },
  skeletonCard: {
    minHeight: 140,
    gap:       Spacing.md,
  },
  skeletonHeader: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.md,
  },
  skeletonAvatar: {
    width:           36,
    height:          36,
    borderRadius:    Radius.md,
    backgroundColor: Colors.border.default,
  },
  skeletonTitle: {
    flex:            1,
    height:          16,
    borderRadius:    Radius.sm,
    backgroundColor: Colors.border.default,
  },
  skeletonLine: {
    height:          12,
    borderRadius:    Radius.sm,
    backgroundColor: Colors.border.subtle,
    width:           '90%',
  },
  skeletonFooter: {
    flexDirection: 'row',
    gap:           Spacing.md,
    marginTop:     4,
  },
  skeletonPill: {
    width:           50,
    height:          16,
    borderRadius:    Radius.sm,
    backgroundColor: Colors.border.subtle,
  },
  emptyState: {
    alignItems:      'center',
    paddingVertical: Spacing['3xl'],
    gap:             Spacing.sm,
  },
  emptyEmoji: {
    fontSize: 44,
  },
  emptyTitle: {
    ...Typography.styles.headingMd,
    color: Colors.text.primary,
  },
  emptySubtitle: {
    ...Typography.styles.bodyMd,
    color:     Colors.text.secondary,
    textAlign: 'center',
    maxWidth:  280,
  },
  retryBtn: {
    marginTop:         Spacing.sm,
    backgroundColor:   `${Colors.sky[500]}20`,
    borderRadius:      Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical:   Spacing.sm,
    borderWidth:       1,
    borderColor:       `${Colors.sky[500]}45`,
  },
  retryBtnText: {
    ...Typography.styles.headingSm,
    color: Colors.sky[400],
    fontSize: 13,
  },
});
