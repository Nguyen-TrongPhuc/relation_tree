import re

with open('src/components/chat/ChatWidget.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Import new icons & actions
content = content.replace(
    "import { Send, ArrowLeft, Phone, Video, Info, UserPen, Palette, Search, Image as ImageIcon, X, Paperclip, Loader2, Check, CheckCheck } from 'lucide-react';",
    "import { Send, ArrowLeft, Phone, Video, Info, UserPen, Palette, Search, Image as ImageIcon, X, Paperclip, Loader2, Check, CheckCheck, Trash, Pin, Reply, MoreVertical } from 'lucide-react';"
)
content = content.replace(
    "import { getMessages, sendMessage, updateChatBackground, updateMessageContent } from '@/app/actions/chat';",
    "import { getMessages, sendMessage, updateChatBackground, updateMessageContent, deleteMessage, togglePinMessage } from '@/app/actions/chat';"
)

# 2. Add states for ContextMenu and ReplyingTo
states_search = "  const [isSending, setIsSending] = useState(false);"
new_states = """  const [isSending, setIsSending] = useState(false);
  const [contextMenuFor, setContextMenuFor] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<any | null>(null);"""
content = content.replace(states_search, new_states)

# 3. Update handleSend to support reply
old_handleSend = """  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() && !attachment) return;

    setIsSending(true);
    let imageUrl = '';
    
    // Upload ảnh nếu có
    if (attachment) {
      const fileName = `${user.id}-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage.from('chat_images').upload(fileName, attachment);
      if (!uploadError) {
        const { data } = supabase.storage.from('chat_images').getPublicUrl(fileName);
        imageUrl = data.publicUrl;
      }
    }

    // Gửi tin nhắn lên Supabase qua server action
    await sendMessage(inputValue, imageUrl);
    
    setInputValue('');
    setAttachment(null);
    setIsSending(false);
    
    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, 100);
  };"""

new_handleSend = """  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() && !attachment) return;

    setIsSending(true);
    let imageUrl = '';
    
    if (attachment) {
      const fileName = `${user.id}-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage.from('chat_images').upload(fileName, attachment);
      if (!uploadError) {
        const { data } = supabase.storage.from('chat_images').getPublicUrl(fileName);
        imageUrl = data.publicUrl;
      }
    }

    await sendMessage(inputValue, imageUrl, replyingTo?.id);
    
    setInputValue('');
    setAttachment(null);
    setReplyingTo(null);
    setIsSending(false);
    
    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, 100);
  };

  const handleMessageAction = async (action: 'reply' | 'delete' | 'pin', msg: any) => {
    setContextMenuFor(null);
    if (action === 'reply') {
      setReplyingTo(msg);
      // Focus input
      setTimeout(() => document.getElementById('chat-input')?.focus(), 100);
    } else if (action === 'delete') {
      if (confirm('Xóa tin nhắn này?')) {
        setMessages(prev => prev.filter(m => m.id !== msg.id));
        await deleteMessage(msg.id);
      }
    } else if (action === 'pin') {
      await togglePinMessage(msg.id, msg.is_pinned);
    }
  };"""
content = content.replace(old_handleSend, new_handleSend)

# 4. Modify message bubble to add ContextMenu
# We search for:
# <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%]`}>
# and replace it to include the click handler and the dropdown.

bubble_search = """                        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%]`}>"""
bubble_replace = """                        <div 
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%] relative`}
                        >"""
content = content.replace(bubble_search, bubble_replace)

bubble_inner_search = """                          <div className={`p-3 shadow-sm whitespace-pre-wrap word-break flex flex-col relative group ${"""
bubble_inner_replace = """                          <div 
                            onClick={() => setContextMenuFor(contextMenuFor === msg.id ? null : msg.id)}
                            className={`p-3 shadow-sm whitespace-pre-wrap word-break flex flex-col relative group cursor-pointer ${"""
content = content.replace(bubble_inner_search, bubble_inner_replace)

# Add Context Menu Popup under the time
status_search = """                            <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>"""
status_replace = """                            <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {msg.is_pinned && <Pin size={10} className="text-yellow-500" />}
                          </div>
                          
                          {/* Context Menu */}
                          {contextMenuFor === msg.id && (
                            <div className={`absolute top-full mt-1 ${isMe ? 'right-0' : 'left-0'} z-50 w-36 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95`}>
                              <button onClick={(e) => { e.stopPropagation(); handleMessageAction('reply', msg); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 border-b border-gray-50">
                                <Reply size={16} /> Trả lời
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); handleMessageAction('pin', msg); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 border-b border-gray-50">
                                <Pin size={16} /> {msg.is_pinned ? 'Bỏ ghim' : 'Ghim'}
                              </button>
                              {isMe && (
                                <button onClick={(e) => { e.stopPropagation(); handleMessageAction('delete', msg); }} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                                  <Trash size={16} /> Xóa
                                </button>
                              )}
                            </div>
                          )}"""
content = content.replace(status_search, status_replace)

# 5. Add ReplyingTo Preview above the Input Form and add id="chat-input"
form_search = """        {/* Input Form */}
        <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-pink-100 bg-white p-3 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] z-20">
          <input type="file" accept="image/*" className="hidden" ref={attachInputRef} onChange={handleAttachChange} />"""

form_replace = """        {/* Reply Preview */}
        {replyingTo && (
          <div className="px-4 py-2 bg-pink-50 border-t border-pink-100 flex items-center justify-between z-20">
            <div className="flex flex-col max-w-[80%]">
              <span className="text-xs font-bold text-pink-600">Đang trả lời {replyingTo.sender_id === user.id ? 'chính bạn' : (livePartnerProfile?.display_name || 'người ấy')}</span>
              <span className="text-xs text-gray-600 truncate">{replyingTo.content || 'Hình ảnh / Tệp'}</span>
            </div>
            <button onClick={() => setReplyingTo(null)} className="p-1 text-gray-400 hover:text-pink-600 rounded-full hover:bg-white transition-colors">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-pink-100 bg-white p-3 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] z-20">
          <input type="file" accept="image/*" className="hidden" ref={attachInputRef} onChange={handleAttachChange} />"""
content = content.replace(form_search, form_replace)

# Add id to the input
input_search = """          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}"""
input_replace = """          <input
            id="chat-input"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}"""
content = content.replace(input_search, input_replace)

# 6. Add "Pinned Messages" banner at the top of the chat view
# Search for: <div className="relative z-10 space-y-4">
pinned_search = """          <div className="relative z-10 space-y-4">"""
pinned_replace = """          {messages.filter(m => m.is_pinned).length > 0 && (
            <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md shadow-sm border-b border-pink-100/50 -mx-4 -mt-4 px-4 py-2 mb-4">
              <div className="flex items-start gap-2">
                <Pin size={14} className="text-pink-500 mt-1 flex-shrink-0" />
                <div className="flex-1 overflow-x-auto flex gap-3 no-scrollbar pb-1">
                  {messages.filter(m => m.is_pinned).map(pinned => (
                    <div 
                      key={pinned.id} 
                      onClick={() => {
                        const el = document.getElementById(`msg-${pinned.id}`);
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}
                      className="bg-pink-50 rounded-lg p-2 min-w-[200px] max-w-[250px] cursor-pointer hover:bg-pink-100 transition-colors flex-shrink-0 border border-pink-100/50"
                    >
                      <p className="text-[10px] font-bold text-pink-600 truncate">{pinned.sender_id === user.id ? 'Bạn' : (livePartnerProfile?.display_name || 'Người ấy')}</p>
                      <p className="text-xs text-gray-700 truncate">{pinned.content || 'Hình ảnh'}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div className="relative z-10 space-y-4">"""
content = content.replace(pinned_search, pinned_replace)

# Make sure each message has an ID to scroll to
msg_id_search = """                  <React.Fragment key={msg.id}>
                    {showDate && (
                      <div className="flex justify-center my-6 relative">
                        <div className="bg-white/80 backdrop-blur-sm border border-gray-100 px-3 py-1 rounded-full shadow-sm text-xs font-bold text-pink-400 z-10">
                          {dateStr}
                        </div>
                      </div>
                    )}
                    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} group mb-1`} onDoubleClick={() => handleLike(msg.id)}>"""
msg_id_replace = """                  <React.Fragment key={msg.id}>
                    {showDate && (
                      <div className="flex justify-center my-6 relative">
                        <div className="bg-white/80 backdrop-blur-sm border border-gray-100 px-3 py-1 rounded-full shadow-sm text-xs font-bold text-pink-400 z-10">
                          {dateStr}
                        </div>
                      </div>
                    )}
                    <div id={`msg-${msg.id}`} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group mb-1`} onDoubleClick={() => handleLike(msg.id)}>"""
content = content.replace(msg_id_search, msg_id_replace)

with open('src/components/chat/ChatWidget.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
