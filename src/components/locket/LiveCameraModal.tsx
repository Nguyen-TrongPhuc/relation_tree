'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, RefreshCcw, Loader2, Zap } from 'lucide-react';

interface LiveCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

export default function LiveCameraModal({ isOpen, onClose, onCapture }: LiveCameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const startCamera = async (mode: 'user' | 'environment') => {
    setIsLoading(true);
    setError(null);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1080 },
          height: { ideal: 1440 }
        },
        audio: false,
      });
      setStream(newStream);
      streamRef.current = newStream;
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err: any) {
      setError('Không thể mở camera: ' + err.message + '. Hãy chắc chắn bạn đã cấp quyền sử dụng máy ảnh.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      startCamera(facingMode);
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        setStream(null);
        streamRef.current = null;
      }
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen]);

  const toggleFlash = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    const capabilities = track.getCapabilities ? track.getCapabilities() : {};
    if (capabilities.torch !== undefined) {
      try {
        await track.applyConstraints({ advanced: [{ torch: !isFlashOn }] });
        setIsFlashOn(!isFlashOn);
      } catch (e) {
        console.error(e);
      }
    } else {
      alert("Trình duyệt web trên điện thoại của bạn (đặc biệt là iOS Safari) không hỗ trợ bật đèn Flash thông qua Web. Đây là giới hạn bảo mật của trình duyệt, không phải lỗi của ứng dụng!");
    }
  };

  const toggleCamera = () => {
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newMode);
    startCamera(newMode);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const targetRatio = 1 / 1;
    const videoRatio = video.videoWidth / video.videoHeight;
    
    let drawWidth = video.videoWidth;
    let drawHeight = video.videoHeight;
    let offsetX = 0;
    let offsetY = 0;

    if (videoRatio > targetRatio) {
      drawWidth = video.videoHeight * targetRatio;
      offsetX = (video.videoWidth - drawWidth) / 2;
    } else {
      drawHeight = video.videoWidth / targetRatio;
      offsetY = (video.videoHeight - drawHeight) / 2;
    }

    canvas.width = drawWidth;
    canvas.height = drawHeight;

    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight, 0, 0, drawWidth, drawHeight);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
        onCapture(file);
      }
    }, 'image/jpeg', 0.9);
  };

  if (!isOpen) return null;

  return (
    <div className="relative w-full h-[100dvh] min-h-[100dvh] bg-black flex flex-col items-center justify-start pt-[12vh] z-10">
      <div className="absolute top-0 left-0 right-0 p-6 safe-area-top flex justify-between items-center z-20 bg-gradient-to-b from-black/60 via-black/20 to-transparent">
        <div className="text-white font-bold text-lg drop-shadow-md">Locket</div>
        <button onClick={toggleCamera} className="p-3 text-white bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-xl transition-all active:scale-95 shadow-lg">
          <RefreshCcw size={22} />
        </button>
      </div>

      <div className="relative w-[90%] max-w-md aspect-[4/5] flex items-center justify-center bg-gray-900 rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white/10 ring-4 ring-black/20">
        {isLoading && <Loader2 className="absolute text-white animate-spin z-10" size={40} />}
        {error && <p className="absolute text-red-500 z-10 px-6 text-center">{error}</p>}
        
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transition-transform duration-300 ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
        />
        
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="absolute bottom-24 left-0 right-0 flex justify-center z-20">
        <button 
          onClick={capturePhoto}
          disabled={!stream || isLoading}
          className="w-20 h-20 rounded-full border-[5px] border-white/30 bg-transparent flex items-center justify-center active:scale-90 transition-all duration-200 disabled:opacity-50 group hover:border-white/50"
        >
          <div className="w-[60px] h-[60px] rounded-full bg-white shadow-[0_0_20px_rgba(255,255,255,0.4)] group-active:scale-95 transition-transform"></div>
        </button>
      </div>
      
      <div 
        className="absolute bottom-6 left-0 right-0 flex flex-col items-center justify-center z-20 text-white/70 animate-bounce cursor-pointer"
        onClick={() => {
          const container = document.querySelector('main');
          if (container) container.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
        }}
      >
        <span className="text-xs font-medium mb-1">Lướt xuống dòng thời gian</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
      </div>
    </div>
  );
}
