export interface SpecialWish {
  day: number;
  month: number;
  year?: number; // Tùy chọn: chỉ hiện vào năm cụ thể
  title: string;
  message: string;
  themeColor: string;
}

export const WISHES_DATA: SpecialWish[] = [
  {
    day: 1,
    month: 1,
    title: 'Kỷ Niệm Tình Yêu 💖',
    message: 'Chúc mừng kỷ niệm ngày yêu của chúng mình! Cảm ơn em đã bước vào cuộc đời anh và làm cho mỗi ngày trôi qua đều rực rỡ như cái cây tình yêu này. Mãi yêu em!',
    themeColor: 'from-pink-500 to-rose-400'
  },
  {
    day: 14,
    month: 2,
    title: 'Happy Valentine! 🍫',
    message: 'Chúc em một ngày Valentine thật ngọt ngào. Dù không ở bên nhau từng phút từng giây, nhưng anh mong không gian này sẽ luôn là nơi lưu giữ tình yêu của chúng mình.',
    themeColor: 'from-red-500 to-pink-500'
  },
  {
    day: 8,
    month: 3,
    title: 'Quốc Tế Phụ Nữ 🌸',
    message: 'Chúc người con gái xinh đẹp nhất của anh ngày 8/3 thật nhiều niềm vui và nụ cười. Hãy luôn rạng rỡ và tỏa sáng nhé!',
    themeColor: 'from-fuchsia-500 to-purple-400'
  },
  {
    day: 15,
    month: 8,
    title: 'Sinh Nhật Của Anh 🎂',
    message: 'Hôm nay là sinh nhật anh. Điều ước duy nhất của anh là chúng ta sẽ luôn nắm tay nhau đi qua những ngày tháng êm đềm như thế này. Cảm ơn em đã ở bên anh!',
    themeColor: 'from-blue-500 to-cyan-400'
  },
  {
    day: 20,
    month: 10,
    title: 'Phụ Nữ Việt Nam 🌹',
    message: 'Nhân ngày 20/10, chúc em luôn xinh đẹp, hạnh phúc và bình an. Anh sẽ luôn ở đây, làm bóng râm che chở cho em.',
    themeColor: 'from-rose-400 to-red-400'
  },
  {
    day: 20,
    month: 11,
    year: 2026, // Ngày 1
    title: 'Sinh Nhật Em & Mầm Cây 🌱',
    message: 'Chúc mừng sinh nhật công chúa của anh! Món quà tuổi mới năm nay không chỉ là những lời chúc, mà là một mầm cây tình yêu bé nhỏ. Kể từ hôm nay, đôi ta sẽ cùng nhau chăm sóc, vun vén cho mầm cây này lớn lên mỗi ngày, giống như tình yêu của chúng mình vậy. Chúc em sinh nhật thật hạnh phúc!',
    themeColor: 'from-green-400 to-emerald-500'
  },
  {
    day: 20,
    month: 11,
    year: 2027, // Ngày 366 (Cổ thụ)
    title: 'Sinh Nhật & Trái Tim Đơm Hoa 💖',
    message: 'Chúc mừng sinh nhật em một lần nữa! Tròn một năm trôi qua, em có thấy không? Mầm cây nhỏ xíu ngày nào tụi mình cùng trồng giờ đã bung nở thành một trái tim hoa rực rỡ nhất. Cảm ơn em đã cùng anh chăm sóc cái cây này, và cảm ơn em vì 365 ngày qua đã luôn ở bên anh. Yêu em vô cùng!',
    themeColor: 'from-rose-500 to-pink-500'
  },
  {
    day: 24,
    month: 12,
    title: 'Merry Christmas! 🎄',
    message: 'Giáng sinh an lành nhé tình yêu của anh! Chúc cho chúng ta sẽ đón thêm thật nhiều mùa Giáng sinh cùng nhau nữa.',
    themeColor: 'from-green-500 to-emerald-400'
  }
];
