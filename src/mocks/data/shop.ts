import { ShopItem } from '@/types';

export const mockShopItems: ShopItem[] = [
  // Hair
  { id: 'hair-spiky', name: { vi: 'Tóc gai nhọn cá tính', en: 'Spiky Cool Hair' }, category: 'hair', price: 30 },
  { id: 'hair-curly', name: { vi: 'Tóc xoăn bồng bềnh', en: 'Bouncy Curly Hair' }, category: 'hair', price: 40 },
  { id: 'hair-ponytail', name: { vi: 'Tóc đuôi ngựa năng động', en: 'Pony Tail' }, category: 'hair', price: 45 },
  { id: 'hair-bob', name: { vi: 'Tóc ngắn cúp đáng yêu', en: 'Cute Bob Cut' }, category: 'hair', price: 35 },
  { id: 'hair-braids', name: { vi: 'Tóc tết hai bím dễ thương', en: 'Twin Braids' }, category: 'hair', price: 50, isNew: true },
  { id: 'hair-short', name: { vi: 'Tóc tém gọn gàng', en: 'Neat Short Cut' }, category: 'hair', price: 25 },

  // Outfits
  { id: 'tshirt-blue', name: { vi: 'Áo phông xanh biển', en: 'Ocean Blue Tee' }, category: 'outfit', price: 20 },
  { id: 'outfit-superhero', name: { vi: 'Áo choàng siêu nhân', en: 'Superhero Cape' }, category: 'outfit', price: 80, isNew: true },
  { id: 'outfit-scientist', name: { vi: 'Áo blouse phòng lab', en: 'Lab Scientist Coat' }, category: 'outfit', price: 65 },
  { id: 'outfit-pilot', name: { vi: 'Đồng phục phi công nhí', en: 'Junior Pilot Suit' }, category: 'outfit', price: 75 },
  { id: 'outfit-ao-dai', name: { vi: 'Áo dài truyền thống', en: 'Traditional Ao Dai' }, category: 'outfit', price: 90 },
  { id: 'outfit-hoodie-orange', name: { vi: 'Áo nỉ cam ấm áp', en: 'Warm Orange Hoodie' }, category: 'outfit', price: 50 },

  // Hats
  { id: 'cap-red', name: { vi: 'Mũ lưỡi trai đỏ', en: 'Sporty Red Cap' }, category: 'hat', price: 25 },
  { id: 'hat-straw', name: { vi: 'Nón lá truyền thống', en: 'Conical Palm Hat' }, category: 'hat', price: 45 },
  { id: 'hat-wizard', name: { vi: 'Mũ pháp sư thần bí', en: 'Wizard Hat' }, category: 'hat', price: 70 },
  { id: 'hat-crown', name: { vi: 'Vương miện hoàng gia', en: 'Royal Crown' }, category: 'hat', price: 100, isNew: true },
  { id: 'hat-beanie', name: { vi: 'Mũ len quả bông', en: 'Pompom Beanie' }, category: 'hat', price: 35 },
  { id: 'hat-chef', name: { vi: 'Mũ đầu bếp tí hon', en: 'Little Chef Toque' }, category: 'hat', price: 40 },

  // Glasses
  { id: 'glasses-round', name: { vi: 'Kính tròn trí thức', en: 'Round Scholar Specs' }, category: 'glasses', price: 30 },
  { id: 'glasses-star', name: { vi: 'Kính ngôi sao tiệc tùng', en: 'Party Star Shades' }, category: 'glasses', price: 45, isNew: true },
  { id: 'glasses-goggles', name: { vi: 'Kính bảo hộ thí nghiệm', en: 'Lab Goggles' }, category: 'glasses', price: 40 },
  { id: 'glasses-sun', name: { vi: 'Kính mát sành điệu', en: 'Cool Sunglasses' }, category: 'glasses', price: 35 },

  // Pets
  { id: 'pet-chick', name: { vi: 'Gà con Chíp Chíp', en: 'Tiny Chick Pet' }, category: 'pet', price: 80 },
  { id: 'pet-puppy', name: { vi: 'Cún con Tai Dài', en: 'Fluffy Puppy' }, category: 'pet', price: 90 },
  { id: 'pet-kitten', name: { vi: 'Mèo con Mướp Vàng', en: 'Golden Kitten' }, category: 'pet', price: 95, isNew: true },
  { id: 'pet-dragon', name: { vi: 'Rồng con tí hon', en: 'Baby Mini Dragon' }, category: 'pet', price: 150 },
];
