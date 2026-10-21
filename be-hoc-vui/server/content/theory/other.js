// Góc lý thuyết — Tiếng Việt, Tiếng Anh, Khoa học (mức khái quát, đúng lứa tuổi).
import { K } from './kit.js';
const { topic, p, list, rule, f, table, ex, w } = K;

export const VI_THEORY = [
  topic('v-tones', 'vietnamese', 1, 2, '🎵', 'Sáu thanh điệu', 'The six tones',
    'Tiếng Việt có 6 thanh, đổi thanh là đổi nghĩa.', 'Vietnamese has 6 tones; changing the tone changes the meaning.', [
      table([['Thanh', 'Tone'], ['Dấu', 'Mark'], ['Ví dụ', 'Example']], [['ngang', ['(không dấu)', '(no mark)'], 'ma'], ['huyền', '`', 'mà'], ['sắc', '´', 'má'], ['hỏi', '?', 'mả'], ['ngã', '~', 'mã'], ['nặng', '.', 'mạ']]),
      rule('Dấu thanh đặt ở âm chính (nguyên âm) của vần: hoa → hoà, khoẻ, thuỷ.', 'The tone mark sits on the main vowel of the rhyme: hoà, khoẻ, thuỷ.'),
      list(['Dấu nặng đặt dưới chữ, các dấu khác đặt trên chữ.', 'The nặng dot goes under the letter; the other marks go above.']),
    ]),
  topic('v-spelling', 'vietnamese', 1, 3, '✍️', 'Quy tắc chính tả c/k, g/gh, ng/ngh', 'Spelling rules c/k, g/gh, ng/ngh',
    'Khi nào viết k, gh, ngh?', 'When do you write k, gh or ngh?', [
      rule('k, gh, ngh đứng trước i, e, ê. Còn lại viết c, g, ng.', 'Use k, gh, ngh before i, e, ê. Otherwise write c, g, ng.'),
      table([['Trước i, e, ê', 'Before i, e, ê'], ['Trước a, o, ô, ơ, u, ư…', 'Before a, o, ô, ơ, u, ư…']], [['kim, kẻ, kê', 'cá, cò, cũ'], ['ghi, ghế, ghe', 'gà, gỗ, gù'], ['nghỉ, nghe, nghệ', 'ngã, ngô, ngủ']]),
      list(['Âm "quờ" luôn viết là qu: quả, quê, quyển.', 'The kw sound is always written qu: quả, quê, quyển.'], ['Phân biệt tr/ch, s/x, r/d/gi bằng cách đọc to và tra từ điển.', 'For tr/ch, s/x, r/d/gi, read aloud and check a dictionary.']),
    ]),
  topic('v-wordclass', 'vietnamese', 2, 5, '🏷️', 'Từ loại: danh từ, động từ, tính từ', 'Nouns, verbs and adjectives',
    'Mỗi từ có một "nhiệm vụ" trong câu.', 'Every word has a job in the sentence.', [
      table([['Từ loại', 'Word class'], ['Chỉ…', 'Names…'], ['Ví dụ', 'Examples']], [
        [['Danh từ', 'Noun'], ['người, vật, hiện tượng, khái niệm', 'people, things, events, ideas'], 'bạn, quyển sách, mưa, tình bạn'],
        [['Động từ', 'Verb'], ['hoạt động, trạng thái', 'actions, states'], 'chạy, đọc, ngủ, yêu'],
        [['Tính từ', 'Adjective'], ['đặc điểm, tính chất', 'qualities'], 'đỏ, cao, chăm chỉ, ngọt'],
        [['Đại từ', 'Pronoun'], ['dùng để xưng hô, thay thế', 'stand in for names'], 'tôi, bạn, nó, họ, chúng ta'],
        [['Quan hệ từ', 'Connective'], ['nối các từ, các câu', 'link words and clauses'], 'và, nhưng, vì, nên, của'],
      ]),
      ex('Tìm động từ và tính từ: "Chú mèo lười nằm ngủ."', 'Find the verbs and adjective: "Chú mèo lười nằm ngủ."', 'Động từ: nằm, ngủ. Tính từ: lười.', 'Verbs: nằm (lie), ngủ (sleep). Adjective: lười (lazy).'),
    ]),
  topic('v-sentence', 'vietnamese', 2, 5, '💬', 'Câu và dấu câu', 'Sentences and punctuation',
    'Bốn kiểu câu và các thành phần chính.', 'Four kinds of sentence and their main parts.', [
      table([['Kiểu câu', 'Type'], ['Dùng để', 'Used to'], ['Dấu cuối câu', 'Ends with']], [[['Câu kể', 'Statement'], ['kể, tả, giới thiệu', 'tell or describe'], '.'], [['Câu hỏi', 'Question'], ['hỏi điều chưa biết', 'ask'], '?'], [['Câu cảm', 'Exclamation'], ['bộc lộ cảm xúc', 'show feelings'], '!'], [['Câu khiến', 'Command'], ['nhờ, yêu cầu, đề nghị', 'ask or tell someone to do'], '. hoặc !']]),
      rule('Câu thường có chủ ngữ (Ai? Cái gì?) và vị ngữ (Làm gì? Thế nào? Là gì?). Trạng ngữ cho biết thời gian, nơi chốn, nguyên nhân, mục đích.', 'A sentence has a subject (Who? What?) and a predicate (Does what? Is how?). Adverbials tell when, where, why.'),
      ex('Xác định thành phần: "Sáng nay, em đi học sớm."', 'Parts of: "Sáng nay, em đi học sớm."', 'Trạng ngữ: Sáng nay. Chủ ngữ: em. Vị ngữ: đi học sớm.', 'Adverbial: Sáng nay (this morning). Subject: em. Predicate: đi học sớm.'),
      list(['Dấu phẩy ngăn trạng ngữ với chủ ngữ, ngăn các từ cùng loại: "Vườn có cam, bưởi, xoài."', 'Commas separate adverbials and items in a list.'], ['Dấu hai chấm báo hiệu lời nói hoặc liệt kê; lời nói trực tiếp đặt trong ngoặc kép.', 'A colon introduces speech or a list; direct speech goes in quotation marks.']),
    ]),
  topic('v-wordform', 'vietnamese', 3, 6, '🧱', 'Từ đơn, từ ghép, từ láy', 'Simple, compound and reduplicative words',
    'Cấu tạo của từ tiếng Việt.', 'How Vietnamese words are built.', [
      list(['Từ đơn: một tiếng (nhà, cây, ăn).', 'Simple word: one syllable (nhà, cây, ăn).'], ['Từ ghép: hai tiếng trở lên đều có nghĩa, ghép lại (bàn ghế, xe đạp).', 'Compound: syllables that each have meaning (bàn ghế, xe đạp).'], ['Từ láy: các tiếng lặp lại âm hoặc vần (lấp lánh, xinh xinh, rì rào).', 'Reduplicative: syllables repeat sounds or rhymes (lấp lánh, xinh xinh).']),
      rule('Mẹo: tách từng tiếng ra, nếu cả hai tiếng đều có nghĩa và không giống âm nhau thì thường là từ ghép.', 'Tip: if both syllables mean something on their own and don’t echo each other, it’s usually a compound.'),
      list(['Từ đồng nghĩa: nghĩa giống hoặc gần giống (to – lớn – khổng lồ).', 'Synonyms: same or similar meaning.'], ['Từ trái nghĩa: nghĩa ngược nhau (cao – thấp).', 'Antonyms: opposite meanings.'], ['Từ đồng âm: phát âm giống, nghĩa khác (con đường – cân đường).', 'Homonyms: same sound, different meaning.']),
    ]),
  topic('v-devices', 'vietnamese', 3, 9, '🌈', 'Biện pháp tu từ', 'Figures of speech',
    'Cách làm câu văn hay, giàu hình ảnh.', 'Ways to make writing vivid.', [
      table([['Biện pháp', 'Device'], ['Cách làm', 'How'], ['Ví dụ', 'Example']], [
        [['So sánh', 'Simile'], ['đối chiếu sự vật này với sự vật khác có nét giống', 'compare two things that are alike'], 'Trẻ em như búp trên cành.'],
        [['Nhân hoá', 'Personification'], ['gọi, tả vật như người', 'describe things as if they were people'], 'Ông Mặt Trời thức dậy.'],
        [['Ẩn dụ', 'Metaphor'], ['gọi tên sự vật này bằng tên sự vật khác giống nó', 'call one thing by the name of a similar thing'], 'Thuyền về có nhớ bến chăng.'],
        [['Hoán dụ', 'Metonymy'], ['gọi tên bằng một sự vật gần gũi, liên quan', 'name a thing by something closely linked'], 'Áo nâu liền với áo xanh.'],
        [['Điệp ngữ', 'Repetition'], ['lặp lại từ ngữ để nhấn mạnh', 'repeat words for emphasis'], 'Nhớ sao lớp học i tờ…'],
        [['Nói quá', 'Hyperbole'], ['phóng đại để gây ấn tượng', 'exaggerate for effect'], 'Mồ hôi thánh thót như mưa ruộng cày.'],
      ]),
      rule('Khi phân tích, hãy nêu: biện pháp gì → ở đâu → tác dụng (làm cho sự vật sinh động, gần gũi, nhấn mạnh…).', 'When analysing, say which device, where it is, and its effect.'),
    ]),
  topic('v-writing', 'vietnamese', 3, 9, '📝', 'Viết đoạn văn và bài văn', 'Writing paragraphs and essays',
    'Bố cục ba phần và các kiểu bài.', 'The three-part structure and kinds of writing.', [
      list(['Mở bài: giới thiệu đối tượng, vấn đề.', 'Opening: introduce the subject.'], ['Thân bài: kể, tả hoặc nêu ý theo trình tự hợp lý, mỗi ý một đoạn.', 'Body: tell, describe or argue in a clear order, one idea per paragraph.'], ['Kết bài: nêu cảm nghĩ, khẳng định lại ý chính.', 'Ending: give your feelings and sum up.']),
      table([['Kiểu bài', 'Type'], ['Cần chú ý', 'Focus on']], [[['Kể chuyện', 'Narrative'], ['nhân vật, sự việc, diễn biến', 'characters, events, sequence']], [['Miêu tả', 'Description'], ['quan sát bằng các giác quan, dùng từ gợi tả', 'use all your senses and vivid words']], [['Biểu cảm', 'Expressive'], ['bày tỏ tình cảm chân thật', 'share real feelings']], [['Nghị luận', 'Argument'], ['luận điểm, lí lẽ, dẫn chứng', 'claims, reasons, evidence']]]),
      rule('Viết xong đọc lại: soát chính tả, dấu câu và lỗi lặp từ.', 'Read it again: check spelling, punctuation and repeated words.'),
    ]),
];

