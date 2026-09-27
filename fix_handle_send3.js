const fs = require('fs');
let code = fs.readFileSync('src/app/locket/page.tsx', 'utf8');

code = code.replace(
  /reactions: \{\}\n\s*\}\);\n\s*setMoments\(\[\]\); \/\/ clear to refetch/,
  `reactions: {}
    });
    if (insertError) {
      console.error(insertError);
      return { error: insertError };
    }
    setMoments([]); // clear to refetch`
);

fs.writeFileSync('src/app/locket/page.tsx', code);
console.log('Fixed handleSendMoment with comment');
