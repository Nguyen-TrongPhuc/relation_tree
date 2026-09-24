const fs = require('fs');
let code = fs.readFileSync('src/app/(auth)/login/page.tsx', 'utf8');

code = code.replace(
  "// Thành công, tải lại trang để AuthProvider nhận session từ localStorage\n      window.location.href = '/';",
  "// Thành công, chuyển hướng\n      router.push('/');"
);

fs.writeFileSync('src/app/(auth)/login/page.tsx', code, 'utf8');
