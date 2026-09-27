const fs = require('fs');
let code = fs.readFileSync('src/components/chat/ChatWidget.tsx', 'utf8');

// 1. Fix Nickname button
code = code.replace(
  /<button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-pink-50 text-gray-700 transition-colors group">\s*<div className="flex items-center gap-3">\s*<UserPen size=\{18\} className="text-pink-600" \/>\s*<span className="font-medium text-sm">.*?<\/span>\s*<\/div>\s*<\/button>/g,
  `<button onClick={() => {
              const newName = window.prompt('Nhập biệt danh mới cho người ấy (lưu trên máy này):', localStorage.getItem('partner_nickname') || '');
              if (newName !== null) {
                if (newName.trim() === '') localStorage.removeItem('partner_nickname');
                else localStorage.setItem('partner_nickname', newName.trim());
                window.dispatchEvent(new Event('storage'));
                alert('Thành công!');
              }
            }} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-pink-50 text-gray-700 transition-colors group">
              <div className="flex items-center gap-3">
                <UserPen size={18} className="text-pink-600" />
                <span className="font-medium text-sm">Đổi biệt danh</span>
              </div>
            </button>`
);

// Add localNickname state and hook
code = code.replace(
  /const \[searchQuery, setSearchQuery\] = useState\(''\);/,
  `const [searchQuery, setSearchQuery] = useState('');
  const [localNickname, setLocalNickname] = useState('');
  useEffect(() => {
    setLocalNickname(localStorage.getItem('partner_nickname') || '');
    const handleStorage = () => setLocalNickname(localStorage.getItem('partner_nickname') || '');
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);`
);

// Apply localNickname in ChatWidget
// "livePartnerProfile?.display_name || 'Người ấy'" -> "localNickname || livePartnerProfile?.display_name || 'Người ấy'"
code = code.replace(/livePartnerProfile\?\.display_name \|\| 'Ng[a-zA-ZÀ-Ỹà-ỹ\? ]+'/g, `(localNickname || livePartnerProfile?.display_name || 'Người ấy')`);


// 2. Chat input bar: make it taller, and support image preview
// Find input bar
const inputSearch = `<div className="p-4 bg-white/80 backdrop-blur-md border-t border-pink-100 flex items-end gap-2 relative z-20">`;
const inputReplace = `<div className="p-4 pb-6 bg-white/80 backdrop-blur-md border-t border-pink-100 flex items-end gap-2 relative z-20">`;
code = code.replace(inputSearch, inputReplace);

// Make textarea larger (h-10 to min-h-[44px])
code = code.replace(
  /className="w-full bg-transparent resize-none focus:outline-none max-h-32 text-\[15px\] leading-5 flex-1 h-10"/,
  `className="w-full bg-transparent resize-none focus:outline-none max-h-32 text-[15px] leading-5 flex-1 min-h-[44px] py-1"`
);

// Preview image before sending
const previewSearch = `{attachment && \\(
          <div className="px-4 py-2 bg-gray-50 border-t border-pink-100 flex items-center justify-between z-20">
            <div className="flex items-center gap-2 text-sm text-pink-700">
              <ImageIcon size=\{16\} \/>
              <span className="truncate max-w-\[200px\]">\{attachment.name\}<\/span>
            <\/div>
            <button onClick=\{\(\) => setAttachment\(null\)\} className="text-gray-400 hover:text-red-500">
              <X size=\{16\} \/>
            <\/button>
          <\/div>
        \\)}`;
// Wait, regex for the above is tricky. I'll just use string replacement.
const attachmentSearchString = `{attachment && (
          <div className="px-4 py-2 bg-gray-50 border-t border-pink-100 flex items-center justify-between z-20">
            <div className="flex items-center gap-2 text-sm text-pink-700">
              <ImageIcon size={16} />
              <span className="truncate max-w-[200px]">{attachment.name}</span>
            </div>
            <button onClick={() => setAttachment(null)} className="text-gray-400 hover:text-red-500">
              <X size={16} />
            </button>
          </div>
        )}`;
const attachmentReplaceString = `{attachment && (
          <div className="px-4 py-3 bg-gray-50 border-t border-pink-100 flex items-center justify-between z-20 relative">
            <div className="flex items-center gap-3">
              <img src={URL.createObjectURL(attachment)} alt="preview" className="w-16 h-16 object-cover rounded-lg border shadow-sm" />
              <span className="text-sm font-medium text-gray-700 truncate max-w-[150px]">{attachment.name}</span>
            </div>
            <button onClick={() => setAttachment(null)} className="p-2 bg-white rounded-full text-gray-400 hover:text-red-500 shadow-sm border">
              <X size={16} />
            </button>
          </div>
        )}`;
code = code.replace(attachmentSearchString, attachmentReplaceString);

// 3. Click to view image in Chat
// We will add a viewingImage state.
code = code.replace(
  /const \[searchQuery, setSearchQuery\] = useState\(''\);/,
  `const [searchQuery, setSearchQuery] = useState('');\n  const [viewingImage, setViewingImage] = useState<string | null>(null);`
);

// We find <img src={msg.image_url} ... /> in the message bubble and add onClick
code = code.replace(
  /<img src=\{msg\.image_url\} alt="attachment" className="rounded-xl mb-1 max-w-full h-auto max-h-64 object-contain" \/>/g,
  `<img onClick={() => setViewingImage(msg.image_url)} src={msg.image_url} alt="attachment" className="rounded-xl mb-1 max-w-full h-auto max-h-64 object-contain cursor-pointer hover:opacity-90 transition-opacity" />`
);

// And we add the ImageViewer Modal at the bottom of the component
code = code.replace(
  /    <\/div>\s*<\/div>\s*\);\s*\}\s*$/m,
  `    </div>
        {viewingImage && (
          <div className="fixed inset-0 z-[99999] bg-black/90 flex items-center justify-center p-4" onClick={() => setViewingImage(null)}>
            <button onClick={() => setViewingImage(null)} className="absolute top-4 right-4 p-2 text-white bg-white/20 rounded-full hover:bg-white/40"><X size={24}/></button>
            <img src={viewingImage} alt="Fullscreen" className="max-w-full max-h-[90vh] object-contain rounded-lg" />
          </div>
        )}
      </div>
  );
}
`
);


fs.writeFileSync('src/components/chat/ChatWidget.tsx', code);
console.log('Task 3,4,5,6,7 Done');
