import React from 'react';
import { useT } from '../i18n';
import { tapHaptic } from '../utils/haptics';

function MicIcon({ off }: { off: boolean }) {
  if (off) {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="2" y1="2" x2="22" y2="22" />
        <path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2" />
        <path d="M5 10v2a7 7 0 0 0 12 5" />
        <path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" />
        <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
        <line x1="12" y1="19" x2="12" y2="22" />
      </svg>
    );
  }
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  );
}

function CamIcon({ off }: { off: boolean }) {
  if (off) {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="2" y1="2" x2="22" y2="22" />
        <path d="M10.66 6H14a2 2 0 0 1 2 2v2.5l5.25-3.15A1 1 0 0 1 23 8.2v7.6a1 1 0 0 1-1.75.85L16 13.5V16a2 2 0 0 1-2 2H6.66" />
        <rect x="2" y="6" width="14" height="12" rx="2" />
      </svg>
    );
  }
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m22 8-6 4 6 4V8Z" />
      <rect width="14" height="12" x="2" y="6" rx="2" />
    </svg>
  );
}

function ChatBubbleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      <circle cx="8.5" cy="11.5" r="1" fill="currentColor" />
      <circle cx="12" cy="11.5" r="1" fill="currentColor" />
      <circle cx="15.5" cy="11.5" r="1" fill="currentColor" />
    </svg>
  );
}

function PhoneHangupIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08C.11 12.9 0 12.65 0 12.37c0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.66c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.1-.7-.28-.79-.73-1.68-1.36-2.66-1.85-.33-.16-.56-.51-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" />
    </svg>
  );
}

interface CallControlsProps {
  micOn: boolean;
  camOn: boolean;
  onToggleMic: () => void;
  onToggleCam: () => void;
  onEnd: () => void;
  onOpenChat: () => void;
  unread?: number;
  speaking?: boolean;
  hidden?: boolean;
  showCamera?: boolean;
}

export default function CallControls({
  micOn,
  camOn,
  onToggleMic,
  onToggleCam,
  onEnd,
  onOpenChat,
  unread = 0,
  speaking = false,
  hidden = false,
  showCamera = true,
}: CallControlsProps) {
  const t = useT();

  const handleMic = () => {
    tapHaptic();
    onToggleMic();
  };
  const handleCam = () => {
    tapHaptic();
    onToggleCam();
  };
  const handleEnd = () => {
    tapHaptic('medium');
    onEnd();
  };
  const handleChat = () => {
    tapHaptic();
    onOpenChat();
  };

  return (
    <div className={`cc-bar${hidden ? ' cc-bar--hidden' : ''}`} aria-hidden={hidden}>
      <div className="cc-capsule">
        {/* Mic Column */}
        <button
          className={`cc-col${!micOn ? ' cc-col--muted' : ''}${speaking ? ' cc-col--speaking' : ''}`}
          onClick={handleMic}
          aria-label={micOn ? t('cc.mute') : t('cc.unmute')}
        >
          <div className="cc-icon-box">
            <MicIcon off={!micOn} />
          </div>
          <span className="cc-label">{micOn ? t('cc.mute') : t('cc.unmute')}</span>
        </button>

        {showCamera && (
          <>
            <div className="cc-divider" aria-hidden="true" />
            {/* Camera Column */}
            <button
              className={`cc-col${camOn ? ' cc-col--active' : ' cc-col--muted'}`}
              onClick={handleCam}
              aria-label={camOn ? t('cc.stop') : t('cc.camera')}
            >
              <div className="cc-icon-box">
                <CamIcon off={!camOn} />
              </div>
              <span className="cc-label">{camOn ? t('cc.stop') : t('cc.camera')}</span>
            </button>
          </>
        )}

        <div className="cc-divider" aria-hidden="true" />

        {/* Chat Column */}
        <button className="cc-col cc-col--chat" onClick={handleChat} aria-label={t('cc.chat')}>
          <div className="cc-icon-box">
            <ChatBubbleIcon />
            {unread > 0 && <span className="cc-badge">{unread > 9 ? '9+' : unread}</span>}
          </div>
          <span className="cc-label">{t('cc.chat')}</span>
        </button>

        <div className="cc-divider" aria-hidden="true" />

        {/* End Call Column */}
        <button className="cc-col cc-col--end" onClick={handleEnd} aria-label={t('cc.end')}>
          <div className="cc-end-btn">
            <PhoneHangupIcon />
          </div>
          <span className="cc-label cc-label--end">{t('cc.end')}</span>
        </button>
      </div>

      <style>{`
        .cc-bar {
          position: absolute;
          bottom: calc(env(safe-area-inset-bottom, 0px) + 16px);
          left: 16px;
          right: 16px;
          z-index: 25;
          display: flex;
          justify-content: center;
          pointer-events: none;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
        }
        .cc-bar--hidden {
          transform: translateY(140%);
          opacity: 0;
        }

        .cc-capsule {
          pointer-events: auto;
          width: 100%;
          max-width: 375px;
          background: rgba(18, 15, 34, 0.88);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 38px;
          padding: 8px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.12);
        }

        .light .cc-capsule {
          background: rgba(255, 255, 255, 0.94);
          border: 1px solid rgba(0, 0, 0, 0.08);
          box-shadow: 0 10px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8);
        }

        .cc-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          flex: 1;
          background: transparent;
          border: none;
          padding: 4px 0;
          cursor: pointer;
          color: rgba(255, 255, 255, 0.8);
          transition: transform 0.12s ease, color 0.15s ease;
          position: relative;
        }
        .light .cc-col {
          color: #475569;
        }
        .cc-col:active {
          transform: scale(0.92);
        }

        .cc-icon-box {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          position: relative;
          color: currentColor;
          transition: background 0.15s ease, color 0.15s ease;
        }

        .cc-col--speaking .cc-icon-box {
          color: #10B981;
          animation: ccPulse 1.4s infinite;
        }
        @keyframes ccPulse {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5); }
          70% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }

        .cc-col--active .cc-icon-box {
          color: #8B5CF6;
        }
        .light .cc-col--active .cc-icon-box {
          color: #7C3AED;
        }

        .cc-divider {
          width: 1px;
          height: 30px;
          background: rgba(255, 255, 255, 0.1);
          flex-shrink: 0;
        }
        .light .cc-divider {
          background: rgba(0, 0, 0, 0.08);
        }

        .cc-end-btn {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #EF4444;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          box-shadow: 0 4px 18px rgba(239, 68, 68, 0.55);
          transition: transform 0.12s ease, filter 0.15s ease;
        }
        .cc-col--end:active .cc-end-btn {
          transform: scale(0.92);
          filter: brightness(0.9);
        }

        .cc-label {
          font-size: 11px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.7);
          letter-spacing: -0.1px;
          line-height: 1;
        }
        .light .cc-label {
          color: #64748B;
        }
        .cc-label--end {
          color: rgba(255, 255, 255, 0.85);
          font-weight: 600;
        }
        .light .cc-label--end {
          color: #EF4444;
        }

        .cc-badge {
          position: absolute;
          top: 0;
          right: 0;
          background: #8B5CF6;
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          min-width: 16px;
          height: 16px;
          border-radius: 99px;
          padding: 0 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1.5px solid rgba(18, 15, 34, 0.9);
        }
        .light .cc-badge {
          border-color: #ffffff;
        }
      `}</style>
    </div>
  );
}
