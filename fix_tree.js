const fs = require('fs');
let content = fs.readFileSync('src/components/world/InteractiveTreeWorld.tsx', 'utf8');

// Add states if missing
if (!content.includes('const [liveUserProfile, setLiveUserProfile] = useState(userProfile);')) {
  content = content.replace(
    /const \[isPartnerOnline, setIsPartnerOnline\] = useState\(false\);/,
    \const [isPartnerOnline, setIsPartnerOnline] = useState(false);
  const [liveUserProfile, setLiveUserProfile] = useState(userProfile);
  const [livePartnerProfile, setLivePartnerProfile] = useState(partnerProfile);\
  );
}

// Add fetchProfiles useEffect
if (!content.includes('const fetchProfiles = async () => {')) {
  content = content.replace(
    /useEffect\(\(\) => \{/,
    \useEffect(() => {
    const fetchProfiles = async () => {
      const { data } = await supabase.from('profiles').select('*').in('id', [userProfile.id, partnerProfile.id]);
      if (data) {
        const u = data.find((p) => p.id === userProfile.id);
        const p = data.find((p) => p.id === partnerProfile.id);
        if (u) setLiveUserProfile(u);
        if (p) setLivePartnerProfile(p);
      }
    };
    fetchProfiles();
    
    const channel = supabase
      .channel('public:profiles_tree')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload) => {
        if (payload.new.id === userProfile.id) setLiveUserProfile(payload.new);
        if (payload.new.id === partnerProfile.id) setLivePartnerProfile(payload.new);
      })
      .subscribe();
\
  );
  
  content = content.replace(
    /return \(\) => \{/,
    \eturn () => {
      supabase.removeChannel(channel);\
  );
}

fs.writeFileSync('src/components/world/InteractiveTreeWorld.tsx', content, 'utf8');
