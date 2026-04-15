'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { MessageSquare } from 'lucide-react';

interface StartChatButtonProps {
  targetUserId: string;
  compact?: boolean;
}

export default function StartChatButton({ targetUserId, compact = false }: StartChatButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleStartChat = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      if (user.id === targetUserId) return;

      // Check if room already exists
      const { data: existingRoom } = await supabase
        .from('chat_rooms')
        .select('id')
        .eq('is_group', false)
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${targetUserId}),and(user1_id.eq.${targetUserId},user2_id.eq.${user.id})`)
        .maybeSingle();

      if (existingRoom) {
        router.push(`/chat/${existingRoom.id}`);
        return;
      }

      // Create new room
      const { data: newRoom, error } = await supabase
        .from('chat_rooms')
        .insert({
          user1_id: user.id,
          user2_id: targetUserId,
          is_group: false,
        })
        .select()
        .single();

      if (error) throw error;
      router.push(`/chat/${newRoom.id}`);
    } catch (err) {
      console.error('Error starting chat:', err);
    } finally {
      setLoading(false);
    }
  };

  if (compact) {
    return (
      <button
        onClick={handleStartChat}
        disabled={loading}
        className="p-2 rounded-lg transition-colors disabled:opacity-40"
        style={{ background: 'var(--accent)', color: 'white' }}
        title="メッセージを送る"
      >
        <MessageSquare className="w-4 h-4" />
      </button>
    );
  }

  return (
    <button
      onClick={handleStartChat}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
      style={{ background: 'var(--accent)', color: 'white' }}
    >
      <MessageSquare className="w-4 h-4" />
      {loading ? '...' : 'メッセージ'}
    </button>
  );
}
