const fs = require('fs');
let content = fs.readFileSync('src/components/chat/ChatWidget.tsx', 'utf8');

const replacements = {
  'âšª': '⚪',
  'má»›i': 'mới',
  'phĂºt': 'phút',
  'ngĂ y': 'ngày',
  'cục bá»™': 'cục bộ',
  'vĂ¬': 'vì',
  'Lá»—i': 'Lỗi',
  'hĂ¬nh nền': 'hình nền',
  'chá»‰ cho phĂ©p': 'chỉ cho phép',
  'sá»‘': 'số',
  'dÆ°á»›i': 'dưới',
  'xĂ³a': 'xóa',
  'Chá»‰': 'Chỉ',
  'Ä‘á»• chuĂ´ng': 'đổ chuông',
  'má»Ÿ': 'mở',
  'thay Ä‘á»•i': 'thay đổi',
  'đá»“ng bá»™': 'đồng bộ',
  'trạng thĂ¡i': 'trạng thái',
  'cuá»™c': 'cuộc',
  'Tự Ä‘á»™ng': 'Tự động',
  'khĂ´ng cĂ²n': 'không còn',
  'lĂ ': 'là',
  'HiỒn thá»‹': 'Hiển thị',
  'mĂ n hĂ¬nh': 'màn hình',
  'Ä‘á»£i': 'đợi',
  'Đang Ä‘á»•': 'Đang đổ',
  'đŸ“ž': '📞',
  'POPUP CUá»˜C Gá»ŒI ĐẾN': 'POPUP CUỘC GỌI ĐẾN',
  'hiá»‡n': 'hiện',
  'Ä‘áº¿n': 'đến',
  'NĂºt': 'Nút',
  'trực tuyến đŸŸ¢': 'trực tuyến 🟢',
  'TĂ¬m': 'Tìm',
  'Ä‘oạn': 'đoạn',
  'KhĂ´ng': 'Không',
  'tĂ¬m': 'tìm',
  'nĂ o': 'nào',
  'HĂ£y': 'Hãy',
  'chĂ o': 'chào',
  'nhĂ©! đŸ’•': 'nhé! 💕',
  'HĂ´m': 'Hôm',
  'diá»…n': 'diễn',
  'thĂºc': 'thúc',
  'chối': 'chối',
  'Ä á»•i': 'Đổi',
  'biá»‡t danh': 'biệt danh',
  'hĂ¬nh': 'hình'
};

for (const [bad, good] of Object.entries(replacements)) {
    content = content.replaceAll(bad, good);
}

fs.writeFileSync('src/components/chat/ChatWidget.tsx', content, 'utf8');
