const fs = require('fs');
let code = fs.readFileSync('src/app/actions/chat.ts', 'utf8');

code = code.replace(
  /\.from\('pair_requests'\)/g,
  `.from('friendships')`
);

fs.writeFileSync('src/app/actions/chat.ts', code);
console.log('Fixed table name back to friendships in chat.ts');
