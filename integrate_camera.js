const fs = require('fs');

function updateFile(filePath) {
  let c = fs.readFileSync(filePath, 'utf8');
  
  if (!c.includes('LiveCameraModal')) {
    // Add import
    c = c.replace(
      "import PreviewModal from ",
      "import LiveCameraModal from '@/components/locket/LiveCameraModal';\nimport PreviewModal from "
    );
    if (!c.includes('LiveCameraModal from')) {
        c = c.replace(
          "import PreviewModal from",
          "import LiveCameraModal from '@/components/locket/LiveCameraModal';\nimport PreviewModal from"
        );
    }
    
    // Add state
    c = c.replace(
      "const [isPreviewOpen, setIsPreviewOpen] = useState(false);",
      "const [isPreviewOpen, setIsPreviewOpen] = useState(false);\n  const [isCameraOpen, setIsCameraOpen] = useState(false);"
    );
    
    // Replace fileInputRefs
    c = c.replaceAll("fileInputRef.current?.click()", "setIsCameraOpen(true)");
    
    // Replace <input type="file" ... /> with LiveCameraModal
    const inputRegex = /<input[^>]*type="file"[^>]*ref={fileInputRef}[^>]*>/;
    c = c.replace(inputRegex, "");
    
    // Add LiveCameraModal before PreviewModal
    const previewModalRegex = /<PreviewModal/;
    c = c.replace(
      previewModalRegex,
      `<LiveCameraModal 
        isOpen={isCameraOpen} 
        onClose={() => setIsCameraOpen(false)} 
        onCapture={(file) => {
          setPhotoFile(file);
          setIsCameraOpen(false);
          setIsPreviewOpen(true);
        }} 
      />\n      <PreviewModal`
    );
    
    // For LocketWidget, update aspect-square to aspect-[4/5]
    if (filePath.includes('LocketWidget')) {
      c = c.replace('aspect-square', 'aspect-[4/5]');
    }
    
    fs.writeFileSync(filePath, c, 'utf8');
    console.log('Updated', filePath);
  }
}

updateFile('src/components/home/LocketWidget.tsx');
updateFile('src/app/locket/page.tsx');
