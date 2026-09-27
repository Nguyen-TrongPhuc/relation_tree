const fs = require('fs');
let code = fs.readFileSync('src/app/globals.css', 'utf8');

if (!code.includes('leaflet/dist/leaflet.css')) {
  code = `@import "leaflet/dist/leaflet.css";\n` + code;
  fs.writeFileSync('src/app/globals.css', code);
  console.log('Added leaflet css to globals');
} else {
  console.log('Leaflet css already in globals');
}
