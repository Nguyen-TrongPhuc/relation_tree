'use client';

import React, { useState } from 'react';
import { X, Loader2, Send, Wand2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (imageUrl: string, caption: string) => Promise<void>;
  userId: string;
  photoFile: File | null;
}


const FILTERS = [
  { name: 'Gốc', filter: 'none' },
  { name: 'Sáng', filter: 'brightness(1.1) saturate(1.2)' },
  { name: 'Xinh xẻo', filter: 'brightness(1.05) saturate(1.3) contrast(0.95)' },
  { name: 'Cổ điển', filter: 'sepia(0.5) contrast(1.1)' },
  { name: 'Phim', filter: 'grayscale(0.3) contrast(1.2) brightness(0.9)' },
  { name: 'Trắng đen', filter: 'grayscale(1)' },
];

export default function PreviewModal({ isOpen, onClose, onSend, userId, photoFile }: PreviewModalProps) {
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState(FILTERS[0]);
  const [isFlipped, setIsFlipped] = useState(false);

  const supabase = createClient();

  const objectUrl = React.useMemo(() => photoFile ? URL.createObjectURL(photoFile) : "", [photoFile]);

  if (!isOpen || !photoFile) return null;

  const sendPhoto = async () => {
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
          if (isFlipped) {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
          }
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
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center animate-in fade-in duration-200">
      <div className="absolute top-0 left-0 right-0 p-4 safe-area-top flex justify-between items-center z-10 bg-gradient-to-b from-black/50 to-transparent">
        <button onClick={onClose} className="p-2 text-white bg-black/20 rounded-full backdrop-blur-md">
          <X size={24} />
        </button>
      </div>

      {/* Filter Options */}
      <div className="absolute top-20 left-0 right-0 px-4 z-20 flex gap-2 overflow-x-auto no-scrollbar py-2">
        <button 
          onClick={() => setIsFlipped(!isFlipped)}
          className="whitespace-nowrap px-4 py-2 mr-2 rounded-full text-sm font-medium backdrop-blur-md transition-all bg-gray-800 text-white border border-gray-600 hover:bg-gray-700"
        >
          {isFlipped ? 'Khôi phục' : 'Lật ảnh ↔️'}
        </button>
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
          style={{ filter: selectedFilter.filter !== 'none' ? selectedFilter.filter : undefined, transform: isFlipped ? 'scaleX(-1)' : 'none' }} 
        />
        
        {/* Caption Overlay */}
        <div className="absolute bottom-20 left-0 right-0 px-6">
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Thêm ghi chú..."
            className="w-full bg-black/40 text-white placeholder-white/70 px-4 py-3 rounded-xl border border-white/20 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-pink-500 text-center text-lg font-medium shadow-lg"
          />
        </div>

        <div className="absolute bottom-6 left-0 right-0 flex justify-center px-10">
          <button 
            onClick={sendPhoto}
            disabled={isUploading}
            className="flex items-center justify-center w-full gap-2 p-4 bg-pink-500 text-white rounded-full shadow-lg font-bold disabled:opacity-50 active:scale-95 transition-transform"
          >
            {isUploading ? <Loader2 className="animate-spin" size={24} /> : <Send size={24} />}
            {isUploading ? 'Đang gửi...' : 'Gửi cho người ấy'}
          </button>
        </div>
      </div>
    </div>
  );
}
