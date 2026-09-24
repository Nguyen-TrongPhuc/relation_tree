'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';

export default function LoginPage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      router.replace('/');
      router.refresh();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Đăng nhập thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center p-6 relative overflow-hidden bg-gradient-to-br from-pink-50 via-white to-teal-50">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

      <div className="max-w-md w-full p-8 bg-white/60 backdrop-blur-xl rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] border border-white/50 space-y-8 relative z-10">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold text-pink-800 tracking-tight">Mừng Trở Lại</h1>
          <p className="text-pink-600/80 text-sm">
            Đăng nhập để vào không gian chung của hai bạn.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleLogin}>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-semibold text-pink-800">Email</label>
            <input 
              id="email" 
              name="email" 
              type="email" 
              required 
              className="w-full p-3 border border-pink-100 rounded-xl bg-white/70 text-pink-900 placeholder-pink-700/40 focus:outline-none focus:ring-2 focus:ring-pink-400 transition"
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-semibold text-pink-800">Mật Khẩu</label>
            <input 
              id="password" 
              name="password" 
              type="password" 
              required 
              className="w-full p-3 border border-pink-100 rounded-xl bg-white/70 text-pink-900 placeholder-pink-700/40 focus:outline-none focus:ring-2 focus:ring-pink-400 transition"
              placeholder="••••••••"
            />
          </div>
          
          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-sm font-semibold text-pink-600 hover:text-pink-800 transition">
              Quên mật khẩu?
            </Link>
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
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Đăng Nhập'}
          </button>
        </form>

        <p className="text-sm text-center text-pink-700/80">
          Chưa có tài khoản? <Link href="/register" className="font-bold text-pink-600 hover:text-pink-800 hover:underline">Đăng ký ngay</Link>
        </p>
      </div>
    </main>
  );
}
