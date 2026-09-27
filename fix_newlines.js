const fs = require('fs');
let code = fs.readFileSync('src/components/chat/ChatWidget.tsx', 'utf8');

// The file currently has literal "\n" everywhere instead of real newlines!
// Wait, did it join the ENTIRE file with literal "\n"?
// Let's replace literal "\n" with real newline!
code = code.replace(/\\n/g, '\n');

fs.writeFileSync('src/components/chat/ChatWidget.tsx', code);
console.log('Fixed literal newlines');
