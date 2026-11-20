import { useEffect, useState } from 'react';
import { getMe, getMyRatings } from '../api/endpoints';
import { useTelegramBackButton } from '../hooks/useTelegramBackButton';
import useAppStore from '../store/useAppStore';
import { useT } from '../i18n';
import { tapHaptic } from '../utils/haptics';
import Avatar from '../components/Avatar';
import {
  ArrowLeft,
  BarChart2,
  ChevronRight,
  Clock,
  Gift,
  LifeBuoy,
  MessageSquare,
  SlidersHorizontal,
  Star,
  Users,
  Flame,
  Pencil,
  Crown,
} from 'lucide-react';

const SUPPORT_URL = 'https://t.me/Shohruz_Isroilov';

const LEVELS = [1, 2, 3, 4, 5, 6];


function openSupport() {
  const wa = window.Telegram?.WebApp;
  if (wa?.openTelegramLink) wa.openTelegramLink(SUPPORT_URL);
  else window.open(SUPPORT_URL, '_blank', 'noopener');
}

function formatDate(dateStr?: string | null): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatPracticeTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function Chevron({ open = false }: { open?: boolean }) {
  return (
    <ChevronRight
      size={14}
      className={`profile__chev${open ? ' profile__chev--open' : ''}`}
    />
  );
}

interface RatingItem {
  id: string;
  score: number;
  created_at: string;
  rater_name: string | null;
  rater_avatar_url: string | null;
}

