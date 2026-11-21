import { Clock, ChevronRight, Bot } from 'lucide-react';
import React from 'react';
import { useT } from '../i18n';
import Avatar from './Avatar';

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
    partnerName?: string;
    partner_avatar_url?: string;
    partnerAvatarUrl?: string;
    started_at?: string;
    ended_at?: string;
    kind?: string;
  };
}

export default function SessionRow({ session: s }: SessionRowProps) {
  const t = useT();
  const dur = duration(s.started_at, s.ended_at);
  const isAi = s.kind === 'ai';
  const partnerName = isAi
    ? (t('ai.partnerName') || 'Tiloch AI')
    : (s.partner_name || s.partnerName || 'Speaking Partner');
  const avatarUrl = s.partner_avatar_url || s.partnerAvatarUrl;

  return (
    <div className="session-row">
      <div className="session-row__avatar-wrap">
        {isAi ? (
          <div className="session-row__ai-badge">
            <Bot size={18} className="text-white" />
          </div>
        ) : (
          <Avatar name={partnerName} avatarUrl={avatarUrl} size={38} />
        )}
      </div>
      <div className="session-row__info">
        <span className="session-row__name">{partnerName}</span>
        <div className="session-row__meta">
          <Clock size={11} className="text-[#38BDF8]" />
          <span>{dur || 'Voice practice'}</span>
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
          background: var(--surface);
          border-radius: 16px;
          border: 1px solid var(--border);
          box-shadow: var(--shadow-sm);
          transition: background var(--t), transform var(--t);
          cursor: default;
        }
        .session-row:active { background: var(--surface-2); transform: scale(0.99); }
        .session-row__avatar-wrap {
          width: 38px; height: 38px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .session-row__ai-badge {
          width: 38px; height: 38px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          border-radius: 50%;
          background: linear-gradient(135deg, #7C3AED 0%, #00B2FE 100%);
          box-shadow: 0 2px 8px rgba(124, 58, 237, 0.3);
        }
        .session-row__info {
          flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0;
        }
        .session-row__name {
          font-weight: 700; font-size: 14px; color: var(--text-primary);
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .session-row__meta {
          display: flex; align-items: center; gap: 4px;
          font-size: 12px; color: var(--text-secondary);
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
