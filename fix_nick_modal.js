const fs = require('fs');

let code = fs.readFileSync('src/components/chat/ChatWidget.tsx', 'utf8');

// 1. Inject state
code = code.replace(
  /const \[localNickname, setLocalNickname\] = useState\(''\);/,
  `const [localNickname, setLocalNickname] = useState('');
  const [showNickModal, setShowNickModal] = useState(false);
  const [tempNick, setTempNick] = useState('');`
);

// 2. Modify onClick
const targetLines = `              <button onClick={() => {
                const newName = window.prompt('Nh?p bi?t danh m?i cho ng?i ?y (lu trn my ny):', localStorage.getItem('partner_nickname') || '');
                if (newName !== null) {
                  if (newName.trim() === '') localStorage.removeItem('partner_nickname');
                  else localStorage.setItem('partner_nickname', newName.trim());
                  window.dispatchEvent(new Event('storage'));
                  alert('Thnh cng!');
                }
              }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left">`;

const replacement = `              <button onClick={() => {
                setTempNick(localStorage.getItem('partner_nickname') || '');
                setShowNickModal(true);
              }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left">`;

// Try exact replace first, but if it fails because of encoding, use regex over the block
code = code.replace(/<button onClick=\{\(\) => \{\s*const newName = window\.prompt\([^]*?alert\([^]*?\}\s*\}\} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left">/, replacement);


// 3. Inject Modal UI at the end of the return statement
const modalUI = `
      {/* Nickname Modal */}
      {showNickModal && (
        <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-pink-500 to-teal-500 px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-white text-lg">Đổi biệt danh</h3>
              <button onClick={() => setShowNickModal(false)} className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/20 transition-colors"><X size={20} /></button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-500 mb-4">Biệt danh này chỉ hiển thị trên máy của bạn.</p>
              <input 
                type="text" 
                value={tempNick}
                onChange={e => setTempNick(e.target.value)}
                placeholder="Nhập biệt danh..." 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all font-medium text-gray-800"
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter') document.getElementById('save-nick-btn')?.click();
                }}
              />
              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => setShowNickModal(false)}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Hủy
                </button>
                <button 
                  id="save-nick-btn"
                  onClick={() => {
                    if (tempNick.trim() === '') localStorage.removeItem('partner_nickname');
                    else localStorage.setItem('partner_nickname', tempNick.trim());
                    window.dispatchEvent(new Event('storage'));
                    setShowNickModal(false);
                  }}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-pink-500 to-teal-500 shadow-md hover:shadow-lg hover:scale-[1.02] transition-all"
                >
                  Lưu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
`;

// Insert right before the last closing tags of ChatWidget which is:
//       </div>
//     </>
//   );
code = code.replace(/<\/div>\s*<\/>\s*\);\s*\}/, `${modalUI}\n      </div>\n    </>\n  );\n}`);

fs.writeFileSync('src/components/chat/ChatWidget.tsx', code);
console.log('Injected nickname modal UI');
