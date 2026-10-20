// Tiếng Anh — bảng từ vựng và ngữ pháp để sinh đề theo mẫu, lớp 1–9.
import { L, makeGen, mc, tf, input, sample, optCount, tierOf } from './engine.js';
import { shuffle } from '../../../shared/logic.js';

const pick = (rnd, a) => a[Math.floor(rnd() * a.length)];

/** Chủ đề từ vựng: 'en=vi=emoji; …' */
const V = (id, grade, vi, en, data) => ({ id, grade, title: L(vi, en), words: data.split(';').map((s) => s.trim()).filter(Boolean).map((s) => { const [w, m, e] = s.split('='); return { en: w.trim(), vi: m.trim(), emoji: e?.trim() || '' }; }) });

export const VOCAB = [
  V('colours', 1, 'Màu sắc', 'Colours', 'red=màu đỏ=🔴; blue=màu xanh dương=🔵; green=màu xanh lá=🟢; yellow=màu vàng=🟡; orange=màu cam=🟠; purple=màu tím=🟣; black=màu đen=⚫; white=màu trắng=⚪; brown=màu nâu=🟤; pink=màu hồng; grey=màu xám'),
  V('animals', 1, 'Con vật', 'Animals', 'cat=con mèo=🐱; dog=con chó=🐶; bird=con chim=🐦; fish=con cá=🐟; duck=con vịt=🦆; cow=con bò=🐄; pig=con lợn=🐷; hen=con gà mái=🐔; horse=con ngựa=🐴; rabbit=con thỏ=🐰; frog=con ếch=🐸; monkey=con khỉ=🐒; elephant=con voi=🐘; tiger=con hổ=🐯; lion=con sư tử=🦁; bear=con gấu=🐻; mouse=con chuột=🐭; sheep=con cừu=🐑; goat=con dê=🐐; bee=con ong=🐝'),
  V('numbers', 1, 'Số đếm 1–10', 'Numbers 1–10', 'one=số 1=1️⃣; two=số 2=2️⃣; three=số 3=3️⃣; four=số 4=4️⃣; five=số 5=5️⃣; six=số 6=6️⃣; seven=số 7=7️⃣; eight=số 8=8️⃣; nine=số 9=9️⃣; ten=số 10=🔟'),
  V('toys', 1, 'Đồ chơi', 'Toys', 'ball=quả bóng=⚽; doll=búp bê=🪆; kite=cái diều=🪁; car=ô tô=🚗; robot=rô-bốt=🤖; teddy bear=gấu bông=🧸; train=tàu hỏa=🚂; bike=xe đạp=🚲; drum=cái trống=🥁; balloon=bóng bay=🎈'),
  V('feelings', 1, 'Cảm xúc', 'Feelings', 'happy=vui=😀; sad=buồn=😢; angry=tức giận=😠; sleepy=buồn ngủ=😴; scared=sợ hãi=😨; hungry=đói; thirsty=khát; tired=mệt'),
  V('body', 2, 'Cơ thể', 'My body', 'head=cái đầu; eye=mắt=👁️; ear=tai=👂; nose=mũi=👃; mouth=miệng=👄; hand=bàn tay=✋; foot=bàn chân=🦶; leg=cái chân=🦵; arm=cánh tay=💪; hair=tóc; tooth=cái răng=🦷; face=khuôn mặt'),
  V('food', 2, 'Đồ ăn, đồ uống', 'Food & drinks', 'rice=cơm=🍚; bread=bánh mì=🍞; egg=quả trứng=🥚; milk=sữa=🥛; apple=quả táo=🍎; banana=quả chuối=🍌; cake=bánh ngọt=🍰; chicken=thịt gà=🍗; noodles=mì sợi=🍜; water=nước=💧; juice=nước ép=🧃; carrot=cà rốt=🥕; grapes=quả nho=🍇; watermelon=dưa hấu=🍉; candy=kẹo=🍬; ice cream=kem=🍦; tea=trà=🍵'),
  V('clothes', 2, 'Quần áo', 'Clothes', 'hat=cái mũ=👒; T-shirt=áo phông=👕; dress=cái váy=👗; shoes=đôi giày=👟; socks=đôi tất=🧦; jacket=áo khoác=🧥; scarf=khăn quàng=🧣; gloves=găng tay=🧤; shorts=quần soóc=🩳; jeans=quần bò=👖; skirt=chân váy; shirt=áo sơ mi=👔'),
  V('family', 2, 'Gia đình', 'Family', 'father=bố; mother=mẹ; brother=anh / em trai; sister=chị / em gái; grandfather=ông; grandmother=bà; baby=em bé; uncle=chú, bác (nam); aunt=cô, dì; cousin=anh chị em họ'),
  V('school', 2, 'Đồ dùng học tập', 'School things', 'pen=bút mực=🖊️; pencil=bút chì=✏️; ruler=thước kẻ=📏; book=quyển sách=📖; school bag=cặp sách=🎒; eraser=cục tẩy; desk=bàn học; chair=cái ghế=🪑; board=cái bảng; crayon=bút sáp=🖍️; scissors=cái kéo=✂️; notebook=quyển vở=📓'),
  V('jobs', 3, 'Nghề nghiệp', 'Jobs', 'teacher=giáo viên=👩‍🏫; doctor=bác sĩ=👨‍⚕️; nurse=y tá; farmer=nông dân=👨‍🌾; driver=tài xế; cook=đầu bếp=👨‍🍳; pilot=phi công=👨‍✈️; police officer=cảnh sát=👮; firefighter=lính cứu hỏa=👨‍🚒; singer=ca sĩ=🎤; worker=công nhân; dentist=nha sĩ'),
  V('weather', 3, 'Thời tiết', 'Weather', 'sunny=có nắng=☀️; rainy=có mưa=🌧️; cloudy=nhiều mây=☁️; windy=có gió=🌬️; snowy=có tuyết=❄️; stormy=có bão=⛈️; hot=nóng=🥵; cold=lạnh=🥶; warm=ấm áp; cool=mát mẻ'),
  V('rooms', 3, 'Phòng trong nhà', 'Rooms', 'kitchen=nhà bếp; bedroom=phòng ngủ=🛏️; bathroom=phòng tắm=🛁; living room=phòng khách=🛋️; garden=khu vườn=🌷; garage=nhà để xe=🚗'),
  V('numbers2', 3, 'Số đếm đến 100', 'Numbers to 100', 'eleven=số 11; twelve=số 12; thirteen=số 13; fifteen=số 15; twenty=số 20; thirty=số 30; forty=số 40; fifty=số 50; sixty=số 60; seventy=số 70; eighty=số 80; ninety=số 90; one hundred=số 100'),
  V('days', 4, 'Các ngày trong tuần', 'Days of the week', 'Monday=thứ Hai; Tuesday=thứ Ba; Wednesday=thứ Tư; Thursday=thứ Năm; Friday=thứ Sáu; Saturday=thứ Bảy; Sunday=Chủ nhật'),
  V('months', 4, 'Các tháng', 'Months', 'January=tháng Một; February=tháng Hai; March=tháng Ba; April=tháng Tư; May=tháng Năm; June=tháng Sáu; July=tháng Bảy; August=tháng Tám; September=tháng Chín; October=tháng Mười; November=tháng Mười Một; December=tháng Mười Hai'),
  V('places', 4, 'Nơi chốn', 'Places', 'school=trường học=🏫; hospital=bệnh viện=🏥; park=công viên=🌳; zoo=sở thú=🦁; supermarket=siêu thị=🛒; post office=bưu điện=📮; bank=ngân hàng=🏦; cinema=rạp chiếu phim=🎬; library=thư viện=📚; museum=bảo tàng=🏛️; market=chợ; bookshop=hiệu sách'),
  V('actions', 4, 'Hoạt động, sở thích', 'Actions & hobbies', 'swim=bơi=🏊; dance=nhảy múa=💃; sing=hát=🎤; draw=vẽ=🎨; read=đọc=📖; cook=nấu ăn=🍳; run=chạy=🏃; jump=nhảy=🤸; ride a bike=đi xe đạp=🚴; play football=đá bóng=⚽; skip=nhảy dây; fly a kite=thả diều=🪁; play chess=chơi cờ=♟️; play the piano=chơi đàn piano=🎹'),
  V('transport', 5, 'Phương tiện', 'Transport', 'plane=máy bay=✈️; train=tàu hỏa=🚆; bus=xe buýt=🚌; boat=con thuyền=⛵; motorbike=xe máy=🏍️; bicycle=xe đạp=🚲; taxi=xe taxi=🚕; ship=tàu thủy=🚢; helicopter=trực thăng=🚁; underground=tàu điện ngầm=🚇'),
  V('health', 5, 'Sức khỏe', 'Health problems', 'headache=đau đầu; toothache=đau răng; stomachache=đau bụng; sore throat=đau họng; fever=sốt; cold=cảm lạnh; cough=ho; earache=đau tai; backache=đau lưng'),
  V('countries', 5, 'Đất nước', 'Countries', 'Viet Nam=Việt Nam=🇻🇳; Japan=Nhật Bản=🇯🇵; China=Trung Quốc=🇨🇳; England=nước Anh; France=nước Pháp=🇫🇷; America=nước Mỹ=🇺🇸; Australia=nước Úc=🇦🇺; Thailand=Thái Lan=🇹🇭; Korea=Hàn Quốc=🇰🇷; Malaysia=Malaysia=🇲🇾'),
  V('house', 6, 'Đồ đạc trong nhà', 'Furniture', 'sofa=ghế sofa=🛋️; bed=giường=🛏️; lamp=đèn bàn; fridge=tủ lạnh; cooker=bếp nấu; wardrobe=tủ quần áo; mirror=cái gương=🪞; table=cái bàn; shelf=cái giá; clock=đồng hồ=🕰️; picture=bức tranh=🖼️; cupboard=tủ bát'),
  V('personality', 6, 'Tính cách', 'Personality', 'kind=tốt bụng; funny=hài hước; shy=nhút nhát; clever=thông minh; friendly=thân thiện; hard-working=chăm chỉ; lazy=lười biếng; creative=sáng tạo; confident=tự tin; caring=chu đáo; talkative=nói nhiều; careful=cẩn thận'),
  V('subjects', 6, 'Môn học', 'School subjects', 'Maths=môn Toán; Science=môn Khoa học; History=môn Lịch sử; Geography=môn Địa lí; Music=môn Âm nhạc; Art=môn Mĩ thuật; Literature=môn Ngữ văn; PE=môn Thể dục; Informatics=môn Tin học; English=môn Tiếng Anh'),
  V('sports', 7, 'Thể thao', 'Sports', 'football=bóng đá=⚽; badminton=cầu lông=🏸; tennis=quần vợt=🎾; swimming=bơi lội=🏊; volleyball=bóng chuyền=🏐; basketball=bóng rổ=🏀; table tennis=bóng bàn=🏓; chess=cờ vua=♟️; cycling=đạp xe=🚴; skiing=trượt tuyết=⛷️; boxing=quyền anh=🥊; karate=võ karate=🥋'),
  V('meals', 7, 'Món ăn', 'Dishes', 'beef=thịt bò; pork=thịt lợn; tofu=đậu phụ; spring rolls=nem rán; soup=món súp=🍲; omelette=trứng tráng=🍳; sandwich=bánh mì kẹp=🥪; yoghurt=sữa chua; lemonade=nước chanh=🍋; pancake=bánh kếp=🥞; sausage=xúc xích=🌭; pasta=mì Ý=🍝'),
  V('festivals', 7, 'Lễ hội', 'Festivals', 'Tet=Tết Nguyên đán; Mid-Autumn Festival=Tết Trung thu=🥮; Christmas=Lễ Giáng sinh=🎄; Easter=Lễ Phục sinh; Halloween=Lễ hội Halloween=🎃; Thanksgiving=Lễ Tạ ơn; fireworks=pháo hoa=🎆; lantern=đèn lồng=🏮; parade=cuộc diễu hành; costume=trang phục hóa trang'),
  V('traffic', 7, 'Giao thông', 'Traffic', 'traffic light=đèn giao thông=🚦; helmet=mũ bảo hiểm=⛑️; seat belt=dây an toàn; pavement=vỉa hè; zebra crossing=vạch kẻ qua đường; road sign=biển báo; passenger=hành khách; cyclist=người đi xe đạp=🚴; pedestrian=người đi bộ=🚶; traffic jam=tắc đường'),
  V('environment', 8, 'Môi trường', 'Environment', 'pollution=sự ô nhiễm; recycle=tái chế=♻️; rubbish=rác=🗑️; plastic bag=túi ni lông; forest=khu rừng=🌲; deforestation=nạn phá rừng; global warming=sự nóng lên toàn cầu=🌡️; energy=năng lượng=⚡; solar panel=tấm pin mặt trời; wildlife=động vật hoang dã; habitat=môi trường sống'),
  V('disasters', 8, 'Thiên tai', 'Natural disasters', 'flood=lũ lụt=🌊; drought=hạn hán; earthquake=động đất; typhoon=bão nhiệt đới=🌀; landslide=lở đất; tsunami=sóng thần; volcano=núi lửa=🌋; tornado=lốc xoáy=🌪️; wildfire=cháy rừng=🔥'),
  V('science', 8, 'Khoa học, vũ trụ', 'Science & space', 'invention=phát minh; experiment=thí nghiệm=🧪; laboratory=phòng thí nghiệm; scientist=nhà khoa học=🧑‍🔬; telescope=kính thiên văn=🔭; microscope=kính hiển vi=🔬; rocket=tên lửa=🚀; satellite=vệ tinh=🛰️; planet=hành tinh=🪐; astronaut=phi hành gia=🧑‍🚀'),
  V('countryside', 8, 'Nông thôn', 'Countryside', 'paddy field=cánh đồng lúa=🌾; buffalo=con trâu=🐃; harvest=vụ thu hoạch; village=ngôi làng; hill=ngọn đồi; stream=con suối; cattle=gia súc; orchard=vườn cây ăn quả; peaceful=yên bình; fresh air=không khí trong lành'),
  V('careers', 9, 'Nghề nghiệp tương lai', 'Careers', 'architect=kiến trúc sư; engineer=kĩ sư; vet=bác sĩ thú y; pharmacist=dược sĩ; journalist=nhà báo; accountant=kế toán; lawyer=luật sư; mechanic=thợ sửa máy; designer=nhà thiết kế; programmer=lập trình viên=💻; tour guide=hướng dẫn viên du lịch'),
  V('technology', 9, 'Công nghệ', 'Technology', 'smartphone=điện thoại thông minh=📱; laptop=máy tính xách tay=💻; password=mật khẩu=🔑; app=ứng dụng; website=trang web; download=tải xuống; upload=tải lên; screen=màn hình; keyboard=bàn phím=⌨️; printer=máy in=🖨️; headphones=tai nghe=🎧; charger=bộ sạc'),
  V('travel', 9, 'Du lịch', 'Travel', 'passport=hộ chiếu=🛂; luggage=hành lí=🧳; ticket=tấm vé=🎫; souvenir=quà lưu niệm; tourist=khách du lịch; hotel=khách sạn=🏨; airport=sân bay=🛫; map=bản đồ=🗺️; sightseeing=việc tham quan; beach=bãi biển=🏖️'),
];

