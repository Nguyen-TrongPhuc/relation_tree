import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ChatWidget from '@/components/chat/ChatWidget';

export default async function ChatPage() {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/login');
  }

  const { data: pair } = await supabase
    .from('friendships')
    .select('id, sender_id, receiver_id, background_url')
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .eq('status', 'accepted')
    .maybeSingle();

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

  return (
    <main className="flex h-[100dvh] w-full bg-white overflow-hidden flex-row">
      {/* Main Chat Area */}
      <div className="flex-1 relative h-full flex flex-col min-w-0 bg-white">
         <ChatWidget partnerProfile={partnerProfile} chatBackgroundUrl={sharedBg} />
      </div>
    </main>
  );
}
