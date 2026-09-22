'use client';
import { useEffect, useState } from 'react';

export default function SplashScreen() {
  const [show, setShow] = useState(true);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    // Tăng thời gian hiển thị lên 3.5 giây để ngắm nền động
    const timer1 = setTimeout(() => {
      setFade(true);
    }, 3500);

    // Xóa hẳn khỏi DOM sau khi hiệu ứng mờ dần (500ms) kết thúc
    const timer2 = setTimeout(() => {
      setShow(false);
    }, 4000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  if (!show) return null;

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-animate transition-opacity duration-500 ${fade ? 'opacity-0' : 'opacity-100'}`}
    >
      <div className="relative w-32 h-32 mb-6 animate-pulse rounded-[32px] overflow-hidden shadow-2xl shadow-pink-300 border-2 border-white/50">
        <img 
          src="/apple-icon.png" 
          alt="Cây Tình Yêu" 
          className="w-full h-full object-cover"
        />
      </div>
      <h1 className="text-3xl font-bold text-white drop-shadow-md tracking-wider">Cây Tình Yêu</h1>
      <p className="text-white/80 mt-3 text-sm font-medium animate-bounce drop-shadow-sm">Đang vào khu vườn...</p>
    </div>
  );
}
