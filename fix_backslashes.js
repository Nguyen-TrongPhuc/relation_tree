const fs = require('fs');
let code = fs.readFileSync('src/components/home/CoupleBadge.tsx', 'utf8');

code = code.replace(/\\`/g, '`');
code = code.replace(/\\\$/g, '$');

fs.writeFileSync('src/components/home/CoupleBadge.tsx', code);
console.log('Fixed backslashes');
