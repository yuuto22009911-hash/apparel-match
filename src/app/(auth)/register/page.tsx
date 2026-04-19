'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

type UserType = 'designer' | 'patternmaker' | 'brand' | 'factory';

const USER_TYPES: { value: UserType; label: string; desc: string }[] = [
  { value: 'designer', label: 'デザイナー', desc: '服をデザインする' },
  { value: 'patternmaker', label: 'パタンナー', desc: 'パターンを作成する' },
  { value: 'brand', label: 'ブランド', desc: 'ブランドを運営する' },
  { value: 'factory', label: '工場/OEM', desc: '製造・量産を行う' },
];

export default function RegisterPage() {
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
      if (!displayName.trim()) throw new Error('表示名を入力してください');

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

      if (signUpError) throw signUpError;
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
      <div className="w-full max-w-sm mx-auto">
        <div className="glass-strong p-8 sm:p-10 text-center">
          <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-5 animate-pulse-glow"
            style={{ background: 'rgba(52,211,153,0.15)' }}>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--success)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            確認メールを送信しました
          </h1>
          <p className="text-sm mb-1 font-medium" style={{ color: 'var(--accent-light)' }}>
            {email}
          </p>
          <p className="text-xs mb-8 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            メール内のリンクをクリックしてアカウントを有効化してください。
            <br />メールが届かない場合は迷惑メールフォルダもご確認ください。
          </p>
          <Link href="/login" className="btn-primary inline-block w-full py-3 text-sm text-center">
            ログインページへ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="glass-strong p-8 sm:p-10">
        <div className="flex justify-center mb-8">
          <img src="/vestie-logo.svg" alt="VESTIE" className="w-12 h-12" style={{ filter: 'invert(1)' }} />
        </div>
        <h1 className="text-2xl font-bold text-center mb-1" style={{ color: 'var(--text-primary)' }}>
          アカウント作成
        </h1>
        <p className="text-center text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
          無料で始めましょう
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              メールアドレス
            </label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-3 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:border-transparent"
              style={{ background: 'var(--surface-solid-2)', color: 'var(--text-primary)', borderColor: 'var(--border)', '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
              required disabled={isLoading} />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              パスワード
            </label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="8文字以上"
              className="w-full px-4 py-3 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:border-transparent"
              style={{ background: 'var(--surface-solid-2)', color: 'var(--text-primary)', borderColor: 'var(--border)', '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
              required disabled={isLoading} />
          </div>

          <div>
            <label htmlFor="displayName" className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              表示名
            </label>
            <input id="displayName" type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
              placeholder="山田太郎"
              className="w-full px-4 py-3 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:border-transparent"
              style={{ background: 'var(--surface-solid-2)', color: 'var(--text-primary)', borderColor: 'var(--border)', '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
              required disabled={isLoading} />
          </div>

          <div>
            <label className="block text-xs font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
              あなたの役割
            </label>
            <div className="grid grid-cols-2 gap-2">
              {USER_TYPES.map((type) => (
                <button key={type.value} type="button"
                  onClick={() => setUserType(type.value)}
                  className="p-3 rounded-xl text-left transition-all border"
                  style={{
                    background: userType === type.value ? 'var(--accent-subtle)' : 'var(--surface-solid-2)',
                    borderColor: userType === type.value ? 'rgba(124,91,240,0.3)' : 'var(--border)',
                    color: userType === type.value ? 'var(--accent-light)' : 'var(--text-secondary)',
                  }}>
                  <div className="text-sm font-medium">{type.label}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{type.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl text-sm" style={{ background: 'rgba(248,113,113,0.1)', color: 'var(--danger)', border: '1px solid rgba(248,113,113,0.15)' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={isLoading} className="btn-primary w-full py-3 text-sm disabled:opacity-40">
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                登録中...
              </span>
            ) : '無料で登録'}
          </button>
        </form>

        <div className="mt-8 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
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
