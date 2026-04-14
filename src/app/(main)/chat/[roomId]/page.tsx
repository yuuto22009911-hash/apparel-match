'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { ChatMessage, ChatRoom, Profile } from '@/lib/types';
import { ArrowLeft, Send } from 'lucide-react';
import Link from 'next/link';

export default function ChatRoomPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params.roomId as string;
  const supabase = createClient();

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [otherUser, setOtherUser] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch initial data
  useEffect(() => {
    const initializeChat = async () => {
      try {
        setLoading(true);
        setError(null);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push('/login');
          return;
        }

        setCurrentUserId(user.id);

        // Fetch chat room
        const { data: roomData, error: roomError } = await supabase
          .from('chat_rooms')
          .select('*')
          .eq('id', roomId)
          .single();

        if (roomError || !roomData) {
          setError('チャットルームが見つかりません');
          return;
        }

        // Verify user is a participant
        if (roomData.user1_id !== user.id && roomData.user2_id !== user.id) {
          setError('このチャットにアクセスする権限がありません');
          return;
        }

        setRoom(roomData as ChatRoom);

        // Fetch other user's profile
        const otherUserId = roomData.user1_id === user.id ? roomData.user2_id : roomData.user1_id;
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', otherUserId)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
        } else {
          setOtherUser(profileData as Profile);
        }

        // Fetch messages
        const { data: messagesData, error: messagesError } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('room_id', roomId)
          .order('created_at', { ascending: true });

        if (messagesError) {
          console.error('Error fetching messages:', messagesError);
        } else {
          setMessages(messagesData as ChatMessage[]);
        }

        // Mark unread messages as read
        const { error: updateError } = await supabase
          .from('chat_messages')
          .update({ is_read: true })
          .eq('room_id', roomId)
          .eq('sender_id', otherUserId)
          .eq('is_read', false);

        if (updateError) {
          console.error('Error marking messages as read:', updateError);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'エラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    initializeChat();
  }, [roomId, router, supabase]);

  // Subscribe to new messages
  useEffect(() => {
    if (!currentUserId || !roomId) return;

    const subscription = supabase
      .channel(`chat_messages:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const newMessage = payload.new as any;
            setMessages((prev) => [...prev, newMessage as ChatMessage]);

            // Mark as read if it's from the other user
            if (newMessage.sender_id !== currentUserId) {
              supabase
                .from('chat_messages')
                .update({ is_read: true })
                .eq('id', newMessage.id)
                .then(({ error }) => {
                  if (error) console.error('Error marking as read:', error);
                });
            }
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [currentUserId, roomId, supabase]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim() || !currentUserId) {
      return;
    }

    try {
      setSending(true);

      const { error: sendError } = await supabase
        .from('chat_messages')
        .insert({
          room_id: roomId,
          sender_id: currentUserId,
          content: inputValue.trim(),
          is_read: false,
        });

      if (sendError) throw sendError;

      // Update chat room last message
      const { error: updateError } = await supabase
        .from('chat_rooms')
        .update({
          last_message: inputValue.trim(),
          last_message_at: new Date().toISOString(),
        })
        .eq('id', roomId);

      if (updateError) {
        console.error('Error updating room:', updateError);
      }

      setInputValue('');
    } catch (err) {
      console.error('Error sending message:', err);
      setError('メッセージ送信に失敗しました');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-[calc(100vh-120px)]">
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-[calc(100vh-120px)]">
        <div className="flex items-center gap-4 pb-4 border-b border-slate-200 mb-4">
          <Link href="/chat" className="inline-flex items-center text-blue-600 hover:text-blue-700">
            <ArrowLeft className="w-5 h-5 mr-2" />
            戻る
          </Link>
        </div>
        <div className="flex-1 flex justify-center items-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center max-w-md">
            <h3 className="font-semibold text-red-900 mb-2">エラー</h3>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] -mx-4 sm:-mx-6 lg:-mx-8 bg-white">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 sm:px-6 lg:px-8 py-4 border-b border-slate-200 flex-shrink-0">
        <Link href="/chat" className="inline-flex items-center text-blue-600 hover:text-blue-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>

        {/* User Info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {otherUser?.avatar_url ? (
            <img
              src={otherUser.avatar_url}
              alt={otherUser.display_name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-sm font-semibold text-slate-700">
              {otherUser?.display_name.charAt(0) || '?'}
            </div>
          )}
          <div className="min-w-0">
            <h2 className="font-semibold text-slate-900 truncate">
              {otherUser?.display_name || 'Unknown User'}
            </h2>
            {otherUser?.user_type && (
              <p className="text-xs text-slate-500">{otherUser.user_type}</p>
            )}
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex justify-center items-center h-full text-slate-500">
            <p>メッセージがまだありません</p>
          </div>
        ) : (
          messages.map((message) => {
            const isCurrentUser = message.sender_id === currentUserId;

            return (
              <div
                key={message.id}
                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    isCurrentUser
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-slate-100 text-slate-900 rounded-bl-none'
                  }`}
                >
                  <p className="break-words whitespace-pre-wrap">{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isCurrentUser ? 'text-blue-100' : 'text-slate-500'
                    }`}
                  >
                    {new Date(message.created_at).toLocaleTimeString('ja-JP', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSendMessage}
        className="flex-shrink-0 px-4 sm:px-6 lg:px-8 py-4 border-t border-slate-200 bg-white"
      >
        <div className="flex gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="メッセージを入力..."
            className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || sending}
            className="flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold rounded-lg transition-colors duration-200"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
