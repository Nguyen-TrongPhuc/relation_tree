'use client';

import { useState, useEffect } from 'react';
import Tree2D from '@/components/tree/Tree2D';
import { buildTreeState, getVietnamTime, formatYYYYMMDD } from '@/lib/tree/engine';
import { MessageCircle, User } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import WishEnvelope from '@/components/world/WishEnvelope';
import { WISHES_DATA } from '@/lib/tree/wishesData';

const phaseLabels: Record<string, string> = {
  seedling: '🌱 Mầm (trong chậu)',
  sapling: '🌿 Cây non (dưới đất)',
  young: '🌳 Cây nhỏ',
  mature: '🌲 Cây trưởng thành',
  ancient: '🏔️ Cây cổ thụ',
};

const milestones = [
  { day: 1, label: 'Ngày 1' },
  { day: 7, label: 'Ngày 7' },
  { day: 8, label: 'Ngày 8' },
  { day: 31, label: '1 tháng' },
  { day: 90, label: '3 tháng' },
  { day: 180, label: '6 tháng' },
  { day: 365, label: '1 năm' },
];

export default function InteractiveTreeWorld({ rawDailyData, events, startDate, userProfile, partnerProfile }: any) {
  const todayStr = rawDailyData.length > 0
    ? rawDailyData[rawDailyData.length - 1].date
    : formatYYYYMMDD(getVietnamTime(new Date()));

  const startTimestamp = Date.parse(`${startDate}T00:00:00Z`);
  const todayTimestamp = Date.parse(`${todayStr}T00:00:00Z`);
  const totalDays = Math.max(1, Math.floor((todayTimestamp - startTimestamp) / 86400000));

  const [viewDayIndex, setViewDayIndex] = useState(totalDays);
  const selectDay = (dayIndex: number) => {
    setViewDayIndex(Math.min(totalDays, Math.max(0, dayIndex)));
  };

  const viewDateObj = new Date(startTimestamp);
  viewDateObj.setUTCDate(viewDateObj.getUTCDate() + viewDayIndex);
  const viewDateStr = viewDateObj.toISOString().slice(0, 10);

  const activeWish = WISHES_DATA.find(w => 
    w.day === viewDateObj.getUTCDate() && 
    w.month === viewDateObj.getUTCMonth() + 1 &&
    (!w.year || w.year === viewDateObj.getUTCFullYear())
  );

  const treeState = buildTreeState(startDate, viewDateStr, rawDailyData, events);

  const [timePhase, setTimePhase] = useState('day');
  const [isPartnerOnline, setIsPartnerOnline] = useState(false);
  const [liveUserProfile, setLiveUserProfile] = useState(userProfile);
  const [livePartnerProfile, setLivePartnerProfile] = useState(partnerProfile);
  const supabase = createClient();
  
  useEffect(() => {
    // 0. Fetch freshest profiles
    const fetchProfiles = async () => {
      const { data } = await supabase.from('profiles').select('*').in('id', [userProfile.id, partnerProfile.id]);
      if (data) {
        const u = data.find((p: any) => p.id === userProfile.id);
        const p = data.find((p: any) => p.id === partnerProfile.id);
        if (u) setLiveUserProfile(u);
        if (p) setLivePartnerProfile(p);
      }
    };
    fetchProfiles();

    const channel = supabase
      .channel('public:profiles_tree')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload) => {
        if (payload.new.id === userProfile.id) setLiveUserProfile(payload.new);
        if (payload.new.id === partnerProfile.id) setLivePartnerProfile(payload.new);
      })
      .subscribe();

    // 1. Trạng thái ngày/đêm
    const updateTimePhase = () => {
      const h = new Date().getHours();
      if (h >= 5 && h < 7) setTimePhase('sunrise');
      else if (h >= 7 && h < 17) setTimePhase('day');
      else if (h >= 17 && h < 19) setTimePhase('sunset');
      else setTimePhase('night');
    };
    updateTimePhase();
    const interval = setInterval(updateTimePhase, 60000);

    // 2. Trạng thái Online/Offline (Supabase Presence)
    if (!userProfile?.id || !partnerProfile?.id) return;
    
    // Cập nhật last_active của bản thân mỗi 3 phút
    const updateLastActive = async () => {
      await supabase.from('profiles').update({ last_active: new Date().toISOString() }).eq('id', userProfile.id);
    };
    updateLastActive();
    const activeInterval = setInterval(updateLastActive, 180000);

    const room = supabase.channel('couple_room');
    room.on('presence', { event: 'sync' }, () => {
      const state = room.presenceState();
      // Kiểm tra xem ID của người yêu có đang trong danh sách online không
      const partnerIsHere = Object.values(state).some(
        presences => presences.some((p: any) => p.user_id === partnerProfile.id)
      );
      setIsPartnerOnline(partnerIsHere);
    }).subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await room.track({ user_id: userProfile.id });
      }
    });

    return () => {
      clearInterval(interval);
      clearInterval(activeInterval);
      supabase.removeChannel(room);
      supabase.removeChannel(channel);
    };
  }, [userProfile, partnerProfile, supabase]);

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-gradient-to-br from-[#fdf2f8] to-[#f0fdfa] relative">
      
      {/* Tree World Container */}
      <div className="relative h-full w-full transition-all duration-500 ease-in-out flex-shrink-0">
        {/* Couple Badge (Top Center) */}
        {userProfile && partnerProfile && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-white/40 backdrop-blur-md px-4 py-2 rounded-full shadow-sm border border-white/50 pointer-events-auto">
            <div className="flex flex-col items-center">
              <img 
                src={liveUserProfile?.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${userProfile.id}`} 
                alt="You" 
                className="w-8 h-8 rounded-full border border-pink-200 object-cover"
              />
              <span className="text-[9px] font-bold text-pink-800 mt-1 max-w-[60px] truncate">{userProfile.display_name}</span>
            </div>
            
            <div className="text-red-400 animate-pulse">❤️</div>
            
            <div className="flex flex-col items-center relative">
              <img 
                src={livePartnerProfile?.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${partnerProfile.id}`} 
                alt="Partner" 
                className={`w-8 h-8 rounded-full border-2 object-cover ${isPartnerOnline ? 'border-green-400' : 'border-pink-200'}`}
              />
              {isPartnerOnline && (
                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-green-500 border border-white rounded-full"></span>
              )}
              <span className="text-[9px] font-bold text-pink-800 mt-1 max-w-[60px] truncate">{partnerProfile.display_name}</span>
            </div>
          </div>
        )}

        {activeWish && <WishEnvelope wish={activeWish} />}
        <Tree2D treeState={treeState} timePhase={timePhase} />

        {/* Tree Control Panel */}
        <aside
          className="absolute bottom-6 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:right-4 md:top-1/2 z-40 w-[90%] max-w-[320px] md:w-60 md:-translate-y-1/2 rounded-2xl border border-white/50 bg-white/50 md:bg-white/35 p-4 shadow-lg backdrop-blur-md transition-opacity duration-300 opacity-100"
          onPointerDown={(event) => event.stopPropagation()}
        >
          {/* Phase & Day counter */}
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#3E2723]">Ngày xem</p>
              <p className="mt-1 text-sm font-semibold text-[#5D4037]">Ngày {treeState.ageDays}</p>
            </div>
            <span className="rounded-full bg-white/60 px-2 py-1 text-[10px] font-semibold text-[#5D4037] text-center leading-tight">
              {phaseLabels[treeState.phase] || treeState.phase}
            </span>
          </div>

          <div className="mb-3 flex items-center gap-2 text-[10px] text-[#5D4037]">
            <span className="rounded bg-[#E8F5E9] px-1.5 py-0.5 font-medium">Tuần {treeState.currentWeek + 1}</span>
            <span className="rounded bg-[#FFF3E0] px-1.5 py-0.5 font-medium">{treeState.branches.length} cành</span>
            <span className="rounded bg-[#E3F2FD] px-1.5 py-0.5 font-medium">{treeState.season}</span>
          </div>

          <input
            type="range"
            min="0"
            max={totalDays}
            step="1"
            value={viewDayIndex}
            onInput={(event) => selectDay(Number(event.currentTarget.value))}
            onChange={(event) => selectDay(Number(event.currentTarget.value))}
            aria-label="Chọn ngày phát triển của cây"
            className="h-3 w-full cursor-pointer accent-[#4CAF50] touch-none"
          />
          <div className="mt-2 flex justify-between text-[10px] font-medium text-[#5D4037]">
            <span>Ngày 1</span>
            <span>{viewDateStr}</span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => selectDay(viewDayIndex - 1)}
              className="rounded-md bg-white/50 px-2 py-1 text-xs font-semibold text-[#5D4037] hover:bg-white/80"
            >
              ◀ Ngày trước
            </button>
            <button
              type="button"
              onClick={() => selectDay(viewDayIndex + 1)}
              className="rounded-md bg-white/50 px-2 py-1 text-xs font-semibold text-[#5D4037] hover:bg-white/80"
            >
              Ngày sau ▶
            </button>
          </div>

          <div className="mt-3">
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#5D4037]/60">Mốc tiến hóa</p>
              <div className="flex flex-wrap gap-1">
                {milestones.filter(m => m.day - 1 <= totalDays).map((m) => (
                  <button
                    key={m.day}
                    type="button"
                    onClick={() => selectDay(m.day - 1)}
                    className={`rounded-md px-1.5 py-1 text-[10px] font-semibold transition-colors ${
                      viewDayIndex === m.day - 1
                        ? 'bg-[#8D6E63] text-white shadow-sm'
                        : 'bg-white/50 text-[#5D4037] hover:bg-white/80'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3">
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#5D4037]/60">Lá thư kỷ niệm</p>
              <div className="flex flex-wrap gap-1">
                {WISHES_DATA.map((wish, idx) => {
                  // Find the closest day index for this wish
                  let targetIndex = 0;
                  let found = false;
                  for (let i = 0; i <= totalDays; i++) {
                    const d = new Date(startTimestamp);
                    d.setUTCDate(d.getUTCDate() + i);
                    if (d.getUTCDate() === wish.day && (d.getUTCMonth() + 1) === wish.month) {
                      if (!wish.year || d.getUTCFullYear() === wish.year) {
                        targetIndex = i;
                        found = true;
                        break;
                      }
                    }
                  }
                  if (!found) return null;

                  return (
                    <button
                      key={wish.title + idx}
                      type="button"
                      onClick={() => selectDay(targetIndex)}
                      className={`rounded-md px-1.5 py-1 text-[10px] font-semibold transition-colors ${
                        viewDayIndex === targetIndex
                          ? 'bg-pink-500 text-white shadow-sm'
                          : 'bg-pink-100 text-pink-700 hover:bg-pink-200'
                      }`}
                      title={wish.title}
                    >
                      {wish.day}/{wish.month}{wish.year ? ` '${wish.year.toString().slice(2)}` : ''}
                    </button>
                  );
                })}
              </div>
            </div>
        </aside>

        {/* Back to Home Button (Floating Top Left) */}
        <Link
          href="/"
          className="absolute top-6 left-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-white/70 text-pink-700 shadow-md backdrop-blur-sm transition-transform hover:scale-110 active:scale-95 border border-pink-100"
          title="Trở về Trang Chủ"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
        </Link>
      </div>
    </div>
  );
}
