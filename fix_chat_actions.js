const fs = require('fs');

let actionsCode = fs.readFileSync('src/app/actions/chat.ts', 'utf8');

actionsCode = actionsCode.replace(
  /\.from\('friendships'\)/g,
  `.from('pair_requests')`
);

fs.writeFileSync('src/app/actions/chat.ts', actionsCode);
console.log('Fixed chat.ts table name');
