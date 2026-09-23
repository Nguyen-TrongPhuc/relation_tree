const fs = require('fs');

function fixMojibake(text) {
  // We'll iterate through matches of non-ascii sequences
  return text.replace(/[^\x00-\x7F]+/g, (match) => {
    // try to decode it
    try {
      const buf = Buffer.from(match, 'binary');
      const decoded = buf.toString('utf8');
      // If it decodes to something that looks like valid Vietnamese (or at least has no replacement characters)
      // and isn't just the same string
      if (decoded !== match && !decoded.includes('\uFFFD') && /^[a-zA-ZÀ-ỹ\s\.,!\?]+$/.test(decoded)) {
        return decoded;
      }
    } catch(e) {}
    return match;
  });
}

let text = fs.readFileSync('src/components/chat/ChatWidget.tsx', 'utf8');

// Manual fallbacks for already completely broken ones
text = text.replace(/B\?n/g, 'Bạn');
text = text.replace(/Ngư\?i \?y/g, 'Người ấy');
text = text.replace(/Ng\?i \?y/g, 'Người ấy');
text = text.replace(/Kho\?nh kh\?c/g, 'Khoảnh khắc');

// Try algorithmic fix for the rest (like Ä\x90ang)
text = fixMojibake(text);

// Extra manual replacements
const manualMappings = {
  'NgÆ°á»\x9Di áº¥y': 'Người ấy',
  'Thoáº¡i': 'Thoại',
  'Ä\x90ang trá»±c tuyáº¿n': 'Đang trực tuyến',
  'Ä\x90ang gá»\x8Di': 'Đang gọi',
  'Cuá»™c gá»\x8Di nhá»¡': 'Cuộc gọi nhỡ',
  'Ä\x90ang táº£i': 'Đang tải',
  'KhĂ´ng tĂ¬m tháº¥y': 'Không tìm thấy'
};

for (const [k, v] of Object.entries(manualMappings)) {
  text = text.replace(new RegExp(k, 'g'), v);
}

fs.writeFileSync('src/components/chat/ChatWidget.tsx', text, 'utf8');
