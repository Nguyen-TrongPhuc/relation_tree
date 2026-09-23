'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface LocationData {
  lat: number;
  lng: number;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  pairData: any | null;
  userProfile: any | null;
  partnerProfile: any | null;
  myLocation: LocationData | null;
  partnerLocation: LocationData | null;
  isPartnerAppOnline: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  pairData: null,
  userProfile: null,
  partnerProfile: null,
  myLocation: null,
  partnerLocation: null,
  isPartnerAppOnline: false,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [pairData, setPairData] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [partnerProfile, setPartnerProfile] = useState<any>(null);

  // Location state - chia sẻ vị trí toàn app
  const [myLocation, setMyLocation] = useState<LocationData | null>(null);
  const [partnerLocation, setPartnerLocation] = useState<LocationData | null>(null);
  const [isPartnerAppOnline, setIsPartnerAppOnline] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const channelRef = useRef<any>(null);

  const supabase = createClient();

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUser(session.user);
        await loadPairData(session.user.id);
      }
      setLoading(false);
    };

    initAuth();

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

  // Bật GPS và chia sẻ vị trí ngay khi đăng nhập (ở BẤT KỲ trang nào)
  useEffect(() => {
    if (!user || !partnerProfile?.id) return;
    if (!navigator.geolocation) return;

    // 1. Bắt đầu theo dõi GPS
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setMyLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          updated_at: new Date().toISOString(),
        });
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 20000 }
    );

    // 2. Lưu vị trí cuối cùng vào DB khi app sắp bị tắt (iOS PWA workaround)
    const saveLocationOnExit = () => {
      if (document.visibilityState === 'hidden' && myLocation) {
        // Dùng navigator.sendBeacon để đảm bảo gửi được dù app đang bị giết
        const payload = JSON.stringify({
          last_lat: myLocation.lat,
          last_lng: myLocation.lng,
          last_location_at: new Date().toISOString(),
        });
        // Fallback: cập nhật profiles table
        supabase.from('profiles').update({
          last_lat: myLocation.lat,
          last_lng: myLocation.lng,
          last_location_at: new Date().toISOString(),
        }).eq('id', user.id).then(() => {});
      }
    };
    document.addEventListener('visibilitychange', saveLocationOnExit);

    // 3. Load vị trí cuối cùng đã lưu của người ấy từ DB (phòng trường hợp họ đã tắt app)
    const loadSavedPartnerLocation = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('last_lat, last_lng, last_location_at')
        .eq('id', partnerProfile.id)
        .single();
      
      if (data?.last_lat && data?.last_lng) {
        setPartnerLocation({
          lat: data.last_lat,
          lng: data.last_lng,
          updated_at: data.last_location_at || '',
        });
      }
    };
    loadSavedPartnerLocation();

    // 2. Tạo kênh Realtime để chia sẻ vị trí
    const channel = supabase.channel('couple_location');
    channelRef.current = channel;

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      let found = false;
      for (const key of Object.keys(state)) {
        const presences = state[key] as any[];
        for (const p of presences) {
          if (p.user_id === partnerProfile.id) {
            setPartnerLocation({ lat: p.lat, lng: p.lng, updated_at: p.updated_at });
            setIsPartnerAppOnline(true);
            found = true;
          }
        }
      }
      if (!found) {
        setIsPartnerAppOnline(false);
      }
    });

    channel.on('presence', { event: 'leave' }, ({ leftPresences }: any) => {
      for (const p of leftPresences) {
        if (p.user_id === partnerProfile.id) {
          setIsPartnerAppOnline(false);
        }
      }
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // Gửi vị trí ban đầu (nếu đã có)
        if (myLocation) {
          await channel.track({
            user_id: user.id,
            lat: myLocation.lat,
            lng: myLocation.lng,
            updated_at: new Date().toISOString(),
          });
        }
      }
    });

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      document.removeEventListener('visibilitychange', saveLocationOnExit);
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [user, partnerProfile?.id]);

  // Cập nhật vị trí lên kênh Realtime mỗi khi GPS thay đổi
  useEffect(() => {
    if (!myLocation || !user || !channelRef.current) return;

    channelRef.current.track({
      user_id: user.id,
      lat: myLocation.lat,
      lng: myLocation.lng,
      updated_at: myLocation.updated_at,
    });
  }, [myLocation, user]);

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
    <AuthContext.Provider value={{ 
      user, loading, pairData, userProfile, partnerProfile,
      myLocation, partnerLocation, isPartnerAppOnline
    }}>
      {children}
    </AuthContext.Provider>
  );
}
