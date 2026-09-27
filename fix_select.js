const fs = require('fs');
let code = fs.readFileSync('src/components/providers/AuthProvider.tsx', 'utf8');

code = code.replace(
    ".select('id, display_name, avatar_url, last_active')",
    ".select('id, display_name, avatar_url')"
);

fs.writeFileSync('src/components/providers/AuthProvider.tsx', code, 'utf8');
