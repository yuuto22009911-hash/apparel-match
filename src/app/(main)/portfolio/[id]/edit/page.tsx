'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { PORTFOLIO_CATEGORIES } from '@/lib/constants';
import { Portfolio } from '@/lib/types';
import { Upload, X, Loader2, Trash2 } from 'lucide-react';

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

interface ExistingImage {
  url: string;
  id: string;
}

export default function EditPortfolioPage() {
  const router = useRouter();
  const params = useParams();
  const portfolioId = params.id as string;

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    category: '',
    tags: '',
    images: [],
  });

  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [newPreviewImages, setNewPreviewImages] = useState<PreviewImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const supabase = createClient();

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        // Fetch portfolio
        const { data, error: fetchError } = await supabase
          .from('portfolios')
          .select('*')
          .eq('id', portfolioId)
          .single();

        if (fetchError) {
          throw new Error('ポートフォリオの読み込みに失敗しました');
        }

        const portfolio: Portfolio = data;

        // Verify ownership
        if (portfolio.user_id !== user.id) {
          throw new Error('このポートフォリオを編集する権限がありません');
        }

        // Set form data
        setFormData({
          title: portfolio.title,
          description: portfolio.description || '',
          category: portfolio.category || '',
          tags: portfolio.tags.join(', '),
          images: [],
        });

        // Set existing images
        setExistingImages(
          portfolio.image_urls.map((url, idx) => ({
            url,
            id: `existing-${idx}`,
          }))
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : '予期しないエラーが発生しました';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPortfolio();
  }, [portfolioId, router]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.currentTarget;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.currentTarget.files || []);
    const totalImages = existingImages.length + newPreviewImages.length;
    const remainingSlots = 5 - totalImages;
    const filesToAdd = files.slice(0, remainingSlots);

    const newPreviews = filesToAdd.map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setNewPreviewImages(prev => [...prev, ...newPreviews]);
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...filesToAdd],
    }));
  };

  const removeExistingImage = (id: string) => {
    setExistingImages(prev => prev.filter(img => img.id !== id));
  };

  const removeNewImage = (index: number) => {
    setNewPreviewImages(prev => {
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
    setIsSaving(true);

    try {
      // Validate form
      if (!formData.title.trim()) {
        throw new Error('タイトルを入力してください');
      }
      if (!formData.category) {
        throw new Error('カテゴリを選択してください');
      }
      if (existingImages.length + formData.images.length === 0) {
        throw new Error('最低1枚の画像が必要です');
      }

      const supabase = createClient();

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('ログインしてください');
      }

      // Upload new images
      const newImageUrls: string[] = [];
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
        newImageUrls.push(publicUrl);
      }

      // Combine all image URLs
      const allImageUrls = [...existingImages.map(img => img.url), ...newImageUrls];

      // Update portfolio record
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const { error: updateError } = await supabase
        .from('portfolios')
        .update({
          title: formData.title.trim(),
          description: formData.description.trim(),
          category: formData.category,
          image_urls: allImageUrls,
          tags: tagsArray,
          updated_at: new Date().toISOString(),
        })
        .eq('id', portfolioId);

      if (updateError) {
        throw new Error(`ポートフォリオ更新に失敗しました: ${updateError.message}`);
      }

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : '予期しないエラーが発生しました';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    setError(null);
    setIsDeleting(true);

    try {
      const supabase = createClient();

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('ログインしてください');
      }

      // Delete portfolio
      const { error: deleteError } = await supabase
        .from('portfolios')
        .delete()
        .eq('id', portfolioId)
        .eq('user_id', user.id);

      if (deleteError) {
        throw new Error(`削除に失敗しました: ${deleteError.message}`);
      }

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : '予期しないエラーが発生しました';
      setError(message);
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
          <p className="text-slate-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">ポートフォリオを編集</h1>
          <p className="mt-2 text-slate-600">
            ポートフォリオの情報を更新できます。
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
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              disabled={isSaving || isDeleting}
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
              rows={4}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent resize-none"
              disabled={isSaving || isDeleting}
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
              disabled={isSaving || isDeleting}
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
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              disabled={isSaving || isDeleting}
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

            {/* Existing Images */}
            {existingImages.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-slate-700 mb-2">現在の画像</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {existingImages.map((img, index) => (
                    <div
                      key={img.id}
                      className="relative aspect-square rounded-lg overflow-hidden bg-slate-100"
                    >
                      <img
                        src={img.url}
                        alt={`Portfolio ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(img.id)}
                        disabled={isSaving || isDeleting}
                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Area */}
            {existingImages.length + newPreviewImages.length < 5 && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-slate-400 transition-colors bg-slate-50"
              >
                <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                <p className="text-sm font-medium text-slate-700">
                  ここをクリックして画像を追加
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  またはドラッグ＆ドロップ
                </p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              disabled={isSaving || isDeleting || existingImages.length + newPreviewImages.length >= 5}
              className="hidden"
            />

            {/* New Image Preview */}
            {newPreviewImages.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-slate-700 mb-2">新しい画像</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {newPreviewImages.map((img, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-lg overflow-hidden bg-slate-100"
                    >
                      <img
                        src={img.preview}
                        alt={`New Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeNewImage(index)}
                        disabled={isSaving || isDeleting}
                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {existingImages.length + newPreviewImages.length > 0 && (
              <p className="mt-2 text-xs text-slate-500">
                {existingImages.length + newPreviewImages.length}/5枚
              </p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Delete Confirmation */}
          {showDeleteConfirm && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800 mb-4">
                このポートフォリオを削除してもよろしいですか？この操作は取り消せません。
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 border border-red-300 rounded-lg font-medium text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isDeleting ? '削除中...' : '削除する'}
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              disabled={isSaving || isDeleting}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              キャンセル
            </button>
            {!showDeleteConfirm && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSaving || isDeleting}
                className="px-4 py-2 border border-red-300 rounded-lg font-medium text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              disabled={isSaving || isDeleting}
              className="flex-1 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSaving ? '保存中...' : '保存する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
