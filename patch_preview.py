import re

with open('src/components/locket/PreviewModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add Wand2 to imports
content = content.replace("import { X, Loader2, Send } from 'lucide-react';", "import { X, Loader2, Send, Wand2 } from 'lucide-react';")

# 2. Add filter constants
filters = """
const FILTERS = [
  { name: 'Gốc', filter: 'none' },
  { name: 'Sáng', filter: 'brightness(1.1) saturate(1.2)' },
  { name: 'Xinh xẻo', filter: 'brightness(1.05) saturate(1.3) contrast(0.95)' },
  { name: 'Cổ điển', filter: 'sepia(0.5) contrast(1.1)' },
  { name: 'Phim', filter: 'grayscale(0.3) contrast(1.2) brightness(0.9)' },
  { name: 'Trắng đen', filter: 'grayscale(1)' },
];
"""
content = content.replace("export default function PreviewModal", filters + "\nexport default function PreviewModal")

# 3. Add states
new_states = """  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState(FILTERS[0]);
"""
content = content.replace("  const [caption, setCaption] = useState('');\n  const [isUploading, setIsUploading] = useState(false);", new_states)

# 4. Modify sendPhoto to apply filter via Canvas
old_sendPhoto = """  const sendPhoto = async () => {
    setIsUploading(true);
    try {
      const fileName = `locket-${userId}-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('avatars') // Using avatars bucket for now
        .upload(fileName, photoFile, { contentType: photoFile.type });
        
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      await onSend(data.publicUrl, caption);
      onClose();
    } catch (err: any) {
      alert('Lỗi khi gửi ảnh: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };"""

new_sendPhoto = """  const sendPhoto = async () => {
    setIsUploading(true);
    try {
      let finalFile: File | Blob = photoFile;
      
      // Nếu có filter, vẽ lại ảnh qua Canvas để lưu filter vào ảnh thật
      if (selectedFilter.filter !== 'none') {
        const img = new Image();
        img.src = objectUrl;
        await new Promise((resolve) => { img.onload = resolve; });
        
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.filter = selectedFilter.filter;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          finalFile = await new Promise<Blob>((resolve) => {
            canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.9);
          });
        }
      }

      const fileName = `locket-${userId}-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('avatars') // Using avatars bucket for now
        .upload(fileName, finalFile, { contentType: 'image/jpeg' });
        
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      await onSend(data.publicUrl, caption);
      onClose();
    } catch (err: any) {
      alert('Lỗi khi gửi ảnh: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };"""
content = content.replace(old_sendPhoto, new_sendPhoto)

# 5. Modify rendering
old_render = """      <div className="relative w-full max-w-md aspect-[3/4] bg-gray-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        <img src={objectUrl} alt="Captured" className="w-full h-full object-cover" />
        
        {/* Caption Overlay */}
        <div className="absolute bottom-20 left-0 right-0 px-6">"""

new_render = """      {/* Filter Options */}
      <div className="absolute top-20 left-0 right-0 px-4 z-20 flex gap-2 overflow-x-auto no-scrollbar py-2">
        {FILTERS.map(f => (
          <button 
            key={f.name}
            onClick={() => setSelectedFilter(f)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium backdrop-blur-md transition-all ${
              selectedFilter.name === f.name 
                ? 'bg-pink-500 text-white shadow-lg scale-105 border border-pink-400' 
                : 'bg-black/30 text-white border border-white/20 hover:bg-black/50'
            }`}
          >
            {f.name}
          </button>
        ))}
      </div>

      <div className="relative w-full max-w-md aspect-[3/4] bg-gray-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        <img 
          src={objectUrl} 
          alt="Captured" 
          className="w-full h-full object-cover transition-all duration-300"
          style={{ filter: selectedFilter.filter !== 'none' ? selectedFilter.filter : undefined }} 
        />
        
        {/* Caption Overlay */}
        <div className="absolute bottom-20 left-0 right-0 px-6">"""
content = content.replace(old_render, new_render)

with open('src/components/locket/PreviewModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
