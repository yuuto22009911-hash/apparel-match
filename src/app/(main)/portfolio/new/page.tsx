'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { PORTFOLIO_CATEGORIES, ITEM_CATEGORIES, PORTFOLIO_ROLES, CLIENT_TYPES } from '@/lib/constants';
import { X, Loader2, ImagePlus } from 'lucide-react';

interface FormData {
  title: string;
  description: string;
  category: string;
  item_category: string;
  role: string;
  client_type: string;
  tags: string;
  images: File[];
}

interface PreviewImage {
  file: File;
  preview: string;
}

export default function NewPortfolioPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    category: '',
    item_category: '',
    role: '',
    client_type: '',
    tags: '',
    images: [],
  });
  const [previewImages, setPreviewImages] = useState<PreviewImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.currentTarget;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.currentTarget.files || []);
    const remainingSlots = 5 - previewImages.length;
    const filesToAdd = files.slice(0, remainingSlots);

    const newPreviews = filesToAdd.map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setPreviewImages(prev => [...prev, ...newPreviews]);
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...filesToAdd],
    }));
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(previewImages[index].preview);
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!formData.title.trim()) throw new Error('タイトルを入力してください');
      if (!formData.category) throw new Error('カテゴリを選択してください');
      if (formData.images.length === 0) throw new Error('最低1枚の画像をアップロードしてください');

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('ログインしてください');

      // Upload images
      const imageUrls: string[] = [];
      for (const image of formData.images) {
        const timestamp = Date.now();
        const filename = `${user.id}/${timestamp}-${Math.random().toString(36).substr(2, 9)}-${image.name}`;
        const { error: uploadError } = await supabase.storage.from('portfolios').upload(filename, image, { cacheControl: '3600', upsert: false });
        if (uploadError) throw new Error(`画像アップロードに失敗: ${uploadError.message}`);
        const { data: { publicUrl } } = supabase.storage.from('portfolios').getPublicUrl(filename);
        imageUrls.push(publicUrl);
      }

      const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      const { error: dbError } = await supabase.from('portfolios').insert({
        user_id: user.id,
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        item_category: formData.item_category || null,
        role: formData.role || null,
        client_type: formData.client_type || null,
        image_urls: imageUrls,
        tags: tagsArray,
      });

      if (dbError) throw new Error(`ポートフォリオ作成に失敗: ${dbError.message}`);
      router.push('/dashboard');
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
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>ポートフォリオを追加</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          あなたの作品をアップロードして実績を公開しましょう
        </p>
      </div>

      <form onSubmit={handleSubmit} className="glass p-8 space-y-6 animate-fade-in animate-fade-in-delay-1">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            タイトル *
          </label>
          <input type="text" id="title" name="title" value={formData.title} onChange={handleInputChange}
            placeholder="例：レディースドレスコレクション"
            className={inputClass} style={inputStyle} disabled={isLoading} />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            説明
          </label>
          <textarea id="description" name="description" value={formData.description} onChange={handleInputChange}
            placeholder="この作品について詳しく説明してください" rows={4}
            className={inputClass + " resize-none"} style={inputStyle} disabled={isLoading} />
        </div>

        {/* Category + Item Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="category" className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              カテゴリ *
            </label>
            <select id="category" name="category" value={formData.category} onChange={handleInputChange}
              className={inputClass} style={inputStyle} disabled={isLoading}>
              <option value="">選択してください</option>
              {Object.entries(PORTFOLIO_CATEGORIES).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="item_category" className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              アイテム種類
            </label>
            <select id="item_category" name="item_category" value={formData.item_category} onChange={handleInputChange}
              className={inputClass} style={inputStyle} disabled={isLoading}>
              <option value="">選択してください</option>
              {Object.entries(ITEM_CATEGORIES).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Role + Client Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="role" className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              担当した役割
            </label>
            <select id="role" name="role" value={formData.role} onChange={handleInputChange}
              className={inputClass} style={inputStyle} disabled={isLoading}>
              <option value="">選択してください</option>
              {Object.entries(PORTFOLIO_ROLES).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="client_type" className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              クライアント種別
            </label>
            <select id="client_type" name="client_type" value={formData.client_type} onChange={handleInputChange}
              className={inputClass} style={inputStyle} disabled={isLoading}>
              <option value="">選択してください</option>
              {Object.entries(CLIENT_TYPES).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label htmlFor="tags" className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            タグ
          </label>
          <input type="text" id="tags" name="tags" value={formData.tags} onChange={handleInputChange}
            placeholder="カンマで区切って入力（例：ドレス, フォーマル, 夏物）"
            className={inputClass} style={inputStyle} disabled={isLoading} />
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-xs font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
            画像 * <span style={{ color: 'var(--text-muted)' }}>（最大5枚）</span>
          </label>

          <div
            onClick={() => previewImages.length < 5 && fileInputRef.current?.click()}
            className="rounded-2xl p-8 text-center cursor-pointer transition-all"
            style={{
              border: '2px dashed var(--border)',
              background: 'var(--surface-solid-2)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-subtle)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface-solid-2)'; }}
          >
            <ImagePlus className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              クリックして画像を選択
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              JPG, PNG, GIF / 各10MB以下
            </p>
          </div>

          <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleFileSelect}
            disabled={isLoading || previewImages.length >= 5} className="hidden" />

          {previewImages.length > 0 && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {previewImages.map((img, index) => (
                <div key={index} className="relative aspect-square rounded-xl overflow-hidden group"
                  style={{ background: 'var(--surface-solid-2)' }}>
                  <img src={img.preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeImage(index)} disabled={isLoading}
                    className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full transition-opacity opacity-0 group-hover:opacity-100"
                    style={{ background: 'rgba(248,113,113,0.9)', color: 'white' }}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {previewImages.length > 0 && (
            <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              {previewImages.length}/5枚
            </p>
          )}
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
            {isLoading ? '作成中...' : '作成する'}
          </button>
        </div>
      </form>
    </div>
  );
}
