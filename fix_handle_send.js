const fs = require('fs');
let code = fs.readFileSync('src/app/locket/page.tsx', 'utf8');

code = code.replace(
  /await supabase\.from\('messages'\)\.insert\(\{/,
  `const { error: insertError } = await supabase.from('messages').insert({`
);

code = code.replace(
  /reactions: \{\}\n\s*\}\);\n\s*setMoments\(\[\]\);/,
  `reactions: {}
    });
    if (insertError) {
      console.error(insertError);
      return { error: insertError };
    }
    setMoments([]);`
);

fs.writeFileSync('src/app/locket/page.tsx', code);
console.log('Fixed handleSendMoment error handling');
