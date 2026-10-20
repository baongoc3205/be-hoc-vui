// Khoa học (TN&XH → Khoa học → KHTN) — bảng sự kiện để sinh đề theo mẫu, lớp 1–9.
import { L, mc, tf, input, sample, optCount, tierOf } from './engine.js';
import { CAT, MATCH } from './vi.js';
import { shuffle, randInt } from '../../../shared/logic.js';

const pick = (rnd, a) => a[Math.floor(rnd() * a.length)];
const fmt = (n) => String(Math.round(n * 1000) / 1000).replace('.', ',');
const fmtEn = (n) => String(Math.round(n * 1000) / 1000);

// ---------- Bảng con vật: tên | nơi sống | thức ăn | sinh sản | số chân | nhóm | xương sống | biết bay ----------
const A = (s) => s.split(';').map((r) => { const [name, home, food, birth, legs, group, fly] = r.split(',').map((x) => x.trim()); return { name, home, food, birth, legs: legs === '-' ? null : Number(legs), group, fly: fly === 'y' }; });
const ANIMALS = A(`🐱 mèo|🐱 cat, land, meat, live, 4, thu, n; 🐶 chó|🐶 dog, land, omni, live, 4, thu, n; 🐄 bò|🐄 cow, land, plant, live, 4, thu, n;
🐃 trâu|🐃 buffalo, land, plant, live, 4, thu, n; 🐴 ngựa|🐴 horse, land, plant, live, 4, thu, n; 🐰 thỏ|🐰 rabbit, land, plant, live, 4, thu, n;
🐯 hổ|🐯 tiger, land, meat, live, 4, thu, n; 🦁 sư tử|🦁 lion, land, meat, live, 4, thu, n; 🐘 voi|🐘 elephant, land, plant, live, 4, thu, n;
🦒 hươu cao cổ|🦒 giraffe, land, plant, live, 4, thu, n; 🐐 dê|🐐 goat, land, plant, live, 4, thu, n; 🐬 cá heo|🐬 dolphin, water, meat, live, 0, thu, n;
🐳 cá voi|🐳 whale, water, meat, live, 0, thu, n; 🦇 dơi|🦇 bat, land, omni, live, -, thu, y; 🐔 gà|🐔 chicken, land, omni, egg, 2, chim, n;
🦆 vịt|🦆 duck, both, omni, egg, 2, chim, y; 🐦 chim sẻ|🐦 sparrow, land, omni, egg, 2, chim, y; 🦅 đại bàng|🦅 eagle, land, meat, egg, 2, chim, y;
🐧 chim cánh cụt|🐧 penguin, both, meat, egg, 2, chim, n; 🦜 vẹt|🦜 parrot, land, plant, egg, 2, chim, y; 🐟 cá vàng|🐟 goldfish, water, omni, egg, 0, ca, n;
🐠 cá chép|🐠 carp, water, omni, egg, 0, ca, n; 🐸 ếch|🐸 frog, both, meat, egg, 4, luong, n; 🐢 rùa|🐢 turtle, both, omni, egg, 4, bosat, n;
🐍 rắn|🐍 snake, land, meat, egg, 0, bosat, n; 🐊 cá sấu|🐊 crocodile, both, meat, egg, 4, bosat, n; 🦎 thằn lằn|🦎 lizard, land, meat, egg, 4, bosat, n;
🐝 ong|🐝 bee, land, plant, egg, 6, contrung, y; 🦋 bướm|🦋 butterfly, land, plant, egg, 6, contrung, y; 🐜 kiến|🐜 ant, land, omni, egg, 6, contrung, n;
🦟 muỗi|🦟 mosquito, land, -, egg, 6, contrung, y; 🕷️ nhện|🕷️ spider, land, meat, egg, 8, khac, n; 🦀 cua|🦀 crab, water, omni, egg, 10, khac, n;
🦐 tôm|🦐 shrimp, water, omni, egg, 10, khac, n; 🪱 giun đất|🪱 earthworm, land, plant, egg, 0, khac, n; 🐌 ốc sên|🐌 snail, land, plant, egg, 0, khac, n`.replace(/\n/g, ' '));
const animalCat = (id, grade, title, attr, cats, fwd, filter = () => true) => {
  const c = CAT(id, grade, title, { cats, data: {}, fwd });
  c.items = ANIMALS.filter((a) => a[attr] in cats && filter(a)).map((a) => ({ t: L(a.name), a: a[attr] }));
  return c;
};
const habitat = animalCat('habitat', 1, 'Nơi sống của con vật|Where animals live', 'home', {
  land: ['Sống trên cạn|On land', 'Con vật nào sống trên cạn?|Which animal lives on land?', 'Hứng các con vật SỐNG TRÊN CẠN!|Catch the LAND animals!', '{t} sống trên cạn.|The {t} lives on land.'],
  water: ['Sống dưới nước|In water', 'Con vật nào sống dưới nước?|Which animal lives in water?', 'Hứng các con vật SỐNG DƯỚI NƯỚC!|Catch the WATER animals!', '{t} sống dưới nước.|The {t} lives in water.'],
  both: ['Vừa ở nước vừa ở cạn|Both water and land', 'Con vật nào sống được cả dưới nước và trên cạn?|Which animal lives both in water and on land?', 'Hứng các con vật sống được CẢ DƯỚI NƯỚC VÀ TRÊN CẠN!|Catch animals living in water AND on land!', '{t} sống được cả dưới nước và trên cạn.|The {t} lives in water and on land.'],
}, '{t} sống ở đâu?|Where does the {t} live?');
const diet = animalCat('diet', 2, 'Thức ăn của con vật|What animals eat', 'food', {
  plant: ['Ăn thực vật|Eats plants', 'Con vật nào ăn thực vật (cỏ, lá, hạt, mật hoa)?|Which animal eats plants?', 'Hứng các con vật ĂN THỰC VẬT!|Catch the PLANT-EATERS!', '{t} ăn thực vật.|The {t} eats plants.'],
  meat: ['Ăn thịt, ăn động vật khác|Eats other animals', 'Con vật nào ăn thịt (ăn động vật khác)?|Which animal eats other animals?', 'Hứng các con vật ĂN THỊT!|Catch the MEAT-EATERS!', '{t} ăn thịt (ăn động vật khác).|The {t} eats other animals.'],
  omni: ['Ăn cả thực vật và động vật|Eats plants and animals', 'Con vật nào ăn tạp (cả thực vật lẫn động vật)?|Which animal eats both plants and animals?', 'Hứng các con vật ĂN TẠP!|Catch the animals that eat EVERYTHING!', '{t} ăn tạp (cả thực vật lẫn động vật).|The {t} eats both plants and animals.'],
}, 'Thức ăn của {t} là gì?|What does the {t} eat?', (a) => a.home !== 'water' || a.group === 'thu');
const birth = animalCat('birth', 5, 'Đẻ trứng hay đẻ con|Eggs or live young', 'birth', {
  egg: ['Đẻ trứng|Lays eggs', 'Con vật nào đẻ trứng?|Which animal lays eggs?', 'Hứng các con vật ĐẺ TRỨNG!|Catch the animals that LAY EGGS!', '{t} đẻ trứng.|The {t} lays eggs.'],
  live: ['Đẻ con|Gives birth to live young', 'Con vật nào đẻ con?|Which animal gives birth to live young?', 'Hứng các con vật ĐẺ CON!|Catch the animals that give birth to LIVE YOUNG!', '{t} đẻ con.|The {t} gives birth to live young.'],
}, '{t} đẻ trứng hay đẻ con?|Does the {t} lay eggs or give birth?');
const groups = animalCat('groups', 3, 'Nhóm động vật|Animal groups', 'group', {
  thu: ['Thú (có vú)|Mammal', 'Con vật nào thuộc nhóm thú?|Which animal is a mammal?', 'Hứng các con THÚ!|Catch the MAMMALS!', '{t} thuộc nhóm thú.|The {t} is a mammal.'],
  chim: ['Chim|Bird', 'Con vật nào thuộc nhóm chim?|Which animal is a bird?', 'Hứng các loài CHIM!|Catch the BIRDS!', '{t} thuộc nhóm chim.|The {t} is a bird.'],
  ca: ['Cá|Fish', 'Con vật nào thuộc nhóm cá?|Which animal is a fish?', 'Hứng các loài CÁ!|Catch the FISH!', '{t} thuộc nhóm cá.|The {t} is a fish.'],
  bosat: ['Bò sát|Reptile', 'Con vật nào thuộc nhóm bò sát?|Which animal is a reptile?', 'Hứng các loài BÒ SÁT!|Catch the REPTILES!', '{t} thuộc nhóm bò sát.|The {t} is a reptile.'],
  contrung: ['Côn trùng|Insect', 'Con vật nào là côn trùng?|Which animal is an insect?', 'Hứng các loài CÔN TRÙNG!|Catch the INSECTS!', '{t} là côn trùng.|The {t} is an insect.'],
}, '{t} thuộc nhóm động vật nào?|Which group does the {t} belong to?');
const backbone = (() => {
  const c = CAT('backbone', 3, 'Động vật có xương sống|Animals with a backbone', {
    cats: {
      y: ['Có xương sống|Has a backbone', 'Con vật nào CÓ xương sống?|Which animal HAS a backbone?', 'Hứng các con vật CÓ XƯƠNG SỐNG!|Catch animals WITH a backbone!', '{t} có xương sống.|The {t} has a backbone.'],
      n: ['Không có xương sống|No backbone', 'Con vật nào KHÔNG có xương sống?|Which animal has NO backbone?', 'Hứng các con vật KHÔNG CÓ XƯƠNG SỐNG!|Catch animals WITHOUT a backbone!', '{t} không có xương sống.|The {t} has no backbone.'],
    }, data: {}, fwd: '{t} có xương sống không?|Does the {t} have a backbone?',
  });
  c.items = ANIMALS.map((a) => ({ t: L(a.name), a: ['contrung', 'khac'].includes(a.group) ? 'n' : 'y' }));
  return c;
})();
const flyers = (() => {
  const c = CAT('flyers', 2, 'Con vật biết bay|Animals that fly', {
    cats: {
      y: ['Biết bay|Can fly', 'Con vật nào biết bay?|Which animal can fly?', 'Hứng các con vật BIẾT BAY!|Catch the animals that can FLY!', '{t} biết bay.|The {t} can fly.'],
      n: ['Không biết bay|Cannot fly', 'Con vật nào KHÔNG biết bay?|Which animal CANNOT fly?', 'Hứng các con vật KHÔNG BIẾT BAY!|Catch the animals that CANNOT fly!', '{t} không biết bay.|The {t} cannot fly.'],
    }, data: {}, fwd: '{t} có biết bay không?|Can the {t} fly?',
  });
  c.items = ANIMALS.filter((a) => a.name !== '🐔 gà|🐔 chicken').map((a) => ({ t: L(a.name), a: a.fly ? 'y' : 'n' }));
  return c;
})();
const legs = {
  id: 'legs', grade: 2, title: L('Đếm chân con vật', 'Counting legs'),
  gen(rnd, kind, ctx = {}) {
    const pool = ANIMALS.filter((a) => a.legs !== null && a.legs > 0 && a.legs <= 10);
    const a = pick(rnd, pool), nm = L(a.name);
    if (kind === 'input') return input(`${nm.vi} có mấy chân? (viết số)|How many legs does the ${nm.en.replace(/^\S+ /, '')} have? (number)`, a.legs);
    if (kind === 'mc') return mc(`${nm.vi} có mấy chân?|How many legs does the ${nm.en.replace(/^\S+ /, '')} have?`, String(a.legs), shuffle(rnd, ['2', '4', '6', '8', '10', '0']), optCount(ctx));
    if (kind === 'tf') { const ok = rnd() < 0.5; const n = ok ? a.legs : pick(rnd, [2, 4, 6, 8].filter((x) => x !== a.legs)); return tf(`${nm.vi} có ${n} chân.|The ${nm.en.replace(/^\S+ /, '')} has ${n} legs.`, ok); }
    if (kind === 'order') { const xs = shuffle(rnd, [2, 4, 6, 8].map((n) => pool.filter((p) => p.legs === n)).filter((g) => g.length).map((g) => pick(rnd, g))).sort((p, q) => p.legs - q.legs); return xs.length >= 3 ? { kind: 'order', prompt: L('Xếp các con vật theo số chân từ ít đến nhiều|Order the animals from fewest to most legs'), items: xs.map((p) => L(p.name)) } : null; }
    if (kind === 'classify') { const n = pick(rnd, [2, 4, 6]); const ok = sample(rnd, pool.filter((p) => p.legs === n), 6), bad = sample(rnd, pool.filter((p) => p.legs !== n), 7); return { kind: 'classify', prompt: L(`Hứng các con vật có ${n} chân!|Catch the animals with ${n} legs!`), items: [...ok.map((p) => ({ t: L(p.name), ok: true })), ...bad.map((p) => ({ t: L(p.name), ok: false }))] }; }
    return null;
  },
};

