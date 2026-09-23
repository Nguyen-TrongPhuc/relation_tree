const fs = require('fs');
const content = \'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getMessages, sendMessage, updateChatBackground } from '@/app/actions/chat';
import { Send, ArrowLeft, Phone, Video, Info, UserPen, Palette, Search, Image as ImageIcon, X, Paperclip, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface ChatWidgetProps {
  onClose?: () => void;
  isPartnerOnline?: boolean;
  partnerProfile?: any;
  chatBackgroundUrl?: string;
}

function formatLastActive(dateStr?: string) {
  if (!dateStr) return 'Đang vắng mặt ';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Vừa mới truy cập';
  if (diffMins < 60) return \\\Hoạt động \\\ phút trước\\\;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return \\\Hoạt động \\\ giờ trước\\\;
  const diffDays = Math.floor(diffHours / 24);
  return \\\Hoạt động \\\ ngày trước\\\;
}

export default function ChatWidget({ onClose, isPartnerOnline: externalIsOnline, partnerProfile, chatBackgroundUrl: initialBgUrl }: ChatWidgetProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [realIsPartnerOnline, setRealIsPartnerOnline] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  
  // Search state
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Background state
  const [chatBackgroundUrl, setChatBackgroundUrl] = useState(initialBgUrl || '');
  const [isUploadingBg, setIsUploadingBg] = useState(false);
  const bgInputRef = useRef<HTMLInputElement>(null);
  
  // Attachment state
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);
  const attachInputRef = useRef<HTMLInputElement>(null);

  const [livePartnerProfile, setLivePartnerProfile] = useState(partnerProfile);
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchInitial = async () => {
      const res = await getMessages();
      setMessages(res.messages || []);
      setCurrentUserId(res.userId || null);
      setLoading(false);
      scrollToBottom();

      if (partnerProfile?.id) {
        const { data } = await supabase.from('profiles').select('*').eq('id', partnerProfile.id).single();
        if (data) setLivePartnerProfile(data);
      }
    };
    fetchInitial();

    const channel = supabase
      .channel('public:messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          const res = await getMessages();
          setMessages(res.messages || []);
          setTimeout(scrollToBottom, 100);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  useEffect(() => {
    if (!currentUserId || !livePartnerProfile?.id) return;
    const updateLastActive = async () => {
      await supabase.from('profiles').update({ last_active: new Date().toISOString() }).eq('id', currentUserId);
    };
    updateLastActive();
    const activeInterval = setInterval(updateLastActive, 180000);

    const room = supabase.channel('couple_room');
    room.on('presence', { event: 'sync' }, () => {
      const state = room.presenceState();
      const partnerIsHere = Object.values(state).some(
        presences => presences.some((p: any) => p.user_id === livePartnerProfile.id)
      );
      setRealIsPartnerOnline(partnerIsHere);
    }).subscribe(async (status) => {
      if (status === 'SUBSCRIBED') await room.track({ user_id: currentUserId });
    });

    return () => {
      clearInterval(activeInterval);
      supabase.removeChannel(room);
    };
  }, [currentUserId, livePartnerProfile, supabase]);

  const isPartnerOnline = externalIsOnline !== undefined ? externalIsOnline : realIsPartnerOnline;

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    setIsUploadingBg(true);
    
    const fileExt = file.name.split('.').pop();
    const fileName = \\\g-\\\-\\\.\\\\\\;
    
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      alert('Lỗi tải hình nền: ' + uploadError.message);
      setIsUploadingBg(false);
      return;
    }
    
    const { data: bgUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
    const newUrl = bgUrlData.publicUrl;
    
    setChatBackgroundUrl(newUrl);
    await updateChatBackground(newUrl);
    setIsUploadingBg(false);
  };

  const handleAttachChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachment(e.target.files[0]);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() && !attachment) return;
    
    setIsSending(true);
    const text = inputValue.trim();
    setInputValue('');
    let uploadedImageUrl = '';
    
    if (attachment) {
      const fileExt = attachment.name.split('.').pop();
      const fileName = \\\chat-\\\-\\\.\\\\\\;
      const { error } = await supabase.storage.from('avatars').upload(fileName, attachment, { upsert: true });
      if (!error) {
        const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
        uploadedImageUrl = data.publicUrl;
      }
      setAttachment(null);
    }
    
    const res = await sendMessage(text, uploadedImageUrl);
    if (!res.success) {
      alert('Lỗi gửi tin nhắn: ' + (res.error || 'Unknown error'));
    }
    setIsSending(false);
    scrollToBottom();
  };

  const displayedMessages = isSearching && searchQuery.trim() 
    ? messages.filter(m => m.content?.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  return (
    <div className="flex h-full w-full bg-white relative">
      {/* MAIN CHAT AREA */}
      <div className="flex-1 flex flex-col min-w-0 relative h-full">
        {/* Header */}
        <div className="flex flex-col border-b border-teal-100 bg-white/90 backdrop-blur-md shadow-sm z-20">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              {!onClose && (
                <Link href="/" className="text-teal-600 hover:bg-teal-50 p-2 rounded-full transition-colors mr-1">
                  <ArrowLeft size={20} />
                </Link>
              )}
              <img 
                src={livePartnerProfile?.avatar_url || \\\https://api.dicebear.com/7.x/adventurer/svg?seed=\\\\\\} 
                className="w-10 h-10 rounded-full object-cover border border-teal-100 shadow-sm" 
                alt="Partner Avatar"
              />
              <div>
                <h3 className="font-bold text-gray-800">{livePartnerProfile?.display_name || 'Người ấy'}</h3>
                <p className="text-[10px] text-teal-600 font-medium">
                  {isPartnerOnline ? 'Đang trực tuyến 🟢' : formatLastActive(livePartnerProfile?.last_active)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-teal-600">
              <button className="p-2 hover:bg-teal-50 rounded-full transition-colors"><Phone size={20} /></button>
              <button className="p-2 hover:bg-teal-50 rounded-full transition-colors"><Video size={20} /></button>
              <button onClick={() => setIsInfoOpen(!isInfoOpen)} className={\\\p-2 rounded-full transition-colors \\\\\\}>
                <Info size={20} />
              </button>
            </div>
          </div>
          
          {/* Search Bar */}
          {isSearching && (
            <div className="px-4 pb-3 flex items-center gap-2 animate-in slide-in-from-top-2">
              <div className="flex-1 relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  autoFocus
                  type="text" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm trong đoạn chat..." 
                  className="w-full pl-9 pr-4 py-1.5 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-teal-400"
                />
              </div>
              <button onClick={() => { setIsSearching(false); setSearchQuery(''); }} className="text-gray-500 hover:text-gray-700 p-1">
                <X size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Message List */}
        <div 
          ref={scrollRef}
          className={\\\lex-1 overflow-y-auto p-4 space-y-4 relative \\\\\\}
          style={{ 
            scrollBehavior: 'smooth',
            ...(chatBackgroundUrl ? {
              backgroundImage: \\\url(\\\)\\\,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            } : {})
          }}
        >
          <div className="relative z-10 space-y-4">
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm text-teal-600">
              Đang tải tin nhắn...
            </div>
          ) : displayedMessages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-sm text-teal-600/70 py-20 bg-white/50 backdrop-blur-sm rounded-2xl">
              <p>{isSearching ? 'Không tìm thấy kết quả nào.' : 'Chưa có tin nhắn nào.'}</p>
              {!isSearching && <p className="mt-1">Hãy gửi lời chào đến người ấy nhé! 💕</p>}
            </div>
          ) : (
            displayedMessages.map((msg) => {
              const isMe = msg.sender_id === currentUserId;
              const profile = Array.isArray(msg.profiles) ? msg.profiles[0] : msg.profiles;
              const avatarUrl = profile?.avatar_url || \\\https://api.dicebear.com/7.x/adventurer/svg?seed=\\\\\\;

              return (
                <div key={msg.id} className={\\\lex w-full gap-2 \\\\\\}>
                  {!isMe && (
                    <img src={avatarUrl} alt="avatar" className="w-8 h-8 rounded-full border border-teal-100 shadow-sm flex-shrink-0 object-cover mt-auto mb-1" />
                  )}
                  <div className={\\\max-w-[75%] rounded-2xl px-4 py-2 shadow-sm flex flex-col \\\\\\}>
                    {msg.image_url && (
                      <img src={msg.image_url} alt="attachment" className="rounded-xl mb-2 max-w-full h-auto max-h-64 object-contain bg-black/5" />
                    )}
                    {msg.content && <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>}
                    <p className={\\\mt-1 text-[9px] \\\\\\}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          </div>
        </div>

        {/* Attachment Preview */}
        {attachment && (
          <div className="px-4 py-2 bg-gray-50 border-t border-teal-100 flex items-center justify-between z-20">
            <div className="flex items-center gap-2 text-sm text-teal-700">
              <ImageIcon size={16} />
              <span className="truncate max-w-[200px]">{attachment.name}</span>
            </div>
            <button onClick={() => setAttachment(null)} className="text-gray-400 hover:text-red-500">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-teal-100 bg-white p-3 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] z-20">
          <input type="file" accept="image/*" className="hidden" ref={attachInputRef} onChange={handleAttachChange} />
          <button 
            type="button"
            onClick={() => attachInputRef.current?.click()}
            className="p-2 text-teal-600 hover:bg-teal-50 rounded-full transition-colors"
          >
            <ImageIcon size={20} />
          </button>
          
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Nhắn gì đi..."
            className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-700 focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400 transition-colors"
          />
          <button 
            type="submit"
            disabled={(!inputValue.trim() && !attachment) || isSending}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-teal-400 to-cyan-500 text-white transition-transform hover:scale-110 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
          >
            {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="-ml-0.5" />}
          </button>
        </form>
      </div>

      {/* RIGHT SIDEBAR (INFO PANEL) */}
      {isInfoOpen && (
        <div className="w-80 border-l border-teal-100 bg-white flex flex-col flex-shrink-0 z-20 shadow-[-4px_0_15px_rgba(0,0,0,0.02)] overflow-y-auto">
          <div className="flex flex-col items-center py-8 px-4 border-b border-gray-50">
            <div className="relative">
              <img 
                src={livePartnerProfile?.avatar_url || \\\https://api.dicebear.com/7.x/adventurer/svg?seed=\\\\\\} 
                alt="Partner Avatar" 
                className="w-24 h-24 rounded-full border-4 border-white shadow-md object-cover"
              />
              {isPartnerOnline && (
                <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></span>
              )}
            </div>
            <h3 className="mt-4 font-bold text-gray-800 text-xl">{livePartnerProfile?.display_name || 'Người ấy'}</h3>
          </div>
          
          <div className="flex-1 p-2 space-y-1">
            <div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-2">Tùy chỉnh đoạn chat</div>
            
            <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-teal-50 text-gray-700 transition-colors group">
              <div className="flex items-center gap-3">
                <UserPen size={18} className="text-teal-600" />
                <span className="font-medium text-sm">Đổi biệt danh</span>
              </div>
            </button>

            <input type="file" accept="image/*" className="hidden" ref={bgInputRef} onChange={handleBgUpload} />
            <button onClick={() => bgInputRef.current?.click()} disabled={isUploadingBg} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-teal-50 text-gray-700 transition-colors group disabled:opacity-50">
              <div className="flex items-center gap-3">
                {isUploadingBg ? <Loader2 size={18} className="text-pink-500 animate-spin" /> : <Palette size={18} className="text-pink-500" />}
                <span className="font-medium text-sm">{isUploadingBg ? 'Đang tải...' : 'Đổi hình nền chat'}</span>
              </div>
            </button>

            <button onClick={() => setIsSearching(!isSearching)} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-teal-50 text-gray-700 transition-colors group">
              <div className="flex items-center gap-3">
                <Search size={18} className="text-gray-500" />
                <span className="font-medium text-sm">Tìm kiếm tin nhắn</span>
              </div>
            </button>
            
            <div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-4">File phương tiện</div>
            
            <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-teal-50 text-gray-700 transition-colors group">
              <div className="flex items-center gap-3">
                <ImageIcon size={18} className="text-blue-500" />
                <span className="font-medium text-sm">Ảnh, file & liên kết</span>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
\;

fs.writeFileSync('src/components/chat/ChatWidget.tsx', content, 'utf8');
