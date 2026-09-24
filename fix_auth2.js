const fs = require('fs');
let code = fs.readFileSync('src/components/providers/AuthProvider.tsx', 'utf8');

code = code.replace(
  /const loadPairData = async \(userId: string\) => \{/g,
  "const loadPairData = async (userId: string) => {\n    try {\n"
);

code = code.replace(
  /setPartnerProfile\(profiles\?\.find\(p => p\.id === partnerId\) \|\| \{ id: partnerId, display_name: 'Người ấy', avatar_url: null \}\);\n    \}/g,
  "setPartnerProfile(profiles?.find(p => p.id === partnerId) || { id: partnerId, display_name: 'Người ấy', avatar_url: null });\n    } catch (error) {\n      console.error('Error loading pair data:', error);\n    }\n"
);

fs.writeFileSync('src/components/providers/AuthProvider.tsx', code, 'utf8');
