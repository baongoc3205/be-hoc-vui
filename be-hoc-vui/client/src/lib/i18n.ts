// Đa ngôn ngữ Việt / Anh. tx() đọc chữ song ngữ từ dữ liệu, t() đọc chuỗi giao diện.
import type { Lang, LText } from './types';

const vi = {
  appName: 'Bé Học Vui',
  tagline: 'Học mà chơi, chơi mà học',
  start: 'Bắt đầu', next: 'Tiếp tục', back: 'Quay lại', cancel: 'Hủy', ok: 'Đồng ý', confirm: 'Xác nhận', close: 'Đóng', save: 'Lưu', play: 'Chơi', retry: 'Chơi lại', check: 'Kiểm tra', claim: 'Nhận', open: 'Mở', buy: 'Mua', equip: 'Mặc', equipped: 'Đang mặc', owned: 'Đã có', loading: 'Đang tải…', notice: 'Thông báo',
  // auth
  login: 'Đăng nhập', register: 'Đăng ký', logout: 'Đăng xuất', email: 'Email', password: 'Mật khẩu', parentName: 'Tên phụ huynh',
  guest: 'Chơi thử không cần tài khoản', authTitle: 'Tài khoản phụ huynh', authHint: 'Phụ huynh đăng nhập để lưu tiến độ học của bé trên mọi thiết bị.',
  haveAccount: 'Đã có tài khoản?', noAccount: 'Chưa có tài khoản?',
  // profiles & onboarding
  whoPlays: 'Ai đang học hôm nay?', addChild: 'Thêm bé', grade: 'Lớp', gradeN: 'Lớp {n}',
  obName: 'Bé tên là gì?', obNameHint: 'Biệt danh tối đa 12 ký tự (không cần tên thật).', obGrade: 'Bé đang học lớp mấy?', obLook: 'Chọn nhân vật của bé', obDone: 'Xong rồi!', step: 'Bước {n}/3',
  // lobby
  lobby: 'Sảnh', learn: 'Học tập', quests: 'Nhiệm vụ', treasure: 'Kho báu', shop: 'Cửa hàng', character: 'Nhân vật', ranking: 'Xếp hạng', settings: 'Cài đặt',
  hello: 'Chào {name}!', morning: 'Chào buổi sáng', afternoon: 'Chào buổi chiều', evening: 'Chào buổi tối', lateNight: 'Khuya rồi, mình đi ngủ sớm nhé 🌙',
  todayPick: 'Gợi ý hôm nay', nextLevel: 'Màn tiếp theo', levelN: 'Màn {n}', allDone: 'Bé đã hoàn thành hết rồi! Thử lớp khác nhé.',
  streakDays: '{n} ngày liên tiếp', dailyChest: 'Rương mỗi ngày', chestReady: 'Mở rương!', chestTomorrow: 'Quay lại ngày mai nhé',
  todayMinutes: 'Hôm nay: {m} phút',
  // worlds & map
  chooseWorld: 'Chọn thế giới', progress: 'Tiến độ', stars: 'Sao', locked: 'Chưa mở', chest: 'Rương báu', boss: 'Trùm',
  lessonGoal: 'Mục tiêu', goal1: '★ Đúng 40%', goal2: '★★ Đúng 70%', goal3: '★★★ Đúng 90%', reward: 'Phần thưởng', energyCost: 'Tốn 1 năng lượng',
  chestOpened: 'Bé nhận được {n} xu!', openChest: 'Mở rương',
  // play
  pause: 'Tạm dừng', quit: 'Thoát', quitAsk: 'Bé muốn dừng màn này? Tiến độ màn này sẽ không được lưu.', keepPlaying: 'Chơi tiếp',
  listen: 'Nghe', listenAgain: 'Nghe lại', showText: 'Xem chữ', hint: 'Gợi ý',
  correct: ['Giỏi quá!', 'Chính xác!', 'Tuyệt vời!', 'Đỉnh luôn!', 'Siêu ghê!'], wrong: ['Gần đúng rồi!', 'Không sao, thử tiếp nhé!', 'Mình cùng xem lại nha!'],
  rightAnswer: 'Đáp án đúng: {a}', combo: 'COMBO x{n}!', trueWord: 'Đúng', falseWord: 'Sai',
  tfAsk: 'Đúng hay sai?', fillHint: 'Chọn từ thích hợp điền vào chỗ trống', matchHint: 'Chạm một thẻ bên trái rồi chạm thẻ phù hợp bên phải', memoryHint: 'Lật hai thẻ giống nhau', sortHint: 'Kéo thả hoặc dùng mũi tên để sắp xếp', wordHint: 'Chạm chữ cái để ghép thành từ', clockHint: 'Kéo kim dài (phút) và kim ngắn (giờ)', catchHint: 'Di chuyển giỏ để hứng đúng thứ cần hứng', raceHint: 'Trả lời đúng để xe tăng tốc!', balloonHint: 'Chạm quả bóng có đáp án đúng', swipeHint: 'Vuốt phải = Đúng, vuốt trái = Sai',
  hits: 'Hứng đúng: {n}', mistakes: 'Nhầm: {n}', position: 'Hạng {n}', finish: 'Về đích!', ready: 'Sẵn sàng!', go: 'Bắt đầu!',
  heartsOut: 'Hết tim rồi! Mình cùng ôn lại nhé.',
  // result
  complete: 'Hoàn thành!', almost: 'Sắp được rồi!', newRecord: 'Kỷ lục mới!', coinsEarned: 'Xu', xpEarned: 'Kinh nghiệm', correctCount: 'Đúng {c}/{t}', levelUp: 'Lên cấp {n}!', newBadge: 'Huy hiệu mới!',
  // character
  info: 'Thông tin', outfit: 'Trang phục', achievements: 'Thành tích', exp: 'EXP', skills: 'Kỹ năng môn học', keepLearning: 'Học tiếp', dressUp: 'Trang phục',
  stLessons: 'Màn đã qua', stStars: 'Ngôi sao', stCorrect: 'Câu đúng', stStreak: 'Chuỗi ngày', stBadges: 'Huy hiệu', stCoins: 'Xu',
  slot_hair: 'Kiểu tóc', slot_hairColor: 'Màu tóc', slot_ears: 'Tai thú', slot_outfit: 'Trang phục', slot_outfitColor: 'Màu áo', slot_acc: 'Phụ kiện', slot_shoes: 'Giày dép', slot_hold: 'Đồ cầm tay', slot_scene: 'Cảnh nền', slot_skin: 'Màu da',
  notOwned: 'Chưa có — mua ở Cửa hàng', saved: 'Đã lưu!',
  // shop
  buyAsk: 'Mua "{name}" với giá {price} xu?', notEnough: 'Bé chưa đủ xu. Chơi thêm vài màn nhé!', bought: 'Đã mua!', tryOn: 'Thử đồ',
  // rewards
  dailyQuests: 'Nhiệm vụ hôm nay', badgesTitle: 'Bộ sưu tập huy hiệu', earned: 'Đã đạt', notEarned: 'Chưa đạt', chestTitle: 'Rương mỗi ngày', chestGot: 'Bé nhận được {c} xu và {e} năng lượng!',
  // ranking
  familyBoard: 'Bảng thi đua gia đình (7 ngày)', xpWeek: '{n} EXP', onlyFamily: 'Chỉ hiển thị các bé trong gia đình.',
  // settings
  language: 'Ngôn ngữ', sound: 'Âm thanh', music: 'Nhạc nền', voice: 'Giọng đọc', autoRead: 'Tự đọc câu hỏi', reduceMotion: 'Giảm chuyển động', parentsArea: 'Góc phụ huynh', switchChild: 'Đổi hồ sơ',
  // parents
  gateTitle: 'Dành cho phụ huynh', gateAsk: 'Nhập kết quả để tiếp tục:', gateWrong: 'Chưa đúng, thử lại nhé.',
  report: 'Báo cáo', week: '7 ngày qua', minutes: 'phút', accuracy: 'Độ chính xác', recent: 'Hoạt động gần đây', noData: 'Chưa có dữ liệu',
  limit: 'Giới hạn thời gian mỗi ngày', noLimit: 'Không giới hạn', energySys: 'Cơ chế năng lượng (giới hạn số màn liên tục)', boardOn: 'Hiện trên bảng xếp hạng gia đình',
  editChild: 'Sửa hồ sơ', deleteChild: 'Xoá hồ sơ', deleteAsk: 'Xoá hồ sơ của {name}? Toàn bộ tiến độ sẽ mất và không thể khôi phục.', enterPassword: 'Nhập mật khẩu để xác nhận',
  account: 'Tài khoản', guestAccount: 'Bạn đang dùng tài khoản khách. Tạo tài khoản để không mất dữ liệu.', createAccount: 'Tạo tài khoản', changePassword: 'Đổi mật khẩu', currentPassword: 'Mật khẩu hiện tại', newPassword: 'Mật khẩu mới',
  done: 'Đã xong', lessonsDone: '{n} màn', timeLimitReached: 'Hôm nay bé học chăm lắm rồi! Nghỉ ngơi và quay lại vào ngày mai nhé 🌙',
  noEnergy: 'Hết năng lượng rồi! Nghỉ một chút nhé, năng lượng sẽ hồi sau {m} phút.', energyFull: 'Đầy',
  eyeBreak: 'Đã 20 phút rồi! Bé hãy nhìn ra xa và chớp mắt vài lần nhé 👀',
  err_OFFLINE: 'Không kết nối được máy chủ. Kiểm tra mạng nhé.', err_BAD_CREDENTIALS: 'Email hoặc mật khẩu chưa đúng.', err_EMAIL_TAKEN: 'Email này đã được đăng ký.', err_BAD_EMAIL: 'Email chưa hợp lệ.', err_WEAK_PASSWORD: 'Mật khẩu cần ít nhất 6 ký tự.', err_NICKNAME_NOT_ALLOWED: 'Biệt danh này chưa phù hợp, chọn tên khác nhé.', err_NICKNAME_REQUIRED: 'Hãy nhập biệt danh.', err_MAX_CHILDREN: 'Tối đa 4 hồ sơ mỗi tài khoản.', err_TOO_MANY_ATTEMPTS: 'Thử quá nhiều lần. Vui lòng đợi 15 phút.', err_LESSON_LOCKED: 'Màn này chưa mở.', err_NOT_ENOUGH_COINS: 'Chưa đủ xu.', err_SERVER_ERROR: 'Có lỗi xảy ra, thử lại sau nhé.', err_DAILY_LIMIT: 'Đã hết thời gian học hôm nay.', err_NO_ENERGY: 'Hết năng lượng.',
  checkin: 'Điểm danh', checkinTitle: 'Điểm danh 7 ngày', checkinBtn: 'Điểm danh nhận quà', checkinDone: 'Hôm nay đã điểm danh rồi! Mai quay lại nhé', checkinDay: 'Ngày {n}', checkinGot: '+{c} xu, +{e} năng lượng', checkinGift: 'Quà bí mật', checkinGiftGot: 'Quà ngày 7: {name}!', checkinHint: 'Điểm danh liền 7 ngày để nhận quà thời trang. Bỏ lỡ 1 ngày sẽ bắt đầu lại từ ngày 1.', checkinTotal: 'Đã điểm danh {n} ngày', checkinToday: 'Hôm nay', checkinDoneShort: 'Đã điểm danh ✓', checkinLater: 'Để sau', checkinWelcome: 'Chào bé! Điểm danh hôm nay nhé',
  guestWarn: 'Đang dùng tài khoản khách: tiến độ chỉ lưu trên máy này.', saveProgress: 'Lưu tiến độ', err_ALREADY_CHECKED_IN: 'Hôm nay bé đã điểm danh rồi.', err_NOT_REGISTERED: 'Hãy tạo tài khoản trước.', showPw: 'Hiện', hidePw: 'Ẩn',
  subjectsShort: { math: 'Toán', vietnamese: 'T. Việt', english: 'T. Anh', science: 'K. Học' },
};
type Dict = typeof vi;

