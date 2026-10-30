# GitCheckTask 🚀
> **Developer Task & Repository Workflow Manager**  
> *Được xây dựng với trọng tâm tối ưu hóa trải nghiệm điều hướng đa nền tảng bằng **React Navigation v6** kết hợp React Native & Expo SDK 52.*

[![React Navigation](https://img.shields.io/badge/React_Navigation-v6.x-6b52ae?style=for-the-badge&logo=react&logoColor=white)](https://reactnavigation.org/)
[![React Native](https://img.shields.io/badge/React_Native-0.76.9-61dafb?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev/)
[![Expo SDK](https://img.shields.io/badge/Expo_SDK-52.0-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![GitHub API](https://img.shields.io/badge/GitHub_API-v3_RealTime-181717?style=for-the-badge&logo=github&logoColor=white)](https://docs.github.com/en/rest)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)](LICENSE)

---

## 🧭 Tâm điểm Kiến trúc: React Navigation v6 (Core Architecture)

Dự án **GitCheckTask** được thiết kế như một tiêu chuẩn mẫu (reference implementation) về việc tổ chức và khai thác tối đa sức mạnh của hệ sinh thái **React Navigation** trên nền tảng React Native đa nền tảng (Web, iOS, Android).

### 1. Mô hình Điều hướng Lồng ghép Đẳng cấp (Nested Navigation Architecture)

Toàn bộ ứng dụng sử dụng mô hình lồng ghép nhiều cấp độ giữa **Drawer Navigator** và **Bottom Tab Navigator**, kết hợp quản lý trạng thái xác thực (Authentication Flow) và các Modal tương tác chuyên sâu.

```
NavigationContainer (Dynamic Theme Token Provider)
│
├── 🔒 [Chưa đăng nhập] ──── LoginScreen (GitHub OAuth / PAT Access)
│
└── 🔓 [Đã xác thực] ────── Drawer.Navigator (createDrawerNavigator)
                            │
                            ├── Custom Drawer Content (DrawerContent.jsx)
                            │   ├── User Avatar & Profile Snapshot
                            │   ├── Navigation Menu List
                            │   ├── Recent Repositories Quick-list
                            │   └── Theme Switch (Light/Dark) & Logout
                            │
                            └── Main Scene: Tab.Navigator (createBottomTabNavigator)
                                │
                                ├── ⬡ Dashboard Screen (DashboardScreen.jsx)
                                │   ├── GreetingHeader ──(navigate)──> Repositories
                                │   ├── StatCards ───────(navigate)──> Repositories / Filter
                                │   └── ContributionGraph (GitHub Calendar)
                                │
                                ├── ⎇ Repositories Screen (RepositoriesScreen.jsx)
                                │   ├── RepoCard ───────(modal)────> RepositoryDetailModal
                                │   ├── ActionMenu ─────(context)──> ContextMenu Modal
                                │   └── Quick Task ─────(modal)────> CreateTaskModal
                                │
                                ├── 🌐 Explore OS Screen (ExploreScreen.jsx)
                                │   └── Global GitHub Repositories Discovery
                                │
                                └── ◈ Settings Screen (SettingsScreen.jsx)
                                    └── Theme Engine & Font Scaling Preferences
```

---

### 2. Các gói React Navigation sử dụng trong dự án

Dự án tích hợp đầy đủ các module chính thống của React Navigation:

| Thư viện | Phiên bản | Vai trò trong GitCheckTask |
| :--- | :--- | :--- |
| **`@react-navigation/native`** | `^6.1.17` | Lõi điều hướng, cung cấp `NavigationContainer`, `useNavigation`, `useRoute` và theme integration. |
| **`@react-navigation/drawer`** | `^6.6.15` | Tạo thanh trượt Sidebar với cử chỉ vuốt mượt mà (`swipeEdgeWidth: 50`), overlay bóng mờ tùy biến. |
| **`@react-navigation/bottom-tabs`** | `^6.5.20` | Tạo thanh Tab điều hướng chính phía dưới với custom component (`CustomTabBar`). |
| **`react-native-screens`** | `~4.4.0` | Tối ưu hóa bộ nhớ cấp native, giải phóng view khi không hiển thị trên màn hình. |
| **`react-native-safe-area-context`**| `4.12.0` | Đảm bảo an toàn trên tai thỏ (notch), dynamic island và thanh điều hướng ảo. |
| **`react-native-gesture-handler`** | `~2.20.2` | Xử lý cảm ứng và vuốt mở Drawer đạt 60fps mượt mà. |

---

### 3. Điểm nổi bật trong triển khai React Navigation

#### A. Custom Animated Tab Bar (`BottomTabNavigator.jsx`)
Thanh tab dưới đáy màn hình được xây dựng hoàn toàn tùy biến (Custom Tab Bar):
- **Spring-Scale Micro-Animations**: Mỗi khi chạm vào Tab, icon và nhãn sẽ co giãn theo vật lý lò xo bằng `Animated.spring`.
- **Active Indicator Glow Pill**: Đèn hiệu phát sáng màu Indigo tự động bám theo tab đang được kích hoạt.
- **Accessible ARIA Roles**: Tích hợp đầy đủ `accessibilityRole="tablist"`, `accessibilityRole="tab"`, và `accessibilityState={{ selected: isFocused }}` chuẩn trợ năng quốc tế.
- **Đồng bộ Theme Sáng/Tối 100%**: Sử dụng màu nền `colors.bg.cardElevated` và viền sắc nét, chuyển đổi mượt mà giữa Dark Mode và Light Mode.

```javascript
// Trích xuất từ src/navigation/BottomTabNavigator.jsx
const CustomTabBar = ({ state, navigation }) => {
  const { colors } = useTheme();
  return (
    <View style={styles.tabBarContainer}>
      <View style={[styles.tabBar, { backgroundColor: colors.bg.cardElevated, borderColor: colors.border.default }]}>
        {state.routes.map((route, index) => {
          const item = TAB_ITEMS[index];
          const focused = state.index === index;
          return (
            <TabButton
              key={route.key}
              item={item}
              isFocused={focused}
              onPress={() => { if (!focused) navigation.navigate(route.name); }}
            />
          );
        })}
      </View>
    </View>
  );
};
```

#### B. Custom Drawer Sidebar (`DrawerContent.jsx`)
Menu trượt bên trái với giao diện quản lý lập trình viên chuyên nghiệp:
- **Tích hợp Avatar & Thông số thời gian thực**: Hiển thị avatar GitHub thật, tổng số Repos, Followers, Following và Tasks chưa hoàn thành.
- **Cử chỉ vuốt Native**: Thiết lập `drawerType: 'slide'`, `swipeEdgeWidth: 50` hỗ trợ vuốt từ mép màn hình.
- **Điều hướng chéo (Cross-Navigation)**: Điều hướng linh hoạt giữa các màn hình sâu bằng `navigation.navigate(screen)` và tự động đóng menu `navigation.closeDrawer()`.

#### C. Điều hướng lập trình xuyên màn hình (Programmatic Cross-Navigation)
Người dùng có thể chuyển đổi màn hình trực tiếp từ bất kỳ thành phần con nào mà không bị giới hạn:
- Bấm vào huy hiệu `{user.publicRepos} repos ↗` trên **GreetingHeader** ➔ Lập tức mở màn hình **Repositories**.
- Bấm vào thẻ thống kê **Repos** trên **Dashboard** ➔ Điều hướng tức thời sang **Repositories**.
- Bấm vào nút **Explore Public Repos ›** trong trạng thái rỗng ➔ Tự động chuyển qua tab **Explore**.

---

## 🌟 Toàn bộ Tính năng Ứng dụng (Application Features)

### 1. 🐙 Tích hợp GitHub Real-Time
- **Đăng nhập thật**: Hỗ trợ GitHub Personal Access Token (PAT) và GitHub Device Flow OAuth (đăng nhập 1-chạm).
- **Profile & Live Stats**: Đồng bộ avatar, số repo, followers, following, location và bio.
- **Biểu đồ đóng góp (Contribution Calendar)**: Ma trận đóng góp công khai theo năm (2026, 2025,...) tương tự GitHub profile.
- **Kiểm tra Repository chuyên sâu (Repository Detail Modal)**:
  - 🌐 Mở trực tiếp trên GitHub bằng 1 chạm (`Linking.openURL`).
  - 📋 Sao chép Clone URL vào clipboard (`Clipboard.setString`).
  - 👥 Xem bảng xếp hạng **Contributors** và số lượt commit thực tế.
  - ➕ Gán công việc & deadline trực tiếp cho từng repo.

### 2. 📋 Quản lý Công việc & Deadline (Developer Task Manager)
- Liên kết chặt chẽ mỗi Task với một Repository cụ thể.
- Phân loại công việc trực quan:
  - ☀️ **Today**: Task hạn chót trong ngày hôm nay.
  - ⏱️ **Upcoming**: Công việc sắp tới hạn.
  - ⚠️ **Overdue**: Cảnh báo nổi bật việc đã quá hạn.
  - 📋 **All**: Toàn bộ danh sách công việc.
- Đánh dấu hoàn thành với animation gạch ngang (strikethrough), nhãn ưu tiên (Critical, Normal, Low).

### 3. 🎨 Đồng bộ giao diện Sáng / Tối (Light & Dark Mode)
- **Tách biệt màu sắc riêng cho nền sáng**: Khắc phục triệt để hiện tượng lệch màu nền, toàn bộ card và text đạt độ tương phản chuẩn **WCAG AAA**.
- **Web-optimized Shadow**: Nâng cấp toàn diện sang `boxShadow` chuẩn CSS trên trình duyệt, không gây cảnh báo deprecated.

---

## 📁 Cấu trúc Thư mục Dự án (Project Structure)

```
GitCheckTask/
├── App.jsx                       # Root Application component & Context Providers
├── app.json                      # Expo configuration
├── package.json                  # Dependencies & scripts
├── README.md                     # Tài liệu dự án chi tiết
│
└── src/
    ├── navigation/               # 🧭 TẬP TRUNG HỆ THỐNG REACT NAVIGATION
    │   ├── AppNavigator.jsx      # NavigationContainer & Drawer.Navigator
    │   ├── BottomTabNavigator.jsx# Custom Animated Tab Bar
    │   └── DrawerContent.jsx     # Custom Drawer Sidebar UI & logic
    │
    ├── components/               # Các UI Components tái sử dụng
    │   ├── GreetingHeader.jsx    # Header chào mừng, đồng hồ live, badge repos
    │   ├── RepoCard.jsx          # Thẻ repo, modal chi tiết & link GitHub
    │   ├── TaskItem.jsx          # Thẻ công việc & checkbox animation
    │   ├── ContributionGraph.jsx # Biểu đồ commit đóng góp GitHub
    │   ├── ContextMenu.jsx       # Menu hành động nhanh
    │   └── CreateTaskModal.jsx   # Modal tạo task theo repo
    │
    ├── screens/                  # Các màn hình chính
    │   ├── DashboardScreen.jsx   # Bảng điều khiển tổng quan
    │   ├── RepositoriesScreen.jsx# Quản lý danh sách Repositories
    │   ├── ExploreScreen.jsx     # Khám phá Open Source repos toàn cầu
    │   ├── SettingsScreen.jsx    # Cài đặt giao diện, cỡ chữ, theme
    │   └── LoginScreen.jsx       # Đăng nhập GitHub
    │
    ├── context/                  # React Contexts
    │   ├── GitHubContext.jsx     # Trạng thái dữ liệu GitHub & Tasks
    │   └── ThemeContext.jsx      # Quản lý Theme Sáng / Tối & Font Scale
    │
    ├── constants/                # Design Tokens
    │   ├── colors.js             # Bảng màu Dark & Light chuẩn WCAG AAA
    │   ├── spacing.js            # Spacing, Radius & Web BoxShadow
    │   └── typography.js         # Kiểu chữ & Font scaling tokens
    │
    └── services/                 # Kết nối dịch vụ ngoài
        ├── githubService.js      # REST API GitHub v3
        └── storageService.js     # Lưu trữ cục bộ AsyncStorage
```

---

## 🚀 Hướng dẫn Cài đặt & Khởi chạy (Getting Started)

### 1. Clone repository
```bash
git clone https://github.com/LuciusANDLucius/GitCheckTask.git
cd GitCheckTask
```

### 2. Cài đặt các gói phụ thuộc
```bash
npm install
```

### 3. Khởi chạy ứng dụng
```bash
# Chạy trực tiếp trên trình duyệt Web (khuyến nghị trải nghiệm):
npx expo start --web

# Chạy trên thiết bị di động (quét mã QR qua Expo Go trên iOS / Android):
npx expo start
```

---

## 📄 Bản quyền (License)

Dự án được phân phối dưới giấy phép **MIT License**.  
Phát triển bởi **[@LuciusANDLucius](https://github.com/LuciusANDLucius)**.
