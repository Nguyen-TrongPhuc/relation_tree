'use client';

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { ArrowLeft, Navigation, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
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

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true });
  }, [lat, lng, map]);
  return null;
}

export default function LocationMap() {
  const { myLocation, partnerLocation, isPartnerAppOnline, userProfile, partnerProfile } = useAuth();
  const [centered, setCentered] = useState<'me' | 'partner' | null>(null);

  const myAvatarUrl = userProfile?.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${userProfile?.id}`;
  const partnerAvatarUrl = partnerProfile?.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${partnerProfile?.id}`;

  if (!myLocation) {
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

  const center = myLocation;

  return (
    <div className="relative h-[100dvh] w-full">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-[1000]">
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
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* Marker của mình */}
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

        {/* Marker của người ấy */}
        {partnerLocation && (
          <Marker
            position={[partnerLocation.lat, partnerLocation.lng]}
            icon={createAvatarIcon(partnerAvatarUrl, isPartnerAppOnline)}
          >
            <Popup>
              <div className="text-center">
                <p className="font-bold text-teal-700">{partnerProfile?.display_name || 'Người ấy'}</p>
                <p className="text-xs text-gray-500">
                  {isPartnerAppOnline ? 'Đang cập nhật vị trí' : 'Vị trí lần cuối'}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {centered === 'me' && <RecenterMap lat={myLocation.lat} lng={myLocation.lng} />}
        {centered === 'partner' && partnerLocation && <RecenterMap lat={partnerLocation.lat} lng={partnerLocation.lng} />}
      </MapContainer>

      {/* Bottom Controls */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1000] flex gap-3">
        <button
          onClick={() => setCentered('me')}
          className="flex items-center gap-2 px-4 py-3 bg-pink-500 text-white rounded-full shadow-lg hover:bg-pink-600 active:scale-95 transition-all font-medium text-sm"
        >
          <img src={myAvatarUrl} className="w-6 h-6 rounded-full border border-white object-cover" alt="" />
          Vị trí của tôi
        </button>

        <button
          onClick={() => setCentered('partner')}
          disabled={!partnerLocation}
          className={`flex items-center gap-2 px-4 py-3 rounded-full shadow-lg active:scale-95 transition-all font-medium text-sm ${
            partnerLocation 
              ? 'bg-teal-500 text-white hover:bg-teal-600' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <img src={partnerAvatarUrl} className="w-6 h-6 rounded-full border border-white object-cover" alt="" />
          {partnerLocation ? (partnerProfile?.display_name || 'Người ấy') : 'Chưa online'}
        </button>
      </div>

      {/* Partner status */}
      {!partnerLocation && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-md border border-teal-100">
          <p className="text-xs text-teal-700 font-medium">
            {partnerProfile?.display_name || 'Người ấy'} chưa mở app
          </p>
        </div>
      )}

      {partnerLocation && !isPartnerAppOnline && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-md border border-yellow-200">
          <p className="text-xs text-yellow-700 font-medium">
            📍 Vị trí lần cuối của {partnerProfile?.display_name || 'người ấy'}
          </p>
        </div>
      )}
    </div>
  );
}