// ---------- Cơ thể, sức khỏe, an toàn ----------
const senses = MATCH('senses', 1, 'Các giác quan|The senses', '👀 Mắt|👀 Eyes=nhìn|see; 👂 Tai|👂 Ears=nghe|hear; 👃 Mũi|👃 Nose=ngửi|smell; 👅 Lưỡi|👅 Tongue=nếm|taste; ✋ Da|✋ Skin=cảm nhận nóng, lạnh|feel hot and cold',
  { fwd: 'Bộ phận {t} giúp ta làm gì?|What do our {t} help us do?', back: 'Bộ phận nào giúp ta {a}?|Which part helps us {a}?', tf: '{t} giúp ta {a}.|Our {t} help us {a}.', pairs: 'Nối giác quan với việc làm|Match sense and job' });
const healthyFood = CAT('healthy', 1, 'Thói quen ăn uống lành mạnh|Healthy eating', {
  cats: { y: ['Tốt cho sức khỏe|Healthy', 'Món nào tốt cho sức khỏe?|Which is healthy?', 'Hứng những thứ TỐT cho sức khỏe!|Catch the HEALTHY things!', '{t} tốt cho sức khỏe.|{t} is good for your health.'], n: ['Không nên ăn nhiều|Not healthy to have a lot', 'Món nào KHÔNG nên ăn nhiều?|Which should you NOT have a lot of?', 'Hứng những thứ KHÔNG NÊN ăn nhiều!|Catch the things to AVOID eating a lot!', '{t} không nên ăn nhiều.|You should not have a lot of {t}.'] },
  data: { y: '🥦 rau xanh|🥦 vegetables; 🍎 hoa quả|🍎 fruit; 🥛 sữa|🥛 milk; 🐟 cá|🐟 fish; 🥚 trứng|🥚 eggs; 💧 nước lọc|💧 water; 🍚 cơm|🍚 rice; 🥕 cà rốt|🥕 carrots', n: '🍬 kẹo|🍬 sweets; 🥤 nước ngọt có ga|🥤 fizzy drinks; 🍟 khoai tây chiên|🍟 chips; 🍩 bánh rán ngọt|🍩 doughnuts; 🍭 kẹo mút|🍭 lollipops; 🍫 sô-cô-la|🍫 chocolate' },
  fwd: '{t}: nên ăn uống thế nào?|{t}: how much should you have?',
});
const safety = CAT('safety', 1, 'An toàn cho bé|Staying safe', {
  cats: { y: ['Việc làm an toàn|Safe', 'Việc làm nào AN TOÀN?|Which action is SAFE?', 'Hứng các việc làm AN TOÀN!|Catch the SAFE actions!', '"{t}" là việc làm an toàn.|"{t}" is safe.'], n: ['Việc làm nguy hiểm|Dangerous', 'Việc làm nào NGUY HIỂM?|Which action is DANGEROUS?', 'Hứng các việc làm NGUY HIỂM!|Catch the DANGEROUS actions!', '"{t}" là việc làm nguy hiểm.|"{t}" is dangerous.'] },
  data: { y: 'Đội mũ bảo hiểm|Wear a helmet; Nắm tay người lớn khi qua đường|Hold an adult\'s hand to cross; Đi bộ trên vỉa hè|Walk on the pavement; Rửa tay bằng xà phòng|Wash hands with soap; Đeo áo phao khi đi thuyền|Wear a life jacket on a boat; Ngồi yên khi đi xe|Sit still in a vehicle', n: 'Chơi với lửa, diêm|Play with fire or matches; Chạy nhảy dưới lòng đường|Run about on the road; Chạm tay vào ổ điện|Touch electric sockets; Trèo lên lan can|Climb on railings; Tắm sông một mình|Swim in a river alone; Đi theo người lạ|Go off with strangers' },
  fwd: '"{t}" an toàn hay nguy hiểm?|Is "{t}" safe or dangerous?',
});
const weatherItems = MATCH('weather', 1, 'Thời tiết và trang phục|Weather & what to wear', '🌧️ Trời mưa|🌧️ Rainy=☂️ ô, áo mưa|☂️ umbrella, raincoat; ☀️ Trời nắng to|☀️ Very sunny=👒 mũ rộng vành|👒 sun hat; ❄️ Trời rét|❄️ Very cold=🧥 áo ấm, khăn len|🧥 coat and scarf; 🥵 Trời nóng|🥵 Hot=👕 áo mỏng, thoáng mát|👕 light, cool clothes; 🌬️ Trời gió lạnh|🌬️ Cold wind=🧤 găng tay, áo khoác|🧤 gloves and jacket',
  { fwd: '{t}: em nên dùng gì?|{t}: what should you wear or use?', back: 'Khi nào em dùng {a}?|When do you use {a}?', tf: '{t} nên dùng {a}.|{t}: use {a}.', pairs: 'Nối thời tiết với trang phục|Match the weather and what to wear' });
