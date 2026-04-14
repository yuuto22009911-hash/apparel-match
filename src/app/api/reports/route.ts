import { createClient } from '@/lib/supabase/server';
import type { Report, ApiResponse, ReportReason } from '@/lib/types';
import { REPORT_REASONS } from '@/lib/constants';
import { NextRequest, NextResponse } from 'next/server';

// POST: Create a report
export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const { reported_user_id, reason, description } = body;

    // Validate required fields
    if (!reported_user_id || !reason) {
      return NextResponse.json<ApiResponse<null>>(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: '通報ユーザーID と理由は必須です',
          },
        },
        { status: 400 }
      );
    }

    // Validate reason is one of the allowed values
    const allowedReasons = Object.keys(REPORT_REASONS) as ReportReason[];
    if (!allowedReasons.includes(reason as ReportReason)) {
      return NextResponse.json<ApiResponse<null>>(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: '無効な理由が指定されています',
          },
        },
        { status: 400 }
      );
    }

    // Prevent self-reporting
    if (reported_user_id === user.id) {
      return NextResponse.json<ApiResponse<null>>(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: '自分自身を通報することはできません',
          },
        },
        { status: 400 }
      );
    }

    // Insert report into database
    const { data, error } = await supabase
      .from('reports')
      .insert({
        reporter_id: user.id,
        reported_user_id,
        reason: reason as ReportReason,
        description: description || null,
        status: 'pending',
      })
      .select();

    if (error) {
      return NextResponse.json<ApiResponse<null>>(
        {
          data: null,
          error: {
            code: 'INSERT_ERROR',
            message: '通報の作成に失敗しました',
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<Report>>(
      {
        data: data?.[0] as Report,
        error: null,
      },
      { status: 201 }
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
