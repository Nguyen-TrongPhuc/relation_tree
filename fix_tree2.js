const fs = require('fs');
let code = fs.readFileSync('src/components/world/InteractiveTreeWorld.tsx', 'utf8');

code = code.replace(
  /const p = data\.find\(\(p: any\) => p\.id === partnerProfile\.id\);/g,
  `const p = partnerProfile?.id ? data.find((p: any) => p.id === partnerProfile.id) : null;`
);

code = code.replace(
  /\$\{partnerProfile\.id\}/g,
  `\${partnerProfile?.id || 'partner'}`
);

code = code.replace(
  /\{partnerProfile\.display_name\}/g,
  `{partnerProfile?.display_name || 'Người ấy'}`
);

fs.writeFileSync('src/components/world/InteractiveTreeWorld.tsx', code);
console.log('Fixed more crashes');
