const fs = require('fs');
let code = fs.readFileSync('src/components/chat/ChatWidget.tsx', 'utf8');

const bubbleSearch = `<div className={\`whitespace-pre-wrap word-break flex flex-col relative group \${`;
const bubbleReplace = `<div 
onClick={() => setContextMenuFor(contextMenuFor === msg.id ? null : msg.id)} 
className={\`whitespace-pre-wrap word-break flex flex-col relative group cursor-pointer \${`;
code = code.replace(bubbleSearch, bubbleReplace);

// We should also close the context menu when clicking outside (e.g. on the chat container).
// Actually, they can just click the bubble again to close it, which is fine for now.

fs.writeFileSync('src/components/chat/ChatWidget.tsx', code);
console.log('Task 8 Done');
