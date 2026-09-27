'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getMessages, sendMessage, searchMessages, updateChatBackground, updateMessageContent, deleteMessage, recallMessage, togglePinMessage } from '@/app/actions/chat';
import { Send, ArrowLeft, Phone, Video, Info, UserPen, Palette, Search, Image as ImageIcon, X, Loader2, Check, CheckCheck, Trash, Pin, Reply } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import dynamic from 'next/dynamic';

const CallScreen = dynamic(() => import('./CallScreen'), { ssr: false });

interface ChatProfile {
  id?: string;
  display_name?: string | null;
  avatar_url?: string | null;
  last_active?: string | null;
  [key: string]: unknown;
}

interface ChatMessage {
  id: string | number;
  sender_id: string;
  receiver_id?: string;
  content: string;
  image_url?: string | null;
  is_moment?: boolean;
  is_pinned?: boolean;
  is_deleted?: boolean;
  is_read?: boolean;
  reactions?: Record<string, string> | null;
  reply_to_id?: string | null;
  replied_message?: ChatMessage | null;
  created_at: string;
  profiles?: ChatProfile | ChatProfile[] | null;
  [key: string]: unknown;
}

interface ChatWidgetProps {
  onClose?: () => void;
  isPartnerOnline?: boolean;
  partnerProfile?: ChatProfile;
  chatBackgroundUrl?: string;
}

