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
  const [isNewProfile, setIsNewProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/login'); return; }

        const { data: profileData, error } = await supabase
          .from('profiles').select('*').eq('id', user.id).maybeSingle();

        if (error) {
          setMessage({ type: 'error', text: 'プロフィール読み込みエラー: ' + error.message });
          setLoading(false);
          return;
        }

        if (!profileData) {
          setIsNewProfile(true);
          setFormData(prev => ({ ...prev, display_name: user.email?.split('@')[0] || 'ユーザー' }));
          setLoading(false);
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
          experience_years: typedProfile.experience_years ? String(typedProfile.experience_years) : '',
          company_name: typedProfile.company_name || '',
        });
        if (typedProfile.avatar_url) setAvatarPreview(typedProfile.avatar_url);
      } catch {
        setMessage({ type: 'error', text: '予期しないエラーが発生しました' });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [supabase, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setMessage({ type: 'error', text: 'ユーザー情報が見つかりません' }); return; }

      let avatar_url = profile?.avatar_url || null;
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, avatarFile, { upsert: true });
        if (uploadError) { setMessage({ type: 'error', text: 'アバターアップロードエラー' }); setSaving(false); return; }
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
        avatar_url = publicUrl;
      }

      const profilePayload = {
        display_name: formData.display_name,
        user_type: formData.user_type,
        bio: formData.bio || null,
        prefecture: formData.prefecture || null,
        city: formData.city || null,
        website_url: formData.website_url || null,
        skills: formData.skills ? formData.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
        experience_years: formData.experience_years ? parseInt(formData.experience_years) : null,
        company_name: formData.company_name || null,
        avatar_url,
        updated_at: new Date().toISOString(),
      };

      if (isNewProfile) {
        const { error: insertError } = await supabase.from('profiles').insert({ id: user.id, ...profilePayload, is_public: true });
        if (insertError) { setMessage({ type: 'error', text: 'プロフィール作成エラー: ' + insertError.message }); setSaving(false); return; }
      } else {
        const { error: updateError } = await supabase.from('profiles').update(profilePayload).eq('id', user.id);
        if (updateError) { setMessage({ type: 'error', text: 'プロフィール更新エラー: ' + updateError.message }); setSaving(false); return; }
      }

      setMessage({ type: 'success', text: isNewProfile ? 'プロフィールを作成しました' : 'プロフィールを更新しました' });
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch {
      setMessage({ type: 'error', text: '予期しないエラーが発生しました' });
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    background: 'var(--surface-2)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
  } as React.CSSProperties;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--surface-3)', borderTopColor: 'var(--accent)' }} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="rounded-xl p-6 sm:p-8" style={{ background: 'var(--surface)' }}>
        <h1 className="text-xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
          {isNewProfile ? 'プロフィール設定' : 'プロフィール編集'}
        </h1>
        {isNewProfile && (
          <p className="text-xs mb-6" style={{ color: 'var(--text-muted)' }}>はじめに、あなたのプロフィールを設定しましょう。</p>
        )}

        {/* Status */}
        {profile?.status && profile.status !== 'approved' && (
          <div className="mb-6 p-3 rounded-lg" style={{
            background: profile.status === 'pending' ? 'rgba(245,158,11,0.1)' : profile.status === 'rejected' ? 'rgba(239,68,68,0.1)' : 'var(--surface-2)',
            border: `1px solid ${profile.status === 'pending' ? 'rgba(245,158,11,0.2)' : profile.status === 'rejected' ? 'rgba(239,68,68,0.2)' : 'var(--border)'}`,
          }}>
            <p className="text-xs font-medium" style={{ color: profile.status === 'pending' ? 'var(--warning)' : profile.status === 'rejected' ? 'var(--danger)' : 'var(--text-muted)' }}>
              ステータス：{profile.status === 'pending' ? '承認待ち' : profile.status === 'rejected' ? '非承認 - 内容を修正してください' : '停止中'}
            </p>
          </div>
        )}

        {message && (
          <div className="mb-6 p-3 rounded-lg text-sm" style={{
            background: message.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            color: message.type === 'success' ? 'var(--success)' : 'var(--danger)',
          }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Avatar */}
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>アバター</label>
            <div className="flex items-center gap-4">
              {avatarPreview && (
                <div className="w-16 h-16 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="text-xs"
                style={{ color: 'var(--text-muted)' }}
              />
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label htmlFor="display_name" className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>表示名</label>
            <input type="text" id="display_name" name="display_name" value={formData.display_name} onChange={handleInputChange}
              className="w-full px-3.5 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2" style={{ ...inputStyle, '--tw-ring-color': 'var(--accent)' } as React.CSSProperties} required />
          </div>

          {/* User Type */}
          <div>
            <label htmlFor="user_type" className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>ユーザー種別</label>
            <select id="user_type" name="user_type" value={formData.user_type} onChange={handleInputChange}
              className="w-full px-3.5 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2" style={{ ...inputStyle, '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}>
              {Object.entries(USER_TYPES).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {/* Bio */}
          <div>
            <label htmlFor="bio" className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>自己紹介</label>
            <textarea id="bio" name="bio" value={formData.bio} onChange={handleInputChange} rows={4}
              className="w-full px-3.5 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2" style={{ ...inputStyle, '--tw-ring-color': 'var(--accent)' } as React.CSSProperties} />
          </div>

          {/* Prefecture + City */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="prefecture" className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>都道府県</label>
              <select id="prefecture" name="prefecture" value={formData.prefecture} onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2" style={{ ...inputStyle, '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}>
                <option value="">選択</option>
                {PREFECTURES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="city" className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>市区町村</label>
              <input type="text" id="city" name="city" value={formData.city} onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2" style={{ ...inputStyle, '--tw-ring-color': 'var(--accent)' } as React.CSSProperties} />
            </div>
          </div>

          {/* Website */}
          <div>
            <label htmlFor="website_url" className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>ウェブサイト</label>
            <input type="url" id="website_url" name="website_url" value={formData.website_url} onChange={handleInputChange}
              className="w-full px-3.5 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2" style={{ ...inputStyle, '--tw-ring-color': 'var(--accent)' } as React.CSSProperties} />
          </div>

          {/* Skills */}
          <div>
            <label htmlFor="skills" className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>スキル（カンマ区切り）</label>
            <input type="text" id="skills" name="skills" value={formData.skills} onChange={handleInputChange} placeholder="例: パターン制作, 裁断, 生地選定"
              className="w-full px-3.5 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2" style={{ ...inputStyle, '--tw-ring-color': 'var(--accent)' } as React.CSSProperties} />
          </div>

          {/* Experience + Company */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="experience_years" className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>経験年数</label>
              <input type="number" id="experience_years" name="experience_years" value={formData.experience_years} onChange={handleInputChange} min="0"
                className="w-full px-3.5 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2" style={{ ...inputStyle, '--tw-ring-color': 'var(--accent)' } as React.CSSProperties} />
            </div>
            <div>
              <label htmlFor="company_name" className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>会社名</label>
              <input type="text" id="company_name" name="company_name" value={formData.company_name} onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2" style={{ ...inputStyle, '--tw-ring-color': 'var(--accent)' } as React.CSSProperties} />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium disabled:opacity-40"
              style={{ background: 'var(--accent)', color: 'white' }}>
              {saving ? '保存中...' : '保存'}
            </button>
            <button type="button" onClick={() => router.push('/dashboard')}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium"
              style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
              キャンセル
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
