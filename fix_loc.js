const fs = require('fs');
let code = fs.readFileSync('src/components/providers/AuthProvider.tsx', 'utf8');

code = code.replace(
    "const { data } = await supabase",
    "const { data, error } = await supabase"
);

code = code.replace(
    "if (data?.last_lat && data?.last_lng) {",
    "if (error) { console.error('Missing location columns in DB?', error); } else if (data?.last_lat && data?.last_lng) {"
);

fs.writeFileSync('src/components/providers/AuthProvider.tsx', code, 'utf8');
