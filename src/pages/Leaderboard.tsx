import React, { useEffect, useState } from 'react';
import { getLeaderboard } from '../api/endpoints';
import useAppStore from '../store/useAppStore';
import { useT } from '../i18n';
import { selectionHaptic } from '../utils/haptics';
import Avatar from '../components/Avatar';
import SkeletonRow from '../components/SkeletonRow';
import { Flame, Star, Trophy, Crown, Calendar, BarChart3 } from 'lucide-react';

const LEVEL_CODE: Record<number, string> = { 1: 'A1', 2: 'A2', 3: 'B1', 4: 'B2', 5: 'C1', 6: 'C2' };

function Row({ row, index, me, valueText }: { row: any; index: number; me: any; valueText: React.ReactNode }) {
  const t = useT();
  const isMe = me && row.id === me;
  const name = row.display_name || row.username || t('common.anonymous');
  const rank = index + 1;

  let rankBadge = null;
  if (rank === 1) {
    rankBadge = <Crown size={20} className="text-[#F59E0B] fill-[#FFC857]" />;
  } else if (rank === 2) {
    rankBadge = <span className="lb-rank-badge lb-rank-badge--2">2</span>;
  } else if (rank === 3) {
    rankBadge = <span className="lb-rank-badge lb-rank-badge--3">3</span>;
  } else {
    rankBadge = <span className="lb-rank-num">#{rank}</span>;
  }

  return (
    <div className={`lb-row ${rank === 1 ? 'lb-row--rank-1' : ''} ${isMe ? 'me' : ''}`}>
      <div className="lb-rank-col">
        {rankBadge}
      </div>
      <Avatar name={name} avatarUrl={row.avatar_url} size={42} />
      <div className="lb-row__info">
        <div className="lb-row__name-line">
          <span className="lb-row__nametext">{name}</span>
          {isMe && <span className="lb-you">{t('lb.you')}</span>}
        </div>
        {LEVEL_CODE[row.level] && (
          <span className="lb-row__level">{LEVEL_CODE[row.level]}</span>
        )}
      </div>
      <div className="lb-row__value-col">
        <Flame size={14} className="text-[#FF9F0A]" />
        <span className="lb-row__value">{valueText}</span>
      </div>
    </div>
  );
}

const SCOPES = [
  { key: 'today',   label: 'lb.scopeToday', icon: Calendar },
  { key: 'weekly',  label: 'lb.scopeWeekly', icon: BarChart3 },
  { key: 'monthly', label: 'lb.scopeMonthly', icon: Calendar },
];

