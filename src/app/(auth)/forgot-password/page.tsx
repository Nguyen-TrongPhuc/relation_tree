'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Loader2, ArrowLeft, MailCheck } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center p-6 relative overflow-hidden bg-gradient-to-br from-pink-50 via-white to-teal-50">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      
      <div className="max-w-md w-full p-8 bg-white/60 backdrop-blur-xl rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] border border-white/50 space-y-8 relative z-10">
        <Link href="/login" className="inline-flex items-center text-sm font-semibold text-pink-600 hover:text-pink-800 transition">
          <ArrowLeft size={16} className="mr-1" /> Quay lại
        </Link>
        
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold text-pink-800 tracking-tight">Khôi Phục Mật Khẩu</h1>
          <p className="text-pink-600/80 text-sm">
            Nhập email của bạn để nhận liên kết đặt lại mật khẩu.
          </p>
        </div>

        {success ? (
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center shadow-inner">
              <MailCheck size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-800">Kiểm tra hộp thư</h3>
            <p className="text-gray-600 text-sm">
              Chúng tôi đã gửi một liên kết đặt lại mật khẩu đến email của bạn. Vui lòng kiểm tra (cả trong thư mục Spam).
            </p>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleReset}>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-semibold text-pink-800">Email của bạn</label>
              <input 
                id="email" 
                name="email" 
                type="email" 
                required 
                className="w-full p-3 border border-pink-100 rounded-xl bg-white/70 text-pink-900 placeholder-pink-700/40 focus:outline-none focus:ring-2 focus:ring-pink-400 transition"
                placeholder="you@example.com"
              />
            </div>
            
            {error && (
              <div className="p-3 bg-red-50/80 border border-red-100 text-red-600 text-sm rounded-xl text-center">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full flex items-center justify-center bg-gradient-to-r from-pink-400 to-purple-500 hover:from-pink-500 hover:to-purple-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-pink-500/30 transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:scale-100"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Gửi liên kết'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
