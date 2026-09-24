const fs = require('fs');
let code = fs.readFileSync('src/app/(auth)/register/page.tsx', 'utf8');

code = code.replace(
  "window.location.href = '/setup';",
  "router.push('/setup');"
);

fs.writeFileSync('src/app/(auth)/register/page.tsx', code, 'utf8');
