const fs = require('fs');
let code = fs.readFileSync('src/components/chat/ChatWidget.tsx', 'utf8');

// 1. Fix Nickname button (Mojibake issue)
// Look for UserPen
let userPenIdx = code.indexOf('<UserPen size={18}');
if (userPenIdx !== -1) {
  let btnStart = code.lastIndexOf('<button', userPenIdx);
  let btnEnd = code.indexOf('</button>', userPenIdx) + 9;
  
  if (btnStart !== -1 && btnEnd !== -1) {
    const newBtn = `<button onClick={() => {
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
            </button>`;
    code = code.substring(0, btnStart) + newBtn + code.substring(btnEnd);
  }
}

// 2. Fix Attachment Preview (Issue 3)
let attachmentIdx = code.indexOf('{attachment && (');
if (attachmentIdx !== -1) {
  let attachEnd = code.indexOf(')}', attachmentIdx) + 2;
  const newAttach = `{attachment && (
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
  code = code.substring(0, attachmentIdx) + newAttach + code.substring(attachEnd);
}

// 3. Fix Search Logic (Issue 2)
// Replace displayedMessages logic
const displayedMsgRegex = /const displayedMessages = isSearching && searchQuery\.trim\(\)\s*\?\s*messages\.filter\(.*?\)\s*:\s*messages;/;
code = code.replace(displayedMsgRegex, `const displayedMessages = messages;
  const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null);

  const searchResults = isSearching && searchQuery.trim() 
    ? messages.filter(m => m.content?.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const scrollToMessage = (id: string) => {
    const el = document.getElementById('msg-' + id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedMsgId(id);
      setIsSearching(false);
      setTimeout(() => setHighlightedMsgId(null), 3000); // clear highlight after 3s
    }
  };`);

// Add id="msg-{msg.id}" and highlight style to the message container
// Look for `<div className={\`flex w-full gap-2 \${isMe ? 'justify-end' : 'justify-start'}\`}>`
code = code.replace(
  /<div className=\{\`flex w-full gap-2 \$\{isMe \? 'justify-end' : 'justify-start'\}\`\}>/g,
  `<div id={"msg-" + msg.id} className={\`flex w-full gap-2 transition-colors duration-500 \${isMe ? 'justify-end' : 'justify-start'} \${highlightedMsgId === msg.id ? 'bg-pink-100/50 p-2 rounded-xl' : ''}\`}>`
);

// Render the search results overlay below the Search Bar
// Look for the end of the Search Bar:
// `</button>\s*</div>\s*)}`
let searchBarEndIdx = code.indexOf('placeholder="Tìm kiếm trong đoạn chat..."'); // Actually let's just find `</button>\n              </div>\n            )}`
if (searchBarEndIdx === -1) {
  // Try with mojibake placeholder
  searchBarEndIdx = code.indexOf('placeholder="T?m ki?m');
}
if (searchBarEndIdx !== -1) {
  let closingDivIdx = code.indexOf('</div>', searchBarEndIdx);
  let closingIfIdx = code.indexOf(')}', closingDivIdx);
  if (closingIfIdx !== -1) {
    const searchResultsDropdown = `
              </div>
              {searchResults.length > 0 && (
                <div className="absolute top-16 left-4 right-4 bg-white/95 backdrop-blur-md shadow-xl rounded-xl border border-gray-100 z-50 max-h-64 overflow-y-auto divide-y divide-gray-100">
                  {searchResults.map(m => (
                    <button key={m.id} onClick={() => scrollToMessage(m.id)} className="w-full text-left p-3 hover:bg-pink-50 transition-colors flex flex-col gap-1">
                      <span className="text-xs font-bold text-gray-500">{new Date(m.created_at).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}</span>
                      <span className="text-sm text-gray-800 line-clamp-2">{m.content}</span>
                    </button>
                  ))}
                </div>
              )}
            )}`;
    code = code.substring(0, closingDivIdx) + searchResultsDropdown + code.substring(closingIfIdx + 2);
  }
}

// 4. Also fix the Chat Input bar if it hasn't been fixed (since earlier script failed)
// Make textarea taller
code = code.replace(
  /className="w-full bg-transparent resize-none focus:outline-none max-h-32 text-\[15px\] leading-5 flex-1 h-10"/g,
  `className="w-full bg-transparent resize-none focus:outline-none max-h-32 text-[15px] leading-5 flex-1 min-h-[44px] py-1"`
);
// Make the container have pb-6
code = code.replace(
  /<div className="p-4 bg-white\/80 backdrop-blur-md border-t border-pink-100 flex items-end gap-2 relative z-20">/g,
  `<div className="p-4 pb-6 bg-white/80 backdrop-blur-md border-t border-pink-100 flex items-end gap-2 relative z-20">`
);

fs.writeFileSync('src/components/chat/ChatWidget.tsx', code);
console.log('Script completed successfully');
