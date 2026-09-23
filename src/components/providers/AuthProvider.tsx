'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  pairData: any | null;
  userProfile: any | null;
  partnerProfile: any | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  pairData: null,
  userProfile: null,
  partnerProfile: null,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [pairData, setPairData] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [partnerProfile, setPartnerProfile] = useState<any>(null);

  const supabase = createClient();

  useEffect(() => {
    // Lấy session từ localStorage (persist qua PWA kill)
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUser(session.user);
        await loadPairData(session.user.id);
      }
      setLoading(false);
    };

    initAuth();

    // Lắng nghe thay đổi auth (đăng nhập, đăng xuất, refresh token)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          await loadPairData(session.user.id);
        } else {
          setUser(null);
          setPairData(null);
          setUserProfile(null);
          setPartnerProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadPairData = async (userId: string) => {
    const { data: pair } = await supabase
      .from('friendships')
      .select('id, sender_id, receiver_id, background_url')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .eq('status', 'accepted')
      .maybeSingle();

    if (pair) {
      setPairData(pair);
      const partnerId = pair.sender_id === userId ? pair.receiver_id : pair.sender_id;
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, last_active')
        .in('id', [userId, partnerId]);

      setUserProfile(profiles?.find(p => p.id === userId) || { id: userId, display_name: 'Bạn', avatar_url: null });
      setPartnerProfile(profiles?.find(p => p.id === partnerId) || { id: partnerId, display_name: 'Người ấy', avatar_url: null });
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, pairData, userProfile, partnerProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
