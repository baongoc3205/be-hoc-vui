# Phiếu kiểm tra trên thiết bị thật

Dùng cho Giai đoạn 5 của kế hoạch. Mỗi thiết bị một phiếu. Đánh dấu ✓ khi đạt; chỗ nào lỗi thì ghi lại và **chụp màn hình**, gửi kèm tên thiết bị + trình duyệt.

Bộ kiểm thử tự động (`npm run test:ui`) đã chạy trên Chromium ở 7 cỡ màn hình. Phiếu này kiểm những thứ máy giả lập không bắt được: cảm ứng thật, loa, giọng đọc, Safari, trình duyệt trong Zalo.

**Thiết bị:** ____________________ **Hệ điều hành:** __________ **Trình duyệt:** __________ **Người kiểm:** __________ **Ngày:** ________

## 1. Mở trang và tài khoản

- [ ] Mở link lần đầu (máy chủ đang ngủ): thấy màn "Máy chủ đang thức dậy", sau ≤ 1 phút vào được
- [ ] Đăng ký tài khoản mới (phải tick ô đồng ý mới bấm được Đăng ký)
- [ ] Tạo hồ sơ bé, chọn lớp, chọn nhân vật
- [ ] Đóng trình duyệt, mở lại: vẫn đang đăng nhập, đúng bé
- [ ] Đăng xuất rồi đăng nhập lại: còn nguyên xu, sao, đồ đã mua
- [ ] Đăng ký xong hiện mã khôi phục; bấm Sao chép và Tải file được
- [ ] Quên mật khẩu: nhập email + mã khôi phục → đặt mật khẩu mới được, nhận mã mới
- [ ] Mở link từ Zalo / Messenger: vào được, đăng nhập được, không bị văng ra

## 2. Giao diện

- [ ] Sảnh, Học tập, Khu vui chơi, Kho báu, Cửa hàng, Nhân vật: không phải cuộn cả trang, chữ không che nhân vật
- [ ] Xoay ngang máy: bố cục 2 cột, không vỡ
- [ ] Chữ đọc rõ, nút đủ to để bé bấm trúng
- [ ] Điểm danh tự hiện khi vào sảnh lần đầu trong ngày, nhận quà được

## 3. Âm thanh và giọng đọc

- [ ] Chạm nút có tiếng "bụp"; trả lời đúng có tiếng chuông, sai có tiếng "ư-ừm"
- [ ] iPhone: gạt nút im lặng vẫn nghe tiếng trong game (khi đã mở âm lượng)
- [ ] Bấm loa ở câu hỏi: máy đọc to tiếng Việt (hoặc hiện thông báo thiếu giọng đọc)
- [ ] Trò "Nghe và chọn" (Tiếng Việt lớp 1): nghe được chữ cần chọn
- [ ] Bật Nhạc nền trong Cài đặt: có nhạc nhẹ; tắt được

## 4. Chơi thử từng trò (mỗi trò 1 màn)

| Trò | Đạt | Ghi chú |
|---|:---:|---|
| Đố vui | ☐ | |
| Đúng hay sai (vuốt thẻ) | ☐ | |
| Bắn bóng bay | ☐ | |
| Đua xe Toán | ☐ | |
| Điền chỗ trống | ☐ | |
| Nghe và chọn | ☐ | |
| Nối cặp | ☐ | |
| Lật thẻ trí nhớ | ☐ | |
| Sắp xếp (kéo thả) | ☐ | |
| Ghép chữ | ☐ | |
| Xem đồng hồ (kéo kim) | ☐ | |
| Hứng đồ | ☐ | |
| Chém trái cây (vuốt) | ☐ | |
| Xếp kẹo (đổi chỗ kẹo) | ☐ | |
| Bắn ná (kéo thả) | ☐ | |
| Bé tập vẽ (tô nét) | ☐ | |
| Màn trùm (3 tim) | ☐ | |

- [ ] Các trò hành động (hứng đồ, bóng bay, chém trái cây) chạy mượt, không giật
- [ ] Kết thúc màn: hiện sao, xu bay vào túi, nút Tiếp tục đúng

## 5. Góc phụ huynh

- [ ] Qua được cổng phép nhân
- [ ] Xem báo cáo 7 ngày; đổi giới hạn thời gian; tắt/bật năng lượng
- [ ] Tải dữ liệu về máy: ra file `.json`
- [ ] Tài khoản khách → Tạo tài khoản: giữ nguyên tiến độ

**Kết luận:** ☐ Đạt toàn bộ ☐ Có lỗi (đã ghi ở trên)
