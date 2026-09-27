const fs = require('fs');

// Fix gallery in locket page
let locket = fs.readFileSync('src/app/locket/page.tsx', 'utf8');
locket = locket.replace(
  'className="grid grid-cols-3 gap-1 p-1"',
  'className="grid grid-cols-3 gap-2 p-2"'
);
locket = locket.replace(
  'className="aspect-square bg-gray-200 cursor-pointer hover:opacity-90 relative"',
  'className="aspect-square bg-gray-200 cursor-pointer hover:opacity-90 relative rounded-2xl overflow-hidden"'
);
fs.writeFileSync('src/app/locket/page.tsx', locket, 'utf8');
console.log('Fixed locket page');

// Fix homepage widget - ensure image uses object-contain for square display
let widget = fs.readFileSync('src/components/home/LocketWidget.tsx', 'utf8');

// The image inside moments should not zoom - use object-contain with black bg
widget = widget.replace(
  '<img src={moment.image_url} alt="Moment" className="w-full h-full object-cover" />',
  '<img src={moment.image_url} alt="Moment" className="w-full h-full object-contain bg-black" />'
);
fs.writeFileSync('src/components/home/LocketWidget.tsx', widget, 'utf8');
console.log('Fixed widget');
