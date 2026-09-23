'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/providers/AuthProvider';
import { MessageCircleHeart, X } from 'lucide-react';

export default function GlobalNotifications() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, partnerProfile } = useAuth();
  const supabase = createClient();
  const [toastMessage, setToastMessage] = useState<{ id: string, content: string } | null>(null);

  useEffect(() => {
    if (!user || !partnerProfile) return;

    // Lắng nghe tin nhắn mới
    const channel = supabase.channel('global:messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` },
        (payload) => {
          const newMsg = payload.new;
          
          // Nếu đang không ở trang chat thì hiện Toast và tăng biến đếm
          if (pathname !== '/chat') {
            // Hiển thị Toast
            const content = newMsg.is_moment 
              ? '📸 Vừa chia sẻ một khoảnh khắc' 
              : newMsg.content?.startsWith('CALL::') 
                ? '📞 Đang gọi cho bạn' 
                : newMsg.content;
            
            setToastMessage({ id: newMsg.id, content: content || 'Có tin nhắn mới' });

            // Tự động ẩn sau 5s
            setTimeout(() => {
              setToastMessage(null);
            }, 5000);

            // Cập nhật số đếm vào localStorage hoặc CustomEvent để Home page đọc
            const currentUnread = parseInt(localStorage.getItem('unread_count') || '0', 10);
            localStorage.setItem('unread_count', (currentUnread + 1).toString());
            window.dispatchEvent(new Event('unread_update'));
            
            // Phát âm thanh nhẹ (nếu muốn)
            try {
              const audio = new Audio('/notification.mp3'); // Có thể tải file âm thanh nhẹ về public/
              audio.play().catch(() => {}); // catch lỗi bị trình duyệt chặn autoplay
            } catch (e) {}
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, partnerProfile, pathname]);

  // Khi vào trang chat, reset số chưa đọc
  useEffect(() => {
    if (pathname === '/chat') {
      localStorage.setItem('unread_count', '0');
      window.dispatchEvent(new Event('unread_update'));
    }
  }, [pathname]);

  if (!toastMessage) return null;

  return (
    <div className="fixed top-safe-4 left-4 right-4 z-[9999] animate-in slide-in-from-top-10 fade-in duration-300">
      <div 
        onClick={() => {
          setToastMessage(null);
          router.push('/chat');
        }}
        className="bg-white/90 backdrop-blur-xl shadow-xl rounded-2xl p-4 flex items-center gap-4 cursor-pointer border border-pink-100/50"
      >
        <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0 text-pink-500">
          <MessageCircleHeart size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-800">{partnerProfile?.display_name || 'Người ấy'}</p>
          <p className="text-sm text-gray-600 truncate">{toastMessage.content}</p>
        </div>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setToastMessage(null);
          }} 
          className="p-2 text-gray-400 hover:text-gray-600 rounded-full bg-gray-50"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
