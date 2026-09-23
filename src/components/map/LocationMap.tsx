'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Navigation, Loader2 } from 'lucide-react';
import Link from 'next/link';
import 'leaflet/dist/leaflet.css';

// Custom avatar marker
function createAvatarIcon(avatarUrl: string, isOnline: boolean) {
  const borderColor = isOnline ? '#22c55e' : '#d1d5db';
  return L.divIcon({
    className: 'custom-avatar-marker',
    html: `
      <div style="
        width: 48px; height: 48px; 
        border-radius: 50%; 
        border: 3px solid ${borderColor}; 
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        overflow: hidden; 
        background: white;
      ">
        <img src="${avatarUrl}" style="width: 100%; height: 100%; object-fit: cover;" />
      </div>
      <div style="
        width: 0; height: 0; 
        border-left: 8px solid transparent; 
        border-right: 8px solid transparent; 
        border-top: 8px solid ${borderColor}; 
        margin: -2px auto 0;
      "></div>
    `,
    iconSize: [48, 56],
    iconAnchor: [24, 56],
    popupAnchor: [0, -56],
  });
}

// Component to recenter map
function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true });
  }, [lat, lng, map]);
  return null;
}

interface LocationMapProps {
  userProfile: any;
  partnerProfile: any;
}

export default function LocationMap({ userProfile, partnerProfile }: LocationMapProps) {
  const supabase = createClient();
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [partnerLocation, setPartnerLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isPartnerOnline, setIsPartnerOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [centered, setCentered] = useState<'me' | 'partner' | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // 1. Lấy vị trí hiện tại của mình
  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Trình duyệt không hỗ trợ định vị');
      setLoading(false);
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setMyLocation(loc);
        setLoading(false);
      },
      (err) => {
        setError('Không thể lấy vị trí. Vui lòng bật GPS và cho phép truy cập vị trí.');
        setLoading(false);
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // 2. Chia sẻ vị trí của mình qua Supabase Realtime
  useEffect(() => {
    if (!myLocation || !userProfile?.id) return;

    const channel = supabase.channel('couple_location');
    
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          user_id: userProfile.id,
          lat: myLocation.lat,
          lng: myLocation.lng,
          updated_at: new Date().toISOString(),
        });
      }
    });

    // Lắng nghe vị trí của người kia
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      for (const key of Object.keys(state)) {
        const presences = state[key] as any[];
        for (const p of presences) {
          if (p.user_id === partnerProfile?.id) {
            setPartnerLocation({ lat: p.lat, lng: p.lng });
            setIsPartnerOnline(true);
          }
        }
      }
    });

    channel.on('presence', { event: 'leave' }, ({ leftPresences }: any) => {
      for (const p of leftPresences) {
        if (p.user_id === partnerProfile?.id) {
          setIsPartnerOnline(false);
        }
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [myLocation, userProfile?.id, partnerProfile?.id, supabase]);

  // Cập nhật vị trí mỗi 10 giây
  useEffect(() => {
    if (!myLocation || !userProfile?.id) return;

    const interval = setInterval(async () => {
      const channel = supabase.channel('couple_location');
      await channel.track({
        user_id: userProfile.id,
        lat: myLocation.lat,
        lng: myLocation.lng,
        updated_at: new Date().toISOString(),
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [myLocation, userProfile?.id, supabase]);

  const myAvatarUrl = userProfile?.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${userProfile?.id}`;
  const partnerAvatarUrl = partnerProfile?.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${partnerProfile?.id}`;

  if (loading) {
    return (
      <div className="flex h-[100dvh] w-full items-center justify-center bg-gradient-to-br from-pink-50 via-white to-teal-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-pink-400" />
          <p className="text-sm text-pink-600 font-medium">Đang xác định vị trí của bạn...</p>
          <p className="text-xs text-gray-400">Hãy cho phép truy cập vị trí khi được hỏi</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[100dvh] w-full items-center justify-center bg-gradient-to-br from-pink-50 via-white to-teal-50 p-6">
        <div className="text-center space-y-4">
          <Navigation className="w-16 h-16 text-pink-300 mx-auto" />
          <p className="text-pink-700 font-medium">{error}</p>
          <Link href="/" className="inline-block px-6 py-2 bg-pink-500 text-white rounded-full text-sm font-bold">
            Quay lại
          </Link>
        </div>
      </div>
    );
  }

  const center = myLocation || { lat: 10.8231, lng: 106.6297 }; // Mặc định: HCM

  return (
    <div className="relative h-[100dvh] w-full">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-[1000] safe-area-top">
        <div className="flex items-center justify-between px-4 py-3 bg-white/90 backdrop-blur-md shadow-sm border-b border-pink-100">
          <Link href="/" className="text-pink-600 hover:bg-pink-50 p-2 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="font-bold text-pink-900">Vị Trí Của Chúng Mình</h1>
          <div className="w-9" />
        </div>
      </div>

      {/* Map */}
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={15}
        className="h-full w-full z-0"
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Marker của mình */}
        {myLocation && (
          <Marker
            position={[myLocation.lat, myLocation.lng]}
            icon={createAvatarIcon(myAvatarUrl, true)}
          >
            <Popup>
              <div className="text-center">
                <p className="font-bold text-pink-700">{userProfile?.display_name || 'Bạn'}</p>
                <p className="text-xs text-gray-500">Vị trí hiện tại</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Marker của người ấy */}
        {partnerLocation && (
          <Marker
            position={[partnerLocation.lat, partnerLocation.lng]}
            icon={createAvatarIcon(partnerAvatarUrl, isPartnerOnline)}
          >
            <Popup>
              <div className="text-center">
                <p className="font-bold text-teal-700">{partnerProfile?.display_name || 'Người ấy'}</p>
                <p className="text-xs text-gray-500">
                  {isPartnerOnline ? 'Đang cập nhật vị trí' : 'Vị trí lần cuối'}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {centered === 'me' && myLocation && (
          <RecenterMap lat={myLocation.lat} lng={myLocation.lng} />
        )}
        {centered === 'partner' && partnerLocation && (
          <RecenterMap lat={partnerLocation.lat} lng={partnerLocation.lng} />
        )}
      </MapContainer>

      {/* Bottom Controls */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1000] flex gap-3">
        {/* Nút tập trung vào mình */}
        <button
          onClick={() => setCentered('me')}
          className="flex items-center gap-2 px-4 py-3 bg-pink-500 text-white rounded-full shadow-lg hover:bg-pink-600 active:scale-95 transition-all font-medium text-sm"
        >
          <img src={myAvatarUrl} className="w-6 h-6 rounded-full border border-white" alt="" />
          Vị trí của tôi
        </button>

        {/* Nút tập trung vào người kia */}
        <button
          onClick={() => setCentered('partner')}
          disabled={!partnerLocation}
          className={`flex items-center gap-2 px-4 py-3 rounded-full shadow-lg active:scale-95 transition-all font-medium text-sm ${
            partnerLocation 
              ? 'bg-teal-500 text-white hover:bg-teal-600' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <img src={partnerAvatarUrl} className="w-6 h-6 rounded-full border border-white" alt="" />
          {partnerLocation ? (partnerProfile?.display_name || 'Người ấy') : 'Chưa online'}
        </button>
      </div>

      {/* Partner offline notice */}
      {!partnerLocation && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-md border border-teal-100">
          <p className="text-xs text-teal-700 font-medium">
            {partnerProfile?.display_name || 'Người ấy'} chưa mở bản đồ
          </p>
        </div>
      )}
    </div>
  );
}
