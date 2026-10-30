import React, { useRef, useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, Animated, Pressable, Clipboard, Platform,
} from 'react-native';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { Radius, Spacing, Shadow } from '../constants/spacing';
import { useTheme } from '../context/ThemeContext';

/**
 * ContextMenu — Animated popover context menu.
 * Triggered by a [⋮] button, springs open with scale + opacity animation.
 * Actions: Clone URL | Checkout Branch | Delete Repo | (dismiss)
 *
 * Props:
 *   repo      — the repository object
 *   position  — { x, y, width, height } of the trigger button
 */

export const DEFAULT_MENU_ACTIONS = [
  {
    id:    'add_task',
    icon:  '＋',
    label: 'Add Repo Task',
    color: Colors.emerald[400],
    desc:  'Set deadline & task for repo',
  },
  {
    id:    'clone',
    icon:  '⎘',
    label: 'Clone URL',
    color: Colors.sky[400],
    desc:  'Copy HTTPS clone URL',
  },
  {
    id:    'checkout',
    icon:  '⑂',
    label: 'Checkout Branch',
    color: Colors.cyan[400],
    desc:  'Switch working branch',
  },
  {
    id:    'open',
    icon:  '↗',
    label: 'Open Details',
    color: Colors.indigo[400],
    desc:  'View repo metadata & issues',
  },
  {
    id:    'delete',
    icon:  '⊗',
    label: 'Delete Repository',
    color: Colors.rose[400],
    desc:  'Permanently remove repo',
    danger: true,
  },
];

export const OPEN_SOURCE_MENU_ACTIONS = [
  {
    id:    'star',
    icon:  '★',
    label: 'Star Repository',
    color: Colors.amber[400],
    desc:  'Star on GitHub via API',
  },
  {
    id:    'fork',
    icon:  '⑂',
    label: 'Fork Repository',
    color: Colors.cyan[400],
    desc:  'Create a personal fork',
  },
  {
    id:    'clone',
    icon:  '⎘',
    label: 'Copy Clone URL',
    color: Colors.sky[400],
    desc:  'Copy HTTPS clone link to clipboard',
  },
  {
    id:    'track',
    icon:  '📌',
    label: 'Track Repository',
    color: Colors.indigo[400],
    desc:  'Add to My Tracked Repos bookmark',
  },
];

