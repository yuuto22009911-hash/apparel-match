import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import type { ChatRoomWithProfile } from '@/lib/types';

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } },
        { status: 401 }
      );
    }

    // Query chat rooms where user is either user1 or user2
    const { data: rooms, error: roomsError } = await supabase
      .from('chat_rooms')
      .select('*')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (roomsError) throw roomsError;

    if (!rooms || rooms.length === 0) {
      return NextResponse.json({ data: [] });
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

    return NextResponse.json({ data: validRooms });
  } catch (error) {
    console.error('Error fetching chat rooms:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch chat rooms' } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } },
        { status: 401 }
      );
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'userId is required' } },
        { status: 400 }
      );
    }

    if (userId === user.id) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Cannot create chat room with yourself' } },
        { status: 400 }
      );
    }

    // Check if a room already exists between these two users
    const { data: existingRoom, error: checkError } = await supabase
      .from('chat_rooms')
      .select('*')
      .or(`and(user1_id.eq.${user.id},user2_id.eq.${userId}),and(user1_id.eq.${userId},user2_id.eq.${user.id})`)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 is "no rows returned"
      throw checkError;
    }

    if (existingRoom) {
      return NextResponse.json({ data: existingRoom });
    }

    // Create new chat room
    const { data: newRoom, error: createError } = await supabase
      .from('chat_rooms')
      .insert({
        user1_id: user.id,
        user2_id: userId,
        last_message: null,
        last_message_at: null,
      })
      .select()
      .single();

    if (createError) throw createError;

    // Fetch the other user's profile to return complete room data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url, user_type')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    const roomWithProfile = {
      ...newRoom,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      other_user: profile as any,
    } as ChatRoomWithProfile;

    return NextResponse.json({ data: roomWithProfile }, { status: 201 });
  } catch (error) {
    console.error('Error creating chat room:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create chat room' } },
      { status: 500 }
    );
  }
}
