import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { Radius, Spacing } from '../constants/spacing';
import { useGitHub } from '../context/GitHubContext';
import { useTheme } from '../context/ThemeContext';

const PRIORITIES = [
  { key: 'critical', label: 'Critical', color: Colors.rose[500], bg: Colors.rose[500] + '25' },
  { key: 'normal',   label: 'Normal',   color: Colors.amber[500], bg: Colors.amber[500] + '25' },
  { key: 'low',      label: 'Low',      color: Colors.emerald[500], bg: Colors.emerald[500] + '25' },
];

const DEADLINE_PRESETS = [
  { key: 'today',     label: 'Today',     getHours: () => 6 },
  { key: 'tomorrow',  label: 'Tomorrow',  getHours: () => 24 },
  { key: 'in_3_days', label: 'In 3 Days', getHours: () => 72 },
  { key: 'in_1_week', label: 'In 1 Week', getHours: () => 168 },
];

export default function CreateTaskModal({ visible, onClose, defaultRepo = null }) {
  const { repos, trackedRepos, addTask } = useGitHub();
  const { colors, isDark, scaleFont } = useTheme();

  const [title, setTitle] = useState('');
  const [selectedRepo, setSelectedRepo] = useState('General');
  const [customRepo, setCustomRepo] = useState('');
  const [showCustomRepo, setShowCustomRepo] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState('normal');
  const [selectedDeadline, setSelectedDeadline] = useState('today');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableRepos = useMemo(() => {
    const list = ['General'];
    if (Array.isArray(repos)) {
      repos.forEach((r) => {
        if (r && r.name && !list.includes(r.name)) {
          list.push(r.name);
        }
      });
    }
    if (Array.isArray(trackedRepos)) {
      trackedRepos.forEach((r) => {
        if (r && r.name && !list.includes(r.name)) {
          list.push(r.name);
        }
      });
    }
    return list;
  }, [repos, trackedRepos]);

  useEffect(() => {
    if (visible) {
      if (defaultRepo) {
        setSelectedRepo(defaultRepo);
        setShowCustomRepo(false);
      } else {
        setSelectedRepo('General');
      }
      setTitle('');
      setCustomRepo('');
      setSelectedPriority('normal');
      setSelectedDeadline('today');
    }
  }, [visible, defaultRepo]);

  const handleCreate = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      Alert.alert('Task Title Required', 'Please enter a title for this task.');
      return;
    }

    const finalRepo = showCustomRepo && customRepo.trim()
      ? customRepo.trim()
      : selectedRepo;

    setIsSubmitting(true);
    try {
      const preset = DEADLINE_PRESETS.find((p) => p.key === selectedDeadline);
      const hoursToAdd = preset ? preset.getHours() : 24;
      const dueDate = new Date(Date.now() + hoursToAdd * 60 * 60 * 1000);

      await addTask({
        title: trimmedTitle,
        repo: finalRepo || 'General',
        priority: selectedPriority,
        dueDate: dueDate.toISOString(),
      });

      onClose();
    } catch (err) {
      Alert.alert('Error', 'Failed to save task: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isWeb = Platform.OS === 'web';

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType={isWeb ? 'none' : 'slide'}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.bg.secondary,
              borderColor: colors.border.strong,
            },
          ]}
        >
          {!isWeb && <View style={[styles.handle, { backgroundColor: colors.border.strong }]} />}

          <View style={[styles.header, { borderBottomColor: colors.border.subtle }]}>
            <View>
              <Text style={[styles.sheetTitle, { color: colors.text.primary, fontSize: scaleFont(17) }]}>
                New Task & Deadline
              </Text>
              <Text style={[styles.sheetSub, { color: colors.text.muted, fontSize: scaleFont(12) }]}>
                Organize your developer workflow
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.closeBtn,
                {
                  backgroundColor: colors.bg.cardElevated,
                  borderColor: colors.border.default,
                },
              ]}
              activeOpacity={0.7}
            >
              <Text style={[styles.closeBtnText, { color: colors.text.secondary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.text.muted, fontSize: scaleFont(11) }]}>
                TASK TITLE *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.bg.cardElevated,
                    borderColor: colors.border.default,
                    color: colors.text.primary,
                    fontSize: scaleFont(14),
                  },
                ]}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Refactor API client & add unit tests"
                placeholderTextColor={colors.text.dimmed || '#64748b'}
                autoFocus={!isWeb}
              />
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: colors.text.muted, fontSize: scaleFont(11) }]}>
                  ASSOCIATED REPOSITORY
                </Text>
                <TouchableOpacity
                  onPress={() => setShowCustomRepo(!showCustomRepo)}
                >
                  <Text style={[styles.customRepoToggle, { color: colors.indigo[400], fontSize: scaleFont(11) }]}>
                    {showCustomRepo ? 'Pick from list' : '+ Custom Repo'}
                  </Text>
                </TouchableOpacity>
              </View>

              {showCustomRepo ? (
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.bg.cardElevated,
                      borderColor: colors.border.default,
                      color: colors.text.primary,
                      fontSize: scaleFont(14),
                    },
                  ]}
                  value={customRepo}
                  onChangeText={setCustomRepo}
                  placeholder="Enter repo name (e.g. my-app)"
                  placeholderTextColor={colors.text.dimmed || '#64748b'}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              ) : (
                <ScrollView
                  horizontal={true}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipsScroll}
                >
                  {availableRepos.map((repoName) => {
                    const isSelected = selectedRepo === repoName;
                    return (
                      <TouchableOpacity
                        key={repoName}
                        onPress={() => setSelectedRepo(repoName)}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: isSelected ? `${colors.indigo[500]}25` : colors.bg.cardElevated,
                            borderColor: isSelected ? colors.indigo[500] : colors.border.subtle,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            {
                              color: isSelected ? colors.indigo[400] : colors.text.secondary,
                              fontWeight: isSelected ? '700' : '500',
                              fontSize: scaleFont(12),
                            },
                          ]}
                        >
                          {repoName === 'General' ? 'General' : repoName}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.text.muted, fontSize: scaleFont(11) }]}>
                PRIORITY LEVEL
              </Text>
              <View style={styles.priorityRow}>
                {PRIORITIES.map((p) => {
                  const isSelected = selectedPriority === p.key;
                  return (
                    <TouchableOpacity
                      key={p.key}
                      onPress={() => setSelectedPriority(p.key)}
                      style={[
                        styles.priorityBtn,
                        isSelected
                          ? { borderColor: p.color, backgroundColor: p.bg }
                          : {
                              backgroundColor: colors.bg.cardElevated,
                              borderColor: colors.border.subtle,
                            },
                      ]}
                    >
                      <View
                        style={[styles.priorityDot, { backgroundColor: p.color }]}
                      />
                      <Text
                        style={[
                          styles.priorityBtnText,
                          {
                            color: isSelected ? '#ffffff' : colors.text.secondary,
                            fontWeight: isSelected ? '700' : '500',
                            fontSize: scaleFont(12),
                          },
                        ]}
                      >
                        {p.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.text.muted, fontSize: scaleFont(11) }]}>
                DUE DATE / DEADLINE
              </Text>
              <View style={styles.deadlineRow}>
                {DEADLINE_PRESETS.map((d) => {
                  const isSelected = selectedDeadline === d.key;
                  return (
                    <TouchableOpacity
                      key={d.key}
                      onPress={() => setSelectedDeadline(d.key)}
                      style={[
                        styles.deadlineChip,
                        isSelected
                          ? {
                              backgroundColor: colors.indigo[500],
                              borderColor: colors.indigo[400],
                            }
                          : {
                              backgroundColor: colors.bg.cardElevated,
                              borderColor: colors.border.subtle,
                            },
                      ]}
                    >
                      <Text
                        style={[
                          styles.deadlineChipText,
                          {
                            color: isSelected ? '#ffffff' : colors.text.secondary,
                            fontWeight: isSelected ? '700' : '500',
                            fontSize: scaleFont(12),
                          },
                        ]}
                      >
                        {d.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <TouchableOpacity
              onPress={handleCreate}
              disabled={isSubmitting}
              style={[
                styles.createBtn,
                { backgroundColor: colors.indigo[500] },
                isSubmitting && styles.btnDisabled,
              ]}
              activeOpacity={0.8}
            >
              <Text style={[styles.createBtnText, { fontSize: scaleFont(15) }]}>
                {isSubmitting ? 'Saving Task...' : 'Save Task'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: Platform.OS === 'web' ? 'center' : 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    padding: Platform.OS === 'web' ? 20 : 0,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: '#0f172a',
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 480 : undefined,
    borderRadius: Platform.OS === 'web' ? 16 : 0,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 20,
    overflow: 'hidden',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 9999,
    backgroundColor: '#475569',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  sheetTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
  sheetSub: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  closeBtnText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  fieldGroup: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: '#94a3b8',
    fontSize: 11,
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  customRepoToggle: {
    color: '#818cf8',
    fontSize: 11,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  chipsScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  chipSelected: {
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
    borderColor: '#6366f1',
  },
  chipText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#a5b4fc',
    fontWeight: '700',
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 10,
  },
  priorityBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  priorityBtnUnselected: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priorityBtnText: {
    fontSize: 13,
  },
  deadlineRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  deadlineChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  deadlineChipUnselected: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  deadlineChipSelected: {
    backgroundColor: '#6366f1',
    borderColor: '#818cf8',
  },
  deadlineChipText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '500',
  },
  deadlineChipTextSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  createBtn: {
    backgroundColor: '#4f46e5',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  createBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
});