/** Khái niệm từ vựng: nghĩa, hình, nghe, ghép chữ, tự gõ, nối cặp. */
function vocabConcept(v) {
  const items = v.words.map((w) => ({ t: L(w.en), a: L(w.vi), emoji: w.emoji, say: w.en, w }));
  const mine = new Set(v.words.map((w) => w.en.toLowerCase()));
  const others = VOCAB.filter((x) => x !== v && Math.abs(x.grade - v.grade) <= 2).flatMap((x) => x.words).filter((w) => !mine.has(w.en.toLowerCase()));
  return {
    id: v.id, title: v.title,
    items,
    q: {
      fwd: (it) => L(`"${it.w.en}" nghĩa là gì?`, `What does "${it.w.en}" mean?`),
      back: (it, rnd) => (it.emoji && rnd() < 0.5 ? L(`${it.emoji} là gì trong tiếng Anh?`, `${it.emoji} What is this in English?`) : L(`"${it.w.vi}" trong tiếng Anh là gì?`, `How do you say "${it.w.vi}" in English?`)),
      tf: (it, a) => L(`"${it.w.en}" nghĩa là "${a.vi}".`, `"${it.w.en}" means "${a.vi}".`),
      pairs: L('Nối từ tiếng Anh với nghĩa|Match English and Vietnamese'),
      say: 'en',
      classify: (rnd, ctx) => {
        const n = 3 + Math.min(3, tierOf(ctx));
        const ok = sample(rnd, v.words, n).map((w) => w.en);
        const seen = new Set(ok.map((x) => x.toLowerCase()));
        const bad = sample(rnd, others, n + 4).map((w) => w.en).filter((x) => !seen.has(x.toLowerCase()) && seen.add(x.toLowerCase())).slice(0, n + 1);
        return { kind: 'classify', prompt: L(`Hứng các từ thuộc chủ đề "${v.title.vi}"!`, `Catch the "${v.title.en}" words!`), items: [...ok.map((t) => ({ t: L(t), ok: true })), ...bad.map((t) => ({ t: L(t), ok: false }))] };
      },
      word: (it) => (/^[a-zA-Z]{3,8}$/.test(it.w.en) ? { prompt: L(`Ghép từ: ${it.emoji || it.w.vi}`, `Spell: ${it.emoji || it.w.vi}`), answer: it.w.en } : null),
      input: (it) => (it.w.en.length <= 16 ? { prompt: L(`Viết bằng tiếng Anh: ${it.emoji ? it.emoji + ' ' : ''}(${it.w.vi})`, `Type in English: ${it.emoji ? it.emoji + ' ' : ''}(${it.w.vi})`), answer: it.w.en } : null),
    },
  };
}

