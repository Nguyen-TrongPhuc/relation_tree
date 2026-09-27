const fs = require('fs');
let code = fs.readFileSync('src/components/chat/ChatWidget.tsx', 'utf8');

code = code.replace(/Ä á»•i biá»‡t danh/g, 'Đổi biệt danh');
code = code.replace(/Ä á»•i hình nền chat/g, 'Đổi hình nền chat');

const searchBlock = `<div className={\`p-3 shadow-sm whitespace-pre-wrap word-break flex flex-col relative group \${`;
const replaceBlock = `{(() => {
  const isImageOnly = msg.image_url && (!msg.content || msg.content === '📸 Vừa chia sẻ một khoảnh khắc') && !msg.replied_message && !msg.content?.startsWith('CALL::');
  return (
    <div className={\`whitespace-pre-wrap word-break flex flex-col relative group \${
      isImageOnly ? 'bg-transparent text-gray-800 items-end p-0' :`;
code = code.replace(searchBlock, replaceBlock);

code = code.replace(
  /'bg-gradient-to-br from-pink-500 to-rose-500 text-white rounded-\[20px\] rounded-br-\[4px\] shadow-md shadow-pink-500\/20 items-end'/g,
  `'p-3 bg-pink-500 text-white rounded-[20px] rounded-br-[4px] shadow-sm items-end'`
);

code = code.replace(
  /: 'bg-white text-gray-800 border border-gray-100 rounded-\[20px\] rounded-bl-\[4px\] shadow-sm items-start'/g,
  `: 'p-3 bg-white text-gray-800 border border-gray-100 rounded-[20px] rounded-bl-[4px] shadow-sm items-start'`
);

code = code.replace(
  /                        <\/div>\r?\n\r?\n                        \{\/\* Message Status \*\/\}/g,
  `                        </div>\n                      );\n                    })()}\n\n                        {/* Message Status */}`
);

fs.writeFileSync('src/components/chat/ChatWidget.tsx', code);
console.log('Done!');
