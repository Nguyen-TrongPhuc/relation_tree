const fs = require('fs');

let c = fs.readFileSync('src/app/map/page.tsx', 'utf8');
if (!c.includes('allow_location')) {
    // Add logic to enable location
    // Find useEffect or just add a button if location is disabled
    c = c.replace(
        'export default function MapPage() {',
        `export default function MapPage() {
  const enableLocation = () => {
    localStorage.setItem('allow_location', 'true');
    window.location.reload();
  };`
    );
    
    // Add a banner if not allowed
    c = c.replace(
        '<div className="w-full h-full relative">',
        `<div className="w-full h-full relative">
        {typeof window !== 'undefined' && localStorage.getItem('allow_location') !== 'true' && (
          <div className="absolute top-20 left-4 right-4 z-50 bg-white p-4 rounded-xl shadow-lg border border-pink-100 flex flex-col gap-3">
            <p className="text-sm text-gray-700">Hãy bật Chia sẻ vị trí để thấy nhau trên bản đồ nhé!</p>
            <button onClick={enableLocation} className="bg-pink-500 text-white py-2 rounded-lg font-bold w-full">Bật Vị Trí</button>
          </div>
        )}`
    );
    
    fs.writeFileSync('src/app/map/page.tsx', c, 'utf8');
}
