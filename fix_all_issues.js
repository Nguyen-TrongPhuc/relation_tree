const fs = require('fs');

// 1. Fix locket setPage error
let locketCode = fs.readFileSync('src/app/locket/page.tsx', 'utf8');
locketCode = locketCode.replace(/setPage\(0\);\n/, '');
fs.writeFileSync('src/app/locket/page.tsx', locketCode);
console.log('Fixed setPage in locket');

// 2. Fix LocationMap tiles
let mapCode = fs.readFileSync('src/components/map/LocationMap.tsx', 'utf8');
mapCode = mapCode.replace(
  /url="https:\/\/\{s\}\.basemaps\.cartocdn\.com\/rastertiles\/voyager\/\{z\}\/\{x\}\/\{y\}\{r\}\.png"/,
  `url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"`
);
fs.writeFileSync('src/components/map/LocationMap.tsx', mapCode);
console.log('Fixed Map tiles URL');

// 3. Fix PreviewModal background
let previewCode = fs.readFileSync('src/components/locket/PreviewModal.tsx', 'utf8');
previewCode = previewCode.replace(
  /<div className="fixed inset-0 z-\[9999\] bg-black flex flex-col items-center justify-center animate-in fade-in duration-200">/,
  `<div className="fixed inset-0 z-[9999] bg-gradient-to-br from-pink-950 via-gray-900 to-teal-950 flex flex-col items-center justify-center animate-in fade-in duration-200 backdrop-blur-xl">`
);
fs.writeFileSync('src/components/locket/PreviewModal.tsx', previewCode);
console.log('Fixed PreviewModal background');
