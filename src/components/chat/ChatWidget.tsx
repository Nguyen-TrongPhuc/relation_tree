'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getMessages, sendMessage, updateChatBackground, updateMessageContent } from '@/app/actions/chat';
import { Send, ArrowLeft, Phone, Video, Info, UserPen, Palette, Search, Image as ImageIcon, X, Paperclip, Loader2 } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const CallScreen = dynamic(() => import('./CallScreen'), { ssr: false });

interface ChatWidgetProps {
  onClose?: () => void;
  isPartnerOnline?: boolean;
  partnerProfile?: any;
  chatBackgroundUrl?: string;
}

function formatLastActive(dateStr?: string) {
  if (!dateStr) return 'Đang vắng mặt ⚪';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Vừa mới truy cập';
  if (diffMins < 60) return `Vắng mặt ${diffMins} phút`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Vắng mặt ${diffHours} giờ`;
  const diffDays = Math.floor(diffHours / 24);
  return `Vắng mặt ${diffDays} ngày`;
}

function MessageStatus({ msg, isPartnerOnline, partnerLastActive }: { msg: any, isPartnerOnline: boolean, partnerLastActive: string | undefined }) {
  const [timePassed, setTimePassed] = useState(false);

  useEffect(() => {
    if (msg.id > 0) {
      // T�nh to�n kho?ng th?i gian �? tr�i qua
      const sentTime = new Date(msg.created_at).getTime();
      const diff = Date.now() - sentTime;
      
      if (diff >= 2000) {
        setTimePassed(true);
      } else {
        const timer = setTimeout(() => setTimePassed(true), 2000 - diff);
        return () => clearTimeout(timer);
      }
    }
  }, [msg.id, msg.created_at]);

  let statusText = '';
  let showIcon = false;

  if (msg.id < 0) {
    statusText = '�ang g?i...';
    showIcon = true;
  } else {
    const sentTime = new Date(msg.created_at).getTime();
    const lastActive = partnerLastActive ? new Date(partnerLastActive).getTime() : 0;

    if (isPartnerOnline || lastActive > sentTime) {
      statusText = '�? xem';
    } else if (timePassed) {
      statusText = '�? nh?n';
    } else {
      statusText = '�? g?i';
    }
  }

  return (
    <div className="text-[11px] font-medium text-pink-700/60 mt-1 mr-1 flex items-center gap-1">
      {showIcon && <Loader2 size={10} className="animate-spin" />}
      <span>{statusText}</span>
    </div>
  );
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
  const [callMode, setCallMode] = useState<'audio' | 'video' | null>(null);
  const [callState, setCallState] = useState<'ringing' | 'connected' | null>(null);
  const [activeCallId, setActiveCallId] = useState<number | null>(null);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [incomingCall, setIncomingCall] = useState<{ msgId: number; roomId: string; mode: 'audio' | 'video' } | null>(null);
  
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
          const newMsg = payload.new as any;
          
          // Gắn profile cục bộ thay vì gọi getMessages() (bỏ qua Server Action)
          let profile = null;
          if (newMsg.sender_id === currentUserId) {
            profile = { display_name: 'Bạn', avatar_url: null };
          } else {
            profile = { display_name: partnerProfile?.display_name || 'Người ấy', avatar_url: partnerProfile?.avatar_url || null };
          }
          newMsg.profiles = profile;

          setMessages(prev => {
            // Xóa tin nhắn ảo (optimistic) có cùng nội dung (id âm)
            const filtered = prev.filter(m => !(m.id < 0 && m.content === newMsg.content));
            if (filtered.some(m => m.id === newMsg.id)) return filtered;
            return [...filtered, newMsg];
          });
          setTimeout(scrollToBottom, 100);

          // Phát hiện cuộc gọi đến: tin nhắn CALL::RINGING từ người khác
          if (newMsg.content?.startsWith('CALL::') && newMsg.content.includes('::RINGING::') && newMsg.sender_id !== currentUserId) {
            const parts = newMsg.content.split('::');
            const roomId = parts[1];
            const mode = parts[3] as 'audio' | 'video';
            setIncomingCall({ msgId: newMsg.id, roomId, mode });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        async (payload) => {
          const updatedMsg = payload.new as any;
          setMessages((prev) => prev.map(m => m.id === updatedMsg.id ? { ...m, content: updatedMsg.content } : m));
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
    const fileName = `bg-${currentUserId}-${Date.now()}.${fileExt}`;
    
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

  const startCall = async (mode: 'audio' | 'video') => {
    // ZegoCloud chỉ cho phép chữ, số, gạch dưới trong Room ID - phải xóa dấu gạch ngang của UUID
    const safeUserId = currentUserId!.replace(/-/g, '');
    const roomId = `${safeUserId}_${Date.now()}`;
    const textMsg = `CALL::${roomId}::RINGING::${mode}`;
    
    const { data: insertedMsg, error } = await supabase.from('messages').insert({ 
      sender_id: currentUserId, 
      receiver_id: livePartnerProfile!.id, 
      content: textMsg 
    }).select('*').single();
    
    if (!error && insertedMsg) {
      const res = { message: insertedMsg };
      setCallMode(mode);
      setCallState('ringing'); // Chỉ đổ chuông, CHƯA mở ZegoCloud
      setActiveCallId(res.message.id);
      setActiveRoomId(roomId);
    }
  };

  const handleJoinCall = async (msgId: number, roomId: string, mode: 'audio' | 'video') => {
    setCallMode(mode);
    setCallState('connected');
    setActiveCallId(msgId);
    setActiveRoomId(roomId);
    setIncomingCall(null); // Tắt popup cuộc gọi đến
    await supabase.from('messages').update({ content: `CALL::${roomId}::ACCEPTED::${mode}` }).eq('id', msgId);
  };

  const handleRejectCall = async (msgId: number, roomId: string, mode: 'audio' | 'video') => {
    setIncomingCall(null);
    await supabase.from('messages').update({ content: `CALL::${roomId}::REJECTED::${mode}` }).eq('id', msgId);
  };

  // Lắng nghe thay đổi tin nhắn để đồng bộ trạng thái cuộc gọi
  useEffect(() => {
    if (activeCallId) {
      const currentMsg = messages.find(m => m.id === activeCallId);
      if (currentMsg) {
        const parts = currentMsg.content.split('::');
        if (parts.length >= 4) {
          const status = parts[2];
          
          if (status === 'ACCEPTED' && callState === 'ringing') {
            setCallState('connected');
          }
          
          if (status === 'ENDED' || status === 'MISSED' || status === 'REJECTED') {
            setCallMode(null);
            setCallState(null);
            setActiveCallId(null);
            setActiveRoomId(null);
          }
        }
      }
    }

    // Tự động tắt popup cuộc gọi đến nếu tin nhắn không còn là RINGING (đã Hủy/Từ chối/Bắt máy)
    if (incomingCall) {
      const incMsg = messages.find(m => m.id === incomingCall.msgId);
      if (incMsg && !incMsg.content.includes('::RINGING::')) {
        setIncomingCall(null);
      }
    }
  }, [messages, activeCallId, callState, incomingCall]);

  const handleLeaveCall = async () => {
    if (activeCallId && activeRoomId && callMode) {
      const currentMsg = messages.find(m => m.id === activeCallId);
      const isRinging = currentMsg?.content.includes('::RINGING::');
      const newStatus = isRinging ? 'MISSED' : 'ENDED';
      await supabase.from('messages').update({ content: `CALL::${activeRoomId}::${newStatus}::${callMode}` }).eq('id', activeCallId);
    }
    setCallMode(null);
    setCallState(null);
    setActiveCallId(null);
    setActiveRoomId(null);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() && !attachment) return;
    
    const text = inputValue.trim();
    setInputValue('');
    let uploadedImageUrl = '';
    
    // 1. Optimistic UI: Hiển thị ngay lập tức trên màn hình
    const tempId = -Date.now();
    if (!attachment) {
      const tempMsg = {
        id: tempId,
        sender_id: currentUserId,
        receiver_id: livePartnerProfile!.id,
        content: text,
        image_url: null,
        created_at: new Date().toISOString(),
        profiles: { display_name: 'Bạn', avatar_url: null }
      };
      setMessages(prev => [...prev, tempMsg as any]);
      setTimeout(scrollToBottom, 50);
    }

    setIsSending(true);

    if (attachment) {
      const fileExt = attachment.name.split('.').pop();
      const fileName = `chat-${currentUserId}-${Date.now()}.${fileExt}`;
      const { error } = await supabase.storage.from('avatars').upload(fileName, attachment, { upsert: true });
      if (!error) {
        const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
        uploadedImageUrl = data.publicUrl;
      }
      setAttachment(null);
    }
    
    const { error } = await supabase.from('messages').insert({ 
      sender_id: currentUserId, 
      receiver_id: livePartnerProfile!.id, 
      content: text, 
      image_url: uploadedImageUrl || null 
    });
    
    if (error) {
      alert('Lỗi gửi tin nhắn: ' + error.message);
      setMessages(prev => prev.filter(m => m.id !== tempId)); // Xóa tin nhắn ảo nếu lỗi
    }
    setIsSending(false);
    scrollToBottom();
  };

  const displayedMessages = isSearching && searchQuery.trim() 
    ? messages.filter(m => m.content?.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  return (
    <>
      {/* Màn hình chờ đổ chuông (người gọi đang đợi người kia bắt máy) */}
      {callState === 'ringing' && (
        <div className="fixed inset-0 z-[1000] bg-gradient-to-b from-pink-800 to-pink-950 flex flex-col items-center justify-center text-white">
          <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center mb-6 animate-pulse">
            {callMode === 'video' ? <Video size={40} /> : <Phone size={40} />}
          </div>
          <h2 className="text-2xl font-bold mb-2">{livePartnerProfile?.display_name || 'Người ấy'}</h2>
          <p className="text-pink-200 text-lg mb-12 animate-pulse">Đang đổ chuông...</p>
          <button 
            onClick={handleLeaveCall}
            className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors active:scale-95"
          >
            <Phone size={28} className="rotate-[135deg]" />
          </button>
          <p className="text-pink-300 text-sm mt-3">Hủy cuộc gọi</p>
        </div>
      )}

      {/* 📞 POPUP CUỘC GỌI ĐẾN (hiện khi có người gọi) */}
      {incomingCall && !callState && (
        <div className="fixed inset-0 z-[999] bg-gradient-to-b from-pink-700 to-pink-950 flex flex-col items-center justify-center text-white">
          <img 
            src={livePartnerProfile?.avatar_url || '/default-avatar.png'}
            alt="Caller"
            className="w-28 h-28 rounded-full border-4 border-white/30 shadow-xl mb-6 object-cover"
          />
          <h2 className="text-2xl font-bold mb-2">{livePartnerProfile?.display_name || 'Người ấy'}</h2>
          <p className="text-pink-200 text-lg mb-12 animate-pulse">
            Cuộc gọi {incomingCall.mode === 'video' ? 'Video' : 'Thoại'} đến...
          </p>
          <div className="flex gap-12">
            {/* Nút Từ chối */}
            <div className="flex flex-col items-center">
              <button 
                onClick={() => handleRejectCall(incomingCall.msgId, incomingCall.roomId, incomingCall.mode)}
                className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors active:scale-95"
              >
                <Phone size={28} className="rotate-[135deg]" />
              </button>
              <p className="text-red-300 text-xs mt-2">Từ chối</p>
            </div>
            {/* Nút Nghe máy */}
            <div className="flex flex-col items-center">
              <button 
                onClick={() => handleJoinCall(incomingCall.msgId, incomingCall.roomId, incomingCall.mode)}
                className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center shadow-lg hover:bg-green-600 transition-colors active:scale-95"
              >
                <Phone size={28} />
              </button>
              <p className="text-green-300 text-xs mt-2">Nghe máy</p>
            </div>
          </div>
        </div>
      )}
      {/* Màn hình ZegoCloud (chỉ mở khi ĐÃ bắt máy) */}
      {callState === 'connected' && callMode && currentUserId && activeRoomId && (
        <CallScreen 
          roomName={activeRoomId}
          userId={currentUserId.replace(/-/g, '')}
          userName="Ban"
          isVideoCall={callMode === 'video'}
          onClose={handleLeaveCall} 
        />
      )}
      <div className="flex h-full w-full bg-white relative">
      {/* MAIN CHAT AREA */}
      <div className="flex-1 flex flex-col min-w-0 relative h-full">
        {/* Header */}
        <div className="flex flex-col border-b border-pink-100 bg-[#fdf2f8]/95 backdrop-blur-md shadow-sm z-20">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              {!onClose && (
                <Link href="/" className="text-pink-600 hover:bg-pink-50 p-2 rounded-full transition-colors mr-1">
                  <ArrowLeft size={20} />
                </Link>
              )}
              <img 
                src={livePartnerProfile?.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${livePartnerProfile?.id}`} 
                className="w-10 h-10 rounded-full object-cover border border-pink-100 shadow-sm" 
                alt="Partner Avatar"
              />
                <div>
                  <h3 className="font-bold text-gray-800">{livePartnerProfile?.display_name || 'Người ấy'}</h3>
                  <p className={`text-[11px] font-medium ${isPartnerOnline ? 'text-green-600' : 'text-gray-500'}`}>
                    {isPartnerOnline ? 'Đang trực tuyến 🟢' : formatLastActive(livePartnerProfile?.last_active)}
                  </p>
                </div>
            </div>
            <div className="flex items-center gap-1 text-pink-600">
              <button onClick={() => startCall('audio')} className="p-2 hover:bg-pink-50 rounded-full transition-colors"><Phone size={20} /></button>
              <button onClick={() => startCall('video')} className="p-2 hover:bg-pink-50 rounded-full transition-colors"><Video size={20} /></button>
              <button onClick={() => setIsInfoOpen(!isInfoOpen)} className={`p-2 rounded-full transition-colors ${isInfoOpen ? 'bg-pink-100' : 'hover:bg-pink-50'}`}>
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
                  className="w-full pl-9 pr-4 py-1.5 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-pink-400"
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
          className={`flex-1 overflow-y-auto p-4 space-y-4 relative ${!chatBackgroundUrl && 'bg-pink-50/30'}`}
          style={{ 
            scrollBehavior: 'smooth',
            ...(chatBackgroundUrl ? {
              backgroundImage: `url(${chatBackgroundUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            } : {})
          }}
        >
          <div className="relative z-10 space-y-4">
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm text-pink-600">
              Đang tải tin nhắn...
            </div>
          ) : displayedMessages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-sm text-pink-600/70 py-20 bg-white/50 backdrop-blur-sm rounded-2xl">
              <p>{isSearching ? 'Không tìm thấy kết quả nào.' : 'Chưa có tin nhắn nào.'}</p>
              {!isSearching && <p className="mt-1">Hãy gửi lời chào đến người ấy nhé! 💕</p>}
            </div>
          ) : (
            {(() => {
              let lastDateStr = '';
              return displayedMessages.map((msg, index) => {
                const msgDate = new Date(msg.created_at);
                const dateStr = msgDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
                
                let dateHeader = null;
                if (dateStr !== lastDateStr) {
                  const today = new Date();
                  const yesterday = new Date(today);
                  yesterday.setDate(yesterday.getDate() - 1);
                  
                  let displayDate = dateStr;
                  if (dateStr === today.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })) {
                    displayDate = 'Hôm nay';
                  } else if (dateStr === yesterday.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })) {
                    displayDate = 'Hôm qua';
                  }
                  
                  dateHeader = (
                    <div key={`date-${msg.id}`} className="flex justify-center my-6 w-full">
                      <span className="text-[11px] font-medium bg-black/10 text-gray-600 px-3 py-1 rounded-full backdrop-blur-md">
                        {displayDate}
                      </span>
                    </div>
                  );
                  lastDateStr = dateStr;
                }

                const isMe = msg.sender_id === currentUserId;
                const profile = Array.isArray(msg.profiles) ? msg.profiles[0] : msg.profiles;
                const avatarUrl = profile?.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${msg.sender_id}`;
                const isLastMessage = index === displayedMessages.length - 1;

                return (
                  <React.Fragment key={msg.id}>
                    {dateHeader}
                    <div className={`flex w-full gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                      {!isMe && (
                        <img src={avatarUrl} alt="avatar" className="w-8 h-8 rounded-full border border-teal-200 shadow-sm flex-shrink-0 object-cover mt-auto mb-1" />
                      )}
                      <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%]`}>
                        <div className={`p-3 shadow-sm whitespace-pre-wrap word-break flex flex-col relative group ${
                          isMe 
                            ? 'bg-pink-600 text-white rounded-tr-sm rounded-l-2xl rounded-br-2xl items-end' 
                            : 'bg-teal-50 text-teal-900 border border-teal-100 rounded-tl-sm rounded-r-2xl rounded-bl-2xl items-start'
                        }`}>
                          {msg.image_url && (
                            <img src={msg.image_url} alt="attachment" className="rounded-xl mb-2 max-w-full h-auto max-h-64 object-contain bg-black/5" />
                          )}
                          
                          {/* Check if this is a Call Invite */}
                          {msg.content?.startsWith('CALL::') ? (() => {
                            const parts = msg.content.split('::');
                            const roomId = parts[1];
                            const status = parts[2];
                            const mode = parts[3];
                            
                            const isRinging = status === 'RINGING';
                            const isExpiredRinging = isRinging && (Date.now() - new Date(msg.created_at).getTime() > 2 * 60 * 1000);
                            const displayStatus = isExpiredRinging ? 'MISSED' : status;
                          
                            let statusText = '';
                            let bgColor = isMe ? 'bg-pink-600' : 'bg-teal-50';
                            let textColor = isMe ? 'text-white' : 'text-teal-900';
                          
                            if (displayStatus === 'RINGING') {
                               statusText = isMe ? 'Đang gọi...' : `Cuộc gọi ${mode === 'video' ? 'Video' : 'Thoại'} đến`;
                            } else if (displayStatus === 'ACCEPTED') {
                               statusText = `Cuộc gọi ${mode === 'video' ? 'Video' : 'Thoại'} đang diễn ra`;
                            } else if (displayStatus === 'ENDED') {
                               statusText = `Cuộc gọi ${mode === 'video' ? 'Video' : 'Thoại'} đã kết thúc`;
                               bgColor = isMe ? 'bg-pink-700/50' : 'bg-gray-100';
                               textColor = isMe ? 'text-pink-50' : 'text-gray-500';
                            } else if (displayStatus === 'MISSED') {
                               statusText = isMe ? 'Cuộc gọi nhỡ' : 'Bạn đã lỡ một cuộc gọi';
                               bgColor = isMe ? 'bg-red-500/20' : 'bg-red-50';
                               textColor = isMe ? 'text-white' : 'text-red-500';
                            } else if (displayStatus === 'REJECTED') {
                               statusText = isMe ? 'Người ấy đã từ chối' : 'Bạn đã từ chối cuộc gọi';
                               bgColor = isMe ? 'bg-red-500/20' : 'bg-red-50';
                               textColor = isMe ? 'text-white' : 'text-red-500';
                            }
                          
                            return (
                              <div className={`flex flex-col p-3 rounded-lg min-w-[200px] ${bgColor} ${textColor}`}>
                                 <div className="flex items-center gap-3">
                                   <div className={`p-2 rounded-full ${isMe ? 'bg-white/20' : 'bg-gray-200'}`}>
                                     {mode === 'video' ? <Video size={18} /> : <Phone size={18} />}
                                   </div>
                                   <span className="font-semibold text-sm">{statusText}</span>
                                 </div>
                                 
                                 {displayStatus === 'ACCEPTED' && (
                                   <div className="flex gap-2 mt-3">
                                     <button onClick={() => {
                                       setCallMode(mode as any);
                                       setActiveCallId(msg.id);
                                       setActiveRoomId(roomId);
                                     }} className="flex-1 bg-green-500 text-white py-2 rounded-full font-bold shadow-md hover:bg-green-600 transition-transform active:scale-95">
                                       Trở lại phòng gọi
                                     </button>
                                   </div>
                                 )}
                                 {displayStatus === 'RINGING' && !isMe && (
                                   <div className="flex gap-2 mt-3">
                                     <button onClick={() => handleJoinCall(msg.id, roomId, mode as any)} className="flex-1 bg-green-500 text-white py-2 rounded-full font-bold shadow-md hover:bg-green-600 transition-transform active:scale-95">Nghe máy</button>
                                     <button onClick={() => handleRejectCall(msg.id, roomId, mode as any)} className="flex-1 bg-red-500 text-white py-2 rounded-full font-bold shadow-md hover:bg-red-600 transition-transform active:scale-95">Từ chối</button>
                                   </div>
                                 )}
                                 {displayStatus === 'RINGING' && isMe && (
                                   <div className="flex gap-2 mt-3">
                                     <button onClick={async () => {
                                       await supabase.from('messages').update({ content: `CALL::${roomId}::MISSED::${mode}` }).eq('id', msg.id);
                                       if (activeCallId === msg.id) {
                                         setCallMode(null); setActiveCallId(null); setActiveRoomId(null);
                                       }
                                     }} className="flex-1 bg-red-500 text-white py-2 rounded-full font-bold shadow-md hover:bg-red-600 transition-transform active:scale-95">Hủy cuộc gọi</button>
                                   </div>
                                 )}
                              </div>
                            );
                          })() : (
                            msg.content && <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                          )}

                          <div className={`mt-1 flex items-center gap-1 text-[9.5px] ${isMe ? 'text-pink-100' : 'text-teal-900/50'}`}>
                            <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>

                        {/* Message Status */}
                        {isMe && isLastMessage && (
                          <MessageStatus 
                            msg={msg} 
                            isPartnerOnline={isPartnerOnline} 
                            partnerLastActive={livePartnerProfile?.last_active} 
                          />
                        )}
                      </div>
                    </div>
                  </React.Fragment>
                );
              });
            })()}
          )}
          </div>
        </div>

        {/* Attachment Preview */}
        {attachment && (
          <div className="px-4 py-2 bg-gray-50 border-t border-pink-100 flex items-center justify-between z-20">
            <div className="flex items-center gap-2 text-sm text-pink-700">
              <ImageIcon size={16} />
              <span className="truncate max-w-[200px]">{attachment.name}</span>
            </div>
            <button onClick={() => setAttachment(null)} className="text-gray-400 hover:text-red-500">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-pink-100 bg-white p-3 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] z-20">
          <input type="file" accept="image/*" className="hidden" ref={attachInputRef} onChange={handleAttachChange} />
          <button 
            type="button"
            onClick={() => attachInputRef.current?.click()}
            className="p-2 text-pink-600 hover:bg-pink-50 rounded-full transition-colors"
          >
            <ImageIcon size={20} />
          </button>
          
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Nhắn gì đi..."
            className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-700 focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-400 transition-colors"
          />
          <button 
            type="submit"
            disabled={(!inputValue.trim() && !attachment) || isSending}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-pink-400 to-teal-400 text-white transition-transform hover:scale-110 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
          >
            {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="-ml-0.5" />}
          </button>
        </form>
      </div>

      {/* RIGHT SIDEBAR (INFO PANEL) */}
      {isInfoOpen && (
        <div className="w-80 border-l border-pink-100 bg-white flex flex-col flex-shrink-0 z-20 shadow-[-4px_0_15px_rgba(0,0,0,0.02)] overflow-y-auto">
          <div className="flex flex-col items-center py-8 px-4 border-b border-gray-50">
            <div className="relative">
              <img 
                src={livePartnerProfile?.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${livePartnerProfile?.id}`} 
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
            
            <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-pink-50 text-gray-700 transition-colors group">
              <div className="flex items-center gap-3">
                <UserPen size={18} className="text-pink-600" />
                <span className="font-medium text-sm">Đổi biệt danh</span>
              </div>
            </button>

            <input type="file" accept="image/*" className="hidden" ref={bgInputRef} onChange={handleBgUpload} />
            <button onClick={() => bgInputRef.current?.click()} disabled={isUploadingBg} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-pink-50 text-gray-700 transition-colors group disabled:opacity-50">
              <div className="flex items-center gap-3">
                {isUploadingBg ? <Loader2 size={18} className="text-pink-500 animate-spin" /> : <Palette size={18} className="text-pink-500" />}
                <span className="font-medium text-sm">{isUploadingBg ? 'Đang tải...' : 'Đổi hình nền chat'}</span>
              </div>
            </button>

            <button onClick={() => setIsSearching(!isSearching)} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-pink-50 text-gray-700 transition-colors group">
              <div className="flex items-center gap-3">
                <Search size={18} className="text-gray-500" />
                <span className="font-medium text-sm">Tìm kiếm tin nhắn</span>
              </div>
            </button>
            
            <div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-4">File phương tiện</div>
            
            <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-pink-50 text-gray-700 transition-colors group">
              <div className="flex items-center gap-3">
                <ImageIcon size={18} className="text-blue-500" />
                <span className="font-medium text-sm">Ảnh, file & liên kết</span>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
    </>
  );
}