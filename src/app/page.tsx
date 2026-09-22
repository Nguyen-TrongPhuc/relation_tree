import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { TreeDeciduous, MessageCircleHeart, Settings } from 'lucide-react';
import CoupleBadge from '@/components/home/CoupleBadge';

export default async function DashboardPage() {
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
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url, last_active')
    .in('id', [user.id, partnerId]);
    
  const userProfile = profiles?.find(p => p.id === user.id) || { id: user.id, display_name: 'Bạn', avatar_url: null };
  const partnerProfile = profiles?.find(p => p.id === partnerId) || { id: partnerId, display_name: 'Người ấy', avatar_url: null };
  const sharedBg = pair.background_url;

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center p-6 relative overflow-hidden bg-gradient-to-br from-[#e6e2d3] via-[#f0fdfa] to-[#ccfbf1] font-sans">
      {/* Background Ornaments */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000 z-0"></div>

      <div className="z-10 w-full max-w-lg space-y-10">
        
        {/* Settings Button */}
        <div className="absolute top-6 right-6 z-50">
          <Link href="/settings/profile" className="flex h-12 w-12 items-center justify-center rounded-full bg-white/70 text-teal-700 shadow-sm backdrop-blur-sm transition-transform hover:scale-110 active:scale-95 border border-teal-100">
            <Settings size={22} />
          </Link>
        </div>

        {/* Header / Couple Badge */}
        <div className="flex flex-col items-center space-y-4">
          <CoupleBadge initialUser={userProfile} initialPartner={partnerProfile} />
          <p className="text-teal-900/60 text-sm font-medium">Không gian dành riêng cho hai người</p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {/* Tree Card */}
          <Link href="/tree" className="group relative overflow-hidden rounded-3xl bg-white/60 backdrop-blur-md p-6 shadow-lg border border-white transition-all hover:scale-[1.03] hover:shadow-xl hover:bg-white/80 flex flex-col items-center justify-center text-center gap-4 h-56">
            <div className="absolute -right-6 -bottom-6 text-teal-100 opacity-50 group-hover:opacity-100 transition-opacity">
              <TreeDeciduous size={120} />
            </div>
            <div className="h-16 w-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center shadow-sm relative z-10 group-hover:bg-teal-500 group-hover:text-white transition-colors">
              <TreeDeciduous size={32} />
            </div>
            <div className="relative z-10">
              <h2 className="text-xl font-bold text-teal-900 mb-1">Cây Tình Yêu</h2>
              <p className="text-xs text-teal-700/70 font-medium">Chăm sóc cây tình yêu mỗi ngày</p>
            </div>
          </Link>

          {/* Chat Card */}
          <Link href="/chat" className="group relative overflow-hidden rounded-3xl bg-white/60 backdrop-blur-md p-6 shadow-lg border border-white transition-all hover:scale-[1.03] hover:shadow-xl hover:bg-white/80 flex flex-col items-center justify-center text-center gap-4 h-56">
            <div className="absolute -left-6 -bottom-6 text-pink-100 opacity-50 group-hover:opacity-100 transition-opacity">
              <MessageCircleHeart size={120} />
            </div>
            <div className="h-16 w-16 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center shadow-sm relative z-10 group-hover:bg-pink-500 group-hover:text-white transition-colors">
              <MessageCircleHeart size={32} />
            </div>
            <div className="relative z-10">
              <h2 className="text-xl font-bold text-pink-900 mb-1">Góc Nhắn Gửi</h2>
              <p className="text-xs text-pink-700/70 font-medium">Trò chuyện và chia sẻ yêu thương</p>
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}
