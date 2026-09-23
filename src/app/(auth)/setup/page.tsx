import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { setProfile, sendPairRequest, acceptPairRequest, cancelOrRejectRequest, logout } from './actions';

export default async function SetupPage(props: {
  searchParams: Promise<{ error?: string }>
}) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, display_name')
    .eq('id', user.id)
    .single();

  // BƯỚC 1: Nếu chưa có username -> Yêu cầu tạo
  if (!profile?.username) {
    return (
      <main className="flex min-h-[100dvh] flex-col items-center justify-center p-6 relative overflow-hidden bg-gradient-to-br from-pink-50 via-white to-teal-50">
        {/* Decorative Blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

        <div className="max-w-md w-full p-8 bg-white/60 backdrop-blur-xl rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] border border-white/50 space-y-6 relative z-10">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-pink-800 tracking-tight">Tạo Hồ Sơ Của Bạn</h1>
            <p className="text-pink-600/80 mt-2 text-sm">
              Chọn một tên người dùng độc nhất để nửa kia có thể tìm thấy bạn.
            </p>
          </div>

          {searchParams?.error && (
            <div className="bg-red-50/80 border border-red-100 text-red-600 p-3 rounded-xl text-sm text-center">
              {searchParams.error}
            </div>
          )}

          <form action={setProfile} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-pink-800">Tên Hiển Thị (Display Name)</label>
              <input name="displayName" type="text" required className="w-full p-3 border border-pink-100 rounded-xl bg-white/70 text-pink-900 placeholder-pink-700/40 focus:outline-none focus:ring-2 focus:ring-pink-400 transition" placeholder="VD: Bé Yêu" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-pink-800">Tên Người Dùng (Username)</label>
              <input name="username" type="text" required pattern="[a-zA-Z0-9_]+" className="w-full p-3 border border-pink-100 rounded-xl bg-white/70 text-pink-900 placeholder-pink-700/40 focus:outline-none focus:ring-2 focus:ring-pink-400 transition" placeholder="VD: beyeu_123" />
            </div>
            <button type="submit" className="w-full bg-gradient-to-r from-pink-400 to-purple-500 hover:from-pink-500 hover:to-purple-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-pink-500/30 transition-all transform hover:scale-[1.02] active:scale-95 mt-6">
              Xác Nhận
            </button>
          </form>

          <form action={logout}>
             <button type="submit" className="w-full text-pink-600 hover:text-pink-800 hover:underline text-sm font-medium text-center mt-4">
               Đăng xuất
             </button>
          </form>
        </div>
      </main>
    );
  }

  // BƯỚC 2: Kiểm tra trạng thái ghép đôi
  const { data: friendships } = await supabase
    .from('friendships')
    .select(`
      id, status, sender_id, receiver_id,
      sender:profiles!friendships_sender_id_fkey(username, display_name),
      receiver:profiles!friendships_receiver_id_fkey(username, display_name)
    `)
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

  const accepted = friendships?.find(f => f.status === 'accepted');
  if (accepted) {
    redirect('/'); // Đã ghép đôi xong, vào trang chủ
  }

  const sentPending = friendships?.find(f => f.status === 'pending' && f.sender_id === user.id);
  const receivedPending = friendships?.find(f => f.status === 'pending' && f.receiver_id === user.id);

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center p-6 relative overflow-hidden bg-gradient-to-br from-pink-50 via-white to-teal-50">
      {/* Decorative Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

      <div className="max-w-md w-full p-8 bg-white/60 backdrop-blur-xl rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] border border-white/50 space-y-6 relative z-10">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-pink-800 tracking-tight">Ghép Đôi</h1>
          <p className="text-pink-600/80 mt-2 text-sm">
            Xin chào <span className="font-semibold text-pink-700">{profile.display_name}</span>! Hãy tìm và kết nối với người ấy nhé.
          </p>
          <p className="text-xs font-bold bg-pink-100 text-pink-800 inline-block px-3 py-1.5 rounded-full mt-3 shadow-sm border border-pink-200">
            Username của bạn: {profile.username}
          </p>
        </div>

        {searchParams?.error && (
          <div className="bg-red-50/80 border border-red-100 text-red-600 p-3 rounded-xl text-sm text-center">
            {searchParams.error}
          </div>
        )}

        {/* TH1: Nhận được lời mời */}
        {receivedPending && (
          <div className="p-5 border border-pink-200 bg-pink-50/80 backdrop-blur-sm rounded-2xl space-y-4 shadow-sm">
            <p className="text-sm text-center text-pink-900">
              <strong className="text-pink-700">{(receivedPending.sender as any).display_name}</strong> (@{(receivedPending.sender as any).username}) muốn cùng bạn chăm sóc cây tình yêu!
            </p>
            <div className="flex gap-3">
              <form action={acceptPairRequest} className="flex-1">
                <input type="hidden" name="requestId" value={receivedPending.id} />
                <button type="submit" className="w-full bg-gradient-to-r from-pink-400 to-purple-500 hover:from-pink-500 hover:to-purple-600 text-white py-2.5 rounded-xl font-bold shadow-md transition-all active:scale-95">Đồng Ý</button>
              </form>
              <form action={cancelOrRejectRequest} className="flex-1">
                <input type="hidden" name="requestId" value={receivedPending.id} />
                <button type="submit" className="w-full bg-white hover:bg-red-50 text-red-500 border border-red-200 py-2.5 rounded-xl font-bold shadow-sm transition-all active:scale-95">Từ Chối</button>
              </form>
            </div>
          </div>
        )}

        {/* TH2: Đã gửi lời mời, chờ phản hồi */}
        {sentPending && (
          <div className="p-5 border border-pink-200 bg-pink-50/80 backdrop-blur-sm rounded-2xl space-y-4 text-center shadow-sm">
            <p className="text-sm text-pink-900">
              Đang chờ <strong className="text-pink-700">{(sentPending.receiver as any).display_name}</strong> (@{(sentPending.receiver as any).username}) đồng ý...
            </p>
            <form action={cancelOrRejectRequest}>
              <input type="hidden" name="requestId" value={sentPending.id} />
              <button type="submit" className="text-sm font-medium text-red-500 hover:text-red-600 hover:underline">Hủy yêu cầu</button>
            </form>
          </div>
        )}

        {/* TH3: Chưa gửi, chưa nhận -> Form tìm kiếm */}
        {!sentPending && !receivedPending && (
          <form action={sendPairRequest} className="space-y-4 pt-4 border-t border-pink-100/50">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-pink-800">Tìm kiếm bằng Username</label>
              <div className="flex gap-2">
                <input name="targetUsername" type="text" required className="flex-1 p-3 border border-pink-100 rounded-xl bg-white/70 text-pink-900 placeholder-pink-700/40 focus:outline-none focus:ring-2 focus:ring-pink-400 transition" placeholder="VD: nguoiyeu_123" />
                <button type="submit" className="bg-gradient-to-r from-pink-400 to-purple-500 hover:from-pink-500 hover:to-purple-600 text-white px-5 rounded-xl font-bold shadow-md shadow-pink-500/20 transition-all transform hover:scale-[1.02] active:scale-95 whitespace-nowrap">
                  Gửi Yêu Cầu
                </button>
              </div>
            </div>
          </form>
        )}

        <form action={logout}>
           <button type="submit" className="w-full text-pink-600 hover:text-pink-800 hover:underline text-sm font-medium text-center pt-2">
             Đăng xuất
           </button>
        </form>
      </div>
    </main>
  );
}
