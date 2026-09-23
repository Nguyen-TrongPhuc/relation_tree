'use client';

import Link from 'next/link';
import { TreeDeciduous, MessageCircleHeart, Settings, MapPin } from 'lucide-react';
import CoupleBadge from '@/components/home/CoupleBadge';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const { user, loading, pairData, userProfile, partnerProfile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    } else if (!loading && user && !pairData) {
      router.replace('/setup');
    }
  }, [loading, user, pairData, router]);

  if (loading) {
    return (
      <div className="flex h-[100dvh] w-full items-center justify-center bg-gradient-to-br from-pink-50 via-white to-teal-50">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-20 h-20 animate-pulse drop-shadow-xl">
            <img src="/apple-icon.png" alt="Loading" className="w-full h-full object-contain opacity-50" />
          </div>
          <Loader2 className="w-6 h-6 animate-spin text-pink-400" />
        </div>
      </div>
    );
  }

  if (!user || !pairData || !userProfile || !partnerProfile) {
    return null;
  }

  const sharedBg = pairData.background_url;

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center p-6 relative overflow-hidden bg-gradient-to-br from-pink-50 via-white to-teal-50 font-sans">
      {/* Background Ornaments */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000 z-0"></div>

      <div className="z-10 w-full max-w-lg space-y-10">
        
        {/* Settings Button */}
        <div className="absolute top-6 right-6 z-50">
          <Link href="/settings/profile" className="flex h-12 w-12 items-center justify-center rounded-full bg-white/70 text-pink-700 shadow-sm backdrop-blur-sm transition-transform hover:scale-110 active:scale-95 border border-pink-100">
            <Settings size={22} />
          </Link>
        </div>

        {/* Header / Couple Badge */}
        <div className="flex flex-col items-center space-y-4">
          <CoupleBadge initialUser={userProfile} initialPartner={partnerProfile} />
          <p className="text-pink-900/60 text-sm font-medium">Không gian dành riêng cho hai người</p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 gap-4 w-full">
          {/* Top Row: Tree + Chat */}
          <div className="grid grid-cols-2 gap-4">
            {/* Tree Card */}
            <Link href="/tree" className="group relative overflow-hidden rounded-3xl bg-white/60 backdrop-blur-md p-5 shadow-lg border border-white transition-all hover:scale-[1.03] hover:shadow-xl hover:bg-white/80 flex flex-col items-center justify-center text-center gap-3 h-44">
              <div className="absolute -right-4 -bottom-4 text-pink-100 opacity-50 group-hover:opacity-100 transition-opacity">
                <TreeDeciduous size={80} />
              </div>
              <div className="h-14 w-14 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center shadow-sm relative z-10 group-hover:bg-pink-500 group-hover:text-white transition-colors">
                <TreeDeciduous size={28} />
              </div>
              <div className="relative z-10">
                <h2 className="text-lg font-bold text-pink-900 mb-0.5">Cây Tình Yêu</h2>
                <p className="text-[10px] text-pink-700/70 font-medium">Chăm sóc cây mỗi ngày</p>
              </div>
            </Link>

            {/* Chat Card */}
            <Link href="/chat" className="group relative overflow-hidden rounded-3xl bg-white/60 backdrop-blur-md p-5 shadow-lg border border-white transition-all hover:scale-[1.03] hover:shadow-xl hover:bg-white/80 flex flex-col items-center justify-center text-center gap-3 h-44">
              <div className="absolute -left-4 -bottom-4 text-pink-100 opacity-50 group-hover:opacity-100 transition-opacity">
                <MessageCircleHeart size={80} />
              </div>
              <div className="h-14 w-14 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center shadow-sm relative z-10 group-hover:bg-pink-500 group-hover:text-white transition-colors">
                <MessageCircleHeart size={28} />
              </div>
              <div className="relative z-10">
                <h2 className="text-lg font-bold text-pink-900 mb-0.5">Góc Nhắn Gửi</h2>
                <p className="text-[10px] text-pink-700/70 font-medium">Trò chuyện yêu thương</p>
              </div>
            </Link>
          </div>

          {/* Map Card - Full Width */}
          <Link href="/map" className="group relative overflow-hidden rounded-3xl bg-white/60 backdrop-blur-md p-5 shadow-lg border border-white transition-all hover:scale-[1.03] hover:shadow-xl hover:bg-white/80 flex items-center gap-5 h-28">
            <div className="absolute -right-8 -bottom-8 text-teal-100 opacity-50 group-hover:opacity-100 transition-opacity">
              <MapPin size={100} />
            </div>
            <div className="h-14 w-14 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center shadow-sm relative z-10 group-hover:bg-teal-500 group-hover:text-white transition-colors flex-shrink-0">
              <MapPin size={28} />
            </div>
            <div className="relative z-10">
              <h2 className="text-lg font-bold text-teal-900 mb-0.5">Bạn Ở Đâu?</h2>
              <p className="text-[10px] text-teal-700/70 font-medium">Chia sẻ vị trí thời gian thực với người ấy</p>
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}
