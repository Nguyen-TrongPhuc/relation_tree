'use client';

import { useState, useEffect } from 'react';
import { updateProfile, updateBackground, logout } from './actions';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function ProfilePage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState({ displayName: '', avatarUrl: '', backgroundUrl: '' });
  const [partnerProfile, setPartnerProfile] = useState<{ displayName: string, avatarUrl: string } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Fetch current user
        const { data } = await supabase.from('profiles').select('display_name, avatar_url').eq('id', user.id).single();
        if (data) {
          setInitialData(prev => ({
            ...prev,
            displayName: data.display_name || '',
            avatarUrl: data.avatar_url || ''
          }));
          setPreviewUrl(data.avatar_url || null);
        }
        
        // Fetch partner & background
        const { data: pair } = await supabase
          .from('friendships')
          .select('sender_id, receiver_id, background_url')
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .eq('status', 'accepted')
          .single();
          
        if (pair) {
          const partnerId = pair.sender_id === user.id ? pair.receiver_id : pair.sender_id;
          const { data: pData } = await supabase.from('profiles').select('display_name, avatar_url').eq('id', partnerId).single();
          if (pData) {
            setPartnerProfile({
              displayName: pData.display_name || 'Người ấy',
              avatarUrl: pData.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${partnerId}`
            });
          }
        }
      }
    }
    load();
  }, [supabase]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    const formData = new FormData(e.currentTarget);
    const { data: { user } } = await supabase.auth.getUser();
    
    // Xử lý ảnh đại diện
    if (selectedFile) {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `avatar-${user?.id}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, selectedFile, { upsert: true });

      if (uploadError) {
        setError('Lỗi tải ảnh đại diện lên: ' + uploadError.message);
        setLoading(false);
        return;
      }
      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      formData.set('avatarUrl', publicUrlData.publicUrl);
    }

    const res = await updateProfile(formData);
    if (res?.error) setError(res.error);
    if (res?.success) setSuccess('Đã cập nhật thay đổi thành công!');
    
    setLoading(false);
  }

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center p-6 relative overflow-hidden bg-gradient-to-br from-[#fdf2f8] via-pink-50 to-pink-100">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

      <div className="max-w-md w-full p-8 bg-white/60 backdrop-blur-xl rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] border border-white/50 space-y-6 relative z-10">
        
        <div className="flex justify-between items-center mb-6">
          <Link href="/" className="text-pink-600 hover:text-pink-800 text-sm font-semibold transition">
            &larr; Về Cây Tình Yêu
          </Link>
          <Link href="/settings/security" className="text-pink-600 hover:text-pink-800 text-sm font-semibold transition">
            Đổi mật khẩu
          </Link>
        </div>

        <h1 className="text-3xl font-extrabold text-pink-800 tracking-tight text-center mb-2">Hồ Sơ Của Bạn</h1>
        
        {/* Đối phương */}
        {partnerProfile && (
          <div className="flex items-center justify-center space-x-3 bg-pink-50/60 p-3 rounded-2xl border border-pink-100 mb-4 shadow-sm">
            <span className="text-sm font-semibold text-pink-700 whitespace-nowrap">Người yêu:</span>
            <img src={partnerProfile.avatarUrl} alt="Partner Avatar" className="w-8 h-8 rounded-full border border-pink-200 object-cover" />
            <span className="text-sm font-medium text-pink-900 truncate">{partnerProfile.displayName}</span>
          </div>
        )}

        {error && <div className="p-3 mb-4 bg-red-50/80 border border-red-100 text-red-600 text-sm rounded-xl text-center">{error}</div>}
        {success && <div className="p-3 mb-4 bg-pink-50/80 border border-pink-200 text-pink-700 text-sm rounded-xl text-center font-medium">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="flex flex-col items-center justify-center space-y-3 mb-4">
            <div className="w-24 h-24 rounded-full border-4 border-pink-100 shadow-md overflow-hidden bg-white flex items-center justify-center">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-pink-300 text-xs text-center px-2">Chưa có ảnh</span>
              )}
            </div>
            
            <label className="cursor-pointer bg-pink-50 hover:bg-pink-100 text-pink-700 text-xs font-semibold py-1.5 px-3 rounded-full border border-pink-200 transition">
              Tải ảnh từ máy
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
          </div>

          <div>
            <label className="block text-sm font-semibold text-pink-800 mb-1">Tên Hiển Thị</label>
            <input
              type="text"
              name="displayName"
              required
              defaultValue={initialData.displayName}
              className="w-full p-3 border border-pink-100 rounded-xl bg-white/70 text-pink-900 placeholder-pink-700/40 focus:outline-none focus:ring-2 focus:ring-pink-400 transition"
              placeholder="VD: Bé Yêu"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-pink-800 mb-1">Hoặc dán Link ảnh (từ mạng)</label>
            <input
              type="url"
              name="avatarUrl"
              defaultValue={initialData.avatarUrl}
              onChange={(e) => {
                if (!selectedFile) setPreviewUrl(e.target.value);
              }}
              className="w-full p-3 border border-pink-100 rounded-xl bg-white/70 text-pink-900 placeholder-pink-700/40 focus:outline-none focus:ring-2 focus:ring-pink-400 transition"
              placeholder="https://example.com/avatar.jpg"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 mt-6"
          >
            {loading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
          </button>
        </form>

        <form action={logout}>
          <button type="submit" className="w-full mt-4 bg-red-50 text-red-600 font-semibold py-3 px-4 rounded-xl border border-red-100 hover:bg-red-100 transition-colors">
            Đăng Xuất
          </button>
        </form>
      </div>
    </main>
  );
}
