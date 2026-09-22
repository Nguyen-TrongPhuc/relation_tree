import { signup } from '../actions'
import Link from 'next/link'

export default async function RegisterPage(props: {
  searchParams: Promise<{ error?: string }>
}) {
  const searchParams = await props.searchParams;
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center p-6 relative overflow-hidden bg-gradient-to-br from-[#e6e2d3] via-[#f0fdfa] to-[#ccfbf1]">
      {/* Decorative Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-cyan-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

      <div className="max-w-md w-full p-8 bg-white/60 backdrop-blur-xl rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] border border-white/50 space-y-8 relative z-10">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold text-teal-800 tracking-tight">Tạo Tài Khoản</h1>
          <p className="text-teal-600/80 text-sm">
            Bắt đầu gieo mầm cho thế giới nhỏ của hai bạn.
          </p>
        </div>

        <form className="space-y-5" action={signup}>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-semibold text-teal-800">Email</label>
            <input 
              id="email" 
              name="email" 
              type="email" 
              required 
              className="w-full p-3 border border-teal-100 rounded-xl bg-white/70 text-teal-900 placeholder-teal-700/40 focus:outline-none focus:ring-2 focus:ring-teal-400 transition"
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-semibold text-teal-800">Mật Khẩu</label>
            <input 
              id="password" 
              name="password" 
              type="password" 
              required 
              className="w-full p-3 border border-teal-100 rounded-xl bg-white/70 text-teal-900 placeholder-teal-700/40 focus:outline-none focus:ring-2 focus:ring-teal-400 transition"
              placeholder="••••••••"
            />
          </div>
          
          {searchParams?.error && (
            <div className="p-3 bg-red-50/80 border border-red-100 text-red-600 text-sm rounded-xl text-center">
              {searchParams.error}
            </div>
          )}

          <button type="submit" className="w-full bg-gradient-to-r from-teal-400 to-cyan-500 hover:from-teal-500 hover:to-cyan-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-teal-500/30 transition-all transform hover:scale-[1.02] active:scale-95">
            Đăng Ký
          </button>
        </form>

        <p className="text-sm text-center text-teal-700/80">
          Đã có tài khoản? <Link href="/login" className="font-bold text-teal-600 hover:text-teal-800 hover:underline">Đăng nhập</Link>
        </p>
      </div>
    </main>
  );
}
