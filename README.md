# GitCheckTask 🚀
> Ứng dụng Quản lý Repository GitHub & Tiến độ Task (Developer Task & Repository Workflow Manager)

Được xây dựng bằng **React Native (Expo)**, hỗ trợ đa nền tảng (Web, iOS, Android), tích hợp API GitHub trực tiếp, hệ thống theo dõi Deadline/Task và chuyển đổi giao diện **Dark Mode / Light Mode** tương phản cao (chuẩn WCAG AAA).

---

## ✨ Tính năng chính (Key Features)

### 1. 🐙 Tích hợp GitHub Real-Time
- **Đăng nhập GitHub thật**: Hỗ trợ GitHub Personal Access Token (PAT) và GitHub Device Flow OAuth (đăng nhập 1-chạm).
- **Xem Profile & Thống kê**: Tải avatar thật, số lượng repositories, followers, following, location và bio.
- **Biểu đồ đóng góp (GitHub Contributions Graph)**: Hiển thị ma trận đóng góp công khai theo năm (2026, 2025,...) tương tự GitHub profile.
- **Xem Repository & Trình duyệt trực tiếp**:
  - Xem danh sách repositories công khai & riêng tư.
  - Mở trực tiếp trang repository trên GitHub với 1 chạm (`GitHub ↗`).
  - Sao chép nhanh HTTPS Clone URL vào clipboard (`git clone ...`).
  - Xem danh sách **Contributors** và số lượng đóng góp thực tế.
  - Kiểm tra các thông số kỹ thuật: Stars, Forks, Open Issues, Pull Requests, Default branch, License.

### 2. 📋 Quản lý Công việc & Deadline (Developer Task Manager)
- **Gán Task theo Repository**: Quản lý các task/deadline gắn liền với từng repository cụ thể.
- **Bộ lọc công việc thông minh**:
  - ☀️ **Today**: Việc cần làm trong ngày hôm nay.
  - ⏱️ **Upcoming**: Công việc sắp tới hạn.
  - ⚠️ **Overdue**: Cảnh báo công việc đã quá hạn.
  - 📋 **All**: Toàn bộ danh sách công việc.
- **Tương tác trực quan**: Checkbox hoạt họa strikethrough, nhãn mức độ ưu tiên (Critical, Normal, Low), xóa hoặc đánh dấu hoàn thành nhanh chóng.

### 3. 🌐 Khám phá Mã nguồn Mở (Explore Open Source)
- Tìm kiếm repositories công khai trên toàn cầu với các chủ đề phổ biến: `#react-native`, `#ai`, `#typescript`, `#nextjs`, `#python`, v.v.
- Xếp hạng theo Most Stars, Most Forks, Recently Updated.
- Theo dõi (Track / Bookmark) các repository yêu thích vào danh sách quản lý cá nhân.

### 4. 🎨 Giao diện & Trải nghiệm Người dùng (Design & UX)
- **Hỗ trợ Dark Mode & Light Mode**: Bộ màu tương phản cao, đồng bộ 100% từ thẻ thông tin, header, thanh điều hướng đến popup modal.
- **Font Scaling & Accessibility**: Tuân thủ chuẩn trợ năng WCAG AAA/AA, cho phép điều chỉnh cỡ chữ linh hoạt.
- **Hiệu ứng mượt mà**: Micro-animations sử dụng React Native Animated compositor-only transforms.

---

## 🛠️ Công nghệ sử dụng (Tech Stack)

- **Framework**: React Native 0.76+, Expo SDK 52
- **Điều hướng (Navigation)**: React Navigation (Bottom Tabs, Drawer, Native Stack)
- **Quản lý trạng thái (State Management)**: React Context API (`GitHubContext`, `ThemeContext`)
- **API & Dữ liệu**: GitHub REST API v3, `@react-native-async-storage/async-storage`
- **Màu sắc & Thiết kế**: Hệ thống Design Tokens (`colors.js`, `spacing.js`, `typography.js`)

---

## 🚀 Cài đặt & Chạy dự án (Getting Started)

### 1. Clone repository
```bash
git clone https://github.com/LuciusANDLucius/GitCheckTask.git
cd GitCheckTask
```

### 2. Cài đặt dependencies
```bash
npm install
```

### 3. Khởi chạy ứng dụng
```bash
# Chạy trên nền tảng Web:
npx expo start --web

# Hoặc quét mã QR bằng Expo Go trên điện thoại:
npx expo start
```

---

## 📄 Bản quyền (License)
Dự án được phát hành theo giấy phép MIT. Được phát triển bởi [@LuciusANDLucius](https://github.com/LuciusANDLucius).
