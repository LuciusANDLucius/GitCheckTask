import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Switch, Animated, Image,
  Alert, TextInput, Modal, Pressable, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { Radius, Spacing, Shadow } from '../constants/spacing';
import { useGitHub } from '../context/GitHubContext';
import { useTheme } from '../context/ThemeContext';

const SettingRow = ({
  icon,
  label,
  desc,
  value,
  onValueChange,
  type = 'toggle',
  onPress,
  accent,
}) => {
  const { colors, scaleFont } = useTheme();
  const activeAccent = accent || colors.indigo[400];

  return (
    <TouchableOpacity
      style={styles.settingRow}
      onPress={type === 'nav' ? onPress : (type === 'toggle' ? () => onValueChange?.(!value) : undefined)}
      activeOpacity={type === 'nav' || type === 'toggle' ? 0.65 : 1}
      accessibilityRole={type === 'toggle' ? 'switch' : (type === 'nav' ? 'button' : 'text')}
      accessibilityState={type === 'toggle' ? { checked: value } : undefined}
      accessibilityLabel={label}
      accessibilityHint={desc}
    >
      <View style={[styles.settingIcon, { backgroundColor: `${activeAccent}18` }]} aria-hidden="true">
        <Text style={[styles.settingIconText, { color: activeAccent }]}>{icon}</Text>
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingLabel, { color: colors.text.primary, fontSize: scaleFont(15) }]}>
          {label}
        </Text>
        {desc ? (
          <Text style={[styles.settingDesc, { color: colors.text.muted, fontSize: scaleFont(12) }]}>
            {desc}
          </Text>
        ) : null}
      </View>
      {type === 'toggle' && (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: colors.border.strong, true: `${colors.indigo[500]}90` }}
          thumbColor={value ? colors.indigo[400] : colors.text.muted}
          ios_backgroundColor={colors.border.strong}
          accessibilityLabel={label}
        />
      )}
      {type === 'nav' && (
        <Text style={[styles.navArrow, { color: colors.text.dimmed }]} aria-hidden="true">›</Text>
      )}
      {type === 'value' && (
        <Text style={[styles.settingValue, { color: colors.text.secondary, fontSize: scaleFont(13) }]}>
          {value}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const SectionCard = ({ title, children }) => {
  const { colors, scaleFont } = useTheme();

  return (
    <View style={styles.sectionCardWrap}>
      <Text style={[styles.sectionCardTitle, { color: colors.text.muted, fontSize: scaleFont(11) }]}>
        {title}
      </Text>
      <View
        style={[
          styles.sectionCardBody,
          {
            backgroundColor: colors.bg.card,
            borderColor: colors.border.subtle,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
};

export default function SettingsScreen() {
  const { user, repos, tasks, token, isGuest, loginWithToken, signOut } = useGitHub();
  const {
    isDark,
    toggleTheme,
    fontSizeScale,
    setFontSizeScale,
    scaleFont,
    colors,
  } = useTheme();

  const [notifications, setNotifications] = React.useState(true);
  const [autoFetch, setAutoFetch]         = React.useState(true);
  const [compactMode, setCompactMode]     = React.useState(false);

  // PAT Token Modal State
  const [tokenModalVisible, setTokenModalVisible] = React.useState(false);
  const [inputToken, setInputToken] = React.useState(token || '');

  const totalStars = repos.reduce((s, r) => s + (r.stars || 0), 0);
  const pendingTasksCount = tasks.filter((t) => !t.completed).length;

  const displayUser = user || {
    displayName: isGuest ? 'Khách (Guest Mode)' : 'Developer',
    username: isGuest ? 'guest' : 'user',
    email: isGuest ? 'guest@devrepo.local' : 'Not configured',
    avatarInitials: isGuest ? 'KM' : 'GH',
  };

  const handleSaveToken = async () => {
    try {
      const trimmed = inputToken.trim();
      if (!trimmed) {
        await signOut();
        setTokenModalVisible(false);
        Alert.alert('Đã đăng xuất', 'Trở về màn hình đăng nhập.');
        return;
      }
      await loginWithToken(trimmed);
      setTokenModalVisible(false);
      Alert.alert(
        'Đã Lưu Token GitHub',
        'Kết nối tài khoản thành công! Toàn bộ kho mã nguồn và sự kiện đã được đồng bộ.'
      );
    } catch (e) {
      Alert.alert('Lỗi Xác Thực', e.message);
    }
  };

  const handleClearToken = async () => {
    setInputToken('');
    await signOut();
    setTokenModalVisible(false);
    Alert.alert('Đã đăng xuất', 'Trở về màn hình đăng nhập.');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg.secondary }]} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Page header ──────────────────────────────────── */}
        <View style={styles.pageHeader}>
          <Text style={[styles.pageTitle, { color: colors.text.primary, fontSize: scaleFont(26) }]}>
            Cài Đặt & Giao Diện
          </Text>
          <Text style={[styles.pageSub, { color: colors.text.muted, fontSize: scaleFont(14) }]}>
            Tùy biến sáng/tối, cỡ chữ và quản lý tài khoản GitHub
          </Text>
        </View>

        {/* ── Profile card ─────────────────────────────────── */}
        <View
          style={[
            styles.profileCard,
            {
              backgroundColor: colors.bg.card,
              borderColor: colors.border.subtle,
            },
          ]}
        >
          {/* Avatar */}
          <View style={styles.profileAvatarWrap}>
            <View style={[styles.profileAvatar, { borderColor: colors.indigo[400] }]}>
              {displayUser.avatarUrl || (displayUser.username && displayUser.username !== 'guest') ? (
                <Image
                  source={{ uri: displayUser.avatarUrl || `https://github.com/${displayUser.username}.png` }}
                  style={styles.profileAvatarImage}
                  resizeMode="cover"
                />
              ) : (
                <Text style={[styles.profileAvatarText, { color: colors.indigo[400] }]}>
                  {displayUser.avatarInitials}
                </Text>
              )}
            </View>
            {/* GitHub connected badge */}
            <View style={[styles.ghBadge, (token || (displayUser.username && displayUser.username !== 'guest')) && { borderColor: colors.emerald[500] }]}>
              <Text style={[styles.ghBadgeText, (token || (displayUser.username && displayUser.username !== 'guest')) && { color: colors.emerald[400] }]}>⎇</Text>
            </View>
          </View>

          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text.primary, fontSize: scaleFont(20) }]}>
              {displayUser.displayName}
            </Text>
            <Text style={[styles.profileUsername, { color: colors.indigo[400], fontSize: scaleFont(14) }]}>
              @{displayUser.username}
            </Text>
            {displayUser.bio ? (
              <Text style={[styles.profileBioText, { color: colors.text.muted, fontSize: scaleFont(13) }]} numberOfLines={2}>
                "{displayUser.bio}"
              </Text>
            ) : null}
            <Text style={[styles.profileEmail, { color: colors.text.dimmed, fontSize: scaleFont(12) }]}>
              {displayUser.email}
            </Text>
          </View>

          {/* Profile stats */}
          <View style={[styles.profileStats, { borderTopColor: colors.border.subtle }]}>
            <View style={styles.profileStat}>
              <Text style={[styles.profileStatValue, { color: colors.indigo[400], fontSize: scaleFont(18) }]}>
                {displayUser.publicRepos ?? repos.length}
              </Text>
              <Text style={[styles.profileStatLabel, { color: colors.text.muted, fontSize: scaleFont(11) }]}>Repos</Text>
            </View>
            <View style={[styles.profileStatDivider, { backgroundColor: colors.border.subtle }]} />
            <View style={styles.profileStat}>
              <Text style={[styles.profileStatValue, { color: colors.purple[400], fontSize: scaleFont(18) }]}>
                {displayUser.followers ?? 0}
              </Text>
              <Text style={[styles.profileStatLabel, { color: colors.text.muted, fontSize: scaleFont(11) }]}>Followers</Text>
            </View>
            <View style={[styles.profileStatDivider, { backgroundColor: colors.border.subtle }]} />
            <View style={styles.profileStat}>
              <Text style={[styles.profileStatValue, { color: colors.amber[400], fontSize: scaleFont(18) }]}>
                {displayUser.following ?? 0}
              </Text>
              <Text style={[styles.profileStatLabel, { color: colors.text.muted, fontSize: scaleFont(11) }]}>Following</Text>
            </View>
            <View style={[styles.profileStatDivider, { backgroundColor: colors.border.subtle }]} />
            <View style={styles.profileStat}>
              <Text style={[styles.profileStatValue, { color: colors.emerald[400], fontSize: scaleFont(18) }]}>
                {pendingTasksCount}
              </Text>
              <Text style={[styles.profileStatLabel, { color: colors.text.muted, fontSize: scaleFont(11) }]}>Tasks</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.editProfileBtn, { backgroundColor: colors.bg.cardElevated, borderColor: colors.border.default }]}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="GitHub Token settings"
            onPress={() => setTokenModalVisible(true)}
          >
            <Text style={[styles.editProfileBtnText, { color: colors.indigo[400], fontSize: scaleFont(13) }]}>
              {token ? '⚙ Quản Lý Token PAT (Đang Kết Nối)' : '+ Kết Nối Token PAT (Repo Riêng Tư)'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── 1. GIAO DIỆN & CỠ CHỮ (APPEARANCE & DISPLAY) ── */}
        <SectionCard title="GIAO DIỆN & CỠ CHỮ">
          {/* Light / Dark Mode Toggle */}
          <SettingRow
            icon={isDark ? '🌙' : '☀️'}
            label={isDark ? 'Chế Độ Tối (Dark Mode)' : 'Chế Độ Sáng (Light Mode)'}
            desc="Tương phản tuyệt đối, màu chữ rực rỡ & siêu nét"
            type="toggle"
            value={!isDark}
            onValueChange={() => toggleTheme()}
            accent={isDark ? colors.indigo[400] : colors.amber[400]}
          />

          <View style={[styles.rowDivider, { backgroundColor: colors.border.subtle }]} />

          {/* Font Size Selector */}
          <View style={styles.fontSizeWrap}>
            <View style={styles.fontSizeTop}>
              <View style={[styles.settingIcon, { backgroundColor: `${colors.teal[400]}18` }]}>
                <Text style={[styles.settingIconText, { color: colors.teal[400] }]}>🔠</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingLabel, { color: colors.text.primary, fontSize: scaleFont(15) }]}>
                  Cỡ Chữ Toàn Bộ Ứng Dụng
                </Text>
                <Text style={[styles.settingDesc, { color: colors.text.muted, fontSize: scaleFont(12) }]}>
                  Điều chỉnh kích thước chữ để dễ đọc nhất
                </Text>
              </View>
            </View>

            {/* Buttons: Chuẩn / Lớn / Rất Lớn */}
            <View style={styles.fontSizeBtns}>
              {[
                { id: 'normal', label: 'A Chuẩn (100%)' },
                { id: 'large',  label: 'A+ Lớn (115%)' },
                { id: 'xlarge', label: 'A++ Rất Lớn (130%)' },
              ].map((opt) => {
                const isActive = fontSizeScale === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[
                      styles.fontBtn,
                      {
                        backgroundColor: isActive ? colors.indigo[500] : colors.bg.cardElevated,
                        borderColor: isActive ? colors.indigo[400] : colors.border.default,
                      },
                    ]}
                    onPress={() => setFontSizeScale(opt.id)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`Chọn cỡ chữ ${opt.label}`}
                  >
                    <Text
                      style={[
                        styles.fontBtnText,
                        {
                          color: isActive ? '#ffffff' : colors.text.secondary,
                          fontWeight: isActive ? '800' : '600',
                          fontSize: scaleFont(12),
                        },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Live Text Sample */}
            <View
              style={[
                styles.fontPreviewBox,
                {
                  backgroundColor: colors.bg.cardElevated,
                  borderColor: colors.border.default,
                },
              ]}
            >
              <Text style={[styles.fontPreviewBadge, { color: colors.emerald[400] }]}>
                ✓ MẪU HIỂN THỊ (CỠ CHỮ: {fontSizeScale === 'xlarge' ? '130%' : fontSizeScale === 'large' ? '115%' : '100%'}):
              </Text>
              <Text style={[styles.fontPreviewTitle, { color: colors.text.primary, fontSize: scaleFont(16) }]}>
                DevRepo · Quản lý Repository & Nhiệm vụ
              </Text>
              <Text style={[styles.fontPreviewBody, { color: colors.text.secondary, fontSize: scaleFont(13) }]}>
                Độ tương phản cao chuẩn WCAG AAA. Màu sắc nổi bật, rõ ràng và không mỏi mắt!
              </Text>
            </View>
          </View>
        </SectionCard>

        {/* ── 2. GitHub Connection ─────────────────────────── */}
        <SectionCard title="KẾT NỐI GITHUB">
          <SettingRow
            icon="⎇"
            label="Tài Khoản Đang Đồng Bộ"
            desc={`@${displayUser.username} (${token ? 'Xác thực PAT (Toàn quyền)' : 'Đăng nhập 1-Chạm (Công khai)'})`}
            type="nav"
            accent={token ? colors.emerald[400] : colors.sky[400]}
            onPress={() => setTokenModalVisible(true)}
          />
          <View style={[styles.rowDivider, { backgroundColor: colors.border.subtle }]} />
          <SettingRow
            icon="⊛"
            label="Personal Access Token (PAT)"
            desc={token ? 'Đang hoạt động (Repo riêng tư & thao tác Star)' : 'Chưa thiết lập (Chỉ dùng dữ liệu công khai)'}
            type="nav"
            accent={colors.amber[400]}
            onPress={() => setTokenModalVisible(true)}
          />
          <View style={[styles.rowDivider, { backgroundColor: colors.border.subtle }]} />
          <SettingRow
            icon="↺"
            label="Tự Động Đồng Bộ Dữ Liệu"
            desc="Cập nhật hoạt động GitHub mỗi 5 phút"
            value={autoFetch}
            onValueChange={setAutoFetch}
            accent={colors.cyan[400]}
          />
        </SectionCard>

        {/* ── 3. Tùy Chọn & Thông Báo ──────────────────────── */}
        <SectionCard title="TÙY CHỌN ỨNG DỤNG">
          <SettingRow
            icon="🔔"
            label="Thông Báo Nhiệm Vụ"
            desc="Nhắc việc đến hạn và quá hạn hôm nay"
            value={notifications}
            onValueChange={setNotifications}
            accent={colors.indigo[400]}
          />
          <View style={[styles.rowDivider, { backgroundColor: colors.border.subtle }]} />
          <SettingRow
            icon="◫"
            label="Chế Độ Xem Gọn (Compact)"
            desc="Thu gọn khoảng cách danh sách repository"
            value={compactMode}
            onValueChange={setCompactMode}
            accent={colors.purple[400]}
          />
        </SectionCard>

        {/* ── 4. Tài Khoản & Đăng Xuất ─────────────────────── */}
        <SectionCard title="TÀI KHOẢN">
          <SettingRow
            icon="◉"
            label="Phiên Bản Ứng Dụng"
            type="value"
            value="DevRepo v2.1.0 (Production)"
            accent={colors.text.muted}
          />
          <View style={[styles.rowDivider, { backgroundColor: colors.border.subtle }]} />
          <SettingRow
            icon="⊗"
            label="Đăng Xuất Tài Khoản"
            desc="Xóa phiên đăng nhập và trở về màn hình kết nối"
            type="nav"
            accent={colors.rose[400]}
            onPress={async () => {
              await signOut();
              Alert.alert('Đã Đăng Xuất', 'Bạn đã đăng xuất khỏi ứng dụng.');
            }}
          />
        </SectionCard>

        <View style={{ height: Spacing['3xl'] }} />
      </ScrollView>

      {/* ── Personal Access Token (PAT) Modal ─────────────── */}
      <Modal
        visible={tokenModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTokenModalVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setTokenModalVisible(false)}
          accessibilityRole="button"
          accessibilityLabel="Close token dialog"
        />

        <View
          style={[
            styles.tokenModalPanel,
            {
              backgroundColor: colors.bg.cardElevated,
              borderColor: colors.border.default,
            },
          ]}
          accessibilityViewIsModal={true}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text.primary, fontSize: scaleFont(18) }]}>
              Quản Lý Token GitHub
            </Text>
            <TouchableOpacity
              onPress={() => setTokenModalVisible(false)}
              accessibilityRole="button"
              accessibilityLabel="Close"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={[styles.modalCloseText, { color: colors.text.muted }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.modalSub, { color: colors.text.muted, fontSize: scaleFont(13) }]}>
            Dán mã GitHub Personal Access Token (PAT) nếu bạn muốn đồng bộ cả các repository riêng tư (private) và thực hiện các thao tác ghi.
          </Text>

          <View
            style={[
              styles.tokenInputWrap,
              {
                backgroundColor: colors.bg.primary,
                borderColor: colors.border.default,
              },
            ]}
          >
            <TextInput
              style={[
                styles.tokenTextInput,
                { color: colors.text.primary, fontSize: scaleFont(14) },
              ]}
              placeholder="ghp_... hoặc github_pat_..."
              placeholderTextColor={colors.text.dimmed}
              value={inputToken}
              onChangeText={setInputToken}
              autoCapitalize="none"
              autoCorrect={false}
              selectionColor={colors.indigo[400]}
              accessibilityLabel="GitHub Personal Access Token input"
            />
          </View>

          <View style={styles.tokenModalActions}>
            {token ? (
              <TouchableOpacity
                style={[styles.tokenClearBtn, { borderColor: colors.rose[400] }]}
                onPress={handleClearToken}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Disconnect token"
              >
                <Text style={[styles.tokenClearBtnText, { color: colors.rose[400] }]}>Hủy Kết Nối</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={[styles.tokenSaveBtn, { backgroundColor: colors.indigo[500] }]}
              onPress={handleSaveToken}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Save and connect token"
            >
              <Text style={styles.tokenSaveBtnText}>Lưu & Kết Nối</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop:        Spacing.xl,
    gap:               Spacing.xl,
  },
  pageHeader: {
    gap: Spacing[0.5],
  },
  pageTitle: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  pageSub: {
    fontWeight: '500',
    marginTop: 2,
  },
  profileCard: {
    borderRadius:    Radius.xl,
    borderWidth:     1,
    padding:         Spacing.xl,
    alignItems:      'center',
    gap:             Spacing.md,
    overflow:        'hidden',
  },
  profileAvatarWrap: {
    position: 'relative',
  },
  profileAvatar: {
    width:           72,
    height:          72,
    borderRadius:    Radius.full,
    borderWidth:     2.5,
    alignItems:      'center',
    justifyContent:  'center',
    overflow:        'hidden',
  },
  profileAvatarImage: {
    width:  '100%',
    height: '100%',
    borderRadius: Radius.full,
  },
  profileAvatarText: {
    fontWeight: '800',
    fontSize: 22,
  },
  ghBadge: {
    position:        'absolute',
    bottom:          0,
    right:           0,
    width:           22,
    height:          22,
    borderRadius:    Radius.full,
    backgroundColor: '#0c0f1d',
    borderWidth:     1.5,
    alignItems:      'center',
    justifyContent:  'center',
  },
  ghBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  profileInfo: {
    alignItems: 'center',
    gap:        3,
  },
  profileName: {
    fontWeight: '800',
  },
  profileUsername: {
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  profileBioText: {
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: Spacing.sm,
    marginTop: 2,
    marginBottom: 2,
  },
  profileEmail: {
    fontWeight: '500',
  },
  profileStats: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             Spacing.xl,
    paddingVertical: Spacing.md,
    borderTopWidth:  1,
    width:           '100%',
    justifyContent:  'center',
  },
  profileStat: {
    alignItems: 'center',
    gap:        2,
    minWidth:   54,
  },
  profileStatValue: {
    fontWeight: '800',
  },
  profileStatLabel: {
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  profileStatDivider: {
    width:  1,
    height: 24,
  },
  editProfileBtn: {
    width:           '100%',
    paddingVertical: 12,
    borderRadius:    Radius.md,
    borderWidth:     1,
    alignItems:      'center',
    justifyContent:  'center',
  },
  editProfileBtnText: {
    fontWeight: '700',
  },
  sectionCardWrap: {
    gap: Spacing.xs,
  },
  sectionCardTitle: {
    fontWeight:       '700',
    letterSpacing:    0.8,
    paddingHorizontal: 4,
    textTransform:    'uppercase',
  },
  sectionCardBody: {
    borderRadius:     Radius.xl,
    borderWidth:      1,
    paddingHorizontal: Spacing.xl,
    paddingVertical:   Spacing.xs,
  },
  settingRow: {
    flexDirection:  'row',
    alignItems:     'center',
    paddingVertical: Spacing.md,
    gap:            Spacing.md,
  },
  settingIcon: {
    width:          38,
    height:         38,
    borderRadius:   Radius.md,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  settingIconText: {
    fontSize: 18,
  },
  settingContent: {
    flex: 1,
    gap:  2,
  },
  settingLabel: {
    fontWeight: '700',
  },
  settingDesc: {
    lineHeight: 16,
    fontWeight: '500',
  },
  settingValue: {
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  navArrow: {
    fontSize: 22,
    fontWeight: '700',
  },
  rowDivider: {
    height: 1,
    marginHorizontal: -Spacing.xl,
  },
  fontSizeWrap: {
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  fontSizeTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  fontSizeBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  fontBtn: {
    flex: 1,
    paddingVertical: 11,
    paddingHorizontal: 6,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fontBtnText: {
    textAlign: 'center',
  },
  fontPreviewBox: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
    gap: 4,
  },
  fontPreviewBadge: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  fontPreviewTitle: {
    fontWeight: '800',
    marginTop: 2,
  },
  fontPreviewBody: {
    lineHeight: 20,
    fontWeight: '500',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  tokenModalPanel: {
    position:        'absolute',
    top:             '25%',
    left:            Spacing.xl,
    right:           Spacing.xl,
    maxWidth:        480,
    alignSelf:       'center',
    borderRadius:    Radius.xl,
    borderWidth:     1,
    padding:         Spacing.xl,
    gap:             Spacing.md,
    ...Shadow.xl,
  },
  modalHeader: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontWeight: '800',
  },
  modalCloseText: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalSub: {
    lineHeight: 18,
  },
  tokenInputWrap: {
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
  },
  tokenTextInput: {
    fontFamily: 'monospace',
  },
  tokenModalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    justifyContent: 'flex-end',
    marginTop: Spacing.sm,
  },
  tokenClearBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenClearBtnText: {
    fontWeight: '700',
    fontSize: 13,
  },
  tokenSaveBtn: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: 12,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenSaveBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },
});
