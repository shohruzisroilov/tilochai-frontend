import React, { useEffect, useRef, useState } from 'react';
import { useMatch } from '../hooks/useMatch';
import { useSocket } from '../hooks/useSocket';
import useAppStore from '../store/useAppStore';
import { useT } from '../i18n';
import { Users, RotateCcw, Megaphone, MessageSquare, KeyRound, Sparkles, Gift, Bot } from 'lucide-react';

const SPEAKING_TIPS = [
  "💡 Icebreaker: Ask your partner where they are from and what they do!",
  "💡 Tip: Don't worry about grammar mistakes — fluency and confidence come first.",
  "💡 Icebreaker: 'What's the best movie or series you've watched recently?'",
  "💡 Tip: Speak in full sentences and ask 'Why?' or 'What about you?' to keep it going.",
  "💡 Icebreaker: 'If you could travel anywhere tomorrow, where would you go?'",
];

function fmtElapsed(s: number): string {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * Sherik qidirish ekrani (Umumiy yoki Do'st bilan xona).
 */
export default function Matching() {
  const { user, navigate, waitingCount, screenParams, aiEnabled } = useAppStore();
  const { matchingStatus, startSearch, cancel } = useMatch();
  const { joinPrivateRoom, leavePrivateRoom } = useSocket();
  const t = useT();
  const started = useRef(false);
  const [elapsed, setElapsed] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const tipInterval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % SPEAKING_TIPS.length);
    }, 6000);
    return () => clearInterval(tipInterval);
  }, []);

  const roomCode = screenParams?.roomCode ? String(screenParams.roomCode).toUpperCase() : null;
  const isPrivateRoom = Boolean(roomCode);

  const handleCancel = () => {
    if (isPrivateRoom && roomCode) {
      leavePrivateRoom(roomCode);
      navigate('home');
    } else {
      cancel();
    }
  };

  const cancelRef = useRef(handleCancel);
  cancelRef.current = handleCancel;

  useEffect(() => {
    const backBtn = window.Telegram?.WebApp?.BackButton;
    let handleBack: (() => void) | undefined;
    if (backBtn) {
      handleBack = () => cancelRef.current?.();
      backBtn.onClick(handleBack);
      backBtn.show();
    }
    if (!started.current) {
      started.current = true;
      if (isPrivateRoom && roomCode) {
        joinPrivateRoom(roomCode);
      } else {
        startSearch();
      }
    }
    return () => {
      if (backBtn) {
        if (handleBack) backBtn.offClick(handleBack);
        backBtn.hide();
      }
    };
  }, [isPrivateRoom, roomCode]);

  useEffect(() => {
    if (matchingStatus !== 'searching') { setElapsed(0); return; }
    const id = setInterval(() => {
      setElapsed((e) => {
        const next = e + 1;
        // Auto-timeout after 35s if still searching in public matching queue
        if (!isPrivateRoom && next >= 35) {
          useAppStore.getState().setMatchingStatus('timeout');
          cancel();
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [matchingStatus, isPrivateRoom, cancel]);

  const isTimeout = matchingStatus === 'timeout';
  const isPremium = Boolean(user?.isPremium);
  const availableMins = isPremium ? Infinity : Math.max(0, 15 - (user?.dailyMinutes || 0)) + (user?.bonusMinutes || 0);
  const isLimitReached = matchingStatus === 'limit_reached' || (!isPremium && availableMins <= 0);

  if (isLimitReached) {
    return (
      <div className="mt">
        <div className="mt__body scale-in">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#00B2FE] text-white flex items-center justify-center shadow-lg shadow-purple-900/40">
            <Gift size={32} />
          </div>

          <div className="mt__copy">
            <h2 className="mt__title">15 Minutes Used Today!</h2>
            <p className="mt__desc">
              Your free 15 minutes of speaking time for today has ended.
              Get <strong>Unlimited Premium (26 000 so'm)</strong> or invite friends to get <strong className="text-[var(--text-primary)]">+15 bonus minutes</strong> for each friend!
            </p>
          </div>

          <button
            className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 active:scale-[0.98] transition-transform"
            onClick={() => navigate('premium', { from: 'matching' })}
          >
            <span>Get Unlimited Premium</span>
          </button>

          <button
            className="btn-primary flex items-center justify-center gap-2 w-full"
            onClick={() => navigate('invite', { from: 'matching' })}
          >
            <Gift size={18} />
            <span>Invite Friends (+15m)</span>
          </button>

          <button className="btn-quiet" onClick={() => navigate('home')}>
            {t('common.goBack')}
          </button>
        </div>
        <Styles />
      </div>
    );
  }

  if (isTimeout) {
    return (
      <div className="mt">
        <div className="mt__body scale-in">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-purple-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-lg shadow-amber-900/20 mb-2">
            <Users size={32} />
          </div>

          <div className="mt__copy">
            <h2 className="mt__title">{t('match.noneTitle')}</h2>
            <p className="mt__desc">{t('match.noneDesc')}</p>
          </div>

          {aiEnabled && (
            <button
              className="w-full h-12 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#00B2FE] text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-900/40 active:scale-[0.98] transition-transform mb-2"
              onClick={() => {
                cancel();
                navigate('ai_talk');
              }}
            >
              <Bot size={18} />
              <span>Practice with AI Partner</span>
            </button>
          )}

          <button
            className="btn-primary flex items-center justify-center gap-2"
            onClick={() => {
              setElapsed(0);
              startSearch();
            }}
          >
            <RotateCcw size={16} />
            <span>{t('common.tryAgain')}</span>
          </button>

          <button className="btn-secondary flex items-center justify-center gap-2" onClick={() => navigate('listings')}>
            <Megaphone size={16} />
            <span>{t('nav.listings')}</span>
          </button>
          <button className="btn-quiet" onClick={() => navigate('home')}>{t('common.goBack')}</button>
        </div>
        <Styles />
      </div>
    );
  }

  const others = waitingCount >= 2;

  return (
    <div className="mt">
      <div className="mt__body scale-in">
        <div className="mt__mode-badge">
          {isPrivateRoom ? (
            <>
              <KeyRound size={13} />
              <span>Room #{roomCode}</span>
            </>
          ) : (
            <>
              <Users size={13} />
              <span>Live Partner · {user?.level ? t(`level.${user.level}`) : 'General'}</span>
            </>
          )}
        </div>

        <div className="mt__dial">
          <span className="mt__ripple" aria-hidden="true" />
          <span className="mt__ripple mt__ripple--2" aria-hidden="true" />
          <span className="mt__scale" aria-hidden="true"><i /></span>
          <span className="mt__hole" aria-hidden="true" />
          <span className="mt__core">
            <span className="mt__core-level">{user?.level ? t(`level.${user.level}`) : 'EN'}</span>
          </span>
        </div>

        <div className="mt__copy">
          <h2 className="mt__title">
            {isPrivateRoom ? "Waiting for your friend…" : t('match.searching')}
            <span className="mt__dots" aria-hidden="true"><i /><i /><i /></span>
          </h2>
          <p className="mt__desc">
            {isPrivateRoom
              ? "The call will start as soon as your friend opens the link."
              : t('match.lookingFor')}
          </p>
        </div>

        <div className="mt__status">
          <div className="mt__meta">
            <div className="mt__cell">
              <span className="eyebrow">{isPrivateRoom ? 'Mode' : t('match.queueLabel')}</span>
              <span className={`mt__val${others ? ' mt__val--live' : ''}`}>
                {isPrivateRoom ? 'Direct Room' : others && <span className="dot-live" />}
                {isPrivateRoom
                  ? `Room #${roomCode}`
                  : others
                  ? t('match.queueMany', { n: waitingCount })
                  : t('match.queueAlone')}
              </span>
            </div>
            <span className="mt__div" aria-hidden="true" />
            <div className="mt__cell">
              <span className="eyebrow">{t('match.waitLabel')}</span>
              <span className="mt__val num">{fmtElapsed(elapsed)}</span>
            </div>
          </div>
          <p className="mt__hint">
            {isPrivateRoom
              ? "Share the invite link with your friend on Telegram"
              : others
              ? t('match.hintMany')
              : t('match.hintAlone')}
          </p>
        </div>

        <div className="mt__tip-card">
          <Sparkles size={14} className="text-accent flex-shrink-0" />
          <span>{SPEAKING_TIPS[tipIndex]}</span>
        </div>

        {/* If searching for >= 15 seconds, offer instant switch to AI Partner if configured */}
        {!isPrivateRoom && aiEnabled && elapsed >= 15 && (
          <div className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/30 flex flex-col items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
            <span className="text-xs text-[var(--text-secondary)] font-medium text-center">
              Don't want to wait? Practice with AI Voice Partner right now!
            </span>
            <button
              className="w-full h-10 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#00B2FE] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-purple-900/30 active:scale-98 transition-transform"
              onClick={() => {
                cancel();
                navigate('ai_talk');
              }}
            >
              <Bot size={16} />
              <span>Talk to AI Partner</span>
            </button>
          </div>
        )}

        <button className="btn-quiet mt__cancel" onClick={handleCancel}>{t('common.cancel')}</button>
      </div>

      <Styles />
    </div>
  );
}

const Styles = React.memo(function Styles() {
  return (
    <style>{`
      .mt {
        flex: 1; height: 100%; overflow-y: auto;
        display: flex; align-items: center; justify-content: center;
        padding: var(--space-6) var(--space-4); background: var(--bg);
      }
      .mt__body {
        width: 100%; max-width: 340px;
        display: flex; flex-direction: column; align-items: center;
        gap: var(--space-4); text-align: center;
      }

      .mt__mode-badge {
        display: inline-flex; align-items: center; gap: 6px;
        padding: 5px 14px; border-radius: var(--radius-full);
        background: var(--primary-subtle); border: 1px solid rgba(53, 12, 168, 0.25);
        color: var(--primary); font-size: 11px; font-weight: var(--weight-bold);
        text-transform: uppercase; letter-spacing: 0.05em;
      }

      .mt__dial {
        position: relative; width: 200px; height: 200px; flex-shrink: 0;
        display: flex; align-items: center; justify-content: center;
      }
      .mt__ripple {
        position: absolute; inset: 0; border-radius: 50%;
        border: 2px solid var(--primary); opacity: 0;
        animation: radarRipple 2.8s cubic-bezier(0.1, 0.8, 0.3, 1) infinite;
      }
      .mt__ripple--2 { animation-delay: 1.4s; }

      .mt__scale, .mt__hole { position: absolute; border-radius: 50%; }
      .mt__scale {
        inset: 12px;
        background: var(--border);
        -webkit-mask-image: repeating-conic-gradient(from -0.8deg, #000 0deg 1.6deg, transparent 1.6deg 7.5deg);
                mask-image: repeating-conic-gradient(from -0.8deg, #000 0deg 1.6deg, transparent 1.6deg 7.5deg);
      }
      .mt__scale i {
        position: absolute; inset: 0; border-radius: 50%;
        background: conic-gradient(from 0deg,
          transparent 0deg 200deg,
          var(--primary) 352deg,
          transparent 356deg);
        animation: dialScan 3s linear infinite;
        will-change: transform;
      }
      .mt__hole { width: 82%; height: 82%; background: var(--bg); }
      .mt__core {
        position: relative; z-index: 1;
        width: 92px; height: 92px; border-radius: 50%;
        background: var(--grad-primary); color: #FFFFFF;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        box-shadow: 0 0 35px rgba(53, 12, 168, 0.35), 0 8px 24px rgba(53, 12, 168, 0.2);
      }
      .mt__core-level {
        font-family: var(--font-display);
        font-size: 22px; font-weight: var(--weight-heavy);
        letter-spacing: -0.02em; line-height: 1;
      }
      @keyframes dialScan { to { transform: rotate(360deg); } }

      .mt__glyph {
        width: 68px; height: 68px; border-radius: var(--radius-full);
        display: flex; align-items: center; justify-content: center;
        background: var(--soft-yellow); color: #B45309;
        border: 1px solid rgba(255, 200, 87, 0.4);
      }

      .mt__copy { display: flex; flex-direction: column; gap: var(--space-1-5); }
      .mt__title {
        font-family: var(--font-display);
        font-size: var(--text-lg); font-weight: var(--weight-heavy);
        letter-spacing: -0.02em;
        display: flex; align-items: flex-end; justify-content: center; gap: 5px;
      }
      .mt__desc { font-size: var(--text-sm); color: var(--text-secondary); line-height: 1.55; }
      .mt__fine {
        font-size: var(--text-xs); color: var(--text-secondary);
        margin-top: calc(var(--space-2) * -1);
      }

      .mt__dots { display: inline-flex; gap: 3px; padding-bottom: 6px; }
      .mt__dots i {
        width: 4px; height: 4px; border-radius: 50%; background: currentColor;
        animation: dotBlink 1.4s infinite; opacity: 0;
      }
      .mt__dots i:nth-child(2) { animation-delay: 0.2s; }
      .mt__dots i:nth-child(3) { animation-delay: 0.4s; }

      .mt__status {
        display: flex; flex-direction: column; align-items: center; gap: var(--space-2);
        width: 100%; max-width: 330px;
      }
      .mt__meta {
        display: flex; align-items: stretch; width: 100%;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        overflow: hidden;
      }
      .mt__cell {
        flex: 1; min-width: 0;
        display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
        padding: 10px 8px; text-align: center;
      }
      .mt__div { width: 1px; background: var(--border); margin: 6px 0; flex-shrink: 0; }
      .mt__val {
        display: inline-flex; align-items: center; justify-content: center; gap: 5px;
        font-family: var(--font-display);
        font-size: 14px; font-weight: var(--weight-bold);
        letter-spacing: -0.01em; color: var(--text-primary);
        white-space: nowrap; text-overflow: ellipsis; max-width: 100%;
        overflow: hidden;
      }
      .mt__val--live { color: var(--success); }
      .mt__hint {
        font-size: var(--text-xs); color: var(--text-secondary);
        line-height: 1.5; max-width: 300px;
      }
      .mt__tip-card {
        display: flex; align-items: center; gap: 8px;
        background: var(--surface-2); border: 1px solid var(--border);
        border-radius: var(--radius-md); padding: 10px 14px;
        font-size: 12px; color: var(--text-secondary); line-height: 1.45;
        max-width: 330px; min-height: 48px; text-align: left;
        animation: fadeIn 0.3s ease;
      }
      .mt__cancel {
        border: 1px solid var(--border); padding: 0 var(--space-5);
        border-radius: var(--radius-full); min-height: 44px;
        font-size: var(--text-sm); font-weight: var(--weight-bold);
        color: var(--text-secondary);
        transition: background var(--t), color var(--t);
      }
      .mt__cancel:active { background: var(--surface-2); color: var(--text-primary); }
    `}</style>
  );
});

