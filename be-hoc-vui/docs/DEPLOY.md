# Đưa "Bé Học Vui" lên web miễn phí

Phương án: **Render** (chạy máy chủ, miễn phí) + **Turso** (cơ sở dữ liệu SQLite đám mây, miễn phí) + **GitHub** (chứa mã nguồn).

Vì sao cần Turso: gói miễn phí của Render **xoá ổ đĩa mỗi lần khởi động lại**. Không có Turso, tài khoản và tiến độ của bé sẽ bị mất. Turso giữ dữ liệu vĩnh viễn, và gói miễn phí của Turso dư dùng cho dự án này.

Tổng thời gian khoảng 15 phút, không cần thẻ tín dụng.

---

## Bước 1. Đưa mã nguồn lên GitHub

Chọn **một** trong hai cách sau.

**Cách A: dùng trình duyệt (không cần cài gì)**
1. Đăng nhập https://github.com, bấm **New repository**. Đặt tên `be-hoc-vui`, chọn **Private** hoặc **Public** đều được, rồi bấm **Create repository**.
2. Trên trang repo mới, bấm **uploading an existing file**.
3. Mở thư mục `be-hoc-vui` trên máy, chọn **tất cả** file và thư mục bên trong (trừ `node_modules` và `data` nếu có), rồi kéo thả vào trang GitHub.
4. Bấm **Commit changes**.

**Cách B: dùng Git**

```bash
cd be-hoc-vui
git init && git add . && git commit -m "Bé Học Vui"
git branch -M main
git remote add origin https://github.com/<tên-bạn>/be-hoc-vui.git
git push -u origin main
```

## Bước 2. Tạo cơ sở dữ liệu Turso

1. Vào https://turso.tech, bấm **Sign up** và đăng nhập bằng GitHub.
2. Bấm **Create Database**. Đặt tên `be-hoc-vui` và chọn vùng gần Việt Nam nhất (ví dụ Singapore hoặc Tokyo, nếu có).
3. Mở database vừa tạo:
   - Chép **URL**. URL có dạng `libsql://be-hoc-vui-<tên>.turso.io`.
   - Bấm **Create Token** (hoặc Generate Token), chọn quyền **Read & Write**, thời hạn **Never**, rồi chép **token**.

Bảng dữ liệu sẽ được máy chủ tự tạo ở lần chạy đầu tiên, nên không cần chạy lệnh SQL nào.

## Bước 3. Triển khai lên Render

1. Vào https://render.com, bấm **Get Started** và đăng nhập bằng GitHub.
2. Bấm **New → Blueprint**, chọn repo `be-hoc-vui`. Render sẽ đọc file `render.yaml` có sẵn.

   Cách khác: mở đường dẫn sau, thay `<tên-bạn>` bằng tên GitHub của bạn.

   `https://render.com/deploy?repo=https://github.com/<tên-bạn>/be-hoc-vui`
3. Khi Render hỏi biến môi trường, dán vào:
   - `TURSO_DATABASE_URL`: URL ở Bước 2
   - `TURSO_AUTH_TOKEN`: token ở Bước 2
4. Bấm **Apply** hoặc **Deploy**, chờ khoảng 2–3 phút.
5. Render cấp một địa chỉ dạng **`https://be-hoc-vui.onrender.com`**. Mở thử, nếu thấy màn hình chào là xong 🎉

Kiểm tra máy chủ: mở `https://<địa-chỉ-của-bạn>/api/health`, trang sẽ hiện `{"ok":true,...}`.

## Gặp lỗi?

| Lỗi | Cách sửa |
|---|---|
| `Cannot find module '.../server/index.js'` | Dự án nằm trong thư mục con của repo. Vào Render → Settings → **Root Directory**, điền tên thư mục đó (ví dụ `be-hoc-vui`) |
| Trang hiện "Chưa build giao diện" | Vào Render → Settings → **Build Command**, điền `npm install --include=dev && npm run build:fast` |
| `Blueprint file … not found` | Để trống ô **Blueprint Path** (hoặc điền `thư-mục-con/render.yaml`). Không dán URL Turso vào ô này |
| Log ghi `Dữ liệu: …behocvui.db` | Chưa có biến `TURSO_DATABASE_URL` và `TURSO_AUTH_TOKEN`. Thêm ở Render → **Environment** |

## Lưu ý về gói miễn phí

- Render sẽ cho máy chủ "ngủ" sau **15 phút không có ai truy cập**. Lần mở tiếp theo phải chờ khoảng **30–60 giây** để máy chủ thức dậy, sau đó chạy bình thường. Dữ liệu vẫn an toàn vì nằm ở Turso.
- Muốn máy chủ luôn thức: tạo một monitor miễn phí ở https://uptimerobot.com, cho nó gọi `https://<địa-chỉ>/api/health` mỗi 10 phút. Gói miễn phí của Render có 750 giờ mỗi tháng, đủ để chạy 1 dịch vụ suốt cả tháng.
- Khi sửa code: đẩy thay đổi lên GitHub, Render sẽ tự triển khai lại.
  - Render tự build lại giao diện mỗi lần triển khai (lệnh `npm install --include=dev && npm run build:fast` trong `render.yaml`), nên không cần đẩy thư mục `client/dist`.
- Muốn dùng tên miền riêng (ví dụ `behocvui.vn`): vào Render → Settings → **Custom Domains**.
