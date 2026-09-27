const fs = require('fs');

let content = fs.readFileSync('src/components/chat/ChatWidget.tsx', 'utf8');

const replacements = {
    'XĂ³a': 'Xóa',
    'cĂ³': 'có',
    'cĂ¹ng': 'cùng',
    'ná»™i': 'nội',
    'Ă¢m': 'âm',
    'nháº¯n': 'nhắn',
    'áº£o': 'ảo',
    'lá»—i': 'lỗi',
    'MĂ n hĂ¬nh': 'Màn hình',
    'chờ Ä‘á»• chuĂ´ng': 'chờ đổ chuông',
    'Ä‘ang Ä‘á»£i': 'đang đợi',
    'PhĂ¡t hiá»‡n': 'Phát hiện',
    'cuá»™c gọi Ä‘áº¿n': 'cuộc gọi đến',
    'từ chá»‘i': 'từ chối',
    'Nhắn gĂ¬ Ä‘i': 'Nhắn gì đi',
    'tĂ¹y': 'tùy',
    'Ä\x90Ăƒ': 'ĐÃ',
    'NgÆ°á»\x9Di áº¥y': 'Người ấy',
    'khĂ¡c': 'khác',
    'Ä‘oáº¡n': 'đoạn',
    'á»§ng': 'ủng',
    'tá»‡p': 'tệp',
    'báº¡n': 'bạn',
    'Ä\x90ang': 'Đang',
    'gá»i': 'gửi',
    'tráº£ lá»\x9Di': 'trả lời'
};

for (const [bad, good] of Object.entries(replacements)) {
    content = content.replaceAll(bad, good);
}

fs.writeFileSync('src/components/chat/ChatWidget.tsx', content, 'utf8');
