# API — Bé Học Vui

Mọi endpoint đều nằm dưới `/api`, dữ liệu dạng JSON. Phiên đăng nhập của phụ huynh lưu trong cookie httpOnly `bhv_session` (60 ngày).

Khi có lỗi, server trả `{ "error": "MÃ_LỖI" }`. Các mã thường gặp:

| Mã HTTP | Mã lỗi |
|---|---|
| 401 | `UNAUTHORIZED`, `BAD_CREDENTIALS` |
| 403 | `LESSON_LOCKED` |
| 404 | `*_NOT_FOUND` |
| 409 | `EMAIL_TAKEN`, `NO_ENERGY`, `NOT_ENOUGH_COINS`, `ALREADY_*` |
| 423 | `DAILY_LIMIT` |
| 429 | `TOO_MANY_ATTEMPTS` |

## Xác thực phụ huynh
| Phương thức | Đường dẫn | Dữ liệu gửi | Ghi chú |
|---|---|---|---|
| POST | `/auth/register` | `{ name, email, password }` | Mật khẩu ≥ 6 ký tự |
| POST | `/auth/login` | `{ email, password }` | Tối đa 10 lần sai trong 15 phút |
| POST | `/auth/guest` | – | Tạo tài khoản khách |
| POST | `/auth/upgrade` | `{ name, email, password }` | Chuyển tài khoản khách thành tài khoản email |
| POST | `/auth/logout` | – | |
| GET | `/auth/me` | – | Trả `{ parent }`, hoặc `null` nếu chưa đăng nhập |
| POST | `/auth/verify` | `{ password }` | Xác nhận lại trước thao tác nhạy cảm |
| POST | `/auth/password` | `{ current, next }` | Đổi mật khẩu |

## Nội dung
| GET | `/catalog` | Môn học, chủ đề, loại game, cửa hàng, huy hiệu |
|---|---|---|

## Hồ sơ bé
| Phương thức | Đường dẫn | Ghi chú |
|---|---|---|
| GET | `/children` | Danh sách hồ sơ |
| POST | `/children` | `{ nickname, grade, look }`. Tối đa 4 hồ sơ, biệt danh được lọc từ ngữ |
| PATCH | `/children/:id` | `{ nickname?, grade?, settings?: { dailyLimitMin, energy, leaderboard } }` |
| DELETE | `/children/:id` | Xoá hồ sơ |
| GET | `/children/:id/state` | Xu, EXP/cấp, năng lượng, sao, chuỗi ngày, nhiệm vụ, huy hiệu, đồ đã có, phút học hôm nay, màn gợi ý |
| GET | `/children/:id/worlds?grade=` | Tiến độ 4 thế giới của một lớp |
| GET | `/children/:id/map?subject=&grade=` | Các màn: khoá/mở, sao, rương, trùm |
| POST | `/children/:id/sessions` | `{ lessonId }` → `{ sessionId, game, rounds, lesson }`. Trừ 1 năng lượng |
| POST | `/children/:id/sessions/:sid/finish` | `{ answers: [{ round, given }], durationSec }`. Server tự chấm và trả `{ stars, coins, xp, levelUp, newBadges, next, state }` |
| POST | `/children/:id/chests/:lessonId` | Mở rương trên bản đồ |
| POST | `/children/:id/daily-chest` | Mở rương mỗi ngày (xu + 2 năng lượng) |
| POST | `/children/:id/quests/:qid/claim` | Nhận thưởng nhiệm vụ |
| POST | `/children/:id/shop/:itemId` | Mua đồ bằng xu ảo |
| POST | `/children/:id/look` | `{ look }`. Chỉ mặc được đồ đã có |
| GET | `/children/:id/report` | Báo cáo cho phụ huynh |
| GET | `/leaderboard` | Bảng thi đua gia đình (7 ngày) |

## Quy tắc tính thưởng (`shared/logic.js`)
- **Sao**: đúng ≥ 90% → 3 sao, ≥ 70% → 2 sao, ≥ 40% → 1 sao.
- **Xu** = `xu gốc × sao / 3` + `combo / 3`. Lần đầu đạt 3 sao được thêm 10 xu. Chơi lại màn đã 3 sao chỉ nhận 20% số xu.
- **EXP** = `EXP gốc × (0,4 + 0,6 × độ chính xác)`. EXP cần để lên cấp n là `50 × n^1,5`.
- **Năng lượng**: tối đa 10, hồi 1 điểm mỗi 10 phút. Phụ huynh có thể tắt.
