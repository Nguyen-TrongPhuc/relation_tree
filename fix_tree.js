const fs = require('fs');
let code = fs.readFileSync('src/components/world/InteractiveTreeWorld.tsx', 'utf8');

// Handle null partnerProfile in InteractiveTreeWorld
code = code.replace(
  /const \{ data \} = await supabase\.from\('profiles'\)\.select\('\*'\)\.in\('id', \[userProfile\.id, partnerProfile\.id\]\);/g,
  `const ids = [userProfile?.id];
      if (partnerProfile?.id) ids.push(partnerProfile.id);
      const { data } = await supabase.from('profiles').select('*').in('id', ids);`
);

code = code.replace(
  /if \(payload\.new\.id === partnerProfile\.id\) setLivePartnerProfile\(payload\.new\);/g,
  `if (partnerProfile?.id && payload.new.id === partnerProfile.id) setLivePartnerProfile(payload.new);`
);

// In presence check
code = code.replace(
  /presences => presences\.some\(\(p: any\) => p\.user_id === partnerProfile\.id\)/g,
  `presences => partnerProfile?.id && presences.some((p: any) => p.user_id === partnerProfile.id)`
);

// In avatar render
code = code.replace(
  /livePartnerProfile\.avatar_url/g,
  `livePartnerProfile?.avatar_url`
);
code = code.replace(
  /\$\{livePartnerProfile\.id\}/g,
  `\${livePartnerProfile?.id || 'partner'}`
);

fs.writeFileSync('src/components/world/InteractiveTreeWorld.tsx', code);
console.log('Fixed InteractiveTreeWorld crashes');
