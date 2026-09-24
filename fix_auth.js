const fs = require('fs');
let code = fs.readFileSync('src/components/providers/AuthProvider.tsx', 'utf8');

code = code.replace(
  /const { data: { subscription } } = supabase\.auth\.onAuthStateChange\(\s*async \(event, session\) => \{/g,
  "const { data: { subscription } } = supabase.auth.onAuthStateChange(\n      async (event, session) => {\n        if (event === 'INITIAL_SESSION') return;\n"
);

fs.writeFileSync('src/components/providers/AuthProvider.tsx', code, 'utf8');
