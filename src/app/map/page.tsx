'use client';

import dynamic from 'next/dynamic';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const LocationMap = dynamic(() => import('@/components/map/LocationMap'), { 
  ssr: false,
  loading: () => (
    <div className="flex h-[100dvh] w-full items-center justify-center bg-gradient-to-br from-pink-50 via-white to-teal-50">
      <Loader2 className="w-6 h-6 animate-spin text-pink-400" />
    </div>
  )
});

export default function MapPage() {
  const { user, loading, pairData } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    } else if (!loading && user && !pairData) {
      router.replace('/setup');
    }
  }, [loading, user, pairData, router]);

  if (loading || !user || !pairData) {
    return (
      <div className="flex h-[100dvh] w-full items-center justify-center bg-gradient-to-br from-pink-50 via-white to-teal-50">
        <Loader2 className="w-6 h-6 animate-spin text-pink-400" />
      </div>
    );
  }

  return <LocationMap />;
}
