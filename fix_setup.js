const fs = require('fs');
let code = fs.readFileSync('src/app/(auth)/setup/page.tsx', 'utf8');

code = code.replace(/window\.location\.href = '\/';/g, "router.push('/');");
code = code.replace(/window\.location\.href = '\/login';/g, "router.push('/login');");

fs.writeFileSync('src/app/(auth)/setup/page.tsx', code, 'utf8');