// ---------- Ngữ pháp ----------
// động từ: nguyên mẫu, ngôi thứ ba số ít, -ing, quá khứ, quá khứ phân từ, nghĩa, cụm bổ ngữ
const VERBS = [
  ['play', 'plays', 'playing', 'played', 'played', 'chơi', 'football'], ['watch', 'watches', 'watching', 'watched', 'watched', 'xem', 'TV'],
  ['read', 'reads', 'reading', 'read', 'read', 'đọc', 'comics'], ['drink', 'drinks', 'drinking', 'drank', 'drunk', 'uống', 'milk'],
  ['eat', 'eats', 'eating', 'ate', 'eaten', 'ăn', 'rice'], ['study', 'studies', 'studying', 'studied', 'studied', 'học', 'English'],
  ['wash', 'washes', 'washing', 'washed', 'washed', 'rửa', 'the dishes'], ['do', 'does', 'doing', 'did', 'done', 'làm', 'homework'],
  ['go', 'goes', 'going', 'went', 'gone', 'đi', 'to school'], ['fly', 'flies', 'flying', 'flew', 'flown', 'thả, bay', 'a kite'],
  ['ride', 'rides', 'riding', 'rode', 'ridden', 'đi (xe)', 'a bike'], ['cook', 'cooks', 'cooking', 'cooked', 'cooked', 'nấu', 'dinner'],
  ['visit', 'visits', 'visiting', 'visited', 'visited', 'thăm', 'Grandma'], ['catch', 'catches', 'catching', 'caught', 'caught', 'bắt', 'the bus'],
  ['write', 'writes', 'writing', 'wrote', 'written', 'viết', 'a letter'], ['swim', 'swims', 'swimming', 'swam', 'swum', 'bơi', 'in the pool'],
  ['buy', 'buys', 'buying', 'bought', 'bought', 'mua', 'some bread'], ['make', 'makes', 'making', 'made', 'made', 'làm', 'a cake'],
  ['take', 'takes', 'taking', 'took', 'taken', 'chụp, lấy', 'photos'], ['sing', 'sings', 'singing', 'sang', 'sung', 'hát', 'a song'],
  ['draw', 'draws', 'drawing', 'drew', 'drawn', 'vẽ', 'a picture'], ['clean', 'cleans', 'cleaning', 'cleaned', 'cleaned', 'lau dọn', 'the room'],
  ['have', 'has', 'having', 'had', 'had', 'ăn, có', 'breakfast'], ['help', 'helps', 'helping', 'helped', 'helped', 'giúp', 'Mum'],
  ['see', 'sees', 'seeing', 'saw', 'seen', 'xem, thấy', 'a film'], ['send', 'sends', 'sending', 'sent', 'sent', 'gửi', 'an email'],
  ['build', 'builds', 'building', 'built', 'built', 'xây', 'a sandcastle'], ['carry', 'carries', 'carrying', 'carried', 'carried', 'mang', 'the bags'],
  ['plant', 'plants', 'planting', 'planted', 'planted', 'trồng', 'trees'], ['speak', 'speaks', 'speaking', 'spoke', 'spoken', 'nói', 'English'],
].map(([base, s, ing, past, pp, vi, obj]) => ({ base, s, ing, past, pp, vi, obj }));
const IRREGULAR = VERBS.filter((v) => v.past !== v.base + 'ed' && v.past !== v.base + 'd' && !/ied$/.test(v.past));
const PEOPLE_1 = [['Tom', 'he'], ['Lan', 'she'], ['Nam', 'he'], ['Mai', 'she'], ['My dad', 'he'], ['My sister', 'she'], ['Ben', 'he'], ['Anna', 'she']];
const PEOPLE_N = ['They', 'We', 'My friends', 'The children'];

