const fs = require('fs');
let code = fs.readFileSync('src/components/chat/ChatWidget.tsx', 'utf8');

// Add showMediaSidebar state
code = code.replace(
  /const \[searchQuery, setSearchQuery\] = useState\(''\);/,
  `const [searchQuery, setSearchQuery] = useState('');\n  const [showMediaSidebar, setShowMediaSidebar] = useState(false);`
);

// Find the media button
const mediaBtnSearch = /<button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-pink-50 text-gray-700 transition-colors group">\s*<div className="flex items-center gap-3">\s*<ImageIcon size=\{18\} className="text-blue-500" \/>\s*<span className="font-medium text-sm">.*?<\/span>\s*<\/div>\s*<\/button>/;

const mediaBtnReplace = `<button onClick={() => setShowMediaSidebar(true)} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-pink-50 text-gray-700 transition-colors group">
              <div className="flex items-center gap-3">
                <ImageIcon size={18} className="text-blue-500" />
                <span className="font-medium text-sm">Ảnh, file & liên kết</span>
              </div>
            </button>`;
code = code.replace(mediaBtnSearch, mediaBtnReplace);

// Conditionally render the default sidebar content vs media sidebar
const sidebarContentSearch = `<div className="flex-1 p-2 space-y-1">`;
const sidebarContentReplace = `
          {showMediaSidebar ? (
            <div className="flex-1 flex flex-col">
              <div className="p-3 flex items-center gap-2 border-b border-gray-100">
                <button onClick={() => setShowMediaSidebar(false)} className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft size={18}/></button>
                <span className="font-bold">Ảnh đã gửi</span>
              </div>
              <div className="flex-1 overflow-y-auto p-2 grid grid-cols-3 gap-1">
                {messages.filter(m => m.image_url).map(m => (
                  <img key={m.id} onClick={() => setViewingImage(m.image_url)} src={m.image_url} className="w-full aspect-square object-cover rounded cursor-pointer hover:opacity-80" />
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 p-2 space-y-1">`;

code = code.replace(sidebarContentSearch, sidebarContentReplace);

// Close the conditional rendering
const sidebarEndSearch = `          </div>
        </div>`;
const sidebarEndReplace = `          </div>
          )}
        </div>`;
code = code.replace(sidebarEndSearch, sidebarEndReplace);

fs.writeFileSync('src/components/chat/ChatWidget.tsx', code);
console.log('Task 4 Done');