const ContextMenu = ({ visible, onClose, onAction, repo, actions = DEFAULT_MENU_ACTIONS }) => {
  const { colors, isDark, scaleFont } = useTheme();
  const currentActions = actions || DEFAULT_MENU_ACTIONS;
  const scaleAnim   = useRef(new Animated.Value(0.75)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(-10)).current;

  const runOpenAnimation = useCallback(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue:         1,
        tension:         180,
        friction:        12,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue:         1,
        duration:        150,
        useNativeDriver: true,
      }),
      Animated.spring(translateYAnim, {
        toValue:         0,
        tension:         180,
        friction:        12,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const runCloseAnimation = useCallback((cb) => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue:         0.88,
        tension:         220,
        friction:        16,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue:         0,
        duration:        120,
        useNativeDriver: true,
      }),
    ]).start(cb);
  }, []);

  // Reset and open animation when visible changes
  React.useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0.78);
      opacityAnim.setValue(0);
      translateYAnim.setValue(-8);
      runOpenAnimation();
    }
  }, [visible]);

  const handleClose = useCallback(() => {
    runCloseAnimation(() => onClose?.());
  }, [onClose]);

  const handleAction = useCallback((actionId) => {
    runCloseAnimation(() => {
      onAction?.(actionId, repo);
      onClose?.();
    });
  }, [onAction, repo, onClose]);

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      {/* Accessible Backdrop */}
      <Pressable
        style={styles.backdrop}
        onPress={handleClose}
        accessibilityRole="button"
        accessibilityLabel="Close menu"
        accessibilityHint="Dismisses the repository actions menu"
      />

      {/* Menu panel — modal accessibility trapped */}
      <Animated.View
        accessibilityViewIsModal={true}
        accessibilityRole="menu"
        style={[
          styles.menuPanel,
          {
            backgroundColor: colors.bg.cardElevated,
            borderColor: colors.border.strong,
            opacity:   opacityAnim,
            transform: [
              { scale:      scaleAnim },
              { translateY: translateYAnim },
            ],
          },
        ]}
      >
        {/* Header */}
        <View style={styles.menuHeader}>
          <View style={[styles.menuDot, { backgroundColor: colors.indigo[500] }]} aria-hidden="true" />
          <Text style={[styles.menuTitle, { color: colors.text.primary, fontSize: scaleFont(14) }]} numberOfLines={1}>
            {repo?.name ?? 'Repository'}
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border.subtle }]} />

        {/* Action items */}
        {currentActions.map((action, i) => (
          <React.Fragment key={action.id}>
            <TouchableOpacity
              style={[styles.actionRow, action.danger && styles.actionRowDanger]}
              onPress={() => handleAction(action.id)}
              activeOpacity={0.65}
              accessibilityRole="button"
              accessibilityLabel={action.label}
              accessibilityHint={action.desc}
            >
              <View style={[styles.actionIcon, { backgroundColor: `${action.color}20` }]}>
                <Text style={[styles.actionIconText, { color: action.color }]} aria-hidden="true">
                  {action.icon}
                </Text>
              </View>
              <View style={styles.actionContent}>
                <Text
                  style={[
                    styles.actionLabel,
                    {
                      color: action.danger ? colors.rose[400] : colors.text.primary,
                      fontSize: scaleFont(14),
                    },
                  ]}
                >
                  {action.label}
                </Text>
                <Text style={[styles.actionDesc, { color: colors.text.muted, fontSize: scaleFont(11) }]}>
                  {action.desc}
                </Text>
              </View>
              <Text style={[styles.actionArrow, { color: colors.text.muted }]} aria-hidden="true">›</Text>
            </TouchableOpacity>
            {i < currentActions.length - 1 && (
              <View style={[styles.actionDivider, { backgroundColor: colors.border.subtle }]} />
            )}
          </React.Fragment>
        ))}

        {/* Cancel */}
        <View style={[styles.divider, { backgroundColor: colors.border.subtle }]} />
        <TouchableOpacity
          style={styles.cancelRow}
          onPress={handleClose}
          activeOpacity={0.65}
          accessibilityRole="button"
          accessibilityLabel="Cancel"
          accessibilityHint="Dismisses without taking action"
        >
          <Text style={[styles.cancelText, { color: colors.text.secondary, fontSize: scaleFont(13) }]}>Cancel</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  menuPanel: {
    position:        'absolute',
    bottom:          Platform.OS === 'ios' ? 100 : 80,
    left:            Spacing.xl,
    right:           Spacing.xl,
    backgroundColor: Colors.bg.cardElevated,
    borderRadius:    Radius.xl,
    borderWidth:     1,
    borderColor:     Colors.border.default,
    overflow:        'hidden',
    ...Shadow.xl,
    shadowColor:     '#000',
    // Extra glow on top of the card shadow
    ...Platform.select({
      ios: {
        shadowColor:   Colors.glow.indigo,
        shadowRadius:  20,
        shadowOpacity: 0.6,
      },
    }),
  },
  menuHeader: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:              Spacing.sm,
    paddingHorizontal: Spacing.cardPadding,
    paddingVertical:   Spacing.md,
  },
  menuDot: {
    width:           8,
    height:          8,
    borderRadius:    Radius.full,
    backgroundColor: Colors.indigo[500],
  },
  menuTitle: {
    ...Typography.styles.headingSm,
    color: Colors.text.primary,
  },
  divider: {
    height:          1,
    backgroundColor: Colors.border.subtle,
    marginHorizontal: Spacing.cardPadding,
  },
  actionRow: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:              Spacing.md,
    paddingHorizontal: Spacing.cardPadding,
    paddingVertical:   Spacing.md,
  },
  actionRowDanger: {
    // slight rose tint on hover not possible statically, handled via activeOpacity
  },
  actionIcon: {
    width:           36,
    height:          36,
    borderRadius:    Radius.md,
    alignItems:      'center',
    justifyContent:  'center',
  },
  actionIconText: {
    fontSize:   17,
    lineHeight: 20,
  },
  actionContent: {
    flex: 1,
    gap:  2,
  },
  actionLabel: {
    ...Typography.styles.headingSm,
    color: Colors.text.primary,
  },
  actionDesc: {
    ...Typography.styles.bodySm,
    color: Colors.text.muted,
  },
  actionArrow: {
    color:    Colors.text.dimmed,
    fontSize: 20,
  },
  actionDivider: {
    height:           1,
    backgroundColor:  Colors.border.subtle,
    marginHorizontal: Spacing.cardPadding + 52,
  },
  cancelRow: {
    alignItems:    'center',
    paddingVertical: Spacing.md,
  },
  cancelText: {
    ...Typography.styles.headingSm,
    color: Colors.text.secondary,
  },
});

export default ContextMenu;
