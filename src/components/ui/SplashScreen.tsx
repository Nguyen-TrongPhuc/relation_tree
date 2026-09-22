'use client';
import { useEffect, useState } from 'react';

export default function SplashScreen() {
  const [show, setShow] = useState(true);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    // Đợi 1.5 giây để tạo cảm giác màn hình khởi động
    const timer1 = setTimeout(() => {
      setFade(true);
    }, 1500);

    // Xóa hẳn khỏi DOM sau khi hiệu ứng mờ dần kết thúc
    const timer2 = setTimeout(() => {
      setShow(false);
    }, 2000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  if (!show) return null;

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-teal-50 transition-opacity duration-500 ${fade ? 'opacity-0' : 'opacity-100'}`}
    >
      <div className="relative w-32 h-32 mb-6 animate-pulse rounded-[32px] overflow-hidden shadow-2xl shadow-teal-200">
        <img 
          src="/apple-icon.jpg" 
          alt="Cây Tình Yêu" 
          className="w-full h-full object-cover"
        />
      </div>
      <h1 className="text-3xl font-bold text-teal-800 tracking-wider">Cây Tình Yêu</h1>
      <p className="text-teal-600 mt-3 text-sm animate-bounce">Đang vào khu vườn...</p>
    </div>
  );
}
