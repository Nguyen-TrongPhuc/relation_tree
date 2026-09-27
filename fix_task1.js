const fs = require('fs');
let code = fs.readFileSync('src/components/locket/LiveCameraModal.tsx', 'utf8');

// 1. Remove flash logic
code = code.replace(/const \[isFlashOn, setIsFlashOn\] = useState\(false\);\r?\n?/g, '');
code = code.replace(/const toggleFlash = async \(\) => \{[\s\S]*?alert\("Trình duyệt web.*?\);\r?\n  \};\r?\n\r?\n  const toggleCamera/g, 'const toggleCamera');

// 2. Remove flash button and update header UI
const headerSearch = `<div className="absolute top-0 left-0 right-0 p-4 safe-area-top flex justify-end items-center z-20 bg-gradient-to-b from-black/50 to-transparent gap-4">
        <button onClick={toggleFlash} className={\`p-2 rounded-full backdrop-blur-md \${isFlashOn ? 'bg-yellow-400 text-black' : 'text-white bg-black/20'}\`}>
          <Zap size={24} />
        </button>
        <button onClick={toggleCamera} className="p-2 text-white bg-black/20 rounded-full backdrop-blur-md">
          <RefreshCcw size={24} />
        </button>
      </div>`;
const headerReplace = `<div className="absolute top-0 left-0 right-0 p-6 safe-area-top flex justify-between items-center z-20 bg-gradient-to-b from-black/60 via-black/20 to-transparent">
        <div className="text-white font-bold text-lg drop-shadow-md">Locket</div>
        <button onClick={toggleCamera} className="p-3 text-white bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-xl transition-all active:scale-95 shadow-lg">
          <RefreshCcw size={22} />
        </button>
      </div>`;
code = code.replace(headerSearch, headerReplace);

// 3. Improve viewfinder frame
const frameSearch = `<div className="relative w-full max-w-md aspect-square flex items-center justify-center bg-gray-900 rounded-3xl overflow-hidden shadow-2xl">`;
const frameReplace = `<div className="relative w-[90%] max-w-md aspect-[4/5] flex items-center justify-center bg-gray-900 rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white/10 ring-4 ring-black/20">`;
code = code.replace(frameSearch, frameReplace);

// 4. Improve capture button
const btnSearch = `<div className="absolute bottom-20 left-0 right-0 flex justify-center z-20">
        <button 
          onClick={capturePhoto}
          disabled={!stream || isLoading}
          className="w-20 h-20 rounded-full border-4 border-white/50 bg-white/20 flex items-center justify-center active:scale-90 transition-transform disabled:opacity-50"
        >
          <div className="w-16 h-16 rounded-full bg-white shadow-lg"></div>
        </button>
      </div>`;
const btnReplace = `<div className="absolute bottom-24 left-0 right-0 flex justify-center z-20">
        <button 
          onClick={capturePhoto}
          disabled={!stream || isLoading}
          className="w-20 h-20 rounded-full border-[5px] border-white/30 bg-transparent flex items-center justify-center active:scale-90 transition-all duration-200 disabled:opacity-50 group hover:border-white/50"
        >
          <div className="w-[60px] h-[60px] rounded-full bg-white shadow-[0_0_20px_rgba(255,255,255,0.4)] group-active:scale-95 transition-transform"></div>
        </button>
      </div>`;
code = code.replace(btnSearch, btnReplace);

fs.writeFileSync('src/components/locket/LiveCameraModal.tsx', code);
console.log('Task 1 Done');
