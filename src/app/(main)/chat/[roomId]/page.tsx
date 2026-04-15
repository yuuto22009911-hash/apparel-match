'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { ChatMessage, ChatRoom, Profile } from '@/lib/types';
import { ArrowLeft, Send, Users, UserPlus, X, Info } from 'lucide-react';
import Link from 'next/link';

interface GroupMember {
  user_id: string;
  role: string;
  profile?: Profile;
}

export default function ChatRoomPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params.roomId as string;
  const supabase = createClient();

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [otherUser, setOtherUser] = useState<Profile | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [senderProfiles, setSenderProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [addSearch, setAddSearch] = useState('');
  const [addResults, setAddResults] = useState<Profile[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Auto scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize
  useEffect(() => {
    const initializeChat = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/login'); return; }
        setCurrentUserId(user.id);

        const { data: roomData, error: roomError } = await supabase
          .from('chat_rooms').select('*').eq('id', roomId).single();

        if (roomError || !roomData) { setError('チャットルームが見つかりません'); return; }
        const roomTyped = roomData as ChatRoom;
        setRoom(roomTyped);

        if (roomTyped.is_group) {
          const { data: memberRows } = await supabase
            .from('chat_room_members').select('user_id, role').eq('room_id', roomId);

          if (memberRows) {
            const profileIds = memberRows.map(m => m.user_id);
            const { data: profiles } = await supabase
              .from('profiles').select('id, display_name, avatar_url, user_type').in('id', profileIds);

            const profileMap: Record<string, Profile> = {};
            (profiles || []).forEach(p => { profileMap[p.id] = p as Profile; });
            setSenderProfiles(profileMap);
            setMembers(memberRows.map(m => ({ ...m, profile: profileMap[m.user_id] })));

            if (!memberRows.find(m => m.user_id === user.id)) {
              setError('このグループに参加していません');
              return;
            }
          }
        } else {
          if (roomData.user1_id !== user.id && roomData.user2_id !== user.id) {
            setError('このチャットにアクセスする権限がありません');
            return;
          }
          const otherUserId = roomData.user1_id === user.id ? roomData.user2_id : roomData.user1_id;
          const { data: profileData } = await supabase.from('profiles').select('*').eq('id', otherUserId).single();
          if (profileData) {
            setOtherUser(profileData as Profile);
            setSenderProfiles(prev => ({ ...prev, [otherUserId]: profileData as Profile }));
          }
          const { data: selfProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
          if (selfProfile) setSenderProfiles(prev => ({ ...prev, [user.id]: selfProfile as Profile }));
        }

        const { data: messagesData } = await supabase
          .from('chat_messages').select('*').eq('room_id', roomId).order('created_at', { ascending: true });
        setMessages((messagesData || []) as ChatMessage[]);

        if (!roomTyped.is_group) {
          const otherUserId = roomData.user1_id === user.id ? roomData.user2_id : roomData.user1_id;
          await supabase.from('chat_messages').update({ is_read: true })
            .eq('room_id', roomId).eq('sender_id', otherUserId).eq('is_read', false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'エラーが発生しました');
      } finally {
        setLoading(false);
        // Scroll to bottom instantly on initial load
        setTimeout(() => scrollToBottom('instant'), 100);
      }
    };
    initializeChat();
  }, [roomId]);

  // Realtime
  useEffect(() => {
    if (!currentUserId || !roomId) return;
    const subscription = supabase
      .channel(`chat_messages:${roomId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'chat_messages',
        filter: `room_id=eq.${roomId}`,
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newMsg = payload.new as ChatMessage;
          setMessages(prev => [...prev, newMsg]);
          if (newMsg.sender_id !== currentUserId) {
            supabase.from('chat_messages').update({ is_read: true }).eq('id', newMsg.id)
              .then(({ error }) => { if (error) console.error(error); });
          }
        }
      })
      .subscribe();
    return () => { subscription.unsubscribe(); };
  }, [currentUserId, roomId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !currentUserId || sending) return;
    const content = inputValue.trim();
    setInputValue('');

    // Optimistic update
    const optimisticMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      room_id: roomId,
      sender_id: currentUserId,
      content,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      setSending(true);
      const res = await fetch(`/api/chat/${roomId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.error?.message || 'メッセージ送信に失敗しました');
      }

      // Remove optimistic message (realtime will add the real one)
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));

      inputRef.current?.focus();
    } catch (err) {
      console.error('Error sending message:', err);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
    } finally {
      setSending(false);
    }
  };

  const handleAddMemberSearch = async (query: string) => {
    setAddSearch(query);
    if (query.length < 1) { setAddResults([]); return; }
    const existingIds = members.map(m => m.user_id);
    const { data } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url, user_type')
      .not('id', 'in', `(${existingIds.join(',')})`)
      .ilike('display_name', `%${query}%`)
      .limit(10);
    setAddResults((data || []) as Profile[]);
  };

  const addMemberToGroup = async (user: Profile) => {
    await supabase.from('chat_room_members').insert({ room_id: roomId, user_id: user.id, role: 'member' });
    setMembers(prev => [...prev, { user_id: user.id, role: 'member', profile: user }]);
    setSenderProfiles(prev => ({ ...prev, [user.id]: user }));
    setAddResults(prev => prev.filter(u => u.id !== user.id));
  };

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return '今日';
    if (date.toDateString() === yesterday.toDateString()) return '昨日';
    return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const shouldShowDate = (msg: ChatMessage, index: number) => {
    if (index === 0) return true;
    return new Date(messages[index - 1].created_at).toDateString() !== new Date(msg.created_at).toDateString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--surface-3)', borderTopColor: 'var(--accent)' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/chat" style={{ color: 'var(--accent)' }}><ArrowLeft className="w-5 h-5" /></Link>
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>戻る</span>
        </div>
        <div className="rounded-xl p-8 text-center" style={{ background: 'var(--surface)' }}>
          <p className="text-sm mb-4" style={{ color: 'var(--danger)' }}>{error}</p>
          <Link href="/chat" className="inline-flex px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'var(--accent)', color: 'white' }}>
            チャット一覧に戻る
          </Link>
        </div>
      </div>
    );
  }

  const isGroup = room?.is_group;
  const roomTitle = isGroup ? room?.name : (otherUser?.display_name || 'Unknown');

  return (
    <div className="max-w-2xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 80px)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 pb-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <Link href="/chat" className="p-1.5 rounded-lg -ml-1.5 active:scale-95 transition-transform" style={{ color: 'var(--text-muted)' }}>
          <ArrowLeft className="w-5 h-5" />
        </Link>

        <Link href={isGroup ? '#' : `/profile/${otherUser?.id}`} className="flex items-center gap-3 flex-1 min-w-0">
          {isGroup ? (
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--surface-3)' }}>
              <Users className="w-4 h-4" style={{ color: 'var(--accent-light)' }} />
            </div>
          ) : otherUser?.avatar_url ? (
            <img src={otherUser.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold" style={{ background: 'var(--surface-3)', color: 'var(--accent-light)' }}>
              {otherUser?.display_name?.charAt(0) || '?'}
            </div>
          )}
          <div className="min-w-0">
            <h2 className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{roomTitle}</h2>
            {isGroup && <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{members.length}人</p>}
            {!isGroup && otherUser?.user_type && <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{otherUser.user_type}</p>}
          </div>
        </Link>

        {isGroup && (
          <button onClick={() => setShowInfo(!showInfo)} className="p-2 rounded-lg active:scale-95 transition-transform" style={{ color: 'var(--text-muted)' }}>
            <Info className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Group Info Panel */}
      {showInfo && isGroup && (
        <div className="py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>メンバー ({members.length})</span>
            <button onClick={() => setShowAddMember(!showAddMember)} className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--accent)' }}>
              <UserPlus className="w-3.5 h-3.5" /> メンバー追加
            </button>
          </div>

          <div className="space-y-1">
            {members.map(m => (
              <div key={m.user_id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg">
                {m.profile?.avatar_url ? (
                  <img src={m.profile.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                ) : (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold" style={{ background: 'var(--surface-3)', color: 'var(--accent-light)' }}>
                    {m.profile?.display_name?.charAt(0) || '?'}
                  </div>
                )}
                <span className="text-sm flex-1" style={{ color: 'var(--text-secondary)' }}>{m.profile?.display_name || '...'}</span>
                {m.role === 'owner' && <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--warning)' }}>オーナー</span>}
              </div>
            ))}
          </div>

          {showAddMember && (
            <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
              <input
                type="text" value={addSearch} onChange={(e) => handleAddMemberSearch(e.target.value)}
                placeholder="ユーザー名で検索..."
                className="w-full px-3 py-2 rounded-lg text-sm border-0 focus:outline-none focus:ring-2"
                style={{ background: 'var(--surface-2)', color: 'var(--text-primary)', '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
              />
              {addResults.map(u => (
                <button key={u.id} onClick={() => addMemberToGroup(u)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left mt-1 rounded-lg transition-colors"
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-2)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold" style={{ background: 'var(--surface-3)', color: 'var(--accent-light)' }}>
                    {u.display_name.charAt(0)}
                  </div>
                  <span className="text-sm flex-1" style={{ color: 'var(--text-secondary)' }}>{u.display_name}</span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: 'var(--accent)', color: 'white' }}>追加</span>
                </button>
              ))}
              <button onClick={() => { setShowAddMember(false); setAddSearch(''); setAddResults([]); }}
                className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>閉じる</button>
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto py-4 px-1">
        {messages.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-full gap-2">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'var(--surface-2)' }}>
              <Send className="w-6 h-6" style={{ color: 'var(--surface-3)' }} />
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>メッセージを送って会話を始めましょう</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isMe = message.sender_id === currentUserId;
            const showDate = shouldShowDate(message, index);
            const senderProfile = senderProfiles[message.sender_id];
            const showSenderName = isGroup && !isMe;
            const time = new Date(message.created_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
            const isRead = !isGroup && isMe && message.is_read;
            const isOptimistic = message.id.startsWith('temp-');

            return (
              <div key={message.id}>
                {showDate && (
                  <div className="flex justify-center my-4">
                    <span className="px-3 py-1 rounded-full text-[10px] font-medium" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
                      {getDateLabel(message.created_at)}
                    </span>
                  </div>
                )}
                <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-1.5`}>
                  {/* Group avatar */}
                  {!isMe && isGroup && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-semibold mr-2 mt-auto mb-0.5" style={{ background: 'var(--surface-3)', color: 'var(--accent-light)' }}>
                      {senderProfile?.display_name?.charAt(0) || '?'}
                    </div>
                  )}

                  <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[78%]`}>
                    {showSenderName && (
                      <span className="text-[10px] mb-0.5 px-1" style={{ color: 'var(--text-muted)' }}>
                        {senderProfile?.display_name || '不明'}
                      </span>
                    )}
                    <div className={`flex items-end gap-1.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div
                        className={`px-3.5 py-2 text-sm leading-relaxed break-words whitespace-pre-wrap ${
                          isMe ? 'rounded-2xl rounded-br-md' : 'rounded-2xl rounded-bl-md'
                        }`}
                        style={{
                          background: isMe ? 'var(--accent)' : 'var(--surface-2)',
                          color: isMe ? 'white' : 'var(--text-primary)',
                          opacity: isOptimistic ? 0.6 : 1,
                        }}
                      >
                        {message.content}
                      </div>
                      <div className={`flex flex-col gap-0 flex-shrink-0 ${isMe ? 'items-end' : 'items-start'}`}>
                        {isMe && isRead && (
                          <span className="text-[9px] leading-none" style={{ color: 'var(--accent-light)' }}>既読</span>
                        )}
                        <span className="text-[10px] leading-none" style={{ color: 'var(--text-muted)' }}>{time}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="flex-shrink-0 py-3" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="メッセージを入力..."
            className="flex-1 px-4 py-3 rounded-full text-sm border-0 focus:outline-none focus:ring-2"
            style={{ background: 'var(--surface-2)', color: 'var(--text-primary)', '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
            disabled={sending}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || sending}
            className="w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-90 disabled:opacity-20 disabled:scale-100"
            style={{ background: inputValue.trim() ? 'var(--accent)' : 'var(--surface-3)', color: 'white' }}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
