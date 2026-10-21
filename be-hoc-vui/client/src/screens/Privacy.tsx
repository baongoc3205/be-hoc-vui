// Trang Chính sách quyền riêng tư (song ngữ). BẢN NHÁP — nên nhờ người có chuyên môn pháp lý rà lại
// theo Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15 trước khi phát hành chính thức.
import { useT } from '../lib/hooks';
import { go, useApp } from '../lib/store';
import { Panel, TopBar } from '../ui/kit';

/** Sửa các giá trị này cho đúng với trang web của bạn. */
export const POLICY = {
  version: '2026-10b',
  updated: '21/10/2026',
  contact: '', // email liên hệ của người quản lý trang, ví dụ 'behocvui@gmail.com'
  serverVi: 'Render (máy chủ tại Singapore) và Turso (cơ sở dữ liệu tại Nhật Bản)',
  serverEn: 'Render (servers in Singapore) and Turso (database in Japan)',
};

type Sec = { h: string; p: string[] };
function content(lang: 'vi' | 'en'): Sec[] {
  const contact = POLICY.contact || (lang === 'vi' ? 'người quản lý trang web' : 'the site owner');
  if (lang === 'en') return [
    { h: 'Who this is for', p: ['Bé Học Vui is a learning game for children in grades 1–9. Accounts are created and managed by a parent or guardian. Children only use a nickname; they never need to give their real name, email, photo or location.'] },
    { h: 'What we store', p: ['Parent account: email (used only as the sign-in name), an optional display name, the password and the recovery code (both stored only as one-way scrypt hashes, never in plain text).', 'Each child profile: nickname, grade, the character look they chose, learning progress (levels played, stars, answers right or wrong, minutes played), check-ins, badges, coins and items.', 'Friends and chat (only when a parent leaves them on): the child’s friend code, friend list, messages sent to and from friends, blocks and reports the child made. Game rooms with friends exist only in server memory and disappear when the game ends.', 'Technical data: one sign-in cookie; error reports from the browser (the error text, the screen and browser type, without names or emails) kept for 30 days; network addresses used only to block password guessing, kept for at most 1 day.'] },
    { h: 'What we use it for', p: ['Only to run the game: saving progress, showing parents the report, letting you reset a forgotten password with your recovery code, and fixing bugs.'] },
    { h: 'Friends, chat and the leaderboard', p: ['The everyone leaderboard shows a child’s nickname, grade, level, character look and weekly points, and other children can open that public profile and send a friend request. Parents can hide a child from it in the Parents area.', 'Children can only chat with players who accepted their friend request. Messages automatically hide phone numbers, emails, links, social-media names and rude words; children can block and report. Parents can read their child’s recent messages and turn off friends and chat entirely.'] },
    { h: 'What we never do', p: ['No advertising, no selling or renting data, no tracking across other websites, no profiling of children. We never show a child’s real name, school, photo or location — we don’t collect them.'] },
    { h: 'Where it is kept', p: [`Data is stored with ${POLICY.serverEn}. We send no emails and share nothing with email or advertising services.`] },
    { h: 'How long', p: ['As long as the account exists. Guest accounts that never create a child profile are deleted after 7 days; guest accounts whose sign-in has expired are deleted too.'] },
    { h: 'Your rights', p: ['In the Parents area you can view the report and messages, turn friends/chat and the everyone leaderboard on or off, change a child\'s nickname and grade, delete a child profile, download all your family\'s data as a file, or delete the whole account. Deleting removes every record about you and your children from the database.'] },
    { h: 'Contact', p: [`Questions or requests about your data: contact ${contact}.`] },
  ];
  return [
    { h: 'Trang này dành cho ai', p: ['Bé Học Vui là game học tập cho học sinh lớp 1 đến lớp 9. Tài khoản do cha mẹ hoặc người giám hộ tạo và quản lý. Bé chỉ dùng biệt danh, không bao giờ phải nhập tên thật, email, ảnh hay vị trí.'] },
    { h: 'Chúng tôi lưu những gì', p: ['Tài khoản phụ huynh: email (chỉ dùng làm tên đăng nhập), tên hiển thị (không bắt buộc), mật khẩu và mã khôi phục (cả hai chỉ lưu dạng băm một chiều scrypt, không bao giờ lưu bản gốc).', 'Mỗi hồ sơ bé: biệt danh, lớp, ngoại hình nhân vật bé chọn, tiến độ học (màn đã chơi, số sao, câu đúng/sai, số phút chơi), điểm danh, huy hiệu, xu và đồ đã mua.', 'Bạn bè và tin nhắn (chỉ khi phụ huynh để bật): mã kết bạn, danh sách bạn, tin nhắn bé gửi và nhận từ bạn bè, danh sách chặn và báo cáo bé đã gửi. Phòng chơi cùng bạn chỉ nằm trong bộ nhớ máy chủ và mất khi ván kết thúc.', 'Dữ liệu kỹ thuật: một cookie đăng nhập; báo lỗi từ trình duyệt (nội dung lỗi, màn hình, loại trình duyệt, không có tên hay email), giữ 30 ngày; địa chỉ mạng chỉ dùng để chặn dò mật khẩu, giữ tối đa 1 ngày.'] },
    { h: 'Dùng để làm gì', p: ['Chỉ để vận hành game: lưu tiến độ, hiện báo cáo cho phụ huynh, cho phép đặt lại mật khẩu bằng mã khôi phục, và sửa lỗi.'] },
    { h: 'Bạn bè, tin nhắn và bảng xếp hạng', p: ['Bảng xếp hạng toàn app hiện biệt danh, lớp, cấp độ, hình nhân vật và điểm tuần của bé; các bé khác có thể mở hồ sơ công khai này và gửi lời mời kết bạn. Phụ huynh có thể ẩn bé khỏi bảng này trong Góc phụ huynh.', 'Bé chỉ nhắn tin được với bạn đã đồng ý kết bạn. Tin nhắn tự che số điện thoại, email, đường link, tên mạng xã hội và từ ngữ thô tục; bé có nút chặn và báo cáo. Phụ huynh xem được tin nhắn gần đây của bé và có thể tắt hẳn kết bạn, nhắn tin.'] },
    { h: 'Những điều chúng tôi không làm', p: ['Không quảng cáo, không bán hay cho thuê dữ liệu, không theo dõi bạn trên trang web khác, không lập hồ sơ hành vi của trẻ. Không bao giờ hiện tên thật, trường, ảnh hay vị trí của bé — chúng tôi không thu thập những thông tin đó.'] },
    { h: 'Dữ liệu được lưu ở đâu', p: [`Dữ liệu được lưu trên ${POLICY.serverVi}. Chúng tôi không gửi email và không chia sẻ dữ liệu với dịch vụ email hay quảng cáo nào.`] },
    { h: 'Lưu trong bao lâu', p: ['Trong suốt thời gian tài khoản còn tồn tại. Tài khoản khách không tạo hồ sơ bé nào sẽ bị xoá sau 7 ngày; tài khoản khách đã hết phiên đăng nhập cũng bị xoá.'] },
    { h: 'Quyền của phụ huynh', p: ['Trong Góc phụ huynh, bạn có thể xem báo cáo, xem tin nhắn, bật/tắt kết bạn và bảng xếp hạng toàn app, sửa biệt danh và lớp của bé, xoá hồ sơ bé, tải toàn bộ dữ liệu của gia đình về máy, hoặc xoá hẳn tài khoản. Khi xoá, mọi dữ liệu về bạn và các bé bị xoá khỏi cơ sở dữ liệu.'] },
    { h: 'Liên hệ', p: [`Mọi câu hỏi hoặc yêu cầu về dữ liệu: liên hệ ${contact}.`] },
  ];
}

export function Privacy() {
  const T = useT();
  const parent = useApp((s) => s.parent);
  const secs = content(T.lang);
  return (
    <div className="screen parents">
      <div className="screen-content">
        <TopBar title={T.t('privacyPolicy')} onBack={() => (history.length > 1 ? history.back() : go(parent ? 'lobby' : 'auth'))} hideHud />
        <div className="privacy">
          <Panel head={<h2>{T.t('privacyPolicy')}</h2>}>
            <p className="muted" style={{ margin: 0, fontWeight: 700 }}>{T.lang === 'vi' ? `Cập nhật ${POLICY.updated} · phiên bản ${POLICY.version}` : `Updated ${POLICY.updated} · version ${POLICY.version}`}</p>
            {secs.map((s) => (
              <section key={s.h}>
                <h3>{s.h}</h3>
                {s.p.map((t, i) => <p key={i}>{t}</p>)}
              </section>
            ))}
          </Panel>
        </div>
      </div>
    </div>
  );
}
