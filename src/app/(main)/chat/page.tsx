'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { MessageSquare, Plus, Users, Search, X } from 'lucide-react';
import type { ChatRoomWithProfile, Profile } from '@/lib/types';

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
    return date.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' });
  }
}

export default function ChatPage() {
  const router = useRouter();
  const supabase = createClient();
  const [rooms, setRooms] = useState<ChatRoomWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [searchUser, setSearchUser] = useState('');
  const [foundUsers, setFoundUsers] = useState<Profile[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Profile[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const loadRooms = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setCurrentUserId(user.id);

      // 1:1 rooms (user1_id/user2_id)
      const { data: directRooms } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('is_group', false)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      // group rooms (via chat_room_members)
      const { data: memberRows } = await supabase
        .from('chat_room_members')
        .select('room_id')
        .eq('user_id', user.id);

      const groupRoomIds = (memberRows || []).map(r => r.room_id);
      let groupRooms: ChatRoomWithProfile[] = [];
      if (groupRoomIds.length > 0) {
        const { data: gRooms } = await supabase
          .from('chat_rooms')
          .select('*')
          .eq('is_group', true)
          .in('id', groupRoomIds)
          .order('last_message_at', { ascending: false, nullsFirst: false });
        groupRooms = (gRooms || []) as ChatRoomWithProfile[];
      }

      // Resolve other user profile for direct rooms
      const directWithProfiles = await Promise.all(
        (directRooms || []).map(async (room) => {
          const otherUserId = room.user1_id === user.id ? room.user2_id : room.user1_id;
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, display_name, avatar_url, user_type')
            .eq('id', otherUserId)
            .single();
          return { ...room, other_user: profile || undefined } as ChatRoomWithProfile;
        })
      );

      // Resolve member count for group rooms
      const groupWithInfo = groupRooms.map(room => ({
        ...room,
        other_user: undefined,
      })) as ChatRoomWithProfile[];

      // Combine and sort
      const all = [...directWithProfiles, ...groupWithInfo].sort((a, b) => {
        const ta = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
        const tb = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
        return tb - ta;
      });

      setRooms(all);
      setLoading(false);
    };
    loadRooms();
  }, []);

  const handleSearchUser = async (query: string) => {
    setSearchUser(query);
    if (query.length < 1) { setFoundUsers([]); return; }
    const { data } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url, user_type')
      .neq('id', currentUserId)
      .ilike('display_name', `%${query}%`)
      .limit(10);
    setFoundUsers((data || []) as Profile[]);
  };

  const toggleSelectUser = (user: Profile) => {
    setSelectedUsers(prev =>
      prev.find(u => u.id === user.id)
        ? prev.filter(u => u.id !== user.id)
        : [...prev, user]
    );
  };

  const createGroupRoom = async () => {
    if (!currentUserId || selectedUsers.length < 2 || !groupName.trim()) return;
    setCreating(true);
    try {
      const { data: room, error } = await supabase
        .from('chat_rooms')
        .insert({ is_group: true, name: groupName.trim(), user1_id: null, user2_id: null })
        .select()
        .single();
      if (error || !room) throw error;

      const members = [currentUserId, ...selectedUsers.map(u => u.id)].map((uid, i) => ({
        room_id: room.id,
        user_id: uid,
        role: i === 0 ? 'owner' : 'member',
      }));
      await supabase.from('chat_room_members').insert(members);

      setShowGroupModal(false);
      setGroupName('');
      setSelectedUsers([]);
      router.push(`/chat/${room.id}`);
    } catch (e) {
      console.error('Error creating group:', e);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--surface-3)', borderTopColor: 'var(--accent)' }} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>チャット</h1>
        <button
          onClick={() => setShowGroupModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          style={{ background: 'var(--accent)', color: 'white' }}
        >
          <Plus className="w-4 h-4" />
          グループ作成
        </button>
      </div>

      {/* Room List */}
      {rooms.length === 0 ? (
        <div className="rounded-xl p-12 text-center" style={{ background: 'var(--surface)' }}>
          <MessageSquare className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>まだチャットはありません</p>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>ユーザーを検索してチャットを始めましょう</p>
          <Link href="/search" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'var(--accent)', color: 'white' }}>
            <Search className="w-4 h-4" />
            ユーザーを検索
          </Link>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden divide-y" style={{ background: 'var(--surface)' }}>
          {rooms.map((room) => (
            <Link
              key={room.id}
              href={`/chat/${room.id}`}
              className="flex items-center gap-3 px-4 py-3 transition-colors"
              style={{ borderColor: 'var(--border)' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-2)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              {/* Avatar */}
              {room.is_group ? (
                <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'var(--surface-3)' }}>
                  <Users className="w-5 h-5" style={{ color: 'var(--accent-light)' }} />
                </div>
              ) : room.other_user?.avatar_url ? (
                <img src={room.other_user.avatar_url} alt="" className="flex-shrink-0 w-12 h-12 rounded-full object-cover" />
              ) : (
                <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold" style={{ background: 'var(--surface-3)', color: 'var(--accent-light)' }}>
                  {room.other_user?.display_name?.charAt(0) || '?'}
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                    {room.is_group ? room.name : (room.other_user?.display_name || 'Unknown')}
                  </h3>
                  {room.last_message_at && (
                    <span className="text-[11px] flex-shrink-0 ml-2" style={{ color: 'var(--text-muted)' }}>
                      {formatDate(room.last_message_at)}
                    </span>
                  )}
                </div>
                {room.last_message ? (
                  <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                    {room.last_message.length > 50 ? room.last_message.substring(0, 50) + '...' : room.last_message}
                  </p>
                ) : (
                  <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>メッセージなし</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Group Create Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-md rounded-xl p-6" style={{ background: 'var(--surface)' }}>
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>グループを作成</h2>

            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="グループ名"
              className="w-full px-3 py-2 rounded-lg text-sm mb-3 border-0 focus:outline-none focus:ring-2"
              style={{ background: 'var(--surface-2)', color: 'var(--text-primary)', '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
            />

            <input
              type="text"
              value={searchUser}
              onChange={(e) => handleSearchUser(e.target.value)}
              placeholder="メンバーを検索..."
              className="w-full px-3 py-2 rounded-lg text-sm mb-2 border-0 focus:outline-none focus:ring-2"
              style={{ background: 'var(--surface-2)', color: 'var(--text-primary)', '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
            />

            {/* Selected Users */}
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {selectedUsers.map(u => (
                  <span
                    key={u.id}
                    onClick={() => toggleSelectUser(u)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer"
                    style={{ background: 'var(--accent)', color: 'white' }}
                  >
                    {u.display_name}
                    <X className="w-3 h-3" />
                  </span>
                ))}
              </div>
            )}

            {/* Search Results */}
            {foundUsers.length > 0 && (
              <div className="max-h-40 overflow-y-auto rounded-lg mb-3" style={{ background: 'var(--surface-2)' }}>
                {foundUsers.filter(u => !selectedUsers.find(s => s.id === u.id)).map(user => (
                  <button
                    key={user.id}
                    onClick={() => toggleSelectUser(user)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-3)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold" style={{ background: 'var(--surface-3)', color: 'var(--accent-light)' }}>
                      {user.display_name.charAt(0)}
                    </div>
                    {user.display_name}
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => { setShowGroupModal(false); setSelectedUsers([]); setGroupName(''); setSearchUser(''); setFoundUsers([]); }}
                className="flex-1 py-2 rounded-lg text-sm font-medium"
                style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)' }}
              >
                キャンセル
              </button>
              <button
                onClick={createGroupRoom}
                disabled={selectedUsers.length < 2 || !groupName.trim() || creating}
                className="flex-1 py-2 rounded-lg text-sm font-medium disabled:opacity-40"
                style={{ background: 'var(--accent)', color: 'white' }}
              >
                {creating ? '作成中...' : '作成'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
