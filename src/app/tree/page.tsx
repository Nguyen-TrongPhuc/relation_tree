import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import InteractiveTreeWorld from '@/components/world/InteractiveTreeWorld';
import { getVietnamTime, formatYYYYMMDD } from '@/lib/tree/engine';
import { MOCK_START_DATE } from '@/lib/tree/mockData';

export default async function Home() {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/login');
  }

  // Check if user has an accepted partner
  const { data: pair } = await supabase
    .from('friendships')
    .select('id, sender_id, receiver_id, background_url')
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .eq('status', 'accepted')
    .maybeSingle();

  // If not paired, force them to setup page
  if (!pair) {
    redirect('/setup');
  }

  const partnerId = pair.sender_id === user.id ? pair.receiver_id : pair.sender_id;
  const sharedBg = pair.background_url;
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url, last_active')
    .in('id', [user.id, partnerId]);
    
  const userProfile = profiles?.find(p => p.id === user.id) || { id: user.id, display_name: 'Bạn', avatar_url: null };
  const partnerProfile = profiles?.find(p => p.id === partnerId) || { id: partnerId, display_name: 'Người ấy', avatar_url: null };

  // --- Tạo Mock Data trên Server ---
  const startDate = MOCK_START_DATE;
  const today = new Date("2027-11-20T00:00:00Z");
  const rawDailyData: { date: string; activity: number }[] = [];
  
  let current = new Date(`${startDate}T00:00:00Z`);
  while (current <= today) {
    const dStr = formatYYYYMMDD(current);
    let activity = 0;
    const m = current.getMonth();
    
    if (m === 10) activity = 0.8; 
    else if (m === 11) activity = 0.7; 
    else if (m === 0) activity = 0.2; 
    else if (m === 1) activity = 0.5; 
    else activity = Math.random();    
    if (Math.random() > 0.9) activity = 0;
    
    rawDailyData.push({ date: dStr, activity });
    current.setDate(current.getDate() + 1);
  }

  const events = [
    { type: "anniversary", date: "2026-12-20" },
    { type: "memory", date: "2027-01-15" }
  ];

  return (
    <main className="flex min-h-[100dvh] w-full overflow-hidden bg-[#e6e2d3] relative font-sans text-slate-800">
      <InteractiveTreeWorld 
        rawDailyData={rawDailyData} 
        events={events} 
        startDate={startDate} 
        userProfile={userProfile}
        partnerProfile={partnerProfile}
      />
    </main>
  );
}
