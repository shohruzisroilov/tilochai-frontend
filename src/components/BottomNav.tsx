import React from 'react';
import useAppStore from '../store/useAppStore';
import { useT } from '../i18n';
import { selectionHaptic } from '../utils/haptics';
import { playTapSound } from '../utils/audio';
import { Home, Users, Trophy, User } from 'lucide-react';

interface Tab {
  key: string;
  label: string;
  icon: React.ReactNode;
}

const TABS: Tab[] = [
  {
    key: 'home',
    label: 'nav.home',
    icon: <Home size={20} strokeWidth={2.2} />,
  },
  {
    key: 'listings',
    label: 'nav.listings',
    icon: <Users size={20} strokeWidth={2.2} />,
  },
  {
    key: 'leaderboard',
    label: 'nav.leaderboard',
    icon: <Trophy size={20} strokeWidth={2.2} />,
  },
  {
    key: 'profile',
    label: 'nav.profile',
    icon: <User size={20} strokeWidth={2.2} />,
  },
];

interface BottomNavProps {
  active: string;
}

export default function BottomNav({ active }: BottomNavProps) {
  const { navigate } = useAppStore();
  const t = useT();

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav__inner">
        {TABS.map((tab) => {
          const isActive = active === tab.key;
          return (
            <button
              key={tab.key}
              className={`bottom-nav__item ${isActive ? 'active' : ''}`}
              onClick={() => {
                if (!isActive) {
                  selectionHaptic();
                  playTapSound();
                  navigate(tab.key);
                }
              }}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="bottom-nav__icon-wrap">
                {tab.icon}
                {isActive && <span className="bottom-nav__active-glow" />}
              </div>
              <span className="bottom-nav__label">{t(tab.label)}</span>
            </button>
          );
        })}
      </div>

      <style>{`
        .bottom-nav {
          position: relative; z-index: 100;
          border-top: 1px solid var(--border);
          background: var(--chrome-bg);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          padding-bottom: env(safe-area-inset-bottom, 0px);
          flex-shrink: 0;
          box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
        }
        .bottom-nav__inner {
          display: flex; align-items: center; justify-content: space-around;
          height: 64px; max-width: 480px; margin: 0 auto;
        }
        .bottom-nav__item {
          flex: 1; height: 100%;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 3px; color: var(--text-tertiary);
          position: relative;
          transition: color 0.18s var(--ease-out), transform 0.12s var(--ease-out);
        }
        .bottom-nav__item:active { transform: scale(0.92); }
        .bottom-nav__item.active { color: var(--primary); font-weight: 700; }

        .bottom-nav__icon-wrap {
          position: relative;
          display: flex; align-items: center; justify-content: center;
          width: 52px; height: 32px;
          border-radius: var(--radius-full);
          transition: all 0.22s var(--ease-out);
        }
        .bottom-nav__item.active .bottom-nav__icon-wrap {
          background: linear-gradient(135deg, rgba(124, 58, 237, 0.40) 0%, rgba(59, 130, 246, 0.22) 100%);
          border: 1px solid rgba(139, 92, 246, 0.45);
          color: #FFFFFF;
          box-shadow: 0 0 16px rgba(124, 58, 237, 0.35);
        }
        .bottom-nav__active-glow {
          position: absolute; inset: 0;
          border-radius: var(--radius-full);
          background: radial-gradient(circle, rgba(124, 58, 237, 0.35) 0%, transparent 80%);
          pointer-events: none;
        }
        .bottom-nav__label {
          font-size: 11px; font-weight: 600;
          letter-spacing: 0.01em; line-height: 1.1;
          transition: color 0.18s var(--ease-out);
        }
      `}</style>
    </nav>
  );
}

