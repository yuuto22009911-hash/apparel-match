'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { MessageSquare, Plus, Users, Search, X, UserPlus, MessagesSquare } from 'lucide-react';
import type { ChatRoomWithProfile, Profile } from '@/lib/types';

function formatDate(dateString: string | null) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  if (date.toDateString() === yesterday.toDateString()) return '昨日';
  return date.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' });
}

type ModalMode = 'none' | 'new_chat' | 'new_group';

export default function ChatPage() {
  const router = useRouter();
  const supabase = createClient();
  const [rooms, setRooms] = useState<ChatRoomWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState<ModalMode>('none');
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

      const { data: directRooms } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('is_group', false)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false, nullsFirst: false });

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

      const groupWithInfo = groupRooms.map(room => ({ ...room, other_user: undefined })) as ChatRoomWithProfile[];

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

  // Start 1:1 chat directly
  const startDirectChat = async (targetUser: Profile) => {
    if (!currentUserId) return;
    setCreating(true);
    try {
      // Check existing room
      const { data: existingRoom } = await supabase
        .from('chat_rooms')
        .select('id')
        .eq('is_group', false)
        .or(`and(user1_id.eq.${currentUserId},user2_id.eq.${targetUser.id}),and(user1_id.eq.${targetUser.id},user2_id.eq.${currentUserId})`)
        .maybeSingle();

      if (existingRoom) {
        router.push(`/chat/${existingRoom.id}`);
        return;
      }

      const { data: newRoom, error } = await supabase
        .from('chat_rooms')
        .insert({ user1_id: currentUserId, user2_id: targetUser.id, is_group: false })
        .select()
        .single();
      if (error) throw error;
      router.push(`/chat/${newRoom.id}`);
    } catch (e) {
      console.error('Error starting chat:', e);
    } finally {
      setCreating(false);
    }
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

      closeModal();
      router.push(`/chat/${room.id}`);
    } catch (e) {
      console.error('Error creating group:', e);
    } finally {
      setCreating(false);
    }
  };

  const closeModal = () => {
    setModalMode('none');
    setSelectedUsers([]);
    setGroupName('');
    setSearchUser('');
    setFoundUsers([]);
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
        <div className="flex gap-2">
          <button
            onClick={() => setModalMode('new_chat')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
            style={{ background: 'var(--accent)', color: 'white' }}
          >
            <MessageSquare className="w-4 h-4" />
            新しいチャット
          </button>
          <button
            onClick={() => setModalMode('new_group')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
            style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
          >
            <Users className="w-4 h-4" />
            グループ
          </button>
        </div>
      </div>

      {/* Room List */}
      {rooms.length === 0 ? (
        <div className="rounded-xl p-12 text-center" style={{ background: 'var(--surface)' }}>
          <MessagesSquare className="w-14 h-14 mx-auto mb-4" style={{ color: 'var(--surface-3)' }} />
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>まだチャットはありません</p>
          <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>「新しいチャット」からユーザーを検索して会話を始めましょう</p>
          <button
            onClick={() => setModalMode('new_chat')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium"
            style={{ background: 'var(--accent)', color: 'white' }}
          >
            <MessageSquare className="w-4 h-4" />
            新しいチャットを始める
          </button>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--surface)' }}>
          {rooms.map((room, i) => (
            <Link
              key={room.id}
              href={`/chat/${room.id}`}
              className="flex items-center gap-3 px-4 py-3.5 transition-colors"
              style={{ borderBottom: i < rooms.length - 1 ? '1px solid var(--border)' : 'none' }}
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
                  <p className="text-xs" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>メッセージを送ってみましょう</p>
                )}
              </div>

              {/* Chevron */}
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--text-muted)', opacity: 0.3 }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      )}

      {/* Modal: New Chat / New Group */}
      {modalMode !== 'none' && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div
            className="w-full sm:max-w-md rounded-t-2xl sm:rounded-xl p-5 max-h-[85vh] overflow-y-auto"
            style={{ background: 'var(--surface)' }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                {modalMode === 'new_chat' ? '新しいチャット' : 'グループを作成'}
              </h2>
              <button onClick={closeModal} className="p-1 rounded-md" style={{ color: 'var(--text-muted)' }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode tabs */}
            <div className="flex gap-1 mb-4 p-0.5 rounded-lg" style={{ background: 'var(--surface-2)' }}>
              <button
                onClick={() => { setModalMode('new_chat'); setSelectedUsers([]); setGroupName(''); }}
                className="flex-1 py-2 rounded-md text-xs font-medium transition-all"
                style={{
                  background: modalMode === 'new_chat' ? 'var(--accent)' : 'transparent',
                  color: modalMode === 'new_chat' ? 'white' : 'var(--text-muted)',
                }}
              >
                1:1 チャット
              </button>
              <button
                onClick={() => { setModalMode('new_group'); setSearchUser(''); setFoundUsers([]); }}
                className="flex-1 py-2 rounded-md text-xs font-medium transition-all"
                style={{
                  background: modalMode === 'new_group' ? 'var(--accent)' : 'transparent',
                  color: modalMode === 'new_group' ? 'white' : 'var(--text-muted)',
                }}
              >
                グループ
              </button>
            </div>

            {/* Group Name (only for group) */}
            {modalMode === 'new_group' && (
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="グループ名を入力"
                className="w-full px-3.5 py-2.5 rounded-lg text-sm mb-3 border-0 focus:outline-none focus:ring-2"
                style={{ background: 'var(--surface-2)', color: 'var(--text-primary)', '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
              />
            )}

            {/* User Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={searchUser}
                onChange={(e) => handleSearchUser(e.target.value)}
                placeholder="ユーザー名で検索..."
                className="w-full pl-10 pr-3.5 py-2.5 rounded-lg text-sm border-0 focus:outline-none focus:ring-2"
                style={{ background: 'var(--surface-2)', color: 'var(--text-primary)', '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
                autoFocus
              />
            </div>

            {/* Selected Users (group only) */}
            {modalMode === 'new_group' && selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {selectedUsers.map(u => (
                  <span
                    key={u.id}
                    onClick={() => toggleSelectUser(u)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer"
                    style={{ background: 'var(--accent)', color: 'white' }}
                  >
                    {u.display_name}
                    <X className="w-3 h-3" />
                  </span>
                ))}
              </div>
            )}

            {/* Search Results */}
            {searchUser.length > 0 && (
              <div className="rounded-lg overflow-hidden" style={{ background: 'var(--surface-2)' }}>
                {foundUsers.length === 0 ? (
                  <div className="px-4 py-6 text-center">
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>ユーザーが見つかりません</p>
                  </div>
                ) : (
                  foundUsers
                    .filter(u => modalMode === 'new_chat' || !selectedUsers.find(s => s.id === u.id))
                    .map(user => (
                    <button
                      key={user.id}
                      onClick={() => {
                        if (modalMode === 'new_chat') {
                          startDirectChat(user);
                        } else {
                          toggleSelectUser(user);
                        }
                      }}
                      disabled={creating}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors disabled:opacity-50"
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-3)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold" style={{ background: 'var(--surface-3)', color: 'var(--accent-light)' }}>
                          {user.display_name.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{user.display_name}</p>
                        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{user.user_type}</p>
                      </div>
                      {modalMode === 'new_chat' ? (
                        <span className="text-xs font-medium px-3 py-1 rounded-full" style={{ background: 'var(--accent)', color: 'white' }}>
                          チャット
                        </span>
                      ) : (
                        <span className="text-xs" style={{ color: 'var(--accent)' }}>
                          <UserPlus className="w-4 h-4" />
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Empty state when no search */}
            {searchUser.length === 0 && (
              <div className="py-8 text-center">
                <Search className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--surface-3)' }} />
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {modalMode === 'new_chat' ? 'ユーザーを検索してチャットを始めましょう' : 'メンバーを検索して追加しましょう'}
                </p>
              </div>
            )}

            {/* Group Create Button */}
            {modalMode === 'new_group' && (
              <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                <button
                  onClick={createGroupRoom}
                  disabled={selectedUsers.length < 2 || !groupName.trim() || creating}
                  className="w-full py-2.5 rounded-lg text-sm font-medium disabled:opacity-30"
                  style={{ background: 'var(--accent)', color: 'white' }}
                >
                  {creating ? '作成中...' : `グループを作成（${selectedUsers.length}人選択中）`}
                </button>
                <p className="text-center text-[11px] mt-2" style={{ color: 'var(--text-muted)' }}>
                  2人以上選択してください
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
