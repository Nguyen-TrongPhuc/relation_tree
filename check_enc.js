const fs = require('fs');
const content = fs.readFileSync('src/components/chat/ChatWidget.tsx', 'utf8');
const searchStr = "Ng";
const idx = content.indexOf(searchStr);
console.log(content.substring(idx, idx + 500));