const organs = MATCH('organs', 2, 'Cơ quan trong cơ thể|Body organs', 'Tim|Heart=bơm máu đi khắp cơ thể|pumps blood around the body; Phổi|Lungs=trao đổi khí khi thở|exchange gases when we breathe; Dạ dày|Stomach=co bóp, nghiền nhỏ thức ăn|churns and breaks down food; Não|Brain=điều khiển mọi hoạt động|controls everything we do; Xương|Bones=nâng đỡ cơ thể|support the body; Cơ|Muscles=giúp cơ thể cử động|help the body move; Thận|Kidneys=lọc máu, tạo nước tiểu|filter blood and make urine; Mũi|Nose=dẫn khí, cản bụi|carries air and blocks dust',
  { fwd: '{t} có chức năng gì?|What does the {t} do?', back: 'Cơ quan nào {a}?|Which organ {a}?', tf: '{t}: {a}.|The {t}: {a}.', pairs: 'Nối cơ quan với chức năng|Match organ and job' });
const bodySystems = CAT('systems', 8, 'Các hệ cơ quan|Body systems', {
  cats: {
    th: ['Hệ tiêu hóa|Digestive system', 'Cơ quan nào thuộc hệ tiêu hóa?|Which organ is digestive?', 'Hứng các cơ quan HỆ TIÊU HÓA!|Catch the DIGESTIVE organs!', '{t} thuộc hệ tiêu hóa.|The {t} is part of the digestive system.'],
    hh: ['Hệ hô hấp|Respiratory system', 'Cơ quan nào thuộc hệ hô hấp?|Which organ is respiratory?', 'Hứng các cơ quan HỆ HÔ HẤP!|Catch the RESPIRATORY organs!', '{t} thuộc hệ hô hấp.|The {t} is part of the respiratory system.'],
    tu: ['Hệ tuần hoàn|Circulatory system', 'Cơ quan nào thuộc hệ tuần hoàn?|Which is circulatory?', 'Hứng các bộ phận HỆ TUẦN HOÀN!|Catch the CIRCULATORY parts!', '{t} thuộc hệ tuần hoàn.|The {t} is part of the circulatory system.'],
    bt: ['Hệ bài tiết|Excretory system', 'Cơ quan nào thuộc hệ bài tiết nước tiểu?|Which organ is excretory?', 'Hứng các cơ quan HỆ BÀI TIẾT!|Catch the EXCRETORY organs!', '{t} thuộc hệ bài tiết.|The {t} is part of the excretory system.'],
    tk: ['Hệ thần kinh|Nervous system', 'Bộ phận nào thuộc hệ thần kinh?|Which is part of the nervous system?', 'Hứng các bộ phận HỆ THẦN KINH!|Catch the NERVOUS system parts!', '{t} thuộc hệ thần kinh.|The {t} is part of the nervous system.'],
  },
  data: { th: 'miệng|mouth; thực quản|oesophagus; dạ dày|stomach; ruột non|small intestine; ruột già|large intestine; gan|liver', hh: 'mũi|nose; khí quản|windpipe; phế quản|bronchi; phổi|lungs', tu: 'tim|heart; động mạch|arteries; tĩnh mạch|veins; mao mạch|capillaries', bt: 'thận|kidneys; ống dẫn nước tiểu|ureters; bóng đái|bladder', tk: 'não|brain; tủy sống|spinal cord; dây thần kinh|nerves' },
  fwd: '{t} thuộc hệ cơ quan nào?|Which system is the {t} part of?', pairs: 'Nối cơ quan với hệ cơ quan|Match organ and system',
});

// ---------- Thực vật ----------
const plantParts = MATCH('plantparts', 3, 'Bộ phận của cây|Plant parts', 'Rễ|Root=hút nước và muối khoáng|takes in water and minerals; Thân|Stem=vận chuyển nước, nâng đỡ cây|carries water and holds the plant up; Lá|Leaf=quang hợp, tạo chất dinh dưỡng|makes food by photosynthesis; Hoa|Flower=sinh sản, tạo quả và hạt|reproduction: makes fruit and seeds; Quả|Fruit=bảo vệ và chứa hạt|protects and holds the seeds; Hạt|Seed=nảy mầm thành cây mới|grows into a new plant',
  { fwd: '{t} của cây có chức năng gì?|What does the {t} do?', back: 'Bộ phận nào của cây {a}?|Which part of a plant {a}?', tf: '{t} của cây: {a}.|The {t}: {a}.', pairs: 'Nối bộ phận của cây với chức năng|Match plant part and job' });
const foodParts = CAT('foodparts', 3, 'Ta ăn bộ phận nào của cây?|Which part do we eat?', {
  cats: {
    root: ['Rễ (củ)|Root', 'Ta ăn RỄ của cây nào?|Which plant do we eat the ROOT of?', 'Hứng các loại ta ăn phần RỄ!|Catch the foods that are ROOTS!', 'Ta ăn phần rễ của {t}.|We eat the root of the {t}.'],
    stem: ['Thân|Stem', 'Ta ăn THÂN của cây nào?|Which plant do we eat the STEM of?', 'Hứng các loại ta ăn phần THÂN!|Catch the foods that are STEMS!', 'Ta ăn phần thân của {t}.|We eat the stem of the {t}.'],
    leaf: ['Lá|Leaf', 'Ta ăn LÁ của cây nào?|Which plant do we eat the LEAVES of?', 'Hứng các loại ta ăn phần LÁ!|Catch the foods that are LEAVES!', 'Ta ăn phần lá của {t}.|We eat the leaves of the {t}.'],
    flower: ['Hoa|Flower', 'Ta ăn HOA của cây nào?|Which plant do we eat the FLOWERS of?', 'Hứng các loại ta ăn phần HOA!|Catch the foods that are FLOWERS!', 'Ta ăn phần hoa của {t}.|We eat the flowers of the {t}.'],
    fruit: ['Quả|Fruit', 'Ta ăn QUẢ của cây nào?|Which plant do we eat the FRUIT of?', 'Hứng các loại ta ăn phần QUẢ!|Catch the foods that are FRUITS!', 'Ta ăn quả của {t}.|We eat the fruit of the {t}.'],
    seed: ['Hạt|Seed', 'Ta ăn HẠT của cây nào?|Which plant do we eat the SEEDS of?', 'Hứng các loại ta ăn phần HẠT!|Catch the foods that are SEEDS!', 'Ta ăn hạt của {t}.|We eat the seeds of the {t}.'],
  },
  data: { root: '🥕 cà rốt|🥕 carrot; củ cải|radish; khoai lang|sweet potato', stem: 'su hào|kohlrabi; măng tre|bamboo shoot; mía|sugar cane; khoai tây|potato', leaf: '🥬 rau cải|🥬 leafy greens; bắp cải|cabbage; xà lách|lettuce', flower: '🥦 súp lơ|🥦 broccoli; hoa thiên lí|tonkin creeper flower', fruit: '🍎 táo|🍎 apple; 🍊 cam|🍊 orange; 🍉 dưa hấu|🍉 watermelon; 🍅 cà chua|🍅 tomato', seed: '🥜 lạc|🥜 peanut; đậu xanh|mung bean; 🌽 ngô|🌽 corn; gạo|rice' },
  fwd: 'Ta ăn bộ phận nào của {t}?|Which part of the {t} do we eat?', pairs: 'Nối cây với bộ phận ta ăn|Match plant and the part we eat',
});
const plantNeeds = CAT('plantneeds', 1, 'Cây cần gì để sống?|What plants need', {
  cats: { y: ['Cây cần|Needed', 'Cây cần thứ nào để sống?|What does a plant need?', 'Hứng những thứ CÂY CẦN để sống!|Catch what PLANTS NEED!', 'Cây cần {t} để sống.|Plants need {t}.'], n: ['Cây không cần|Not needed', 'Thứ nào cây KHÔNG cần?|What does a plant NOT need?', 'Hứng những thứ cây KHÔNG CẦN!|Catch what plants DO NOT need!', 'Cây cần {t} để sống.|Plants need {t}.'] },
  data: { y: '💧 nước|💧 water; ☀️ ánh sáng|☀️ light; 🌬️ không khí|🌬️ air; 🟫 đất, chất khoáng|🟫 soil and minerals', n: '🍬 kẹo|🍬 sweets; 🥤 nước ngọt|🥤 fizzy drinks; 🎵 âm nhạc|🎵 music; 📺 ti vi|📺 TV; 🌑 bóng tối hoàn toàn|🌑 total darkness' },
  fwd: 'Cây có cần {t} để sống không?|Does a plant need {t}?',
});
plantNeeds.cats.n.stmt = (t) => L(`Cây không cần ${t.vi} để sống.`, `Plants do not need ${t.en}.`);
const lifeCycles = {
  id: 'cycles', grade: 2, title: L('Vòng đời', 'Life cycles'),
  items: [], q: {},
  gen(rnd, kind) {
    const C = [
      ['Sắp xếp vòng đời của ếch|Order the frog life cycle', ['Trứng|Eggs', 'Nòng nọc|Tadpole', 'Nòng nọc mọc chân|Tadpole with legs', 'Ếch con|Froglet', 'Ếch trưởng thành|Adult frog']],
      ['Sắp xếp vòng đời của bướm|Order the butterfly life cycle', ['Trứng|Egg', 'Sâu|Caterpillar', 'Nhộng|Pupa', 'Bướm|Butterfly']],
      ['Sắp xếp quá trình lớn lên của cây|Order how a plant grows', ['Hạt|Seed', 'Hạt nảy mầm|The seed sprouts', 'Cây con|Seedling', 'Cây ra hoa|The plant flowers', 'Cây tạo quả|The plant makes fruit']],
      ['Sắp xếp vòng đời của gà|Order the chicken life cycle', ['Trứng|Egg', 'Gà con nở ra|Chick hatches', 'Gà con lớn lên|Chick grows', 'Gà trưởng thành|Adult hen']],
      ['Sắp xếp vòng tuần hoàn của nước|Order the water cycle', ['Nước bốc hơi|Water evaporates', 'Hơi nước ngưng tụ thành mây|Vapour condenses into clouds', 'Mưa rơi xuống|Rain falls', 'Nước chảy về sông, biển|Water flows to rivers and seas']],
    ];
    const [p, list] = pick(rnd, C);
    if (kind === 'order') return { kind: 'order', prompt: L(p), items: list.map((x) => L(x)) };
    if (kind === 'mc') { const i = randInt(rnd, 0, list.length - 2); return mc(`${L(p).vi.replace('Sắp xếp ', '')}: sau "${L(list[i]).vi}" là gì?|${L(p).en.replace('Order the ', '')}: what comes after "${L(list[i]).en}"?`, list[i + 1], shuffle(rnd, list.filter((_, j) => j !== i + 1 && j !== i)), 4); }
    if (kind === 'tf') { const i = randInt(rnd, 0, list.length - 2); const ok = rnd() < 0.5; const j = ok ? i + 1 : pick(rnd, list.map((_, k) => k).filter((k) => k !== i + 1 && k !== i)); return tf(`${L(p).vi.replace('Sắp xếp ', '')}: sau "${L(list[i]).vi}" là "${L(list[j]).vi}".|${L(p).en.replace('Order the ', '')}: "${L(list[j]).en}" comes after "${L(list[i]).en}".`, ok); }
    return null;
  },
};