function verbConcept(id, grade, vi, en, mode) {
  return {
    id, grade, title: L(vi, en),
    gen(rnd, kind, ctx = {}) {
      const v = pick(rnd, mode === 'irregular' ? IRREGULAR : VERBS);
      const [who] = pick(rnd, PEOPLE_1); const whoMid = who.replace(/^My /, 'my ');
      const plural = pick(rnd, PEOPLE_N);
      const n = optCount(ctx);
      const forms = [v.base, v.s, v.ing, v.past, v.pp].filter((x, i, a) => a.indexOf(x) === i);
      let prompt, right, wrongs;
      if (mode === 'present') { prompt = `${who} ___ ${v.obj} every day. (${v.base})`; right = v.s; wrongs = [v.base, v.ing, v.past]; }
      else if (mode === 'present-plural') { prompt = `${plural} ___ ${v.obj} every day. (${v.base})`; right = v.base; wrongs = [v.s, v.ing, v.past]; }
      else if (mode === 'continuous') { const be = rnd() < 0.5 ? ['is', who] : ['are', plural]; prompt = `Look! ${be[1]} ${be[0]} ___ ${v.obj}. (${v.base})`; right = v.ing; wrongs = [v.base, v.s, v.past]; }
      else if (mode === 'past' || mode === 'irregular') { prompt = `Yesterday ${whoMid} ___ ${v.obj}. (${v.base})`; right = v.past; wrongs = [v.base, v.s, v.ing, v.base + 'ed']; }
      else if (mode === 'future') { prompt = `Tomorrow ${whoMid} will ___ ${v.obj}. (${v.base})`; right = v.base; wrongs = [v.s, v.ing, v.past]; }
      else { prompt = `${who} has already ___ ${v.obj}. (${v.base})`; right = v.pp; wrongs = [v.base, v.ing, v.s, v.past]; }
      wrongs = wrongs.filter((w) => w !== right);
      if (kind === 'mc') return mc(prompt, right, shuffle(rnd, wrongs), n, { blank: true });
      if (kind === 'input') return input(`Điền dạng đúng của động từ: ${prompt}|Type the correct verb form: ${prompt}`, right);
      if (kind === 'tf') { const ok = rnd() < 0.5; const w = ok ? right : pick(rnd, wrongs); const x = prompt.replace('___', w).replace(/ \([^)]*\)$/, ''); return tf(`Câu "${x}" đúng ngữ pháp.|"${x}" is grammatically correct.`, ok); }
      if (kind === 'pairs') {
        const vs = sample(rnd, mode === 'irregular' || mode === 'past' ? VERBS.filter((x) => x.past !== x.base) : VERBS, 3 + Math.min(2, tierOf(ctx)));
        const col = mode === 'present' ? 's' : mode === 'continuous' ? 'ing' : mode === 'perfect' ? 'pp' : 'past';
        const seen = new Set(); const pairs = vs.filter((x) => !seen.has(x[col]) && seen.add(x[col])).map((x) => [L(x.base), L(x[col])]);
        return { kind: 'pairs', prompt: L('Nối động từ với dạng đúng của nó|Match each verb with its form'), pairs };
      }
      if (kind === 'classify' && (mode === 'past' || mode === 'irregular')) {
        const ok = sample(rnd, VERBS.filter((x) => x.past !== x.base), 6).map((x) => x.past).filter((x, i, a) => a.indexOf(x) === i);
        const bad = sample(rnd, VERBS.filter((x) => !ok.includes(x.base) && x.base !== x.past), 7).map((x) => x.base);
        return { kind: 'classify', prompt: L('Hứng các động từ ở QUÁ KHỨ!|Catch the PAST forms!'), items: [...ok.map((t) => ({ t: L(t), ok: true })), ...bad.map((t) => ({ t: L(t), ok: false }))] };
      }
      if (kind === 'order') {
        const words = mode === 'future' ? [who, 'will', v.base, `${v.obj}.`] : mode === 'continuous' ? [who, 'is', v.ing, `${v.obj}.`] : mode === 'present' ? [who, 'often', v.s, `${v.obj}.`] : [who, v.past, v.obj, 'yesterday.'];
        return { kind: 'order', prompt: L('Sắp xếp thành câu đúng|Put the words in order'), items: words.map((w) => L(w)) };
      }
      if (kind === 'word' && /^[a-z]{3,8}$/.test(right) && right !== v.base) return { kind: 'word', prompt: L(`Ghép dạng đúng: ${who} ___ ${v.obj} (${v.base})`, `Spell the right form: ${who} ___ ${v.obj} (${v.base})`), answer: right };
      return null;
    },
  };
}

