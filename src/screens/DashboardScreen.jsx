import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { Radius, Spacing } from '../constants/spacing';
import GreetingHeader from '../components/GreetingHeader';
import ActivityCard from '../components/ActivityCard';
import TaskItem from '../components/TaskItem';
import CreateTaskModal from '../components/CreateTaskModal';
import ContributionGraph from '../components/ContributionGraph';
import { useGitHub } from '../context/GitHubContext';
import { useTheme } from '../context/ThemeContext';

const StatCard = ({ stat, index, onPress }) => {
  const { colors, scaleFont } = useTheme();
  const scale = useRef(new Animated.Value(0.88)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        delay: index * 50,
        tension: 120,
        friction: 11,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 240,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, opacity, scale]);

  return (
    <Animated.View
      style={[
        styles.statCard,
        {
          opacity,
          transform: [{ scale }],
          backgroundColor: colors.bg.card,
          borderColor: colors.border.subtle,
        },
      ]}
    >
      <TouchableOpacity
        style={{ width: '100%', alignItems: 'center' }}
        onPress={onPress}
        activeOpacity={0.7}
        disabled={!onPress}
        accessibilityRole="button"
        accessibilityLabel={`${stat.label}: ${stat.value}`}
      >
        <View style={[styles.statIconBubble, { backgroundColor: `${stat.color}22` }]} aria-hidden="true">
          <Text style={[styles.statIcon, { color: stat.color }]}>{stat.icon}</Text>
        </View>
        <Text style={[styles.statValue, { color: stat.color, fontSize: scaleFont(22) }]}>{stat.value}</Text>
        <Text style={[styles.statLabel, { color: colors.text.muted, fontSize: scaleFont(12) }]}>{stat.label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function DashboardScreen({ navigation }) {
  const { colors, scaleFont } = useTheme();
  const {
    user,
    repos,
    trackedRepos,
    activities,
    tasks,
    todayTasks,
    upcomingTasks,
    overdueTasks,
    refreshAll,
    refreshing,
    toggleTask,
    deleteTask,
  } = useGitHub();

  const [activeTaskTab, setActiveTaskTab] = useState('today'); // 'today' | 'upcoming' | 'overdue' | 'all'
  const [taskModalVisible, setTaskModalVisible] = useState(false);

  const pendingToday = todayTasks.filter((t) => !t.completed);
  const pendingUpcoming = upcomingTasks.filter((t) => !t.completed);
  const pendingOverdue = overdueTasks.filter((t) => !t.completed);
  const allPending = tasks.filter((t) => !t.completed);

  // Filter tasks based on selected tab
  const displayedTasks = React.useMemo(() => {
    switch (activeTaskTab) {
      case 'today':
        return todayTasks;
      case 'upcoming':
        return upcomingTasks;
      case 'overdue':
        return overdueTasks;
      case 'all':
      default:
        return tasks;
    }
  }, [activeTaskTab, todayTasks, upcomingTasks, overdueTasks, tasks]);

  const totalStars = repos.reduce((sum, r) => sum + (r.stars || 0), 0);
  const totalReposCount = repos.length + (trackedRepos?.length || 0);

  const stats = [
    {
      label: 'Repos',
      value: String(totalReposCount),
      icon: '⎇',
      color: colors.indigo[400],
      onPress: () => navigation?.navigate('Repositories'),
    },
    {
      label: "Today's Tasks",
      value: String(pendingToday.length),
      icon: '◉',
      color: colors.amber[400],
      onPress: () => setActiveTaskTab('today'),
    },
    {
      label: 'Overdue',
      value: String(pendingOverdue.length),
      icon: '⚠️',
      color: colors.rose[400],
      onPress: () => setActiveTaskTab('overdue'),
    },
    {
      label: 'Stars',
      value: String(totalStars),
      icon: '★',
      color: colors.sky[400],
      onPress: () => navigation?.navigate('Repositories'),
    },
  ];

  const onRefresh = useCallback(async () => {
    await refreshAll();
  }, [refreshAll]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg.secondary }]} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.indigo[400]}
            colors={[Colors.indigo[400]]}
          />
        }
      >
        {/* ── Greeting Header ─────────────────────────────────── */}
        <GreetingHeader
          user={user}
          notificationCount={pendingOverdue.length}
          onNotifPress={() => setActiveTaskTab('overdue')}
          onPressRepos={() => navigation?.navigate('Repositories')}
        />

        {/* ── Real Stats Row ───────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.statsGrid}>
            {stats.map((stat, i) => (
              <StatCard key={stat.label} stat={stat} index={i} onPress={stat.onPress} />
            ))}
          </View>
        </View>

        {/* ── GitHub Contributions Heatmap Graph (103 contributions) ─ */}
        {user?.username && user.username !== 'guest' && (
          <View style={styles.section}>
            <ContributionGraph username={user.username} />
          </View>
        )}

        {/* ── Tasks Section (Today / Upcoming / Overdue / All) ────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionAccent, { backgroundColor: colors.amber[500] }]} aria-hidden="true" />
              <Text style={[styles.sectionTitle, { color: colors.text.primary, fontSize: scaleFont(16) }]}>
                Task Manager
              </Text>
            </View>

            {/* Quick + New Task Button */}
            <TouchableOpacity
              onPress={() => setTaskModalVisible(true)}
              style={[
                styles.addTaskBtn,
                {
                  backgroundColor: `${colors.indigo[500]}18`,
                  borderColor: colors.indigo[500],
                },
              ]}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Record new task"
            >
              <Text style={[styles.addTaskBtnText, { color: colors.indigo[400] }]}>+ New Task</Text>
            </TouchableOpacity>
          </View>

          {/* Segmented Filter Bar */}
          <View style={[styles.tabBar, { backgroundColor: colors.bg.card, borderColor: colors.border.subtle }]}>
            <TouchableOpacity
              onPress={() => setActiveTaskTab('today')}
              style={[
                styles.tabItem,
                activeTaskTab === 'today' && [
                  styles.tabItemActive,
                  { backgroundColor: colors.bg.cardElevated, borderColor: colors.border.default },
                ],
              ]}
              accessibilityRole="button"
              accessibilityLabel="Today's tasks filter"
            >
              <Text
                style={[
                  styles.tabText,
                  { color: activeTaskTab === 'today' ? colors.text.primary : colors.text.muted },
                  activeTaskTab === 'today' && styles.tabTextActive,
                ]}
              >
                Today ({pendingToday.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTaskTab('upcoming')}
              style={[
                styles.tabItem,
                activeTaskTab === 'upcoming' && [
                  styles.tabItemActive,
                  { backgroundColor: colors.bg.cardElevated, borderColor: colors.border.default },
                ],
              ]}
              accessibilityRole="button"
              accessibilityLabel="Upcoming tasks filter"
            >
              <Text
                style={[
                  styles.tabText,
                  { color: activeTaskTab === 'upcoming' ? colors.text.primary : colors.text.muted },
                  activeTaskTab === 'upcoming' && styles.tabTextActive,
                ]}
              >
                Upcoming ({pendingUpcoming.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTaskTab('overdue')}
              style={[
                styles.tabItem,
                activeTaskTab === 'overdue' && [
                  styles.tabItemActive,
                  { backgroundColor: colors.bg.cardElevated, borderColor: colors.border.default },
                ],
                pendingOverdue.length > 0 && styles.tabItemOverdue,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Overdue tasks filter"
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color: pendingOverdue.length > 0
                      ? colors.rose[400]
                      : activeTaskTab === 'overdue'
                      ? colors.text.primary
                      : colors.text.muted,
                  },
                  activeTaskTab === 'overdue' && styles.tabTextActive,
                ]}
              >
                Overdue ({pendingOverdue.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTaskTab('all')}
              style={[
                styles.tabItem,
                activeTaskTab === 'all' && [
                  styles.tabItemActive,
                  { backgroundColor: colors.bg.cardElevated, borderColor: colors.border.default },
                ],
              ]}
              accessibilityRole="button"
              accessibilityLabel="All tasks filter"
            >
              <Text
                style={[
                  styles.tabText,
                  { color: activeTaskTab === 'all' ? colors.text.primary : colors.text.muted },
                  activeTaskTab === 'all' && styles.tabTextActive,
                ]}
              >
                All ({allPending.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Task List */}
          {displayedTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={toggleTask}
              onDelete={deleteTask}
            />
          ))}

          {/* Clean Empty State */}
          {displayedTasks.length === 0 && (
            <View style={[styles.emptyState, { backgroundColor: colors.bg.card, borderColor: colors.border.subtle }]}>
              <Text style={styles.emptyEmoji} aria-hidden="true">
                {activeTaskTab === 'overdue' ? '✨' : activeTaskTab === 'today' ? '☀️' : '📋'}
              </Text>
              <Text style={[styles.emptyTitle, { color: colors.text.primary, fontSize: scaleFont(16) }]}>
                {activeTaskTab === 'overdue'
                  ? 'No overdue tasks!'
                  : activeTaskTab === 'today'
                  ? 'No tasks due today'
                  : 'No tasks in this category'}
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.text.muted, fontSize: scaleFont(12) }]}>
                {activeTaskTab === 'today'
                  ? 'Stay productive! Tap "+ New Task" to schedule your developer workflow.'
                  : 'Add deadlines and organize tasks tied to your repositories.'}
              </Text>
              <TouchableOpacity
                style={[
                  styles.emptyActionBtn,
                  { backgroundColor: `${colors.indigo[500]}18`, borderColor: colors.indigo[500] },
                ]}
                activeOpacity={0.7}
                onPress={() => setTaskModalVisible(true)}
                accessibilityRole="button"
                accessibilityLabel="Create a new task"
              >
                <Text style={[styles.emptyActionText, { color: colors.indigo[400] }]}>+ Create Task</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── Real GitHub Activity Feed ────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionAccent, { backgroundColor: colors.sky[500] }]} />
              <Text style={[styles.sectionTitle, { color: colors.text.primary, fontSize: scaleFont(16) }]}>
                Live Activity Feed
              </Text>
            </View>
          </View>

          {activities.length > 0 ? (
            activities.slice(0, 5).map((activity, i) => (
              <ActivityCard key={activity.id} activity={activity} index={i} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji} aria-hidden="true">⚡</Text>
              <Text style={styles.emptyTitle}>No live activities yet</Text>
              <Text style={styles.emptySubtitle}>
                GitHub events will populate here when you push commits, open pull requests, or star repositories.
              </Text>
            </View>
          )}
        </View>

        {/* Bottom spacing */}
        <View style={{ height: Spacing.xl }} />
      </ScrollView>

      {/* ── Modal for Task Creation ────────────────────────────── */}
      <CreateTaskModal
        visible={taskModalVisible}
        onClose={() => setTaskModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bg.secondary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.xl,
    gap: Spacing.sectionGap,
  },
  section: {
    gap: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    padding: Spacing.sm,
    alignItems: 'center',
    gap: 4,
  },
  statIconBubble: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  statIcon: {
    fontSize: 14,
  },
  statValue: {
    ...Typography.styles.stat,
    fontSize: 18,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    ...Typography.styles.label,
    color: Colors.text.muted,
    fontSize: 10,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sectionAccent: {
    width: 3,
    height: 18,
    borderRadius: Radius.full,
  },
  sectionTitle: {
    ...Typography.styles.h3,
    color: Colors.text.primary,
  },
  addTaskBtn: {
    backgroundColor: `${Colors.indigo[500]}20`,
    borderWidth: 1,
    borderColor: Colors.indigo[500],
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  addTaskBtnText: {
    ...Typography.styles.bodySm,
    color: Colors.indigo[400],
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    padding: 3,
    gap: 4,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.sm,
  },
  tabItemActive: {
    backgroundColor: Colors.bg.cardElevated,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  tabItemOverdue: {
    borderColor: `${Colors.rose[500]}30`,
  },
  tabText: {
    ...Typography.styles.monoSm,
    color: Colors.text.muted,
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
  tabTextActive: {
    color: Colors.text.primary,
    fontWeight: '700',
  },
  emptyState: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  emptyEmoji: {
    fontSize: 32,
    marginBottom: Spacing.xs,
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
  emptyActionBtn: {
    marginTop: Spacing.md,
    backgroundColor: `${Colors.indigo[500]}20`,
    borderColor: Colors.indigo[500],
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  emptyActionText: {
    ...Typography.styles.bodySm,
    color: Colors.indigo[400],
    fontWeight: '700',
  },
});
