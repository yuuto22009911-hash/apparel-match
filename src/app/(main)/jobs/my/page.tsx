'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { JOB_CATEGORIES, JOB_STATUSES, PROPOSAL_STATUSES } from '@/lib/constants';
import type { Job, JobProposal } from '@/lib/types';
import { Plus, Banknote, Calendar, FileText } from 'lucide-react';

interface ProposalWithJob extends JobProposal {
  jobs: Job;
}

export default function MyJobsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<'posted' | 'proposed'>('posted');
  const [postedJobs, setPostedJobs] = useState<Job[]>([]);
  const [proposedJobs, setProposedJobs] = useState<ProposalWithJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const [{ data: posted }, { data: proposed }] = await Promise.all([
        supabase.from('jobs').select('*').eq('owner_id', user.id).order('created_at', { ascending: false }),
        supabase.from('job_proposals').select('*, jobs(*)').eq('proposer_id', user.id).order('created_at', { ascending: false }),
      ]);

      setPostedJobs((posted as Job[]) || []);
      setProposedJobs((proposed as ProposalWithJob[]) || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const statusColor = (status: string) => {
    switch (status) {
      case 'open': return 'var(--success)';
      case 'in_progress': return 'var(--accent-light)';
      case 'completed': return 'var(--text-muted)';
      case 'cancelled': return 'var(--danger)';
      default: return 'var(--text-muted)';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--surface-3)', borderTopColor: 'var(--accent)' }} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-start justify-between animate-fade-in">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>マイ案件</h1>
        <Link href="/jobs/new" className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm">
          <Plus className="w-4 h-4" /> 新規投稿
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl animate-fade-in animate-fade-in-delay-1" style={{ background: 'var(--surface-2)' }}>
        <button onClick={() => setActiveTab('posted')}
          className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all"
          style={{
            background: activeTab === 'posted' ? 'var(--surface-solid-2)' : 'transparent',
            color: activeTab === 'posted' ? 'var(--text-primary)' : 'var(--text-muted)',
          }}>
          投稿した案件 ({postedJobs.length})
        </button>
        <button onClick={() => setActiveTab('proposed')}
          className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all"
          style={{
            background: activeTab === 'proposed' ? 'var(--surface-solid-2)' : 'transparent',
            color: activeTab === 'proposed' ? 'var(--text-primary)' : 'var(--text-muted)',
          }}>
          提案した案件 ({proposedJobs.length})
        </button>
      </div>

      {/* Posted Jobs */}
      {activeTab === 'posted' && (
        <div className="space-y-3">
          {postedJobs.length > 0 ? postedJobs.map((job) => {
            const sc = statusColor(job.status);
            return (
              <Link key={job.id} href={`/jobs/${job.id}`} className="glass glass-hover block p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="tag">{JOB_CATEGORIES[job.category as keyof typeof JOB_CATEGORIES]}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                        style={{ background: `${sc}15`, color: sc }}>
                        {JOB_STATUSES[job.status as keyof typeof JOB_STATUSES]}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{job.title}</h3>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      {new Date(job.created_at).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                  {(job.budget_min || job.budget_max) && (
                    <div className="flex items-center gap-1 text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                      <Banknote className="w-3.5 h-3.5" />
                      {job.budget_min && `¥${job.budget_min.toLocaleString()}`}
                      {job.budget_min && job.budget_max && ' 〜 '}
                      {job.budget_max && `¥${job.budget_max.toLocaleString()}`}
                    </div>
                  )}
                </div>
              </Link>
            );
          }) : (
            <div className="glass p-12 text-center">
              <FileText className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>まだ案件を投稿していません</p>
            </div>
          )}
        </div>
      )}

      {/* Proposed Jobs */}
      {activeTab === 'proposed' && (
        <div className="space-y-3">
          {proposedJobs.length > 0 ? proposedJobs.map((proposal) => {
            const job = proposal.jobs;
            if (!job) return null;
            return (
              <Link key={proposal.id} href={`/jobs/${job.id}`} className="glass glass-hover block p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="tag">{JOB_CATEGORIES[job.category as keyof typeof JOB_CATEGORIES]}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                        style={{
                          background: proposal.status === 'accepted' ? 'rgba(52,211,153,0.1)' : proposal.status === 'rejected' ? 'rgba(248,113,113,0.1)' : 'var(--accent-subtle)',
                          color: proposal.status === 'accepted' ? 'var(--success)' : proposal.status === 'rejected' ? 'var(--danger)' : 'var(--accent-light)',
                        }}>
                        {PROPOSAL_STATUSES[proposal.status as keyof typeof PROPOSAL_STATUSES]}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{job.title}</h3>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      提案日: {new Date(proposal.created_at).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                  {proposal.proposed_price && (
                    <div className="flex items-center gap-1 text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                      <Banknote className="w-3.5 h-3.5" /> ¥{proposal.proposed_price.toLocaleString()}
                    </div>
                  )}
                </div>
              </Link>
            );
          }) : (
            <div className="glass p-12 text-center">
              <FileText className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>まだ提案していません</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
