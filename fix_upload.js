const fs = require('fs');
let code = fs.readFileSync('src/components/locket/PreviewModal.tsx', 'utf8');

code = code.replace(
  /\.upload\(fileName, finalFile, \{ contentType: 'image\/jpeg' \}\);/,
  `.upload(fileName, finalFile, { contentType: 'image/jpeg', upsert: true });`
);

// Also let's make sure we catch any error from onSend if it exists
code = code.replace(
  /await onSend\(data\.publicUrl, caption\);/,
  `const sendResult = await onSend(data.publicUrl, caption);
      if (sendResult && sendResult.error) throw sendResult.error;`
);

fs.writeFileSync('src/components/locket/PreviewModal.tsx', code);
console.log('Fixed uploadError with upsert');
