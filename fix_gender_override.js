const fs = require('fs');

function applyGenderOverride(filePath, replaceRegex, replaceText) {
  let code = fs.readFileSync(filePath, 'utf8');
  code = code.replace(replaceRegex, replaceText);
  fs.writeFileSync(filePath, code);
}

// 1. CoupleBadge.tsx
applyGenderOverride(
  'src/components/home/CoupleBadge.tsx',
  /const isMeFemale = pairData\?\.receiver_id === userProfile\?\.id;/,
  `let isMeFemale = pairData?.receiver_id === userProfile?.id;
  if (typeof window !== 'undefined') {
    const override = window.localStorage.getItem('my_gender');
    if (override === 'female') isMeFemale = true;
    if (override === 'male') isMeFemale = false;
  }`
);

// 2. ChatWidget.tsx
applyGenderOverride(
  'src/components/chat/ChatWidget.tsx',
  /const isFemale = pairData\?\.receiver_id === currentUserId;/,
  `let isFemale = pairData?.receiver_id === currentUserId;
  if (typeof window !== 'undefined') {
    const override = window.localStorage.getItem('my_gender');
    if (override === 'female') isFemale = true;
    if (override === 'male') isFemale = false;
  }`
);

// 3. LocationMap.tsx
applyGenderOverride(
  'src/components/map/LocationMap.tsx',
  /const isFemale = pairData\?\.receiver_id === userProfile\?\.id;/,
  `let isFemale = pairData?.receiver_id === userProfile?.id;
  if (typeof window !== 'undefined') {
    const override = window.localStorage.getItem('my_gender');
    if (override === 'female') isFemale = true;
    if (override === 'male') isFemale = false;
  }`
);

// 4. Add the gender selector to Profile Page
let profileCode = fs.readFileSync('src/app/(auth)/settings/profile/page.tsx', 'utf8');
const formInsertPoint = profileCode.indexOf('<div className="flex justify-end pt-4">');

const genderSelectorHtml = `
          {/* Giới tính (Lưu cục bộ) */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Giới tính của bạn (để hiển thị màu sắc)</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="gender" value="male" defaultChecked={typeof window !== 'undefined' && localStorage.getItem('my_gender') === 'male'} onChange={() => { localStorage.setItem('my_gender', 'male'); window.dispatchEvent(new Event('storage')); }} className="text-cyan-500 focus:ring-cyan-500" />
                <span className="text-sm text-gray-700">Nam (Xanh ngọc)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="gender" value="female" defaultChecked={typeof window !== 'undefined' && localStorage.getItem('my_gender') === 'female'} onChange={() => { localStorage.setItem('my_gender', 'female'); window.dispatchEvent(new Event('storage')); }} className="text-pink-500 focus:ring-pink-500" />
                <span className="text-sm text-gray-700">Nữ (Hồng)</span>
              </label>
            </div>
            <p className="text-xs text-gray-500">Người ấy sẽ tự động được gán màu ngược lại trên thiết bị của bạn.</p>
          </div>
`;

if (formInsertPoint !== -1) {
  profileCode = profileCode.substring(0, formInsertPoint) + genderSelectorHtml + profileCode.substring(formInsertPoint);
  fs.writeFileSync('src/app/(auth)/settings/profile/page.tsx', profileCode);
} else {
  console.log("Could not find insert point in profile page");
}

console.log('Gender override applied to all components!');
