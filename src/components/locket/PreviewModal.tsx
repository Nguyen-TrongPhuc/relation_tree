'use client';

import React, { useState } from 'react';
import { X, Loader2, Send } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (imageUrl: string, caption: string) => Promise<void>;
  userId: string;
  photoFile: File | null;
}

export default function PreviewModal({ isOpen, onClose, onSend, userId, photoFile }: PreviewModalProps) {
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const supabase = createClient();

  if (!isOpen || !photoFile) return null;

  const objectUrl = React.useMemo(() => URL.createObjectURL(photoFile), [photoFile]);

  const sendPhoto = async () => {
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
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center animate-in fade-in duration-200">
      <div className="absolute top-0 left-0 right-0 p-4 safe-area-top flex justify-between items-center z-10 bg-gradient-to-b from-black/50 to-transparent">
        <button onClick={onClose} className="p-2 text-white bg-black/20 rounded-full backdrop-blur-md">
          <X size={24} />
        </button>
      </div>

      <div className="relative w-full max-w-md aspect-[3/4] bg-gray-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        <img src={objectUrl} alt="Captured" className="w-full h-full object-cover" />
        
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
