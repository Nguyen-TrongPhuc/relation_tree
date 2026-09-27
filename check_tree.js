const fs = require('fs');
const content = fs.readFileSync('src/components/world/InteractiveTreeWorld.tsx', 'utf8');
const idx = content.indexOf('className="absolute bottom-6');
console.log(content.substring(idx - 200, idx + 800));
