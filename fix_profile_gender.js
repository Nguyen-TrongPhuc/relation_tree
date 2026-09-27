const fs = require('fs');

let profileCode = fs.readFileSync('src/app/(auth)/settings/profile/page.tsx', 'utf8');

const genderSelectorHtml = `
          {/* Giới tính (Lưu cục bộ) */}
          <div className="bg-white/50 p-4 rounded-xl border border-pink-100 mb-4">
            <label className="block text-sm font-semibold text-pink-800 mb-2">Giới tính của bạn (để phối màu)</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="gender" value="male" defaultChecked={typeof window !== 'undefined' && localStorage.getItem('my_gender') === 'male'} onChange={() => { localStorage.setItem('my_gender', 'male'); window.dispatchEvent(new Event('storage')); }} className="w-4 h-4 text-cyan-500 border-gray-300 focus:ring-cyan-500" />
                <span className="text-sm font-medium text-cyan-700">Nam (Xanh ngọc)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="gender" value="female" defaultChecked={typeof window !== 'undefined' && localStorage.getItem('my_gender') === 'female'} onChange={() => { localStorage.setItem('my_gender', 'female'); window.dispatchEvent(new Event('storage')); }} className="w-4 h-4 text-pink-500 border-gray-300 focus:ring-pink-500" />
                <span className="text-sm font-medium text-pink-700">Nữ (Hồng)</span>
              </label>
            </div>
            <p className="text-[11px] text-gray-500 mt-2 italic">Lưu ý: Thiết lập này chỉ đổi màu trên máy của bạn. Người ấy sẽ tự động được gán màu ngược lại với bạn.</p>
          </div>

          <button`;

profileCode = profileCode.replace(/<button\s+type="submit"/, genderSelectorHtml);

fs.writeFileSync('src/app/(auth)/settings/profile/page.tsx', profileCode);
console.log('Added Gender selector to profile page');
