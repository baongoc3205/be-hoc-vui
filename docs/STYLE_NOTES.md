# Ghi Chú Phong Cách — KidQuest (Bé Học Vui)

## 1. Trạng Thái Thư Mục Tham Chiếu (`docs/reference/`)
- Kiểm tra thư mục: Thư mục `docs/reference/` hiện đang trống (chưa có ảnh mẫu do người dùng tải lên).
- **Hành động**: Theo mục 1 trong Hướng dẫn xây dựng Frontend v2, hệ thống sử dụng 100% token chuẩn và đặc tả chi tiết từ tài liệu thiết kế.

## 2. Phân Tích & Đặc Trưng Phong Cách Thiết Kế (Casual Mobile Game)

### 2.1 Bảng màu chính (Palette Analysis)
- **Nút bấm 4 lớp màu sắc**:
  - Xanh lá (Green - Thành công / Nút chính / Chơi):
    `#8EF04A` (top highlight) → `#5BCB2A` (base) → `#3FA51A` (bottom gradient) → `#22660E` (3D edge / outline)
  - Cam (Orange - Năng động / Hành động phụ / Điểm thưởng):
    `#FFC54D` → `#FF9F1C` → `#F07B0A` → `#8F4300`
  - Xanh dương (Blue - Toán học / Thông tin / Tiếp tục):
    `#6FD8FF` → `#2FB4F5` → `#1A8BD6` → `#0B4C80`
  - Tím (Purple - Tiếng Anh / Huyền bí / Cửa hàng):
    `#C79BFF` → `#9B5CF6` → `#7A3BE0` → `#40197F`
  - Hồng (Pink - Đáng yêu / Trái tim):
    `#FF9EC2` → `#FF5C93` → `#E43B76` → `#821740`
  - Xám (Gray - Disabled):
    `#E9EEF5` → `#C9D2DE` → `#A7B3C3` → `#56627A`

### 2.2 Viền & Hiệu ứng 3D
- **Độ dày viền (Outline)**: 4px mặc định (`--outline: 4px`), 3px cho chế độ Cánh Bay (`--outline-sm: 3px`).
- **Đế 3D nút kẹo (Candy Button Base)**: Khối đổ bóng dưới đáy nút dày 6px (`--depth: 6px`). Khi click/active, thân nút tụt xuống 4px, đế mỏng lại còn 2px (`--depth-pressed: 2px`).
- **Highlight (Vệt bóng kẹo)**: Hình elip trắng bán trong suốt (opacity 35%–45%) ở 1/3 trên của nút, bo theo đường cong nút.
- **Text stroke & Text shadow**:
  - Chữ trên nút sử dụng `-webkit-text-stroke: 1.5px var(--edge)` kết hợp `paint-order: stroke fill` để giữ nét chữ không bị ăn vào ruột.
  - Chữ tiêu đề vàng sử dụng gradient vàng kim `#FFF27A` → `#FFC21A` với viền nâu `#7A3B00` và bóng đổ 3D.
  - Tối ưu cho Tiếng Việt: Ở cỡ chữ < 20px, giảm stroke còn 1px để tránh bết dấu mũ, dấu sắc/huyền/hỏi/ngã/nặng.

### 2.3 Panel, Popup & Ribbon
- **Panel**: Nền màu kem ấm `#FFF7E8`, viền nâu ấm `#7A4A1E`, bo góc lớn 22px-32px, có hoa văn chấm bi mờ.
- **Ribbon**: Ruy-băng đỏ san hô `#FF5C5C` viền `#6E1220` vắt ngang đỉnh panel, hai đầu gấp đuôi cá 3D.
- **Nút đóng (Close Button)**: Nút tròn màu san hô nhô ra ở góc trên bên phải (+8px offset) với dấu ✕ trắng đậm.
- **HUD Pill**: Nền tối bán trong suốt `rgba(30, 24, 60, 0.55)` bo tròn pill, icon to lấn mép trái, số to rõ ràng.

### 2.4 Nhân vật & Tỉ lệ Chibi
- Đầu chiếm ~55% tổng chiều cao.
- Mắt to có 2 chấm highlight trắng sáng long lanh, má hồng tròn.
- Không có chi tiết góc cạnh sắc nhọn nguy hiểm, biểu cảm thân thiện, khuyến khích học sinh.
