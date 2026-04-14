'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { USER_TYPES, PREFECTURES } from '@/lib/constants';
import type { Profile } from '@/lib/types';

export default function ProfileEditPage() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    display_name: '',
    user_type: 'designer' as keyof typeof USER_TYPES,
    bio: '',
    prefecture: '',
    city: '',
    website_url: '',
    skills: '',
    experience_years: '',
    company_name: '',
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Fetch profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push('/login');
          return;
        }

        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          setMessage({
            type: 'error',
            text: 'プロフィール読み込みエラー',
          });
          return;
        }

        const typedProfile = profileData as Profile;
        setProfile(typedProfile);

        setFormData({
          display_name: typedProfile.display_name || '',
          user_type: typedProfile.user_type,
          bio: typedProfile.bio || '',
          prefecture: typedProfile.prefecture || '',
          city: typedProfile.city || '',
          website_url: typedProfile.website_url || '',
          skills: (typedProfile.skills || []).join(', '),
          experience_years: typedProfile.experience_years
            ? String(typedProfile.experience_years)
            : '',
          company_name: typedProfile.company_name || '',
        });

        if (typedProfile.avatar_url) {
          setAvatarPreview(typedProfile.avatar_url);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setMessage({
          type: 'error',
          text: '予期しないエラーが発生しました',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [supabase, router]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatarPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || !profile) {
        setMessage({
          type: 'error',
          text: 'ユーザー情報が見つかりません',
        });
        return;
      }

      let avatar_url = profile.avatar_url;

      // Upload avatar if changed
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile, { upsert: true });

        if (uploadError) {
          setMessage({
            type: 'error',
            text: 'アバター アップロード エラー',
          });
          setSaving(false);
          return;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from('avatars').getPublicUrl(fileName);

        avatar_url = publicUrl;
      }

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          display_name: formData.display_name,
          user_type: formData.user_type,
          bio: formData.bio || null,
          prefecture: formData.prefecture || null,
          city: formData.city || null,
          website_url: formData.website_url || null,
          skills: formData.skills
            ? formData.skills
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
            : [],
          experience_years: formData.experience_years
            ? parseInt(formData.experience_years)
            : null,
          company_name: formData.company_name || null,
          avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) {
        setMessage({
          type: 'error',
          text: 'プロフィール更新エラー',
        });
        setSaving(false);
        return;
      }

      setMessage({
        type: 'success',
        text: 'プロフィール更新成功',
      });

      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({
        type: 'error',
        text: '予期しないエラーが発生しました',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-8">
            プロフィール編集
          </h1>

          {message && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Upload */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-4">
                アバター
              </label>
              <div className="flex items-center space-x-6">
                {avatarPreview && (
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-100">
                    <img
                      src={avatarPreview}
                      alt="Avatar preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="block w-full text-sm text-slate-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
              </div>
            </div>

            {/* Display Name */}
            <div>
              <label
                htmlFor="display_name"
                className="block text-sm font-semibold text-slate-700 mb-2"
              >
                表示名
              </label>
              <input
                type="text"
                id="display_name"
                name="display_name"
                value={formData.display_name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* User Type */}
            <div>
              <label
                htmlFor="user_type"
                className="block text-sm font-semibold text-slate-700 mb-2"
              >
                ユーザー種別
              </label>
              <select
                id="user_type"
                name="user_type"
                value={formData.user_type}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(USER_TYPES).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Bio */}
            <div>
              <label
                htmlFor="bio"
                className="block text-sm font-semibold text-slate-700 mb-2"
              >
                自己紹介
              </label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Prefecture */}
            <div>
              <label
                htmlFor="prefecture"
                className="block text-sm font-semibold text-slate-700 mb-2"
              >
                都道府県
              </label>
              <select
                id="prefecture"
                name="prefecture"
                value={formData.prefecture}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">選択してください</option>
                {PREFECTURES.map((prefecture) => (
                  <option key={prefecture} value={prefecture}>
                    {prefecture}
                  </option>
                ))}
              </select>
            </div>

            {/* City */}
            <div>
              <label
                htmlFor="city"
                className="block text-sm font-semibold text-slate-700 mb-2"
              >
                市区町村
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Website URL */}
            <div>
              <label
                htmlFor="website_url"
                className="block text-sm font-semibold text-slate-700 mb-2"
              >
                ウェブサイト URL
              </label>
              <input
                type="url"
                id="website_url"
                name="website_url"
                value={formData.website_url}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Skills */}
            <div>
              <label
                htmlFor="skills"
                className="block text-sm font-semibold text-slate-700 mb-2"
              >
                スキル (カンマで区切ってください)
              </label>
              <input
                type="text"
                id="skills"
                name="skills"
                value={formData.skills}
                onChange={handleInputChange}
                placeholder="例: パターン制作, 裁断, 生地選定"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Experience Years */}
            <div>
              <label
                htmlFor="experience_years"
                className="block text-sm font-semibold text-slate-700 mb-2"
              >
                経験年数
              </label>
              <input
                type="number"
                id="experience_years"
                name="experience_years"
                value={formData.experience_years}
                onChange={handleInputChange}
                min="0"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Company Name */}
            <div>
              <label
                htmlFor="company_name"
                className="block text-sm font-semibold text-slate-700 mb-2"
              >
                会社名
              </label>
              <input
                type="text"
                id="company_name"
                name="company_name"
                value={formData.company_name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold rounded-lg transition-colors duration-200"
              >
                {saving ? '保存中...' : '保存'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="flex-1 px-6 py-3 bg-slate-300 hover:bg-slate-400 text-slate-900 font-semibold rounded-lg transition-colors duration-200"
              >
                キャンセル
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