// ---------- Vật chất, năng lượng ----------
const states = CAT('states', 3, 'Thể rắn, lỏng, khí|Solids, liquids & gases', {
  cats: { s: ['Thể rắn|Solid', 'Chất nào ở thể rắn?|Which is a solid?', 'Hứng các chất THỂ RẮN!|Catch the SOLIDS!', '{t} ở thể rắn.|{t} is a solid.'], l: ['Thể lỏng|Liquid', 'Chất nào ở thể lỏng?|Which is a liquid?', 'Hứng các chất THỂ LỎNG!|Catch the LIQUIDS!', '{t} ở thể lỏng.|{t} is a liquid.'], g: ['Thể khí|Gas', 'Chất nào ở thể khí?|Which is a gas?', 'Hứng các chất THỂ KHÍ!|Catch the GASES!', '{t} ở thể khí.|{t} is a gas.'] },
  data: { s: '🧊 nước đá|🧊 ice; 🪨 hòn đá|🪨 a stone; sắt|iron; 🪵 gỗ|🪵 wood; muối ăn|table salt; 🧂 đường kính|🧂 sugar', l: '💧 nước|💧 water; 🥛 sữa|🥛 milk; dầu ăn|cooking oil; nước chanh|lemon juice; xăng|petrol; giấm|vinegar', g: '♨️ hơi nước|♨️ steam; khí oxygen|oxygen; không khí|air; khí carbon dioxide|carbon dioxide; khí nitrogen|nitrogen' },
  fwd: '{t} ở thể gì (ở nhiệt độ thường)?|What state is {t} in (at room temperature)?', pairs: 'Nối chất với thể của nó|Match substance and state',
});
const lightSources = CAT('light', 4, 'Nguồn sáng|Light sources', {
  cats: { y: ['Tự phát sáng|Gives off its own light', 'Vật nào TỰ phát ra ánh sáng?|Which gives off its OWN light?', 'Hứng các vật TỰ PHÁT SÁNG!|Catch things that MAKE their own light!', '{t} tự phát ra ánh sáng.|{t} gives off its own light.'], n: ['Không tự phát sáng|Does not make light', 'Vật nào KHÔNG tự phát sáng?|Which does NOT make its own light?', 'Hứng các vật KHÔNG tự phát sáng!|Catch things that do NOT make light!', '{t} không tự phát ra ánh sáng.|{t} does not make its own light.'] },
  data: { y: '☀️ Mặt Trời|☀️ the Sun; 🕯️ ngọn nến đang cháy|🕯️ a burning candle; 💡 bóng đèn đang bật|💡 a switched-on bulb; 🔥 ngọn lửa|🔥 a flame; ⭐ ngôi sao|⭐ a star; 🔦 đèn pin đang bật|🔦 a switched-on torch; đom đóm|a firefly', n: '🌙 Mặt Trăng|🌙 the Moon; 🪞 cái gương|🪞 a mirror; 📖 quyển sách|📖 a book; 🪨 hòn đá|🪨 a stone; 🥄 cái thìa|🥄 a spoon; 🪑 cái ghế|🪑 a chair' },
  fwd: '{t} có tự phát ra ánh sáng không?|Does {t} make its own light?',
});
const heat = CAT('heat', 4, 'Vật dẫn nhiệt|Heat conductors', {
  cats: { y: ['Dẫn nhiệt tốt|Good conductor of heat', 'Vật liệu nào dẫn nhiệt TỐT?|Which material conducts heat WELL?', 'Hứng các vật liệu DẪN NHIỆT TỐT!|Catch GOOD heat conductors!', '{t} dẫn nhiệt tốt.|{t} conducts heat well.'], n: ['Dẫn nhiệt kém|Poor conductor of heat', 'Vật liệu nào dẫn nhiệt KÉM?|Which material conducts heat POORLY?', 'Hứng các vật liệu DẪN NHIỆT KÉM!|Catch POOR heat conductors!', '{t} dẫn nhiệt kém.|{t} conducts heat poorly.'] },
  data: { y: 'đồng|copper; nhôm|aluminium; sắt|iron; bạc|silver; thép|steel', n: 'gỗ|wood; nhựa|plastic; vải|cloth; len|wool; xốp|foam; không khí|air; sứ|porcelain' },
  fwd: '{t} dẫn nhiệt tốt hay kém?|Does {t} conduct heat well or poorly?',
});
const nutrients = CAT('nutrients', 4, 'Nhóm chất dinh dưỡng|Food groups', {
  cats: {
    carb: ['Chất bột đường|Carbohydrates', 'Thức ăn nào chứa nhiều chất bột đường?|Which food is rich in carbohydrates?', 'Hứng thức ăn giàu CHẤT BỘT ĐƯỜNG!|Catch the CARBOHYDRATE foods!', '{t} chứa nhiều chất bột đường.|{t} is rich in carbohydrates.'],
    prot: ['Chất đạm|Protein', 'Thức ăn nào chứa nhiều chất đạm?|Which food is rich in protein?', 'Hứng thức ăn giàu CHẤT ĐẠM!|Catch the PROTEIN foods!', '{t} chứa nhiều chất đạm.|{t} is rich in protein.'],
    fat: ['Chất béo|Fats', 'Thức ăn nào chứa nhiều chất béo?|Which food is rich in fat?', 'Hứng thức ăn giàu CHẤT BÉO!|Catch the FATTY foods!', '{t} chứa nhiều chất béo.|{t} is rich in fat.'],
    vit: ['Vitamin và chất khoáng|Vitamins & minerals', 'Thức ăn nào chứa nhiều vitamin và chất khoáng?|Which food is rich in vitamins and minerals?', 'Hứng thức ăn giàu VITAMIN!|Catch the VITAMIN-rich foods!', '{t} chứa nhiều vitamin và chất khoáng.|{t} is rich in vitamins and minerals.'],
  },
  data: { carb: '🍚 cơm|🍚 rice; 🍞 bánh mì|🍞 bread; khoai lang|sweet potato; 🍜 bún, phở|🍜 rice noodles; 🌽 ngô|🌽 corn', prot: '🥩 thịt|🥩 meat; 🐟 cá|🐟 fish; 🥚 trứng|🥚 eggs; đậu phụ|tofu; 🦐 tôm|🦐 prawns', fat: 'dầu ăn|cooking oil; mỡ lợn|lard; 🧈 bơ|🧈 butter; 🥜 lạc|🥜 peanuts; vừng|sesame', vit: '🥦 rau xanh|🥦 green vegetables; 🍊 cam|🍊 oranges; 🥕 cà rốt|🥕 carrots; 🍅 cà chua|🍅 tomatoes; 🍌 chuối|🍌 bananas' },
  fwd: '{t} chứa nhiều nhóm chất nào?|Which food group is {t} rich in?', pairs: 'Nối thức ăn với nhóm chất|Match food and food group',
});
const renewables = CAT('energy', 5, 'Nguồn năng lượng|Energy sources', {
  cats: { y: ['Tái tạo, sạch|Renewable', 'Nguồn năng lượng nào là năng lượng tái tạo?|Which is renewable energy?', 'Hứng các nguồn NĂNG LƯỢNG TÁI TẠO!|Catch RENEWABLE energy!', '{t} là nguồn năng lượng tái tạo.|{t} is a renewable energy source.'], n: ['Không tái tạo|Non-renewable', 'Nguồn năng lượng nào KHÔNG tái tạo được?|Which is NON-renewable?', 'Hứng các nguồn năng lượng KHÔNG TÁI TẠO!|Catch NON-renewable sources!', '{t} là nguồn năng lượng không tái tạo.|{t} is non-renewable.'] },
  data: { y: '☀️ năng lượng mặt trời|☀️ solar energy; 🌬️ năng lượng gió|🌬️ wind energy; 💧 năng lượng nước chảy|💧 hydro power; 🌊 thủy triều|🌊 tidal energy; 🌋 địa nhiệt|🌋 geothermal energy', n: '🪨 than đá|🪨 coal; 🛢️ dầu mỏ|🛢️ crude oil; 🔥 khí đốt tự nhiên|🔥 natural gas; ⛽ xăng|⛽ petrol' },
  fwd: '{t} có phải năng lượng tái tạo không?|Is {t} renewable?',
});
const changes = CAT('changes', 5, 'Biến đổi lí học và hóa học|Physical & chemical changes', {
  cats: { phys: ['Biến đổi lí học|Physical change', 'Hiện tượng nào là biến đổi lí học?|Which is a physical change?', 'Hứng các BIẾN ĐỔI LÍ HỌC!|Catch the PHYSICAL changes!', '"{t}" là biến đổi lí học.|"{t}" is a physical change.'], chem: ['Biến đổi hóa học|Chemical change', 'Hiện tượng nào là biến đổi hóa học?|Which is a chemical change?', 'Hứng các BIẾN ĐỔI HÓA HỌC!|Catch the CHEMICAL changes!', '"{t}" là biến đổi hóa học.|"{t}" is a chemical change.'] },
  data: { phys: 'nước đá tan|ice melting; nước bay hơi|water evaporating; xé giấy|tearing paper; cưa gỗ|sawing wood; hòa tan đường|dissolving sugar; nghiền muối|crushing salt; uốn cong dây thép|bending wire; nước đông thành đá|water freezing', chem: 'đốt giấy|burning paper; sắt bị gỉ|iron rusting; trứng chín|an egg cooking; sữa chua lên men|yoghurt fermenting; gỗ cháy thành than|wood burning to charcoal; pháo hoa nổ|fireworks exploding; cơm bị thiu|rice going off; bánh mì nướng vàng|toasting bread' },
  fwd: '"{t}" là biến đổi gì?|What kind of change is "{t}"?',
});
const conductors = CAT('electric', 5, 'Vật dẫn điện, cách điện|Conductors & insulators', {
  cats: { y: ['Dẫn điện|Conductor', 'Vật liệu nào DẪN ĐIỆN?|Which material CONDUCTS electricity?', 'Hứng các vật liệu DẪN ĐIỆN!|Catch the CONDUCTORS!', '{t} dẫn điện.|{t} conducts electricity.'], n: ['Cách điện|Insulator', 'Vật liệu nào CÁCH ĐIỆN?|Which material is an INSULATOR?', 'Hứng các vật liệu CÁCH ĐIỆN!|Catch the INSULATORS!', '{t} là vật cách điện.|{t} is an insulator.'] },
  data: { y: 'đồng|copper; nhôm|aluminium; sắt|iron; bạc|silver; than chì|graphite; nước muối|salt water', n: 'nhựa|plastic; gỗ khô|dry wood; cao su|rubber; thủy tinh|glass; sứ|porcelain; giấy khô|dry paper' },
  fwd: '{t} dẫn điện hay cách điện?|Is {t} a conductor or an insulator?',
});
const devicesEnergy = MATCH('devices', 5, 'Đồ dùng và năng lượng|Devices & energy', 'Bóng đèn|Light bulb=điện năng thành quang năng|electricity into light; Quạt điện|Electric fan=điện năng thành cơ năng (chuyển động)|electricity into motion; Bàn là|Iron=điện năng thành nhiệt năng|electricity into heat; Loa|Speaker=điện năng thành năng lượng âm thanh|electricity into sound; Pin mặt trời|Solar panel=quang năng thành điện năng|light into electricity; Bếp củi|Wood stove=năng lượng chất đốt thành nhiệt năng|fuel into heat',
  { fwd: '{t} chuyển hóa năng lượng thế nào?|What energy change happens in a {t}?', back: 'Đồ dùng nào biến {a}?|Which device turns {a}?', tf: '{t} biến {a}.|A {t} turns {a}.', pairs: 'Nối đồ dùng với sự chuyển hóa năng lượng|Match device and energy change' });

