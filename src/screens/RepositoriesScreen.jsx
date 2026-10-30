import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
  Clipboard,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { Radius, Spacing } from '../constants/spacing';
import RepoCard from '../components/RepoCard';
import ContextMenu from '../components/ContextMenu';
import CreateTaskModal from '../components/CreateTaskModal';
import { useGitHub } from '../context/GitHubContext';
import { useTheme } from '../context/ThemeContext';

const FILTERS = [
  { id: 'all',     label: 'All',     icon: '⎇' },
  { id: 'tracked', label: 'Tracked', icon: '📌' },
  { id: 'public',  label: 'Public',  icon: '◉' },
  { id: 'private', label: 'Private', icon: '🔒' },
  { id: 'starred', label: 'Starred', icon: '★' },
];

export default function RepositoriesScreen({ navigation }) {
  const { colors, scaleFont } = useTheme();
  const {
    repos,
    trackedRepos,
    tasksByRepo,
    refreshAll,
    refreshing,
    untrackRepo,
  } = useGitHub();

  const [search, setSearch] = useState('');
  const [activeFilter, setFilter] = useState('all');
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [taskTargetRepo, setTaskTargetRepo] = useState(null);

  const currentDataset = activeFilter === 'tracked' ? trackedRepos : repos;

  // Search + filter
  const filtered = currentDataset.filter((r) => {
    const matchSearch =
      r.name?.toLowerCase().includes(search.toLowerCase()) ||
      (r.description || '').toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (activeFilter === 'public')  return !r.isPrivate;
    if (activeFilter === 'private') return r.isPrivate;
    if (activeFilter === 'starred') return (r.stars || 0) > 0;
    return true;
  });

  const handleMenuPress = useCallback((repo) => {
    setSelectedRepo(repo);
    setMenuVisible(true);
  }, []);

  const handleAddTaskForRepo = useCallback((repoName) => {
    setTaskTargetRepo(repoName);
    setTaskModalVisible(true);
  }, []);

  const handleMenuAction = useCallback((actionId, repo) => {
    switch (actionId) {
      case 'add_task':
        handleAddTaskForRepo(repo?.name);
        break;
      case 'clone': {
        const url = repo?.cloneUrl || `https://github.com/${repo?.fullName || repo?.name}.git`;
        Clipboard.setString(url);
        Alert.alert(
          '📥 Clone URL Copied',
          `${url}\n\nCopied to clipboard.`,
          [{ text: 'OK' }],
        );
        break;
      }
      case 'checkout':
        Alert.alert(
          'Checkout Branch',
          `Checked out branch "${repo?.branch || 'main'}" on ${repo?.name}.`,
          [{ text: 'OK' }],
        );
        break;
      case 'open': {
        const url = repo?.htmlUrl || `https://github.com/${repo?.fullName || repo?.name}`;
        Linking.openURL(url).catch(() => {
          Alert.alert(
            repo?.fullName || repo?.name,
            `Owner: ${repo?.owner || 'user'}\nStars: ${repo?.stars || 0}\nForks: ${repo?.forks || 0}\nLanguage: ${repo?.language || 'Unknown'}\nClone: ${repo?.cloneUrl || 'N/A'}`,
            [{ text: 'Done' }]
          );
        });
        break;
      }
      case 'delete':
        if (activeFilter === 'tracked') {
          untrackRepo(repo?.id);
          Alert.alert('Untracked', `Removed ${repo?.name} from tracked repositories.`);
        } else {
          Alert.alert(
            'Delete Repository',
            `Are you sure you want to delete "${repo?.name}"?`,
            [
              { text: 'Delete', style: 'destructive' },
              { text: 'Cancel', style: 'cancel' },
            ],
          );
        }
        break;
    }
  }, [activeFilter, untrackRepo, handleAddTaskForRepo]);

  const onRefresh = useCallback(async () => {
    await refreshAll();
  }, [refreshAll]);

  const renderItem = useCallback(({ item, index }) => (
    <RepoCard
      repo={item}
      index={index}
      repoTasks={tasksByRepo[item.name] || []}
      onAddTask={handleAddTaskForRepo}
      onMenuPress={handleMenuPress}
    />
  ), [handleMenuPress, tasksByRepo, handleAddTaskForRepo]);

  const keyExtractor = useCallback((item) => String(item.id || item.name), []);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg.secondary }]} edges={['top']}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <View style={[styles.header, { borderBottomColor: colors.border.subtle }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text.primary, fontSize: scaleFont(24) }]}>
              Repositories
            </Text>
            <Text style={[styles.headerSub, { color: colors.text.muted, fontSize: scaleFont(13) }]}>
              {filtered.length} trên tổng số {currentDataset.length} {activeFilter === 'tracked' ? 'repo theo dõi' : 'repo'}
            </Text>
          </View>

          {/* New Task Button */}
          <TouchableOpacity
            style={styles.newRepoBtn}
            activeOpacity={0.7}
            onPress={() => {
              setTaskTargetRepo(null);
              setTaskModalVisible(true);
            }}
            accessibilityRole="button"
            accessibilityLabel="Tạo task mới"
          >
            <Text style={styles.newRepoBtnIcon} aria-hidden="true">+</Text>
            <Text style={styles.newRepoBtnText}>Ghi Task Mới</Text>
          </TouchableOpacity>
        </View>

        {/* ── Search bar ──────────────────────────────────────── */}
        <View style={[styles.searchBar, { backgroundColor: colors.bg.card, borderColor: colors.border.default }]}>
          <Text style={[styles.searchIcon, { color: colors.text.muted }]} aria-hidden="true">⌕</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.text.primary, fontSize: scaleFont(14) }]}
            placeholder="Tìm kiếm repository theo tên hoặc mô tả…"
            placeholderTextColor={colors.text.dimmed}
            value={search}
            onChangeText={setSearch}
            selectionColor={colors.indigo[400]}
            accessibilityRole="search"
            accessibilityLabel="Tìm kiếm repositories"
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {search.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearch('')}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Xóa nội dung tìm kiếm"
            >
              <Text style={styles.searchClear} aria-hidden="true">✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Filter chips ─────────────────────────────────────── */}
        <View style={styles.filterRow} accessibilityRole="tablist">
          {FILTERS.map((f) => {
            const isActive = activeFilter === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isActive ? `${colors.indigo[500]}20` : colors.bg.card,
                    borderColor: isActive ? colors.indigo[500] : colors.border.subtle,
                  },
                ]}
                onPress={() => setFilter(f.id)}
                activeOpacity={0.7}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={`Filter: ${f.label}`}
              >
                <Text
                  style={[
                    styles.filterIcon,
                    { color: isActive ? colors.indigo[400] : colors.text.muted },
                  ]}
                  aria-hidden="true"
                >
                  {f.icon}
                </Text>
                <Text
                  style={[
                    styles.filterLabel,
                    { color: isActive ? colors.indigo[400] : colors.text.secondary, fontWeight: isActive ? '700' : '500' },
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── Repo list — optimized FlatList ──────────────────────────── */}
      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
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
            tintColor={colors.indigo[400]}
            colors={[colors.indigo[400]]}
          />
        }
        ListEmptyComponent={
          <View style={[styles.emptyState, { backgroundColor: colors.bg.card, borderColor: colors.border.subtle }]}>
            <Text style={styles.emptyEmoji} aria-hidden="true">
              {activeFilter === 'tracked' ? '📌' : '🔍'}
            </Text>
            <Text style={[styles.emptyTitle, { color: colors.text.primary, fontSize: scaleFont(16) }]}>
              {activeFilter === 'tracked'
                ? 'No tracked repositories yet'
                : 'No repositories found'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.text.muted, fontSize: scaleFont(12) }]}>
              {activeFilter === 'tracked'
                ? 'Discover and bookmark public repositories in the Explore tab.'
                : 'Search open source repositories or sign in with your GitHub PAT to sync your repos.'}
            </Text>
            <TouchableOpacity
              style={[
                styles.exploreActionBtn,
                { backgroundColor: `${colors.indigo[500]}18`, borderColor: colors.indigo[500] },
              ]}
              onPress={() => navigation?.navigate?.('Explore')}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Explore open source repositories"
            >
              <Text style={[styles.exploreActionText, { color: colors.indigo[400] }]}>Explore Public Repos ›</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* ── Context Menu Modal ─────────────────────────────────── */}
      <ContextMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onAction={handleMenuAction}
        repo={selectedRepo}
      />

      {/* ── Task Creation Modal with Repo preselection ───────────── */}
      <CreateTaskModal
        visible={taskModalVisible}
        defaultRepo={taskTargetRepo}
        onClose={() => {
          setTaskModalVisible(false);
          setTaskTargetRepo(null);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bg.secondary,
  },
  header: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  headerTitle: {
    ...Typography.styles.displayMd,
    color: Colors.text.primary,
  },
  headerSub: {
    ...Typography.styles.bodySm,
    color: Colors.text.muted,
    fontVariant: ['tabular-nums'],
  },
  newRepoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.indigo[600],
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  newRepoBtnIcon: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 18,
  },
  newRepoBtnText: {
    ...Typography.styles.label,
    color: '#ffffff',
    fontSize: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    paddingHorizontal: Spacing.md,
    height: 40,
    gap: Spacing.sm,
  },
  searchIcon: {
    color: Colors.text.muted,
    fontSize: 18,
  },
  searchInput: {
    flex: 1,
    ...Typography.styles.body,
    color: Colors.text.primary,
    paddingVertical: 0,
  },
  searchClear: {
    color: Colors.text.muted,
    fontSize: 13,
    padding: 4,
  },
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  filterChipActive: {
    backgroundColor: `${Colors.indigo[500]}20`,
    borderColor: Colors.indigo[500],
  },
  filterIcon: {
    fontSize: 11,
    color: Colors.text.muted,
  },
  filterIconActive: {
    color: Colors.indigo[400],
  },
  filterLabel: {
    ...Typography.styles.label,
    color: Colors.text.muted,
    fontSize: 11,
  },
  filterLabelActive: {
    color: Colors.indigo[400],
  },
  listContent: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  emptyState: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    padding: Spacing.xxl,
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
  },
  emptyEmoji: {
    fontSize: 36,
  },
  emptyTitle: {
    ...Typography.styles.h3,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...Typography.styles.bodySm,
    color: Colors.text.muted,
    textAlign: 'center',
    maxWidth: 280,
  },
  exploreActionBtn: {
    marginTop: Spacing.md,
    backgroundColor: `${Colors.indigo[500]}20`,
    borderColor: Colors.indigo[500],
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  exploreActionText: {
    ...Typography.styles.bodySm,
    color: Colors.indigo[400],
    fontWeight: '700',
  },
});
