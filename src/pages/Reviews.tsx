import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTelegramBackButton } from '../hooks/useTelegramBackButton';
import { useQuery } from '@tanstack/react-query';
import { getReviews, getMyReview } from '../api/endpoints';
import useAppStore from '../store/useAppStore';
import { useT } from '../i18n';
import { tapHaptic, selectionHaptic } from '../utils/haptics';
import Avatar from '../components/Avatar';
import SkeletonRow from '../components/SkeletonRow';
import { ArrowLeft, Star, MessageSquarePlus, Clock, Check, Edit3 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import ReviewPrompt from '../components/ReviewPrompt';

function timeAgo(dateStr: string, t: any) {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return t('time.justNow');
  if (diff < 3600) return t('time.minAgo', { n: Math.floor(diff / 60) });
  if (diff < 86400) return t('time.hourAgo', { n: Math.floor(diff / 3600) });
  const d = Math.floor(diff / 86400);
  if (d < 7) return t('time.dayAgo', { n: d });
  return new Date(dateStr).toLocaleDateString([], { day: 'numeric', month: 'short' });
}

function Stars({
  value,
  onChange,
  readonly = false,
  size = 28,
}: {
  value: number;
  onChange?: (val: number) => void;
  readonly?: boolean;
  size?: number;
}) {
  const [hov, setHov] = useState(0);
  const active = readonly ? value : hov || value;
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          disabled={readonly}
          onClick={readonly ? undefined : () => { selectionHaptic(); onChange?.(s); }}
          onMouseEnter={readonly ? undefined : () => setHov(s)}
          onMouseLeave={readonly ? undefined : () => setHov(0)}
          className="text-amber-400 transition-transform active:scale-90 disabled:cursor-default"
        >
          <Star size={size} fill={active >= s ? 'currentColor' : 'none'} strokeWidth={1.75} />
        </button>
      ))}
    </div>
  );
}

function RatingBar({ label, count, total }: { label: number; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
      <span className="w-3 text-right font-mono font-medium">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
        <div className="h-full bg-amber-400 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-5 text-left font-mono">{count}</span>
    </div>
  );
}