// ---------- Lớp 6–9 ----------
const PLANETS = ['Sao Thủy|Mercury', 'Sao Kim|Venus', 'Trái Đất|Earth', 'Sao Hỏa|Mars', 'Sao Mộc|Jupiter', 'Sao Thổ|Saturn', 'Sao Thiên Vương|Uranus', 'Sao Hải Vương|Neptune'];
const planets = {
  id: 'planets', grade: 6, title: L('Hệ Mặt Trời', 'The Solar System'),
  gen(rnd, kind, ctx = {}) {
    const i = randInt(rnd, 0, 7), p = L(PLANETS[i]);
    if (kind === 'order') { const n = 3 + Math.min(2, tierOf(ctx)); const idx = sample(rnd, [0, 1, 2, 3, 4, 5, 6, 7], n).sort((a, b) => a - b); return { kind: 'order', prompt: L('Xếp các hành tinh từ gần đến xa Mặt Trời|Order the planets from nearest to farthest from the Sun'), items: idx.map((k) => L(PLANETS[k])) }; }
    if (kind === 'input') return input(`${p.vi} là hành tinh thứ mấy tính từ Mặt Trời? (viết số)|Counting from the Sun, which number planet is ${p.en}?`, i + 1);
    if (kind === 'mc') {
      if (rnd() < 0.5) return mc(`Hành tinh thứ ${i + 1} tính từ Mặt Trời là?|Which is planet number ${i + 1} from the Sun?`, PLANETS[i], shuffle(rnd, PLANETS.filter((_, k) => k !== i)), optCount(ctx));
      const facts = [['Hành tinh lớn nhất là?|Which is the largest planet?', 4], ['Hành tinh gần Mặt Trời nhất là?|Which planet is closest to the Sun?', 0], ['Hành tinh có sự sống là?|Which planet has life?', 2], ['Hành tinh được gọi là "Hành tinh Đỏ" là?|Which is the "Red Planet"?', 3], ['Hành tinh có vành đai dễ thấy nhất là?|Which planet has the most visible rings?', 5], ['Hành tinh xa Mặt Trời nhất là?|Which planet is farthest from the Sun?', 7]];
      const [q, k] = pick(rnd, facts); return mc(q, PLANETS[k], shuffle(rnd, PLANETS.filter((_, j) => j !== k)), optCount(ctx));
    }
    if (kind === 'tf') { const j = rnd() < 0.5 ? i + 1 : pick(rnd, [1, 2, 3, 4, 5, 6, 7, 8].filter((x) => x !== i + 1)); return tf(`${p.vi} là hành tinh thứ ${j} tính từ Mặt Trời.|${p.en} is planet number ${j} from the Sun.`, j === i + 1); }
    if (kind === 'classify') { const ok = sample(rnd, PLANETS, 5), bad = ['Mặt Trăng|the Moon', 'Mặt Trời|the Sun', 'Ngân Hà|the Milky Way', 'sao chổi|a comet', 'thiên thạch|a meteor', 'sao Bắc Cực|Polaris']; return { kind: 'classify', prompt: L('Hứng các HÀNH TINH!|Catch the PLANETS!'), items: [...ok.map((t) => ({ t: L(t), ok: true })), ...sample(rnd, bad, 5).map((t) => ({ t: L(t), ok: false }))] }; }
    return null;
  },
};
const units = MATCH('units', 6, 'Đại lượng và đơn vị|Quantities & units', 'Độ dài|Length=mét (m)|metre (m); Khối lượng|Mass=ki-lô-gam (kg)|kilogram (kg); Thời gian|Time=giây (s)|second (s); Nhiệt độ|Temperature=độ C (°C)|degree Celsius (°C); Lực|Force=niutơn (N)|newton (N); Thể tích|Volume=mét khối (m³)|cubic metre (m³); Áp suất|Pressure=paxcan (Pa)|pascal (Pa); Công, năng lượng|Work, energy=jun (J)|joule (J); Công suất|Power=oát (W)|watt (W); Hiệu điện thế|Voltage=vôn (V)|volt (V); Cường độ dòng điện|Current=ampe (A)|ampere (A); Điện trở|Resistance=ôm (Ω)|ohm (Ω); Tần số|Frequency=héc (Hz)|hertz (Hz)',
  { fwd: 'Đơn vị đo {t} là?|The unit of {t} is?', back: '{a} là đơn vị đo đại lượng nào?|{a} measures which quantity?', tf: 'Đơn vị đo {t} là {a}.|The unit of {t} is the {a}.', pairs: 'Nối đại lượng với đơn vị|Match quantity and unit' });
