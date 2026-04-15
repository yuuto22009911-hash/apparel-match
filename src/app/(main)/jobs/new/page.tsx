'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { JOB_CATEGORIES, PREFECTURES } from '@/lib/constants';
import { Loader2 } from 'lucide-react';

export default function NewJobPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    budget_min: '',
    budget_max: '',
    deadline: '',
    prefecture: '',
    tags: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!formData.title.trim()) throw new Error('タイトルを入力してください');
      if (!formData.category) throw new Error('カテゴリを選択してください');
      if (!formData.description.trim()) throw new Error('説明を入力してください');

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('ログインしてください');

      const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(Boolean);

      const { error: dbError } = await supabase.from('jobs').insert({
        owner_id: user.id,
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        budget_min: formData.budget_min ? parseInt(formData.budget_min) : null,
        budget_max: formData.budget_max ? parseInt(formData.budget_max) : null,
        deadline: formData.deadline || null,
        prefecture: formData.prefecture || null,
        tags: tagsArray,
      });

      if (dbError) throw new Error(`案件作成に失敗: ${dbError.message}`);
      router.push('/jobs/my');
    } catch (err) {
      setError(err instanceof Error ? err.message : '予期しないエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-3 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:border-transparent";
  const inputStyle = { background: 'var(--surface-solid-2)', color: 'var(--text-primary)', borderColor: 'var(--border)', '--tw-ring-color': 'var(--accent)' } as React.CSSProperties;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>案件を投稿</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          パートナーに依頼したい仕事の詳細を記入してください
        </p>
      </div>

      <form onSubmit={handleSubmit} className="glass p-8 space-y-6 animate-fade-in animate-fade-in-delay-1">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>タイトル *</label>
          <input type="text" id="title" name="title" value={formData.title} onChange={handleInputChange}
            placeholder="例：レディースワンピースのパターン作成"
            className={inputClass} style={inputStyle} disabled={isLoading} />
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>カテゴリ *</label>
          <select id="category" name="category" value={formData.category} onChange={handleInputChange}
            className={inputClass} style={inputStyle} disabled={isLoading}>
            <option value="">選択してください</option>
            {Object.entries(JOB_CATEGORIES).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>説明 *</label>
          <textarea id="description" name="description" value={formData.description} onChange={handleInputChange}
            placeholder="依頼内容、求めるスキル、希望条件などを詳しく記入してください"
            rows={6} className={inputClass + " resize-none"} style={inputStyle} disabled={isLoading} />
        </div>

        {/* Budget */}
        <div>
          <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>予算（円）</label>
          <div className="grid grid-cols-2 gap-4">
            <input type="number" name="budget_min" value={formData.budget_min} onChange={handleInputChange}
              placeholder="下限" min="0"
              className={inputClass} style={inputStyle} disabled={isLoading} />
            <input type="number" name="budget_max" value={formData.budget_max} onChange={handleInputChange}
              placeholder="上限" min="0"
              className={inputClass} style={inputStyle} disabled={isLoading} />
          </div>
        </div>

        {/* Deadline + Prefecture */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="deadline" className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>希望納期</label>
            <input type="date" id="deadline" name="deadline" value={formData.deadline} onChange={handleInputChange}
              className={inputClass} style={inputStyle} disabled={isLoading} />
          </div>
          <div>
            <label htmlFor="prefecture" className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>希望エリア</label>
            <select id="prefecture" name="prefecture" value={formData.prefecture} onChange={handleInputChange}
              className={inputClass} style={inputStyle} disabled={isLoading}>
              <option value="">指定なし（全国OK）</option>
              {PREFECTURES.map(pref => <option key={pref} value={pref}>{pref}</option>)}
            </select>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label htmlFor="tags" className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>タグ</label>
          <input type="text" id="tags" name="tags" value={formData.tags} onChange={handleInputChange}
            placeholder="カンマ区切り（例：ワンピース, サンプル, レディース）"
            className={inputClass} style={inputStyle} disabled={isLoading} />
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 rounded-xl text-sm" style={{ background: 'rgba(248,113,113,0.1)', color: 'var(--danger)', border: '1px solid rgba(248,113,113,0.15)' }}>
            {error}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.back()} disabled={isLoading} className="btn-glass flex-1 py-3 text-sm disabled:opacity-40">
            キャンセル
          </button>
          <button type="submit" disabled={isLoading} className="btn-primary flex-1 py-3 text-sm disabled:opacity-40 flex items-center justify-center gap-2">
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLoading ? '投稿中...' : '投稿する'}
          </button>
        </div>
      </form>
    </div>
  );
}
