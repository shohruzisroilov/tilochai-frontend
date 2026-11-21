import { useState } from 'react';
import { rateSession } from '../api/endpoints';
import { useTelegramBackButton } from '../hooks/useTelegramBackButton';
import useAppStore from '../store/useAppStore';
import { useT } from '../i18n';
import { tapHaptic, selectionHaptic } from '../utils/haptics';
import { playStarSound } from '../utils/audio';
import ReportSheet from '../components/ReportSheet';
import { Star, Check, Flag, PartyPopper, LogOut, Clock } from 'lucide-react';

function Stars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hov, setHov] = useState(0);
  const active = hov || value;
  return (
    <div className="stars" role="radiogroup" aria-label="rating">
      {[1,2,3,4,5].map(s => (
        <button
          key={s}
          className={`star ${active >= s ? 'on' : ''}`}
          onClick={() => { selectionHaptic(); playStarSound(s); onChange(s); }}
          onMouseEnter={() => setHov(s)}
          onMouseLeave={() => setHov(0)}
          role="radio"
          aria-checked={value === s}
          aria-label={`${s} star`}
          type="button"
        ><Star size={30} fill={active >= s ? 'currentColor' : 'none'} strokeWidth={1.75} /></button>
      ))}
    </div>
  );
}

export default function SessionEnd() {
  const { session, screenParams, navigate, clearSession, setMatchingStatus } = useAppStore();
  const t = useT();
  const LABELS = ['', t('se.rate.1'), t('se.rate.2'), t('se.rate.3'), t('se.rate.4'), t('se.rate.5')];
  const [rating, setRating]       = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportDone, setReportDone] = useState<string | null>(null);

  const isAi        = !!screenParams?.isAi || !!session?.isAi;
  const aiStats     = screenParams?.aiStats || null;
  const sessionId   = screenParams?.sessionId || session?.id;
  const partnerName = isAi ? 'Tiloch AI' : (session?.partnerName || t('common.yourPartner'));
  const reason      = screenParams?.reason;

  function handleGoHome() {
    tapHaptic('light');
    clearSession();
    setMatchingStatus('idle');
    navigate('home');
  }

  useTelegramBackButton(handleGoHome);

  const dur = (() => {
    if (screenParams?.elapsed) return screenParams.elapsed;
    if (session?.startedAt && session?.endedAt) {
      return Math.floor((new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / 1000);
    }
    if (session?.startedAt) {
      return Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000);
    }
    return null;
  })();

  const durText = dur != null && dur > 0
    ? dur < 60
      ? `${dur}s`
      : `${Math.floor(dur / 60)}m ${dur % 60 > 0 ? `${dur % 60}s` : ''}`
    : null;

  async function handleRate() {
    if (!rating) return;
    tapHaptic('medium');
    if (!isAi && sessionId) {
      setLoading(true);
      try { await rateSession(sessionId, rating); } catch {}
    }
    setSubmitted(true);
    setLoading(false);
  }

  function goMatch() {
    tapHaptic('light');
    clearSession();
    setMatchingStatus('idle');
    navigate('matching');
  }



  return (
    <div className="end-screen">
      <div className="end-body scale-in">

        <span className="end-ico">
          {reason === 'daily_limit' ? (
            <Clock size={28} className="text-amber-400" />
          ) : reason === 'partner_left' ? (
            <LogOut size={26} />
          ) : (
            <PartyPopper size={26} />
          )}
        </span>

        <div className="end-head">
          <h2>
            {reason === 'daily_limit'
              ? 'Daily 15m Limit Reached'
              : reason === 'partner_left'
              ? t('se.partnerLeft')
              : t('se.complete')}
          </h2>
          <p>
            {reason === 'daily_limit'
              ? 'Your free 15 minutes of speaking time for today has ended. Invite friends to get +10 bonus minutes or come back tomorrow!'
              : reason === 'partner_left'
              ? t('se.partnerLeftDesc', { name: partnerName })
              : t('se.greatConv', { name: partnerName })}
          </p>
        </div>

        <div className="end-card">
          <div className="end-row">
            <span>{t('se.partner')}</span>
            <span className="end-row-val">{partnerName}</span>
          </div>
          {durText && (
            <div className="end-row">
              <span>{t('se.duration')}</span>
              <span className="end-row-val">{durText}</span>
            </div>
          )}
        </div>

        {/* What the AI session produced. A practice session used to end with nothing
            to show for it — no numbers, no sense that anything had been done. */}
        {isAi && aiStats && (
          <div className="end-ai-stats fade-up">
            <div className="end-ai-stat">
              <span className="end-ai-stat__value num">{aiStats.turnCount ?? 0}</span>
              <span className="end-ai-stat__label">{t('ai.endTurnsLabel')}</span>
            </div>
            <div className="end-ai-stat">
              <span className="end-ai-stat__value num">{aiStats.wordsSpoken ?? 0}</span>
              <span className="end-ai-stat__label">{t('ai.endWordsLabel')}</span>
            </div>
            {aiStats.avgWpm ? (
              <div className="end-ai-stat">
                <span className="end-ai-stat__value num">{aiStats.avgWpm}</span>
                <span className="end-ai-stat__label">{t('ai.endWpmLabel')}</span>
              </div>
            ) : null}
          </div>
        )}

        {!submitted ? (
          <div className="end-rate fade-up">
            <p className="end-rate-title">{t('se.rate')}</p>
            {rating > 0 && <p className="end-rate-label">{LABELS[rating]}</p>}
            <Stars value={rating} onChange={setRating} />
            <button className="btn-primary" onClick={handleRate} disabled={!rating || loading}>
              {loading ? t('se.submitting') : t('se.submit')}
            </button>
            <button className="end-skip" onClick={() => setSubmitted(true)}>{t('se.skip')}</button>
          </div>
        ) : (
          <div className="end-thanks fade-up">
            <p>{t('se.thanks')}</p>
          </div>
        )}

        <div className="end-actions fade-up" style={{ width: '100%', marginTop: 12 }}>
          {reason === 'daily_limit' ? (
            <button className="btn-primary" onClick={() => navigate('invite', { from: 'session_end' })}>
              Invite Friends (+10m Bonus)
            </button>
          ) : (
            <button className="btn-primary" onClick={goMatch}>{t('se.findAnother')}</button>
          )}
          <button className="btn-secondary" style={{ marginTop: 8 }} onClick={handleGoHome}>{t('se.goHome')}</button>
        </div>

        {!isAi && (reportDone ? (
          <p className="end-report-done"><Check size={14} /> {reportDone}</p>
        ) : sessionId ? (
          <button className="end-report" onClick={() => { tapHaptic('light'); setReportOpen(true); }}>
            <Flag size={14} /> {t('rep.link')}
          </button>
        ) : null)}

      </div>



      {reportOpen && (
        <ReportSheet
          sessionId={sessionId}
          partnerName={partnerName}
          onClose={() => setReportOpen(false)}
          onDone={(msg: string) => { setReportDone(msg); setReportOpen(false); }}
        />
      )}

      <style>{`
        .end-screen {
          display: flex; flex-direction: column; align-items: center; justify-content: flex-start;
          padding: 32px 16px 40px; flex: 1; background: var(--bg);
          overflow-y: auto; overflow-x: hidden; width: 100%; position: relative;
        }
        .end-body {
          width: 100%; max-width: 340px;
          display: flex; flex-direction: column; align-items: center;
          gap: 16px; text-align: center;
        }
        .end-ico {
          width: 72px; height: 72px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          background: linear-gradient(135deg, rgba(124, 58, 237, 0.35), rgba(0, 178, 254, 0.35));
          border: 1.5px solid rgba(139, 92, 246, 0.4);
          color: var(--primary);
          box-shadow: 0 8px 24px rgba(124, 58, 237, 0.35);
        }
        .end-head h2 {
          font-size: 22px; font-weight: 800; letter-spacing: -0.4px; color: var(--text-primary);
        }
        .end-head p  { font-size: 13px; color: var(--text-secondary); margin-top: 4px; line-height: 1.4; }

        .end-card {
          width: 100%; background: var(--surface);
          border: 1px solid var(--border); border-radius: 20px;
          padding: 6px 0; display: flex; flex-direction: column;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
        }
        .end-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 12px 18px;
          font-size: 13px; color: var(--text-secondary);
          border-bottom: 1px solid var(--border);
        }
        .end-row:last-child { border-bottom: none; }
        .end-row-val { font-weight: 700; color: var(--text-primary); }

        .end-rate { display: flex; flex-direction: column; align-items: center; gap: 12px; width: 100%; }
        .end-rate-title { font-size: 15px; font-weight: 700; color: var(--text-primary); }
        .end-rate-label { font-size: 13px; color: var(--primary); min-height: 20px; font-weight: 600; }

        .stars { display: flex; gap: 6px; }
        .star {
          width: 48px; height: 48px;
          display: flex; align-items: center; justify-content: center;
          color: rgba(148, 163, 184, 0.35);
          transition: transform 0.15s, color 0.15s;
          background: transparent; border: none; cursor: pointer;
        }
        .star.on     { color: #F59E0B; fill: #F59E0B; filter: drop-shadow(0 0 6px rgba(245, 158, 11, 0.5)); }
        .star:active { transform: scale(0.88); }

        .end-skip {
          font-size: 13px; color: var(--text-tertiary);
          padding: 8px; font-weight: 600; transition: color 0.15s;
          background: transparent; border: none; cursor: pointer;
        }
        .end-skip:active { color: var(--text-secondary); }

        .end-thanks { font-size: 15px; font-weight: 700; color: #34D399; }
        .end-actions { display: flex; flex-direction: column; gap: 8px; width: 100%; }

        .end-actions .btn-primary {
          background: linear-gradient(135deg, #7C3AED, #00B2FE);
          color: #FFFFFF; border: none; font-weight: 700; border-radius: 14px;
          min-height: 48px; box-shadow: 0 4px 16px rgba(124, 58, 237, 0.35);
        }
        .end-actions .btn-secondary {
          background: var(--surface); color: var(--text-primary);
          border: 1px solid var(--border); border-radius: 14px;
          min-height: 48px;
        }

        /* ── Post-Session Celebration Banner ── */
        .end-ai-stats {
          display: flex; gap: 8px; width: 100%;
          margin: 8px 0;
        }
        .end-ai-stat {
          flex: 1;
          display: flex; flex-direction: column; align-items: center; gap: 3px;
          padding: 12px 6px;
          border-radius: 16px;
          border: 1px solid var(--border);
          background: var(--surface);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        .end-ai-stat__value {
          font-size: 18px; font-weight: 800;
          color: var(--text-primary); line-height: 1;
        }
        .end-ai-stat__label {
          font-size: 9px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.06em;
          color: var(--text-secondary); text-align: center;
        }

        .end-report {
          display: flex; align-items: center; justify-content: center; gap: 6px;
          font-size: 12px; color: var(--text-tertiary);
          padding: 8px; font-weight: 600; margin-top: 4px;
          background: transparent; border: none; cursor: pointer;
        }
        .end-report:active { color: var(--text-secondary); }
        .end-report-done {
          display: flex; align-items: center; justify-content: center; gap: 6px;
          font-size: 12px; color: #34D399;
          padding: 8px; margin-top: 4px;
        }
      `}</style>
    </div>
  );
}
