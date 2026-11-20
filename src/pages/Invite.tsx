import React, { useEffect, useState } from 'react';
import { getInvite } from '../api/endpoints';
import useAppStore from '../store/useAppStore';
import { useTelegramBackButton } from '../hooks/useTelegramBackButton';
import { useT } from '../i18n';
import { notifyHaptic, tapHaptic } from '../utils/haptics';
import { ArrowLeft, Award, Check, Copy, Gift, Medal, Send, Trophy } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';

export default function Invite() {
  const t = useT();
  const { invite, setInvite, navigate, screenParams } = useAppStore();

  useTelegramBackButton(() => navigate(screenParams?.from || 'profile'));
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const loaded = invite !== null;

  useEffect(() => {
    getInvite()
      .then(setInvite)
      .catch(() => {
        if (!invite) setError(t('im.error'));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const link = invite?.referralLink || '';
  const count = invite?.referralCount || 0;
  const weeklyTop = invite?.weeklyTop || [];
  const weeklyCount = invite?.weeklyCount || 0;
  const weeklyRank = invite?.weeklyRank || null;

  function handleShare() {
    if (!link) return;
    tapHaptic('medium');
    const text = t('im.shareText');
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`;
    const wa = (window as any).Telegram?.WebApp;
    if (wa?.openTelegramLink) {
      wa.openTelegramLink(shareUrl);
    } else {
      window.open(shareUrl, '_blank');
    }
  }

  function handleCopy() {
    if (!link) return;
    try {
      navigator.clipboard?.writeText(link);
    } catch (e) {}
    notifyHaptic('success');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function renderRankBadge(index: number) {
    if (index === 0) return <Trophy className="h-4 w-4 text-amber-400 shrink-0" />;
    if (index === 1) return <Medal className="h-4 w-4 text-slate-300 shrink-0" />;
    if (index === 2) return <Award className="h-4 w-4 text-amber-600 shrink-0" />;
    return <span className="font-mono text-xs font-bold text-[var(--text-secondary)] min-w-[16px] text-center">#{index + 1}</span>;
  }

  return (
    <div className="flex flex-col h-full bg-[var(--bg)] text-[var(--text-primary)] overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 pt-[calc(10px+env(safe-area-inset-top,0px))] pb-2 border-b border-[var(--border)] bg-[var(--chrome-bg)] backdrop-blur-md shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full text-[var(--text-primary)] active:bg-[var(--surface-2)]"
          onClick={() => { tapHaptic('light'); navigate(screenParams?.from || 'profile'); }}
          aria-label={t('common.goBack')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <span className="text-base font-bold text-[var(--text-primary)]">{t('im.title')}</span>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pt-3">
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-2 py-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#00B2FE] text-white flex items-center justify-center shadow-lg shadow-purple-900/40">
            <Gift className="h-8 w-8" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-[var(--text-primary)]">{t('im.title')}</h1>
          <p className="text-xs text-[var(--text-secondary)] max-w-[280px] leading-relaxed">{t('im.subtitle')}</p>
        </div>

        {error && !loaded ? (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 text-center font-medium">{error}</div>
        ) : (
          <>
            {/* Stats */}
            <Card className="p-4 flex items-center justify-around text-center bg-[var(--surface)] border-[var(--border)] rounded-2xl shadow-md">
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-2xl font-black text-[var(--text-primary)] font-mono">{loaded ? count : '—'}</span>
                <span className="text-xs text-[var(--text-secondary)] font-semibold">{t('im.invited')}</span>
              </div>
              <div className="w-px h-8 bg-[var(--border)]" />
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-2xl font-black text-[#34D399] font-mono">{loaded ? count : '—'}</span>
                <span className="text-xs text-[var(--text-secondary)] font-semibold">{t('im.daysEarned')}</span>
              </div>
            </Card>

            {/* Link Box */}
            {loaded && link && (
              <Card
                onClick={handleCopy}
                className="p-3.5 border-dashed border-[rgba(139,92,246,0.45)] bg-[var(--surface)] flex items-center justify-between gap-2 cursor-pointer hover:bg-[var(--surface-2)] transition-colors rounded-2xl shadow-sm"
              >
                <span className="text-xs text-[var(--primary)] truncate flex-1 font-mono">{link}</span>
                <Button size="sm" type="button" className="h-8 text-xs font-bold gap-1 shrink-0 bg-gradient-to-r from-[#7C3AED] to-[#00B2FE] text-white">
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? t('im.copied') : t('im.copy')}</span>
                </Button>
              </Card>
            )}

            {/* Weekly Contest */}
            <Card className="p-4 space-y-3 bg-[var(--surface)] border-[var(--border)] rounded-2xl shadow-md">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
                  <Trophy className="h-4 w-4 text-amber-400" />
                  <span>{t('im.contestTitle')}</span>
                </div>
                <span className="text-[11px] text-[var(--text-secondary)] font-medium">{t('im.contestResets')}</span>
              </div>

              <div className="space-y-2">
                {weeklyTop.length ? (
                  weeklyTop.map((u: any, i: number) => (
                    <div
                      key={u.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]"
                    >
                      <div className="w-6 flex items-center justify-center">{renderRankBadge(i)}</div>
                      <span className="flex-1 text-xs font-semibold truncate text-[var(--text-primary)]">{u.name}</span>
                      <span className="text-xs font-bold text-[var(--primary)] font-mono">
                        {u.count} {u.count === 1 ? t('im.contestFriend') : t('im.contestFriends')}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[var(--text-secondary)] italic text-center py-2">
                    {t('im.contestEmpty')}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] pt-2 border-t border-[var(--border)]">
                <span>{t('im.contestYou')}</span>
                <strong className="text-[var(--text-primary)] font-bold">
                  {weeklyCount > 0
                    ? `${weeklyCount} ${weeklyCount === 1 ? t('im.contestFriend') : t('im.contestFriends')} (${t('im.contestRank').replace('{rank}', String(weeklyRank))})`
                    : t('im.contestNone')}
                </strong>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* CTA */}
      <div className="p-4 pb-8 border-t border-[var(--border)] bg-[var(--chrome-bg)] backdrop-blur-md shrink-0">
        <Button onClick={handleShare} disabled={!loaded || !link} className="w-full h-12 bg-gradient-to-r from-[#7C3AED] to-[#00B2FE] text-white font-bold text-sm rounded-xl shadow-lg shadow-purple-900/30" size="lg">
          <Send className="h-4 w-4 mr-2" />
          <span>{t('im.share')}</span>
        </Button>
      </div>
    </div>
  );
}