const CONV = [['km', 'm', 1000, 3], ['m', 'cm', 100, 3], ['m', 'mm', 1000, 4], ['kg', 'g', 1000, 3], ['tấn|tonne', 'kg', 1000, 4], ['giờ|hour', 'phút|minute', 60, 3], ['phút|minute', 'giây|second', 60, 3], ['l', 'ml', 1000, 4], ['m³', 'dm³', 1000, 6], ['kg', 'N (trọng lượng)|N (weight)', 10, 6]];
const conversions = {
  id: 'conversions', grade: 6, title: L('Đổi đơn vị', 'Unit conversions'),
  gen(rnd, kind, ctx = {}) {
    const g = ctx.grade ?? 6;
    const [a, b, k] = pick(rnd, CONV.filter((c) => c[3] <= g));
    const half = tierOf(ctx) >= 3 && rnd() < 0.5;
    const x = half ? randInt(rnd, 1, 19) / 2 : randInt(rnd, 1, 12);
    const y = x * k;
    const [av, ae] = L(a).vi === L(a).en ? [a, a] : [L(a).vi, L(a).en], [bv, be] = [L(b).vi, L(b).en];
    if (kind === 'input') return input(`${fmt(x)} ${av} = ? ${bv}|${fmtEn(x)} ${ae} = ? ${be}`, fmt(y));
    if (kind === 'mc') return mc(`${fmt(x)} ${av} = ? ${bv}|${fmtEn(x)} ${ae} = ? ${be}`, fmt(y), shuffle(rnd, [y / 10, y * 10, x * (k === 60 ? 100 : 60), y + k].filter((v) => v !== y).map(fmt)), optCount(ctx), { title: L('Đổi đơn vị', 'Convert the units') });
    if (kind === 'tf') { const ok = rnd() < 0.5; const v = ok ? y : y * 10; return tf(`${fmt(x)} ${av} = ${fmt(v)} ${bv}|${fmtEn(x)} ${ae} = ${fmtEn(v)} ${be}`, ok); }
    return null;
  },
};
const separation = MATCH('separation', 6, 'Tách chất ra khỏi hỗn hợp|Separating mixtures', 'Muối lẫn trong nước|Salt in water=cô cạn (làm bay hơi)|evaporation; Cát lẫn trong nước|Sand in water=lọc|filtering; Dầu ăn lẫn nước|Oil and water=chiết (gạn)|separating funnel; Mạt sắt lẫn cát|Iron filings in sand=dùng nam châm|a magnet; Gạo lẫn sạn|Rice with grit=sàng, nhặt|sifting and picking',
  { fwd: 'Tách {t} bằng cách nào?|How do we separate {t}?', back: 'Hỗn hợp nào tách được bằng cách {a}?|Which mixture is separated by {a}?', tf: 'Tách {t} bằng cách {a}.|{t} is separated by {a}.', pairs: 'Nối hỗn hợp với cách tách|Match mixture and method' });
const organelles = MATCH('cells', 6, 'Tế bào|Cells', 'Nhân tế bào|Nucleus=điều khiển mọi hoạt động của tế bào|controls the cell; Màng tế bào|Cell membrane=kiểm soát chất đi vào, đi ra|controls what goes in and out; Tế bào chất|Cytoplasm=nơi diễn ra các hoạt động sống|where life processes happen; Lục lạp|Chloroplast=thực hiện quang hợp|carries out photosynthesis; Thành tế bào|Cell wall=bảo vệ, giữ hình dạng tế bào thực vật|protects and shapes plant cells; Ti thể|Mitochondrion=hô hấp tế bào, tạo năng lượng|cell respiration, releases energy',
  { fwd: '{t} có chức năng gì?|What does the {t} do?', back: 'Thành phần nào của tế bào {a}?|Which part of the cell {a}?', tf: '{t}: {a}.|{t}: {a}.', pairs: 'Nối thành phần tế bào với chức năng|Match cell part and job' });
const life = CAT('kingdoms', 6, 'Các nhóm sinh vật|Groups of living things', {
  cats: {
    vk: ['Vi khuẩn|Bacteria', 'Sinh vật nào là vi khuẩn?|Which is a bacterium?', 'Hứng các VI KHUẨN!|Catch the BACTERIA!', '{t} là vi khuẩn.|{t} is a bacterium.'],
    nam: ['Nấm|Fungi', 'Sinh vật nào thuộc giới nấm?|Which is a fungus?', 'Hứng các loài NẤM!|Catch the FUNGI!', '{t} thuộc giới nấm.|{t} is a fungus.'],
    tv: ['Thực vật|Plants', 'Sinh vật nào là thực vật?|Which is a plant?', 'Hứng các THỰC VẬT!|Catch the PLANTS!', '{t} là thực vật.|{t} is a plant.'],
    dv: ['Động vật|Animals', 'Sinh vật nào là động vật?|Which is an animal?', 'Hứng các ĐỘNG VẬT!|Catch the ANIMALS!', '{t} là động vật.|{t} is an animal.'],
  },
  data: { vk: 'vi khuẩn lactic|lactic bacteria; vi khuẩn lao|tuberculosis bacteria; vi khuẩn E. coli|E. coli', nam: 'nấm rơm|straw mushroom; nấm men|yeast; nấm mốc|mould; mộc nhĩ|wood ear', tv: 'cây lúa|rice plant; rêu|moss; dương xỉ|fern; cây thông|pine tree; cây bàng|tropical almond', dv: 'con san hô|coral; con mực|squid; con cá voi|whale; con ếch|frog; con ong|bee' },
  fwd: '{t} thuộc nhóm sinh vật nào?|Which group does {t} belong to?', pairs: 'Nối sinh vật với nhóm|Match organism and group',
});
const ELEMENTS = [['H', 'Hydrogen', 1, 'n'], ['He', 'Helium', 2, 'n'], ['Li', 'Lithium', 3, 'm'], ['C', 'Carbon', 6, 'n'], ['N', 'Nitrogen', 7, 'n'], ['O', 'Oxygen', 8, 'n'], ['F', 'Fluorine', 9, 'n'], ['Ne', 'Neon', 10, 'n'], ['Na', 'Sodium (natri)', 11, 'm'], ['Mg', 'Magnesium', 12, 'm'], ['Al', 'Aluminium (nhôm)', 13, 'm'], ['P', 'Phosphorus', 15, 'n'], ['S', 'Sulfur (lưu huỳnh)', 16, 'n'], ['Cl', 'Chlorine', 17, 'n'], ['Ar', 'Argon', 18, 'n'], ['K', 'Potassium (kali)', 19, 'm'], ['Ca', 'Calcium', 20, 'm'], ['Fe', 'Iron (sắt)', 26, 'm'], ['Cu', 'Copper (đồng)', 29, 'm'], ['Zn', 'Zinc (kẽm)', 30, 'm'], ['Ag', 'Silver (bạc)', 47, 'm'], ['Au', 'Gold (vàng)', 79, 'm'], ['Hg', 'Mercury (thủy ngân)', 80, 'm'], ['Pb', 'Lead (chì)', 82, 'm']];
const symbols = MATCH('symbols', 7, 'Kí hiệu nguyên tố|Element symbols', ELEMENTS.map(([s, n]) => `${n}=${s}`).join('; '),
  { fwd: 'Kí hiệu hóa học của {t} là?|The chemical symbol of {t} is?', back: '{a} là kí hiệu của nguyên tố nào?|{a} is the symbol of which element?', tf: 'Kí hiệu của {t} là {a}.|The symbol of {t} is {a}.', pairs: 'Nối nguyên tố với kí hiệu|Match element and symbol', input: 'Viết kí hiệu hóa học của {t}:|Type the chemical symbol of {t}:' });
