'use client';

import InteractiveTreeWorld from '@/components/world/InteractiveTreeWorld';
import { formatYYYYMMDD } from '@/lib/tree/engine';
import { MOCK_START_DATE } from '@/lib/tree/mockData';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { Loader2 } from 'lucide-react';

export default function TreePage() {
  const { user, loading, pairData, userProfile, partnerProfile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    } else if (!loading && user && !pairData) {
      router.replace('/setup');
    }
  }, [loading, user, pairData, router]);

  const { rawDailyData, events, startDate } = useMemo(() => {
    const startDate = MOCK_START_DATE;
    const today = new Date("2027-11-20T00:00:00Z");
    const rawDailyData: { date: string; activity: number }[] = [];
    
    let current = new Date(`${startDate}T00:00:00Z`);
    while (current <= today) {
      const dStr = formatYYYYMMDD(current);
      let activity = 0;
      const m = current.getMonth();
      
      if (m === 10) activity = 0.8; 
      else if (m === 11) activity = 0.7; 
      else if (m === 0) activity = 0.2; 
      else if (m === 1) activity = 0.5; 
      else activity = Math.random();    
      if (Math.random() > 0.9) activity = 0;
      
      rawDailyData.push({ date: dStr, activity });
      current.setDate(current.getDate() + 1);
    }

    const events = [
      { type: "anniversary", date: "2026-12-20" },
      { type: "memory", date: "2027-01-15" }
    ];

    return { rawDailyData, events, startDate };
  }, []);

  if (loading) {
    return (
      <div className="flex h-[100dvh] w-full items-center justify-center bg-gradient-to-br from-pink-50 via-white to-teal-50">
        <Loader2 className="w-6 h-6 animate-spin text-pink-400" />
      </div>
    );
  }

  if (!user || !pairData || !userProfile || !partnerProfile) {
    return null;
  }

  return (
    <main className="flex min-h-[100dvh] w-full overflow-hidden bg-gradient-to-br from-[#fdf2f8] to-[#f0fdfa] relative font-sans text-slate-800">
      <InteractiveTreeWorld 
        rawDailyData={rawDailyData} 
        events={events} 
        startDate={startDate} 
        userProfile={userProfile}
        partnerProfile={partnerProfile}
      />
    </main>
  );
}
