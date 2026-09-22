'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export async function updateProfile(formData: FormData) {
  const displayName = formData.get('displayName') as string;
  const avatarUrl = formData.get('avatarUrl') as string;

  if (!displayName) {
    return { error: 'Tên hiển thị không được để trống' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('profiles')
    .update({ 
      display_name: displayName.trim(),
      avatar_url: avatarUrl ? avatarUrl.trim() : null
    })
    .eq('id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/');
  revalidatePath('/tree');
  revalidatePath('/chat');
  revalidatePath('/settings/profile');
  return { success: 'Đã cập nhật hồ sơ thành công!' };
}

export async function updateBackground(bgUrl: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  // Find accepted friendship
  const { data: pair } = await supabase
    .from('friendships')
    .select('id')
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .eq('status', 'accepted')
    .single();

  if (!pair) return { error: 'No partner found' };

  const { error } = await supabase
    .from('friendships')
    .update({ background_url: bgUrl })
    .eq('id', pair.id);

  if (error) return { error: error.message };

  revalidatePath('/');
  revalidatePath('/tree');
  revalidatePath('/chat');
  return { success: 'Đã cập nhật hình nền chung thành công!' };
}