const atomicNo = MATCH('atomic', 7, 'Số hiệu nguyên tử (Z ≤ 20)|Atomic numbers (Z ≤ 20)', ELEMENTS.filter((e) => e[2] <= 20).map(([s, n, z]) => `${s} (${n})=${z}`).join('; '),
  { fwd: 'Số hiệu nguyên tử của {t} là?|The atomic number of {t} is?', back: 'Nguyên tố nào có số hiệu nguyên tử {a}?|Which element has atomic number {a}?', tf: 'Số hiệu nguyên tử của {t} là {a}.|The atomic number of {t} is {a}.', pairs: 'Nối nguyên tố với số hiệu nguyên tử|Match element and atomic number', input: 'Số hiệu nguyên tử của {t} là bao nhiêu? (viết số)|What is the atomic number of {t}? (number)' });
const metals = (() => {
  const c = CAT('metals', 7, 'Kim loại và phi kim|Metals & non-metals', { cats: { m: ['Kim loại|Metal', 'Nguyên tố nào là kim loại?|Which element is a metal?', 'Hứng các KIM LOẠI!|Catch the METALS!', '{t} là kim loại.|{t} is a metal.'], n: ['Phi kim|Non-metal', 'Nguyên tố nào là phi kim?|Which element is a non-metal?', 'Hứng các PHI KIM!|Catch the NON-METALS!', '{t} là phi kim.|{t} is a non-metal.'] }, data: {}, fwd: '{t} là kim loại hay phi kim?|Is {t} a metal or a non-metal?' });
  c.items = ELEMENTS.map(([s, n, , k]) => ({ t: L(`${s} – ${n}`), a: k }));
  return c;
})();
const COMPOUNDS = 'Nước|Water=H₂O; Khí carbon dioxide|Carbon dioxide=CO₂; Muối ăn|Table salt=NaCl; Khí oxygen|Oxygen gas=O₂; Methane=CH₄; Ammonia=NH₃; Hydrochloric acid=HCl; Sodium hydroxide=NaOH; Đá vôi (calcium carbonate)|Limestone (calcium carbonate)=CaCO₃; Ethanol=C₂H₅OH; Glucose=C₆H₁₂O₆; Sulfuric acid=H₂SO₄';
const formulas = MATCH('formulas', 7, 'Công thức hóa học|Chemical formulas', COMPOUNDS,
  { fwd: 'Công thức hóa học của {t} là?|The formula of {t} is?', back: '{a} là công thức của chất nào?|{a} is the formula of which substance?', tf: 'Công thức của {t} là {a}.|The formula of {t} is {a}.', pairs: 'Nối chất với công thức|Match substance and formula' });
const simpleCompound = CAT('substances', 7, 'Đơn chất và hợp chất|Elements & compounds', {
  cats: { d: ['Đơn chất|Element (simple substance)', 'Chất nào là đơn chất?|Which is an element (simple substance)?', 'Hứng các ĐƠN CHẤT!|Catch the ELEMENTS!', '{t} là đơn chất.|{t} is an element.'], h: ['Hợp chất|Compound', 'Chất nào là hợp chất?|Which is a compound?', 'Hứng các HỢP CHẤT!|Catch the COMPOUNDS!', '{t} là hợp chất.|{t} is a compound.'] },
  data: { d: 'O₂; N₂; H₂; Fe; Cu; Al; Cl₂; S', h: 'H₂O; CO₂; NaCl; CaCO₃; NH₃; CH₄; HCl; NaOH' },
  fwd: '{t} là đơn chất hay hợp chất?|Is {t} an element or a compound?',
});
const magnets = CAT('magnets', 7, 'Vật liệu có từ tính|Magnetic materials', {
  cats: { y: ['Bị nam châm hút|Attracted by a magnet', 'Vật nào BỊ nam châm hút?|Which is attracted by a magnet?', 'Hứng các vật BỊ NAM CHÂM HÚT!|Catch things a MAGNET attracts!', 'Nam châm hút được {t}.|A magnet attracts {t}.'], n: ['Không bị nam châm hút|Not attracted', 'Vật nào KHÔNG bị nam châm hút?|Which is NOT attracted by a magnet?', 'Hứng các vật KHÔNG bị nam châm hút!|Catch things a magnet does NOT attract!', 'Nam châm không hút {t}.|A magnet does not attract {t}.'] },
  data: { y: 'đinh sắt|an iron nail; kẹp giấy bằng thép|a steel paper clip; mạt sắt|iron filings; ốc vít thép|a steel screw; niken|nickel', n: 'dây đồng|copper wire; lon nhôm|an aluminium can; thước nhựa|a plastic ruler; cục tẩy|an eraser; đồng xu vàng|a gold coin; cốc thủy tinh|a glass' },
  fwd: 'Nam châm có hút {t} không?|Does a magnet attract {t}?',
});
const acids = CAT('ph', 8, 'Axit, bazơ, trung tính|Acids, bases & neutral', {
  cats: { a: ['Có tính axit (pH < 7)|Acidic (pH < 7)', 'Dung dịch nào có tính axit?|Which solution is acidic?', 'Hứng các dung dịch CÓ TÍNH AXIT!|Catch the ACIDIC solutions!', '{t} có tính axit.|{t} is acidic.'], b: ['Có tính bazơ (pH > 7)|Basic (pH > 7)', 'Dung dịch nào có tính bazơ?|Which solution is basic?', 'Hứng các dung dịch CÓ TÍNH BAZƠ!|Catch the BASIC solutions!', '{t} có tính bazơ.|{t} is basic.'], n: ['Trung tính (pH = 7)|Neutral (pH = 7)', 'Chất nào trung tính?|Which is neutral?', 'Hứng các chất TRUNG TÍNH!|Catch the NEUTRAL ones!', '{t} trung tính.|{t} is neutral.'] },
  data: { a: 'nước chanh|lemon juice; giấm|vinegar; nước cam|orange juice; dung dịch HCl|HCl solution; nước ép cà chua|tomato juice', b: 'nước xà phòng|soapy water; nước vôi trong|limewater; dung dịch NaOH|NaOH solution; thuốc tẩy|bleach; dung dịch baking soda|baking soda solution', n: 'nước cất|distilled water; nước muối ăn|table-salt solution; nước đường|sugar water' },
  fwd: '{t} có tính axit, bazơ hay trung tính?|Is {t} acidic, basic or neutral?', pairs: 'Nối dung dịch với tính chất|Match solution and property',
});
const organic = CAT('organic', 9, 'Hợp chất hữu cơ và vô cơ|Organic & inorganic compounds', {
  cats: { o: ['Hữu cơ|Organic', 'Chất nào là hợp chất hữu cơ?|Which is an organic compound?', 'Hứng các HỢP CHẤT HỮU CƠ!|Catch the ORGANIC compounds!', '{t} là hợp chất hữu cơ.|{t} is an organic compound.'], v: ['Vô cơ|Inorganic', 'Chất nào là hợp chất vô cơ?|Which is an inorganic compound?', 'Hứng các HỢP CHẤT VÔ CƠ!|Catch the INORGANIC compounds!', '{t} là hợp chất vô cơ.|{t} is an inorganic compound.'] },
  data: { o: 'CH₄; C₂H₅OH; C₂H₄; CH₃COOH; C₆H₁₂O₆; C₂H₂; C₁₂H₂₂O₁₁', v: 'H₂O; NaCl; CO₂; CaCO₃; HCl; NaOH; H₂SO₄' },
  fwd: '{t} là hợp chất hữu cơ hay vô cơ?|Is {t} organic or inorganic?',
});
const REACT = ['K', 'Na', 'Ca', 'Mg', 'Al', 'Zn', 'Fe', 'Pb', 'H', 'Cu', 'Hg', 'Ag', 'Pt', 'Au'];
const reactivity = {
  id: 'reactivity', grade: 9, title: L('Dãy hoạt động hóa học của kim loại', 'Metal reactivity series'),
  gen(rnd, kind, ctx = {}) {
    const metals = REACT.filter((x) => x !== 'H');
    if (kind === 'order') { const n = 3 + Math.min(2, tierOf(ctx)); const idx = sample(rnd, metals.map((_, i) => i), n).sort((a, b) => a - b); return { kind: 'order', prompt: L('Xếp các kim loại theo mức hoạt động hóa học GIẢM dần|Order the metals from MOST to LEAST reactive'), items: idx.map((i) => L(metals[i])) }; }
    const [i, j] = sample(rnd, metals.map((_, k) => k), 2).sort((a, b) => a - b);
    if (kind === 'mc') return mc(`Kim loại nào hoạt động hóa học mạnh hơn: ${metals[i]} hay ${metals[j]}?|Which metal is more reactive: ${metals[i]} or ${metals[j]}?`, metals[i], [metals[j]], 2);
    if (kind === 'tf') { const ok = rnd() < 0.5; return tf(`${ok ? metals[i] : metals[j]} hoạt động hóa học mạnh hơn ${ok ? metals[j] : metals[i]}.|${ok ? metals[i] : metals[j]} is more reactive than ${ok ? metals[j] : metals[i]}.`, ok); }
    if (kind === 'classify') { const cu = REACT.indexOf('Cu'); const ok = sample(rnd, REACT.slice(0, cu).filter((x) => x !== 'H'), 5), bad = REACT.slice(cu + 1); return { kind: 'classify', prompt: L('Hứng các kim loại hoạt động MẠNH HƠN đồng (Cu)!|Catch metals MORE reactive than copper (Cu)!'), items: [...ok.map((t) => ({ t: L(t), ok: true })), ...bad.map((t) => ({ t: L(t), ok: false }))] }; }
    return null;
  },
};
const energyForms = MATCH('energyforms', 9, 'Các dạng năng lượng|Forms of energy', 'Động năng|Kinetic energy=xe đang chạy|a moving car; Thế năng trọng trường|Gravitational potential energy=nước trên hồ chứa của đập|water behind a dam; Quang năng|Light energy=ánh nắng|sunlight; Điện năng|Electrical energy=dòng điện trong dây dẫn|current in a wire; Nhiệt năng|Thermal energy=nồi nước đang sôi|a pot of boiling water; Hóa năng|Chemical energy=pin chưa dùng|an unused battery; Năng lượng âm thanh|Sound energy=tiếng trống|the sound of a drum',
  { fwd: 'Ví dụ nào thể hiện rõ {t}?|Which example shows {t}?', back: '{a} thể hiện dạng năng lượng nào?|Which form of energy does {a} show?', tf: '{a} là ví dụ về {t}.|{a} is an example of {t}.', pairs: 'Nối dạng năng lượng với ví dụ|Match energy form and example' });
