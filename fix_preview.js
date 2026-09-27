const fs = require('fs');
let code = fs.readFileSync('src/components/locket/PreviewModal.tsx', 'utf8');

const search = `        {/* Caption Overlay */}
        <div className="absolute bottom-20 left-0 right-0 px-6">
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Thêm ghi chú..."
            className="w-full bg-black/40 text-white placeholder-white/70 px-4 py-3 rounded-xl border border-white/20 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-pink-500 text-center text-lg font-medium shadow-lg"
          />
        </div>

        <div className="absolute bottom-6 left-0 right-0 flex justify-center px-10">
          <button 
            onClick={sendPhoto}
            disabled={isUploading}
            className="flex items-center justify-center w-full gap-2 p-4 bg-pink-500 text-white rounded-full shadow-lg font-bold disabled:opacity-50 active:scale-95 transition-transform"
          >
            {isUploading ? <Loader2 className="animate-spin" size={24} /> : <Send size={24} />}
            {isUploading ? 'Đang gửi...' : 'Gửi cho người ấy'}
          </button>
        </div>
      </div>
    </div>
  );
}`;

const replace = `        {/* Caption Overlay */}
        <div className="absolute bottom-4 left-0 right-0 px-4">
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Thêm ghi chú..."
            className="w-full bg-black/40 text-white placeholder-white/70 px-4 py-3 rounded-xl border border-white/20 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-pink-500 text-center text-lg font-medium shadow-lg"
          />
        </div>
      </div>

      <div className="absolute bottom-8 left-0 right-0 flex justify-center px-10 z-20">
        <button 
          onClick={sendPhoto}
          disabled={isUploading}
          className="flex items-center justify-center w-full max-w-sm gap-2 p-4 bg-pink-500 text-white rounded-full shadow-2xl shadow-pink-500/30 font-bold text-lg disabled:opacity-50 active:scale-95 transition-transform border border-pink-400"
        >
          {isUploading ? <Loader2 className="animate-spin" size={24} /> : <Send size={24} />}
          {isUploading ? 'Đang gửi...' : 'Gửi cho người ấy'}
        </button>
      </div>
    </div>
  );
}`;

code = code.replace(search, replace);
fs.writeFileSync('src/components/locket/PreviewModal.tsx', code);
console.log('Done preview modal!');
