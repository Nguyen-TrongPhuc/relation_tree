const fs = require('fs');
let code = fs.readFileSync('src/components/map/LocationMap.tsx', 'utf8');

code = code.replace(
  /<MapContainer\s+center=\{\[myLocation\.lat, myLocation\.lng\]\}\s+zoom=\{16\}\s+zoomControl=\{false\}\s+className="w-full h-full z-0"\s*>/,
  `<MapContainer 
        center={[myLocation.lat, myLocation.lng]} 
        zoom={16} 
        zoomControl={false}
        className="w-full h-full z-0"
        style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 0 }}
      >`
);

fs.writeFileSync('src/components/map/LocationMap.tsx', code);
console.log('Fixed MapContainer height');
