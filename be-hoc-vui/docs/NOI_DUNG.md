# Thêm và sửa nội dung học

## 1. Tiếng Việt, Tiếng Anh, Khoa học: `server/content/bank.js`

Mỗi chủ đề là một đối tượng như sau:

```js
{
  id: 'v3', subject: 'vietnamese', grade: 3,
  title: S('Từ trái nghĩa…|Antonyms…'),
  games: ['quiz', 'drag-match', 'fill-blank', 'memory', 'true-false', 'boss'],  // thứ tự các màn
  items: [ ...câu hỏi... ],
}
```

Chữ song ngữ viết dạng `'tiếng việt|english'`. Nếu hai thứ tiếng giống nhau thì không cần dấu `|`.

| Hàm | Dạng câu hỏi | Dùng cho game |
|---|---|---|
| `M(câu hỏi, đúng, nhiễu1, nhiễu2…)` | Trắc nghiệm. Đáp án đúng luôn viết **đầu tiên**, server tự xáo trộn | quiz, balloon-pop, boss |
| `B('Câu có ___ chỗ trống', đúng, …)` | Điền chỗ trống | fill-blank |
| `H('từ cần đọc', 'vi'\|'en', đúng, …)` | Nghe và chọn | listen-pick |
| `T(nhận định, true/false)` | Đúng / sai | true-false, boss |
| `P(yêu cầu, [[trái, phải], …])` | Nối cặp, cần 3–6 cặp | drag-match, memory |
| `O(yêu cầu, [thứ tự đúng…])` | Sắp xếp | sort-order |
| `W('từ', gợi ý)` | Ghép chữ, tách theo từng chữ cái | word-builder |
| `C(yêu cầu, [đúng…], [sai…])` | Hứng đồ | catch-fall |

Mỗi màn tự lấy ngẫu nhiên các câu có dạng phù hợp trong chủ đề. Nếu chủ đề thiếu dạng câu mà game cần, màn đó tự chuyển thành game Đố vui.

## 2. Toán: `server/content/math.js`

Mỗi chủ đề có một hàm `gen(rnd, kind)`. Hàm trả về một câu hỏi thuộc dạng `kind` (`mc`, `tf`, `pairs`, `order`, `classify`, `clock`), hoặc `null` nếu chủ đề không có dạng đó.
- Luôn dùng `rnd()` (đã có seed) thay cho `Math.random()`, để mỗi ván chơi tái hiện lại được.
- `numOptions(rnd, đúng, [nhiễu gợi ý])` tạo bộ lựa chọn số không trùng nhau.

## 3. Màn chơi, cửa hàng, huy hiệu, nhiệm vụ: `server/content/index.js`

| Muốn chỉnh | Sửa ở đâu |
|---|---|
| Xu và EXP của từng màn | `buildLessons()` |
| Đồ trong cửa hàng (giá 0 = được tặng sẵn) | `SHOP` |
| Huy hiệu | `BADGES`, với `cond(thống_kê)` là điều kiện đạt |
| Nhiệm vụ ngày | `QUEST_POOL` |

## 4. Kiểm tra sau khi sửa

```bash
npm test
```

Bộ test tự kiểm tra:
- Mọi màn đều tạo được câu hỏi.
- Không có lựa chọn trùng nhau.
- Đủ bản dịch Việt/Anh.
- Đáp án Toán đúng.
