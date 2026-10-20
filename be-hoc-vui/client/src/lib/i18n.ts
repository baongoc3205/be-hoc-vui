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
  arcade: 'Khu vui chơi', arcadeShort: 'Vui chơi', arcadeSub: 'Mini game vừa chơi vừa học, câu hỏi đúng lớp của bé', pickSubject: 'Chơi với câu hỏi môn nào?', anySubject: 'Trộn tất cả', playAgain: 'Chơi tiếp', streakShort: '{n} ngày liền',
  'ad_fruit-slice': 'Vuốt chém trái cây mang đáp án đúng', 'ad_candy-match': 'Ghép 3 viên kẹo cùng màu với đáp án', ad_slingshot: 'Kéo ná, bắn trúng thùng có đáp án', 'ad_draw-trace': 'Tô theo nét chấm để vẽ hình, viết số', 'ad_balloon-pop': 'Chạm bóng bay có đáp án đúng', 'ad_catch-fall': 'Hứng những thứ đúng yêu cầu', 'ad_math-race': 'Trả lời nhanh để xe về đích',
  typeHint: 'Gõ đáp án vào ô rồi bấm Kiểm tra', typePlaceholder: 'Gõ đáp án…', typeFraction: 'Viết phân số tối giản, ví dụ 2/3', typeMarks: 'Đúng rồi! Nhớ viết đủ dấu: {a}', multiHint: 'Chọn TẤT CẢ đáp án đúng rồi bấm Kiểm tra', multiPicked: 'Đã chọn {n}', readHint: 'Đọc kĩ đoạn văn rồi trả lời', passage: 'Đoạn văn', 'ad_type-answer': 'Tự gõ đáp án, không có gợi ý', 'ad_multi-pick': 'Chọn đủ mọi đáp án đúng', ad_reading: 'Đọc đoạn văn và trả lời câu hỏi',
  sliceHint: 'Vuốt qua trái cây có đáp án đúng!', candyHint: 'Đổi chỗ 2 viên kẹo cạnh nhau để xếp 3 viên cùng màu với đáp án đúng.', candyShort: 'Xếp 3 viên kẹo cùng màu đáp án đúng!', slingHint: 'Kéo ná về sau rồi thả tay để bắn!', slingAssist: 'Nhìn đường chấm trắng để ngắm nhé!', traceHint: 'Bắt đầu từ chấm xanh, tô theo nét chấm', erase: 'Xoá', doneDraw: 'Xong',
  consentLabel: 'Tôi đã đọc và đồng ý với', privacyPolicy: 'Chính sách quyền riêng tư', guestConsent: 'Bấm chơi thử nghĩa là bạn đồng ý với', forgot: 'Quên mật khẩu?', forgotTitle: 'Đặt lại mật khẩu', forgotHint: 'Nhập email và mã khôi phục bạn đã lưu khi đăng ký, rồi đặt mật khẩu mới.', confirmPassword: 'Nhập lại mật khẩu', pwMismatch: 'Hai mật khẩu chưa giống nhau.',
  noVoice: 'Máy này chưa có giọng đọc tiếng Việt. Có thể cài thêm trong Cài đặt → Ngôn ngữ / Văn bản thành giọng nói của máy, hoặc bé đọc chữ trên màn hình nhé.', noSpeech: 'Trình duyệt này không hỗ trợ đọc to. Hãy thử Chrome, Edge hoặc Safari.',
  recoveryTitle: 'Mã khôi phục tài khoản', recoveryWhy: 'Hãy lưu mã này: chụp màn hình, chép ra giấy hoặc tải file. Khi quên mật khẩu, nhập email và mã này để đặt mật khẩu mới. Mã chỉ hiện một lần.', recoveryCode: 'Mã khôi phục', copy: 'Sao chép', copied: 'Đã chép mã', downloadFile: 'Tải file', savedCheck: 'Tôi đã lưu mã ở nơi an toàn', goOn: 'Tiếp tục', forgotNoCode: 'Không có mã khôi phục? Nếu còn đăng nhập ở một máy khác, vào Góc phụ huynh để tạo mã mới.', newRecovery: 'Tạo mã khôi phục mới', noRecoveryYet: 'Tài khoản chưa có mã khôi phục. Tạo ngay để không bị mất tài khoản khi quên mật khẩu.', err_BAD_RECOVERY: 'Email hoặc mã khôi phục chưa đúng.', resetBtn: 'Đặt mật khẩu mới',
  waking: 'Máy chủ đang thức dậy, chờ chút nhé…', wakingHint: 'Lần mở đầu tiên sau một lúc không ai dùng có thể mất tới 1 phút.', tryAgain: 'Thử lại',
  familyData: 'Dữ liệu gia đình', exportData: 'Tải dữ liệu về máy', deleteAccount: 'Xoá tài khoản', deleteAccountAsk: 'Xoá vĩnh viễn tài khoản cùng toàn bộ hồ sơ và tiến độ của các bé? Không thể khôi phục.', accountDeleted: 'Đã xoá tài khoản.',
  err_CONSENT_REQUIRED: 'Hãy đánh dấu đồng ý với Chính sách quyền riêng tư.', err_RESET_EXPIRED: 'Đường link đã hết hạn hoặc đã được dùng. Hãy yêu cầu link mới.',
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
  arcade: 'Playground', arcadeShort: 'Play', arcadeSub: 'Mini games that teach, with questions for your grade', pickSubject: 'Which subject should the questions be?', anySubject: 'Mix them all', playAgain: 'Play again', streakShort: '{n}-day run',
  'ad_fruit-slice': 'Swipe to slice the fruit with the right answer', 'ad_candy-match': 'Match 3 candies of the answer’s colour', ad_slingshot: 'Pull the slingshot and hit the right crate', 'ad_draw-trace': 'Trace the dots to draw shapes and digits', 'ad_balloon-pop': 'Pop the balloon with the right answer', 'ad_catch-fall': 'Catch the things that fit the rule', 'ad_math-race': 'Answer fast to win the race',
  typeHint: 'Type your answer, then press Check', typePlaceholder: 'Type the answer…', typeFraction: 'Write the fraction in lowest terms, e.g. 2/3', typeMarks: 'Right! Remember the accents: {a}', multiHint: 'Pick ALL the right answers, then press Check', multiPicked: '{n} picked', readHint: 'Read the passage carefully, then answer', passage: 'Passage', 'ad_type-answer': 'Type the answer yourself, no choices', 'ad_multi-pick': 'Pick every right answer', ad_reading: 'Read a passage and answer questions',
  sliceHint: 'Swipe through the fruit with the right answer!', candyHint: 'Swap two neighbouring candies to line up 3 of the right answer’s colour.', candyShort: 'Line up 3 candies of the right colour!', slingHint: 'Pull back and let go to shoot!', slingAssist: 'Follow the white dots to aim!', traceHint: 'Start at the green dot and follow the dots', erase: 'Clear', doneDraw: 'Done',
  consentLabel: 'I have read and agree to the', privacyPolicy: 'Privacy policy', guestConsent: 'By trying it out you agree to the', forgot: 'Forgot password?', forgotTitle: 'Reset password', forgotHint: 'Enter your email and the recovery code you saved when signing up, then choose a new password.', confirmPassword: 'Repeat password', pwMismatch: 'The two passwords do not match.',
  noVoice: 'This device has no voice for this language. You can add one in the device settings (Language / Text-to-speech), or read the text on screen.', noSpeech: 'This browser cannot read aloud. Try Chrome, Edge or Safari.',
  recoveryTitle: 'Account recovery code', recoveryWhy: 'Save this code: take a screenshot, write it down or download the file. If you forget your password, enter your email and this code to set a new one. It is shown only once.', recoveryCode: 'Recovery code', copy: 'Copy', copied: 'Code copied', downloadFile: 'Download file', savedCheck: 'I have saved the code somewhere safe', goOn: 'Continue', forgotNoCode: 'No recovery code? If you are still signed in on another device, open the Parents area there to make a new one.', newRecovery: 'Make a new recovery code', noRecoveryYet: 'This account has no recovery code yet. Make one now so a forgotten password never locks you out.', err_BAD_RECOVERY: 'Wrong email or recovery code.', resetBtn: 'Set new password',
  waking: 'The server is waking up, one moment…', wakingHint: 'The first visit after a quiet spell can take up to a minute.', tryAgain: 'Try again',
  familyData: 'Family data', exportData: 'Download my data', deleteAccount: 'Delete account', deleteAccountAsk: 'Permanently delete this account with every child profile and all progress? This cannot be undone.', accountDeleted: 'Account deleted.',
  err_CONSENT_REQUIRED: 'Please tick the box to accept the privacy policy.', err_RESET_EXPIRED: 'This link has expired or was already used. Ask for a new one.',
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
