'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

async function getPartnerId(supabase: any, userId: string) {
  const { data: pair } = await supabase
    .from('friendships')
    .select('sender_id, receiver_id')
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .eq('status', 'accepted')
    .single();

  if (!pair) return null;
  return pair.sender_id === userId ? pair.receiver_id : pair.sender_id;
}

export async function updateChatBackground(bgUrl: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('friendships')
    .update({ background_url: bgUrl })
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

  if (error) {
    console.error('Error updating background:', error);
    return { error: 'Lỗi cập nhật hình nền' };
  }

  revalidatePath('/');
  revalidatePath('/tree');
  revalidatePath('/chat');
  return { success: true };
}

export async function sendMessage(content: string, imageUrl?: string, replyToId?: string) {
  if ((!content || !content.trim()) && !imageUrl) return { error: 'Message cannot be empty' };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const partnerId = await getPartnerId(supabase, user.id);
  if (!partnerId) return { error: 'Chưa ghép đôi' };

  const { data, error } = await supabase
    .from('messages')
    .insert({
      sender_id: user.id,
      receiver_id: partnerId,
      content: content.trim(),
      image_url: imageUrl || null
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error sending message:', error);
    return { error: 'Failed to send message' };
  }

  return { success: true, message: data };
}

export async function getMessages() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { messages: [], userId: null, partnerId: null };

  const partnerId = await getPartnerId(supabase, user.id);
  if (!partnerId) return { messages: [], userId: user.id, partnerId: null };

  const { data, error } = await supabase
    .from('messages')
    .select(`
      id,
      content,
      created_at,
      sender_id,
      receiver_id,
      image_url,
      is_moment,
      reactions,
      reply_to_id,
      replied_message:reply_to_id (id, content, image_url, sender_id),
      profiles:sender_id (display_name, avatar_url)
    `)
    .in('sender_id', [user.id, partnerId])
    .in('receiver_id', [user.id, partnerId])
    .order('created_at', { ascending: true })
    .limit(100);

  if (error) {
    console.error('Error fetching messages:', error);
    return { messages: [], userId: user.id, partnerId };
  }

  return { messages: data, userId: user.id, partnerId };
}
export async function updateMessageContent(messageId: number, newContent: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  // Verify user is part of this conversation (sender or receiver)
  const { data: msg } = await supabase
    .from('messages')
    .select('sender_id, receiver_id')
    .eq('id', messageId)
    .single();

  if (!msg || (msg.sender_id !== user.id && msg.receiver_id !== user.id)) {
    return { error: 'Không có quyền cập nhật tin nhắn này' };
  }

  // Use rpc or direct update - need RLS to allow both sender and receiver to update
  const { error } = await supabase
    .from('messages')
    .update({ content: newContent })
    .eq('id', messageId);

  if (error) return { error: error.message };
  return { success: true };
}



export async function deleteMessage(messageId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', messageId)
    .eq('sender_id', user.id); // Only allow deleting own messages

  if (error) return { error: error.message };
  return { success: true };
}

export async function togglePinMessage(messageId: string, currentPinStatus: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };
  const partnerId = await getPartnerId(supabase, user.id);
  if (!partnerId) return { error: 'Chưa ghép đôi' };
  const { error } = await supabase.from('messages').update({ is_pinned: !currentPinStatus }).eq('id', messageId).or(`and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`);
  if (error) return { error: error.message };
  return { success: true };
}



