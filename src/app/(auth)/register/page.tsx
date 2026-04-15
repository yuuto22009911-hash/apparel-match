'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

type UserType = 'designer' | 'patternmaker' | 'brand' | 'factory';

const USER_TYPES: { value: UserType; label: string }[] = [
  { value: 'designer', label: 'デザイナー' },
  { value: 'patternmaker', label: 'パタンナー' },
  { value: 'brand', label: 'ブランド' },
  { value: 'factory', label: '工場/OEM' },
];

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [userType, setUserType] = useState<UserType>('designer');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!displayName.trim()) {
        throw new Error('表示名を入力してください');
      }

      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
            user_type: userType,
          },
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      setIsRegistered(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '登録に失敗しました';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isRegistered) {
    return (
      <div className="w-full max-w-sm">
        <div className="rounded-xl p-8 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="text-center">
            <div className="mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(34,197,94,0.15)' }}>
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--success)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              確認メールを送信しました
            </h1>
            <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{email}</span>
            </p>
            <p className="text-xs mb-6" style={{ color: 'var(--text-muted)' }}>
              メール内のリンクをクリックしてアカウントを有効化してください。メールが届かない場合は迷惑メールフォルダもご確認ください。
            </p>
            <Link
              href="/login"
              className="inline-block w-full py-2.5 rounded-lg text-sm font-medium text-center"
              style={{ background: 'var(--accent)', color: 'white' }}
            >
              ログインページへ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="rounded-xl p-8 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <span className="text-white text-lg font-bold">AM</span>
          </div>
        </div>
        <h1 className="text-xl font-semibold text-center mb-1" style={{ color: 'var(--text-primary)' }}>
          Apparel Match
        </h1>
        <p className="text-center text-xs mb-8" style={{ color: 'var(--text-muted)' }}>
          新しいアカウントを作成
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-3.5 py-2.5 rounded-lg text-sm border-0 focus:outline-none focus:ring-2"
              style={{ background: 'var(--surface-2)', color: 'var(--text-primary)', '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              パスワード
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-lg text-sm border-0 focus:outline-none focus:ring-2"
              style={{ background: 'var(--surface-2)', color: 'var(--text-primary)', '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="displayName" className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              表示名
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="山田太郎"
              className="w-full px-3.5 py-2.5 rounded-lg text-sm border-0 focus:outline-none focus:ring-2"
              style={{ background: 'var(--surface-2)', color: 'var(--text-primary)', '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="userType" className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              ユーザータイプ
            </label>
            <select
              id="userType"
              value={userType}
              onChange={(e) => setUserType(e.target.value as UserType)}
              className="w-full px-3.5 py-2.5 rounded-lg text-sm border-0 focus:outline-none focus:ring-2"
              style={{ background: 'var(--surface-2)', color: 'var(--text-primary)', '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
              disabled={isLoading}
            >
              {USER_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
            style={{ background: 'var(--accent)', color: 'white' }}
          >
            {isLoading ? 'サインアップ中...' : 'サインアップ'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
          <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
            既にアカウントをお持ちですか？{' '}
            <Link href="/login" className="font-medium" style={{ color: 'var(--accent-light)' }}>
              ログイン
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
