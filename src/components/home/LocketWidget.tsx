'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Camera, Smile, Loader2, Send, Clock, Grid } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import PreviewModal from '../locket/PreviewModal';
import Link from 'next/link';

const EMOJIS = ['❤️', '😂', '😮', '😢', '😍', '🔥'];

export default function LocketWidget({ userProfile, partnerProfile }: { userProfile: any, partnerProfile: any }) {
  const [moments, setMoments] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const [isSendingReply, setIsSendingReply] = useState(false);
  
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchMoments();

    const channel = supabase.channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: 'is_moment=eq.true' }, () => {
        fetchMoments();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, () => {
        fetchMoments();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchMoments = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .in('sender_id', [userProfile.id, partnerProfile.id])
      .eq('is_moment', true)
      .order('created_at', { ascending: false })
      .limit(10);
    
    setMoments(data || []);
    setLoading(false);
  };

  const handleSendMoment = async (imageUrl: string, caption: string) => {
    await supabase.from('messages').insert({
      sender_id: userProfile.id,
      receiver_id: partnerProfile.id,
      content: caption.trim() || '📸 Vừa chia sẻ một khoảnh khắc',
      image_url: imageUrl,
      is_moment: true,
    });
    setPhotoFile(null);
    setCurrentIndex(0);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  };

  const handleReact = async (emoji: string) => {
    const currentMoment = moments[currentIndex];
    if (!currentMoment) return;
    
    setShowEmojis(false);
    const currentReactions = currentMoment.reactions || {};
    const newReactions = { ...currentReactions, [userProfile.id]: emoji };
    
    // Optimistic UI
    const updatedMoments = [...moments];
    updatedMoments[currentIndex] = { ...currentMoment, reactions: newReactions };
    setMoments(updatedMoments);

    await supabase.from('messages').update({ reactions: newReactions }).eq('id', currentMoment.id);
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentMoment = moments[currentIndex];
    if (!replyText.trim() || !currentMoment) return;
    
    setIsSendingReply(true);
    const text = replyText.trim();
    setReplyText('');

    await supabase.from('messages').insert({
      sender_id: userProfile.id,
      receiver_id: partnerProfile.id,
      content: text,
      reply_to_id: currentMoment.id,
    });

    setIsSendingReply(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setIsPreviewOpen(true);
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const scrollPosition = container.scrollLeft;
    const width = container.clientWidth;
    // Calculate index based on scroll position (round to nearest integer)
    const newIndex = Math.round(scrollPosition / width);
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < moments.length) {
      setCurrentIndex(newIndex);
    }
  };

  const currentMoment = moments[currentIndex];

  return (
    <div className="w-full flex flex-col items-center gap-4">
      {/* Header Buttons */}
      <div className="w-full max-w-[320px] flex justify-between px-2">
        <Link href="/locket?tab=timeline" className="flex items-center gap-1.5 text-pink-700 bg-pink-100/50 hover:bg-pink-100 px-3 py-1.5 rounded-full text-xs font-semibold transition">
          <Clock size={14} /> Dòng thời gian
        </Link>
        <Link href="/locket?tab=gallery" className="flex items-center gap-1.5 text-pink-700 bg-pink-100/50 hover:bg-pink-100 px-3 py-1.5 rounded-full text-xs font-semibold transition">
          <Grid size={14} /> Kho ảnh
        </Link>
      </div>

      <input 
        type="file" 
        accept="image/*" 
        capture="user" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
      />

      <div className="relative w-full aspect-square max-w-[320px] bg-gradient-to-br from-gray-800 to-gray-900 rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] ring-4 ring-white/50 border border-white/20 group overflow-hidden">
        {loading ? (
          <div className="flex h-full w-full items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-pink-300" />
          </div>
        ) : moments.length > 0 ? (
          <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex h-full w-full overflow-x-auto snap-x snap-mandatory hide-scrollbar"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {moments.map((moment, idx) => (
              <div key={moment.id} className="min-w-full h-full flex-shrink-0 snap-center relative">
                <img src={moment.image_url} alt="Moment" className="w-full h-full object-cover" />
                
                {/* Header info */}
                <div className="absolute top-4 left-4 right-4 flex justify-between items-center drop-shadow-md z-10 pointer-events-none">
                  <div className="flex items-center gap-2 bg-black/40 backdrop-blur-xl px-3 py-1.5 rounded-full border border-white/10 shadow-lg">
                    <img 
                      src={moment.sender_id === userProfile.id ? userProfile.avatar_url : partnerProfile.avatar_url} 
                      className="w-5 h-5 rounded-full object-cover" 
                    />
                    <span className="text-white text-xs font-medium">
                      {moment.sender_id === userProfile.id ? 'Bạn' : partnerProfile.display_name}
                    </span>
                  </div>
                  <span className="text-white text-[10px] bg-black/40 backdrop-blur-xl px-3 py-1.5 rounded-full border border-white/10 shadow-lg font-bold tracking-wide">
                    {new Date(moment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Caption */}
                {moment.content && moment.content !== '📸 Vừa chia sẻ một khoảnh khắc' && (
                  <div className="absolute bottom-16 left-0 right-0 px-4 text-center z-10 pointer-events-none">
                    <span className="bg-black/50 backdrop-blur-md text-white px-4 py-2 rounded-2xl text-sm font-medium inline-block shadow-lg">
                      {moment.content}
                    </span>
                  </div>
                )}

                {/* Reactions display */}
                {moment.reactions && Object.values(moment.reactions).length > 0 && (
                  <div className="absolute bottom-4 right-4 flex -space-x-2 z-10 pointer-events-none">
                    {Object.entries(moment.reactions).map(([uid, emoji]: any) => (
                      <div key={uid} className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-md border border-gray-100 text-sm animate-in zoom-in">
                        {emoji}
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Camera trigger overlay (nhấp vào vùng trống để chụp ảnh mới) */}
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 w-full h-full opacity-0 hover:opacity-100 bg-black/20 transition-opacity flex items-center justify-center z-20"
                >
                  <div className="bg-white/90 p-4 rounded-full shadow-lg backdrop-blur-sm">
                    <Camera className="text-pink-600" size={32} />
                  </div>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 gap-4"
          >
            <div className="w-20 h-20 rounded-full bg-white shadow-md flex items-center justify-center border border-pink-100">
              <Camera className="text-pink-400" size={40} />
            </div>
            <p className="text-white/80 font-medium text-sm drop-shadow-md">Chạm để gửi khoảnh khắc</p>
          </button>
        )}

        {/* Dots Indicator */}
        {moments.length > 1 && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 z-30 pointer-events-none">
            {moments.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all ${i === currentIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`} />
            ))}
          </div>
        )}
      </div>

      {/* Style hide-scrollbar */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}} />

      {/* Reply and React Box */}
      {currentMoment && currentMoment.sender_id === partnerProfile.id && (
        <div className="w-full max-w-[320px] bg-white rounded-full shadow-md border border-pink-50 flex items-center p-1.5 relative">
          <button 
            type="button"
            onClick={() => setShowEmojis(!showEmojis)}
            className="w-10 h-10 rounded-full hover:bg-pink-50 flex items-center justify-center text-pink-500 transition-colors"
          >
            <Smile size={20} />
          </button>
          
          <form onSubmit={handleReply} className="flex-1 flex items-center">
            <input 
              type="text" 
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder="Trả lời khoảnh khắc này..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-2 text-gray-700"
            />
            <button 
              type="submit"
              disabled={!replyText.trim() || isSendingReply}
              className="w-10 h-10 rounded-full bg-pink-500 text-white flex items-center justify-center disabled:opacity-50 disabled:bg-gray-300"
            >
              {isSendingReply ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </form>

          {/* Emoji Popup */}
          {showEmojis && (
            <div className="absolute bottom-[110%] left-0 bg-white shadow-xl rounded-full px-4 py-2 flex gap-3 border border-gray-100 animate-in slide-in-from-bottom-2 z-40">
              {EMOJIS.map(emoji => (
                <button 
                  key={emoji} 
                  onClick={() => handleReact(emoji)}
                  className="text-2xl hover:scale-125 transition-transform active:scale-95"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <PreviewModal 
        isOpen={isPreviewOpen} 
        onClose={() => {
          setIsPreviewOpen(false);
          setPhotoFile(null);
        }} 
        onSend={handleSendMoment}
        userId={userProfile.id}
        photoFile={photoFile}
      />
    </div>
  );
}
