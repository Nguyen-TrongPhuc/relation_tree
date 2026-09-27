const fs = require('fs');

let chatCode = fs.readFileSync('src/components/chat/ChatWidget.tsx', 'utf8');

chatCode = chatCode.replace(
  /'p-3 bg-pink-500 text-white rounded-\[20px\] rounded-br-\[4px\] shadow-sm items-end'/g,
  `\`p-3 \${myBubbleColor} text-white rounded-[20px] rounded-br-[4px] shadow-sm items-end\``
);

fs.writeFileSync('src/components/chat/ChatWidget.tsx', chatCode);
console.log('Fixed Bubble Colors');
