'use client';

import React, { useRef, useState, useCallback } from 'react';
import { Camera, X, RefreshCcw, Loader2, Send } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (imageUrl: string) => Promise<void>;
  userId: string;
}

export default function CameraModal({ isOpen, onClose, onSend, userId }: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [photo, setPhoto] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const supabase = createClient();

  const startCamera = useCallback(async (mode: 'user' | 'environment') => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode },
        audio: false,
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err) {
      console.error('Không thể truy cập camera', err);
      alert('Không thể truy cập camera. Vui lòng cấp quyền trong cài đặt trình duyệt.');
    }
  }, [stream]);

  // Khởi động camera khi mở modal
  React.useEffect(() => {
    if (isOpen && !photo) {
      startCamera(facingMode);
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen, facingMode]);

  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Lật ảnh nếu dùng camera trước
        if (facingMode === 'user') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setPhoto(dataUrl);
        // Tắt camera tạm thời
        if (stream) {
          stream.getTracks().forEach(t => t.stop());
        }
      }
    }
  };

  const retake = () => {
    setPhoto(null);
    startCamera(facingMode);
  };

  const sendPhoto = async () => {
    if (!photo) return;
    setIsUploading(true);
    
    try {
      // Chuyển DataURL thành Blob
      const res = await fetch(photo);
      const blob = await res.blob();
      
      const fileName = `locket-${userId}-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('avatars') // Dùng tạm bucket avatars để chứa ảnh
        .upload(fileName, blob, { contentType: 'image/jpeg' });
        
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      await onSend(data.publicUrl);
      onClose();
    } catch (err: any) {
      alert('Lỗi khi gửi ảnh: ' + err.message);
    } finally {
      setIsUploading(false);
      setPhoto(null);
    }
  };

  const handleClose = () => {
    if (stream) stream.getTracks().forEach(t => t.stop());
    setPhoto(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center animate-in fade-in duration-200">
      <div className="absolute top-0 left-0 right-0 p-4 safe-area-top flex justify-between items-center z-10 bg-gradient-to-b from-black/50 to-transparent">
        <button onClick={handleClose} className="p-2 text-white bg-black/20 rounded-full backdrop-blur-md">
          <X size={24} />
        </button>
        {!photo && (
          <button onClick={switchCamera} className="p-2 text-white bg-black/20 rounded-full backdrop-blur-md">
            <RefreshCcw size={24} />
          </button>
        )}
      </div>

      <div className="relative w-full max-w-md aspect-[3/4] bg-gray-900 rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center">
        {!photo ? (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`} 
            />
            <div className="absolute bottom-8 left-0 right-0 flex justify-center">
              <button 
                onClick={takePhoto}
                className="w-20 h-20 rounded-full border-4 border-white/50 flex items-center justify-center active:scale-95 transition-transform"
              >
                <div className="w-16 h-16 bg-white rounded-full"></div>
              </button>
            </div>
          </>
        ) : (
          <>
            <img src={photo} alt="Captured" className="w-full h-full object-cover" />
            <div className="absolute bottom-8 left-0 right-0 flex justify-between px-10">
              <button 
                onClick={retake}
                disabled={isUploading}
                className="p-4 bg-gray-800/80 text-white rounded-full backdrop-blur-md font-medium disabled:opacity-50"
              >
                Chụp lại
              </button>
              <button 
                onClick={sendPhoto}
                disabled={isUploading}
                className="flex items-center gap-2 p-4 bg-pink-500 text-white rounded-full shadow-lg font-bold disabled:opacity-50"
              >
                {isUploading ? <Loader2 className="animate-spin" size={24} /> : <Send size={24} />}
                Gửi ảnh
              </button>
            </div>
          </>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