const en: Dict = {
  appName: 'Bé Học Vui', tagline: 'Learn by playing, play by learning',
  start: 'Start', next: 'Continue', back: 'Back', cancel: 'Cancel', ok: 'OK', confirm: 'Confirm', close: 'Close', save: 'Save', play: 'Play', retry: 'Retry', check: 'Check', claim: 'Claim', open: 'Open', buy: 'Buy', equip: 'Wear', equipped: 'Wearing', owned: 'Owned', loading: 'Loading…', notice: 'Notice',
  login: 'Log in', register: 'Sign up', logout: 'Log out', email: 'Email', password: 'Password', parentName: 'Parent name',
  guest: 'Try without an account', authTitle: 'Parent account', authHint: 'Parents sign in to keep your child\'s progress on every device.',
  haveAccount: 'Have an account?', noAccount: 'No account yet?',
  whoPlays: 'Who is learning today?', addChild: 'Add child', grade: 'Grade', gradeN: 'Grade {n}',
  obName: 'What\'s your name?', obNameHint: 'A nickname up to 12 letters (no real name needed).', obGrade: 'Which grade are you in?', obLook: 'Pick your character', obDone: 'All set!', step: 'Step {n}/3',
  lobby: 'Lobby', learn: 'Learn', quests: 'Quests', treasure: 'Treasure', shop: 'Shop', character: 'Character', ranking: 'Ranking', settings: 'Settings',
  hello: 'Hi {name}!', morning: 'Good morning', afternoon: 'Good afternoon', evening: 'Good evening', lateNight: 'It\'s late — time for bed soon 🌙',
  todayPick: 'Today\'s pick', nextLevel: 'Next level', levelN: 'Level {n}', allDone: 'You finished everything! Try another grade.',
  streakDays: '{n}-day streak', dailyChest: 'Daily chest', chestReady: 'Open chest!', chestTomorrow: 'Come back tomorrow',
  todayMinutes: 'Today: {m} min',
  chooseWorld: 'Choose a world', progress: 'Progress', stars: 'Stars', locked: 'Locked', chest: 'Treasure chest', boss: 'Boss',
  lessonGoal: 'Goal', goal1: '★ 40% correct', goal2: '★★ 70% correct', goal3: '★★★ 90% correct', reward: 'Reward', energyCost: 'Costs 1 energy',
  chestOpened: 'You got {n} coins!', openChest: 'Open chest',
  pause: 'Pause', quit: 'Quit', quitAsk: 'Stop this level? Progress for this level won\'t be saved.', keepPlaying: 'Keep playing',
  listen: 'Listen', listenAgain: 'Listen again', showText: 'Show word', hint: 'Hint',
  correct: ['Great job!', 'Correct!', 'Awesome!', 'Brilliant!', 'Super!'], wrong: ['So close!', 'No worries, try the next one!', 'Let\'s look again!'],
  rightAnswer: 'Answer: {a}', combo: 'COMBO x{n}!', trueWord: 'True', falseWord: 'False',
  tfAsk: 'True or false?', fillHint: 'Pick the word that fills the gap', matchHint: 'Tap a card on the left, then its match on the right', memoryHint: 'Flip two matching cards', sortHint: 'Drag or use the arrows to sort', wordHint: 'Tap letters to build the word', clockHint: 'Drag the long (minute) and short (hour) hands', catchHint: 'Move the basket to catch the right things', raceHint: 'Answer right to speed up!', balloonHint: 'Tap the balloon with the right answer', swipeHint: 'Swipe right = True, left = False',
  hits: 'Caught: {n}', mistakes: 'Oops: {n}', position: 'Place {n}', finish: 'Finish!', ready: 'Ready!', go: 'Go!',
  heartsOut: 'Out of hearts! Let\'s review together.',
  complete: 'Complete!', almost: 'Almost there!', newRecord: 'New record!', coinsEarned: 'Coins', xpEarned: 'Experience', correctCount: '{c}/{t} correct', levelUp: 'Level {n}!', newBadge: 'New badge!',
  info: 'Profile', outfit: 'Outfit', achievements: 'Badges', exp: 'EXP', skills: 'Subject skills', keepLearning: 'Keep learning', dressUp: 'Outfit',
  stLessons: 'Levels passed', stStars: 'Stars', stCorrect: 'Correct answers', stStreak: 'Day streak', stBadges: 'Badges', stCoins: 'Coins',
  slot_hair: 'Hair style', slot_hairColor: 'Hair colour', slot_ears: 'Ears', slot_outfit: 'Outfit', slot_outfitColor: 'Outfit colour', slot_acc: 'Accessory', slot_shoes: 'Shoes', slot_hold: 'In hand', slot_scene: 'Scene', slot_skin: 'Skin',
  notOwned: 'Not owned — get it in the Shop', saved: 'Saved!',
  buyAsk: 'Buy "{name}" for {price} coins?', notEnough: 'Not enough coins yet. Play a few more levels!', bought: 'Bought!', tryOn: 'Try on',
  dailyQuests: 'Today\'s quests', badgesTitle: 'Badge collection', earned: 'Earned', notEarned: 'Not yet', chestTitle: 'Daily chest', chestGot: 'You got {c} coins and {e} energy!',
  familyBoard: 'Family leaderboard (7 days)', xpWeek: '{n} EXP', onlyFamily: 'Only children in your family are shown.',
  language: 'Language', sound: 'Sound', music: 'Music', voice: 'Voice', autoRead: 'Read questions aloud', reduceMotion: 'Reduce motion', parentsArea: 'Parents\' corner', switchChild: 'Switch profile',
  gateTitle: 'For parents', gateAsk: 'Enter the answer to continue:', gateWrong: 'Not quite, try again.',
  report: 'Report', week: 'Last 7 days', minutes: 'min', accuracy: 'Accuracy', recent: 'Recent activity', noData: 'No data yet',
  limit: 'Daily time limit', noLimit: 'No limit', energySys: 'Energy system (limits back-to-back levels)', boardOn: 'Show on family leaderboard',
  editChild: 'Edit profile', deleteChild: 'Delete profile', deleteAsk: 'Delete {name}\'s profile? All progress will be lost for good.', enterPassword: 'Enter your password to confirm',
  account: 'Account', guestAccount: 'You are using a guest account. Create an account to keep your data safe.', createAccount: 'Create account', changePassword: 'Change password', currentPassword: 'Current password', newPassword: 'New password',
  done: 'Done', lessonsDone: '{n} levels', timeLimitReached: 'You studied so well today! Rest now and come back tomorrow 🌙',
  noEnergy: 'Out of energy! Take a short break — energy refills in {m} min.', energyFull: 'Full',
  eyeBreak: '20 minutes already! Look far away and blink a few times 👀',
  err_OFFLINE: 'Can\'t reach the server. Check your connection.', err_BAD_CREDENTIALS: 'Wrong email or password.', err_EMAIL_TAKEN: 'This email is already registered.', err_BAD_EMAIL: 'Please enter a valid email.', err_WEAK_PASSWORD: 'Password needs at least 6 characters.', err_NICKNAME_NOT_ALLOWED: 'Please choose a different nickname.', err_NICKNAME_REQUIRED: 'Please enter a nickname.', err_MAX_CHILDREN: 'Up to 4 profiles per account.', err_TOO_MANY_ATTEMPTS: 'Too many attempts. Please wait 15 minutes.', err_LESSON_LOCKED: 'This level is locked.', err_NOT_ENOUGH_COINS: 'Not enough coins.', err_SERVER_ERROR: 'Something went wrong, please try again.', err_DAILY_LIMIT: 'Today\'s study time is used up.', err_NO_ENERGY: 'Out of energy.',
  checkin: 'Check-in', checkinTitle: '7-day check-in', checkinBtn: 'Check in for a gift', checkinDone: 'Checked in today! Come back tomorrow', checkinDay: 'Day {n}', checkinGot: '+{c} coins, +{e} energy', checkinGift: 'Mystery gift', checkinGiftGot: 'Day-7 gift: {name}!', checkinHint: 'Check in 7 days in a row for a fashion gift. Miss a day and you start again from day 1.', checkinTotal: 'Checked in on {n} days', checkinToday: 'Today', checkinDoneShort: 'Checked in ✓', checkinLater: 'Later', checkinWelcome: 'Hi! Check in for today',
  guestWarn: 'Guest account: progress is only saved on this device.', saveProgress: 'Save progress', err_ALREADY_CHECKED_IN: 'Already checked in today.', err_NOT_REGISTERED: 'Please create an account first.', showPw: 'Show', hidePw: 'Hide',
  subjectsShort: { math: 'Maths', vietnamese: 'Viet.', english: 'English', science: 'Science' },
};

export const DICTS: Record<Lang, Dict> = { vi, en };
type StrKey = { [K in keyof Dict]: Dict[K] extends string ? K : never }[keyof Dict];

export function makeT(lang: Lang) {
  const d = DICTS[lang];
  const t = (key: StrKey, vars?: Record<string, string | number>) => {
    let s = d[key] as string;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
    return s;
  };
  const tx = (x: LText | string | null | undefined) => (x == null ? '' : typeof x === 'string' ? x : x[lang] ?? x.vi);
  const pickOne = (key: 'correct' | 'wrong') => { const arr = d[key]; return arr[Math.floor(Math.random() * arr.length)]; };
  return { t, tx, pickOne, d, lang };
}
export type T = ReturnType<typeof makeT>;