export default function Leaderboard() {
  const { user, leaderboardCache, setLeaderboardScope } = useAppStore();
  const t = useT();
  const [tab, setTab] = useState<'active' | 'rated'>('active');
  const [scope, setScope] = useState<'today' | 'weekly' | 'monthly'>('today');

  const leaderboard = leaderboardCache[scope] || null;
  const loaded = leaderboard != null;

  useEffect(() => {
    getLeaderboard(scope)
      .then((d) => setLeaderboardScope(scope, d))
      .catch(() => { if (!leaderboardCache[scope]) setLeaderboardScope(scope, { mostActive: [], topRated: [] }); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope]);

  const mostActive = leaderboard?.mostActive || [];
  const topRated   = leaderboard?.topRated   || [];
  const activeList = tab === 'active' ? mostActive : topRated;

  function formatValue(row: any) {
    if (tab === 'active') {
      const mins = row.total_minutes || 0;
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      const timeStr = h === 0 ? `${m}m` : `${h}h ${m}m`;
      return <>{timeStr}</>;
    } else {
      return <>{Number(row.avg_rating || 0).toFixed(1)} ★</>;
    }
  }

  return (
    <div className="lb">
      {/* Header Banner with Podium Illustration */}
      <div className="lb-head">
        <div className="lb-head__left">
          <div className="lb-head__icon">
            <Trophy className="text-[#FFD700]" size={26} />
          </div>
          <div>
            <h1 className="lb-title">{t('lb.title')}</h1>
            <p className="lb-sub">{t('lb.subtitle')}</p>
          </div>
        </div>

        <div className="lb-head__podium" aria-hidden="true">
          <div className="lb-head__podium-trophy">🏆</div>
          <div className="lb-head__podium-block">1</div>
        </div>
      </div>

      {/* Scope filter (Time Period) */}
      <div className="lb-scope">
        {SCOPES.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.key}
              className={`lb-scope-btn ${scope === s.key ? 'on' : ''}`}
              onClick={() => { if (scope !== s.key) { selectionHaptic(); setScope(s.key as any); } }}
            >
              <Icon size={14} />
              <span>{t(s.label)}</span>
            </button>
          );
        })}
      </div>

      {/* Category Tabs */}
      <div className="lb-tabs">
        <button
          type="button"
          className={`lb-tab ${tab === 'active' ? 'on' : ''}`}
          onClick={() => { if (tab !== 'active') { selectionHaptic(); setTab('active'); } }}
        >
          <Flame size={15} className="text-[#FF9F0A]" />
          <span>{t('lb.mostActive')}</span>
        </button>
        <button
          type="button"
          className={`lb-tab ${tab === 'rated' ? 'on' : ''}`}
          onClick={() => { if (tab !== 'rated') { selectionHaptic(); setTab('rated'); } }}
        >
          <Star size={15} className="text-[#F59E0B]" />
          <span>{t('lb.topRated')}</span>
        </button>
      </div>

      <div className="lb-scroll">
        {!loaded ? (
          <div className="lb-list">
            {[0, 1, 2, 3, 4].map(i => <SkeletonRow key={i} rank avatar={40} />)}
          </div>
        ) : activeList.length > 0 ? (
          <div className="lb-list">
            {activeList.map((row: any, i: number) => (
              <Row
                key={row.id || i}
                row={row}
                index={i}
                me={user?.id}
                valueText={formatValue(row)}
              />
            ))}
          </div>
        ) : (
          <p className="lb-empty">{t(tab === 'active' ? 'lb.emptyActive' : 'lb.emptyRated')}</p>
        )}
        <div className="lb-footer" />
      </div>

      <style>{`
        .lb {
          display: flex; flex-direction: column;
          height: 100%; overflow: hidden; background: #070512;
        }

        /* ── Header Banner ── */
        .lb-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: calc(16px + env(safe-area-inset-top, 0px)) 16px 14px;
          position: relative;
        }
        .lb-head__left {
          display: flex; align-items: center; gap: 12px;
        }
        .lb-head__icon {
          width: 44px; height: 44px; border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.22) 0%, rgba(217, 119, 6, 0.08) 100%);
          border: 1px solid rgba(245, 158, 11, 0.35);
          box-shadow: 0 4px 16px rgba(245, 158, 11, 0.2);
          flex-shrink: 0;
        }
        .lb-title { font-size: 22px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.02em; }
        .lb-sub { font-size: 12px; color: #94A3B8; margin-top: 1px; }

        .lb-head__podium {
          display: flex; flex-direction: column; align-items: center;
          position: relative; padding-right: 8px;
        }
        .lb-head__podium-trophy {
          font-size: 28px; filter: drop-shadow(0 4px 12px rgba(245, 158, 11, 0.5));
          animation: podiumPulse 2.8s ease-in-out infinite;
        }
        @keyframes podiumPulse {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        .lb-head__podium-block {
          width: 42px; height: 26px; border-radius: 8px 8px 0 0;
          background: linear-gradient(180deg, #4F46E5 0%, #312E81 100%);
          border: 1px solid rgba(139, 92, 246, 0.4);
          color: #FFFFFF; font-size: 12px; font-weight: 800;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
        }

        /* ── Scope Filter ── */
        .lb-scope {
          display: flex; gap: 8px;
          margin: 0 16px 12px;
        }
        .lb-scope-btn {
          flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
          padding: 8px 12px;
          font-size: 12px; font-weight: 700;
          color: #94A3B8;
          background: #140E2D;
          border: 1px solid rgba(139, 92, 246, 0.2);
          border-radius: var(--radius-full);
          transition: all 0.18s var(--ease-out);
        }
        .lb-scope-btn.on {
          color: #FFFFFF;
          background: linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%);
          border-color: rgba(139, 92, 246, 0.5);
          box-shadow: 0 4px 16px rgba(124, 58, 237, 0.4);
        }
        .lb-scope-btn:active:not(.on) { background: #1B1238; color: #FFFFFF; }

        /* ── Category Tabs ── */
        .lb-tabs {
          display: flex; gap: 8px;
          margin: 0 16px 14px;
        }
        .lb-tab {
          flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 6px;
          padding: 9px 14px;
          font-size: 12px; font-weight: 700;
          color: #94A3B8;
          background: #140E2D;
          border: 1px solid rgba(139, 92, 246, 0.2);
          border-radius: var(--radius-full);
          transition: all var(--t);
          cursor: pointer;
        }
        .lb-tab.on {
          background: #1C123D;
          border-color: rgba(139, 92, 246, 0.45);
          color: #FFFFFF;
          box-shadow: 0 2px 14px rgba(124, 58, 237, 0.25);
        }

        .lb-scroll {
          flex: 1; overflow-y: auto;
          padding: 0 16px calc(120px + env(safe-area-inset-bottom, 0px));
          display: flex; flex-direction: column; gap: 12px;
        }

        .lb-list { display: flex; flex-direction: column; gap: 10px; }

        /* ── Ranking Row Cards ── */
        .lb-row {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 14px;
          background: #120B26;
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 18px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
          transition: transform 0.15s ease, border-color 0.15s ease;
        }
        .lb-row:active { transform: scale(0.99); }
        .lb-row.me {
          border-color: rgba(99, 102, 241, 0.65) !important;
          background: #160F33 !important;
        }

        .lb-row--rank-1 {
          border-color: rgba(139, 92, 246, 0.5);
          background: #150E2F;
          box-shadow: 0 4px 20px rgba(124, 58, 237, 0.25);
        }

        .lb-rank-col {
          min-width: 28px; display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .lb-rank-num {
          font-size: 13px; font-weight: 800; color: #64748B;
        }
        .lb-rank-badge {
          display: flex; align-items: center; justify-content: center;
          width: 26px; height: 26px; border-radius: 50%;
          font-size: 12px; font-weight: 800;
        }
        .lb-rank-badge--2 {
          background: #1C153B;
          color: #E2E8F0;
          border: 1px solid rgba(148, 163, 184, 0.4);
        }
        .lb-rank-badge--3 {
          background: rgba(217, 119, 6, 0.2);
          color: #F59E0B;
          border: 1px solid rgba(217, 119, 6, 0.45);
        }

        .lb-row__info { flex: 1; display: flex; flex-direction: column; gap: 3px; min-width: 0; }
        .lb-row__name-line {
          display: flex; align-items: center; gap: 6px; min-width: 0;
        }
        .lb-row__nametext {
          font-size: 14px; font-weight: 700; color: #FFFFFF;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0;
        }
        .lb-you {
          font-size: 10px; font-weight: 700;
          padding: 2px 7px; border-radius: 999px;
          background: rgba(99, 102, 241, 0.35); color: #C7D2FE;
          border: 1px solid rgba(99, 102, 241, 0.5);
          flex-shrink: 0;
        }
        .lb-row__level {
          font-size: 10px; font-weight: 700;
          color: #C4B5FD;
          background: rgba(124, 58, 237, 0.25);
          padding: 1px 7px; border-radius: 6px;
          width: fit-content;
        }

        .lb-row__value-col {
          display: flex; align-items: center; gap: 4px;
          flex-shrink: 0; text-align: right;
        }
        .lb-row__value {
          font-size: 13px; font-weight: 800;
          color: #FFFFFF; white-space: nowrap;
        }

        .lb-empty {
          font-size: 13px; color: #94A3B8;
          text-align: center; padding: 36px 20px;
          background: #120B26; border: 1px solid rgba(139, 92, 246, 0.18);
          border-radius: 18px;
        }
        .lb-footer { padding-bottom: 8px; }
      `}</style>
    </div>
  );
}