const PLURALS = [['cat', 'cats'], ['box', 'boxes'], ['bus', 'buses'], ['baby', 'babies'], ['child', 'children'], ['man', 'men'], ['woman', 'women'], ['foot', 'feet'], ['tooth', 'teeth'], ['mouse', 'mice'], ['sheep', 'sheep'], ['leaf', 'leaves'], ['knife', 'knives'], ['tomato', 'tomatoes'], ['potato', 'potatoes'], ['city', 'cities'], ['toy', 'toys'], ['day', 'days'], ['person', 'people'], ['glass', 'glasses'], ['dish', 'dishes'], ['watch', 'watches'], ['wolf', 'wolves'], ['book', 'books'], ['story', 'stories'], ['dress', 'dresses']];
const pluralWrong = (s) => [s + 's', s + 'es', s.replace(/y$/, 'ies'), s.replace(/f(e)?$/, 'ves')];
const plurals = {
  id: 'plurals', grade: 3, title: L('Danh từ số nhiều', 'Plural nouns'),
  gen(rnd, kind, ctx = {}) {
    const [s, p] = pick(rnd, PLURALS);
    const n = 2 + Math.floor(rnd() * 8);
    const num = ['two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'][n - 2];
    if (kind === 'mc') return mc(`I have ${num} ___. (${s})`, p, shuffle(rnd, pluralWrong(s).filter((x) => x !== p).concat(s)), optCount(ctx), { blank: true });
    if (kind === 'input') return input(`Viết dạng số nhiều của "${s}":|Type the plural of "${s}":`, p);
    if (kind === 'tf') { const ok = rnd() < 0.5; const w = ok ? p : pick(rnd, pluralWrong(s).filter((x) => x !== p)); return tf(`Số nhiều của "${s}" là "${w}".|The plural of "${s}" is "${w}".`, ok); }
    if (kind === 'pairs') { const ps = sample(rnd, PLURALS.filter((x) => x[0] !== x[1]), 3 + Math.min(2, tierOf(ctx))); return { kind: 'pairs', prompt: L('Nối số ít với số nhiều|Match singular and plural'), pairs: ps.map(([a, b]) => [L(a), L(b)]) }; }
    if (kind === 'word' && /^[a-z]{3,8}$/.test(p)) return { kind: 'word', prompt: L(`Ghép dạng số nhiều của "${s}"`, `Spell the plural of "${s}"`), answer: p };
    return null;
  },
};

