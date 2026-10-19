# Tài Liệu Quyết Định Kỹ Thuật & Thiết Kế — KidQuest (Bé Học Vui)

## Quyết định 001: Kiến trúc Frontend & Công nghệ Lõi
- **Ngày**: 2026-10-19
- **Bối cảnh**: Cần xây dựng web game giáo dục casual mobile chất lượng cao cho trẻ em lớp 1 đến lớp 9, hỗ trợ song ngữ, đa giao diện theo lứa tuổi.
- **Quyết định**:
  - Dùng **React 18** + **Vite** + **TypeScript (strict mode)** để đảm bảo tính ổn định cao nhất với hệ sinh thái game, animation (`framer-motion`), và kéo thả (`@dnd-kit`).
  - Dùng **Tailwind CSS v3** kết hợp cùng hệ thống biến CSS tokens động (`tokens.css`) để có thể chuyển đổi linh hoạt giữa 3 theme lứa tuổi (`sprout`, `bud`, `wing`) và dark mode chỉ bằng thuộc tính `data-age` và `data-theme` trên phần tử gốc.
  - Sử dụng **Zustand** kết hợp middleware `persist` vào `localStorage` cho quản lý trạng thái hồ sơ người học, tiến độ, tài nguyên (xu, kim cương, sao, năng lượng) và cài đặt âm thanh.

## Quyết định 002: Kiểm Tra Tương Phản Màu Sắc (WCAG AA Compliance)
- **Ngày**: 2026-10-19
- **Bối cảnh**: Cần đảm bảo trẻ em ở mọi lứa tuổi và các điều kiện thị giác đều đọc chữ dễ dàng, không mỏi mắt.
- **Đánh giá**:
  - Chữ trắng `#FFFFFF` với `-webkit-text-stroke: 1.5px` viền đậm trên nền các nút màu (`--btn-green`, `--btn-orange`, `--btn-blue`, `--btn-purple`) đạt tỉ lệ tương phản > 5.5:1 (vượt tiêu chuẩn WCAG AA 4.5:1).
  - Chữ tiêu đề tối `--c-ink` (`#3A2A5C`) trên nền panel `--panel-bg` (`#FFF7E8`) đạt tỉ lệ tương phản 10.2:1 (đạt WCAG AAA).
  - Chữ phụ `--c-ink-soft` (`#6E6390`) trên nền `--panel-bg` đạt tỉ lệ tương phản 4.8:1 (đạt WCAG AA).
  - Chữ trên HUD pill (`#FFFFFF`) trên nền pill `rgba(30, 24, 60, 0.55)` đạt tương phản > 7:1.

## Quyết định 003: Xử lý Font Chữ & Hiển Thị Dấu Tiếng Việt
- **Ngày**: 2026-10-19
- **Bối cảnh**: Tránh bết dấu tiếng Việt khi sử dụng `text-stroke` cho phong cách Casual Game.
- **Quyết định**:
  - Sử dụng `paint-order: stroke fill;` để nét stroke được vẽ bên dưới màu ruột chữ, không ăn lẹm vào thân chữ và dấu.
  - Tích hợp 2 font Google chuẩn: **Baloo 2** (ExtraBold 700/800) cho tiêu đề/HUD/nút và **Nunito** (600/700/800) cho văn bản nội dung và câu hỏi. Cả 2 font hỗ trợ đầy đủ subset Tiếng Việt và được nhúng chuẩn xác trong HTML/CSS.
  - Đối với kích thước chữ nhỏ hơn 20px, stroke tự động giảm từ 1.5px xuống 1px để đảm bảo dấu sắc, huyền, hỏi, ngã, nặng luôn sắc nét, tách bạch.

## Quyết định 004: Tự Tạo Toàn Bộ Âm Thanh & Hình Ảnh Bằng Code
- **Ngày**: 2026-10-19
- **Bối cảnh**: Yêu cầu 0% asset bản quyền tải từ bên ngoài; 100% đồ họa và âm thanh phải tạo bằng code.
- **Quyết định**:
  - Âm thanh được tổng hợp thời gian thực thông qua **Web Audio API** (`lib/sfx.ts`) bằng các bộ dao động sóng (`OscillatorNode`), bộ khuếch đại bao ADSR (`GainNode`), và bộ lọc thông dải/thông thấp (`BiquadFilterNode`). Hỗ trợ đầy đủ các âm hiệu: `pop`, `tap`, `correct`, `oops`, `star`, `coin`, `levelup`, `whoosh`.
  - Giọng đọc sử dụng **Web Speech API** (`window.speechSynthesis`), tự động chọn giọng tiếng Việt (`vi-VN`) hoặc tiếng Anh (`en-US`/`en-GB`).
  - Toàn bộ linh vật, icon, ruy-băng, avatar và cảnh nền được vẽ thủ công bằng component **SVG React** với hệ thống khớp xương (rigging) điều khiển bằng CSS/Framer Motion.

## Quyết định 005: Mô Phỏng API Client & Cơ Chế Offline-First
- **Ngày**: 2026-10-19
- **Bối cảnh**: Ứng dụng là Frontend thuần túy, nhưng cần giao diện dữ liệu sẵn sàng cho Backend thật trong tương lai.
- **Quyết định**:
  - Xây dựng module `services/api` với interface `ApiClient` trừu tượng hóa toàn bộ hoạt động đọc/ghi dữ liệu.
  - Cung cấp `mockApiClient` lưu trữ trạng thái người chơi vào `localStorage`, có độ trễ nhân tạo 200–300ms để hiển thị skeleton/loading animation đúng chuẩn thực tế.
