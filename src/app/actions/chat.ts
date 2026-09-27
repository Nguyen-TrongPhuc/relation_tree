'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

async function getPartnerId(supabase: any, userId: string, requestedPartnerId?: string) {
  const { data: pairs } = await supabase
    .from('friendships')
    .select('sender_id, receiver_id')
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .eq('status', 'accepted')
    .limit(50);

  const pair = requestedPartnerId
    ? pairs?.find((candidate: { sender_id: string; receiver_id: string }) =>
      (candidate.sender_id === userId && candidate.receiver_id === requestedPartnerId) ||
      (candidate.receiver_id === userId && candidate.sender_id === requestedPartnerId))
    : pairs?.[0];
  if (!pair) return null;
  return pair.sender_id === userId ? pair.receiver_id : pair.sender_id;
}

export async function updateChatBackground(bgUrl: string, requestedPartnerId?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };
  const partnerId = await getPartnerId(supabase, user.id, requestedPartnerId);
  if (!partnerId) return { error: 'Chưa ghép đôi' };

  const { error } = await supabase
    .from('friendships')
    .update({ background_url: bgUrl })
    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`);

  if (error) {
    console.error('Error updating background:', error);
    return { error: 'Lỗi cập nhật hình nền' };
  }

  revalidatePath('/');
  revalidatePath('/tree');
  revalidatePath('/chat');
  return { success: true };
}

export async function sendMessage(content: string, imageUrl?: string, replyToId?: string | null, requestedPartnerId?: string) {
  if ((!content || !content.trim()) && !imageUrl) return { error: 'Message cannot be empty' };
  if (content.length > 5000) return { error: 'Tin nhắn tối đa 5.000 ký tự' };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const partnerId = await getPartnerId(supabase, user.id, requestedPartnerId);
  if (!partnerId) return { error: 'Chưa ghép đôi' };

  if (replyToId) {
    const { data: reply } = await supabase.from('messages').select('sender_id, receiver_id').eq('id', replyToId).single();
    const isInConversation = reply && (
      (reply.sender_id === user.id && reply.receiver_id === partnerId) ||
      (reply.sender_id === partnerId && reply.receiver_id === user.id)
    );
    if (!isInConversation) return { error: 'Tin nhắn được trả lời không thuộc cuộc trò chuyện này' };
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      sender_id: user.id,
      receiver_id: partnerId,
      content: content.trim(),
      image_url: imageUrl || null,
      reply_to_id: replyToId || null
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error sending message:', error);
    return { error: 'Failed to send message' };
  }

  return { success: true, message: data };
}

export async function getMessages(requestedPartnerId?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { messages: [], userId: null, partnerId: null };

  const partnerId = await getPartnerId(supabase, user.id, requestedPartnerId);
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
      is_deleted,
      is_pinned,
      is_read,
      reactions,
      reply_to_id,
      replied_message:reply_to_id (id, content, image_url, sender_id, is_deleted),
      profiles:sender_id (display_name, avatar_url)
    `)
    .in('sender_id', [user.id, partnerId])
    .in('receiver_id', [user.id, partnerId])
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) {
    console.error('Error fetching messages:', error);
    return { messages: [], userId: user.id, partnerId };
  }

  return { messages: data.reverse(), userId: user.id, partnerId };
}

export async function searchMessages(query: string, requestedPartnerId?: string) {
  const term = query.trim();
  if (!term) return { messages: [] };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { messages: [], error: 'Not authenticated' };

  const partnerId = await getPartnerId(supabase, user.id, requestedPartnerId);
  if (!partnerId) return { messages: [], error: 'Chưa ghép đôi' };

  const { data, error } = await supabase
    .from('messages')
    .select('id, content, created_at, sender_id, receiver_id, image_url, is_deleted')
    .in('sender_id', [user.id, partnerId])
    .in('receiver_id', [user.id, partnerId])
    .ilike('content', `%${term}%`)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return { messages: [], error: error.message };
  return { messages: data || [] };
}

export async function updateMessageContent(messageId: string, newContent: string, requestedPartnerId?: string) {
  const content = newContent.trim();
  if (!content || content.length > 5000) return { error: 'Nội dung tin nhắn không hợp lệ' };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };
  const partnerId = await getPartnerId(supabase, user.id, requestedPartnerId);
  if (!partnerId) return { error: 'Chưa ghép đôi' };

  // Only edit the authenticated user's own message to their partner.
  const { data: msg } = await supabase
    .from('messages')
    .select('sender_id, receiver_id, content')
    .eq('id', messageId)
    .single();

  if (!msg || msg.sender_id !== user.id || msg.receiver_id !== partnerId || msg.content?.startsWith('CALL::')) {
    return { error: 'Không có quyền cập nhật tin nhắn này' };
  }

  // Use rpc or direct update - need RLS to allow both sender and receiver to update
  const { data: updated, error } = await supabase
    .from('messages')
    .update({ content })
    .eq('id', messageId)
    .select('id')
    .single();

  if (error) return { error: error.message };
  if (!updated) return { error: 'Không thể cập nhật tin nhắn này' };
  return { success: true };
}



export async function deleteMessage(messageId: string, requestedPartnerId?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };
  const partnerId = await getPartnerId(supabase, user.id, requestedPartnerId);
  if (!partnerId) return { error: 'Chưa ghép đôi' };

  const { data: msg } = await supabase
    .from('messages')
    .select('id, sender_id, receiver_id, created_at')
    .eq('id', messageId)
    .single();

  if (!msg || msg.sender_id !== user.id || msg.receiver_id !== partnerId) return { error: 'Chỉ có thể xóa tin nhắn của bạn trong cuộc trò chuyện này' };
  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', messageId)
    .eq('sender_id', user.id)
    .select('id')
    .single(); // Only allow deleting own messages

  if (error) return { error: error.message };
  return { success: true };
}

export async function recallMessage(messageId: string, requestedPartnerId?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };
  const partnerId = await getPartnerId(supabase, user.id, requestedPartnerId);
  if (!partnerId) return { error: 'Chưa ghép đôi' };

  const { data: msg } = await supabase
    .from('messages')
    .select('id, sender_id, receiver_id, content, created_at')
    .eq('id', messageId)
    .single();

  if (!msg || msg.sender_id !== user.id || msg.receiver_id !== partnerId || msg.content?.startsWith('CALL::')) {
    return { error: 'Chỉ có thể thu hồi tin nhắn của bạn' };
  }
  if (Date.now() - new Date(msg.created_at).getTime() > 15 * 60 * 1000) {
    return { error: 'Chỉ có thể thu hồi tin nhắn trong vòng 15 phút' };
  }

  const { error } = await supabase
    .from('messages')
    .update({ content: '', image_url: null, is_deleted: true })
    .eq('id', messageId)
    .eq('sender_id', user.id)
    .select('id')
    .single();

  if (error) return { error: error.message };
  return { success: true };
}

export async function togglePinMessage(messageId: string, currentPinStatus: boolean, requestedPartnerId?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };
  const partnerId = await getPartnerId(supabase, user.id, requestedPartnerId);
  if (!partnerId) return { error: 'Chưa ghép đôi' };
  const { error } = await supabase.from('messages').update({ is_pinned: !currentPinStatus }).eq('id', messageId).or(`and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`).select('id').single();
  if (error) return { error: error.message };
  return { success: true };
}



