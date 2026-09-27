const fs = require('fs');

const locationMapCode = `'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { ArrowLeft, Navigation, Loader2, MapPin, Navigation2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import 'leaflet/dist/leaflet.css';

// Haversine distance
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // in km
}

function createAvatarIcon(avatarUrl: string, isOnline: boolean, themeColor: string) {
  const borderColor = themeColor;
  return L.divIcon({
    className: 'custom-avatar-marker',
    iconSize: [52, 60],
    iconAnchor: [26, 60],
    html: \`
      <div style="position: relative; width: 52px; height: 60px; display: flex; flex-direction: column; items-center;">
        <div style="
          width: 52px; height: 52px; 
          border-radius: 50%; 
          border: 4px solid \${borderColor}; 
          box-shadow: 0 8px 16px rgba(0,0,0,0.2);
          overflow: hidden; 
          background: white;
          position: relative;
          z-index: 2;
        ">
          <img src="\${avatarUrl}" style="width: 100%; height: 100%; object-fit: cover;" />
        </div>
        <div style="
          position: absolute;
          bottom: 2px;
          left: 50%;
          transform: translateX(-50%);
          width: 0; height: 0; 
          border-left: 10px solid transparent; 
          border-right: 10px solid transparent; 
          border-top: 14px solid \${borderColor};
          z-index: 1;
        "></div>
      </div>
    \`
  });
}

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 16, { animate: true, duration: 1.5 });
  }, [lat, lng, map]);
  return null;
}

function FitBoundsMap({ myLat, myLng, pLat, pLng }: { myLat: number, myLng: number, pLat: number, pLng: number }) {
  const map = useMap();
  useEffect(() => {
    const bounds = L.latLngBounds([myLat, myLng], [pLat, pLng]);
    map.flyToBounds(bounds, { padding: [50, 50], animate: true, duration: 1.5 });
  }, [myLat, myLng, pLat, pLng, map]);
  return null;
}

export default function LocationMap() {
  const { userProfile, partnerProfile, pairData, myLocation, partnerLocation, isPartnerAppOnline } = useAuth();
  const [centered, setCentered] = useState<'me' | 'partner' | 'both'>('me');

  // Role based colors
  // Assuming sender is Male (Cyan), receiver is Female (Pink)
  const isFemale = pairData?.receiver_id === userProfile?.id;
  const myColor = isFemale ? '#ec4899' : '#06b6d4'; // pink-500 : cyan-500
  const myTailwindBg = isFemale ? 'bg-pink-500' : 'bg-cyan-500';
  const myTailwindText = isFemale ? 'text-pink-500' : 'text-cyan-500';
  
  const partnerColor = !isFemale ? '#ec4899' : '#06b6d4'; // pink-500 : cyan-500
  const pTailwindBg = !isFemale ? 'bg-pink-500' : 'bg-cyan-500';
  const pTailwindText = !isFemale ? 'text-pink-500' : 'text-cyan-500';

  const myAvatarUrl = userProfile?.avatar_url || \`https://api.dicebear.com/7.x/adventurer/svg?seed=\${userProfile?.id}\`;
  const partnerAvatarUrl = partnerProfile?.avatar_url || \`https://api.dicebear.com/7.x/adventurer/svg?seed=\${partnerProfile?.id}\`;

  const myIcon = useMemo(() => createAvatarIcon(myAvatarUrl, true, myColor), [myAvatarUrl, myColor]);
  const partnerIcon = useMemo(() => createAvatarIcon(partnerAvatarUrl, isPartnerAppOnline, partnerColor), [partnerAvatarUrl, isPartnerAppOnline, partnerColor]);

  if (!myLocation) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 flex-col gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-pink-400" />
        <p className="text-gray-500 font-medium animate-pulse">Đang tìm vị trí của bạn...</p>
      </div>
    );
  }

  const distanceKm = partnerLocation ? getDistance(myLocation.lat, myLocation.lng, partnerLocation.lat, partnerLocation.lng) : null;

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-[#e5e5e5]">
      {/* Back Button */}
      <div className="absolute top-12 left-6 z-[1000]">
        <Link href="/" className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-xl backdrop-blur-md transition-transform hover:scale-110 border border-gray-100">
          <ArrowLeft size={24} />
        </Link>
      </div>

      <MapContainer 
        center={[myLocation.lat, myLocation.lng]} 
        zoom={16} 
        zoomControl={false}
        className="w-full h-full z-0"
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        <Marker position={[myLocation.lat, myLocation.lng]} icon={myIcon} zIndexOffset={1000}>
          <Popup className="rounded-xl font-sans">
            <div className="text-center font-bold text-gray-800">Bạn đang ở đây</div>
          </Popup>
        </Marker>

        {partnerLocation && (
          <Marker position={[partnerLocation.lat, partnerLocation.lng]} icon={partnerIcon}>
            <Popup className="rounded-xl font-sans">
              <div className="text-center font-bold text-gray-800">
                {partnerProfile?.display_name || 'Người ấy'} {isPartnerAppOnline ? 'đang online' : 'đã offline'}
              </div>
            </Popup>
          </Marker>
        )}

        {partnerLocation && distanceKm !== null && distanceKm < 100 && (
            <Polyline positions={[
                [myLocation.lat, myLocation.lng],
                [partnerLocation.lat, partnerLocation.lng]
            ]} color="#9ca3af" dashArray="8, 8" weight={3} opacity={0.6} />
        )}

        {centered === 'me' && <RecenterMap lat={myLocation.lat} lng={myLocation.lng} />}
        {centered === 'partner' && partnerLocation && <RecenterMap lat={partnerLocation.lat} lng={partnerLocation.lng} />}
        {centered === 'both' && partnerLocation && <FitBoundsMap myLat={myLocation.lat} myLng={myLocation.lng} pLat={partnerLocation.lat} pLng={partnerLocation.lng} />}
      </MapContainer>

      {/* Floating Info Panel */}
      <div className="absolute bottom-8 left-4 right-4 z-[1000]">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-5 border border-white/50">
            {distanceKm !== null && (
                <div className="flex justify-between items-center mb-5 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <Navigation2 size={20} className="text-gray-400" />
                        <span className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Khoảng cách</span>
                    </div>
                    <div className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-cyan-500">
                        {distanceKm < 1 ? \`\${Math.round(distanceKm * 1000)} m\` : \`\${distanceKm.toFixed(1)} km\`}
                    </div>
                </div>
            )}
            
            <div className="flex gap-4">
                <button
                    onClick={() => setCentered('me')}
                    className={\`flex-1 relative overflow-hidden rounded-2xl p-3 flex flex-col items-center gap-2 transition-all active:scale-95 \${centered === 'me' ? \`\${myTailwindBg} text-white shadow-lg\` : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}\`}
                >
                    <div className={\`w-12 h-12 rounded-full p-1 bg-white shadow-sm\`}>
                        <img src={myAvatarUrl} className="w-full h-full rounded-full object-cover" />
                    </div>
                    <span className="font-bold text-sm">Tôi</span>
                </button>

                {distanceKm !== null && (
                    <button onClick={() => setCentered('both')} className="self-center p-3 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 active:scale-90 transition-all">
                        <MapPin size={20} />
                    </button>
                )}

                <button
                    onClick={() => setCentered('partner')}
                    disabled={!partnerLocation}
                    className={\`flex-1 relative overflow-hidden rounded-2xl p-3 flex flex-col items-center gap-2 transition-all \${partnerLocation ? 'active:scale-95 cursor-pointer' : 'opacity-50 cursor-not-allowed'} \${centered === 'partner' ? \`\${pTailwindBg} text-white shadow-lg\` : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}\`}
                >
                    <div className="w-12 h-12 rounded-full p-1 bg-white shadow-sm relative">
                        <img src={partnerAvatarUrl} className="w-full h-full rounded-full object-cover" />
                        {partnerLocation && isPartnerAppOnline && (
                            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>
                        )}
                    </div>
                    <span className="font-bold text-sm truncate w-full text-center">{partnerProfile?.display_name || 'Người ấy'}</span>
                </button>
            </div>
        </div>
      </div>
      
      {!partnerLocation && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-[1000] bg-white/95 backdrop-blur-md px-6 py-2.5 rounded-full shadow-lg border border-gray-100">
          <p className="text-sm text-gray-600 font-bold flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            Đang tìm vị trí người ấy...
          </p>
        </div>
      )}
    </div>
  );
}
`;

fs.writeFileSync('src/components/map/LocationMap.tsx', locationMapCode);
console.log('LocationMap redesigned successfully');
