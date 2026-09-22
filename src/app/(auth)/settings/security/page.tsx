'use client';

import { useState } from 'react';
import { updatePassword } from './actions';
import Link from 'next/link';

export default function SecurityPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    const formData = new FormData(e.currentTarget);
    const res = await updatePassword(formData);
    
    if (res?.error) setError(res.error);
    if (res?.success) setSuccess(res.success);
    
    setLoading(false);
  }

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center p-6 relative overflow-hidden bg-gradient-to-br from-[#fdf2f8] via-pink-50 to-pink-100">
      {/* Decorative Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

      <div className="max-w-md w-full p-8 bg-white/60 backdrop-blur-xl rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] border border-white/50 space-y-6 relative z-10">
        <div className="flex justify-between items-center mb-6">
          <Link href="/" className="text-pink-600 hover:text-pink-800 text-sm font-semibold transition">
            &larr; Về Trang Chủ
          </Link>
          <Link href="/settings/profile" className="text-pink-600 hover:text-pink-800 text-sm font-semibold transition">
            Sửa Hồ Sơ
          </Link>
        </div>

        <h1 className="text-3xl font-extrabold text-pink-800 tracking-tight text-center mb-6">Đổi Mật Khẩu</h1>
        
        {error && <div className="p-3 mb-4 bg-red-50/80 border border-red-100 text-red-600 text-sm rounded-xl text-center">{error}</div>}
        {success && <div className="p-3 mb-4 bg-pink-50/80 border border-pink-200 text-pink-700 text-sm rounded-xl text-center font-medium">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-pink-800 mb-1">Mật khẩu mới</label>
            <input
              type="password"
              name="password"
              required
              className="w-full p-3 border border-pink-100 rounded-xl bg-white/70 text-pink-900 placeholder-pink-700/40 focus:outline-none focus:ring-2 focus:ring-pink-400 transition"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-pink-800 mb-1">Xác nhận mật khẩu mới</label>
            <input
              type="password"
              name="confirmPassword"
              required
              className="w-full p-3 border border-pink-100 rounded-xl bg-white/70 text-pink-900 placeholder-pink-700/40 focus:outline-none focus:ring-2 focus:ring-pink-400 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-pink-400 to-purple-500 hover:from-pink-500 hover:to-purple-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-pink-500/30 transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 mt-4"
          >
            {loading ? 'Đang cập nhật...' : 'Cập nhật Mật khẩu'}
          </button>
        </form>
      </div>
    </main>
  );
}
