const fs = require('fs');

// --- 1. Modify LiveCameraModal.tsx ---
let c1 = fs.readFileSync('src/components/locket/LiveCameraModal.tsx', 'utf8');

// Change aspect-[3/4] to aspect-square
c1 = c1.replace('aspect-[3/4]', 'aspect-square');

// Add Flash icon import
if (!c1.includes('Zap')) {
    c1 = c1.replace('X, Camera, RefreshCcw, Loader2', 'X, Camera, RefreshCcw, Loader2, Zap');
}

// Add flash state
if (!c1.includes('isFlashOn')) {
    c1 = c1.replace(
        'const [isLoading, setIsLoading] = useState(false);',
        'const [isLoading, setIsLoading] = useState(false);\n  const [isFlashOn, setIsFlashOn] = useState(false);'
    );
}

// Add flash toggle function
if (!c1.includes('toggleFlash')) {
    c1 = c1.replace(
        'const toggleCamera = () => {',
        `const toggleFlash = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    const capabilities = track.getCapabilities ? track.getCapabilities() : {};
    if (capabilities.torch !== undefined) {
      try {
        await track.applyConstraints({ advanced: [{ torch: !isFlashOn }] });
        setIsFlashOn(!isFlashOn);
      } catch (e) {
        console.error(e);
      }
    } else {
      alert("Trình duyệt/thiết bị của bạn không hỗ trợ bật Flash!");
    }
  };

  const toggleCamera = () => {`
    );
}

// Add flash button next to toggle camera
if (!c1.includes('toggleFlash}')) {
    c1 = c1.replace(
        '<button onClick={toggleCamera}',
        `<button onClick={toggleFlash} className={\`p-2 rounded-full backdrop-blur-md \${isFlashOn ? 'bg-yellow-400 text-black' : 'text-white bg-black/20'}\`}>
          <Zap size={24} />
        </button>
        <button onClick={toggleCamera}`
    );
}

// Update crop logic for 1:1 instead of 3:4
c1 = c1.replace('const targetRatio = 3 / 4;', 'const targetRatio = 1 / 1;');
c1 = c1.replace('const targetRatio = 0.75;', 'const targetRatio = 1 / 1;');

fs.writeFileSync('src/components/locket/LiveCameraModal.tsx', c1, 'utf8');


// --- 2. Modify PreviewModal.tsx ---
let c2 = fs.readFileSync('src/components/locket/PreviewModal.tsx', 'utf8');
c2 = c2.replace('aspect-[3/4]', 'aspect-square');
fs.writeFileSync('src/components/locket/PreviewModal.tsx', c2, 'utf8');


// --- 3. Modify LocketWidget.tsx ---
let c3 = fs.readFileSync('src/components/home/LocketWidget.tsx', 'utf8');
c3 = c3.replace('aspect-[3/4]', 'aspect-square');
fs.writeFileSync('src/components/home/LocketWidget.tsx', c3, 'utf8');


// --- 4. Modify AuthProvider.tsx (stop asking location on load unless allowed) ---
let c4 = fs.readFileSync('src/components/providers/AuthProvider.tsx', 'utf8');
if (!c4.includes('localStorage.getItem(\'allow_location\')')) {
    c4 = c4.replace(
        'if (!navigator.geolocation) return;',
        'if (!navigator.geolocation) return;\n    if (localStorage.getItem(\'allow_location\') !== \'true\') return;'
    );
    fs.writeFileSync('src/components/providers/AuthProvider.tsx', c4, 'utf8');
}
