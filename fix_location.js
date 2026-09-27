const fs = require('fs');
let code = fs.readFileSync('src/components/providers/AuthProvider.tsx', 'utf8');

code = code.replace(
  /if \(localStorage\.getItem\('allow_location'\) !== 'true'\) return;/g,
  `// if (localStorage.getItem('allow_location') !== 'true') return;`
);

fs.writeFileSync('src/components/providers/AuthProvider.tsx', code);
console.log('Removed allow_location check');
