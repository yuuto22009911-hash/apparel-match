import { createClient } from '@/lib/supabase/server';
import type { Notification, ApiResponse } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';

// GET: List notifications for current user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json<ApiResponse<null>>(
        {
          data: null,
          error: { code: 'UNAUTHORIZED', message: '認証が必要です' },
        },
        { status: 401 }
      );
    }

    // Fetch notifications ordered by created_at descending, limit 50
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json<ApiResponse<null>>(
        {
          data: null,
          error: { code: 'FETCH_ERROR', message: '通知の取得に失敗しました' },
        },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<Notification[]>>(
      {
        data: data as Notification[],
        error: null,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json<ApiResponse<null>>(
      {
        data: null,
        error: {
          code: 'SERVER_ERROR',
          message: error instanceof Error ? error.message : 'サーバーエラーが発生しました',
        },
      },
      { status: 500 }
    );
  }
}

// PATCH: Mark all notifications as read for current user
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json<ApiResponse<null>>(
        {
          data: null,
          error: { code: 'UNAUTHORIZED', message: '認証が必要です' },
        },
        { status: 401 }
      );
    }

    // Update all unread notifications to read
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)
      .select();

    if (error) {
      return NextResponse.json<ApiResponse<null>>(
        {
          data: null,
          error: { code: 'UPDATE_ERROR', message: '通知の更新に失敗しました' },
        },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<Notification[]>>(
      {
        data: data as Notification[],
        error: null,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json<ApiResponse<null>>(
      {
        data: null,
        error: {
          code: 'SERVER_ERROR',
          message: error instanceof Error ? error.message : 'サーバーエラーが発生しました',
        },
      },
      { status: 500 }
    );
  }
}
