const fs = require('fs');
let code = fs.readFileSync('src/components/chat/ChatWidget.tsx', 'utf8');

// Replace the previous prompt logic
const btnSearch = `<button 
              onClick={async () => {
                const newName = window.prompt('Nhập tên hiển thị mới của bạn:');
                if (newName && newName.trim()) {
                  const { error } = await supabase.from('profiles').update({ display_name: newName.trim() }).eq('id', currentUserId);
                  if (error) alert('Lỗi: ' + error.message);
                  else alert('Đổi tên thành công! Vui lòng tải lại trang để thấy thay đổi.');
                }
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-pink-50 text-gray-700 transition-colors group">
              <div className="flex items-center gap-3">
                <UserPen size={18} className="text-pink-600" />
                <span className="font-medium text-sm">Đổi biệt danh (cho bạn)</span>
              </div>
            </button>`;

const btnReplace = `<button 
              onClick={() => {
                const newName = window.prompt('Nhập biệt danh mới cho người ấy (chỉ hiển thị trên máy bạn):', livePartnerProfile?.display_name || '');
                if (newName && newName.trim()) {
                  localStorage.setItem('partner_nickname', newName.trim());
                  window.dispatchEvent(new Event('storage'));
                  alert('Đổi biệt danh thành công!');
                } else if (newName === '') {
                  localStorage.removeItem('partner_nickname');
                  window.dispatchEvent(new Event('storage'));
                  alert('Đã xóa biệt danh!');
                }
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-pink-50 text-gray-700 transition-colors group">
              <div className="flex items-center gap-3">
                <UserPen size={18} className="text-pink-600" />
                <span className="font-medium text-sm">Đổi biệt danh</span>
              </div>
            </button>`;
code = code.replace(btnSearch, btnReplace);

// Now inject the nickname logic at the top of the component
const topSearch = `  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');`;
const topReplace = `  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [localNickname, setLocalNickname] = useState('');

  useEffect(() => {
    setLocalNickname(localStorage.getItem('partner_nickname') || '');
    const handleStorage = () => setLocalNickname(localStorage.getItem('partner_nickname') || '');
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);`;
code = code.replace(topSearch, topReplace);

// Replace partnerProfile.display_name with (localNickname || partnerProfile.display_name)
// But we have `livePartnerProfile?.display_name` in ChatWidget!
code = code.replace(/livePartnerProfile\?\.display_name \|\| 'Người ấy'/g, '(localNickname || livePartnerProfile?.display_name) || \\'Người ấy\\'');

fs.writeFileSync('src/components/chat/ChatWidget.tsx', code);
console.log('Task 3 Done');
