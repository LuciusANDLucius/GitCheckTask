import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Image,
  Modal,
  ActivityIndicator,
  ScrollView,
  Linking,
  Alert,
  Clipboard,
} from 'react-native';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { Radius, Spacing } from '../constants/spacing';
import { relativeTime, formatDueDate } from '../utils/dateUtils';
import { useTheme } from '../context/ThemeContext';
import githubService from '../services/githubService';

/**
 * RepoCard — Repository list card.
 * Features:
 *   • Language indicator dot with color
 *   • Branch name indicator
 *   • Stars, forks counters
 *   • Real associated tasks & deadline display
 *   • Direct "+ Task" button for repo
 *   • Private/Public badge
 *   • [⋮] context menu trigger
 *   • 👥 Contributors drawer/modal with real commit metrics
 *   • 👁️ Interactive Repository Detail Modal (Inspection & Direct Actions)
 *   • 🌐 1-Tap Open on GitHub in browser
 *   • 📋 1-Tap Copy Clone URL to clipboard
 *   • Dynamic Theme (Light / Dark) & Font Scaling support
 */

const RepoCard = ({ repo, onMenuPress, index = 0, repoTasks = [], onAddTask }) => {
  const { colors, isDark, scaleFont } = useTheme();
  const [contributors, setContributors] = useState([]);
  const [loadingContributors, setLoadingContributors] = useState(false);
  const [showContributorsModal, setShowContributorsModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const opacity    = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(-20)).current;

  const pendingTasks = repoTasks.filter((t) => !t.completed);
  const overdueTasks = pendingTasks.filter((t) => new Date(t.dueDate).getTime() < Date.now());
  const upcomingTasks = pendingTasks
    .filter((t) => new Date(t.dueDate).getTime() >= Date.now())
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  const nearestTask = upcomingTasks[0];

  const handleOpenGitHub = () => {
    const url = repo.htmlUrl || `https://github.com/${repo.fullName || repo.name}`;
    Linking.openURL(url).catch((err) => {
      console.warn('Could not open GitHub URL:', err);
      Alert.alert('Không thể mở liên kết', url);
    });
  };

  const handleCopyClone = () => {
    const cloneUrl = repo.cloneUrl || `https://github.com/${repo.fullName || repo.name}.git`;
    Clipboard.setString(cloneUrl);
    Alert.alert('📋 Đã sao chép Clone URL', `${cloneUrl}\n\nĐã sao chép vào bộ nhớ tạm.`);
  };

  const handleOpenContributors = async () => {
    setShowContributorsModal(true);
    if (contributors.length > 0) return;
    setLoadingContributors(true);
    try {
      const list = await githubService.getRepoContributors(repo.owner, repo.name, 15);
      setContributors(list);
    } catch (e) {
      console.warn('Could not fetch repo contributors:', e);
    } finally {
      setLoadingContributors(false);
    }
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue:         1,
        duration:        340,
        delay:           index * 60,
        useNativeDriver: true,
      }),
      Animated.spring(translateX, {
        toValue:         0,
        delay:           index * 60,
        tension:         80,
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
          transform: [{ translateX }],
        },
      ]}
    >
      {/* Glowing top border line */}
      <View style={[styles.topAccent, { backgroundColor: repo.languageColor || colors.indigo[400] }]} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.nameRow}>
          {/* Lock icon for private repos */}
          {repo.isPrivate ? (
            <View style={styles.privateBadge}>
              <Text style={styles.privateBadgeText}>🔒 Private</Text>
            </View>
          ) : (
            <View style={styles.publicBadge}>
              <Text style={styles.publicBadgeText}>Public</Text>
            </View>
          )}

          {/* Quick Language indicator in header */}
          {repo.language ? (
            <View
              style={[
                styles.langHeaderPill,
                {
                  backgroundColor: colors.bg.cardElevated,
                  borderColor: colors.border.subtle,
                },
              ]}
            >
              <View style={[styles.langDot, { backgroundColor: repo.languageColor }]} aria-hidden="true" />
              <Text style={[styles.langHeaderText, { color: colors.text.secondary, fontSize: scaleFont(11) }]}>
                {repo.language}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Action buttons: Direct GitHub link + Context Menu trigger */}
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[
              styles.openGhBtn,
              {
                backgroundColor: colors.bg.cardElevated,
                borderColor: colors.border.default,
              },
            ]}
            onPress={handleOpenGitHub}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Mở repository ${repo.name} trên GitHub`}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Text style={[styles.openGhBtnText, { color: colors.indigo[400], fontSize: scaleFont(11) }]}>
              GitHub ↗
            </Text>
          </TouchableOpacity>

          {/* Context menu button — fully accessible */}
          <TouchableOpacity
            style={[
              styles.menuButton,
              {
                backgroundColor: colors.bg.cardElevated,
                borderColor: colors.border.default,
              },
            ]}
            onPress={() => onMenuPress?.(repo)}
            activeOpacity={0.65}
            accessibilityRole="button"
            accessibilityLabel={`Options for ${repo.name}`}
            accessibilityHint="Opens repository actions menu"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.menuDots, { color: colors.text.secondary }]} aria-hidden="true">⋮</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tappable Repo Name + Description -> Opens Full Repository Inspection Modal */}
      <TouchableOpacity
        onPress={() => setShowDetailsModal(true)}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel={`Xem chi tiết repository ${repo.name}`}
        accessibilityHint="Chạm để xem thông số kỹ thuật, mô tả đầy đủ, tasks và liên kết GitHub"
        style={styles.repoTitleTouch}
      >
        <View style={styles.repoTitleWrap}>
          <Text
            style={[
              styles.repoName,
              { color: colors.text.primary, fontSize: scaleFont(17) },
            ]}
            numberOfLines={1}
          >
            {repo.name}
          </Text>
          <View
            style={[
              styles.inspectBadge,
              {
                backgroundColor: `${colors.indigo[500]}18`,
                borderColor: `${colors.indigo[500]}45`,
              },
            ]}
          >
            <Text style={[styles.inspectBadgeText, { color: colors.indigo[400], fontSize: scaleFont(11) }]}>
              Xem Repo ↗
            </Text>
          </View>
        </View>

        <Text
          style={[
            styles.description,
            { color: colors.text.secondary, fontSize: scaleFont(13) },
          ]}
          numberOfLines={2}
        >
          {repo.description}
        </Text>
      </TouchableOpacity>

      {/* Topics */}
      {repo.topics?.length > 0 && (
        <View style={styles.topicsRow}>
          {repo.topics.slice(0, 3).map((topic) => (
            <View
              key={topic}
              style={[
                styles.topicChip,
                {
                  backgroundColor: `${colors.indigo[500]}15`,
                  borderColor: `${colors.indigo[500]}35`,
                },
              ]}
            >
              <Text
                style={[
                  styles.topicText,
                  { color: colors.indigo[400], fontSize: scaleFont(10) },
                ]}
              >
                {topic}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Stats row */}
      <View style={styles.statsRow}>
        {/* Language */}
        <View style={styles.statItem}>
          <View style={[styles.langDot, { backgroundColor: repo.languageColor }]} aria-hidden="true" />
          <Text style={[styles.statText, { color: colors.text.secondary, fontSize: scaleFont(12) }]}>
            {repo.language}
          </Text>
        </View>

        {/* Stars */}
        <View style={styles.statItem} accessible={true} accessibilityLabel={`${repo.stars} stars`}>
          <Text style={[styles.statIcon, { color: colors.amber[400] }]} aria-hidden="true">★</Text>
          <Text style={[styles.statText, { color: colors.text.secondary, fontSize: scaleFont(12) }]}>
            {repo.stars}
          </Text>
        </View>

        {/* Forks */}
        <View style={styles.statItem} accessible={true} accessibilityLabel={`${repo.forks} forks`}>
          <Text style={[styles.statIcon, { color: colors.sky[400] }]} aria-hidden="true">⑂</Text>
          <Text style={[styles.statText, { color: colors.text.secondary, fontSize: scaleFont(12) }]}>
            {repo.forks}
          </Text>
        </View>

        <View style={styles.spacer} />

        {/* Updated */}
        <Text style={[styles.updatedText, { color: colors.text.muted, fontSize: scaleFont(11) }]}>
          {relativeTime(repo.lastUpdated)}
        </Text>
      </View>

      {/* Branch + task badges */}
      <View style={styles.badgeRow}>
        {/* Branch */}
        <View
          style={[
            styles.branchBadge,
            {
              backgroundColor: colors.bg.cardElevated,
              borderColor: colors.border.default,
            },
          ]}
        >
          <Text style={[styles.branchIcon, { color: colors.text.muted }]} aria-hidden="true">⎇</Text>
          <Text style={[styles.branchText, { color: colors.text.secondary }]}>{repo.branch || 'main'}</Text>
        </View>

        <View style={styles.spacer} />

        {/* Real Tasks badge */}
        {pendingTasks.length > 0 && (
          <View style={[styles.taskBadge, overdueTasks.length > 0 && styles.taskBadgeOverdue]}>
            <Text style={[styles.taskBadgeText, overdueTasks.length > 0 && styles.taskBadgeTextOverdue]}>
              {pendingTasks.length} task{pendingTasks.length !== 1 ? 's' : ''}
              {overdueTasks.length > 0 ? ` (${overdueTasks.length} late)` : ''}
            </Text>
          </View>
        )}

        {/* Issues badge */}
        {repo.openIssues > 0 && (
          <View style={styles.issueBadge}>
            <Text style={styles.issueBadgeText}>
              {repo.openIssues} issue{repo.openIssues !== 1 ? 's' : ''}
            </Text>
          </View>
        )}

        {/* PRs badge */}
        {repo.openPRs > 0 && (
          <View style={styles.prBadge}>
            <Text style={styles.prBadgeText}>
              {repo.openPRs} PR{repo.openPRs !== 1 ? 's' : ''}
            </Text>
          </View>
        )}

        {/* 👥 Contributors Badge */}
        <TouchableOpacity
          style={[
            styles.contributorsBadge,
            {
              backgroundColor: colors.bg.cardElevated,
              borderColor: colors.border.default,
            },
          ]}
          onPress={handleOpenContributors}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`View contributors for ${repo.name}`}
        >
          <Text style={[styles.contributorsIcon, { color: colors.cyan[400] }]}>👥</Text>
          <Text style={[styles.contributorsText, { color: colors.text.secondary, fontSize: scaleFont(10) }]}>
            Contributors
          </Text>
        </TouchableOpacity>
      </View>

      {/* Repository Task & Deadline Banner */}
      <View
        style={[
          styles.repoTaskRow,
          {
            backgroundColor: colors.bg.cardElevated,
            borderColor: colors.border.subtle,
          },
        ]}
      >
        <View style={styles.repoTaskInfo}>
          <Text style={styles.repoTaskIcon} aria-hidden="true">
            {overdueTasks.length > 0 ? '⚠️' : '⏱️'}
          </Text>
          {overdueTasks.length > 0 ? (
            <Text style={[styles.repoTaskOverdue, { fontSize: scaleFont(11) }]}>
              Deadline: {formatDueDate(overdueTasks[0].dueDate)}
            </Text>
          ) : nearestTask ? (
            <Text style={[styles.repoTaskUpcoming, { color: colors.text.secondary, fontSize: scaleFont(12) }]}>
              Deadline: <Text style={[styles.deadlineHighlight, { color: colors.indigo[400] }]}>{formatDueDate(nearestTask.dueDate)}</Text>
            </Text>
          ) : (
            <Text style={[styles.repoTaskEmpty, { color: colors.text.muted, fontSize: scaleFont(11) }]}>
              No active deadline
            </Text>
          )}
        </View>

        {onAddTask && (
          <TouchableOpacity
            style={[
              styles.addRepoTaskBtn,
              {
                backgroundColor: `${colors.indigo[500]}20`,
                borderColor: `${colors.indigo[500]}45`,
              },
            ]}
            onPress={() => onAddTask(repo.name)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Add task for ${repo.name}`}
          >
            <Text style={[styles.addRepoTaskText, { color: colors.indigo[400] }]}>+ Task</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Repository Detail & Inspection Modal ────────────────────────────── */}
      <Modal
        visible={showDetailsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowDetailsModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[
              styles.detailModalSheet,
              {
                backgroundColor: colors.bg.card,
                borderColor: colors.border.strong,
              },
            ]}
          >
            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: colors.border.subtle }]}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <Text style={[styles.modalTitle, { color: colors.text.primary, fontSize: scaleFont(18) }]} numberOfLines={1}>
                    {repo.name}
                  </Text>
                  {repo.isPrivate ? (
                    <View style={styles.privateBadge}>
                      <Text style={styles.privateBadgeText}>🔒 Private</Text>
                    </View>
                  ) : (
                    <View style={styles.publicBadge}>
                      <Text style={styles.publicBadgeText}>Public</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.modalSub, { color: colors.text.muted, fontSize: scaleFont(12) }]}>
                  {repo.fullName || `${repo.owner}/${repo.name}`}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowDetailsModal(false)}
                style={[
                  styles.modalCloseBtn,
                  { backgroundColor: colors.bg.cardElevated, borderColor: colors.border.default },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Đóng chi tiết repository"
              >
                <Text style={[styles.modalCloseText, { color: colors.text.secondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 480 }}>
              {/* Quick Actions Toolbar */}
              <View style={styles.detailActionGrid}>
                <TouchableOpacity
                  style={[styles.primaryActionBtn, { backgroundColor: colors.indigo[500] }]}
                  onPress={handleOpenGitHub}
                  activeOpacity={0.75}
                >
                  <Text style={styles.primaryActionIcon}>🌐</Text>
                  <Text style={styles.primaryActionText}>Mở trên GitHub ↗</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.secondaryActionBtn, { backgroundColor: colors.bg.cardElevated, borderColor: colors.border.default }]}
                  onPress={handleCopyClone}
                  activeOpacity={0.7}
                >
                  <Text style={styles.secondaryActionIcon}>📋</Text>
                  <Text style={[styles.secondaryActionText, { color: colors.text.primary }]}>Sao chép Clone URL</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.secondaryActionBtn, { backgroundColor: colors.bg.cardElevated, borderColor: colors.border.default }]}
                  onPress={() => {
                    setShowDetailsModal(false);
                    onAddTask?.(repo.name);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.secondaryActionIcon}>➕</Text>
                  <Text style={[styles.secondaryActionText, { color: colors.text.primary }]}>Gán Task Mới</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.secondaryActionBtn, { backgroundColor: colors.bg.cardElevated, borderColor: colors.border.default }]}
                  onPress={() => {
                    handleOpenContributors();
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.secondaryActionIcon}>👥</Text>
                  <Text style={[styles.secondaryActionText, { color: colors.text.primary }]}>Contributors</Text>
                </TouchableOpacity>
              </View>

              {/* Description */}
              <View style={[styles.detailSection, { backgroundColor: colors.bg.cardElevated, borderColor: colors.border.subtle }]}>
                <Text style={[styles.detailSectionTitle, { color: colors.text.muted, fontSize: scaleFont(11) }]}>
                  MÔ TẢ REPOSITORY
                </Text>
                <Text style={[styles.detailBodyText, { color: colors.text.primary, fontSize: scaleFont(13) }]}>
                  {repo.description || 'Không có mô tả cho repository này.'}
                </Text>
              </View>

              {/* Topics */}
              {repo.topics?.length > 0 && (
                <View style={[styles.detailSection, { backgroundColor: colors.bg.cardElevated, borderColor: colors.border.subtle }]}>
                  <Text style={[styles.detailSectionTitle, { color: colors.text.muted, fontSize: scaleFont(11) }]}>
                    TOPICS & THẺ
                  </Text>
                  <View style={styles.topicsRow}>
                    {repo.topics.map((t) => (
                      <View key={t} style={[styles.topicChip, { backgroundColor: `${colors.indigo[500]}18`, borderColor: `${colors.indigo[500]}40` }]}>
                        <Text style={[styles.topicText, { color: colors.indigo[400] }]}>#{t}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Metrics Grid */}
              <View style={styles.metricsGrid}>
                <View style={[styles.metricCard, { backgroundColor: colors.bg.cardElevated, borderColor: colors.border.subtle }]}>
                  <Text style={[styles.metricLabel, { color: colors.text.muted }]}>Ngôn ngữ</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <View style={[styles.langDot, { backgroundColor: repo.languageColor }]} />
                    <Text style={[styles.metricValue, { color: colors.text.primary }]}>{repo.language}</Text>
                  </View>
                </View>

                <View style={[styles.metricCard, { backgroundColor: colors.bg.cardElevated, borderColor: colors.border.subtle }]}>
                  <Text style={[styles.metricLabel, { color: colors.text.muted }]}>Branch mặc định</Text>
                  <Text style={[styles.metricValue, { color: colors.text.primary, marginTop: 4 }]}>⎇ {repo.branch || 'main'}</Text>
                </View>

                <View style={[styles.metricCard, { backgroundColor: colors.bg.cardElevated, borderColor: colors.border.subtle }]}>
                  <Text style={[styles.metricLabel, { color: colors.text.muted }]}>Stars</Text>
                  <Text style={[styles.metricValue, { color: colors.amber[400], marginTop: 4 }]}>★ {repo.stars}</Text>
                </View>

                <View style={[styles.metricCard, { backgroundColor: colors.bg.cardElevated, borderColor: colors.border.subtle }]}>
                  <Text style={[styles.metricLabel, { color: colors.text.muted }]}>Forks</Text>
                  <Text style={[styles.metricValue, { color: colors.sky[400], marginTop: 4 }]}>⑂ {repo.forks}</Text>
                </View>

                <View style={[styles.metricCard, { backgroundColor: colors.bg.cardElevated, borderColor: colors.border.subtle }]}>
                  <Text style={[styles.metricLabel, { color: colors.text.muted }]}>Open Issues</Text>
                  <Text style={[styles.metricValue, { color: colors.rose[400], marginTop: 4 }]}>⚠️ {repo.openIssues}</Text>
                </View>

                <View style={[styles.metricCard, { backgroundColor: colors.bg.cardElevated, borderColor: colors.border.subtle }]}>
                  <Text style={[styles.metricLabel, { color: colors.text.muted }]}>Cập nhật lần cuối</Text>
                  <Text style={[styles.metricValue, { color: colors.text.secondary, marginTop: 4, fontSize: 11 }]}>
                    {relativeTime(repo.lastUpdated)}
                  </Text>
                </View>
              </View>

              {/* Tasks for this repo */}
              <View style={[styles.detailSection, { backgroundColor: colors.bg.cardElevated, borderColor: colors.border.subtle }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={[styles.detailSectionTitle, { color: colors.text.muted, fontSize: scaleFont(11), marginBottom: 0 }]}>
                    TASKS ĐÃ GÁN ({repoTasks.length})
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setShowDetailsModal(false);
                      onAddTask?.(repo.name);
                    }}
                    style={[styles.smallAddBtn, { backgroundColor: `${colors.indigo[500]}20`, borderColor: colors.indigo[500] }]}
                  >
                    <Text style={{ color: colors.indigo[400], fontSize: 10, fontWeight: '700' }}>+ Thêm Task</Text>
                  </TouchableOpacity>
                </View>

                {repoTasks.length === 0 ? (
                  <Text style={{ color: colors.text.muted, fontSize: 12, fontStyle: 'italic' }}>
                    Chưa có task nào được gán cho repository này.
                  </Text>
                ) : (
                  repoTasks.map((t) => (
                    <View
                      key={t.id}
                      style={[styles.repoTaskItem, { backgroundColor: colors.bg.card, borderColor: colors.border.subtle }]}
                    >
                      <Text style={{ color: t.completed ? colors.emerald[400] : colors.amber[400], fontSize: 12, fontWeight: '700' }}>
                        {t.completed ? '✓' : '⏱'}
                      </Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.repoTaskTitle, { color: colors.text.primary, textDecorationLine: t.completed ? 'line-through' : 'none' }]}>
                          {t.title}
                        </Text>
                        <Text style={{ color: colors.text.muted, fontSize: 10 }}>
                          Deadline: {formatDueDate(t.dueDate)} • {t.priority?.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Contributors Popover Modal ────────────────────────────── */}
      <Modal
        visible={showContributorsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowContributorsModal(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowContributorsModal(false)}
        >
          <View
            style={[
              styles.modalSheet,
              {
                backgroundColor: colors.bg.secondary,
                borderColor: colors.border.strong,
              },
            ]}
          >
            <View style={[styles.modalHeader, { borderBottomColor: colors.border.subtle }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: colors.text.primary, fontSize: scaleFont(16) }]}>
                  👥 Contributors — {repo.name}
                </Text>
                <Text style={[styles.modalSub, { color: colors.text.muted, fontSize: scaleFont(12) }]}>
                  Top contributors and commit metrics from GitHub
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowContributorsModal(false)}
                style={[
                  styles.modalCloseBtn,
                  { backgroundColor: colors.bg.cardElevated, borderColor: colors.border.default },
                ]}
              >
                <Text style={[styles.modalCloseText, { color: colors.text.secondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            {loadingContributors ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="small" color={colors.indigo[400]} />
                <Text style={[styles.modalLoadingText, { color: colors.text.muted, fontSize: scaleFont(12) }]}>
                  Fetching contributors from GitHub…
                </Text>
              </View>
            ) : contributors.length === 0 ? (
              <View style={styles.modalEmpty}>
                <Text style={[styles.modalEmptyText, { color: colors.text.muted, fontSize: scaleFont(13) }]}>
                  No public contributor records found for this repo.
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.contributorsList} showsVerticalScrollIndicator={false}>
                {contributors.map((c, i) => (
                  <View
                    key={c.id || c.login}
                    style={[
                      styles.contributorItem,
                      {
                        backgroundColor: colors.bg.card,
                        borderColor: colors.border.subtle,
                      },
                    ]}
                  >
                    <View style={styles.contributorRank}>
                      <Text style={[styles.rankText, { color: colors.text.muted, fontSize: scaleFont(11) }]}>
                        #{i + 1}
                      </Text>
                    </View>
                    {c.avatarUrl ? (
                      <Image source={{ uri: c.avatarUrl }} style={styles.contributorAvatar} />
                    ) : (
                      <View style={[styles.contributorAvatarFallback, { backgroundColor: `${colors.indigo[500]}25` }]}>
                        <Text style={{ color: colors.indigo[400], fontWeight: '700' }}>
                          {(c.login || 'U').slice(0, 2).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={styles.contributorInfo}>
                      <Text style={[styles.contributorLogin, { color: colors.text.primary, fontSize: scaleFont(13) }]}>
                        {c.login}
                      </Text>
                      <Text style={[styles.contributorCommits, { color: colors.emerald[400], fontSize: scaleFont(11) }]}>
                        ★ {c.contributions} contribution{c.contributions !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bg.card,
    borderRadius:    Radius.xl,
    borderWidth:     1,
    borderColor:     Colors.border.subtle,
    padding:         Spacing.cardPadding,
    marginBottom:    Spacing.md,
    gap:             Spacing.sm,
    overflow:        'hidden',
  },
  topAccent: {
    position:        'absolute',
    top:             0,
    left:            Spacing.xl,
    right:           Spacing.xl,
    height:          1,
    backgroundColor: Colors.indigo[500],
    opacity:         0.4,
    borderRadius:    Radius.full,
  },
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.sm,
  },
  privateBadge: {
    backgroundColor:  `${Colors.amber[500]}18`,
    borderRadius:     Radius.sm,
    paddingHorizontal: 8,
    paddingVertical:   3,
    borderWidth:      1,
    borderColor:      `${Colors.amber[500]}40`,
  },
  privateBadgeText: {
    ...Typography.styles.label,
    color:    Colors.amber[400],
    fontSize: 10,
  },
  publicBadge: {
    backgroundColor:  `${Colors.emerald[500]}15`,
    borderRadius:     Radius.sm,
    paddingHorizontal: 8,
    paddingVertical:   3,
    borderWidth:      1,
    borderColor:      `${Colors.emerald[500]}40`,
  },
  publicBadgeText: {
    ...Typography.styles.label,
    color:    Colors.emerald[400],
    fontSize: 10,
  },
  menuButton: {
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
  repoName: {
    ...Typography.styles.headingMd,
    color:      Colors.text.primary,
    marginTop:  Spacing[0.5],
  },
  description: {
    ...Typography.styles.bodyMd,
    color: Colors.text.secondary,
  },
  topicsRow: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           Spacing.sm,
  },
  topicChip: {
    backgroundColor:  `${Colors.indigo[500]}15`,
    borderRadius:     Radius.full,
    paddingHorizontal: 9,
    paddingVertical:   3,
    borderWidth:      1,
    borderColor:      `${Colors.indigo[500]}35`,
  },
  topicText: {
    ...Typography.styles.label,
    color:    Colors.indigo[400],
    fontSize: 10,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           5,
  },
  langDot: {
    width:        9,
    height:       9,
    borderRadius: Radius.full,
  },
  statIcon: {
    color:    Colors.text.muted,
    fontSize: 12,
  },
  statText: {
    ...Typography.styles.bodySm,
    color: Colors.text.secondary,
    fontVariant: ['tabular-nums'],
  },
  spacer: { flex: 1 },
  updatedText: {
    ...Typography.styles.bodySm,
    color: Colors.text.muted,
    fontVariant: ['tabular-nums'],
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.sm,
    flexWrap:      'wrap',
  },
  branchBadge: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:              4,
    backgroundColor:  Colors.bg.cardElevated,
    borderRadius:     Radius.sm,
    paddingHorizontal: 8,
    paddingVertical:   4,
    borderWidth:      1,
    borderColor:      Colors.border.default,
  },
  branchIcon: {
    color:    Colors.text.muted,
    fontSize: 11,
  },
  branchText: {
    ...Typography.styles.monoSm,
    color: Colors.text.secondary,
  },
  taskBadge: {
    backgroundColor:  `${Colors.indigo[500]}15`,
    borderRadius:     Radius.sm,
    paddingHorizontal: 8,
    paddingVertical:   4,
    borderWidth:      1,
    borderColor:      `${Colors.indigo[500]}35`,
  },
  taskBadgeText: {
    ...Typography.styles.label,
    color:    Colors.indigo[400],
    fontSize: 10,
  },
  issueBadge: {
    backgroundColor:  `${Colors.amber[500]}15`,
    borderRadius:     Radius.sm,
    paddingHorizontal: 8,
    paddingVertical:   4,
    borderWidth:      1,
    borderColor:      `${Colors.amber[500]}35`,
  },
  issueBadgeText: {
    ...Typography.styles.label,
    color:    Colors.amber[400],
    fontSize: 10,
  },
  prBadge: {
    backgroundColor:  `${Colors.sky[500]}15`,
    borderRadius:     Radius.sm,
    paddingHorizontal: 8,
    paddingVertical:   4,
    borderWidth:      1,
    borderColor:      `${Colors.sky[500]}35`,
  },
  prBadgeText: {
    ...Typography.styles.label,
    color:    Colors.sky[400],
    fontSize: 10,
  },
  taskBadgeOverdue: {
    backgroundColor: `${Colors.rose[500]}20`,
    borderColor: `${Colors.rose[500]}50`,
  },
  taskBadgeTextOverdue: {
    color: Colors.rose[400],
  },
  repoTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bg.cardElevated,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    marginTop: 4,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  repoTaskInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  repoTaskIcon: {
    fontSize: 12,
  },
  repoTaskOverdue: {
    ...Typography.styles.monoSm,
    color: Colors.rose[400],
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    fontSize: 11,
  },
  repoTaskUpcoming: {
    ...Typography.styles.bodySm,
    color: Colors.text.secondary,
    fontVariant: ['tabular-nums'],
    fontSize: 12,
  },
  deadlineHighlight: {
    color: Colors.indigo[400],
    fontWeight: '700',
  },
  repoTaskEmpty: {
    ...Typography.styles.bodySm,
    color: Colors.text.muted,
    fontSize: 11,
  },
  addRepoTaskBtn: {
    backgroundColor: `${Colors.indigo[500]}20`,
    borderWidth: 1,
    borderColor: `${Colors.indigo[500]}45`,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  addRepoTaskText: {
    ...Typography.styles.monoSm,
    color: Colors.indigo[400],
    fontWeight: '700',
    fontSize: 11,
  },
  contributorsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
  },
  contributorsIcon: {
    fontSize: 10,
  },
  contributorsText: {
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.screenPadding,
  },
  modalSheet: {
    width: '100%',
    maxWidth: 460,
    maxHeight: '80%',
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.cardPadding,
    gap: Spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontWeight: '700',
  },
  modalSub: {
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalLoading: {
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modalLoadingText: {
    fontWeight: '500',
  },
  modalEmpty: {
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalEmptyText: {
    textAlign: 'center',
  },
  contributorsList: {
    maxHeight: 340,
  },
  contributorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: Spacing.xs,
    gap: Spacing.sm,
  },
  contributorRank: {
    width: 24,
    alignItems: 'center',
  },
  rankText: {
    fontWeight: '700',
  },
  contributorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  contributorAvatarFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contributorInfo: {
    flex: 1,
  },
  contributorLogin: {
    fontWeight: '600',
  },
  contributorCommits: {
    marginTop: 1,
    fontWeight: '500',
  },
  langHeaderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  langHeaderText: {
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  openGhBtn: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  openGhBtnText: {
    fontWeight: '700',
  },
  repoTitleTouch: {
    gap: Spacing.xs,
    paddingVertical: 2,
  },
  repoTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  inspectBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  inspectBadgeText: {
    fontWeight: '700',
  },
  detailModalSheet: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '88%',
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.cardPadding,
    gap: Spacing.md,
  },
  detailActionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.md,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Radius.md,
  },
  primaryActionIcon: {
    fontSize: 14,
  },
  primaryActionText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  secondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  secondaryActionIcon: {
    fontSize: 13,
  },
  secondaryActionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailSection: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  detailSectionTitle: {
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  detailBodyText: {
    lineHeight: 19,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.sm,
  },
  metricCard: {
    flexBasis: '31%',
    flexGrow: 1,
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: 10,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  smallAddBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  repoTaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: Radius.sm,
    borderWidth: 1,
    padding: 8,
    marginTop: 6,
  },
  repoTaskTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default RepoCard;
