const fs = require('fs');
let code = fs.readFileSync('src/components/chat/ChatWidget.tsx', 'utf8');

const searchBtn = `<button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-pink-50 text-gray-700 transition-colors group">
              <div className="flex items-center gap-3">
                <UserPen size={18} className="text-pink-600" />
                <span className="font-medium text-sm">Đổi biệt danh</span>`;

const replaceBtn = `<button 
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
                <span className="font-medium text-sm">Đổi biệt danh (cho bạn)</span>`;

code = code.replace(searchBtn, replaceBtn);
fs.writeFileSync('src/components/chat/ChatWidget.tsx', code);
console.log('Added onClick for UserPen!');
