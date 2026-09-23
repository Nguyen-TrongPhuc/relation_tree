'use client';

import ChatWidget from '@/components/chat/ChatWidget';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function ChatPage() {
  const { user, loading, pairData, partnerProfile } = useAuth();
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
        <Loader2 className="w-6 h-6 animate-spin text-pink-400" />
      </div>
    );
  }

  if (!user || !pairData || !partnerProfile) {
    return null;
  }

  const sharedBg = pairData.background_url;

  return (
    <main className="flex h-[100dvh] w-full bg-white overflow-hidden flex-row">
      <div className="flex-1 relative h-full flex flex-col min-w-0 bg-white">
         <ChatWidget partnerProfile={partnerProfile} chatBackgroundUrl={sharedBg} />
      </div>
    </main>
  );
}
