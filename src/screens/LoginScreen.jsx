import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Linking,
} from 'react-native';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { Radius, Spacing } from '../constants/spacing';
import { useGitHub } from '../context/GitHubContext';
import { useTheme } from '../context/ThemeContext';

const QUICK_DEVS = [
  { label: 'octocat', icon: '🐙', name: 'GitHub Mascot' },
  { label: 'torvalds', icon: '🐧', name: 'Linus Torvalds' },
  { label: 'shadcn', icon: '🎨', name: 'shadcn/ui' },
  { label: 'facebook', icon: '⚛️', name: 'Meta Open Source' },
  { label: 'gaearon', icon: '⚡', name: 'Dan Abramov' },
];

export default function LoginScreen() {
  const { loginWithUsername, loginWithToken, loginAsGuest, loading, error } = useGitHub();
  const { isDark, toggleTheme, colors, scaleFont } = useTheme();

  // Mode: 'username' (1-click fast, no token) | 'token' (PAT for private repos)
  const [authMode, setAuthMode] = useState('username');
  const [usernameInput, setUsernameInput] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [connecting, setConnecting] = useState(false);

  // 1-Click login with username (no token required)
  const handleConnectUsername = async (chosenUser) => {
    const target = (chosenUser || usernameInput).trim();
    if (!target) {
      setLocalError('Vui lòng nhập GitHub username hoặc chọn 1 developer gợi ý');
      return;
    }
    setLocalError(null);
    setConnecting(true);
    try {
      await loginWithUsername(target);
    } catch (err) {
      setLocalError(err.message || 'Không thể kết nối tài khoản GitHub này. Vui lòng kiểm tra lại!');
    } finally {
      setConnecting(false);
    }
  };

  // Connect with token (for private repos)
  const handleConnectToken = async () => {
    const trimmed = tokenInput.trim();
    if (!trimmed) {
      setLocalError('Vui lòng nhập Personal Access Token (PAT) của bạn');
      return;
    }
    setLocalError(null);
    setConnecting(true);
    try {
      await loginWithToken(trimmed);
    } catch (err) {
      setLocalError(err.message || 'Xác thực token thất bại. Vui lòng kiểm tra lại token!');
    } finally {
      setConnecting(false);
    }
  };

  const handleGuest = async () => {
    setLocalError(null);
    await loginAsGuest();
  };

  const handleOpenGitHubTokenPage = () => {
    const url = 'https://github.com/settings/tokens/new?description=DevRepo+Task+Manager&scopes=repo,read:user';
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: colors.bg.primary }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Top bar with Theme Switcher */}
        <View style={styles.topThemeRow}>
          <TouchableOpacity
            style={[styles.themeToggleBtn, { backgroundColor: colors.bg.card, borderColor: colors.border.default }]}
            onPress={toggleTheme}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Chuyển sang giao diện ${isDark ? 'sáng' : 'tối'}`}
          >
            <Text style={[styles.themeToggleText, { color: colors.text.secondary }]}>
              {isDark ? '☀️ Chế độ Sáng' : '🌙 Chế độ Tối'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Brand header */}
        <View style={styles.brandContainer}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoIcon}>◈</Text>
          </View>
          <Text style={[styles.title, { color: colors.text.primary, fontSize: scaleFont(28) }]}>
            DevRepo
          </Text>
          <Text style={[styles.subtitle, { color: colors.text.muted, fontSize: scaleFont(13) }]}>
            Developer Task Hub & Real GitHub Manager
          </Text>
        </View>

        {/* Main Card */}
        <View style={[styles.card, { backgroundColor: colors.bg.card, borderColor: colors.border.subtle }]}>
          {/* Card Header */}
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Đăng Nhập GitHub</Text>
            <Text style={styles.cardSubtitle}>
              Đồng bộ ảnh đại diện, danh sách repository thực tế, sự kiện live và quản lý task.
            </Text>
          </View>

          {/* Mode Switcher Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabButton, authMode === 'username' && styles.tabButtonActive]}
              onPress={() => {
                setAuthMode('username');
                setLocalError(null);
              }}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityState={{ selected: authMode === 'username' }}
              accessibilityLabel="1-Click Login by Username without token"
            >
              <Text style={[styles.tabText, authMode === 'username' && styles.tabTextActive]}>
                ⚡ 1-Chạm (Không Cần Token)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, authMode === 'token' && styles.tabButtonActive]}
              onPress={() => {
                setAuthMode('token');
                setLocalError(null);
              }}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityState={{ selected: authMode === 'token' }}
              accessibilityLabel="Login with Personal Access Token"
            >
              <Text style={[styles.tabText, authMode === 'token' && styles.tabTextActive]}>
                🔑 Token PAT
              </Text>
            </TouchableOpacity>
          </View>

          {/* Error Banner */}
          {(localError || error) && (
            <View style={styles.errorBox}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorText}>{localError || error}</Text>
            </View>
          )}

          {/* ──────────────── TAB 1: 1-CLICK USERNAME (NO TOKEN) ──────────────── */}
          {authMode === 'username' ? (
            <View style={styles.sectionWrap}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>TÊN TÀI KHOẢN GITHUB (USERNAME)</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputPrefix}>@</Text>
                  <TextInput
                    style={[styles.input, styles.inputWithPrefix]}
                    value={usernameInput}
                    onChangeText={(val) => {
                      setUsernameInput(val);
                      if (localError) setLocalError(null);
                    }}
                    placeholder="ví dụ: octocat, torvalds, shadcn..."
                    placeholderTextColor="#64748b"
                    autoCapitalize="none"
                    autoCorrect={false}
                    accessibilityLabel="GitHub Username input"
                    returnKeyType="go"
                    onSubmitEditing={() => handleConnectUsername()}
                  />
                  {usernameInput.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setUsernameInput('')}
                      style={styles.clearBtn}
                      accessibilityRole="button"
                      accessibilityLabel="Clear username"
                    >
                      <Text style={styles.clearBtnText}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Quick 1-Click Suggestions */}
              <View style={styles.quickDevsWrap}>
                <Text style={styles.quickDevsTitle}>HOẶC CHẠM NHANH 1 DEVELOPER NỔI TIẾNG:</Text>
                <View style={styles.chipRow}>
                  {QUICK_DEVS.map((dev) => (
                    <TouchableOpacity
                      key={dev.label}
                      style={[
                        styles.chip,
                        usernameInput.toLowerCase() === dev.label.toLowerCase() && styles.chipActive,
                      ]}
                      onPress={() => {
                        setUsernameInput(dev.label);
                        handleConnectUsername(dev.label);
                      }}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={`Connect as ${dev.label}`}
                    >
                      <Text style={styles.chipIcon}>{dev.icon}</Text>
                      <Text
                        style={[
                          styles.chipText,
                          usernameInput.toLowerCase() === dev.label.toLowerCase() && styles.chipTextActive,
                        ]}
                      >
                        {dev.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* 1-Click Connect Button */}
              <TouchableOpacity
                onPress={() => handleConnectUsername()}
                disabled={connecting || loading}
                style={[styles.primaryBtn, (connecting || loading) && styles.btnDisabled]}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="1-Click Connect GitHub Account"
              >
                {connecting || loading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <View style={styles.btnRow}>
                    <Text style={styles.btnIcon}>⚡</Text>
                    <Text style={styles.primaryBtnText}>Đăng Nhập 1-Chạm Ngay (Không Cần Token)</Text>
                  </View>
                )}
              </TouchableOpacity>

              <View style={styles.featurePillsRow}>
                <Text style={styles.featurePill}>✓ Ảnh avatar thật</Text>
                <Text style={styles.featurePill}>✓ Followers & Following</Text>
                <Text style={styles.featurePill}>✓ Kho Repo thật</Text>
              </View>
            </View>
          ) : (
            /* ──────────────── TAB 2: PERSONAL ACCESS TOKEN (PAT) ──────────────── */
            <View style={styles.sectionWrap}>
              <TouchableOpacity
                style={styles.generateTokenBtn}
                onPress={handleOpenGitHubTokenPage}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Generate GitHub Token on GitHub"
              >
                <Text style={styles.generateTokenIcon}>↗</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.generateTokenTitle}>Tạo Token trên GitHub (Mở sẵn quyền)</Text>
                  <Text style={styles.generateTokenSub}>
                    Mở GitHub với các quyền repo và read:user được chọn sẵn
                  </Text>
                </View>
              </TouchableOpacity>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>DÁN GITHUB TOKEN (PAT)</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={tokenInput}
                    onChangeText={(val) => {
                      setTokenInput(val);
                      if (localError) setLocalError(null);
                    }}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    placeholderTextColor="#64748b"
                    secureTextEntry={!showToken}
                    autoCapitalize="none"
                    autoCorrect={false}
                    accessibilityLabel="GitHub Personal Access Token"
                  />
                  <TouchableOpacity
                    onPress={() => setShowToken(!showToken)}
                    style={styles.showBtn}
                    accessibilityRole="button"
                    accessibilityLabel={showToken ? 'Hide token' : 'Show token'}
                  >
                    <Text style={styles.showBtnText}>{showToken ? 'Ẩn' : 'Hiện'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleConnectToken}
                disabled={connecting || loading}
                style={[styles.primaryBtn, (connecting || loading) && styles.btnDisabled]}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Connect with GitHub Token"
              >
                {connecting || loading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.primaryBtnText}>Kết Nối Bằng GitHub Token</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>HOẶC</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Guest Mode */}
          <TouchableOpacity
            onPress={handleGuest}
            disabled={connecting || loading}
            style={styles.secondaryBtn}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Continue in Guest Mode"
          >
            <Text style={styles.secondaryBtnText}>Tiếp Tục Với Chế Độ Khách (Demo Mode)</Text>
          </TouchableOpacity>
        </View>

        {/* Security Note */}
        <View style={styles.securityNote}>
          <Text style={styles.securityNoteText}>
            🔒 An toàn tuyệt đối: Dữ liệu được lấy trực tiếp từ GitHub REST API và lưu cục bộ trên máy của bạn.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07070f',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    paddingVertical: 36,
  },
  topThemeRow: {
    width: '100%',
    maxWidth: 460,
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  themeToggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  themeToggleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(99, 102, 241, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoIcon: {
    fontSize: 26,
    color: '#818cf8',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 6,
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 24,
    gap: 18,
    width: '100%',
    maxWidth: 460,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 20,
  },
  cardHeader: {
    gap: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 18,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#090d16',
    borderRadius: 12,
    padding: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#4f46e5',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
  },
  tabTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  sectionWrap: {
    gap: 16,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderColor: 'rgba(244, 63, 94, 0.4)',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  errorIcon: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 13,
    color: '#fb7185',
    flex: 1,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  inputPrefix: {
    paddingLeft: 14,
    fontSize: 15,
    color: '#818cf8',
    fontWeight: '700',
  },
  inputWithPrefix: {
    paddingLeft: 6,
  },
  input: {
    flex: 1,
    color: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: 'monospace',
  },
  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  clearBtnText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '700',
  },
  showBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  showBtnText: {
    fontSize: 12,
    color: '#818cf8',
    fontWeight: '600',
  },
  quickDevsWrap: {
    gap: 8,
  },
  quickDevsTitle: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
    borderColor: '#6366f1',
  },
  chipIcon: {
    fontSize: 13,
  },
  chipText: {
    fontSize: 12,
    color: '#cbd5e1',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#a5b4fc',
    fontWeight: '700',
  },
  primaryBtn: {
    backgroundColor: '#4f46e5',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnIcon: {
    fontSize: 15,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '700',
  },
  featurePillsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 4,
  },
  featurePill: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '500',
  },
  generateTokenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.35)',
    padding: 12,
  },
  generateTokenIcon: {
    fontSize: 18,
    color: '#818cf8',
    fontWeight: '700',
  },
  generateTokenTitle: {
    fontSize: 13,
    color: '#a5b4fc',
    fontWeight: '700',
  },
  generateTokenSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#1e293b',
  },
  dividerText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  secondaryBtn: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: 14,
    color: '#cbd5e1',
    fontWeight: '600',
  },
  securityNote: {
    marginTop: 20,
    paddingHorizontal: 16,
    maxWidth: 460,
  },
  securityNoteText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
  },
});