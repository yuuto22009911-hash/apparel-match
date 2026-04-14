'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { PORTFOLIO_CATEGORIES } from '@/lib/constants';
import { Upload, X, Loader2 } from 'lucide-react';

interface FormData {
  title: string;
  description: string;
  category: string;
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
    setPreviewImages(prev => {
      const updated = prev.filter((_, i) => i !== index);
      updated.forEach((img, idx) => {
        if (idx !== index) {
          URL.revokeObjectURL(img.preview);
        }
      });
      return updated;
    });

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
      // Validate form
      if (!formData.title.trim()) {
        throw new Error('タイトルを入力してください');
      }
      if (!formData.category) {
        throw new Error('カテゴリを選択してください');
      }
      if (formData.images.length === 0) {
        throw new Error('最低1枚の画像をアップロードしてください');
      }

      const supabase = createClient();

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('ログインしてください');
      }

      // Upload images
      const imageUrls: string[] = [];
      for (const image of formData.images) {
        const timestamp = Date.now();
        const filename = `${user.id}/${timestamp}-${Math.random().toString(36).substr(2, 9)}-${image.name}`;

        const { error: uploadError } = await supabase.storage
          .from('portfolios')
          .upload(filename, image, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`画像アップロードに失敗しました: ${uploadError.message}`);
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from('portfolios').getPublicUrl(filename);
        imageUrls.push(publicUrl);
      }

      // Create portfolio record
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const { error: dbError } = await supabase.from('portfolios').insert({
        user_id: user.id,
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        image_urls: imageUrls,
        tags: tagsArray,
      });

      if (dbError) {
        throw new Error(`ポートフォリオ作成に失敗しました: ${dbError.message}`);
      }

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : '予期しないエラーが発生しました';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">新しいポートフォリオを作成</h1>
          <p className="mt-2 text-slate-600">
            あなたの作品をアップロードして、ポートフォリオを作成しましょう。
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">
              タイトル <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="例：レディースドレスコレクション"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              disabled={isLoading}
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">
              説明
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="このポートフォリオについて詳しく説明してください"
              rows={4}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent resize-none"
              disabled={isLoading}
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-1">
              カテゴリ <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              disabled={isLoading}
            >
              <option value="">選択してください</option>
              {Object.entries(PORTFOLIO_CATEGORIES).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-slate-700 mb-1">
              タグ
            </label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              placeholder="カンマで区切って入力（例：ドレス, フォーマル, 夏物）"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              disabled={isLoading}
            />
            <p className="mt-1 text-xs text-slate-500">
              複数のタグはカンマで区切ってください
            </p>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              画像 <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-slate-500 mb-3">
              最大5枚までアップロードできます
            </p>

            {/* Upload Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-slate-400 transition-colors bg-slate-50"
            >
              <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <p className="text-sm font-medium text-slate-700">
                ここをクリックして画像を選択
              </p>
              <p className="text-xs text-slate-500 mt-1">
                またはドラッグ＆ドロップ
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              disabled={isLoading || previewImages.length >= 5}
              className="hidden"
            />

            {/* Image Preview */}
            {previewImages.length > 0 && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {previewImages.map((img, index) => (
                  <div
                    key={index}
                    className="relative aspect-square rounded-lg overflow-hidden bg-slate-100"
                  >
                    <img
                      src={img.preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      disabled={isLoading}
                      className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {previewImages.length > 0 && (
              <p className="mt-2 text-xs text-slate-500">
                {previewImages.length}/5枚アップロード済み
              </p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? '作成中...' : '作成する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
