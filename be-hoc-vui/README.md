<div align="center">

# 🌷 Bé Học Vui

**Web game học tập song ngữ Việt – Anh cho học sinh lớp 1 đến lớp 9**

Toán · Tiếng Việt · Tiếng Anh · Khoa học — 45 chủ đề · 256 màn chơi · 12 loại game · 86 món thời trang

![Bé Học Vui](docs/screenshots/lobby.png)

</div>

---

## Mục lục

1. [Giới thiệu](#1-giới-thiệu)
2. [Chạy thử trong 1 phút](#2-chạy-thử-trong-1-phút)
3. [Đưa lên web miễn phí](#3-đưa-lên-web-miễn-phí)
4. [Tính năng](#4-tính-năng)
5. [Tủ đồ thời trang](#5-tủ-đồ-thời-trang)
6. [Nội dung học](#6-nội-dung-học)
7. [Dành cho nhà phát triển](#7-dành-cho-nhà-phát-triển)
8. [Cấu trúc thư mục](#8-cấu-trúc-thư-mục)
9. [Câu hỏi thường gặp](#9-câu-hỏi-thường-gặp)

---

## 1. Giới thiệu

Bé Học Vui biến bài học thành những màn chơi ngắn từ 2 đến 5 phút.
- Bé chọn một "thế giới" (môn học), đi qua bản đồ màn chơi, trả lời câu hỏi để nhận sao và xu.
- Xu dùng để mua quần áo, phụ kiện cho nhân vật của mình.
- Phụ huynh có góc riêng để xem báo cáo và đặt giới hạn thời gian.

Giao diện theo phong cách **casual mobile game**:
- Tông màu nâu hồng (mauve) và kem.
- Nhân vật chibi kiểu búp bê vinyl.
- Cảnh nền mờ như chụp xoá phông.
- Nút viên thuốc có vệt sáng chéo.

Ảnh mẫu tham khảo nằm trong `docs/reference/`.

| Thành phần | Công nghệ |
|---|---|
| Giao diện | React 18 + TypeScript, CSS thuần. Nhân vật, icon, cảnh nền đều vẽ bằng SVG. Âm thanh tổng hợp bằng Web Audio |
| Máy chủ | Node.js thuần (`node:http`), **không phụ thuộc gói npm nào** |
| Cơ sở dữ liệu | SQLite (`node:sqlite` có sẵn trong Node) khi chạy trên máy, hoặc **Turso** (SQLite đám mây) khi đưa lên web |

---

## 2. Chạy thử trong 1 phút

Chỉ cần cài **[Node.js](https://nodejs.org) phiên bản 22.13 trở lên**.

```bash
cd be-hoc-vui
npm start
```

Mở trình duyệt vào **http://localhost:5174**.

- Không cần `npm install`, vì giao diện đã được build sẵn trong `client/dist`.
- Dữ liệu được lưu ở file `data/behocvui.db`.
- Ở màn đăng nhập có thể bấm **"Chơi thử không cần tài khoản"**. Tài khoản khách nâng cấp được lên tài khoản email sau, trong Góc phụ huynh.

---

## 3. Đưa lên web miễn phí

Dùng **Render** (máy chủ) kết hợp **Turso** (cơ sở dữ liệu). Cả hai đều miễn phí và không cần thẻ tín dụng. File `render.yaml` đã có sẵn.

| Bước | Việc cần làm |
|---|---|
| 1 | Đưa toàn bộ thư mục lên một repo **GitHub** |
| 2 | Tạo database trên **[turso.tech](https://turso.tech)**, chép **URL** (`libsql://…`) và **token** |
| 3 | Trên **[render.com](https://render.com)**: New → **Blueprint** → chọn repo. Để trống ô *Blueprint Path*, rồi dán URL và token vào 2 biến `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` |

Hướng dẫn chi tiết từng bước: **[docs/DEPLOY.md](docs/DEPLOY.md)**.

> Gói miễn phí của Render cho máy chủ "ngủ" sau 15 phút không ai truy cập. Lần mở kế tiếp phải chờ khoảng 30–60 giây. Dữ liệu vẫn an toàn vì nằm trên Turso.

---

## 4. Tính năng

### Cho bé
- 🗺️ **4 thế giới học tập**, mỗi thế giới có một linh vật dẫn đường:

  | Thế giới | Môn | Linh vật |
  |---|---|---|
  | Đảo Con Số | Toán | Bơ |
  | Làng Chữ | Tiếng Việt | Mochi |
  | Thành Phố ABC | Tiếng Anh | Foxy |
  | Rừng Khám Phá | Khoa học | Kiwi |
- 🧭 **Bản đồ màn chơi** theo từng lớp:
  - Các màn mở khoá lần lượt.
  - Giữa mỗi chủ đề có **rương báu**, cuối chủ đề là **màn trùm** (3 tim).
  - Mỗi màn được chấm 1–3 sao.
- 🎮 **12 loại game**:

  | Nhóm | Game |
  |---|---|
  | Chọn đáp án | Đố vui, Đúng/Sai (vuốt thẻ), Điền chỗ trống, Nghe và chọn |
  | Kéo, ghép, xếp | Nối cặp, Lật thẻ trí nhớ, Sắp xếp, Ghép chữ, Xem đồng hồ |
  | Hành động | Hứng đồ, Đua xe Toán, Bắn bóng bay |
- 🏆 **Phần thưởng**: xu, EXP và cấp độ, 22 huy hiệu, 3 nhiệm vụ mỗi ngày, rương mỗi ngày, chuỗi ngày học, bảng thi đua gia đình.
- 👗 **Tủ đồ 86 món** để tự phối đồ cho nhân vật (xem [mục 5](#5-tủ-đồ-thời-trang)).
- ✨ **Hiệu ứng**:
  - Combo, pháo giấy, xu bay vào thanh tài nguyên.
  - Nhân vật có nhiều biểu cảm: vẫy tay, cổ vũ, suy nghĩ, buồn nhẹ, ngủ.
  - Âm thanh vui tai, giọng đọc câu hỏi.
- 🧒 **Giao diện theo độ tuổi**:
  - Lớp 1–2: chữ to, tự đọc câu hỏi.
  - Lớp 3–5: chữ vừa.
  - Lớp 6–9: chữ gọn.
- 📱 Dùng tốt trên điện thoại, máy tính bảng và máy tính.
- ⌨️ Điều khiển được bằng bàn phím (phím 1–4, mũi tên, Enter), có chế độ giảm chuyển động.

### Cho phụ huynh (vào qua cổng phép nhân)
- 👨‍👩‍👧 **Tài khoản**: tối đa 4 hồ sơ bé, đổi mật khẩu, nâng cấp tài khoản khách.
- 📊 **Báo cáo**: biểu đồ số phút học trong 7 ngày, độ chính xác theo từng môn, hoạt động gần đây.
- ⏱️ **Giới hạn**:
  - Thời gian học mỗi ngày (15–120 phút, hoặc không giới hạn).
  - Bật/tắt cơ chế năng lượng (giới hạn số màn chơi liên tục).
  - Bật/tắt bảng xếp hạng.
- ✏️ **Hồ sơ**: sửa biệt danh và lớp. Xoá hồ sơ cần nhập lại mật khẩu.

### An toàn cho trẻ
- Chỉ dùng biệt danh, có lọc từ ngữ không phù hợp. Không thu thập thông tin cá nhân của bé.
- Không quảng cáo, không thanh toán thật (xu chỉ là xu ảo), không chat.
- Nhắc nghỉ mắt mỗi 20 phút. Sau 21 giờ, linh vật nhắc bé đi ngủ.
- Máy chủ **tự chấm lại mọi câu trả lời** và tự tính phần thưởng, không tin điểm do trình duyệt gửi lên.

---

## 5. Tủ đồ thời trang

Nhân vật được dựng từ nhiều lớp SVG nên có thể phối tự do.
- Các món giá 0 xu có sẵn từ đầu. Các món còn lại mua trong **Cửa hàng** bằng xu kiếm được khi học.
- Trong Cửa hàng có thể **mặc thử** trước khi mua.
- Đồ đã có thay ở **Nhân vật → Trang phục**.

| Nhóm | Số món | Danh sách |
|---|:---:|---|
| 💇 Kiểu tóc | 9 | Tóc ngắn, Buộc hai bên, Tóc dựng, Tóc dài, Búi tóc, Đuôi ngựa, Xoăn bồng, Tết hai bên, Tóc tém |
| 🎨 Màu tóc | 11 | Nâu ca cao, Đen, Kem sữa, Mật ong, Hồng phấn, Bạc hà, Tím oải hương, Xanh da trời, Đỏ anh đào, Xám tro, Nâu hạt dẻ |
| 🐾 Tai thú | 9 | Không có, Mèo, Thỏ, Gấu, Cáo, Gấu trúc, Chuột, Cún cụp, Sừng nai |
| 👗 Trang phục | 13 | Váy yếm, Quần yếm, **Đồng phục khăn quàng đỏ**, Hoodie, Áo mưa, Đồ thể thao, Áo thuỷ thủ, Váy ba lê, Áo đầu bếp, **Áo dài**, Áo nhà khoa học, Đồ phi hành gia, Váy công chúa |
| 🌈 Màu áo | 11 | Xanh lá mạ, Đào, Xanh trời, Oải hương, Vàng bơ, Dâu, Bạc hà, San hô, Xanh than, Kem sữa, Hồng phấn |
| 🎀 Phụ kiện | 13 | Không có, Nơ, Kẹp hoa, Kẹp ngôi sao, Băng đô nơ, Kính tròn, **Nón lá**, Mũ nồi, Mũ lưỡi trai, Vòng hoa, Tai nghe, Mũ sinh nhật, Vương miện |
| 👟 Giày dép | 6 | Giày búp bê đỏ, Giày thể thao, Dép bông thỏ, Dép quai hậu, Bốt da, Ủng đi mưa |
| 🌷 Đồ cầm tay | 8 | Không cầm, Bút chì, Quyển sách, **Hoa tulip**, Bóng bay, Kẹo mút, Gấu bông, Đũa phép ngôi sao |
| 🏞️ Cảnh nền sảnh | 6 | Đồng hoa, Bờ biển, Làng quê, Đêm sao, Mùa hoa anh đào, Mùa đông tuyết |

Ngoài ra bé chọn được **5 màu da** khi tạo nhân vật.

Muốn thêm món mới:
1. Khai báo món đó trong `SHOP` ở `server/content/index.js`.
2. Vẽ hình tương ứng trong `client/src/ui/Chibi.tsx`, đúng nhánh `switch` của nhóm.

---

## 6. Nội dung học

Bám theo Chương trình GDPT 2018 ở mức khái quát.

| Môn | Chủ đề | Nguồn câu hỏi |
|---|:---:|---|
| Toán | 18 (2 chủ đề mỗi lớp) | **Sinh tự động theo seed**: mỗi lần chơi ra câu mới, đáp án nhiễu có chủ đích |
| Tiếng Việt / Ngữ văn | 9 | Ngân hàng câu hỏi soạn sẵn |
| Tiếng Anh | 9 | Ngân hàng câu hỏi soạn sẵn |
| Khoa học | 9 | Ngân hàng câu hỏi soạn sẵn |

Tổng cộng: 45 chủ đề, 256 màn chơi, 45 rương báu, 526 câu hỏi soạn sẵn (chưa tính câu Toán sinh tự động).

Cách thêm hoặc sửa câu hỏi: **[docs/NOI_DUNG.md](docs/NOI_DUNG.md)**.

---

## 7. Dành cho nhà phát triển

```bash
npm install     # chỉ cần khi sửa giao diện (cài Vite, TypeScript, React)
npm run dev     # server API cổng 5174 + giao diện hot-reload cổng 5173 → http://localhost:5173
```

| Lệnh | Việc làm |
|---|---|
| `npm start` | Chạy server, phục vụ cả API lẫn giao diện đã build |
| `npm run dev` | Chạy chế độ phát triển |
| `npm run build` | Build giao diện bằng Vite vào `client/dist` (**chạy lại trước khi đẩy lên web nếu có sửa giao diện**) |
| `npm run build:fast` | Build nhanh bằng esbuild (phương án dự phòng) |
| `npm run typecheck` | Kiểm tra kiểu TypeScript |
| `npm test` | Chạy 5 nhóm test (xem bên dưới) |

### Biến môi trường

| Biến | Mặc định | Ý nghĩa |
|---|---|---|
| `PORT` | `5174` | Cổng máy chủ |
| `DB_FILE` | `data/behocvui.db` | File SQLite khi chạy trên máy |
| `TURSO_DATABASE_URL` | — | Khi có biến này, dữ liệu lưu trên Turso |
| `TURSO_AUTH_TOKEN` | — | Token truy cập Turso |
| `COOKIE_SECURE` | — | Đặt `1` khi chạy sau HTTPS |
| `TRUST_PROXY` | — | Đặt `1` khi chạy sau proxy (Render), để giới hạn đăng nhập sai tính đúng theo IP người dùng |
| `TZ_GAME` | `Asia/Ho_Chi_Minh` | Múi giờ dùng để tính "ngày học", chuỗi ngày và nhiệm vụ |
| `DEMO_UNLOCK` | — | Đặt `1` để mở khoá mọi màn (dùng khi trình diễn hoặc khi giáo viên xem trước) |

### Kiểm thử (`npm test`)
1. Mọi màn đều tạo được vòng chơi hợp lệ: thử 25 seed cho mỗi màn, tổng hơn 10.000 vòng. Kiểm tra không có đáp án trùng, đủ bản dịch Việt/Anh.
2. Đáp án Toán chính xác: test tính lại từng phép tính để đối chiếu.
3. Logic tính điểm: sao, xu, cấp độ, năng lượng.
4. Luồng API đầy đủ trên SQLite:
   - Đăng ký, tạo hồ sơ, chơi hết các màn, nhận thưởng.
   - Chặn chơi lại để "cày" xu.
   - Mua đồ, mở rương, báo cáo phụ huynh, giới hạn thời gian, đăng nhập lại.
5. Chạy lại nhóm 4 nhưng lưu dữ liệu qua giao thức HTTP của Turso (trên một máy chủ giả lập).

### Tài liệu khác
- [docs/API.md](docs/API.md): danh sách API và quy tắc tính thưởng.
- [docs/NOI_DUNG.md](docs/NOI_DUNG.md): thêm và sửa câu hỏi.
- [docs/DEPLOY.md](docs/DEPLOY.md): đưa lên web miễn phí.
- [docs/STYLE_NOTES.md](docs/STYLE_NOTES.md): bảng màu và hình khối lấy từ ảnh mẫu.

---

## 8. Cấu trúc thư mục

```
be-hoc-vui/
├── server/                 Máy chủ (JavaScript thuần)
│   ├── index.js            Định tuyến API + phục vụ giao diện
│   ├── db.js               SQLite trên máy / Turso qua HTTP
│   ├── auth.js             Mật khẩu (scrypt) + phiên đăng nhập (cookie httpOnly)
│   ├── game.js             Tiến độ, năng lượng, chấm điểm, thưởng, huy hiệu, báo cáo
│   ├── rounds.js           Tạo vòng chơi từ ngân hàng câu hỏi / bộ sinh
│   └── content/            math.js (bộ sinh), bank.js (ngân hàng), index.js (môn, màn, cửa hàng, huy hiệu)
├── shared/logic.js         Logic dùng chung client + server: chấm câu, sao, cấp, năng lượng
├── client/
│   ├── src/
│   │   ├── ui/             kit.tsx (nút, panel, hộp thoại, HUD), Chibi.tsx (nhân vật), Scene.tsx, Icons.tsx
│   │   ├── screens/        Các màn hình: chào, đăng nhập, sảnh, bản đồ, chơi, nhân vật, cửa hàng, phụ huynh…
│   │   ├── games/          StepGames.tsx (game theo vòng), FlowGames.tsx (đua xe, bóng bay)
│   │   ├── lib/            api, store, i18n (vi/en), âm thanh, giọng đọc, hiệu ứng
│   │   └── styles.css      Toàn bộ giao diện
│   └── dist/               Bản build sẵn
├── test/                   Bộ test
├── docs/                   Tài liệu, ảnh mẫu, ảnh chụp màn hình
├── render.yaml             Cấu hình triển khai Render
└── Dockerfile              Triển khai bằng Docker
```

---

## 9. Câu hỏi thường gặp

**Chạy `npm start` báo cần Node.js 22.13?**
Cài bản Node.js LTS mới nhất tại https://nodejs.org rồi mở lại cửa sổ dòng lệnh.

**Máy không đọc được câu hỏi tiếng Việt?**
Giọng đọc phụ thuộc vào thiết bị. Trên Windows, vào Cài đặt → Thời gian và ngôn ngữ → Giọng nói, rồi thêm giọng Tiếng Việt. Nếu máy không có giọng Việt, game "Nghe và chọn" có nút **Xem chữ** để thay thế.

**Muốn mở khoá hết màn để xem trước?**
Chạy server với `DEMO_UNLOCK=1`. Trên PowerShell: `$env:DEMO_UNLOCK=1; npm start`.

**Sao lưu dữ liệu thế nào?**
- Chạy trên máy: chép file `data/behocvui.db`.
- Chạy trên Turso: dùng tính năng sao lưu ngay trên trang quản lý của Turso.

---

## Ảnh chụp màn hình

| | |
|---|---|
| ![Màn chào](docs/screenshots/splash.png) | ![Nhân vật](docs/screenshots/character.png) |
| ![Bản đồ](docs/screenshots/map.png) | ![Màn chơi](docs/screenshots/play.png) |
| ![Tủ đồ](docs/screenshots/wardrobe.png) | ![Cửa hàng](docs/screenshots/shop.png) |