export default function Profile() {
  const { user, stats, setStats, setRecentSessions, setUser, navigate, setHomeLoaded } = useAppStore();
  const t = useT();

  const [viewMode, setViewMode] = useState<'profile' | 'ratings'>('profile');
  const [ratingsList, setRatingsList] = useState<RatingItem[]>([]);
  const [loadingRatings, setLoadingRatings] = useState(false);

  useTelegramBackButton(() => {
    if (viewMode === 'ratings') {
      tapHaptic('light');
      setViewMode('profile');
    }
  });

  useEffect(() => {
    getMe()
      .then((d) => {
        setStats(d.stats);
        setRecentSessions(d.recentSessions);
        if (d.user) setUser(d.user);
      })
      .catch(() => {})
      .finally(() => setHomeLoaded(true));
  }, []);

  const openRatings = () => {
    tapHaptic('light');
    setViewMode('ratings');
    setLoadingRatings(true);
    getMyRatings()
      .then((d) => {
        setRatingsList(d.ratings || []);
      })
      .catch(() => {})
      .finally(() => setLoadingRatings(false));
  };



  const isPremium = !!user?.isPremium;
  const premiumUntil = formatDate(user?.premiumUntil);
  const availableMinutes = user?.availableMinutes ?? Math.max(0, 15 - (user?.dailyMinutes || 0)) + (user?.bonusMinutes || 0);

  const level = user?.level || 1;
  const avgRatingNum = Number(stats.avg_rating || 0).toFixed(1);
  const ratingCount = stats.rating_count || 0;
  const uniquePartners = stats.unique_partners || 0;
  const totalMinutes = stats.total_minutes || 0;
  const streakCount = stats?.streakCount || user?.streakCount || 0;
  const longestStreak = stats?.longestStreak || stats?.longest_streak || streakCount;

  if (viewMode === 'ratings') {
    return (
      <div className="flex flex-col h-full bg-[var(--bg)] text-[var(--text-primary)]">
        {/* Top bar with back button */}
        <div className="flex items-center justify-between p-4 pt-[calc(14px+env(safe-area-inset-top,0px))] border-b border-[var(--border)] shrink-0 bg-[var(--chrome-bg)] backdrop-blur-md z-10">
          <button
            type="button"
            className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--text-primary)] active:bg-[var(--surface-2)] transition-colors"
            onClick={() => {
              tapHaptic('light');
              setViewMode('profile');
            }}
            aria-label="Back to profile"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-base font-bold">{t('profile.ratingsModalTitle')}</h1>
          <div className="w-10" />
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-[calc(110px+env(safe-area-inset-bottom,0px))]">
          {loadingRatings ? (
            <div className="text-center py-16 text-[var(--text-secondary)] text-sm">
              Loading partner reviews…
            </div>
          ) : ratingsList.length > 0 ? (
            <div className="flex flex-col gap-2.5">
              {ratingsList.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3.5 p-3.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl shadow-sm"
                >
                  <Avatar name={item.rater_name || undefined} avatarUrl={item.rater_avatar_url || undefined} size={42} />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate text-[var(--text-primary)]">
                      {item.rater_name || t('common.anonymous')}
                    </div>
                    <div className="text-xs text-[var(--text-secondary)]">{formatDate(item.created_at)}</div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={14}
                        fill={s <= item.score ? '#f59e0b' : 'none'}
                        color={s <= item.score ? '#f59e0b' : 'var(--text-secondary)'}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-[var(--text-secondary)] space-y-2">
              <Star size={40} className="mx-auto opacity-35 text-amber-400" />
              <p className="font-bold text-base text-[var(--text-primary)]">{t('profile.noRatingsYet')}</p>
              <p className="text-xs max-w-xs mx-auto leading-relaxed">
                Complete 1-on-1 speaking practice sessions with partners to receive ratings and feedback.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="profile">
      <div className="profile__scroll">
        {/* User Hero Header */}
        <div className="profile__hero">
          <div className="profile__avatar-wrap">
            <div className="profile__avatar-ring">
              <Avatar name={user?.displayName || undefined} avatarUrl={user?.avatarUrl || undefined} size={76} />
            </div>
            <button
              type="button"
              className="profile__avatar-edit-btn"
              onClick={() => {
                tapHaptic('light');
                navigate('settings', { from: 'profile' });
              }}
              aria-label="Edit Profile"
            >
              <Pencil size={11} />
            </button>
          </div>

          <h1 className="profile__name">{user?.displayName || t('common.anonymous')}</h1>
          {user?.username && <p className="profile__username">@{user.username}</p>}

          <div className="profile__pills-row">
            <button
              type="button"
              className="profile__level-badge"
              onClick={() => {
                tapHaptic('light');
                navigate('settings', { from: 'profile' });
              }}
            >
              <BarChart2 size={12} className="profile__level-icon" />
              <span>{t(`level.${level}`)} • {t(`levelName.${level}`)}</span>
              <ChevronRight size={11} className="opacity-70" />
            </button>
            {isPremium ? (
              <span className="profile__status-badge profile__status-badge--premium">
                <Crown size={12} className="profile__crown-icon" />
                <span>Premium</span>
              </span>
            ) : (
              <button
                type="button"
                className="profile__status-badge profile__status-badge--free"
                onClick={() => {
                  tapHaptic('light');
                  navigate('invite', { from: 'profile' });
                }}
              >
                <Clock size={12} className="profile__clock-icon" />
                <span>{availableMinutes}m Available</span>
              </button>
            )}
          </div>
        </div>

        {/* 4-Item Quick Stats Grid */}
        <div className="profile__stats-grid">
          <div
            className="profile__stat-box profile__stat-box--clickable"
            onClick={() => {
              tapHaptic('light');
              navigate('statistics', { from: 'profile' });
            }}
          >
            <span className="profile__stat-icon profile__stat-icon--time">
              <Clock size={16} />
            </span>
            <span className="profile__stat-value">{formatPracticeTime(totalMinutes)}</span>
            <span className="profile__stat-label">{t('profile.timeTalked')}</span>
          </div>

          <div className="profile__stat-box">
            <span className="profile__stat-icon profile__stat-icon--users">
              <Users size={16} />
            </span>
            <span className="profile__stat-value">{uniquePartners}</span>
            <span className="profile__stat-label">{t('profile.partners')}</span>
          </div>

          <div
            className="profile__stat-box profile__stat-box--clickable"
            onClick={openRatings}
          >
            <span className="profile__stat-icon profile__stat-icon--star">
              <Star size={16} fill="currentColor" />
            </span>
            <span className="profile__stat-value">{avgRatingNum} ★</span>
            <span className="profile__stat-label">
              {ratingCount} {ratingCount === 1 ? 'review' : 'reviews'}
            </span>
          </div>

          <div className="profile__stat-box">
            <span className="profile__stat-icon profile__stat-icon--flame">
              <Flame size={16} />
            </span>
            <span className="profile__stat-value">{streakCount}</span>
            <span className="profile__stat-label">
              {longestStreak > streakCount ? `Streak (Best ${longestStreak})` : 'Day Streak'}
            </span>
          </div>
        </div>

        {/* Section 1: Activity & Progress */}
        <div className="profile__section-header">
          <BarChart2 size={13} className="text-[#A78BFA]" />
          <span>Activity &amp; Progress</span>
        </div>
        <div className="profile__card">
          <button
            type="button"
            className="profile__row"
            onClick={() => {
              tapHaptic('light');
              navigate('statistics', { from: 'profile' });
            }}
          >
            <span className="profile__row-icon-wrapper profile__row-icon-wrapper--purple">
              <BarChart2 size={18} />
            </span>
            <div className="profile__row-text">
              <span className="profile__row-title">Detailed Statistics</span>
              <span className="profile__row-sub">Practice charts and talk history</span>
            </div>
            <Chevron />
          </button>

          <button
            type="button"
            className="profile__row"
            onClick={openRatings}
          >
            <span className="profile__row-icon-wrapper profile__row-icon-wrapper--amber">
              <Star size={18} />
            </span>
            <div className="profile__row-text">
              <span className="profile__row-title">{t('profile.ratingsModalTitle')}</span>
              <span className="profile__row-sub">{ratingCount} partner reviews received</span>
            </div>
            <span className="profile__row-val">{avgRatingNum} ★</span>
            <Chevron />
          </button>

          <button
            type="button"
            className="profile__row"
            onClick={() => {
              tapHaptic('light');
              navigate('listings');
            }}
          >
            <span className="profile__row-icon-wrapper profile__row-icon-wrapper--cyan">
              <Users size={18} />
            </span>
            <div className="profile__row-text">
              <span className="profile__row-title">{t('home.listingsTitle')}</span>
              <span className="profile__row-sub">{t('home.listingsSub')}</span>
            </div>
            <Chevron />
          </button>
        </div>

        {/* Section 2: Community & Invites */}
        <div className="profile__section-header">
          <Users size={13} className="text-[#38BDF8]" />
          <span>Community &amp; Sharing</span>
        </div>
        <div className="profile__card">
          <button
            type="button"
            className="profile__row"
            onClick={() => {
              tapHaptic('light');
              navigate('invite', { from: 'profile' });
            }}
          >
            <span className="profile__row-icon-wrapper profile__row-icon-wrapper--green">
              <Gift size={18} />
            </span>
            <div className="profile__row-text">
              <span className="profile__row-title">{t('nav.invite')}</span>
              <span className="profile__row-sub">{t('profile.inviteSub')}</span>
            </div>
            <Chevron />
          </button>

          <button
            type="button"
            className="profile__row"
            onClick={() => {
              tapHaptic('light');
              navigate('reviews');
            }}
          >
            <span className="profile__row-icon-wrapper profile__row-icon-wrapper--violet">
              <MessageSquare size={18} />
            </span>
            <div className="profile__row-text">
              <span className="profile__row-title">{t('profile.reviews')}</span>
              <span className="profile__row-sub">{t('profile.reviewsSub')}</span>
            </div>
            <Chevron />
          </button>
        </div>

        {/* Section 3: Preferences & Support */}
        <div className="profile__section-header">
          <SlidersHorizontal size={13} className="text-[#94A3B8]" />
          <span>{t('settings.title')} &amp; Support</span>
        </div>
        <div className="profile__card">
          <button
            type="button"
            className="profile__row"
            onClick={() => {
              tapHaptic('light');
              navigate('settings', { from: 'profile' });
            }}
          >
            <span className="profile__row-icon-wrapper profile__row-icon-wrapper--slate">
              <SlidersHorizontal size={18} />
            </span>
            <div className="profile__row-text">
              <span className="profile__row-title">{t('settings.title')}</span>
              <span className="profile__row-sub">{t('profile.settingsSub')}</span>
            </div>
            <span className="profile__row-val">{t(`level.${level}`)}</span>
            <Chevron />
          </button>

          <button
            type="button"
            className="profile__row"
            onClick={() => {
              tapHaptic('light');
              openSupport();
            }}
          >
            <span className="profile__row-icon-wrapper profile__row-icon-wrapper--rose">
              <LifeBuoy size={18} />
            </span>
            <div className="profile__row-text">
              <span className="profile__row-title">{t('profile.support')}</span>
              <span className="profile__row-sub">{t('profile.supportSub')}</span>
            </div>
            <Chevron />
          </button>
        </div>

        <div className="profile__footer" />
      </div>

      <style>{`
        .profile {
          display: flex; flex-direction: column;
          height: 100%; background: var(--bg);
        }
        .profile__scroll {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          padding: 12px 16px calc(115px + env(safe-area-inset-bottom, 0px));
          display: flex; flex-direction: column; gap: 14px;
        }

        .profile__hero {
          display: flex; flex-direction: column; align-items: center; gap: 7px;
          padding: 8px 0 4px;
          flex-shrink: 0;
        }
        .profile__avatar-wrap {
          position: relative;
          display: inline-block;
          margin-bottom: 2px;
        }
        .profile__avatar-ring {
          padding: 3px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(124, 58, 237, 0.7), rgba(0, 178, 254, 0.7));
          box-shadow: 0 8px 24px rgba(124, 58, 237, 0.25);
        }
        .profile__avatar-edit-btn {
          position: absolute;
          bottom: 2px;
          right: 2px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--surface-2);
          border: 1.5px solid var(--primary);
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.25);
          transition: transform 0.15s ease;
        }
        .profile__avatar-edit-btn:active {
          transform: scale(0.92);
        }

        .profile__name {
          font-size: 21px;
          font-weight: 800;
          letter-spacing: -0.4px;
          text-align: center;
          color: var(--text-primary);
        }
        .profile__username {
          font-size: 13px;
          color: var(--text-secondary);
          margin-top: -4px;
          font-weight: 500;
        }
        .profile__pills-row {
          display: flex; align-items: center; gap: 8px; margin-top: 4px;
          flex-wrap: wrap; justify-content: center;
        }
        .profile__level-badge {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 5px 12px; border-radius: 9999px;
          background: var(--primary-subtle);
          border: 1px solid var(--border-strong);
          color: var(--primary); font-size: 12px; font-weight: 600;
          cursor: pointer; transition: transform 0.15s ease, background-color 0.15s ease;
        }
        .profile__level-badge:active { transform: scale(0.96); opacity: 0.85; }
        .profile__level-icon { color: var(--primary); }

        .profile__status-badge {
          padding: 5px 12px; border-radius: 9999px;
          background: rgba(0, 178, 254, 0.08);
          border: 1px solid rgba(0, 178, 254, 0.28);
          color: #00B2FE;
          font-size: 12px; font-weight: 600;
          display: inline-flex; align-items: center; gap: 6px;
          cursor: pointer;
          transition: transform 0.15s ease, opacity 0.15s ease;
        }
        .profile__status-badge:active { transform: scale(0.96); opacity: 0.85; }
        .profile__status-badge--premium {
          background: rgba(245, 158, 11, 0.12);
          border-color: rgba(245, 158, 11, 0.4);
          color: #F59E0B;
          cursor: default;
        }
        .profile__clock-icon { color: #00B2FE; }
        .profile__crown-icon { color: #F59E0B; }

        .profile__stats-grid {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 4px;
          flex-shrink: 0;
        }
        .profile__stat-box {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 12px 4px;
          display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;
          gap: 4px;
          box-shadow: var(--shadow-sm);
          transition: transform 0.15s, border-color 0.15s;
          box-sizing: border-box;
        }
        .profile__stat-box--clickable { cursor: pointer; }
        .profile__stat-box--clickable:active {
          transform: scale(0.95);
          border-color: var(--primary);
          background: var(--surface-2);
        }
        .profile__stat-icon {
          width: 28px; height: 28px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center; margin-bottom: 2px;
        }
        .profile__stat-icon--time  { background: var(--primary-subtle); color: var(--primary); }
        .profile__stat-icon--users { background: var(--soft-cyan); color: var(--accent-cyan); }
        .profile__stat-icon--star  { background: rgba(245, 158, 11, 0.18); color: #F59E0B; }
        .profile__stat-icon--flame { background: rgba(239, 68, 68, 0.18); color: #F97316; }

        .profile__stat-value {
          font-size: 15px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.3px; line-height: 1.1;
        }
        .profile__stat-label {
          font-size: 9px; color: var(--text-secondary); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; line-height: 1.1;
        }

        .profile__section-header {
          font-size: 12px; font-weight: 700;
          color: var(--primary); letter-spacing: 0.02em;
          padding: 6px 2px 0;
          display: flex; align-items: center; gap: 6px;
          flex-shrink: 0;
        }

        .profile__card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 18px;
          box-shadow: var(--shadow-sm);
          display: flex; flex-direction: column;
          flex-shrink: 0;
          width: 100%;
          box-sizing: border-box;
          overflow: hidden;
        }
        .profile__row {
          display: flex; align-items: center; gap: 13px;
          width: 100%; min-height: 58px;
          box-sizing: border-box;
          text-align: left;
          padding: 13px 15px;
          border-bottom: 1px solid var(--border);
          transition: background-color 0.15s;
          border-top: none; border-left: none; border-right: none;
          background: transparent; cursor: pointer;
          flex-shrink: 0;
          -webkit-appearance: none;
          appearance: none;
        }
        .profile__row:last-child {
          border-bottom: none;
        }
        .profile__row:active {
          background: var(--surface-2);
        }

        .profile__row-icon-wrapper {
          width: 36px; height: 36px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .profile__row-icon-wrapper--purple { background: var(--primary-subtle); color: var(--primary); }
        .profile__row-icon-wrapper--amber  { background: rgba(245, 158, 11, 0.18); color: #F59E0B; }
        .profile__row-icon-wrapper--cyan   { background: var(--soft-cyan); color: var(--accent-cyan); }
        .profile__row-icon-wrapper--green  { background: var(--soft-green); color: var(--success); }
        .profile__row-icon-wrapper--violet { background: rgba(168, 85, 247, 0.18); color: #C084FC; }
        .profile__row-icon-wrapper--slate  { background: var(--surface-2); color: var(--text-secondary); }
        .profile__row-icon-wrapper--rose   { background: rgba(244, 63, 94, 0.18); color: #FB7185; }

        .profile__row-text { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .profile__row-title { font-size: 14px; font-weight: 700; color: var(--text-primary); }
        .profile__row-sub { font-size: 12px; color: var(--text-secondary); line-height: 1.35; }
        .profile__row-val {
          font-size: 12px; font-weight: 700; color: var(--primary);
          white-space: nowrap; flex-shrink: 0; margin-right: 4px;
        }
        .profile__chev { color: var(--text-tertiary); flex-shrink: 0; }
        .profile__footer { padding-bottom: 24px; flex-shrink: 0; }
      `}</style>
    </div>
  );
}