const ADJ = [
  ['big', 'bigger', 'biggest', 'An elephant', 'a mouse', 'The blue whale', 'animal in the world'], ['tall', 'taller', 'tallest', 'A giraffe', 'a horse', 'The giraffe', 'animal on land'],
  ['fast', 'faster', 'fastest', 'A car', 'a bicycle', 'The cheetah', 'land animal'], ['hot', 'hotter', 'hottest', 'Summer', 'winter', 'Summer', 'season of the year'],
  ['heavy', 'heavier', 'heaviest', 'A bag of rice', 'a pencil', 'The elephant', 'land animal'], ['old', 'older', 'oldest', 'My grandpa', 'my dad', 'My grandpa', 'person in my family'],
  ['long', 'longer', 'longest', 'A river', 'a stream', 'The Nile', 'river in Africa'], ['high', 'higher', 'highest', 'A mountain', 'a hill', 'Mount Everest', 'mountain in the world'],
  ['cold', 'colder', 'coldest', 'Winter', 'autumn', 'Winter', 'season of the year'], ['large', 'larger', 'largest', 'The Pacific', 'a lake', 'The Pacific', 'ocean on Earth'],
  ['good', 'better', 'best', 'Fresh fruit', 'sweets', 'Water', 'drink when you are thirsty'], ['bad', 'worse', 'worst', 'A storm', 'light rain', 'A typhoon', 'weather for a picnic'],
  ['beautiful', 'more beautiful', 'most beautiful', 'A rose', 'a weed', 'Ha Long Bay', 'place I have visited'], ['expensive', 'more expensive', 'most expensive', 'A car', 'a bike', 'A plane ticket', 'thing on the list'],
  ['interesting', 'more interesting', 'most interesting', 'A comic', 'a dictionary', 'Science', 'subject for me'], ['easy', 'easier', 'easiest', 'Addition', 'division', 'Addition', 'thing in Maths'],
  ['happy', 'happier', 'happiest', 'A child with a new toy', 'a tired worker', 'My birthday', 'day of the year'], ['small', 'smaller', 'smallest', 'An ant', 'a bee', 'Mercury', 'planet in the Solar System'],
];
function compConcept(id, grade, sup) {
  return {
    id, grade, title: sup ? L('So sánh nhất', 'Superlatives') : L('So sánh hơn', 'Comparatives'),
    gen(rnd, kind, ctx = {}) {
      const [adj, comp, best, A, B, X, cat] = pick(rnd, ADJ);
      const more = adj.length > 5 && !comp.startsWith('more') ? `more ${adj}` : `${adj}er`;
      const right = sup ? best : comp;
      const wrongs = sup ? [comp, adj, `${adj}est`, `most ${adj}`] : [adj, best, more, ...(comp.startsWith('more') ? [] : [`more ${comp}`])];
      const prompt = sup ? `${X} is the ___ ${cat}. (${adj})` : `${A} is ___ than ${B}. (${adj})`;
      const ws = wrongs.filter((w) => w !== right);
      if (kind === 'mc') return mc(prompt, right, shuffle(rnd, ws), optCount(ctx), { blank: true });
      if (kind === 'input') return input(`Điền dạng đúng của tính từ: ${prompt}|Type the correct form: ${prompt}`, right);
      if (kind === 'tf') { const ok = rnd() < 0.5; const w = ok ? right : pick(rnd, ws); const x = prompt.replace('___', w).replace(/ \([^)]*\)$/, ''); return tf(`Câu "${x}" đúng ngữ pháp.|"${x}" is grammatically correct.`, ok); }
      if (kind === 'pairs') { const xs = sample(rnd, ADJ, 3 + Math.min(2, tierOf(ctx))); return { kind: 'pairs', prompt: L(sup ? 'Nối tính từ với dạng so sánh nhất|Match adjective and superlative' : 'Nối tính từ với dạng so sánh hơn|Match adjective and comparative'), pairs: xs.map((x) => [L(x[0]), L(sup ? x[2] : x[1])]) }; }
      return null;
    },
  };
}