export const EN_THEORY = [
  topic('e-basics', 'english', 1, 3, '🔤', 'Alphabet and numbers', 'Alphabet and numbers',
    'Bảng chữ cái và số đếm tiếng Anh.', 'The English alphabet and numbers.', [
      p('Bảng chữ cái có 26 chữ: A B C D E F G H I J K L M N O P Q R S T U V W X Y Z. Nguyên âm: a, e, i, o, u.', 'There are 26 letters A–Z. The vowels are a, e, i, o, u.'),
      table(['1–10', '11–20', ['Chục', 'Tens']], [['one, two, three, four, five', 'eleven, twelve, thirteen, fourteen, fifteen', 'ten, twenty, thirty'], ['six, seven, eight, nine, ten', 'sixteen, seventeen, eighteen, nineteen, twenty', 'forty, fifty, sixty, seventy, eighty, ninety, a hundred']]),
      rule('Số 21–99: chục + gạch nối + đơn vị: twenty-one, fifty-six.', 'Numbers 21–99: tens + hyphen + ones: twenty-one, fifty-six.'),
    ]),
  topic('e-pronouns', 'english', 2, 6, '🙋', 'Pronouns and "to be"', 'Pronouns and "to be"',
    'Đại từ nhân xưng và động từ to be.', 'Personal pronouns and the verb to be.', [
      table([['Chủ ngữ', 'Subject'], 'to be', ['Tân ngữ', 'Object'], ['Sở hữu', 'Possessive']], [['I', 'am', 'me', 'my'], ['you', 'are', 'you', 'your'], ['he', 'is', 'him', 'his'], ['she', 'is', 'her', 'her'], ['it', 'is', 'it', 'its'], ['we', 'are', 'us', 'our'], ['they', 'are', 'them', 'their']]),
      list(['Phủ định: thêm not — I am not, she is not (isn’t), they are not (aren’t).', 'Negative: add not — isn’t, aren’t.'], ['Câu hỏi: đảo to be lên đầu — Is she a teacher? Are you OK?', 'Question: put to be first — Is she a teacher?']),
    ]),
  topic('e-present', 'english', 3, 6, '⏰', 'Present simple and present continuous', 'Present simple and present continuous',
    'Thói quen hằng ngày và việc đang diễn ra.', 'Habits and things happening now.', [
      f(['Present simple:  I / you / we / they + V      he / she / it + V-s/es', 'Present continuous:  am / is / are + V-ing']),
      list(['V + es khi tận cùng là o, s, x, ch, sh: goes, watches, fixes.', 'Add -es after o, s, x, ch, sh: goes, watches.'], ['Phụ âm + y → ies: study → studies; nguyên âm + y giữ nguyên: play → plays.', 'Consonant + y → ies; vowel + y just adds s.'], ['Phủ định / câu hỏi: don’t / doesn’t + V; Do / Does … + V?', 'Negatives and questions use do/does + base verb.']),
      table([['Dùng khi', 'Use for'], ['Dấu hiệu', 'Signal words'], ['Ví dụ', 'Example']], [[['thói quen, sự thật', 'habits, facts'], 'always, usually, every day', 'She walks to school every day.'], [['việc đang xảy ra', 'happening now'], 'now, at the moment, Look!', 'Look! They are playing football.']]),
      rule('Thêm -ing: bỏ e câm (make → making), gấp đôi phụ âm cuối nếu trước nó là 1 nguyên âm (run → running, swim → swimming).', 'Adding -ing: drop silent e (making); double the last consonant after a single vowel (running).'),
    ]),
  topic('e-past', 'english', 5, 8, '📜', 'Past simple and irregular verbs', 'Past simple and irregular verbs',
    'Kể việc đã xảy ra; bảng động từ bất quy tắc thường gặp.', 'Talking about the past; common irregular verbs.', [
      f(['Khẳng định: S + V-ed / V2', 'Phủ định: S + didn’t + V', 'Câu hỏi: Did + S + V ?']),
      list(['Đuôi -ed đọc /ɪd/ sau t, d (wanted); /t/ sau p, k, f, s, sh, ch (stopped, watched); /d/ với các âm còn lại (played).', '-ed sounds /ɪd/ after t, d; /t/ after p, k, f, s, sh, ch; /d/ otherwise.'], ['Dấu hiệu: yesterday, last week, ago, in 2020.', 'Signal words: yesterday, last week, ago, in 2020.']),
      table(['V1', 'V2', 'V3', ['Nghĩa', 'Meaning']], [['be', 'was / were', 'been', 'thì, là'], ['go', 'went', 'gone', 'đi'], ['do', 'did', 'done', 'làm'], ['have', 'had', 'had', 'có'], ['see', 'saw', 'seen', 'nhìn thấy'], ['eat', 'ate', 'eaten', 'ăn'], ['take', 'took', 'taken', 'lấy'], ['come', 'came', 'come', 'đến'], ['make', 'made', 'made', 'làm ra'], ['write', 'wrote', 'written', 'viết'], ['read', 'read', 'read', 'đọc'], ['buy', 'bought', 'bought', 'mua'], ['run', 'ran', 'run', 'chạy'], ['swim', 'swam', 'swum', 'bơi'], ['give', 'gave', 'given', 'cho'], ['know', 'knew', 'known', 'biết'], ['speak', 'spoke', 'spoken', 'nói'], ['drink', 'drank', 'drunk', 'uống'], ['sing', 'sang', 'sung', 'hát'], ['get', 'got', 'got / gotten', 'nhận được']]),
    ]),
  topic('e-future-perfect', 'english', 6, 9, '🚀', 'Future and present perfect', 'Future and present perfect',
    'will, be going to và thì hiện tại hoàn thành.', 'will, be going to and the present perfect.', [
      table([['Cấu trúc', 'Form'], ['Dùng khi', 'Use'], ['Ví dụ', 'Example']], [['will + V', ['quyết định ngay, dự đoán', 'instant decisions, predictions'], 'I think it will rain.'], ['am/is/are going to + V', ['kế hoạch đã định', 'plans already made'], 'We are going to visit Hue.'], ['have/has + V3', ['việc đã xảy ra, còn liên quan hiện tại', 'past actions linked to now'], 'I have finished my homework.']]),
      list(['for + khoảng thời gian (for two years); since + mốc thời gian (since 2020).', 'for + a period (for two years); since + a point in time (since 2020).'], ['Dấu hiệu hiện tại hoàn thành: already, yet, ever, never, just.', 'Present perfect signals: already, yet, ever, never, just.']),
    ]),
  topic('e-compare', 'english', 5, 8, '📊', 'Comparatives and superlatives', 'Comparatives and superlatives',
    'So sánh hơn và so sánh nhất.', 'Comparing two or more things.', [
      table([['Tính từ', 'Adjective'], ['So sánh hơn', 'Comparative'], ['So sánh nhất', 'Superlative']], [[['ngắn: tall', 'short: tall'], 'taller than', 'the tallest'], [['tận cùng y: happy', 'ends in y: happy'], 'happier than', 'the happiest'], [['dài: beautiful', 'long: beautiful'], 'more beautiful than', 'the most beautiful'], ['good', 'better than', 'the best'], ['bad', 'worse than', 'the worst'], ['far', 'farther / further', 'the farthest']]),
      rule('Tính từ ngắn kết thúc bằng 1 nguyên âm + 1 phụ âm thì gấp đôi phụ âm: big → bigger → the biggest.', 'Short adjectives ending vowel + consonant double it: big → bigger → the biggest.'),
    ]),
  topic('e-nouns', 'english', 3, 6, '🍎', 'Plurals, articles and prepositions', 'Plurals, articles and prepositions',
    'Số nhiều, a/an/the và in/on/at.', 'Plurals, a/an/the and in/on/at.', [
      list(['Số nhiều thêm s (cats); thêm es sau s, x, ch, sh, o (boxes, tomatoes); phụ âm + y → ies (babies).', 'Plurals: add s; add es after s, x, ch, sh, o; consonant + y → ies.'], ['Bất quy tắc: man → men, woman → women, child → children, foot → feet, tooth → teeth, mouse → mice.', 'Irregular: men, women, children, feet, teeth, mice.'], ['a đứng trước âm phụ âm (a dog), an trước âm nguyên âm (an apple, an hour); the dùng cho thứ đã biết hoặc duy nhất (the sun).', 'a before consonant sounds, an before vowel sounds; the for something known or unique.']),
      table(['', ['Thời gian', 'Time'], ['Nơi chốn', 'Place']], [['in', 'in May, in 2025, in the morning', 'in the room, in Hanoi'], ['on', 'on Monday, on 2nd September', 'on the table, on the wall'], ['at', 'at 7 o’clock, at night', 'at school, at the door']]),
    ]),
  topic('e-questions', 'english', 2, 5, '❓', 'Question words', 'Question words',
    'Từ để hỏi Wh-.', 'Wh- question words.', [
      table([['Từ hỏi', 'Word'], ['Hỏi về', 'Asks about'], ['Ví dụ', 'Example']], [['What', ['cái gì', 'things'], 'What is your name?'], ['Who', ['ai', 'people'], 'Who is your teacher?'], ['Where', ['ở đâu', 'places'], 'Where do you live?'], ['When', ['khi nào', 'time'], 'When is your birthday?'], ['Why', ['tại sao', 'reasons'], 'Why are you sad?'], ['How', ['thế nào', 'manner'], 'How are you?'], ['How many', ['bao nhiêu (đếm được)', 'how many (countable)'], 'How many books do you have?'], ['How much', ['bao nhiêu (giá, không đếm được)', 'price, uncountable'], 'How much is it?'], ['Which', ['cái nào', 'which one'], 'Which colour do you like?']]),
      rule('Câu hỏi với động từ thường: Wh- + do/does + chủ ngữ + V? (Where do you live?). Với to be: Wh- + am/is/are + chủ ngữ? (How are you?).', 'With ordinary verbs: Wh- + do/does + subject + verb? (Where do you live?). With to be: Wh- + am/is/are + subject? (How are you?).'),
    ]),
];

