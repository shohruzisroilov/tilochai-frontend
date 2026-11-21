import { useEffect, useState } from 'react';
import { getMe } from '../api/endpoints';
import useAppStore from '../store/useAppStore';
import { useT } from '../i18n';
import { tapHaptic, selectionHaptic } from '../utils/haptics';
import {
  Mic,
  ShieldCheck,
  ChevronRight,
  MessageSquare,
  Users,
  Flame,
  History,
  ArrowRight,
  Clock,
  Gift,
} from 'lucide-react';

import HomeHeader from '../components/HomeHeader';
import SessionRow from '../components/SessionRow';
import SkeletonRow from '../components/SkeletonRow';

/**
 * Bosh sahifa — Premium Dark UI suhbat markazi.
 */
export default function Home() {
  const {
    user,
    stats,
    recentSessions,
    setStats,
    setRecentSessions,
    setUser,
    navigate,
    homeLoaded,
    setHomeLoaded,
    partnerPref,
    setPartnerPref,
    waitingCount,
  } = useAppStore();
  const t = useT();

  const isFemale = user?.gender === 'female';
  const womenOnly = isFemale && partnerPref === 'female';
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const availableMins = user?.availableMinutes ?? Math.max(0, 15 - (user?.dailyMinutes || 0)) + (user?.bonusMinutes || 0);

  useEffect(() => {
    getMe()
      .then((d) => {
        setStats(d.stats);
        setRecentSessions(d.recentSessions);
        if (d.user) setUser(d.user);
      })
      .catch(() => { })
      .finally(() => setHomeLoaded(true));
  }, []);

  return (
    <div className="home">
      <HomeHeader
        user={user}
        streak={stats?.streakCount || 0}
        doneToday={stats?.hasPracticedToday || false}
      />

      <div className="home__scroll">
        {/* Girls Only Safety Filter */}
        {isFemale && (
          <button
            type="button"
            className={`row${womenOnly ? ' row--on' : ''} fade-up`}
            onClick={() => { selectionHaptic(); setPartnerPref(womenOnly ? 'any' : 'female'); }}
            aria-pressed={womenOnly}
            style={{ marginBottom: '2px' }}
          >
            <span className={`row__ico${womenOnly ? ' row__ico--primary' : ''}`}>
              <ShieldCheck size={18} />
            </span>
            <span className="row__text">
              <span className="row__title">{t('match.pref.womenOnly')}</span>
              <span className="row__sub">{t('match.pref.womenOnlyHint')}</span>
            </span>
            <span className={`switch${womenOnly ? ' switch--on' : ''}`} />
          </button>
        )}

        {/* ── HERO FIND PARTNER CARD (Image 1 Left) ── */}
        <section className="hero fade-up">
          <div className="hero__orb hero__orb--1" aria-hidden="true" />
          <div className="hero__orb hero__orb--2" aria-hidden="true" />

          <div className="hero__inner">
            <div className="hero__top-row">
              <span className="hero__tag">
                <span className="hero__live-dot" />
                <span>15m free daily • 1-on-1</span>
              </span>
              <button
                type="button"
                className="hero__online-pill"
                onClick={() => { tapHaptic('light'); navigate('invite', { from: 'home' }); }}
                aria-label="Available minutes"
              >
                <Clock size={11} className={availableMins <= 3 ? 'text-amber-400' : 'text-[#00B2FE]'} />
                <span>{availableMins}m left today</span>
              </button>
            </div>

            <div className="hero__content-row">
              <div className="hero__content">
                <h1 className="hero__title">
                  Talk to a<br />
                  <span className="hero__title-highlight">real partner</span>
                </h1>
                <p className="hero__sub">
                  {t('home.ctaSub')}
                </p>
              </div>

              <div className="hero__art" aria-hidden="true">
                <div className="hero__mic-badge">🎙️</div>
                <div className="hero__bubble hero__bubble--1">💬</div>
                <div className="hero__bubble hero__bubble--2">💭</div>
              </div>
            </div>

            <button
              type="button"
              className="hero__main-btn"
              onClick={() => {
                tapHaptic('heavy');
                if (availableMins <= 0) {
                  setLimitModalOpen(true);
                } else {
                  navigate('matching');
                }
              }}
            >
              <div className="hero__mic-icon">
                <Mic size={18} strokeWidth={2.6} />
              </div>
              <span>{t('home.start')}</span>
              <ChevronRight size={17} strokeWidth={2.6} />
            </button>
          </div>
        </section>

        {/* ── SPEAKING PROGRESS CARD ── */}
        {homeLoaded && (
          <button
            type="button"
            className="home__progress-card fade-up"
            onClick={() => {
              tapHaptic('light');
              navigate('statistics', { from: 'home' });
            }}
          >
            <div className="home__progress-left">
              <div className="home__progress-icon">
                <Flame size={20} className="text-[#FF9F0A]" />
              </div>
              <div className="home__progress-text">
                <div className="home__progress-title">
                  {stats?.hasPracticedToday ? 'Practiced today!' : 'Daily Practice'}
                </div>
                <div className="home__progress-sub">
                  {(stats?.total_minutes || 0) > 0
                    ? `${stats.total_minutes} mins total • ${stats?.streakCount || 0} day streak`
                    : 'Practice 5 mins today to start your streak'}
                </div>
              </div>
            </div>
            <span className={`home__progress-badge ${stats?.hasPracticedToday ? 'done' : 'todo'}`}>
              <span>{stats?.hasPracticedToday ? 'Done' : 'Today'}</span>
              <ChevronRight size={13} strokeWidth={2.5} />
            </span>
          </button>
        )}

        {/* ── PARTNER & TEACHER BOARD CARD ── */}
        <button
          type="button"
          className="home__board-card fade-up"
          onClick={() => {
            tapHaptic('medium');
            navigate('listings');
          }}
        >
          <div className="home__board-icon">
            <Users size={18} />
          </div>
          <div className="home__board-text">
            <span className="home__board-title">{t('home.listingsTitle')}</span>
            <span className="home__board-sub">{t('home.listingsSub')}</span>
          </div>
          <ChevronRight size={18} className="home__board-arrow" />
        </button>

        {/* ── RECENT PRACTICE SECTION ── */}
        <section className="home__section fade-up">
          <div className="home__section-head">
            <div className="flex items-center gap-2">
              <History size={16} className="text-[#A78BFA]" />
              <span className="home__section-title">Recent Practice</span>
            </div>
            <button
              type="button"
              className="home__see-all-btn"
              onClick={() => navigate('statistics', { from: 'home' })}
            >
              <span>See all</span>
              <ArrowRight size={12} />
            </button>
          </div>

          {!homeLoaded ? (
            <div className="home__sessions">
              {[0, 1, 2].map(i => <SkeletonRow key={i} avatar={40} />)}
            </div>
          ) : (recentSessions?.length ?? 0) > 0 ? (
            <div className="home__sessions">
              {recentSessions.slice(0, 5).map((s: any) => <SessionRow key={s.id} session={s} />)}
            </div>
          ) : (
            <div className="home__empty">
              <span className="home__empty-ico"><MessageSquare size={22} /></span>
              <p className="home__empty-title">{t('home.noSessions')}</p>
              <p className="home__empty-sub">{t('home.noSessionsSub')}</p>
            </div>
          )}
        </section>

        <div className="home__foot" />
      </div>

      {/* ── DAILY LIMIT REACHED MODAL ── */}
      {limitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-[var(--surface)] border border-[var(--border)] p-6 flex flex-col items-center text-center space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#00B2FE] text-white flex items-center justify-center shadow-lg shadow-purple-900/40">
              <Gift className="h-8 w-8" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-extrabold text-[var(--text-primary)]">
                Today's 15 mins used!
              </h2>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Want to keep talking? Get <strong>Premium ($2)</strong> for unlimited time, or invite friends to get <strong className="text-[var(--text-primary)]">+15 extra minutes</strong> for each friend!
              </p>
            </div>

            <div className="w-full space-y-2 pt-2">
              <button
                type="button"
                className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 active:scale-[0.98] transition-transform"
                onClick={() => {
                  setLimitModalOpen(false);
                  navigate('premium', { from: 'home' });
                }}
              >
                <span>Get Unlimited Premium ($2)</span>
              </button>

              <button
                type="button"
                className="w-full h-11 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] font-bold text-xs flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                onClick={() => {
                  setLimitModalOpen(false);
                  navigate('invite', { from: 'home' });
                }}
              >
                <Gift size={16} />
                <span>Invite Friends (+15m Bonus)</span>
              </button>

              <button
                type="button"
                className="w-full py-2.5 text-xs text-[var(--text-secondary)] font-semibold active:opacity-70"
                onClick={() => setLimitModalOpen(false)}
              >
                Maybe tomorrow
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        /* ── Page Shell ── */
        .home { display: flex; flex-direction: column; height: 100%; overflow: hidden; background: var(--bg); }
        .home__scroll {
          flex: 1; overflow-y: auto;
          padding: 12px 16px calc(90px + env(safe-area-inset-bottom, 0px));
          display: flex; flex-direction: column; gap: 14px;
        }

        /* ── Hero / Find Partner Card ── */
        .hero {
          position: relative; isolation: isolate; overflow: hidden;
          flex-shrink: 0;
          background: linear-gradient(135deg, #3813A8 0%, #200B68 45%, #0B337A 100%);
          border: 1px solid rgba(139, 92, 246, 0.35);
          border-radius: 22px;
          padding: 18px 16px;
          display: flex; flex-direction: column;
          box-shadow: 0 12px 36px rgba(40, 14, 130, 0.45);
          transition: transform 0.18s var(--ease-out);
        }

        .hero__orb {
          position: absolute; z-index: -1; border-radius: 50%; pointer-events: none;
        }
        .hero__orb--1 {
          width: 180px; height: 180px;
          top: -50px; right: -30px;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.35) 0%, transparent 70%);
        }
        .hero__orb--2 {
          width: 140px; height: 140px;
          bottom: -40px; left: 10px;
          background: radial-gradient(circle, rgba(0, 178, 254, 0.25) 0%, transparent 70%);
        }

        .hero__inner { display: flex; flex-direction: column; gap: 14px; }

        .hero__top-row { display: flex; align-items: center; justify-content: space-between; }
        .hero__tag {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 5px 12px;
          border-radius: var(--radius-full);
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #FFFFFF;
          font-size: 11px; font-weight: 700;
          letter-spacing: 0.02em;
          backdrop-filter: blur(8px);
        }
        .hero__live-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #10B981;
          box-shadow: 0 0 8px #10B981;
          animation: livePulse 1.8s ease-in-out infinite;
          flex-shrink: 0;
        }
        @keyframes livePulse {
          0%,100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.7; }
        }
        .hero__online-pill {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 4px 9px;
          border-radius: var(--radius-full);
          background: rgba(16, 185, 129, 0.20);
          border: 1px solid rgba(16, 185, 129, 0.4);
          color: #6EE7B7;
          font-size: 10px; font-weight: 700;
        }

        .hero__content-row {
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
        }
        .hero__content { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 0; }
        .hero__title {
          font-family: var(--font-display);
          font-size: 24px; font-weight: 800;
          color: #FFFFFF; letter-spacing: -0.02em;
          line-height: 1.15;
        }
        .hero__title-highlight {
          background: linear-gradient(90deg, #FFFFFF 0%, #38BDF8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .hero__sub {
          font-size: 13px; line-height: 1.4;
          color: rgba(255, 255, 255, 0.85);
        }

        .hero__art {
          position: relative; width: 80px; height: 80px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .hero__mic-badge {
          font-size: 42px;
          filter: drop-shadow(0 8px 16px rgba(0,0,0,0.4));
          animation: micFloat 3s ease-in-out infinite;
        }
        @keyframes micFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .hero__bubble {
          position: absolute;
          font-size: 18px;
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
        }
        .hero__bubble--1 { top: -2px; right: 2px; animation: bubbleFloat 2.6s ease-in-out infinite; }
        .hero__bubble--2 { bottom: 0px; left: 0px; animation: bubbleFloat 3.2s ease-in-out infinite 0.5s; }
        @keyframes bubbleFloat {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-3px) scale(1.08); }
        }

        /* Hero Main CTA Button */
        .hero__main-btn {
          display: flex; align-items: center; justify-content: center; gap: 10px;
          min-height: 50px; width: 100%;
          background: #FFFFFF; color: #350CA8;
          border-radius: var(--radius-full); border: none;
          font-size: 15px; font-weight: 800;
          letter-spacing: -0.01em;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
          cursor: pointer;
          transition: transform 0.15s var(--ease-out);
        }
        .hero__main-btn:active { transform: scale(0.97); }
        .hero__mic-icon {
          display: flex; align-items: center; justify-content: center;
          color: #350CA8;
        }

        /* ── Progress Card ── */
        .home__progress-card {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 16px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 18px;
          box-shadow: var(--shadow-sm);
          width: 100%; text-align: left; cursor: pointer;
          transition: transform 0.15s var(--ease-out);
        }
        .home__progress-card:active { transform: scale(0.99); background: var(--surface-2); }
        .home__progress-left {
          display: flex; align-items: center; gap: 12px; min-width: 0;
        }
        .home__progress-icon {
          width: 38px; height: 38px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          background: rgba(245, 158, 11, 0.16);
          border: 1px solid rgba(245, 158, 11, 0.3);
          flex-shrink: 0;
        }
        .home__progress-text {
          display: flex; flex-direction: column; gap: 1px; min-width: 0;
        }
        .home__progress-title {
          font-size: 14px; font-weight: 700; color: var(--text-primary);
        }
        .home__progress-sub {
          font-size: 12px; color: var(--text-secondary);
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .home__progress-badge {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 12px; font-weight: 700;
          padding: 4px 12px; border-radius: var(--radius-full);
          flex-shrink: 0;
        }
        .home__progress-badge.done {
          background: rgba(16, 185, 129, 0.16);
          border: 1px solid rgba(16, 185, 129, 0.35);
          color: #10B981;
        }
        .home__progress-badge.todo {
          background: var(--primary-subtle);
          border: 1px solid var(--border-strong);
          color: var(--primary);
        }

        /* ── Listings Board Card ── */
        .home__board-card {
          display: flex; align-items: center; gap: 12px;
          padding: 14px 16px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 18px;
          box-shadow: var(--shadow-sm);
          width: 100%; text-align: left; cursor: pointer;
          transition: transform 0.15s var(--ease-out);
        }
        .home__board-card:active { transform: scale(0.99); background: var(--surface-2); }
        .home__board-icon {
          width: 38px; height: 38px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          background: linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%);
          border: 1px solid rgba(139, 92, 246, 0.35);
          color: #FFFFFF; flex-shrink: 0;
        }
        .home__board-text {
          flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0;
        }
        .home__board-title {
          font-size: 14px; font-weight: 700; color: var(--text-primary);
        }
        .home__board-sub {
          font-size: 12px; color: var(--text-secondary);
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .home__board-arrow { color: var(--text-tertiary); flex-shrink: 0; }

        /* ── Recent Practice Section ── */
        .home__section { display: flex; flex-direction: column; gap: 10px; flex-shrink: 0; }
        .home__section-head { display: flex; align-items: center; justify-content: space-between; }
        .home__section-title { font-size: 14px; font-weight: 700; color: var(--text-primary); }
        .home__see-all-btn {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 12px; font-weight: 600; color: var(--primary);
          cursor: pointer;
        }
        .home__sessions { display: flex; flex-direction: column; gap: 8px; }

        /* ── Safety Row Switch ── */
        .row {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 14px;
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 16px; width: 100%; text-align: left;
        }
        .row--on { border-color: rgba(124, 58, 237, 0.6); }
        .row__ico {
          width: 32px; height: 32px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          background: var(--primary-subtle); color: var(--primary);
        }
        .row__ico--primary { background: rgba(16, 185, 129, 0.20); color: #10B981; }
        .row__text { flex: 1; display: flex; flex-direction: column; gap: 1px; min-width: 0; }
        .row__title { font-size: 13px; font-weight: 700; color: var(--text-primary); }
        .row__sub { font-size: 11px; color: var(--text-secondary); }
        .switch {
          flex-shrink: 0; width: 40px; height: 24px; border-radius: var(--radius-full);
          background: var(--surface-2); border: 1px solid var(--border);
          position: relative; transition: all var(--t);
        }
        .switch::after {
          content: ''; position: absolute; top: 2px; left: 2px;
          width: 18px; height: 18px; border-radius: 50%;
          background: #64748B;
          transition: transform var(--t), background var(--t);
        }
        .switch--on { background: #7C3AED; border-color: #7C3AED; }
        .switch--on::after { transform: translateX(16px); background: #FFFFFF; }

        /* ── Empty State ── */
        .home__empty {
          display: flex; flex-direction: column; align-items: center; gap: 6px;
          padding: 28px 20px; text-align: center;
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 18px; box-shadow: var(--shadow-sm);
        }
        .home__empty-ico {
          width: 44px; height: 44px; border-radius: 50%;
          background: var(--primary-subtle); color: var(--primary);
          margin-bottom: 4px;
        }
        .home__empty-title { font-size: 14px; font-weight: 700; color: var(--text-primary); }
        .home__empty-sub { font-size: 12px; color: var(--text-secondary); max-width: 260px; }
        .home__foot { padding-bottom: 8px; }
      `}</style>
    </div>
  );
}
