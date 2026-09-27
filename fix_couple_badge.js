const fs = require('fs');

let pageCode = fs.readFileSync('src/app/page.tsx', 'utf8');
pageCode = pageCode.replace(
  /<CoupleBadge initialUser=\{userProfile\} initialPartner=\{partnerProfile\} \/>/,
  `<CoupleBadge initialUser={userProfile} initialPartner={partnerProfile} pairData={pairData} />`
);
fs.writeFileSync('src/app/page.tsx', pageCode);

let badgeCode = fs.readFileSync('src/components/home/CoupleBadge.tsx', 'utf8');
badgeCode = badgeCode.replace(
  /export default function CoupleBadge\(\{ initialUser, initialPartner \}: \{ initialUser: any, initialPartner: any \}\) \{/,
  `export default function CoupleBadge({ initialUser, initialPartner, pairData }: { initialUser: any, initialPartner: any, pairData: any }) {`
);

badgeCode = badgeCode.replace(
  /return \([\s\S]*?<\/div>\s*\);\s*\}/,
  `  const isMeFemale = pairData?.receiver_id === userProfile?.id;
  const myBorder = isMeFemale ? 'border-pink-400' : 'border-cyan-400';
  const myText = isMeFemale ? 'text-pink-600' : 'text-cyan-600';
  
  const partnerBorder = !isMeFemale ? 'border-pink-400' : 'border-cyan-400';
  const partnerText = !isMeFemale ? 'text-pink-600' : 'text-cyan-600';

  return (
    <div className="flex items-center justify-center gap-8 bg-white/60 backdrop-blur-2xl px-10 py-5 rounded-full shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] border border-white/60">
      <div className="flex flex-col items-center">
        <img 
          src={userProfile?.avatar_url || \`https://api.dicebear.com/7.x/adventurer/svg?seed=\${userProfile?.id}\`} 
          alt="You" 
          className={\`w-16 h-16 rounded-full border-4 \${myBorder} object-cover shadow-lg\`}
        />
        <span className={\`text-sm font-black \${myText} mt-2\`}>{userProfile?.display_name || 'Bạn'}</span>
      </div>
      
      <div className="text-red-500 text-3xl animate-pulse drop-shadow-md">❤️</div>
      
      <div className="flex flex-col items-center">
        <img 
          src={partnerProfile?.avatar_url || \`https://api.dicebear.com/7.x/adventurer/svg?seed=\${partnerProfile?.id}\`} 
          alt="Partner" 
          className={\`w-16 h-16 rounded-full border-4 \${partnerBorder} object-cover shadow-lg\`}
        />
        <span className={\`text-sm font-black \${partnerText} mt-2\`}>{partnerProfile?.display_name || 'Người ấy'}</span>
      </div>
    </div>
  );
}`
);

fs.writeFileSync('src/components/home/CoupleBadge.tsx', badgeCode);
console.log('Updated CoupleBadge');
