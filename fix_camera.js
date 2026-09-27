const fs = require('fs');
let code = fs.readFileSync('src/components/locket/LiveCameraModal.tsx', 'utf8');

// Change flex positioning to justify-start and pt-24
code = code.replace(
  `className="relative w-full h-[100dvh] min-h-[100dvh] bg-black flex flex-col items-center justify-center z-10"`,
  `className="relative w-full h-[100dvh] min-h-[100dvh] bg-black flex flex-col items-center justify-start pt-[12vh] z-10"`
);

fs.writeFileSync('src/components/locket/LiveCameraModal.tsx', code);
console.log('Done camera modal!');
