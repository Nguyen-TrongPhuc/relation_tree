const fs = require('fs');
let content = fs.readFileSync('src/components/chat/ChatWidget.tsx', 'utf8');

// The character is U+FFFD
content = content.replace(/Bn/g, 'Bạn');
content = content.replace(/Ng\?i \?y/g, 'Người ấy');
content = content.replace(/Ng\?i y/g, 'Người ấy');
content = content.replace(/Người ấy/g, 'Người ấy');
content = content.replace(/B\?n/g, 'Bạn');
content = content.replace(/Ng\?i \?y/g, 'Người ấy');
content = content.replace(/B\? ghim/g, 'Bỏ ghim');
content = content.replace(/ang tr\? l\?i/g, 'Đang trả lời');
content = content.replace(/chnh b\?n/g, 'chính bạn');
content = content.replace(/ng\?i \?y/g, 'người ấy');
content = content.replace(/Tr\? l\?i/g, 'Trả lời');

fs.writeFileSync('src/components/chat/ChatWidget.tsx', content, 'utf8');
