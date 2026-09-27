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
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFlashOn, setIsFlashOn] = useState(false);

  const startCamera = async (mode: 'user' | 'environment') => {
    setIsLoading(true);
    setError(null);
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
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
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
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
      alert("Trình duyệt/thiết bị của bạn không hỗ trợ bật Flash!");
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
    <div className="relative w-full h-[100dvh] min-h-[100dvh] bg-black flex flex-col items-center justify-center z-10">
      <div className="absolute top-0 left-0 right-0 p-4 safe-area-top flex justify-end items-center z-20 bg-gradient-to-b from-black/50 to-transparent gap-4">
        <button onClick={toggleFlash} className={`p-2 rounded-full backdrop-blur-md ${isFlashOn ? 'bg-yellow-400 text-black' : 'text-white bg-black/20'}`}>
          <Zap size={24} />
        </button>
        <button onClick={toggleCamera} className="p-2 text-white bg-black/20 rounded-full backdrop-blur-md">
          <RefreshCcw size={24} />
        </button>
      </div>

      <div className="relative w-full max-w-md aspect-square flex items-center justify-center bg-gray-900 rounded-3xl overflow-hidden shadow-2xl">
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

      <div className="absolute bottom-20 left-0 right-0 flex justify-center z-20">
        <button 
          onClick={capturePhoto}
          disabled={!stream || isLoading}
          className="w-20 h-20 rounded-full border-4 border-white/50 bg-white/20 flex items-center justify-center active:scale-90 transition-transform disabled:opacity-50"
        >
          <div className="w-16 h-16 rounded-full bg-white shadow-lg"></div>
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
