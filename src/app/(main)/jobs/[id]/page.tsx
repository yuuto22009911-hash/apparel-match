'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { JOB_CATEGORIES, JOB_STATUSES, PROPOSAL_STATUSES } from '@/lib/constants';
import type { Job, Profile, JobProposal } from '@/lib/types';
import { MapPin, Calendar, Banknote, Clock, MessageSquare, Star, ArrowLeft, Check, X as XIcon } from 'lucide-react';
import StartChatButton from '@/components/chat/StartChatButton';
import ReviewForm from '@/components/review/ReviewForm';
import ShareButton from '@/components/shared/ShareButton';

interface JobWithOwner extends Job {
  profiles: Profile;
}

interface ProposalWithProfile extends JobProposal {
  profiles: Profile;
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [job, setJob] = useState<JobWithOwner | null>(null);
  const [proposals, setProposals] = useState<ProposalWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [hasProposed, setHasProposed] = useState(false);
  const [updatingProposal, setUpdatingProposal] = useState<string | null>(null);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [acceptedProposerId, setAcceptedProposerId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUserId(user?.id || null);

        const { data: jobData, error: jobError } = await supabase
          .from('jobs')
          .select('*, profiles!owner_id(*)')
          .eq('id', id)
          .single();

        if (jobError || !jobData) { router.push('/jobs'); return; }
        setJob(jobData as JobWithOwner);

        // Fetch proposals (visible to owner or proposer via RLS)
        if (user) {
          const { data: proposalData } = await supabase
            .from('job_proposals')
            .select('*, profiles!job_proposals_proposer_id_fkey(*)')
            .eq('job_id', id)
            .order('created_at', { ascending: false });

          setProposals((proposalData as ProposalWithProfile[]) || []);
          setHasProposed(proposalData?.some(p => p.proposer_id === user.id) || false);
          const accepted = proposalData?.find(p => p.status === 'accepted');
          if (accepted) setAcceptedProposerId(accepted.proposer_id);

          // Check if user has already reviewed
          const { data: existingReview } = await supabase
            .from('reviews')
            .select('id')
            .eq('job_id', id)
            .eq('reviewer_id', user.id)
            .maybeSingle();
          if (existingReview) setHasReviewed(true);
        }
      } catch {
        router.push('/jobs');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const isOwner = currentUserId === job?.owner_id;

  const handleProposalAction = async (proposalId: string, action: 'accepted' | 'rejected') => {
    if (!isOwner) return;
    setUpdatingProposal(proposalId);
    try {
      const { error } = await supabase
        .from('job_proposals')
        .update({ status: action })
        .eq('id', proposalId);

      if (error) throw error;

      // If accepted, update job status
      if (action === 'accepted') {
        await supabase.from('jobs').update({ status: 'in_progress' }).eq('id', id);
        setJob(prev => prev ? { ...prev, status: 'in_progress' } : null);
      }

      setProposals(prev => prev.map(p => p.id === proposalId ? { ...p, status: action } : p));
    } catch {
      // silently fail
    } finally {
      setUpdatingProposal(null);
    }
  };

  const handleCompleteJob = async () => {
    if (!isOwner) return;
    const { error } = await supabase.from('jobs').update({ status: 'completed' }).eq('id', id);
    if (!error) setJob(prev => prev ? { ...prev, status: 'completed' } : null);
  };

  const formatBudget = (min: number | null, max: number | null) => {
    if (!min && !max) return '相談';
    if (min && max) return `¥${min.toLocaleString()} 〜 ¥${max.toLocaleString()}`;
    if (min) return `¥${min.toLocaleString()} 〜`;
    return `〜 ¥${max!.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--surface-3)', borderTopColor: 'var(--accent)' }} />
      </div>
    );
  }

  if (!job) return null;

  const statusColor = {
    open: 'var(--success)',
    in_progress: 'var(--accent-light)',
    completed: 'var(--text-muted)',
    cancelled: 'var(--danger)',
  }[job.status] || 'var(--text-muted)';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Back */}
      <button onClick={() => router.push('/jobs')}
        className="flex items-center gap-1.5 text-sm font-medium transition-colors animate-fade-in"
        style={{ color: 'var(--text-muted)' }}>
        <ArrowLeft className="w-4 h-4" /> 案件一覧に戻る
      </button>

      {/* Job Detail */}
      <div className="glass p-8 animate-fade-in">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="tag">{JOB_CATEGORIES[job.category as keyof typeof JOB_CATEGORIES] || job.category}</span>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
            style={{ background: `${statusColor}15`, color: statusColor, border: `1px solid ${statusColor}30` }}>
            {JOB_STATUSES[job.status as keyof typeof JOB_STATUSES]}
          </span>
        </div>

        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{job.title}</h1>
          <ShareButton
            title={`${job.title} | VESTIE`}
            text={`${job.title} — ${JOB_CATEGORIES[job.category as keyof typeof JOB_CATEGORIES] || job.category}`}
            compact
          />
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="p-3 rounded-xl" style={{ background: 'var(--surface-2)' }}>
            <div className="flex items-center gap-1.5 text-[10px] font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
              <Banknote className="w-3 h-3" /> 予算
            </div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{formatBudget(job.budget_min, job.budget_max)}</p>
          </div>
          <div className="p-3 rounded-xl" style={{ background: 'var(--surface-2)' }}>
            <div className="flex items-center gap-1.5 text-[10px] font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
              <Calendar className="w-3 h-3" /> 納期
            </div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {job.deadline ? new Date(job.deadline).toLocaleDateString('ja-JP') : '相談'}
            </p>
          </div>
          <div className="p-3 rounded-xl" style={{ background: 'var(--surface-2)' }}>
            <div className="flex items-center gap-1.5 text-[10px] font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
              <MapPin className="w-3 h-3" /> エリア
            </div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{job.prefecture || '全国'}</p>
          </div>
          <div className="p-3 rounded-xl" style={{ background: 'var(--surface-2)' }}>
            <div className="flex items-center gap-1.5 text-[10px] font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
              <Clock className="w-3 h-3" /> 投稿日
            </div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {new Date(job.created_at).toLocaleDateString('ja-JP')}
            </p>
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <h2 className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>詳細</h2>
          <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>{job.description}</p>
        </div>

        {/* Tags */}
        {job.tags && job.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {job.tags.map((tag, idx) => (
              <span key={idx} className="px-3 py-1 rounded-full text-xs font-medium"
                style={{ background: 'var(--surface-2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Owner Info */}
        <div className="pt-6 flex items-center justify-between" style={{ borderTop: '1px solid var(--border)' }}>
          <Link href={`/profile/${job.owner_id}`} className="flex items-center gap-3 group">
            {job.profiles?.avatar_url ? (
              <img src={job.profiles.avatar_url} alt={job.profiles.display_name} className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold"
                style={{ background: 'var(--surface-solid-2)', color: 'var(--accent-light)' }}>
                {job.profiles?.display_name?.charAt(0)}
              </div>
            )}
            <div>
              <p className="text-sm font-semibold group-hover:underline" style={{ color: 'var(--text-primary)' }}>{job.profiles?.display_name}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>投稿者</p>
            </div>
          </Link>
          <div className="flex gap-2">
            {!isOwner && currentUserId && (
              <>
                <StartChatButton targetUserId={job.owner_id} />
                {job.status === 'open' && !hasProposed && (
                  <Link href={`/jobs/${id}/propose`} className="btn-primary px-5 py-2.5 text-sm">
                    提案する
                  </Link>
                )}
                {hasProposed && (
                  <span className="px-4 py-2.5 rounded-xl text-sm font-medium"
                    style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
                    提案済み
                  </span>
                )}
              </>
            )}
            {isOwner && job.status === 'in_progress' && (
              <button onClick={handleCompleteJob} className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2">
                <Check className="w-4 h-4" /> 完了にする
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Proposals Section (visible to owner) */}
      {isOwner && proposals.length > 0 && (
        <div className="glass p-8 animate-fade-in animate-fade-in-delay-1">
          <h2 className="text-lg font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
            提案 ({proposals.length}件)
          </h2>
          <div className="space-y-4">
            {proposals.map((proposal) => (
              <div key={proposal.id} className="p-5 rounded-2xl" style={{ background: 'var(--surface-2)' }}>
                <div className="flex items-start justify-between gap-4">
                  <Link href={`/profile/${proposal.proposer_id}`} className="flex items-center gap-3 flex-shrink-0 group">
                    {proposal.profiles?.avatar_url ? (
                      <img src={proposal.profiles.avatar_url} alt={proposal.profiles.display_name}
                        className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold"
                        style={{ background: 'var(--surface-solid-2)', color: 'var(--accent-light)' }}>
                        {proposal.profiles?.display_name?.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold group-hover:underline" style={{ color: 'var(--text-primary)' }}>
                        {proposal.profiles?.display_name}
                      </p>
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        {new Date(proposal.created_at).toLocaleDateString('ja-JP')}
                      </p>
                    </div>
                  </Link>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                    style={{
                      background: proposal.status === 'accepted' ? 'rgba(52,211,153,0.1)' : proposal.status === 'rejected' ? 'rgba(248,113,113,0.1)' : 'var(--accent-subtle)',
                      color: proposal.status === 'accepted' ? 'var(--success)' : proposal.status === 'rejected' ? 'var(--danger)' : 'var(--accent-light)',
                    }}>
                    {PROPOSAL_STATUSES[proposal.status as keyof typeof PROPOSAL_STATUSES]}
                  </span>
                </div>

                <p className="text-sm mt-3 leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>
                  {proposal.message}
                </p>

                <div className="flex items-center gap-4 mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                  {proposal.proposed_price && (
                    <span className="flex items-center gap-1">
                      <Banknote className="w-3.5 h-3.5" /> ¥{proposal.proposed_price.toLocaleString()}
                    </span>
                  )}
                  {proposal.proposed_deadline && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> {new Date(proposal.proposed_deadline).toLocaleDateString('ja-JP')}
                    </span>
                  )}
                </div>

                {/* Action buttons for pending proposals */}
                {proposal.status === 'pending' && (
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleProposalAction(proposal.id, 'accepted')}
                      disabled={updatingProposal === proposal.id}
                      className="btn-primary px-4 py-2 text-xs flex items-center gap-1.5 disabled:opacity-40">
                      <Check className="w-3.5 h-3.5" /> 採用
                    </button>
                    <button
                      onClick={() => handleProposalAction(proposal.id, 'rejected')}
                      disabled={updatingProposal === proposal.id}
                      className="btn-glass px-4 py-2 text-xs flex items-center gap-1.5 disabled:opacity-40"
                      style={{ color: 'var(--danger)' }}>
                      <XIcon className="w-3.5 h-3.5" /> 不採用
                    </button>
                    <StartChatButton targetUserId={proposal.proposer_id} compact={true} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* For non-owner proposers — show their own proposal */}
      {!isOwner && proposals.length > 0 && (
        <div className="glass p-8 animate-fade-in animate-fade-in-delay-1">
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>あなたの提案</h2>
          {proposals.filter(p => p.proposer_id === currentUserId).map((proposal) => (
            <div key={proposal.id} className="p-5 rounded-2xl" style={{ background: 'var(--surface-2)' }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  {new Date(proposal.created_at).toLocaleDateString('ja-JP')} に提案
                </p>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                  style={{
                    background: proposal.status === 'accepted' ? 'rgba(52,211,153,0.1)' : proposal.status === 'rejected' ? 'rgba(248,113,113,0.1)' : 'var(--accent-subtle)',
                    color: proposal.status === 'accepted' ? 'var(--success)' : proposal.status === 'rejected' ? 'var(--danger)' : 'var(--accent-light)',
                  }}>
                  {PROPOSAL_STATUSES[proposal.status as keyof typeof PROPOSAL_STATUSES]}
                </span>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>
                {proposal.message}
              </p>
              <div className="flex items-center gap-4 mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                {proposal.proposed_price && <span>提示金額: ¥{proposal.proposed_price.toLocaleString()}</span>}
                {proposal.proposed_deadline && <span>提示納期: {new Date(proposal.proposed_deadline).toLocaleDateString('ja-JP')}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Section — shown when job is completed */}
      {job.status === 'completed' && currentUserId && !hasReviewed && (
        <div className="glass p-8 animate-fade-in animate-fade-in-delay-2">
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>レビューを投稿</h2>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>案件が完了しました。相手を評価しましょう。</p>
          {isOwner && acceptedProposerId ? (
            <ReviewForm
              jobId={id}
              revieweeId={acceptedProposerId}
              revieweeName={proposals.find(p => p.proposer_id === acceptedProposerId)?.profiles?.display_name || '提案者'}
              onComplete={() => setHasReviewed(true)}
            />
          ) : !isOwner ? (
            <ReviewForm
              jobId={id}
              revieweeId={job.owner_id}
              revieweeName={job.profiles?.display_name || '投稿者'}
              onComplete={() => setHasReviewed(true)}
            />
          ) : null}
        </div>
      )}

      {job.status === 'completed' && hasReviewed && (
        <div className="glass p-8 text-center animate-fade-in animate-fade-in-delay-2">
          <Star className="w-10 h-10 mx-auto mb-3" fill="var(--warning)" stroke="var(--warning)" />
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>レビューを投稿済みです</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>ご協力ありがとうございます</p>
        </div>
      )}
    </div>
  );
}
