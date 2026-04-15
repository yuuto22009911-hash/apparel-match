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
        <div className="bg-white rounded-lg shadow-lg p-8 border border-zinc-200">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              確認メールを送信しました
            </h1>
            <p className="text-slate-600 mb-4">
              <span className="font-semibold text-slate-800">{email}</span> 宛てに確認メールを送信しました。
            </p>
            <p className="text-sm text-slate-500 mb-6">
              メール内のリンクをクリックして、アカウントを有効化してください。メールが届かない場合は、迷惑メールフォルダもご確認ください。
            </p>
            <Link
              href="/login"
              className="inline-block w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition text-center"
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
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-8 border border-zinc-200 dark:border-zinc-800">
        <h1 className="text-2xl font-bold text-center mb-2 text-zinc-900 dark:text-zinc-50">
          Apparel Match
        </h1>
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 mb-8">
          新しいアカウントを作成
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              パスワード
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              表示名
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="山田太郎"
              className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="userType" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              ユーザータイプ
            </label>
            <select
              id="userType"
              value={userType}
              onChange={(e) => setUserType(e.target.value as UserType)}
              className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
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
            <div className="p-3.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
          >
            {isLoading ? 'サインアップ中...' : 'サインアップ'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800">
          <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
            既にアカウントをお持ちですか？{' '}
            <Link
              href="/login"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition"
            >
              ログイン
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
