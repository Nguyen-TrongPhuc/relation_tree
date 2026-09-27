const fs = require('fs');
let code = fs.readFileSync('src/components/providers/AuthProvider.tsx', 'utf8');

const search = `    // Cập nhật vị trí lên kênh Realtime mỗi khi GPS thay đổi
    useEffect(() => {
      if (!myLocation || !user || !channelRef.current) return;`;

const replace = `    // Update last_active periodically
    useEffect(() => {
      if (!user) return;
      const updateActive = () => supabase.from('profiles').update({ last_active: new Date().toISOString() }).eq('id', user.id).then();
      updateActive(); // on mount
      const interval = setInterval(updateActive, 60000); // every minute
      
      const handleVis = () => { if (document.visibilityState === 'visible') updateActive(); };
      document.addEventListener('visibilitychange', handleVis);
      return () => { clearInterval(interval); document.removeEventListener('visibilitychange', handleVis); };
    }, [user]);

    // Cập nhật vị trí lên kênh Realtime mỗi khi GPS thay đổi
    useEffect(() => {
      if (!myLocation || !user || !channelRef.current) return;`;

code = code.replace(search, replace);
fs.writeFileSync('src/components/providers/AuthProvider.tsx', code);
console.log('Task 2 Done');
