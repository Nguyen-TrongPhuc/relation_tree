const fs = require('fs');

function replaceCyanWithTeal(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');
  // Replace Tailwind classes
  code = code.replace(/cyan-400/g, 'teal-400');
  code = code.replace(/cyan-500/g, 'teal-500');
  code = code.replace(/cyan-600/g, 'teal-600');
  code = code.replace(/cyan-700/g, 'teal-700');
  code = code.replace(/cyan-100/g, 'teal-100');
  // Replace hex
  code = code.replace(/#06b6d4/g, '#14b8a6');
  // Replace text
  code = code.replace(/Nam \(Xanh ngọc\)/g, 'Nam (Xanh dương ngọc)');
  
  fs.writeFileSync(filePath, code);
}

replaceCyanWithTeal('src/components/map/LocationMap.tsx');
replaceCyanWithTeal('src/components/chat/ChatWidget.tsx');
replaceCyanWithTeal('src/components/home/CoupleBadge.tsx');
replaceCyanWithTeal('src/app/(auth)/settings/profile/page.tsx');

console.log('Replaced cyan with teal!');
