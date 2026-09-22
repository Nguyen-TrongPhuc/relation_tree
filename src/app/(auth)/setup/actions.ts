'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export async function setProfile(formData: FormData) {
  const username = formData.get('username') as string;
  const displayName = formData.get('displayName') as string;

  if (!username || !displayName) {
    redirect(`/setup?error=${encodeURIComponent('Vui lòng nhập đầy đủ thông tin')}`);
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { error } = await supabase
    .from('profiles')
    .update({ 
      username: username.toLowerCase().trim(),
      display_name: displayName.trim()
    })
    .eq('id', user.id);

  if (error) {
    if (error.code === '23505') {
      redirect(`/setup?error=${encodeURIComponent('Tên người dùng này đã tồn tại, vui lòng chọn tên khác.')}`);
    }
    redirect(`/setup?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath('/setup');
  redirect('/setup');
}

export async function sendPairRequest(formData: FormData) {
  const targetUsername = formData.get('targetUsername') as string;

  if (!targetUsername) {
    redirect(`/setup?error=${encodeURIComponent('Vui lòng nhập username của người yêu.')}`);
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Tìm người dùng mục tiêu
  const { data: targetUser } = await supabase
    .from('profiles')
    .select('id, username')
    .eq('username', targetUsername.toLowerCase().trim())
    .single();

  if (!targetUser) {
    redirect(`/setup?error=${encodeURIComponent('Không tìm thấy người dùng này.')}`);
  }

  if (targetUser.id === user.id) {
    redirect(`/setup?error=${encodeURIComponent('Bạn không thể tự ghép đôi với chính mình!')}`);
  }

  // Kiểm tra xem người kia đã có đôi chưa
  const { data: existingPair } = await supabase
    .from('friendships')
    .select('id')
    .or(`sender_id.eq.${targetUser.id},receiver_id.eq.${targetUser.id}`)
    .eq('status', 'accepted')
    .maybeSingle();

  if (existingPair) {
    redirect(`/setup?error=${encodeURIComponent('Người này đã ghép đôi với người khác rồi 😢')}`);
  }

  // Tạo yêu cầu ghép đôi
  const { error } = await supabase
    .from('friendships')
    .insert({
      sender_id: user.id,
      receiver_id: targetUser.id,
      status: 'pending'
    });

  if (error) {
    redirect(`/setup?error=${encodeURIComponent('Không thể gửi yêu cầu: ' + error.message)}`);
  }

  revalidatePath('/setup');
  redirect('/setup');
}

export async function acceptPairRequest(formData: FormData) {
  const requestId = formData.get('requestId') as string;
  const supabase = await createClient();
  
  await supabase
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('id', requestId);
    
  revalidatePath('/');
  redirect('/');
}

export async function cancelOrRejectRequest(formData: FormData) {
  const requestId = formData.get('requestId') as string;
  const supabase = await createClient();
  
  await supabase
    .from('friendships')
    .delete()
    .eq('id', requestId);
    
  revalidatePath('/setup');
  redirect('/setup');
}