export const SCI_THEORY = [
  topic('s-plants', 'science', 1, 4, '🌱', 'Thực vật và điều kiện sống', 'Plants and what they need',
    'Các bộ phận của cây và cây cần gì để sống.', 'Parts of a plant and what plants need.', [
      table([['Bộ phận', 'Part'], ['Nhiệm vụ', 'Job']], [[['Rễ', 'Roots'], ['hút nước, muối khoáng; giữ cây đứng vững', 'take in water and minerals; anchor the plant']], [['Thân', 'Stem'], ['nâng đỡ, vận chuyển nước và chất dinh dưỡng', 'hold the plant up, carry water and food']], [['Lá', 'Leaves'], ['quang hợp tạo chất dinh dưỡng, thoát hơi nước', 'make food by photosynthesis, give off water']], [['Hoa', 'Flower'], ['sinh sản, tạo quả và hạt', 'reproduction, makes fruit and seeds']], [['Quả, hạt', 'Fruit, seeds'], ['mọc thành cây mới', 'grow into new plants']]]),
      rule('Cây cần ánh sáng, nước, không khí, chất khoáng và nhiệt độ thích hợp. Lá cây dùng ánh sáng để tạo chất dinh dưỡng và thải ra khí ô-xi.', 'Plants need light, water, air, minerals and the right temperature. Leaves use light to make food and give off oxygen.'),
    ]),
  topic('s-body', 'science', 2, 5, '🫀', 'Cơ thể người', 'The human body',
    'Năm giác quan và các cơ quan trong cơ thể.', 'The five senses and body systems.', [
      table([['Giác quan', 'Sense'], ['Bộ phận', 'Organ']], [[['Thị giác (nhìn)', 'Sight'], ['mắt', 'eyes']], [['Thính giác (nghe)', 'Hearing'], ['tai', 'ears']], [['Khứu giác (ngửi)', 'Smell'], ['mũi', 'nose']], [['Vị giác (nếm)', 'Taste'], ['lưỡi', 'tongue']], [['Xúc giác (chạm)', 'Touch'], ['da', 'skin']]]),
      table([['Cơ quan', 'System'], ['Bộ phận chính', 'Main parts'], ['Nhiệm vụ', 'Job']], [[['Tiêu hoá', 'Digestive'], ['miệng, dạ dày, ruột', 'mouth, stomach, intestines'], ['biến đổi thức ăn', 'break down food']], [['Hô hấp', 'Respiratory'], ['mũi, khí quản, phổi', 'nose, windpipe, lungs'], ['lấy ô-xi, thải khí các-bô-níc', 'take in oxygen, remove carbon dioxide']], [['Tuần hoàn', 'Circulatory'], ['tim, mạch máu', 'heart, blood vessels'], ['đưa máu đi khắp cơ thể', 'carry blood around the body']], [['Thần kinh', 'Nervous'], ['não, tuỷ sống, dây thần kinh', 'brain, spinal cord, nerves'], ['điều khiển mọi hoạt động', 'control the body']], [['Bài tiết', 'Excretory'], ['thận, bóng đái, da', 'kidneys, bladder, skin'], ['thải chất độc ra ngoài', 'remove waste']], [['Vận động', 'Musculoskeletal'], ['xương, cơ', 'bones, muscles'], ['giúp cơ thể cử động', 'let the body move']]]),
      rule('Ăn đủ chất, uống đủ nước, ngủ đủ giấc và tập thể dục giúp cơ thể khoẻ mạnh.', 'Eat well, drink water, sleep enough and exercise to stay healthy.'),
    ]),
  topic('s-matter', 'science', 3, 6, '💧', 'Ba thể của chất', 'States of matter',
    'Rắn, lỏng, khí và sự chuyển thể.', 'Solids, liquids, gases and changes of state.', [
      table([['Thể', 'State'], ['Hình dạng', 'Shape'], ['Ví dụ', 'Example']], [[['Rắn', 'Solid'], ['có hình dạng riêng', 'keeps its own shape'], ['đá, nước đá, gỗ', 'stone, ice, wood']], [['Lỏng', 'Liquid'], ['theo hình vật chứa', 'takes the shape of its container'], ['nước, dầu, sữa', 'water, oil, milk']], [['Khí', 'Gas'], ['lan ra mọi nơi', 'spreads out everywhere'], ['hơi nước, không khí', 'steam, air']]]),
      list(['Nóng chảy: rắn → lỏng (đá tan). Đông đặc: lỏng → rắn (nước đóng băng).', 'Melting: solid → liquid. Freezing: liquid → solid.'], ['Bay hơi: lỏng → khí. Ngưng tụ: khí → lỏng (hơi nước đọng trên nắp nồi).', 'Evaporation: liquid → gas. Condensation: gas → liquid.']),
      rule('Ở áp suất bình thường, nước đông đặc ở 0 °C và sôi ở 100 °C.', 'At normal pressure water freezes at 0 °C and boils at 100 °C.'),
    ]),
  topic('s-light-sound', 'science', 4, 7, '🔦', 'Ánh sáng và âm thanh', 'Light and sound',
    'Ánh sáng truyền thế nào, âm thanh truyền qua đâu.', 'How light and sound travel.', [
      list(['Ánh sáng truyền theo đường thẳng; gặp vật cản không trong suốt thì tạo bóng.', 'Light travels in straight lines; opaque objects make shadows.'], ['Gương phẳng phản xạ ánh sáng: góc tới bằng góc phản xạ.', 'A flat mirror reflects light: angle in = angle out.'], ['Ta nhìn thấy vật khi có ánh sáng từ vật truyền vào mắt.', 'We see an object when light from it enters our eyes.']),
      list(['Âm thanh do vật rung động phát ra.', 'Sound is made by vibrations.'], ['Âm truyền qua chất rắn, lỏng, khí; nhanh nhất trong chất rắn; không truyền được trong chân không.', 'Sound travels through solids, liquids and gases — fastest in solids — but not through a vacuum.'], ['Tai nghe tốt nhất các âm có tần số từ khoảng 20 Hz đến 20 000 Hz.', 'Human ears hear roughly 20 Hz to 20,000 Hz.']),
    ]),
  topic('s-space', 'science', 4, 7, '🪐', 'Trái Đất và Hệ Mặt Trời', 'Earth and the Solar System',
    'Tám hành tinh, ngày và đêm, năm và mùa.', 'Eight planets, day and night, years and seasons.', [
      p('Tám hành tinh theo thứ tự từ gần đến xa Mặt Trời: Thuỷ, Kim, Trái Đất, Hoả, Mộc, Thổ, Thiên Vương, Hải Vương.', 'The eight planets from the Sun: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune.'),
      list(['Trái Đất tự quay quanh trục khoảng 24 giờ → ngày và đêm.', 'Earth spins on its axis about every 24 hours → day and night.'], ['Trái Đất quay quanh Mặt Trời khoảng 365 ngày 6 giờ → một năm. Trục nghiêng tạo ra các mùa.', 'Earth orbits the Sun in about 365¼ days → a year. Its tilt makes the seasons.'], ['Mặt Trăng quay quanh Trái Đất khoảng 29,5 ngày (một tháng âm lịch); Mặt Trăng không tự phát sáng mà phản chiếu ánh sáng Mặt Trời.', 'The Moon orbits Earth in about 29.5 days and shines by reflected sunlight.']),
      rule('Mộc tinh là hành tinh lớn nhất; Thuỷ tinh nhỏ nhất và gần Mặt Trời nhất.', 'Jupiter is the largest planet; Mercury is the smallest and closest to the Sun.'),
    ]),
  topic('s-food-chain', 'science', 4, 8, '🦊', 'Chuỗi thức ăn và môi trường', 'Food chains and the environment',
    'Các sinh vật phụ thuộc lẫn nhau.', 'Living things depend on each other.', [
      f(['Cỏ  →  Thỏ  →  Cáo  →  Vi khuẩn phân giải'], ['Mũi tên chỉ "bị ăn bởi".', 'Arrows mean "is eaten by".']),
      list(['Sinh vật sản xuất: cây xanh tự tạo chất dinh dưỡng.', 'Producers: green plants make their own food.'], ['Sinh vật tiêu thụ: động vật ăn thực vật hoặc ăn động vật khác.', 'Consumers: animals that eat plants or other animals.'], ['Sinh vật phân giải: vi khuẩn, nấm phân huỷ xác sinh vật thành chất khoáng.', 'Decomposers: bacteria and fungi break down dead matter.']),
      rule('Bảo vệ môi trường: tiết kiệm nước và điện, phân loại rác, trồng cây, hạn chế túi ni-lông.', 'Protect the environment: save water and power, sort rubbish, plant trees, use fewer plastic bags.'),
    ]),
  topic('s-physics', 'science', 6, 9, '⚙️', 'Công thức Vật lí cần nhớ', 'Key physics formulas',
    'Tốc độ, khối lượng riêng, áp suất, điện, công và công suất.', 'Speed, density, pressure, electricity, work and power.', [
      table([['Đại lượng', 'Quantity'], ['Công thức', 'Formula'], ['Đơn vị', 'Units']], [[['Tốc độ', 'Speed'], 'v = s / t', 'm/s, km/h'], [['Khối lượng riêng', 'Density'], 'D = m / V', 'kg/m³'], [['Trọng lượng', 'Weight'], 'P = 10 · m', 'N (m: kg)'], [['Áp suất', 'Pressure'], 'p = F / S', 'Pa = N/m²'], [['Áp suất chất lỏng', 'Liquid pressure'], 'p = d · h', 'Pa'], [['Định luật Ôm', 'Ohm’s law'], 'I = U / R', 'A, V, Ω'], [['Công cơ học', 'Work'], 'A = F · s', 'J'], [['Công suất', 'Power'], 'P = A / t', 'W']]),
      rule('Đổi đơn vị trước khi thay số: 1 km/h = 1000 m : 3600 s ≈ 0,28 m/s; 1 g/cm³ = 1000 kg/m³.', 'Convert units before substituting: 1 km/h ≈ 0.28 m/s; 1 g/cm³ = 1000 kg/m³.'),
      ex('Xe đi 120 km trong 2 giờ. Tốc độ?', 'A car travels 120 km in 2 hours. Speed?', 'v = 120 : 2 = 60 km/h.', 'v = 120 ÷ 2 = 60 km/h.'),
    ]),
  topic('s-atoms', 'science', 7, 9, '⚛️', 'Nguyên tử và bảng tuần hoàn', 'Atoms and the periodic table',
    'Cấu tạo nguyên tử và 20 nguyên tố đầu tiên.', 'What atoms are made of and the first 20 elements.', [
      list(['Nguyên tử gồm hạt nhân (proton mang điện +, neutron không mang điện) và vỏ electron mang điện −.', 'An atom has a nucleus (protons +, neutrons neutral) and electrons (−) around it.'], ['Số proton = số electron = số hiệu nguyên tử (Z), quyết định nguyên tố.', 'Number of protons = electrons = atomic number Z, which defines the element.']),
      w('periodic'),
      rule('Mỗi nguyên tố có một kí hiệu hoá học: chữ đầu viết hoa, chữ thứ hai (nếu có) viết thường — Na, Cl, Ca.', 'Each element has a symbol: capital first letter, small second letter — Na, Cl, Ca.'),
    ]),
  topic('s-acids', 'science', 8, 9, '🧪', 'Axit, bazơ và thang pH', 'Acids, bases and pH',
    'Nhận biết dung dịch axit, bazơ, trung tính.', 'Telling acids, bases and neutral solutions apart.', [
      table(['pH', ['Loại', 'Type'], ['Quỳ tím', 'Litmus'], ['Ví dụ', 'Examples']], [['< 7', ['Axit', 'Acid'], ['hoá đỏ', 'turns red'], ['nước chanh, giấm, HCl', 'lemon juice, vinegar, HCl']], ['= 7', ['Trung tính', 'Neutral'], ['không đổi màu', 'no change'], ['nước cất, nước muối', 'pure water, salt water']], ['> 7', ['Bazơ (kiềm)', 'Base (alkali)'], ['hoá xanh', 'turns blue'], ['nước xà phòng, NaOH', 'soapy water, NaOH']]]),
      f(['Axit + Bazơ → Muối + Nước', 'HCl + NaOH → NaCl + H₂O'], ['Phản ứng trung hoà.', 'Neutralisation.']),
      rule('An toàn: không nếm, không ngửi trực tiếp hoá chất; luôn có người lớn hướng dẫn khi làm thí nghiệm.', 'Safety: never taste or sniff chemicals; always work with an adult.'),
    ]),
  topic('s-cells', 'science', 6, 9, '🔬', 'Tế bào và di truyền', 'Cells and heredity',
    'Đơn vị cấu tạo nên cơ thể sống và cách tính trạng được truyền lại.', 'The building blocks of life and how traits are passed on.', [
      table([['Bộ phận', 'Part'], ['Nhiệm vụ', 'Job']], [[['Màng tế bào', 'Cell membrane'], ['bao bọc, kiểm soát chất ra vào', 'controls what goes in and out']], [['Tế bào chất', 'Cytoplasm'], ['nơi diễn ra các hoạt động sống', 'where life processes happen']], [['Nhân', 'Nucleus'], ['chứa vật chất di truyền, điều khiển tế bào', 'holds DNA and controls the cell']], [['Lục lạp (tế bào thực vật)', 'Chloroplast (plants)'], ['quang hợp', 'photosynthesis']], [['Thành tế bào (thực vật)', 'Cell wall (plants)'], ['giữ hình dạng tế bào', 'keeps the cell’s shape']]]),
      list(['DNA mang thông tin di truyền; một đoạn DNA quy định một tính trạng gọi là gen.', 'DNA carries hereditary information; a section that controls a trait is a gene.'], ['Tế bào người có 46 nhiễm sắc thể (23 cặp).', 'Human cells have 46 chromosomes (23 pairs).']),
    ]),
];
