import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex h-[100dvh] w-full items-center justify-center bg-gradient-to-br from-pink-50 via-white to-teal-50">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-20 h-20 animate-pulse drop-shadow-xl">
          <img src="/apple-icon.png" alt="Loading" className="w-full h-full object-contain opacity-50" />
        </div>
        <Loader2 className="w-6 h-6 animate-spin text-pink-400" />
        <p className="text-sm font-medium text-pink-600/70">Đang tải...</p>
      </div>
    </div>
  );
}
