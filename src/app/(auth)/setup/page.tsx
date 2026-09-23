'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';

export default function SetupPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [friendships, setFriendships] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    loadData();
  }, [user, authLoading]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    
    // Load profile
    const { data: pData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    setProfile(pData);

    if (pData?.username) {
      // Load friendships
      const { data: fData } = await supabase
        .from('friendships')
        .select(`
          id, status, sender_id, receiver_id,
          sender:profiles!friendships_sender_id_fkey(username, display_name),
          receiver:profiles!friendships_receiver_id_fkey(username, display_name)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
      
      setFriendships(fData || []);
      
      if (fData?.find(f => f.status === 'accepted')) {
        window.location.href = '/';
      }
    }
    setLoading(false);
  };

  const handleSetProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const displayName = formData.get('displayName') as string;
    const username = formData.get('username') as string;

    const { data: existing } = await supabase.from('profiles').select('id').eq('username', username).maybeSingle();
    if (existing && existing.id !== user.id) {
      setError('Tên người dùng đã tồn tại. Vui lòng chọn tên khác.');
      setLoading(false);
      return;
    }

    await supabase.from('profiles').update({
      display_name: displayName,
      username: username,
    }).eq('id', user.id);

    await loadData();
  };

  const handleSendRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const targetUsername = formData.get('targetUsername') as string;

    if (targetUsername === profile?.username) {
      setError('Bạn không thể tự kết nối với chính mình!');
      setLoading(false);
      return;
    }

    const { data: targetUser } = await supabase.from('profiles').select('id').eq('username', targetUsername).maybeSingle();
    
    if (!targetUser) {
      setError('Không tìm thấy người dùng này!');
      setLoading(false);
      return;
    }

    const { data: existingFriendship } = await supabase
      .from('friendships')
      .select('id')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${targetUser.id}),and(sender_id.eq.${targetUser.id},receiver_id.eq.${user.id})`)
      .maybeSingle();

    if (existingFriendship) {
      setError('Đã có lời mời hoặc đã kết nối với người này!');
      setLoading(false);
      return;
    }

    await supabase.from('friendships').insert({
      sender_id: user.id,
      receiver_id: targetUser.id,
      status: 'pending'
    });

    await loadData();
  };

  const handleAcceptRequest = async (requestId: string) => {
    setError(null);
    setLoading(true);
    await supabase.from('friendships').update({ status: 'accepted' }).eq('id', requestId);
    window.location.href = '/';
  };

  const handleCancelRequest = async (requestId: string) => {
    setError(null);
    setLoading(true);
    await supabase.from('friendships').delete().eq('id', requestId);
    await loadData();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  if (authLoading || loading) {
    return (
      <main className="flex h-screen items-center justify-center bg-pink-50">
        <Loader2 className="w-8 h-8 animate-spin text-pink-400" />
      </main>
    );
  }

  // BƯỚC 1: Tạo profile
  if (!profile?.username) {
    return (
      <main className="flex min-h-[100dvh] flex-col items-center justify-center p-6 relative overflow-hidden bg-gradient-to-br from-pink-50 via-white to-teal-50">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

        <div className="max-w-md w-full p-8 bg-white/60 backdrop-blur-xl rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] border border-white/50 space-y-6 relative z-10">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-pink-800 tracking-tight">Tạo Hồ Sơ Của Bạn</h1>
            <p className="text-pink-600/80 mt-2 text-sm">
              Chọn một tên người dùng độc nhất để nửa kia có thể tìm thấy bạn.
            </p>
          </div>

          {error && <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl text-sm text-center">{error}</div>}

          <form onSubmit={handleSetProfile} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-pink-800">Tên Hiển Thị (Display Name)</label>
              <input name="displayName" type="text" required className="w-full p-3 border border-pink-100 rounded-xl bg-white/70 text-pink-900 placeholder-pink-700/40 focus:outline-none focus:ring-2 focus:ring-pink-400" placeholder="VD: Bé Yêu" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-pink-800">Tên Người Dùng (Username)</label>
              <input name="username" type="text" required pattern="[a-zA-Z0-9_]+" className="w-full p-3 border border-pink-100 rounded-xl bg-white/70 text-pink-900 placeholder-pink-700/40 focus:outline-none focus:ring-2 focus:ring-pink-400" placeholder="VD: beyeu_123" />
            </div>
            <button type="submit" className="w-full bg-gradient-to-r from-pink-400 to-purple-500 text-white py-3 rounded-xl font-bold mt-6">Xác Nhận</button>
          </form>

          <button onClick={handleLogout} className="w-full text-pink-600 hover:underline text-sm font-medium mt-4">Đăng xuất</button>
        </div>
      </main>
    );
  }

  // BƯỚC 2: Ghép đôi
  const sentPending = friendships.find(f => f.status === 'pending' && f.sender_id === user.id);
  const receivedPending = friendships.find(f => f.status === 'pending' && f.receiver_id === user.id);

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center p-6 relative overflow-hidden bg-gradient-to-br from-pink-50 via-white to-teal-50">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

      <div className="max-w-md w-full p-8 bg-white/60 backdrop-blur-xl rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] border border-white/50 space-y-6 relative z-10">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-pink-800 tracking-tight">Ghép Đôi</h1>
          <p className="text-pink-600/80 mt-2 text-sm">Xin chào <span className="font-semibold text-pink-700">{profile.display_name}</span>!</p>
          <p className="text-xs font-bold bg-pink-100 text-pink-800 inline-block px-3 py-1.5 rounded-full mt-3 shadow-sm border border-pink-200">
            Username của bạn: {profile.username}
          </p>
        </div>

        {error && <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl text-sm text-center">{error}</div>}

        {receivedPending && (
          <div className="p-5 border border-pink-200 bg-pink-50/80 rounded-2xl space-y-4 shadow-sm text-center">
            <p className="text-sm text-pink-900">
              <strong className="text-pink-700">{receivedPending.sender.display_name}</strong> (@{receivedPending.sender.username}) muốn cùng bạn chăm sóc cây tình yêu!
            </p>
            <div className="flex gap-3">
              <button onClick={() => handleAcceptRequest(receivedPending.id)} className="flex-1 bg-gradient-to-r from-pink-400 to-purple-500 text-white py-2.5 rounded-xl font-bold">Đồng Ý</button>
              <button onClick={() => handleCancelRequest(receivedPending.id)} className="flex-1 bg-white text-red-500 border border-red-200 py-2.5 rounded-xl font-bold">Từ Chối</button>
            </div>
          </div>
        )}

        {sentPending && (
          <div className="p-5 border border-pink-200 bg-pink-50/80 rounded-2xl space-y-4 text-center shadow-sm">
            <p className="text-sm text-pink-900">
              Đang chờ <strong className="text-pink-700">{sentPending.receiver.display_name}</strong> (@{sentPending.receiver.username}) đồng ý...
            </p>
            <button onClick={() => handleCancelRequest(sentPending.id)} className="text-sm font-medium text-red-500">Hủy yêu cầu</button>
          </div>
        )}

        {!sentPending && !receivedPending && (
          <form onSubmit={handleSendRequest} className="space-y-4 pt-4 border-t border-pink-100/50">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-pink-800">Tìm kiếm bằng Username</label>
              <div className="flex gap-2">
                <input name="targetUsername" type="text" required className="flex-1 p-3 border border-pink-100 rounded-xl bg-white/70 text-pink-900 focus:ring-2 focus:ring-pink-400" placeholder="VD: nguoiyeu_123" />
                <button type="submit" className="bg-gradient-to-r from-pink-400 to-purple-500 text-white px-5 rounded-xl font-bold">Gửi Yêu Cầu</button>
              </div>
            </div>
          </form>
        )}

        <button onClick={handleLogout} className="w-full text-pink-600 hover:underline text-sm font-medium pt-2">Đăng xuất</button>
      </div>
    </main>
  );
}
