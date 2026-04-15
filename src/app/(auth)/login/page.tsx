'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      router.push('/dashboard');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ログインに失敗しました';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <div className="rounded-xl p-8 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <span className="text-white text-lg font-bold">AM</span>
          </div>
        </div>
        <h1 className="text-xl font-semibold text-center mb-1" style={{ color: 'var(--text-primary)' }}>
          Apparel Match
        </h1>
        <p className="text-center text-xs mb-8" style={{ color: 'var(--text-muted)' }}>
          アパレル業界のプロフェッショナルマッチング
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
              className="w-full px-3.5 py-2.5 rounded-lg text-sm border-0 focus:outline-none focus:ring-2 placeholder-opacity-40"
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
            {isLoading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
          <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
            アカウントをお持ちではありませんか？{' '}
            <Link href="/register" className="font-medium" style={{ color: 'var(--accent-light)' }}>
              サインアップ
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