export default function Reviews() {
  const t = useT();
  const { navigate, screenParams } = useAppStore();
  const [showWriteModal, setShowWriteModal] = useState(false);

  useTelegramBackButton(() => navigate(screenParams?.from || 'profile'));

  // TanStack Query for Approved Public Reviews
  const { data: reviewsData, isLoading: reviewsLoading, refetch: refetchReviews } = useQuery({
    queryKey: ['reviews'],
    queryFn: () => getReviews(1),
  });

  // Query for Current User's Own Review
  const { data: myReviewData, refetch: refetchMyReview } = useQuery({
    queryKey: ['my_review'],
    queryFn: () => getMyReview(),
  });

  const reviews = reviewsData?.reviews || [];
  const stats = reviewsData?.stats || null;
  const myReview = myReviewData?.review || null;

  const handleOpenWrite = () => {
    tapHaptic('light');
    setShowWriteModal(true);
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg)] text-[var(--text-primary)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pt-[calc(12px+env(safe-area-inset-top,0px))] border-b border-[var(--border)] shrink-0 bg-[var(--chrome-bg)] backdrop-blur-md z-10">
        <Button variant="ghost" size="icon" className="rounded-full text-[var(--text-primary)] active:bg-[var(--surface-2)]" onClick={() => navigate(screenParams?.from || 'profile')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-base font-bold text-[var(--text-primary)]">{t('rm.title')}</h1>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full text-[var(--primary)] hover:bg-[var(--surface-2)] active:scale-95"
          onClick={handleOpenWrite}
          aria-label="Write Review"
        >
          <MessageSquarePlus className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-[calc(40px+env(safe-area-inset-bottom,0px))]">
        {/* Current user's own review status (if submitted) */}
        {myReview ? (
          <Card className="p-4 space-y-3 bg-gradient-to-br from-purple-950/20 to-blue-950/20 border border-purple-500/30 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black tracking-tight text-[var(--text-primary)]">Your Review</span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                  myReview.isApproved
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                }`}
              >
                {myReview.isApproved ? (
                  <>
                    <Check size={11} strokeWidth={2.5} />
                    <span>Approved &amp; Live</span>
                  </>
                ) : (
                  <>
                    <Clock size={11} strokeWidth={2.5} />
                    <span>Pending Admin Approval</span>
                  </>
                )}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <Stars value={myReview.rating} readonly size={16} />
              <button
                type="button"
                className="inline-flex items-center gap-1 text-xs text-[var(--primary)] font-bold active:scale-95 transition-transform"
                onClick={handleOpenWrite}
              >
                <Edit3 size={12} />
                <span>Edit</span>
              </button>
            </div>

            {myReview.comment && (
              <p className="text-xs text-[var(--text-primary)] italic bg-[var(--surface-2)] p-3 rounded-xl border border-[var(--border)] leading-relaxed">
                "{myReview.comment}"
              </p>
            )}

            {!myReview.isApproved && (
              <p className="text-[11px] text-[var(--text-secondary)] leading-tight">
                ℹ️ Sharhingiz admin tomonidan tasdiqlangach barcha foydalanuvchilarga ko'rinadi.
              </p>
            )}
          </Card>
        ) : (
          <button
            type="button"
            className="w-full h-11 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#00B2FE] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-purple-900/30 active:scale-98 transition-transform"
            onClick={handleOpenWrite}
          >
            <MessageSquarePlus size={16} />
            <span>Fikr qoldirish (Write a Review)</span>
          </button>
        )}

        {/* Stats summary */}
        {stats && stats.total > 0 && (
          <Card className="bg-[var(--surface)] border-[var(--border)] rounded-2xl shadow-md">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex flex-col items-center gap-1 min-w-[64px]">
                <span className="text-3xl font-extrabold text-[var(--text-primary)]">{stats.avg_rating}</span>
                <Stars value={Math.round(Number(stats.avg_rating))} readonly size={15} />
                <span className="text-[11px] text-[var(--text-secondary)] font-semibold">{stats.total} {t('rm.reviews')}</span>
              </div>
              <div className="flex-1 space-y-1.5">
                {[5, 4, 3, 2, 1].map((n) => (
                  <RatingBar
                    key={n}
                    label={n}
                    count={stats[`${['one', 'two', 'three', 'four', 'five'][n - 1]}_star`]}
                    total={stats.total}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* All approved reviews list */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-[var(--text-secondary)] px-1 uppercase tracking-wider">
            All Reviews ({reviews.length})
          </div>

          {reviewsLoading ? (
            [0, 1, 2, 3].map((i) => <SkeletonRow key={i} avatar={32} />)
          ) : reviews.length === 0 ? (
            <div className="text-center text-xs text-[var(--text-secondary)] py-14">
              {t('rm.noReviews')}
            </div>
          ) : (
            reviews.map((r: any) => (
              <Card key={r.id} className="p-4 space-y-2 bg-[var(--surface)] border-[var(--border)] rounded-2xl shadow-sm">
                <div className="flex items-center gap-3">
                  <Avatar name={r.display_name} size={36} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold truncate text-[var(--text-primary)]">{r.display_name || t('common.anonymous')}</div>
                    <div className="text-[10px] text-[var(--text-secondary)] font-medium">{timeAgo(r.created_at, t)}</div>
                  </div>
                  <Stars value={r.rating} readonly size={13} />
                </div>
                {r.comment && (
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed pl-12 italic">
                    "{r.comment}"
                  </p>
                )}
              </Card>
            ))
          )}
        </div>
      </div>

      {showWriteModal && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in"
          onClick={() => setShowWriteModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-[var(--surface)] border border-[var(--border)] p-6 shadow-2xl animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <ReviewPrompt
              forceShow={true}
              onClose={() => {
                setShowWriteModal(false);
                refetchReviews();
                refetchMyReview();
              }}
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
