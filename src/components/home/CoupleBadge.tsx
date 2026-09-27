'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function CoupleBadge({ initialUser, initialPartner, pairData }: { initialUser: any, initialPartner: any, pairData: any }) {
  const [userProfile, setUserProfile] = useState(initialUser);
  const [partnerProfile, setPartnerProfile] = useState(initialPartner);
  const supabase = createClient();

  useEffect(() => {
    const fetchProfiles = async () => {
      const { data } = await supabase.from('profiles').select('*').in('id', [initialUser.id, initialPartner.id]);
      if (data) {
        const u = data.find(p => p.id === initialUser.id);
        const p = data.find(p => p.id === initialPartner.id);
        if (u) setUserProfile(u);
        if (p) setPartnerProfile(p);
      }
    };
    
    // Fetch live on mount
    fetchProfiles();

    // Optionally subscribe to profile changes for absolute realtime synchronization!
    const channel = supabase
      .channel('public:profiles')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload) => {
        if (payload.new.id === initialUser.id) setUserProfile(payload.new);
        if (payload.new.id === initialPartner.id) setPartnerProfile(payload.new);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [initialUser.id, initialPartner.id, supabase]);

  let isMeFemale = pairData?.receiver_id === userProfile?.id;
  if (typeof window !== 'undefined') {
    const override = window.localStorage.getItem('my_gender');
    if (override === 'female') isMeFemale = true;
    if (override === 'male') isMeFemale = false;
  }
  const myBorder = isMeFemale ? 'border-pink-400' : 'border-teal-400';
  const myText = isMeFemale ? 'text-pink-600' : 'text-teal-600';
  
  const partnerBorder = !isMeFemale ? 'border-pink-400' : 'border-teal-400';
  const partnerText = !isMeFemale ? 'text-pink-600' : 'text-teal-600';

  return (
    <div className="flex items-center justify-center gap-8 bg-white/60 backdrop-blur-2xl px-10 py-5 rounded-full shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] border border-white/60">
      <div className="flex flex-col items-center">
        <img 
          src={userProfile?.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${userProfile?.id}`} 
          alt="You" 
          className={`w-16 h-16 rounded-full border-4 ${myBorder} object-cover shadow-lg`}
        />
        <span className={`text-sm font-black ${myText} mt-2`}>{userProfile?.display_name || 'Bạn'}</span>
      </div>
      
      <div className="text-red-500 text-3xl animate-pulse drop-shadow-md">❤️</div>
      
      <div className="flex flex-col items-center">
        <img 
          src={partnerProfile?.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${partnerProfile?.id}`} 
          alt="Partner" 
          className={`w-16 h-16 rounded-full border-4 ${partnerBorder} object-cover shadow-lg`}
        />
        <span className={`text-sm font-black ${partnerText} mt-2`}>{partnerProfile?.display_name || 'Người ấy'}</span>
      </div>
    </div>
  );
}