function formatLastActive(dateStr?: string | null) {
  if (!dateStr) return 'Chưa hoạt động gần đây';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Vừa mới truy cập';
  if (diffMins < 60) return `Vắng mặt ${diffMins} phút`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Vắng mặt ${diffHours} giờ`;
  const diffDays = Math.floor(diffHours / 24);
  return `Vắng mặt ${diffDays} ngày`;
}

function MessageStatus({ msg }: { msg: ChatMessage }) {
  const [elapsedMessageId, setElapsedMessageId] = React.useState<string | number | null>(null);

  React.useEffect(() => {
    const remaining = Math.max(0, 2000 - (Date.now() - new Date(msg.created_at).getTime()));
    const timer = setTimeout(() => setElapsedMessageId(msg.id), remaining);
    return () => clearTimeout(timer);
  }, [msg.id, msg.created_at]);
  const timePassed = elapsedMessageId === msg.id;

  let statusText = '';
  let Icon = null;
  let iconClass = '';

  if (typeof msg.id === 'number' && msg.id < 0) {
    statusText = 'Đang gửi...';
    Icon = Loader2;
    iconClass = 'animate-spin';
  } else if (!timePassed) {
    statusText = 'Đã gửi';
    Icon = Check;
  } else if (msg.is_read) {
    statusText = 'Đã xem';
    Icon = CheckCheck;
    iconClass = 'text-pink-500';
  } else {
    statusText = 'Đã nhận';
    Icon = CheckCheck;
    iconClass = 'text-gray-400';
  }

  return (
    <div className="text-[10px] font-medium text-gray-400 mt-1 flex items-center gap-1 justify-end">
      <span>{statusText}</span>
      {Icon && <Icon size={12} className={iconClass} />}
    </div>
  );
}

export default function ChatWidget({ onClose, isPartnerOnline: externalIsOnline, partnerProfile, chatBackgroundUrl: initialBgUrl }: ChatWidgetProps) {
  const { pairData, user: authUser } = useAuth();
  let isFemale = pairData?.receiver_id === authUser?.id;
  if (typeof window !== 'undefined') {
    const override = window.localStorage.getItem('my_gender');
    if (override === 'female') isFemale = true;
    if (override === 'male') isFemale = false;
  }
  const myBubbleColor = isFemale ? 'bg-pink-500' : 'bg-teal-500';

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [realIsPartnerOnline, setRealIsPartnerOnline] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  
  // Search state
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ChatMessage[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [showMediaSidebar, setShowMediaSidebar] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [localNickname, setLocalNickname] = useState('');
  const [showNickModal, setShowNickModal] = useState(false);
  const [tempNick, setTempNick] = useState('');
  useEffect(() => {
    const timer = window.setTimeout(() => setLocalNickname(localStorage.getItem('partner_nickname') || ''), 0);
    const handleStorage = () => setLocalNickname(localStorage.getItem('partner_nickname') || '');
    window.addEventListener('storage', handleStorage);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);
  
  // Background state
  const [chatBackgroundUrl, setChatBackgroundUrl] = useState(initialBgUrl || '');
  const [isUploadingBg, setIsUploadingBg] = useState(false);
  const bgInputRef = useRef<HTMLInputElement>(null);
  
  // Attachment state
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [contextMenuFor, setContextMenuFor] = useState<string | number | null>(null);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const attachInputRef = useRef<HTMLInputElement>(null);

  const [livePartnerProfile, setLivePartnerProfile] = useState<ChatProfile | undefined>(partnerProfile);
  const [callMode, setCallMode] = useState<'audio' | 'video' | null>(null);
  const [callState, setCallState] = useState<'ringing' | 'connected' | null>(null);
  const [activeCallId, setActiveCallId] = useState<string | number | null>(null);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [incomingCall, setIncomingCall] = useState<{ msgId: string | number; roomId: string; mode: 'audio' | 'video' } | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => () => {
    if (attachmentPreview) URL.revokeObjectURL(attachmentPreview);
  }, [attachmentPreview]);

  useEffect(() => {
    if (!viewingImage) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setViewingImage(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [viewingImage]);

  useEffect(() => {
    if (!isSearching || !searchQuery.trim()) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      const result = await searchMessages(searchQuery, livePartnerProfile?.id);
      if (!cancelled) {
        setSearchResults(result.messages || []);
        setIsSearchLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [isSearching, searchQuery, livePartnerProfile?.id]);

  useEffect(() => {
    const fetchInitial = async () => {
      const res = await getMessages(partnerProfile?.id);
      const fetchedMessages = (res.messages || []) as unknown as Array<ChatMessage & { replied_message?: ChatMessage | ChatMessage[] | null }>;
      setMessages(fetchedMessages.map(message => ({
        ...message,
        replied_message: Array.isArray(message.replied_message) ? message.replied_message[0] || null : message.replied_message,
      })));
      setCurrentUserId(res.userId || null);
      setLoading(false);
      scrollToBottom();

      if (res.userId && res.partnerId) {
        await supabase.from('messages').update({ is_read: true }).eq('sender_id', res.partnerId).eq('receiver_id', res.userId).eq('is_read', false);
      }

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
        async (payload: { new: Record<string, unknown> }) => {
          const newMsg = payload.new as unknown as ChatMessage;
          const belongsToActiveConversation =
            (newMsg.sender_id === currentUserId && newMsg.receiver_id === partnerProfile?.id) ||
            (newMsg.sender_id === partnerProfile?.id && newMsg.receiver_id === currentUserId);
          if (!belongsToActiveConversation) return;

          if (newMsg.sender_id === partnerProfile?.id && newMsg.receiver_id === currentUserId && !newMsg.is_read) {
            await supabase.from('messages').update({ is_read: true }).eq('id', newMsg.id);
          }
          
          // Gắn profile cục bộ thay vì gọi getMessages() (bỏ qua Server Action)
          let profile = null;
          if (newMsg.sender_id === currentUserId) {
            profile = { display_name: 'Bạn', avatar_url: null };
          } else {
            profile = { display_name: partnerProfile?.display_name || 'Người ấy', avatar_url: partnerProfile?.avatar_url || null };
          }
          newMsg.profiles = profile; if (newMsg.reply_to_id) { const { data: replied } = await supabase.from('messages').select('id, content, image_url, sender_id, is_deleted').eq('id', newMsg.reply_to_id).single(); newMsg.replied_message = replied; }

          setMessages(prev => {
            // Xóa tin nhắn ảo (optimistic) có cùng nội dung (id âm)
            const filtered = prev.filter(m => !(typeof m.id === 'number' && m.id < 0 && m.content === newMsg.content));
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
        async (payload: { new: Record<string, unknown> }) => {
          const updatedMsg = payload.new as unknown as ChatMessage;
          const belongsToActiveConversation =
            (updatedMsg.sender_id === currentUserId && updatedMsg.receiver_id === partnerProfile?.id) ||
            (updatedMsg.sender_id === partnerProfile?.id && updatedMsg.receiver_id === currentUserId);
          if (!belongsToActiveConversation) return;
          setMessages((prev) => prev.map(m => m.id === updatedMsg.id ? { ...m, ...updatedMsg } : m));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase, currentUserId, partnerProfile?.id, partnerProfile?.display_name, partnerProfile?.avatar_url]);

  useEffect(() => {
    if (!currentUserId || !livePartnerProfile?.id) return;
    const updateLastActive = async () => {
      await supabase.from('profiles').update({ last_active: new Date().toISOString() }).eq('id', currentUserId);
    };
    updateLastActive();
    const activeInterval = setInterval(updateLastActive, 180000);
    const profileInterval = setInterval(async () => {
      const { data } = await supabase.from('profiles').select('last_active, display_name, avatar_url').eq('id', livePartnerProfile.id).single();
      if (data) setLivePartnerProfile((current) => ({ ...current, ...data }));
    }, 60000);

    const room = supabase.channel('couple_room');
    room.on('presence', { event: 'sync' }, () => {
      const state = room.presenceState();
      const partnerIsHere = Object.values(state as Record<string, Array<{ user_id?: string }>>).some(
        presences => presences.some(p => p.user_id === livePartnerProfile.id)
      );
      setRealIsPartnerOnline(partnerIsHere);
    }).subscribe(async (status: 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR') => {
      if (status === 'SUBSCRIBED') await room.track({ user_id: currentUserId });
    });

    return () => {
      clearInterval(activeInterval);
      clearInterval(profileInterval);
      supabase.removeChannel(room);
    };
  }, [currentUserId, livePartnerProfile, supabase]);

  const isPartnerOnline = externalIsOnline !== undefined ? externalIsOnline : realIsPartnerOnline;

  function scrollToBottom() {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    if (!file.type.startsWith('image/') || file.size > 10 * 1024 * 1024) {
      alert('Vui lòng chọn ảnh có dung lượng dưới 10 MB.');
      e.target.value = '';
      return;
    }
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
    const result = await updateChatBackground(newUrl, livePartnerProfile?.id);
    if (result.error) {
      setChatBackgroundUrl(initialBgUrl || '');
      alert(result.error);
    }
    setIsUploadingBg(false);
  };

  const handleAttachChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn tệp hình ảnh.');
      e.target.value = '';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Ảnh cần nhỏ hơn 10 MB để gửi ổn định trên điện thoại.');
      e.target.value = '';
      return;
    }
    setAttachmentPreview(URL.createObjectURL(file));
    setAttachment(file);
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

  const handleJoinCall = async (msgId: string | number, roomId: string, mode: 'audio' | 'video') => {
    setCallMode(mode);
    setCallState('connected');
    setActiveCallId(msgId);
    setActiveRoomId(roomId);
    setIncomingCall(null); // Tắt popup cuộc gọi đến
    await supabase.from('messages').update({ content: `CALL::${roomId}::ACCEPTED::${mode}` }).eq('id', msgId);
  };

  const handleRejectCall = async (msgId: string | number, roomId: string, mode: 'audio' | 'video') => {
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
    if (!currentUserId || !livePartnerProfile?.id) return;

    const text = inputValue.trim();
    const selectedFile = attachment;
    const reply = replyingTo;
    setInputValue('');
    setReplyingTo(null);
    const tempId = -Date.now();
    setIsSending(true);

    let uploadedImageUrl: string | undefined;
    let uploadedFilePath: string | undefined;
    if (selectedFile) {
      const safeName = selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const fileName = `chat/${currentUserId}/${Date.now()}-${safeName}`;
      uploadedFilePath = fileName;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, selectedFile, { upsert: false, contentType: selectedFile.type });
      if (uploadError) {
        alert('Không tải được ảnh: ' + uploadError.message);
        setIsSending(false);
        return;
      }
      uploadedImageUrl = supabase.storage.from('avatars').getPublicUrl(fileName).data.publicUrl;
    }

    const optimisticMessage = {
      id: tempId,
      sender_id: currentUserId,
      receiver_id: livePartnerProfile.id,
      content: text,
      image_url: uploadedImageUrl || null,
      reply_to_id: reply?.id ? String(reply.id) : null,
      replied_message: reply,
      created_at: new Date().toISOString(),
      profiles: { display_name: 'Bạn', avatar_url: null },
    };
    setMessages(prev => [...prev, optimisticMessage]);
    setTimeout(scrollToBottom, 50);

    const result = await sendMessage(text, uploadedImageUrl, reply?.id ? String(reply.id) : null, livePartnerProfile.id);
    if (result.error || !result.message) {
      alert('Lỗi gửi tin nhắn: ' + (result.error || 'Không nhận được phản hồi từ máy chủ.'));
      setMessages(prev => prev.filter(m => m.id !== tempId));
      if (uploadedFilePath) await supabase.storage.from('avatars').remove([uploadedFilePath]);
      setInputValue(text);
    } else {
      setAttachment(null);
      setAttachmentPreview(null);
      setMessages(prev => {
        const withoutTemp = prev.filter(m => m.id !== tempId);
        if (withoutTemp.some(m => m.id === result.message.id)) return withoutTemp;
        return [...withoutTemp, { ...result.message, replied_message: reply }];
      });
    }
    setIsSending(false);
    scrollToBottom();
  };

  const displayedMessages = messages;
  const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null);
  const scrollToMessage = (message: ChatMessage) => {
    const id = String(message.id);
    if (!messages.some(item => String(item.id) === id)) {
      setMessages(prev => [...prev, message].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));
    }
    window.setTimeout(() => {
      document.getElementById('msg-' + id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedMsgId(id);
      setIsSearching(false);
      window.setTimeout(() => setHighlightedMsgId(null), 3000);
    }, 50);
  };

  const handleMessageAction = async (action: 'reply' | 'pin' | 'delete' | 'recall' | 'edit', msg: ChatMessage) => {
    setContextMenuFor(null);
    if (action === 'reply') {
      setReplyingTo(msg);
      document.getElementById('chat-input')?.focus();
      return;
    }
    if (action === 'edit') {
      const updated = window.prompt('Chỉnh sửa tin nhắn:', msg.content || '');
      if (updated === null || updated.trim() === msg.content) return;
      const result = await updateMessageContent(String(msg.id), updated, livePartnerProfile?.id);
      if (result.error) alert(result.error);
      else setMessages(prev => prev.map(item => item.id === msg.id ? { ...item, content: updated.trim() } : item));
      return;
    }
    if (action === 'pin') {
      const result = await togglePinMessage(String(msg.id), Boolean(msg.is_pinned), livePartnerProfile?.id);
      if (result.error) alert(result.error);
      else setMessages(prev => prev.map(item => item.id === msg.id ? { ...item, is_pinned: !msg.is_pinned } : item));
      return;
    }
    if (action === 'recall') {
      if (!window.confirm('Thu hồi tin nhắn này cho cả hai người?')) return;
      const result = await recallMessage(String(msg.id), livePartnerProfile?.id);
      if (result.error) alert(result.error);
      else setMessages(prev => prev.map(item => item.id === msg.id ? { ...item, content: '', image_url: null, is_deleted: true } : item));
      return;
    }
    if (!window.confirm('Xóa vĩnh viễn tin nhắn này khỏi cuộc trò chuyện?')) return;
    const result = await deleteMessage(String(msg.id), livePartnerProfile?.id);
    if (result.error) alert(result.error);
    else setMessages(prev => prev.filter(item => item.id !== msg.id));
  };

  return (
    <>
      {/* Màn hình chờ đổ chuông (người gọi đang đợi người kia bắt máy) */}
      {callState === 'ringing' && (
        <div className="fixed inset-0 z-[1000] bg-gradient-to-b from-pink-800 to-pink-950 flex flex-col items-center justify-center text-white">
          <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center mb-6 animate-pulse">
            {callMode === 'video' ? <Video size={40} /> : <Phone size={40} />}
          </div>
          <h2 className="text-2xl font-bold mb-2">{(localNickname || livePartnerProfile?.display_name || 'Người ấy')}</h2>
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

      {/* Popup cuộc gọi đến */}
      {incomingCall && !callState && (
        <div className="fixed inset-0 z-[999] bg-gradient-to-b from-pink-700 to-pink-950 flex flex-col items-center justify-center text-white">
          <img 
            src={livePartnerProfile?.avatar_url || '/default-avatar.png'}
            alt="Caller"
            className="w-28 h-28 rounded-full border-4 border-white/30 shadow-xl mb-6 object-cover"
          />
          <h2 className="text-2xl font-bold mb-2">{(localNickname || livePartnerProfile?.display_name || 'Người ấy')}</h2>
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
          userName="Bạn"
          isVideoCall={callMode === 'video'}
          onClose={handleLeaveCall} 
        />
      )}
      <div className="flex h-full w-full bg-white relative">
      {/* MAIN CHAT AREA */}
      <div className="flex-1 flex flex-col min-w-0 relative h-full">
        {/* Header */}
        <div className="relative flex flex-col border-b border-pink-100 bg-[#fdf2f8]/95 backdrop-blur-md shadow-sm z-20">
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
                  <h3 className="font-bold text-gray-800">{(localNickname || livePartnerProfile?.display_name || 'Người ấy')}</h3>
                  <p className={`text-[11px] font-medium ${isPartnerOnline ? 'text-green-600' : 'text-gray-500'}`}>
                    {isPartnerOnline ? 'Đang trực tuyến ' : formatLastActive(livePartnerProfile?.last_active)}
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
                  onChange={e => {
                    const value = e.target.value;
                    setSearchResults([]);
                    setIsSearchLoading(Boolean(value.trim()));
                    setSearchQuery(value);
                  }}
                  placeholder="Tìm kiếm trong đoạn chat..." 
                  className="w-full pl-9 pr-4 py-1.5 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-pink-400"
                />
              </div>
              <button type="button" aria-label="Đóng tìm kiếm" onClick={() => { setIsSearching(false); setSearchQuery(''); setSearchResults([]); setIsSearchLoading(false); }} className="p-2 text-gray-500 hover:bg-pink-50 rounded-full">
                <X size={18} />
              </button>
              {searchQuery.trim() && (
                <div className="absolute top-full left-4 right-4 mt-1 bg-white/95 backdrop-blur-md shadow-xl rounded-xl border border-gray-100 z-50 max-h-72 overflow-y-auto divide-y divide-gray-100">
                  {isSearchLoading ? (
                    <p className="p-4 text-sm text-center text-gray-500">Đang tìm kiếm...</p>
                  ) : searchResults.length ? searchResults.map(m => (
                    <button key={m.id} onClick={() => scrollToMessage(m)} className="w-full text-left p-3 hover:bg-pink-50 transition-colors flex flex-col gap-1">
                      <span className="text-xs font-bold text-gray-500">{new Date(m.created_at).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}</span>
                      <span className="text-sm text-gray-800 line-clamp-2">{m.content || (m.image_url ? 'Ảnh đã gửi' : '')}</span>
                    </button>
                  )) : <p className="p-4 text-sm text-center text-gray-500">Không tìm thấy tin nhắn phù hợp.</p>}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Message List */}
        <div 
          ref={scrollRef}
          className={`flex-1 overflow-y-auto p-4 space-y-4 relative ${!chatBackgroundUrl ? 'bg-[#f8f9fa] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]' : ''}`}
          style={{ 
            scrollBehavior: 'smooth',
            ...(chatBackgroundUrl ? {
              backgroundImage: `url(${chatBackgroundUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            } : {})
          }}
        >
          {messages.filter(m => m.is_pinned && !m.is_deleted).length > 0 && (
            <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md shadow-sm border-b border-pink-100/50 -mx-4 -mt-4 px-4 py-2 mb-4">
              <div className="flex items-start gap-2">
                <Pin size={14} className="text-pink-500 mt-1 flex-shrink-0" />
                <div className="flex-1 overflow-x-auto flex gap-3 no-scrollbar pb-1">
                  {messages.filter(m => m.is_pinned && !m.is_deleted).map(pinned => (
                    <div 
                      key={pinned.id} 
                      onClick={() => {
                        const el = document.getElementById(`msg-${pinned.id}`);
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}
                      className="bg-pink-50 rounded-lg p-2 min-w-[200px] max-w-[250px] cursor-pointer hover:bg-pink-100 transition-colors flex-shrink-0 border border-pink-100/50"
                    >
                      <p className="text-[10px] font-bold text-pink-600 truncate">{pinned.sender_id === currentUserId ? 'Bạn' : ((localNickname || livePartnerProfile?.display_name || 'Người ấy'))}</p>
                      <p className="text-xs text-gray-700 truncate">{pinned.is_deleted ? 'Tin nhắn đã được thu hồi' : pinned.content || 'Hình ảnh'}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
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
          ) : ( (() => {
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
                    <div id={"msg-" + msg.id} className={`flex w-full gap-2 transition-colors duration-500 ${isMe ? 'justify-end' : 'justify-start'} ${highlightedMsgId === msg.id ? isFemale ? 'bg-pink-100/50 p-2 rounded-xl' : 'bg-teal-100/50 p-2 rounded-xl' : ''}`}>
                      {!isMe && (
                        <img src={avatarUrl} alt="avatar" className="w-8 h-8 rounded-full border border-teal-200 shadow-sm flex-shrink-0 object-cover mt-auto mb-1" />
                      )}
                      <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%]`}>
                        {msg.is_deleted ? (
                          <div className="rounded-2xl bg-gray-100 px-3 py-2 text-sm italic text-gray-500">Tin nhắn đã được thu hồi</div>
                        ) : (() => {
  const isImageOnly = msg.image_url && (!msg.content || msg.content === '📸 Vừa chia sẻ một khoảnh khắc') && !msg.replied_message && !msg.content?.startsWith('CALL::');
  return (
    <div 
onClick={() => setContextMenuFor(contextMenuFor === msg.id ? null : msg.id)} 
className={`whitespace-pre-wrap word-break flex flex-col relative group cursor-pointer ${
      isImageOnly ? 'bg-transparent text-gray-800 items-end p-0' :
                          isMe 
                            ? `p-3 ${myBubbleColor} text-white rounded-[20px] rounded-br-[4px] shadow-sm items-end` 
                            : 'p-3 bg-white text-gray-800 border border-gray-100 rounded-[20px] rounded-bl-[4px] shadow-sm items-start'
                        }`}>
                                                      {msg.replied_message && (
                              <div className="w-full mb-2 bg-black/10 rounded-xl p-2 border-l-4 border-white/50 text-sm">
                                <span className="font-bold opacity-80 text-xs mb-1 block">
                                  {msg.replied_message.sender_id === currentUserId ? 'Bạn' : 'Người ấy'}
                                </span>
                                {msg.replied_message.image_url && (
                                  <img src={msg.replied_message.image_url || ''} alt="Ảnh trong tin nhắn được trả lời" className="w-full max-w-[120px] rounded-lg mb-1 object-cover" />
                                )}
                                <p className="opacity-90 line-clamp-2">{msg.replied_message.is_deleted ? 'Tin nhắn đã được thu hồi' : msg.replied_message.content}</p>
                              </div>
                            )}

                            {msg.image_url && (
                              <div className="relative">
                                <button type="button" onClick={(e) => { e.stopPropagation(); setViewingImage(msg.image_url || null); }} className="block cursor-zoom-in" aria-label="Xem ảnh đã gửi">
                                  <img src={msg.image_url || ''} alt="Ảnh đã gửi" className="rounded-xl mb-2 max-w-full h-auto max-h-64 object-contain bg-black/5" />
                                </button>
                                {msg.is_moment && (
                                  <div className="absolute top-2 left-2 bg-pink-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md backdrop-blur-md">Khoảnh khắc (Locket)</div>
                                )}
                              </div>
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
                                       setCallMode(mode as 'audio' | 'video');
                                       setActiveCallId(msg.id);
                                       setActiveRoomId(roomId);
                                     }} className="flex-1 bg-green-500 text-white py-2 rounded-full font-bold shadow-md hover:bg-green-600 transition-transform active:scale-95">
                                       Trở lại phòng gọi
                                     </button>
                                   </div>
                                 )}
                                 {displayStatus === 'RINGING' && !isMe && (
                                   <div className="flex gap-2 mt-3">
                                     <button onClick={() => handleJoinCall(msg.id, roomId, mode as 'audio' | 'video')} className="flex-1 bg-green-500 text-white py-2 rounded-full font-bold shadow-md hover:bg-green-600 transition-transform active:scale-95">Nghe máy</button>
                                     <button onClick={() => handleRejectCall(msg.id, roomId, mode as 'audio' | 'video')} className="flex-1 bg-red-500 text-white py-2 rounded-full font-bold shadow-md hover:bg-red-600 transition-transform active:scale-95">Từ chối</button>
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
                          
                          {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                            <div className="absolute -bottom-3 -right-2 flex -space-x-1 z-10">
                              {Object.entries(msg.reactions).map(([uid, emoji]) => (
                                <div key={uid} className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-100 text-xs text-black">
                                  {emoji as string}
                                </div>
                              ))}
                            </div>
                          )}

                          <div className={`mt-1 flex items-center gap-1 text-[9.5px] ${isMe ? 'text-pink-100' : 'text-teal-900/50'}`}>
                            <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {msg.is_pinned && <Pin size={10} className="text-yellow-500" />}
                          </div>
                          
                          {/* Context Menu */}
                          {contextMenuFor === msg.id && !msg.is_deleted && (
                            <div className={`absolute top-full mt-1 ${isMe ? 'right-0' : 'left-0'} z-50 w-36 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95`}>
                              <button onClick={(e) => { e.stopPropagation(); handleMessageAction('reply', msg); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 border-b border-gray-50">
                                <Reply size={16} /> Trả lời
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); handleMessageAction('pin', msg); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 border-b border-gray-50">
                                <Pin size={16} /> {msg.is_pinned ? 'Bỏ ghim' : 'Ghim'}
                              </button>
                              {isMe && (
                                <>
                                  {!msg.image_url && !msg.content?.startsWith('CALL::') && (
                                    <button onClick={(e) => { e.stopPropagation(); handleMessageAction('edit', msg); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-50">
                                      Chỉnh sửa
                                    </button>
                                  )}
                                  {!msg.content?.startsWith('CALL::') && (
                                    <button onClick={(e) => { e.stopPropagation(); handleMessageAction('recall', msg); }} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 border-b border-gray-50">
                                      Thu hồi (15 phút)
                                    </button>
                                  )}
                                  <button onClick={(e) => { e.stopPropagation(); handleMessageAction('delete', msg); }} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                                    <Trash size={16} /> Xóa vĩnh viễn
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                        {/* Message Status */}
                        {isMe && isLastMessage && (
                          <MessageStatus msg={msg} />
                        )}
                      </div>
                    </div>
                  </React.Fragment>
                );
              });
            })() )}
          </div>
        </div>

        {/* Attachment Preview */}
        {attachment && (
          <div className="px-4 py-3 bg-gray-50 border-t border-pink-100 flex items-center justify-between z-20 relative">
            <div className="flex items-center gap-3">
              {attachmentPreview && <img src={attachmentPreview} alt="Xem trước ảnh" className="w-16 h-16 object-cover rounded-lg border shadow-sm" />}
              <span className="text-sm font-medium text-gray-700 truncate max-w-[150px]">{attachment.name}</span>
            </div>
            <button onClick={() => { setAttachment(null); setAttachmentPreview(null); }} className="p-2 bg-white rounded-full text-gray-400 hover:text-red-500 shadow-sm border">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Reply Preview */}
        {replyingTo && (
          <div className="px-4 py-2 bg-pink-50 border-t border-pink-100 flex items-center justify-between z-20">
            <div className="flex flex-col max-w-[80%]">
              <span className="text-xs font-bold text-pink-600">Đang trả lời {replyingTo.sender_id === currentUserId ? 'chính bạn' : (livePartnerProfile?.display_name || 'người ấy')}</span>
              <span className="text-xs text-gray-600 truncate">{replyingTo.is_deleted ? 'Tin nhắn đã được thu hồi' : replyingTo.content || 'Hình ảnh / Tệp'}</span>
            </div>
            <button onClick={() => setReplyingTo(null)} className="p-1 text-gray-400 hover:text-pink-600 rounded-full hover:bg-white transition-colors">
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
            id="chat-input"
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
        <>
        <div className="md:hidden absolute inset-0 bg-black/20 z-20" onClick={() => setIsInfoOpen(false)}></div>
        <div className="absolute inset-y-0 right-0 w-[min(20rem,90vw)] md:relative md:w-80 border-l border-pink-100 bg-white flex flex-col flex-shrink-0 z-30 shadow-2xl md:shadow-[-4px_0_15px_rgba(0,0,0,0.02)] overflow-y-auto transform transition-transform duration-300">
          <button onClick={() => setIsInfoOpen(false)} className="md:hidden absolute top-4 right-4 p-2 bg-pink-50 text-pink-500 rounded-full z-40 hover:bg-pink-100">
            <X size={20} />
          </button>
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
            <h3 className="mt-4 font-bold text-gray-800 text-xl">{(localNickname || livePartnerProfile?.display_name || 'Người ấy')}</h3>
          </div>
          
          
          {showMediaSidebar ? (
            <div className="flex-1 flex flex-col">
              <div className="p-3 flex items-center gap-2 border-b border-gray-100">
                <button onClick={() => setShowMediaSidebar(false)} className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft size={18}/></button>
                <span className="font-bold">Ảnh đã gửi</span>
              </div>
              <div className="flex-1 overflow-y-auto p-2 grid grid-cols-3 gap-1">
                {messages.filter(m => m.image_url).map(m => (
                  <button key={m.id} type="button" onClick={() => setViewingImage(m.image_url || null)} className="block overflow-hidden rounded focus:outline-none focus:ring-2 focus:ring-pink-400" aria-label="Xem ảnh đã gửi">
                    <img alt="Ảnh đã gửi" src={m.image_url || ''} className="w-full aspect-square object-cover cursor-pointer hover:opacity-80" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 p-2 space-y-1">
            <div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-2">Tùy chỉnh đoạn chat</div>
            
            <button onClick={() => {
              const newName = window.prompt('Nhập biệt danh mới cho người ấy (lưu trên máy này):', localStorage.getItem('partner_nickname') || '');
              if (newName !== null) {
                if (newName.trim() === '') localStorage.removeItem('partner_nickname');
                else localStorage.setItem('partner_nickname', newName.trim());
                window.dispatchEvent(new Event('storage'));
                alert('Thành công!');
              }
            }} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-pink-50 text-gray-700 transition-colors group">
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

            <button onClick={() => { setIsSearching(!isSearching); setSearchQuery(''); setSearchResults([]); setIsSearchLoading(false); }} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-pink-50 text-gray-700 transition-colors group">
              <div className="flex items-center gap-3">
                <Search size={18} className="text-gray-500" />
                <span className="font-medium text-sm">Tìm kiếm tin nhắn</span>
              </div>
            </button>
            
            <div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-4">File phương tiện</div>
            
            <button onClick={() => setShowMediaSidebar(true)} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-pink-50 text-gray-700 transition-colors group">
              <div className="flex items-center gap-3">
                <ImageIcon size={18} className="text-blue-500" />
                <span className="font-medium text-sm">Ảnh, file & liên kết</span>
              </div>
            </button>
          </div>
          )}
        </div>
        </>
      )}
    </div>
    {viewingImage && (
      <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/90 p-3 sm:p-8" role="dialog" aria-modal="true" aria-label="Xem ảnh">
        <button type="button" className="absolute inset-0 cursor-default" onClick={() => setViewingImage(null)} aria-label="Đóng trình xem ảnh" />
        <button type="button" onClick={() => setViewingImage(null)} className="absolute right-4 top-4 z-20 rounded-full bg-white/15 p-3 text-white hover:bg-white/25" aria-label="Đóng ảnh">
          <X size={24} />
        </button>
        <img src={viewingImage} alt="Ảnh trong cuộc trò chuyện" onClick={(e) => e.stopPropagation()} className="relative z-10 max-h-[90dvh] max-w-full rounded-lg object-contain shadow-2xl" />
      </div>
    )}
    </>
  );
}



