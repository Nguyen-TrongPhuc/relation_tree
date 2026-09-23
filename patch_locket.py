import re

with open('src/app/locket/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Import Download and Trash icons
content = content.replace(
    "import { ArrowLeft, Clock, Grid, Loader2, Smile, Send, Heart } from 'lucide-react';", 
    "import { ArrowLeft, Clock, Grid, Loader2, Smile, Send, Heart, Download, Trash, MoreHorizontal } from 'lucide-react';"
)

# 2. Add state for active menu
content = content.replace(
    "const [showEmojisFor, setShowEmojisFor] = useState<string | null>(null);",
    "const [showEmojisFor, setShowEmojisFor] = useState<string | null>(null);\n  const [showMenuFor, setShowMenuFor] = useState<string | null>(null);"
)

# 3. Add handleDelete and handleDownload functions
new_funcs = """
  const handleReply = async (e: React.FormEvent, momentId: string) => {
"""
replacement_funcs = """
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
"""
content = content.replace(new_funcs, replacement_funcs)

# 4. Add the Menu button and Dropdown to the Header of each moment
old_header = """                  <div className="flex items-center gap-2">
                    <img 
                      src={moment.sender_id === userProfile.id ? userProfile.avatar_url : partnerProfile.avatar_url} 
                      className="w-8 h-8 rounded-full object-cover border border-gray-100" 
                    />
                    <div>
                      <p className="text-sm font-bold text-gray-800">{moment.sender_id === userProfile.id ? 'Bạn' : partnerProfile.display_name}</p>
                      <p className="text-[10px] text-gray-400 font-medium">{new Date(moment.created_at).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}</p>
                    </div>
                  </div>"""
                  
new_header = """                  <div className="flex items-center gap-2">
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
                  </div>"""
content = content.replace(old_header, new_header)

with open('src/app/locket/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
