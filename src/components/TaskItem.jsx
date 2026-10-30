import React, { useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
} from 'react-native';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { Radius, Spacing } from '../constants/spacing';
import { useTheme } from '../context/ThemeContext';
import StatusPill from './StatusPill';

/**
 * TaskItem — Task list item with animated checkbox.
 * Features:
 *   • Spring-animated checkbox toggle
 *   • Priority StatusPill
 *   • Animated strikethrough on complete
 *   • Repository tag
 *   • Due date indicator
 *   • Supports Dynamic Theme (Light / Dark) & Font Scaling
 */

const TaskItem = ({ task, onToggle, onDelete }) => {
  const { colors, isDark, scaleFont } = useTheme();
  const checkScale = useRef(new Animated.Value(task.completed ? 1 : 0)).current;
  const rowOpacity = useRef(new Animated.Value(task.completed ? 0.52 : 1)).current;
  const strikeScale = useRef(new Animated.Value(task.completed ? 1 : 0)).current;

  const handleToggle = useCallback(() => {
    const toCompleted = !task.completed;

    Animated.parallel([
      Animated.spring(checkScale, {
        toValue:         toCompleted ? 1 : 0,
        tension:         160,
        friction:        9,
        useNativeDriver: true,
      }),
      Animated.timing(rowOpacity, {
        toValue:         toCompleted ? 0.52 : 1,
        duration:        160,
        useNativeDriver: true,
      }),
      Animated.timing(strikeScale, {
        toValue:         toCompleted ? 1 : 0,
        duration:        160,
        useNativeDriver: true,
      }),
    ]).start();

    onToggle?.(task.id);
  }, [task.completed, task.id, checkScale, rowOpacity, strikeScale, onToggle]);

  const dueDateObj = task.dueDate ? new Date(task.dueDate) : null;
  const isOverdue = !task.completed && dueDateObj && dueDateObj.getTime() < Date.now();

  const dueDateLabel = (() => {
    if (!dueDateObj || isNaN(dueDateObj.getTime())) return 'No deadline';
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfToday = startOfToday + 24 * 60 * 60 * 1000 - 1;
    const dueTime = dueDateObj.getTime();

    if (isOverdue) {
      const diffHours = Math.floor((Date.now() - dueTime) / (1000 * 60 * 60));
      return diffHours < 24 ? `${Math.max(1, diffHours)}h overdue` : `${Math.floor(diffHours / 24)}d overdue`;
    }
    if (dueTime >= startOfToday && dueTime <= endOfToday) {
      return 'Today';
    }
    const diffHours = Math.floor((dueTime - Date.now()) / (1000 * 60 * 60));
    if (diffHours < 24) return `Due in ${Math.max(1, diffHours)}h`;
    const days = Math.floor(diffHours / 24);
    return `Due in ${days}d`;
  })();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.bg.card,
          borderColor: colors.border.subtle,
          opacity: rowOpacity,
        },
      ]}
    >
      {/* Checkbox — fully accessible */}
      <TouchableOpacity
        onPress={handleToggle}
        style={styles.checkboxHitArea}
        activeOpacity={0.7}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: task.completed }}
        accessibilityLabel={`Mark "${task.title}" as ${task.completed ? 'incomplete' : 'completed'}`}
        accessibilityHint="Toggles task status"
      >
        <View
          style={[
            styles.checkbox,
            {
              backgroundColor: task.completed ? colors.indigo[500] : colors.bg.cardElevated,
              borderColor: task.completed ? colors.indigo[500] : colors.border.strong,
            },
          ]}
        >
          <Animated.Text
            style={[
              styles.checkmark,
              { transform: [{ scale: checkScale }] },
            ]}
          >
            ✓
          </Animated.Text>
        </View>
      </TouchableOpacity>

      {/* Content */}
      <View style={styles.content}>
        {/* Title with compositor-only strikethrough animation */}
        <View style={styles.titleRow}>
          <View style={styles.titleContainer}>
            <Text
              style={[
                styles.title,
                {
                  color: task.completed ? colors.text.muted : colors.text.primary,
                  fontSize: scaleFont(14),
                },
              ]}
              numberOfLines={1}
            >
              {task.title}
            </Text>
            {/* Strikethrough line — compositor-only scaleX & opacity */}
            <Animated.View
              pointerEvents="none"
              style={[
                styles.strikethrough,
                {
                  backgroundColor: colors.text.muted,
                  opacity: strikeScale,
                  transform: [
                    {
                      scaleX: strikeScale,
                    },
                  ],
                },
              ]}
            />
          </View>
        </View>

        {/* Meta row */}
        <View style={styles.metaRow}>
          <StatusPill priority={task.priority} size="sm" />

          <View
            style={[
              styles.repoChip,
              {
                backgroundColor: colors.bg.cardElevated,
                borderColor: colors.border.subtle,
              },
            ]}
          >
            <Text style={[styles.repoIcon, { color: colors.text.muted }]} aria-hidden="true">⎇</Text>
            <Text
              style={[
                styles.repoText,
                { color: colors.text.secondary, fontSize: scaleFont(11) },
              ]}
            >
              {task.repo}
            </Text>
          </View>

          <View style={styles.spacer} />

          <View
            style={[
              styles.dueChip,
              {
                backgroundColor: isOverdue ? `${colors.rose[500]}20` : colors.bg.cardElevated,
                borderColor: isOverdue ? `${colors.rose[500]}60` : colors.border.subtle,
              },
            ]}
          >
            <Text
              style={[
                styles.dueText,
                {
                  color: isOverdue ? colors.rose[400] : colors.text.secondary,
                  fontSize: scaleFont(11),
                  fontWeight: isOverdue ? '700' : '500',
                },
              ]}
            >
              {dueDateLabel}
            </Text>
          </View>

          {onDelete && (
            <TouchableOpacity
              onPress={() => onDelete(task.id)}
              style={styles.deleteButton}
              activeOpacity={0.6}
              accessibilityRole="button"
              accessibilityLabel={`Delete task ${task.title}`}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={[styles.deleteIcon, { color: colors.rose[400] }]} aria-hidden="true">✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection:   'row',
    alignItems:      'flex-start',
    backgroundColor: Colors.bg.card,
    borderRadius:    Radius.md,
    borderWidth:     1,
    borderColor:     Colors.border.subtle,
    padding:         Spacing.cardPadding,
    marginBottom:    Spacing.sm,
    gap:             Spacing.md,
  },
  checkboxHitArea: {
    padding: 2,
    marginTop: 1,
  },
  checkbox: {
    width:          22,
    height:         22,
    borderRadius:   Radius.xs + 1,
    borderWidth:    1.5,
    borderColor:    Colors.border.strong,
    backgroundColor: Colors.bg.cardElevated,
    alignItems:     'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.indigo[500],
    borderColor:     Colors.indigo[500],
  },
  checkmark: {
    color:      '#fff',
    fontSize:   13,
    fontWeight: '700',
    lineHeight: 16,
  },
  content: {
    flex: 1,
    gap:  Spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems:    'center',
  },
  titleContainer: {
    flex:     1,
    position: 'relative',
  },
  title: {
    ...Typography.styles.headingSm,
    color: Colors.text.primary,
  },
  titleDone: {
    color: Colors.text.muted,
  },
  strikethrough: {
    position:        'absolute',
    top:             '50%',
    left:            0,
    right:           0,
    height:          1.5,
    backgroundColor: Colors.text.muted,
    borderRadius:    1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.sm,
    flexWrap:      'wrap',
  },
  repoChip: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:              3,
    backgroundColor:  Colors.bg.cardElevated,
    borderRadius:     Radius.sm,
    paddingHorizontal: 7,
    paddingVertical:   2,
    borderWidth:      1,
    borderColor:      Colors.border.subtle,
  },
  repoIcon: {
    color:    Colors.text.muted,
    fontSize: 10,
  },
  repoText: {
    ...Typography.styles.monoSm,
    color: Colors.text.muted,
  },
  spacer: { flex: 1 },
  dueChip: {
    backgroundColor:  Colors.bg.cardElevated,
    borderRadius:     Radius.sm,
    paddingHorizontal: 7,
    paddingVertical:   2,
    borderWidth:      1,
    borderColor:      Colors.border.subtle,
  },
  dueChipOverdue: {
    backgroundColor: `${Colors.rose[500]}15`,
    borderColor:     `${Colors.rose[500]}50`,
  },
  dueText: {
    ...Typography.styles.bodySm,
    color: Colors.text.muted,
    fontVariant: ['tabular-nums'],
  },
  dueTextOverdue: {
    color: Colors.rose[400],
  },
  deleteButton: {
    marginLeft: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: Radius.sm,
    backgroundColor: `${Colors.rose[500]}10`,
  },
  deleteIcon: {
    color: Colors.text.muted,
    fontSize: 12,
    fontWeight: '700',
  },
});

export default TaskItem;