energyForms.q.fwd = (it) => L(`Ví dụ nào thể hiện rõ ${it.t.vi.toLowerCase()}?`, `Which example best shows ${it.t.en.toLowerCase()}?`);
energyForms.q.tf = (it, a) => L(`"${a.vi}" là ví dụ về ${it.t.vi.toLowerCase()}.`, `"${a.en}" is an example of ${it.t.en.toLowerCase()}.`);
const genetics = MATCH('genetics', 9, 'Thuật ngữ di truyền|Genetics terms', 'Gene=đoạn DNA mang thông tin quy định một tính trạng|a DNA section that codes for a trait; Kiểu gene|Genotype=tổ hợp các gene của cơ thể|the set of genes an organism has; Kiểu hình|Phenotype=tập hợp các tính trạng biểu hiện ra ngoài|the visible traits; Đột biến|Mutation=biến đổi trong vật chất di truyền|a change in genetic material; Alen|Allele=các dạng khác nhau của cùng một gene|different versions of the same gene; Nhiễm sắc thể|Chromosome=cấu trúc mang gene trong nhân tế bào|a structure in the nucleus that carries genes',
  { fwd: '"{t}" là gì?|What is a "{t}"?', back: 'Thuật ngữ nào có nghĩa: {a}?|Which term means: {a}?', tf: '{t} là {a}.|A {t} is {a}.', pairs: 'Nối thuật ngữ với định nghĩa|Match term and definition' });

// ---------- Bài toán vật lí theo công thức (số thay đổi mỗi lần) ----------
function formula(id, grade, title, make) {
  return {
    id, grade, title: L(title),
    gen(rnd, kind, ctx = {}) {
      const p = make(rnd, tierOf(ctx));
      if (kind === 'input') return input(p.q, fmt(p.a), [fmtEn(p.a)], p.unit);
      if (kind === 'mc') return mc(`${L(p.q).vi} (${L(p.unit).vi})|${L(p.q).en} (${L(p.unit).en})`, fmt(p.a), shuffle(rnd, p.wrong.filter((w) => w !== p.a && w > 0).map(fmt)), optCount(ctx), { title: L(p.title) });
      if (kind === 'tf') { const ok = rnd() < 0.5; const v = ok ? p.a : pick(rnd, p.wrong.filter((w) => w !== p.a && w > 0)); return tf(`${L(p.q).vi.replace(/\?$/, '')}: ${fmt(v)} ${L(p.unit).vi}.|${L(p.q).en.replace(/\?$/, '')}: ${fmtEn(v)} ${L(p.unit).en}.`, ok); }
      return null;
    },
  };
}
const speed = formula('speed', 7, 'Tốc độ v = s : t|Speed v = s ÷ t', (rnd, t) => {
  const v = pick(rnd, t <= 1 ? [5, 10, 12, 20] : [15, 30, 36, 40, 45, 60, 72]), h = randInt(rnd, 2, t <= 2 ? 4 : 6), s = v * h;
  const k = randInt(rnd, 0, 2);
  if (k === 0) return { title: 'v = s : t', q: `Đi quãng đường ${s} km hết ${h} giờ. Tốc độ là bao nhiêu?|${s} km in ${h} hours. What is the speed?`, a: v, unit: 'km/h', wrong: [s * h, s + h, v * 2, v + 5] };
  if (k === 1) return { title: 's = v × t', q: `Đi với tốc độ ${v} km/h trong ${h} giờ. Quãng đường là bao nhiêu?|At ${v} km/h for ${h} hours. What is the distance?`, a: s, unit: 'km', wrong: [v + h, s + v, s * 2, s - v] };
  return { title: 't = s : v', q: `Đi quãng đường ${s} km với tốc độ ${v} km/h. Thời gian đi là bao nhiêu?|${s} km at ${v} km/h. How long does it take?`, a: h, unit: 'giờ|hours', wrong: [h + 1, h * 2, s - v, h + 2] };
});
const density = formula('density', 8, 'Khối lượng riêng và áp suất|Density & pressure', (rnd) => {
  if (rnd() < 0.5) { const D = pick(rnd, [1000, 2700, 7800, 800, 2000]), V = pick(rnd, [0.5, 2, 3, 0.2, 4]), m = D * V; return { title: 'D = m : V', q: `Vật có khối lượng ${fmt(m)} kg, thể tích ${fmt(V)} m³. Khối lượng riêng là bao nhiêu?|Mass ${fmtEn(m)} kg, volume ${fmtEn(V)} m³. What is the density?`, a: D, unit: 'kg/m³', wrong: [m * V, D * 10, D / 10, m + V] }; }
  const p = pick(rnd, [50, 100, 200, 250, 400, 500]), S = pick(rnd, [2, 4, 5, 0.5, 10]), F = p * S;
  return { title: 'p = F : S', q: `Áp lực ${fmt(F)} N tác dụng lên diện tích ${fmt(S)} m². Áp suất là bao nhiêu?|A force of ${fmtEn(F)} N acts on ${fmtEn(S)} m². What is the pressure?`, a: p, unit: 'Pa', wrong: [F * S, p * 2, p + S, F] };
});
const electricity = formula('ohm', 9, 'Định luật Ôm và công suất điện|Ohm\'s law & electric power', (rnd) => {
  const k = randInt(rnd, 0, 2);
  if (k === 0) { const R = pick(rnd, [2, 4, 5, 10, 20]), I = pick(rnd, [0.5, 1, 2, 3]), U = R * I; return { title: 'I = U : R', q: `Hiệu điện thế ${fmt(U)} V, điện trở ${R} Ω. Cường độ dòng điện là bao nhiêu?|Voltage ${fmtEn(U)} V, resistance ${R} Ω. What is the current?`, a: I, unit: 'A', wrong: [U * R, I * 2, U + R, I + 1] }; }
  if (k === 1) { const R1 = randInt(rnd, 2, 15), R2 = randInt(rnd, 2, 15); return { title: 'R = R₁ + R₂', q: `Hai điện trở ${R1} Ω và ${R2} Ω mắc nối tiếp. Điện trở tương đương là bao nhiêu?|${R1} Ω and ${R2} Ω in series. What is the total resistance?`, a: R1 + R2, unit: 'Ω', wrong: [R1 * R2, Math.abs(R1 - R2) || 1, R1 + R2 + 2, R1 * 2] }; }
  const U = pick(rnd, [6, 12, 110, 220]), I = pick(rnd, [0.5, 1, 2, 5]); return { title: 'P = U × I', q: `Thiết bị có U = ${U} V, I = ${fmt(I)} A. Công suất là bao nhiêu?|A device has U = ${U} V and I = ${fmtEn(I)} A. What is the power?`, a: U * I, unit: 'W', wrong: [U + I, U / I, U * I * 2, U] };
});

export const SCI_CONCEPTS = {
  1: [habitat, senses, healthyFood, safety, weatherItems, plantNeeds],
  2: [diet, habitat, flyers, legs, organs, lifeCycles],
  3: [plantParts, foodParts, groups, backbone, states, lifeCycles],
  4: [lightSources, heat, nutrients, diet, states, foodParts],
  5: [renewables, changes, conductors, birth, devicesEnergy, groups],
  6: [planets, units, conversions, separation, organelles, life],
  7: [symbols, atomicNo, metals, formulas, simpleCompound, magnets, speed],
  8: [acids, bodySystems, density, changes, formulas, units],
  9: [electricity, reactivity, organic, energyForms, genetics, units],
};
