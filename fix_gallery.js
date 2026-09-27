const fs = require('fs');
let c = fs.readFileSync('src/app/locket/page.tsx', 'utf8');

// Replace the gallery section
const oldGallery = `<div className="grid grid-cols-3 gap-2 p-2">
            {moments.map((moment) => (
              <div key={moment.id} className="aspect-square bg-gray-200 cursor-pointer hover:opacity-90 relative rounded-2xl overflow-hidden">
                <img src={moment.image_url} alt="Gallery" className="w-full h-full object-cover" />`;

const newGallery = `<div className="flex flex-col">
            {/* Filter Buttons */}
            <div className="flex items-center gap-2 px-3 py-3 sticky top-[57px] z-40 bg-gradient-to-br from-gray-50 to-pink-50/30">
              <button 
                onClick={() => setGalleryFilter('all')}
                className={\`px-4 py-1.5 rounded-full text-sm font-semibold transition-all \${galleryFilter === 'all' ? 'bg-pink-500 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200'}\`}
              >
                Tất cả
              </button>
              <button 
                onClick={() => setGalleryFilter('me')}
                className={\`px-4 py-1.5 rounded-full text-sm font-semibold transition-all flex items-center gap-1.5 \${galleryFilter === 'me' ? 'bg-pink-500 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200'}\`}
              >
                <img src={userProfile?.avatar_url} className="w-4 h-4 rounded-full object-cover" /> Của bạn
              </button>
              <button 
                onClick={() => setGalleryFilter('partner')}
                className={\`px-4 py-1.5 rounded-full text-sm font-semibold transition-all flex items-center gap-1.5 \${galleryFilter === 'partner' ? 'bg-pink-500 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200'}\`}
              >
                <img src={partnerProfile?.avatar_url} className="w-4 h-4 rounded-full object-cover" /> {partnerProfile?.display_name}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 p-2">
            {moments
              .filter(m => {
                if (galleryFilter === 'me') return m.sender_id === userProfile.id;
                if (galleryFilter === 'partner') return m.sender_id === partnerProfile.id;
                return true;
              })
              .map((moment) => (
              <div key={moment.id} className="aspect-square bg-gray-200 cursor-pointer hover:opacity-90 relative rounded-2xl overflow-hidden">
                <img src={moment.image_url} alt="Gallery" className="w-full h-full object-cover" />`;

c = c.replace(oldGallery, newGallery);

// Also need to close the extra </div> for the flex-col wrapper
// Find the end of the gallery section and add closing div
c = c.replace(
  '            </div>\r\n          </div>\r\n        )}\r\n      </div>',
  '            </div>\r\n          </div>\r\n          </div>\r\n        )}\r\n      </div>'
);
// Try LF version too
c = c.replace(
  '            </div>\n          </div>\n        )}\n      </div>',
  '            </div>\n          </div>\n          </div>\n        )}\n      </div>'
);

// Also fix timeline photos to be square
c = c.replace(
  'className="relative w-full aspect-square bg-gray-900 rounded-2xl overflow-hidden mx-auto max-w-md"',
  'className="relative w-full aspect-square bg-gray-900 rounded-2xl overflow-hidden"'
);

fs.writeFileSync('src/app/locket/page.tsx', c, 'utf8');
console.log('Done');
