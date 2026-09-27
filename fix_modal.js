const fs = require('fs');
let c = fs.readFileSync('src/components/locket/PreviewModal.tsx', 'utf8');

c = c.replace(
  'if (!isOpen || !photoFile) return null;\r\n\r\n  const objectUrl = React.useMemo(() => URL.createObjectURL(photoFile), [photoFile]);',
  'const objectUrl = React.useMemo(() => photoFile ? URL.createObjectURL(photoFile) : "", [photoFile]);\r\n\r\n  if (!isOpen || !photoFile) return null;'
);
c = c.replace(
  'if (!isOpen || !photoFile) return null;\n\n  const objectUrl = React.useMemo(() => URL.createObjectURL(photoFile), [photoFile]);',
  'const objectUrl = React.useMemo(() => photoFile ? URL.createObjectURL(photoFile) : "", [photoFile]);\n\n  if (!isOpen || !photoFile) return null;'
);

// Additionally, for the mirrored image issue:
// I will add a 'Lật ảnh' button to the PreviewModal to let the user flip it.
if (!c.includes('flipHorizontal')) {
  // Add state for flip
  c = c.replace(
    'const [selectedFilter, setSelectedFilter] = useState(FILTERS[0]);',
    'const [selectedFilter, setSelectedFilter] = useState(FILTERS[0]);\n  const [isFlipped, setIsFlipped] = useState(false);'
  );
  
  // Apply flip to the image preview
  c = c.replace(
    'style={{ filter: selectedFilter.filter !== \'none\' ? selectedFilter.filter : undefined }}',
    'style={{ filter: selectedFilter.filter !== \'none\' ? selectedFilter.filter : undefined, transform: isFlipped ? \'scaleX(-1)\' : \'none\' }}'
  );
  
  // Apply flip to the canvas before uploading
  const canvasDrawString = 'ctx.filter = selectedFilter.filter;\n          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);';
  const newCanvasDrawString = `ctx.filter = selectedFilter.filter;
          if (isFlipped) {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
          }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);`;
  c = c.replace(canvasDrawString, newCanvasDrawString);
  
  // If it didn't replace because of CRLF
  const canvasDrawStringCRLF = 'ctx.filter = selectedFilter.filter;\r\n          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);';
  c = c.replace(canvasDrawStringCRLF, newCanvasDrawString);
  
  // Add Flip button in the UI next to filters
  const filterDiv = '{/* Filter Options */}';
  const flipButton = `<button 
          onClick={() => setIsFlipped(!isFlipped)}
          className="whitespace-nowrap px-4 py-2 mr-2 rounded-full text-sm font-medium backdrop-blur-md transition-all bg-gray-800 text-white border border-gray-600 hover:bg-gray-700"
        >
          {isFlipped ? 'Khôi phục' : 'Lật ảnh ↔️'}
        </button>`;
  c = c.replace(
    '{FILTERS.map(f => (',
    flipButton + '\n        {FILTERS.map(f => ('
  );
}

fs.writeFileSync('src/components/locket/PreviewModal.tsx', c, 'utf8');
