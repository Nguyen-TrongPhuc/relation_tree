const fs = require('fs');
let code = fs.readFileSync('src/components/locket/PreviewModal.tsx', 'utf8');

// Replace the return block
const startIdx = code.indexOf('return (');
const newReturn = `return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center animate-in fade-in duration-200">
      <div className="absolute top-0 left-0 right-0 p-4 safe-area-top flex justify-between items-center z-10 bg-gradient-to-b from-black/50 to-transparent">
        <button onClick={onClose} className="p-2 text-white bg-black/20 rounded-full backdrop-blur-md">
          <X size={24} />
        </button>
      </div>

      <div className="w-full flex justify-center gap-3 px-4 mb-4 mt-16 overflow-x-auto hide-scrollbar z-20">
        <button 
          onClick={() => setIsFlipped(!isFlipped)} 
          className="whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium backdrop-blur-md transition-all bg-black/30 text-white border border-white/20 hover:bg-black/50"
        >
          Lật ảnh
        </button>
        {FILTERS.map(f => (
          <button 
            key={f.name}
            onClick={() => setSelectedFilter(f)}
            className={\`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium backdrop-blur-md transition-all \${
              selectedFilter.name === f.name 
                ? 'bg-pink-500 text-white shadow-lg scale-105 border border-pink-400' 
                : 'bg-black/30 text-white border border-white/20 hover:bg-black/50'
            }\`}
          >
            {f.name}
          </button>
        ))}
      </div>

      <div className="relative w-full max-w-md aspect-square bg-gray-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col mb-6">
        <img 
          src={objectUrl} 
          alt="Captured" 
          className="w-full h-full object-cover transition-all duration-300"
          style={{ filter: selectedFilter.filter !== 'none' ? selectedFilter.filter : undefined, transform: isFlipped ? 'scaleX(-1)' : 'none' }} 
        />
        
        {/* Caption Overlay */}
        <div className="absolute bottom-6 left-0 right-0 px-6">
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Thêm ghi chú..."
            className="w-full bg-black/40 text-white placeholder-white/70 px-4 py-3 rounded-xl border border-white/20 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-pink-500 text-center text-lg font-medium shadow-lg"
          />
        </div>
      </div>

      {/* Buttons Outside */}
      <div className="w-full max-w-md px-6 flex flex-col gap-3 pb-8">
        <button 
          onClick={sendPhoto}
          disabled={isUploading}
          className="flex items-center justify-center w-full gap-2 p-4 bg-pink-500 text-white rounded-full shadow-xl font-bold disabled:opacity-50 active:scale-95 transition-transform"
        >
          {isUploading ? <Loader2 className="animate-spin" size={24} /> : <Send size={24} />}
          {isUploading ? 'Đang gửi...' : 'Gửi cho người ấy'}
        </button>
        
        <button 
          onClick={onClose}
          disabled={isUploading}
          className="flex items-center justify-center w-full gap-2 p-3 bg-white/10 text-white rounded-full font-medium active:scale-95 transition-transform border border-white/10 hover:bg-white/20"
        >
          Chụp lại
        </button>
      </div>
    </div>
  );
}`;

code = code.substring(0, startIdx) + newReturn;
fs.writeFileSync('src/components/locket/PreviewModal.tsx', code);
console.log('Fixed PreviewModal layout');