const ARTICLES = [['apple', 'an'], ['umbrella', 'an'], ['egg', 'an'], ['orange', 'an'], ['elephant', 'an'], ['owl', 'an'], ['hour', 'an'], ['ice cream', 'an'], ['uniform', 'a'], ['car', 'a'], ['book', 'a'], ['cat', 'a'], ['university', 'a'], ['house', 'a'], ['dog', 'a'], ['pencil', 'a'], ['island', 'an'], ['onion', 'an'], ['kite', 'a'], ['European city', 'a']];
const articles = {
  id: 'articles', grade: 2, title: L('Mạo từ a / an', 'a or an'),
  gen(rnd, kind) {
    const [w, a] = pick(rnd, ARTICLES);
    if (kind === 'mc') return mc(`This is ___ ${w}.`, a, [a === 'a' ? 'an' : 'a'], 2, { blank: true });
    if (kind === 'tf') { const ok = rnd() < 0.5; return tf(`"${ok ? a : a === 'a' ? 'an' : 'a'} ${w}" là cách viết đúng.|"${ok ? a : a === 'a' ? 'an' : 'a'} ${w}" is correct.`, ok); }
    if (kind === 'input') return input(`Điền a hoặc an: ___ ${w}|Type a or an: ___ ${w}`, a);
    if (kind === 'classify') { const ok = sample(rnd, ARTICLES.filter((x) => x[1] === 'an'), 5), bad = sample(rnd, ARTICLES.filter((x) => x[1] === 'a'), 6); return { kind: 'classify', prompt: L('Hứng các từ đi với "an"!|Catch the words that take "an"!'), items: [...ok.map((x) => ({ t: L(x[0]), ok: true })), ...bad.map((x) => ({ t: L(x[0]), ok: false }))] }; }
    return null;
  },
};

