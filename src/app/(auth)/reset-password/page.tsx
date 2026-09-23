'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2, CheckCircle2 } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    // Listen for auth state change to ensure session is available for resetting
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      if (event === 'PASSWORD_RECOVERY') {
        // Ready to reset
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: password
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
      setTimeout(() => {
        router.push('/');
      }, 2000);
    }
  };

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center p-6 relative overflow-hidden bg-gradient-to-br from-teal-50 via-white to-pink-50">
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      
      <div className="max-w-md w-full p-8 bg-white/60 backdrop-blur-xl rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] border border-white/50 space-y-8 relative z-10">
        
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold text-teal-800 tracking-tight">Tạo Mật Khẩu Mới</h1>
          <p className="text-teal-600/80 text-sm">
            Vui lòng nhập mật khẩu mới của bạn.
          </p>
        </div>

        {success ? (
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center shadow-inner">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-800">Thành công!</h3>
            <p className="text-gray-600 text-sm">
              Mật khẩu đã được đặt lại thành công. Đang chuyển hướng về trang chủ...
            </p>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleUpdate}>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-semibold text-teal-800">Mật khẩu mới</label>
              <input 
                id="password" 
                name="password" 
                type="password" 
                required 
                className="w-full p-3 border border-teal-100 rounded-xl bg-white/70 text-teal-900 placeholder-teal-700/40 focus:outline-none focus:ring-2 focus:ring-teal-400 transition"
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-semibold text-teal-800">Nhập lại mật khẩu</label>
              <input 
                id="confirmPassword" 
                name="confirmPassword" 
                type="password" 
                required 
                className="w-full p-3 border border-teal-100 rounded-xl bg-white/70 text-teal-900 placeholder-teal-700/40 focus:outline-none focus:ring-2 focus:ring-teal-400 transition"
                placeholder="••••••••"
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
              className="w-full flex items-center justify-center bg-gradient-to-r from-teal-400 to-green-500 hover:from-teal-500 hover:to-green-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-teal-500/30 transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:scale-100"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Lưu Mật Khẩu'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
