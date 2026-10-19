import { Subject } from '@/types';

export const mockSubjects: Subject[] = [
  {
    id: 'math',
    name: { vi: 'Toán học', en: 'Math' },
    world: 'numbers',
    mascot: 'bo',
    description: {
      vi: 'Khám phá Đảo Con Số, tính toán siêu tốc cùng Cú Bơ thông thái!',
      en: 'Explore Number Island and master rapid arithmetic with wise Bo the Owl!',
    },
    color: '#2FB4F5',
  },
  {
    id: 'vietnamese',
    name: { vi: 'Tiếng Việt', en: 'Vietnamese' },
    world: 'letters',
    mascot: 'mochi',
    description: {
      vi: 'Ghé thăm Làng Chữ thanh bình, ghép vần gieo thơ cùng Thỏ Mochi!',
      en: 'Visit peaceful Letter Village and rhyme with Mochi the Rabbit!',
    },
    color: '#FF9F1C',
  },
  {
    id: 'english',
    name: { vi: 'Tiếng Anh', en: 'English' },
    world: 'abc',
    mascot: 'foxy',
    description: {
      vi: 'Dạo bước Thành Phố ABC rực rỡ, giao tiếp tự tin cùng Cáo Foxy!',
      en: 'Stroll around glowing ABC City and speak confidently with Foxy!',
    },
    color: '#9B5CF6',
  },
  {
    id: 'science',
    name: { vi: 'Khoa học', en: 'Science' },
    world: 'discovery',
    mascot: 'kiwi',
    description: {
      vi: 'Thám hiểm Rừng Khám Phá kỳ bí, làm thí nghiệm vui cùng Ếch Kiwi!',
      en: 'Trek through magical Discovery Forest and experiment with Kiwi the Frog!',
    },
    color: '#5BCB2A',
  },
];
