const fs = require('fs');

function addImports(filePath) {
  let c = fs.readFileSync(filePath, 'utf8');
  
  if (!c.includes('import LiveCameraModal')) {
    c = c.replace(
      "import FloatingReactions, { FloatingReactionsRef } from '@/components/locket/FloatingReactions';",
      "import FloatingReactions, { FloatingReactionsRef } from '@/components/locket/FloatingReactions';\nimport LiveCameraModal from '@/components/locket/LiveCameraModal';\nimport PreviewModal from '@/components/locket/PreviewModal';"
    );
    fs.writeFileSync(filePath, c, 'utf8');
    console.log('Fixed', filePath);
  }
}

addImports('src/components/home/LocketWidget.tsx');
addImports('src/app/locket/page.tsx');
