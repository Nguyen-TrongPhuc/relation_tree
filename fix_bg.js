const fs = require('fs');
let code = fs.readFileSync('src/components/providers/AuthProvider.tsx', 'utf8');

code = code.replace(
    ".select('id, sender_id, receiver_id, background_url')",
    ".select('id, sender_id, receiver_id')" // Removed background_url to prevent 400 error
);

fs.writeFileSync('src/components/providers/AuthProvider.tsx', code, 'utf8');
