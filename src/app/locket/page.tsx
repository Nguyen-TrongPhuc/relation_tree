'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { ArrowLeft, Clock, Grid, Loader2, Smile, Send, Heart, Download, Trash, MoreHorizontal, Camera } from 'lucide-react';
import PreviewModal from '@/components/locket/PreviewModal';

const EMOJIS = ['❤️', '😂', '😮', '😢', '😍', '🔥'];

export default function LocketPage() {
  const { user, loading: authLoading, userProfile, partnerProfile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'gallery' ? 'gallery' : 'timeline';
  
  const [tab, setTab] = useState<'timeline' | 'gallery'>(initialTab);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [moments, setMoments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [showEmojisFor, setShowEmojisFor] = useState<string | null>(null);
  const [showMenuFor, setShowMenuFor] = useState<string | null>(null);

  const supabase = createClient();
  const observerTarget = useRef(null);
  
  const limit = 10;

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (userProfile && partnerProfile) {
      fetchMoments(true);
    }
  }, [userProfile, partnerProfile]);

  // Khởi tạo Realtime
  useEffect(() => {
    if (!userProfile) return;
    const channel = supabase.channel('public:messages:locket')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: 'is_moment=eq.true' }, (payload) => {
        const newMsg = payload.new;
        if (newMsg.sender_id === userProfile.id || newMsg.sender_id === partnerProfile?.id) {
          setMoments(prev => [newMsg, ...prev]);
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: 'is_moment=eq.true' }, (payload) => {
        const updatedMsg = payload.new;
        setMoments(prev => prev.map(m => m.id === updatedMsg.id ? { ...m, ...updatedMsg } : m));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userProfile, partnerProfile]);

  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setIsPreviewOpen(true);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSendMoment = async (imageUrl: string, caption: string) => {
    await supabase.from('messages').insert({
      sender_id: userProfile.id,
      receiver_id: partnerProfile.id,
      content: caption || '📸 Vừa chia sẻ một khoảnh khắc',
      image_url: imageUrl,
      is_moment: true,
      reactions: {}
    });
    setMoments([]); // clear to refetch
    setPage(0);
    setHasMore(true);
    fetchMoments(true);
  };
const fetchMoments = async (isInitial = false) => {
    if (!userProfile || !partnerProfile) return;
    if (isInitial) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    const currentLength = isInitial ? 0 : moments.length;

    const { data } = await supabase
      .from('messages')
      .select('*')
      .in('sender_id', [userProfile.id, partnerProfile.id])
      .eq('is_moment', true)
      .order('created_at', { ascending: false })
      .range(currentLength, currentLength + limit - 1);
    
    if (data) {
      if (isInitial) {
        setMoments(data);
      } else {
        // Loại bỏ trùng lặp nếu có do realtime chèn vào
        setMoments(prev => {
          const newItems = data.filter(d => !prev.find(p => p.id === d.id));
          return [...prev, ...newItems];
        });
      }
      if (data.length < limit) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    }
    setLoading(false);
    setLoadingMore(false);
  };

  // Intersection Observer cho Infinite Scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          fetchMoments();
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, loadingMore, loading, moments]);

  const handleReact = async (momentId: string, emoji: string) => {
    setShowEmojisFor(null);
    const moment = moments.find(m => m.id === momentId);
    if (!moment) return;
    
    const currentReactions = moment.reactions || {};
    const newReactions = { ...currentReactions, [userProfile.id]: emoji };
    
    setMoments(prev => prev.map(m => m.id === momentId ? { ...m, reactions: newReactions } : m));
    await supabase.from('messages').update({ reactions: newReactions }).eq('id', momentId);
  };

  const handleDelete = async (momentId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa ảnh này không?')) return;
    setMoments(prev => prev.filter(m => m.id !== momentId));
    await supabase.from('messages').delete().eq('id', momentId);
    setShowMenuFor(null);
  };

  const handleDownload = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `locket-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      window.open(imageUrl, '_blank');
    }
    setShowMenuFor(null);
  };

  const handleReply = async (e: React.FormEvent, momentId: string) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    
    const text = replyText.trim();
    setReplyText('');
    setReplyingTo(null);

    await supabase.from('messages').insert({
      sender_id: userProfile.id,
      receiver_id: partnerProfile.id,
      content: text,
      reply_to_id: momentId,
    });
    // Có thể thêm Toast báo thành công ở đây
  };

  if (authLoading || loading) {
    return <div className="flex h-screen items-center justify-center bg-gray-50"><Loader2 className="w-8 h-8 animate-spin text-pink-400" /></div>;
  }

  return (
    <main className="flex flex-col min-h-[100dvh] bg-gradient-to-br from-gray-50 to-pink-50/30 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-sm">
        <Link href="/" className="p-2 -ml-2 text-gray-500 hover:text-pink-600 transition-colors">
          <ArrowLeft size={24} />
        </Link>
        
        <div className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-full">
          <button 
            onClick={() => setTab('timeline')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${tab === 'timeline' ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Clock size={16} /> Dòng thời gian
          </button>
          <button 
            onClick={() => setTab('gallery')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${tab === 'gallery' ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Grid size={16} /> Kho ảnh
          </button>
        </div>
        
        <div className="w-8"></div> {/* Spacer for centering */}
      </header>

      {/* Content */}
      <div className="flex-1 w-full max-w-lg mx-auto">
        {tab === 'timeline' ? (
          <div className="flex flex-col gap-6 py-6 px-4">
            {moments.map((moment) => (
              <div key={moment.id} className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img 
                      src={moment.sender_id === userProfile.id ? userProfile.avatar_url : partnerProfile.avatar_url} 
                      className="w-8 h-8 rounded-full object-cover border border-gray-100" 
                    />
                    <div>
                      <p className="text-sm font-bold text-gray-800">{moment.sender_id === userProfile.id ? 'Bạn' : partnerProfile.display_name}</p>
                      <p className="text-[10px] text-gray-400 font-medium">{new Date(moment.created_at).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}</p>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <button 
                      onClick={() => setShowMenuFor(showMenuFor === moment.id ? null : moment.id)}
                      className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-50"
                    >
                      <MoreHorizontal size={20} />
                    </button>
                    
                    {showMenuFor === moment.id && (
                      <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20 animate-in fade-in zoom-in-95">
                        <button 
                          onClick={() => handleDownload(moment.image_url)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Download size={16} /> Tải xuống
                        </button>
                        {moment.sender_id === userProfile.id && (
                          <button 
                            onClick={() => handleDelete(moment.id)}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <Trash size={16} /> Xóa ảnh
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Photo */}
                <div className="relative w-full aspect-[3/4] bg-gray-900">
                  <img src={moment.image_url} alt="Locket" className="w-full h-full object-cover" />
                  
                  {/* Reactions Floating */}
                  {moment.reactions && Object.values(moment.reactions).length > 0 && (
                    <div className="absolute bottom-4 right-4 flex -space-x-2">
                      {Object.entries(moment.reactions).map(([uid, emoji]: any) => (
                        <div key={uid} className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg border border-white text-lg animate-in zoom-in">
                          {emoji}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer (Caption & Actions) */}
                <div className="p-4 flex flex-col gap-3">
                  {moment.content && moment.content !== '📸 Vừa chia sẻ một khoảnh khắc' && (
                    <p className="text-sm font-medium text-gray-800 break-words">
                      <span className="font-bold mr-2">{moment.sender_id === userProfile.id ? 'Bạn' : partnerProfile.display_name}</span>
                      {moment.content}
                    </p>
                  )}

                  <div className="flex gap-2">
                    {moment.sender_id === partnerProfile.id && (
                      <button 
                        onClick={() => setShowEmojisFor(showEmojisFor === moment.id ? null : moment.id)}
                        className="flex-1 bg-gray-50 hover:bg-pink-50 text-gray-600 hover:text-pink-600 font-semibold py-2 rounded-xl transition flex items-center justify-center gap-2 text-sm"
                      >
                        <Heart size={18} /> Thả tim
                      </button>
                    )}
                    <button 
                      onClick={() => setReplyingTo(replyingTo === moment.id ? null : moment.id)}
                      className={`${moment.sender_id === userProfile.id ? 'w-full' : 'flex-1'} bg-gray-50 hover:bg-teal-50 text-gray-600 hover:text-teal-600 font-semibold py-2 rounded-xl transition flex items-center justify-center gap-2 text-sm`}
                    >
                      <Send size={18} /> Gửi tin nhắn
                    </button>
                  </div>

                  {/* Reaction Popup */}
                  {showEmojisFor === moment.id && (
                    <div className="flex justify-between bg-white shadow-xl border border-gray-100 rounded-full px-4 py-3 animate-in slide-in-from-bottom-2">
                      {EMOJIS.map(emoji => (
                        <button 
                          key={emoji} 
                          onClick={() => handleReact(moment.id, emoji)}
                          className="text-2xl hover:scale-125 transition-transform active:scale-95"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Reply Input */}
                  {replyingTo === moment.id && (
                    <form onSubmit={(e) => handleReply(e, moment.id)} className="flex items-center gap-2 mt-2">
                      <input 
                        type="text"
                        autoFocus
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        placeholder="Trả lời vào khung chat..."
                        className="flex-1 bg-gray-100 border-none rounded-full px-4 py-2.5 text-sm focus:ring-2 focus:ring-pink-300 outline-none"
                      />
                      <button type="submit" disabled={!replyText.trim()} className="bg-pink-500 text-white w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-50">
                        <Send size={16} className="-ml-0.5" />
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ))}

            {/* Infinite Scroll Target */}
            <div ref={observerTarget} className="w-full py-4 flex justify-center">
              {loadingMore ? <Loader2 className="animate-spin text-pink-300" /> : !hasMore && moments.length > 0 ? <p className="text-gray-400 text-sm">Hết ảnh rồi nhé 💕</p> : null}
            </div>
            
            {moments.length === 0 && !loading && (
              <div className="text-center py-20 text-gray-400">
                Chưa có khoảnh khắc nào. Hãy gửi ảnh Locket ngay!
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1 p-1">
            {moments.map((moment) => (
              <div key={moment.id} className="aspect-square bg-gray-200 cursor-pointer hover:opacity-90 relative">
                <img src={moment.image_url} alt="Gallery" className="w-full h-full object-cover" />
                {moment.content && moment.content !== '📸 Vừa chia sẻ một khoảnh khắc' && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2 opacity-0 hover:opacity-100 transition-opacity">
                    <p className="text-white text-[10px] line-clamp-2">{moment.content}</p>
                  </div>
                )}
              </div>
            ))}
            
            {/* Infinite Scroll Target cho Grid */}
            <div ref={observerTarget} className="col-span-3 py-4 flex justify-center">
              {loadingMore ? <Loader2 className="animate-spin text-pink-300" /> : null}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
