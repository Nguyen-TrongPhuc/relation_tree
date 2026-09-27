const fs = require('fs');
let c = fs.readFileSync('src/components/home/LocketWidget.tsx', 'utf8');

c = c.replace(
  'className="relative w-full aspect-square max-w-[320px] bg-gray-100 rounded-[2rem] shadow-xl border-4 border-white group overflow-hidden"',
  'className="relative w-full aspect-square max-w-[320px] bg-gradient-to-br from-gray-800 to-gray-900 rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] ring-4 ring-white/50 border border-white/20 group overflow-hidden"'
);

// Update empty state
c = c.replace(
  'bg-gradient-to-br from-pink-50 to-teal-50 gap-4',
  'bg-gradient-to-br from-gray-800 to-gray-900 gap-4'
);
c = c.replace(
  'text-pink-600 font-medium text-sm',
  'text-white/80 font-medium text-sm drop-shadow-md'
);

// Update Header info inside the moment
c = c.replace(
  'bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full',
  'bg-black/40 backdrop-blur-xl px-3 py-1.5 rounded-full border border-white/10 shadow-lg'
);
c = c.replace(
  'bg-black/30 backdrop-blur-md px-2 py-1 rounded-full',
  'bg-black/40 backdrop-blur-xl px-3 py-1.5 rounded-full border border-white/10 shadow-lg font-bold tracking-wide'
);

fs.writeFileSync('src/components/home/LocketWidget.tsx', c, 'utf8');
