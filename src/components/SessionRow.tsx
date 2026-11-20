import { Play, Globe, ChevronRight } from 'lucide-react';
import React from 'react';
import { useT } from '../i18n';

function duration(startedAt?: string, endedAt?: string) {
  if (!startedAt || !endedAt) return null;
  const ms = new Date(endedAt).getTime() - new Date(startedAt).getTime();
  const totalSecs = Math.floor(ms / 1000);
  if (totalSecs < 0) return '0s';
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  if (mins === 0) return `${secs}s`;
  if (secs === 0) return `${mins}m`;
  return `${mins}m ${secs}s`;
}

function timeAgo(dateStr: string | undefined, t: any) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return t('time.justNow') || 'Just now';

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;

  const diffDay = Math.floor(diffHour / 24);
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

interface SessionRowProps {
  session: {
    partner_name?: string;
    partner_avatar_url?: string;
    started_at?: string;
    ended_at?: string;
    kind?: string;
  };
}

export default function SessionRow({ session: s }: SessionRowProps) {
  const t = useT();
  const dur = duration(s.started_at, s.ended_at);
  const isAi = s.kind === 'ai';
  const partnerName = isAi ? (t('ai.partnerName') || 'Tiloch AI') : (s.partner_name || '•••');

  return (
    <div className="session-row">
      <div className="session-row__play-badge">
        <Play size={14} fill="#FFFFFF" color="#FFFFFF" style={{ marginLeft: 2 }} />
      </div>
      <div className="session-row__info">
        <span className="session-row__name">{partnerName}</span>
        <div className="session-row__meta">
          <Globe size={11} className="text-[#38BDF8]" />
          <span>English{dur ? ` • ${dur}` : ''}</span>
        </div>
      </div>
      <div className="session-row__right">
        <span className="session-row__date">{timeAgo(s.ended_at, t)}</span>
        <ChevronRight size={14} className="session-row__arrow" />
      </div>

      <style>{`
        .session-row {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 14px;
          background: #140E2D;
          border-radius: 16px;
          border: 1px solid rgba(139, 92, 246, 0.18);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
          transition: background var(--t), transform var(--t);
          cursor: default;
        }
        .session-row:active { background: #1B123B; transform: scale(0.99); }
        .session-row__play-badge {
          width: 36px; height: 36px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          border-radius: 50%;
          background: linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%);
          box-shadow: 0 2px 10px rgba(124, 58, 237, 0.4);
        }
        .session-row__info {
          flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0;
        }
        .session-row__name {
          font-weight: 700; font-size: 14px; color: #FFFFFF;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .session-row__meta {
          display: flex; align-items: center; gap: 4px;
          font-size: 12px; color: #94A3B8;
        }
        .session-row__right {
          display: flex; align-items: center; gap: 4px; flex-shrink: 0;
        }
        .session-row__date { font-size: 12px; color: #64748B; white-space: nowrap; }
        .session-row__arrow { color: #64748B; }
      `}</style>
    </div>
  );
}
