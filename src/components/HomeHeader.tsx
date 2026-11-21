import React from 'react';
import Avatar from './Avatar';
import { useT } from '../i18n';
import { Flame, ChevronDown, Clock, Crown } from 'lucide-react';
import { User } from '../types';
import useAppStore from '../store/useAppStore';
import { tapHaptic } from '../utils/haptics';

interface HomeHeaderProps {
  user: User | null;
  streak?: number;
  doneToday?: boolean;
}

export default function HomeHeader({
  user,
  streak = 0,
  doneToday = false,
}: HomeHeaderProps) {
  const t = useT();
  const { navigate } = useAppStore();

  const level = user?.level || 1;
  const shown = Math.max(streak, doneToday ? 1 : 0);
  const isPremium = Boolean(user?.isPremium);
  const availableMinutes = isPremium
    ? Infinity
    : Math.max(0, 15 - (user?.dailyMinutes || 0)) + (user?.bonusMinutes || 0);

  return (
    <>
      <header className="hh">
        <button
          type="button"
          className="hh__avatar-wrapper hh__avatar-btn"
          onClick={() => { tapHaptic('light'); navigate('profile'); }}
          aria-label={t('nav.profile')}
        >
          <Avatar name={user?.displayName || undefined} avatarUrl={user?.avatarUrl || undefined} size={42} isPremium={isPremium} />
        </button>

        <button
          type="button"
          className="hh__info"
          onClick={() => {
            tapHaptic('light');
            navigate('settings', { from: 'home', section: 'level' });
          }}
        >
          <div className="hh__name-row">
            <span className="hh__name">{user?.displayName || t('common.anonymous')}</span>
            <span className="hh__level-pill">
              {t(`level.${level}`)}
              <ChevronDown size={10} style={{ marginLeft: 2, opacity: 0.8 }} />
            </span>
          </div>
          <span className="hh__sub">{t(`levelName.${level}`)} • {t('hh.tapToChange')}</span>
        </button>

        <div className="hh__actions">
          {isPremium ? (
            <button
              type="button"
              className="hh__pill hh__pill--time border-amber-500/40 bg-amber-500/10"
              onClick={() => { tapHaptic('light'); navigate('premium', { from: 'home' }); }}
              aria-label="Premium VIP"
            >
              <Crown size={12} className="text-amber-400" />
              <span className="hh__pill-text text-amber-300 font-bold">VIP</span>
            </button>
          ) : (
            <button
              type="button"
              className={`hh__pill hh__pill--time ${availableMinutes <= 3 ? 'hh__pill--low' : ''}`}
              onClick={() => { tapHaptic('light'); navigate('invite', { from: 'home' }); }}
              aria-label="Available minutes today"
            >
              <Clock size={12} className={availableMinutes <= 3 ? 'text-amber-400' : 'text-[#00B2FE]'} />
              <span className="hh__pill-text">{availableMinutes}m</span>
            </button>
          )}

          {shown > 0 && (
            <div className={`hh__pill hh__pill--streak ${doneToday ? 'hh__pill--streak-active' : ''}`}>
              <Flame size={13} strokeWidth={2.5} className="hh__flame-icon" />
              <span className="hh__pill-text">{shown}d</span>
            </div>
          )}
        </div>
      </header>

      <style>{`
        .hh {
          display: flex; align-items: center; gap: 10px;
          padding: calc(var(--space-2) + env(safe-area-inset-top, 0px)) 14px var(--space-2);
          border-bottom: 1px solid var(--border);
          background: var(--chrome-bg);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          flex-shrink: 0; z-index: 10;
        }
        .hh__avatar-wrapper { position: relative; flex-shrink: 0; }
        .hh__avatar-btn {
          background: none; border: none; padding: 0; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          border-radius: var(--radius-full);
          transition: transform 0.15s var(--ease-out);
        }
        .hh__avatar-btn:active { transform: scale(0.92); }
        .hh__info {
          flex: 1; display: flex; flex-direction: column; min-width: 0; gap: 2px;
          text-align: left; cursor: pointer; overflow: hidden;
        }
        .hh__name-row { display: flex; align-items: center; gap: 6px; min-width: 0; max-width: 100%; }
        .hh__name {
          font-size: 15px; font-weight: 700;
          letter-spacing: -0.01em; color: var(--text-primary);
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          flex-shrink: 1; min-width: 0;
        }
        .hh__level-pill {
          display: inline-flex; align-items: center;
          font-size: 10px; font-weight: 700;
          color: var(--primary); background: var(--primary-subtle);
          padding: 2px 7px; border-radius: var(--radius-full);
          letter-spacing: 0.02em; flex-shrink: 0;
          border: 1px solid var(--border-strong);
          transition: transform 0.15s ease;
        }
        .hh__info:active .hh__level-pill {
          transform: scale(0.96);
        }
        .hh__sub {
          font-size: 11px; color: var(--text-secondary);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          display: block; max-width: 100%; line-height: 1.3;
        }
        
        .hh__actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
        
        .hh__pill {
          display: inline-flex; align-items: center; gap: 4px;
          height: 28px; padding: 0 8px; border-radius: var(--radius-full);
          background: var(--surface); border: 1px solid var(--border);
          color: var(--text-primary); cursor: pointer; flex-shrink: 0;
          transition: transform 0.15s ease, border-color 0.15s ease;
        }
        .hh__pill:active { transform: scale(0.94); }
        .hh__pill--time {
          border-color: rgba(0, 178, 254, 0.3);
          background: rgba(0, 178, 254, 0.08);
        }
        .hh__pill--low {
          border-color: rgba(245, 158, 11, 0.45);
          background: rgba(245, 158, 11, 0.12);
        }
        .hh__pill--streak {
          border-color: rgba(245, 158, 11, 0.35);
          background: rgba(245, 158, 11, 0.08);
          box-shadow: 0 0 10px rgba(245, 158, 11, 0.1);
        }
        .hh__pill--streak-active {
          border-color: rgba(245, 158, 11, 0.6);
          box-shadow: 0 0 14px rgba(245, 158, 11, 0.22);
        }
        .hh__pill-text {
          font-size: 11px; font-weight: 700; line-height: 1;
          color: var(--text-primary); font-variant-numeric: tabular-nums;
        }
        .hh__flame-icon {
          color: #FF9F0A;
          filter: drop-shadow(0 0 4px rgba(255, 159, 10, 0.6));
        }
      `}</style>
    </>
  );
}