const PRONOUNS = [['I', 'me', 'my'], ['you', 'you', 'your'], ['he', 'him', 'his'], ['she', 'her', 'her'], ['we', 'us', 'our'], ['they', 'them', 'their'], ['it', 'it', 'its']];
const pronouns = {
  id: 'pronouns', grade: 5, title: L('Đại từ và tính từ sở hữu', 'Pronouns & possessives'),
  gen(rnd, kind, ctx = {}) {
    const [s, o, p] = pick(rnd, PRONOUNS.filter((x) => x[0] !== 'you' && x[0] !== 'it'));
    const subj = { I: 'I', he: 'Tom', she: 'Lan', we: 'Nam and I', they: 'The children' }[s];
    if (kind === 'mc') {
      if (rnd() < 0.5) { const sent = `${subj} ${s === 'he' || s === 'she' ? 'loves' : 'love'} ___ dog.`; return mc(`${sent} (sở hữu)|${sent} (possessive)`, p, shuffle(rnd, PRONOUNS.map((x) => x[2]).filter((x) => x !== p).concat([s, o])), optCount(ctx), { blank: true }); }
      return mc(`Please help ___. (${s})`, o, shuffle(rnd, [s, p, ...PRONOUNS.map((x) => x[1])].filter((x) => x !== o)), optCount(ctx), { blank: true });
    }
    if (kind === 'pairs') { const xs = sample(rnd, PRONOUNS.filter((x) => x[0] !== x[1]), 3 + Math.min(2, tierOf(ctx))); return { kind: 'pairs', prompt: L('Nối đại từ chủ ngữ với tân ngữ|Match subject and object pronouns'), pairs: xs.map((x) => [L(x[0]), L(x[1])]) }; }
    if (kind === 'input') return input(`Viết tính từ sở hữu của "${s}":|Type the possessive adjective for "${s}":`, p);
    if (kind === 'tf') { const ok = rnd() < 0.5; const w = ok ? p : pick(rnd, PRONOUNS.map((x) => x[2]).filter((x) => x !== p)); return tf(`Tính từ sở hữu của "${s}" là "${w}".|The possessive adjective for "${s}" is "${w}".`, ok); }
    return null;
  },
};

const QWORDS = [['What', 'is your name? – My name is Lan.'], ['Where', 'do you live? – In Ha Noi.'], ['When', 'is your birthday? – In May.'], ['Who', 'is your teacher? – Ms Hoa.'], ['How old', 'are you? – I\'m nine.'], ['How many', 'books do you have? – Five books.'], ['Why', 'are you late? – Because I missed the bus.'], ['How', 'do you go to school? – By bike.'], ['How much', 'is this hat? – It\'s 50,000 dong.']];
const qwords = {
  id: 'questions', grade: 3, title: L('Từ để hỏi', 'Question words'),
  items: QWORDS.map(([w, rest]) => ({ t: L(`___ ${rest}`), a: L(w) })),
  q: {
    fwd: (it) => L(`Chọn từ để hỏi: "${it.t.vi}"`, `Choose the question word: "${it.t.en}"`),
    pairs: L('Nối từ để hỏi với câu hỏi|Match the question word and the question'),
    input: (it) => ({ prompt: L(`Điền từ để hỏi: ${it.t.vi}`, `Type the question word: ${it.t.en}`), answer: it.a.vi }),
    tf: (it, a) => L(`"${it.t.vi.replace('___', a.vi)}" là câu hỏi đúng.`, `"${it.t.en.replace('___', a.en)}" is a correct question.`),
  },
};

// ---------- Ghép theo lớp ----------
const conceptOf = (v) => ({ ...vocabConcept(v), grade: v.grade });
const byGrade = (g) => VOCAB.filter((v) => v.grade === g).map(conceptOf);
const prev = (g) => VOCAB.filter((v) => v.grade === g - 1).map(conceptOf);

export const EN_CONCEPTS = {
  1: [...byGrade(1)],
  2: [...byGrade(2), articles, ...prev(2).slice(0, 2)],
  3: [...byGrade(3), plurals, qwords, verbConcept('present-plural', 3, 'Hiện tại đơn (số nhiều)', 'Present simple – they / we', 'present-plural')],
  4: [...byGrade(4), verbConcept('present', 4, 'Hiện tại đơn (ngôi thứ ba)', 'Present simple – he / she', 'present'), verbConcept('continuous', 4, 'Hiện tại tiếp diễn', 'Present continuous', 'continuous')],
  5: [...byGrade(5), pronouns, verbConcept('past', 5, 'Quá khứ đơn', 'Past simple', 'past'), verbConcept('future', 5, 'Tương lai đơn', 'Future with will', 'future')],
  6: [...byGrade(6), verbConcept('continuous6', 6, 'Hiện tại tiếp diễn', 'Present continuous', 'continuous'), compConcept('comparatives', 6, false)],
  7: [...byGrade(7), verbConcept('irregular', 7, 'Động từ bất quy tắc', 'Irregular verbs', 'irregular'), compConcept('superlatives', 7, true)],
  8: [...byGrade(8), verbConcept('perfect', 8, 'Hiện tại hoàn thành', 'Present perfect', 'perfect'), compConcept('comparatives8', 8, false)],
  9: [...byGrade(9), verbConcept('irregular9', 9, 'Động từ bất quy tắc', 'Irregular verbs', 'irregular'), verbConcept('perfect9', 9, 'Hiện tại hoàn thành', 'Present perfect', 'perfect'), compConcept('superlatives9', 9, true)],
};
export const enGen = (c) => makeGen(c);
