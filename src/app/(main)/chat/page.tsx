import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ChatRoomWithProfile } from '@/lib/types';
import { MessageSquare } from 'lucide-react';

export const metadata = {
  title: 'チャット',
};

function formatDate(dateString: string | null) {
  if (!dateString) return '';

  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  } else if (date.toDateString() === yesterday.toDateString()) {
    return '昨日';
  } else {
    return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
  }
}

function truncateMessage(message: string, maxLength: number = 50) {
  if (message.length <= maxLength) return message;
  return message.substring(0, maxLength) + '...';
}

export default async function ChatPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Query chat rooms where user is either user1 or user2
  const { data: rooms, error: roomsError } = await supabase
    .from('chat_rooms')
    .select('*')
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .order('last_message_at', { ascending: false, nullsFirst: false });

  if (roomsError) {
    console.error('Error fetching rooms:', roomsError);
  }

  if (!rooms || rooms.length === 0) {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">チャット</h1>
          <p className="text-slate-600">
            ユーザーとのメッセージをやり取りできます
          </p>
        </div>

        {/* Empty State */}
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            まだチャットはありません
          </h3>
          <p className="text-slate-600 mb-6">
            ユーザーを検索して、チャットを始めてみましょう
          </p>
          <Link
            href="/search"
            className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200"
          >
            ユーザーを検索
          </Link>
        </div>
      </div>
    );
  }

  // Fetch other user profiles for each room
  const roomsWithProfiles = await Promise.all(
    rooms.map(async (room) => {
      const otherUserId = room.user1_id === user.id ? room.user2_id : room.user1_id;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, user_type')
        .eq('id', otherUserId)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        return null;
      }

      return {
        ...room,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        other_user: profile as any,
      } as ChatRoomWithProfile;
    })
  );

  const validRooms = roomsWithProfiles.filter((room) => room !== null);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">チャット</h1>
        <p className="text-slate-600">
          ユーザーとのメッセージをやり取りできます
        </p>
      </div>

      {/* Chat Room List */}
      <div className="space-y-3">
        {validRooms.map((room) => (
          <Link
            key={room.id}
            href={`/chat/${room.id}`}
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden"
          >
            <div className="p-4 flex items-center gap-4">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {room.other_user?.avatar_url ? (
                  <img
                    src={room.other_user.avatar_url}
                    alt={room.other_user.display_name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-sm font-semibold text-slate-700">
                    {room.other_user?.display_name.charAt(0) || '?'}
                  </div>
                )}
              </div>

              {/* Room Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 mb-1">
                  {room.other_user?.display_name || 'Unknown User'}
                </h3>
                {room.last_message ? (
                  <p className="text-sm text-slate-600 line-clamp-1">
                    {truncateMessage(room.last_message)}
                  </p>
                ) : (
                  <p className="text-sm text-slate-400 italic">
                    メッセージはまだありません
                  </p>
                )}
              </div>

              {/* Timestamp */}
              {room.last_message_at && (
                <div className="flex-shrink-0 text-sm text-slate-500">
                  {formatDate(room.last_message_at)}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
