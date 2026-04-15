'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { USER_TYPES, PREFECTURES, SKILL_TAGS, SPECIALTY_CATEGORIES } from '@/lib/constants';
import type { Profile } from '@/lib/types';
import { Camera, Globe, ExternalLink, Link2, CheckCircle2, Bell } from 'lucide-react';

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
    instagram_url: '',
    twitter_url: '',
    sns_url: '',
    skills: [] as string[],
    experience_years: '',
    company_name: '',
    specialty_category: '',
    available_for_work: true,
    min_budget: '',
    email_notifications: true,
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [customSkill, setCustomSkill] = useState('');

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

        const p = profileData as Profile;
        setProfile(p);
        setFormData({
          display_name: p.display_name || '',
          user_type: p.user_type,
          bio: p.bio || '',
          prefecture: p.prefecture || '',
          city: p.city || '',
          website_url: p.website_url || '',
          instagram_url: p.instagram_url || '',
          twitter_url: p.twitter_url || '',
          sns_url: p.sns_url || '',
          skills: p.skills || [],
          experience_years: p.experience_years ? String(p.experience_years) : '',
          company_name: p.company_name || '',
          specialty_category: p.specialty_category || '',
          available_for_work: p.available_for_work ?? true,
          min_budget: p.min_budget ? String(p.min_budget) : '',
          email_notifications: p.email_notifications ?? true,
        });
        if (p.avatar_url) setAvatarPreview(p.avatar_url);
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

  const toggleSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill) ? prev.skills.filter(s => s !== skill) : [...prev.skills, skill],
    }));
  };

  const addCustomSkill = () => {
    const trimmed = customSkill.trim();
    if (trimmed && !formData.skills.includes(trimmed)) {
      setFormData(prev => ({ ...prev, skills: [...prev.skills, trimmed] }));
      setCustomSkill('');
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: '画像サイズは5MB以下にしてください' });
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setMessage({ type: 'error', text: 'ユーザー情報が見つかりません' }); return; }

      let avatar_url = profile?.avatar_url || null;
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, avatarFile, { upsert: true });
        if (uploadError) { setMessage({ type: 'error', text: 'アバターアップロードエラー: ' + uploadError.message }); setSaving(false); return; }
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
        instagram_url: formData.instagram_url || null,
        twitter_url: formData.twitter_url || null,
        sns_url: formData.sns_url || null,
        skills: formData.skills,
        experience_years: formData.experience_years ? parseInt(formData.experience_years) : null,
        company_name: formData.company_name || null,
        specialty_category: formData.specialty_category || null,
        available_for_work: formData.available_for_work,
        min_budget: formData.min_budget ? parseInt(formData.min_budget) : null,
        email_notifications: formData.email_notifications,
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

      setMessage({ type: 'success', text: isNewProfile ? 'プロフィールを作成しました！' : '保存しました！' });
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch {
      setMessage({ type: 'error', text: '予期しないエラーが発生しました' });
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full px-4 py-3 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:border-transparent";
  const inputStyle = { background: 'var(--surface-solid-2)', color: 'var(--text-primary)', borderColor: 'var(--border)', '--tw-ring-color': 'var(--accent)' } as React.CSSProperties;
  const labelClass = "block text-xs font-medium mb-2";
  const labelStyle = { color: 'var(--text-secondary)' };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="w-10 h-10 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--surface-3)', borderTopColor: 'var(--accent)' }} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="glass p-8 animate-fade-in">
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          {isNewProfile ? 'プロフィール設定' : 'プロフィール編集'}
        </h1>
        {isNewProfile && (
          <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>はじめに、あなたのプロフィールを設定しましょう。</p>
        )}

        {/* Status */}
        {profile?.status && profile.status !== 'approved' && (
          <div className="mb-6 glass p-4 flex items-center gap-3" style={{
            borderColor: profile.status === 'pending' ? 'rgba(251,191,36,0.2)' : profile.status === 'rejected' ? 'rgba(248,113,113,0.2)' : 'var(--border)',
          }}>
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{
              background: profile.status === 'pending' ? 'var(--warning)' : profile.status === 'rejected' ? 'var(--danger)' : 'var(--text-muted)',
            }} />
            <p className="text-xs font-medium" style={{
              color: profile.status === 'pending' ? 'var(--warning)' : profile.status === 'rejected' ? 'var(--danger)' : 'var(--text-muted)',
            }}>
              {profile.status === 'pending' ? '承認待ち — 管理者が確認中です' : profile.status === 'rejected' ? '非承認 — 内容を修正して再提出してください' : 'アカウント停止中'}
            </p>
          </div>
        )}

        {message && (
          <div className="mb-6 p-4 rounded-xl text-sm" style={{
            background: message.type === 'success' ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)',
            color: message.type === 'success' ? 'var(--success)' : 'var(--danger)',
            border: `1px solid ${message.type === 'success' ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)'}`,
          }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar */}
          <div>
            <label className={labelClass} style={labelStyle}>プロフィール写真</label>
            <div className="flex items-center gap-5">
              <label className="cursor-pointer group relative">
                <div className="avatar-ring">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-20 h-20 rounded-full object-cover" />
                  ) : (
                    <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: 'var(--surface-solid-2)', color: 'var(--text-muted)' }}>
                      <Camera className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </label>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>写真を変更</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>JPG, PNG, GIF / 5MB以下</p>
              </div>
            </div>
          </div>

          {/* Display Name + User Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="display_name" className={labelClass} style={labelStyle}>表示名 *</label>
              <input type="text" id="display_name" name="display_name" value={formData.display_name} onChange={handleInputChange}
                className={inputClass} style={inputStyle} required />
            </div>
            <div>
              <label htmlFor="user_type" className={labelClass} style={labelStyle}>カテゴリ</label>
              <select id="user_type" name="user_type" value={formData.user_type} onChange={handleInputChange}
                className={inputClass} style={inputStyle}>
                {Object.entries(USER_TYPES).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Bio */}
          <div>
            <label htmlFor="bio" className={labelClass} style={labelStyle}>自己紹介</label>
            <textarea id="bio" name="bio" value={formData.bio} onChange={handleInputChange} rows={4}
              placeholder="あなたの経歴、得意分野、実績などを書きましょう"
              className={inputClass} style={inputStyle} />
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="prefecture" className={labelClass} style={labelStyle}>都道府県</label>
              <select id="prefecture" name="prefecture" value={formData.prefecture} onChange={handleInputChange}
                className={inputClass} style={inputStyle}>
                <option value="">選択</option>
                {PREFECTURES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="city" className={labelClass} style={labelStyle}>市区町村</label>
              <input type="text" id="city" name="city" value={formData.city} onChange={handleInputChange}
                className={inputClass} style={inputStyle} />
            </div>
          </div>

          {/* Work Status Section */}
          <div className="pt-2" style={{ borderTop: '1px solid var(--border)' }}>
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>仕事の受付</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setFormData(prev => ({ ...prev, available_for_work: !prev.available_for_work }))}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: formData.available_for_work ? 'rgba(52,211,153,0.1)' : 'var(--surface-2)',
                    color: formData.available_for_work ? 'var(--success)' : 'var(--text-muted)',
                    border: `1px solid ${formData.available_for_work ? 'rgba(52,211,153,0.3)' : 'var(--border)'}`,
                  }}>
                  <CheckCircle2 className="w-4 h-4" />
                  {formData.available_for_work ? '仕事受付中' : '受付停止中'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="specialty_category" className={labelClass} style={labelStyle}>専門カテゴリ</label>
                  <select id="specialty_category" name="specialty_category" value={formData.specialty_category} onChange={handleInputChange}
                    className={inputClass} style={inputStyle}>
                    <option value="">選択</option>
                    {Object.entries(SPECIALTY_CATEGORIES).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="min_budget" className={labelClass} style={labelStyle}>最低受注金額（円）</label>
                  <input type="number" id="min_budget" name="min_budget" value={formData.min_budget} onChange={handleInputChange}
                    placeholder="例: 30000" min="0"
                    className={inputClass} style={inputStyle} />
                </div>
              </div>
            </div>
          </div>

          {/* SNS Links Section */}
          <div className="pt-2" style={{ borderTop: '1px solid var(--border)' }}>
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>SNS・Webサイト</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="instagram_url" className={labelClass} style={labelStyle}>
                  <span className="flex items-center gap-1.5"><Link2 className="w-3.5 h-3.5" /> Instagram</span>
                </label>
                <input type="url" id="instagram_url" name="instagram_url" value={formData.instagram_url} onChange={handleInputChange}
                  placeholder="https://instagram.com/username"
                  className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label htmlFor="twitter_url" className={labelClass} style={labelStyle}>
                  <span className="flex items-center gap-1.5"><ExternalLink className="w-3.5 h-3.5" /> X (Twitter)</span>
                </label>
                <input type="url" id="twitter_url" name="twitter_url" value={formData.twitter_url} onChange={handleInputChange}
                  placeholder="https://x.com/username"
                  className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label htmlFor="website_url" className={labelClass} style={labelStyle}>
                  <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Webサイト</span>
                </label>
                <input type="url" id="website_url" name="website_url" value={formData.website_url} onChange={handleInputChange}
                  placeholder="https://your-website.com"
                  className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label htmlFor="sns_url" className={labelClass} style={labelStyle}>
                  <span className="flex items-center gap-1.5"><ExternalLink className="w-3.5 h-3.5" /> その他リンク</span>
                </label>
                <input type="url" id="sns_url" name="sns_url" value={formData.sns_url} onChange={handleInputChange}
                  placeholder="https://behance.net/username"
                  className={inputClass} style={inputStyle} />
              </div>
            </div>
          </div>

          {/* Skills Section */}
          <div className="pt-2" style={{ borderTop: '1px solid var(--border)' }}>
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>スキル・得意分野</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {SKILL_TAGS.map(tag => (
                <button key={tag} type="button" onClick={() => toggleSkill(tag)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                  style={{
                    background: formData.skills.includes(tag) ? 'var(--accent-subtle)' : 'var(--surface-2)',
                    color: formData.skills.includes(tag) ? 'var(--accent-light)' : 'var(--text-muted)',
                    border: `1px solid ${formData.skills.includes(tag) ? 'var(--accent)' : 'var(--border)'}`,
                  }}>
                  {tag}
                </button>
              ))}
            </div>
            {/* Custom skill */}
            <div className="flex gap-2">
              <input type="text" value={customSkill} onChange={(e) => setCustomSkill(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomSkill(); } }}
                placeholder="その他のスキルを追加..."
                className={inputClass} style={inputStyle} />
              <button type="button" onClick={addCustomSkill}
                className="btn-glass px-4 py-2 text-sm flex-shrink-0">追加</button>
            </div>
            {/* Selected custom skills (non-preset ones) */}
            {formData.skills.filter(s => !SKILL_TAGS.includes(s as typeof SKILL_TAGS[number])).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {formData.skills.filter(s => !SKILL_TAGS.includes(s as typeof SKILL_TAGS[number])).map(skill => (
                  <span key={skill} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium"
                    style={{ background: 'var(--accent-subtle)', color: 'var(--accent-light)', border: '1px solid var(--accent)' }}>
                    {skill}
                    <button type="button" onClick={() => toggleSkill(skill)} className="hover:opacity-70">
                      <span className="text-xs">×</span>
                    </button>
                  </span>
                ))}
              </div>
            )}
            <p className="text-[10px] mt-2" style={{ color: 'var(--text-muted)' }}>検索で見つけてもらいやすくなります</p>
          </div>

          {/* Experience + Company */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="experience_years" className={labelClass} style={labelStyle}>経験年数</label>
              <input type="number" id="experience_years" name="experience_years" value={formData.experience_years} onChange={handleInputChange} min="0"
                className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label htmlFor="company_name" className={labelClass} style={labelStyle}>会社・屋号</label>
              <input type="text" id="company_name" name="company_name" value={formData.company_name} onChange={handleInputChange}
                className={inputClass} style={inputStyle} />
            </div>
          </div>

          {/* Notification Settings */}
          <div className="pt-2" style={{ borderTop: '1px solid var(--border)' }}>
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>通知設定</h3>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setFormData(prev => ({ ...prev, email_notifications: !prev.email_notifications }))}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: formData.email_notifications ? 'rgba(124,91,240,0.1)' : 'var(--surface-2)',
                  color: formData.email_notifications ? 'var(--accent-light)' : 'var(--text-muted)',
                  border: `1px solid ${formData.email_notifications ? 'rgba(124,91,240,0.3)' : 'var(--border)'}`,
                }}>
                <Bell className="w-4 h-4" />
                {formData.email_notifications ? 'メール通知 ON' : 'メール通知 OFF'}
              </button>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                メッセージ受信時にメールでお知らせします（30分間隔）
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={saving} className="btn-primary flex-1 py-3 text-sm disabled:opacity-40">
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  保存中...
                </span>
              ) : '保存する'}
            </button>
            <button type="button" onClick={() => router.push('/dashboard')} className="btn-glass flex-1 py-3 text-sm">
              キャンセル
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
