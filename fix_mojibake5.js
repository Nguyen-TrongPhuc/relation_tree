const fs = require('fs');
let content = fs.readFileSync('src/components/chat/ChatWidget.tsx', 'utf8');

const replacements = {
  'âšª': '⚪',
  'Ä‘á»ƒ': 'để',
  'Ä‘á»“ng bá»™': 'đồng bộ',
  'trĂªn': 'trên',
  'đŸ“ž': '📞',
  'Cuá»™c': 'Cuộc',
  'chá»‰': 'chỉ',
  'má»™t': 'một',
  'Ä á»•i': 'Đổi',
  'Ä‘ang': 'đang'
};

for (const [bad, good] of Object.entries(replacements)) {
    content = content.replaceAll(bad, good);
}

fs.writeFileSync('src/components/chat/ChatWidget.tsx', content, 'utf8');
