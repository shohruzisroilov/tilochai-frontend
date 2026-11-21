import { useState, useEffect, useRef, useCallback } from 'react';
import { LiveKitRoom, RoomAudioRenderer, useRoomContext, useTracks, VideoTrack, useRemoteParticipants, useSpeakingParticipants } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { endSession } from '../api/endpoints';
import { useSocket } from '../hooks/useSocket';
import useAppStore from '../store/useAppStore';
import CallControls from '../components/CallControls';
import ChatOverlay from '../components/ChatOverlay';
import EndSessionSheet from '../components/EndSessionSheet';
import Avatar from '../components/Avatar';
import SpeakingQuestions from '../components/SpeakingQuestions';
import { useT } from '../i18n';
import { notifyHaptic, tapHaptic } from '../utils/haptics';
import { AlertCircle, AlertTriangle, X, Lightbulb, ChevronRight, ArrowLeft } from 'lucide-react';

function fmt(s: number): string {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

function MediaController({ micOn, camOn }: { micOn: boolean; camOn: boolean }) {
  const room = useRoomContext();
  useEffect(() => {
    if (room?.state === 'connected' || room?.localParticipant) {
      room.localParticipant?.setMicrophoneEnabled(micOn).catch(() => {});
    }
  }, [micOn, room]);
  useEffect(() => {
    if (room?.state === 'connected' || room?.localParticipant) {
      room.localParticipant?.setCameraEnabled(camOn).catch(() => {});
    }
  }, [camOn, room]);
  return null;
}

function AudioUnlocker() {
  const room = useRoomContext();
  useEffect(() => {
    if (!room) return;
    const unlock = () => {
      room.startAudio().catch(() => {});
    };
    unlock();
    window.addEventListener('click', unlock, { once: true });
    window.addEventListener('touchstart', unlock, { once: true });
    return () => {
      window.removeEventListener('click', unlock);
      window.removeEventListener('touchstart', unlock);
    };
  }, [room]);
  return null;
}

// ── Drag hook for PiP window ───────────────────────────────────────────────
function useDrag(initialPos: { x: number; y: number }, onClick?: () => void) {
  const [pos, setPos] = useState(initialPos);
  const dragging = useRef(false);
  const moved = useRef(false);
  const startRef = useRef({ x: 0, y: 0, px: 0, py: 0 });

  function onPointerDown(e: React.PointerEvent) {
    dragging.current = true;
    moved.current = false;
    startRef.current = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y };
    e.currentTarget.setPointerCapture(e.pointerId);
    e.stopPropagation();
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging.current) return;
    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;

    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      moved.current = true;
    }

    const newX = startRef.current.px + dx;
    const newY = startRef.current.py + dy;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const pipW = 110;
    const pipH = 160;

    const clampedX = Math.max(-(vw - pipW - 12), Math.min(newX, -12));
    const clampedY = Math.max(-(vh - pipH - 12), Math.min(newY, -12));

    setPos({ x: clampedX, y: clampedY });
  }

  function onPointerUp() {
    dragging.current = false;
    if (!moved.current && onClick) {
      onClick();
    }
  }

  return { pos, onPointerDown, onPointerMove, onPointerUp };
}

function VideoGrid({ session }: { session: any }) {
  const tracks = useTracks(
    [{ source: Track.Source.Camera, withPlaceholder: true }],
    { onlySubscribed: false }
  );
  const speakingIds = new Set(useSpeakingParticipants().map(p => p.identity));

  const localTrack  = tracks.find(t => t.participant?.isLocal);
  const remoteTrack = tracks.find(t => t.participant && !t.participant.isLocal);
  const hasLocal    = !!localTrack?.publication?.track;
  const hasRemote   = !!remoteTrack?.publication?.track;

  const [swapped, setSwapped] = useState(false);

  const pip = useDrag({ x: -14, y: -130 }, () => setSwapped(v => !v));

  if (!hasLocal && !hasRemote) return null;

  const mainTrack   = swapped ? localTrack  : remoteTrack;
  const mainName    = swapped ? 'You'        : (session?.partnerName || 'Partner');
  const mainHas     = swapped ? hasLocal     : hasRemote;
  const mainLetter  = swapped ? 'You'        : (session?.partnerName?.[0]?.toUpperCase() || '?');

  const pipTrack    = swapped ? remoteTrack  : localTrack;
  const pipName     = swapped ? (session?.partnerName || 'Partner') : 'You';
  const pipHas      = swapped ? hasRemote    : hasLocal;
  const pipLetter   = swapped ? (session?.partnerName?.[0]?.toUpperCase() || '?') : 'You';

  const mainMirror = swapped;
  const pipMirror  = !swapped;

  const mainSpeaking = mainTrack?.participant ? speakingIds.has(mainTrack.participant.identity) : false;
  const pipSpeaking  = pipTrack?.participant  ? speakingIds.has(pipTrack.participant.identity)  : false;

  return (
    <div className="video-grid">
      <div className={`video-main${mainSpeaking ? ' video-main--speaking' : ''}`}>
        {mainHas && mainTrack
          ? <VideoTrack trackRef={mainTrack as any} style={mainMirror ? { transform: 'scaleX(-1)' } : {}} />
          : <div className="video-avatar"><span>{mainLetter}</span></div>
        }
        <div className="video-scrim" />
        <span className="video-label">
          {mainSpeaking && <span className="video-label__dot" />}
          {mainName}
        </span>
      </div>

      <div
        className={`video-pip${pipSpeaking ? ' video-pip--speaking' : ''}`}
        style={{
          right: Math.max(12, -pip.pos.x),
          bottom: Math.max(12, -pip.pos.y),
          touchAction: 'none',
        }}
        onPointerDown={pip.onPointerDown}
        onPointerMove={pip.onPointerMove}
        onPointerUp={pip.onPointerUp}
      >
        {pipHas && pipTrack
          ? <VideoTrack trackRef={pipTrack as any} style={pipMirror ? { transform: 'scaleX(-1)' } : {}} />
          : <div className="video-avatar video-avatar--pip"><span>{pipLetter}</span></div>
        }
        <span className="video-label video-label--pip">{pipName}</span>
        <div className="video-pip__swap" aria-hidden="true">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3 4 7l4 4" /><path d="M4 7h16" />
            <path d="m16 21 4-4-4-4" /><path d="M20 17H4" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function friendlyError(msg: string | null, t: any): string {
  if (!msg) return t('call.err.generic');
  const m = msg.toLowerCase();
  if (m.includes('webrtc') || m.includes('not supported'))
    return t('call.err.webrtc');
  if (m.includes('permission') || m.includes('notallowed'))
    return t('call.err.permission');
  if (m.includes('network') || m.includes('ice') || m.includes('connection'))
    return t('call.err.network');
  return t('call.err.generic');
}

function ConnectionWatcher({ onPartnerLeft }: { onPartnerLeft: () => void }) {
  const room = useRoomContext();
  const participants = useRemoteParticipants();
  const setPartnerConnected = useAppStore((s) => s.setPartnerConnected);
  const wasConnectedRef = useRef(false);
  const hasRemote = participants.length > 0;

  useEffect(() => {
    if (hasRemote) {
      wasConnectedRef.current = true;
      setPartnerConnected(true);
    } else if (wasConnectedRef.current) {
      setPartnerConnected(false);
      onPartnerLeft();
    }
  }, [hasRemote, setPartnerConnected, onPartnerLeft]);

  useEffect(() => {
    if (!room) return;
    const handleDisconnected = () => {
      if (wasConnectedRef.current) {
        setPartnerConnected(false);
        onPartnerLeft();
      }
    };
    room.on('participantDisconnected', handleDisconnected);
    return () => {
      room.off('participantDisconnected', handleDisconnected);
    };
  }, [room, onPartnerLeft, setPartnerConnected]);

  return null;
}

function SpeakingWatcher({ onChange }: { onChange: (you: boolean, partner: boolean) => void }) {
  const speaking = useSpeakingParticipants();
  const youSpeaking = speaking.some((p) => p.isLocal);
  const partnerSpeaking = speaking.some((p) => !p.isLocal);

  useEffect(() => {
    onChange(youSpeaking, partnerSpeaking);
  }, [youSpeaking, partnerSpeaking, onChange]);

  return null;
}

export default function Chat() {
  const {
    session, messages, isPartnerTyping,
    isCallActive, navigate, setCallActive,
    livekitToken, livekitUrl,
    clearSession, setMatchingStatus,
    partnerConnected, setPartnerConnected,
    user, updateUser, addMessage,
    speakingTopicId,
  } = useAppStore();
  const { joinSession, sendMessage, sendTyping } = useSocket();
  const t = useT();

  const [elapsed, setElapsed]       = useState(0);
  const [showChat, setShowChat]     = useState(false);
  const [showEnd, setShowEnd]       = useState(false);
  const [ending, setEnding]         = useState(false);
  const [micOn, setMicOn]           = useState(true);
  const [camOn, setCamOn]           = useState(false);
  const [speakingDetail, setSpeakingDetail] = useState(false);
  const [liveKitError, setLiveKitError] = useState<string | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [lastSeenCount, setLastSeenCount] = useState(0);
  const [connectionTimeout, setConnectionTimeout] = useState(false);
  const [youSpeaking, setYouSpeaking] = useState(false);
  const [partnerSpeaking, setPartnerSpeaking] = useState(false);

  const showChatRef = useRef(false);
  showChatRef.current = showChat;

  const handleSpeaking = useCallback((you: boolean, partner: boolean) => {
    setYouSpeaking(you);
    setPartnerSpeaking(partner);
  }, []);

  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (session?.id) joinSession(session.id);
    const backBtn = window.Telegram?.WebApp?.BackButton;
    const onBack = () => {
      if (showChatRef.current) {
        setShowChat(false);
      } else {
        setShowEnd(true);
      }
    };
    if (backBtn) {
      backBtn.show();
      backBtn.onClick(onBack);
    }
    timerRef.current = setInterval(() => setElapsed((prev) => prev + 1), 1000);

    const timeoutId = setTimeout(() => {
      if (!useAppStore.getState().partnerConnected) {
        setConnectionTimeout(true);
      }
    }, 25000);

    return () => {
      clearInterval(timerRef.current);
      clearTimeout(timeoutId);
      if (backBtn) {
        backBtn.offClick(onBack);
        backBtn.hide();
      }
    };
  }, []);

  async function handleRetryConnection() {
    if (session?.id) {
      try { await endSession(session.id); } catch {}
    }
    clearSession();
    setMatchingStatus('idle');
    navigate('matching');
  }

  async function handleGoHome() {
    if (session?.id) {
      try { await endSession(session.id); } catch {}
    }
    clearSession();
    setMatchingStatus('idle');
    navigate('home');
  }

  async function handleEnd() {
    if (ending) return;
    setEnding(true);

    if (session?.id) {
      try { await endSession(session.id); } catch {}
    }
    navigate('session_end', { sessionId: session?.id, elapsed });
  }

  const handlePartnerLeft = useCallback(() => {
    if (ending) return;
    setEnding(true);
    notifyHaptic('warning');
    if (session?.id) {
      try { endSession(session.id); } catch {}
    }
    navigate('session_end', { sessionId: session?.id, elapsed, reason: 'partner_left' });
  }, [ending, session?.id, elapsed, navigate]);

  const unread = showChat ? 0 : Math.max(0, messages.length - lastSeenCount);
  useEffect(() => {
    if (showChat) setLastSeenCount(messages.length);
  }, [showChat, messages.length]);

  useEffect(() => {
    if (partnerConnected) notifyHaptic('success');
  }, [partnerConnected]);

  if (connectionTimeout) {
    return (
      <div className="timeout-screen scale-in">
        <span className="chat-glyph"><AlertCircle size={30} /></span>
        <div className="timeout-info">
          <h2>{t('call.timeoutTitle')}</h2>
          <p>{t('call.timeoutDesc')}</p>
        </div>
        <div className="timeout-actions">
          <button className="btn-primary" onClick={handleRetryConnection}>{t('common.tryAgain')}</button>
          <button className="btn-secondary" onClick={handleGoHome}>{t('common.goHome')}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="call-screen">

      {/* LiveKit room for real human calls */}
      {isCallActive && livekitToken && livekitUrl && (
        <LiveKitRoom
          {...({
            token: livekitToken,
            serverUrl: livekitUrl,
            connect: true,
            audio: true,
            video: camOn,
            onConnected: (r: any) => {
              setLiveKitError(null);
              setIsReconnecting(false);
              r?.startAudio?.().catch?.(() => {});
            },
            onDisconnected: () => setCallActive(false),
            onReconnecting: () => setIsReconnecting(true),
            onReconnected: (r: any) => {
              setIsReconnecting(false);
              r?.startAudio?.().catch?.(() => {});
            },
            onError: (err: Error) => {
              console.error('LiveKit error:', err);
              setLiveKitError(err?.message || 'Connection failed');
            },
            style: { position: 'absolute', inset: 0, zIndex: 0 }
          } as any)}
        >
          <RoomAudioRenderer />
          <AudioUnlocker />
          <MediaController micOn={micOn} camOn={camOn} />
          <ConnectionWatcher onPartnerLeft={handlePartnerLeft} />
          <SpeakingWatcher onChange={handleSpeaking} />
          {camOn && <VideoGrid session={session} />}
        </LiveKitRoom>
      )}

      {/* Reconnecting banner */}
      {isReconnecting && (
        <div className="reconnecting-banner fade-down">
          <span>{t('call.reconnecting')}</span>
        </div>
      )}

      {/* Gradient bg */}
      {!camOn && <div className="call-bg-glow" />}

      {/* LiveKit error banner */}
      {liveKitError && (
        <div className="call-error-banner">
          <span><AlertTriangle size={14} /> {friendlyError(liveKitError, t)}</span>
          <button onClick={() => setLiveKitError(null)} aria-label="Close"><X size={15} /></button>
        </div>
      )}

      {/* Camera timer overlay */}
      {camOn && (
        <div className="call-cam-timer">
          <span
            className="call-dot"
            style={{
              background: partnerConnected ? 'var(--success)' : 'var(--warning)',
              boxShadow: partnerConnected ? '0 0 6px var(--success)' : '0 0 6px var(--warning)',
            }}
          />
          <span>{partnerConnected ? fmt(elapsed) : t('call.waiting')}</span>
        </div>
      )}

      {/* ── Header — audio mode (tepada sherik ma'lumotlari) ── */}
      {!camOn && (
        <div className="call-header">
          <div className="call-header__left">
            <div className={`call-presence${partnerSpeaking ? ' call-presence--speaking' : ''}`}>
              <Avatar name={session?.partnerName} avatarUrl={session?.partnerAvatarUrl} size={42} />
            </div>
            <div className="call-header__info">
              <span className="call-header__name">
                {session?.partnerName || 'Partner'}
              </span>
              <div className="call-header__level-pill">
                <svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor" className="call-level-bars" aria-hidden="true">
                  <rect x="1" y="6" width="2" height="5" rx="1" />
                  <rect x="5" y="3.5" width="2" height="7.5" rx="1" />
                  <rect x="9" y="1" width="2" height="10" rx="1" />
                </svg>
                <span>{t(`levelName.${session?.partnerLevel || user?.level || 3}`)}</span>
                {partnerSpeaking && (
                  <span className="call-status--speaking-dot" title="Speaking" />
                )}
              </div>
            </div>
          </div>

          <div className="call-header__timer-pill">
            <span
              className="call-timer-dot"
              style={{
                background: partnerConnected ? '#10B981' : '#F59E0B',
                boxShadow: partnerConnected ? '0 0 8px rgba(16, 185, 129, 0.8)' : '0 0 8px rgba(245, 158, 11, 0.8)',
              }}
            />
            <span className="call-header__elapsed">
              {partnerConnected ? fmt(elapsed) : t('call.waiting')}
            </span>
          </div>
        </div>
      )}

      {/* ── Middle: Speaking section with Part 1, Part 2, Part 3, Saved cards (o'rtada kartalar) ── */}
      {!camOn && (
        <div className="call-body">
          {!partnerConnected && (
            <div className="call-waiting-note">
              <span className="call-waiting-spinner" />
              <span>{t('call.waiting')}</span>
            </div>
          )}
          <SpeakingQuestions onDetailChange={setSpeakingDetail} />
        </div>
      )}

      <CallControls
        micOn={micOn}
        camOn={camOn}
        speaking={youSpeaking && micOn}
        onToggleMic={() => setMicOn((v) => !v)}
        onToggleCam={() => setCamOn(v => !v)}
        onEnd={() => setShowEnd(true)}
        onOpenChat={() => setShowChat(true)}
        unread={unread}
        hidden={!camOn && speakingDetail}
      />

      {showChat && (
        <ChatOverlay
          messages={messages}
          isPartnerTyping={isPartnerTyping}
          sessionId={session?.id}
          onClose={() => setShowChat(false)}
          sendMessage={sendMessage}
          sendTyping={sendTyping}
        />
      )}

      {showEnd && (
        <EndSessionSheet
          onConfirm={handleEnd}
          onCancel={() => setShowEnd(false)}
          isEnding={ending}
        />
      )}

      <style>{`
        .call-screen {
          position: relative;
          width: 100%; height: 100%;
          background: var(--bg);
          color: var(--text-primary);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .call-bg-glow {
          position: absolute; inset: 0; z-index: 0;
          background:
            radial-gradient(ellipse 80% 50% at 50% -10%, rgba(0,168,255,0.08) 0%, transparent 65%),
            radial-gradient(ellipse 60% 40% at 80% 110%, rgba(139,92,246,0.06) 0%, transparent 60%);
          pointer-events: none;
        }

        .call-header {
          position: relative; z-index: 10;
          display: flex; align-items: center; justify-content: space-between;
          padding: calc(var(--space-3) + env(safe-area-inset-top, 0px)) var(--space-4) var(--space-2);
          animation: fadeIn 0.2s ease both;
          flex-shrink: 0;
          background: transparent;
        }
        .call-header__left {
          display: flex; align-items: center; gap: 12px;
        }
        .call-presence {
          position: relative;
          flex-shrink: 0;
          border-radius: 50%;
        }
        .call-presence::after {
          content: '';
          position: absolute; inset: -3px;
          border-radius: 50%;
          border: 2px solid transparent;
          transition: border-color 0.18s ease;
          pointer-events: none;
        }
        .call-presence--speaking::after {
          border-color: #10B981;
          animation: speakPulse 1.3s ease-out infinite;
        }
        @keyframes speakPulse {
          0%   { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5); }
          100% { box-shadow: 0 0 0 9px rgba(16, 185, 129, 0); }
        }

        .call-header__info {
          display: flex; flex-direction: column; gap: 3px;
        }
        .call-header__name {
          font-size: 16px; font-weight: 700;
          color: #FFFFFF;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          line-height: 1.2;
          letter-spacing: -0.2px;
        }
        .light .call-header__name {
          color: #0F172A;
        }

        .call-header__level-pill {
          display: inline-flex; align-items: center; gap: 5px;
          background: rgba(139, 92, 246, 0.18);
          border: 1px solid rgba(139, 92, 246, 0.35);
          border-radius: 99px; padding: 2px 8px;
          font-size: 11px; font-weight: 600;
          color: #C084FC;
          letter-spacing: 0.1px;
          width: fit-content;
        }
        .light .call-header__level-pill {
          background: rgba(139, 92, 246, 0.1);
          border: 1px solid rgba(139, 92, 246, 0.25);
          color: #7C3AED;
        }
        .call-level-bars {
          color: currentColor;
          flex-shrink: 0;
        }
        .call-status--speaking-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: #10B981;
          margin-left: 2px;
          box-shadow: 0 0 4px #10B981;
          animation: dotPulse 1.5s infinite;
        }

        .call-header__timer-pill {
          display: flex; align-items: center; gap: 7px;
          background: rgba(18, 15, 34, 0.75);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 99px; padding: 6px 14px;
          font-size: 13px; font-weight: 700;
          color: #FFFFFF;
          font-variant-numeric: tabular-nums;
          white-space: nowrap;
          flex-shrink: 0;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }
        .light .call-header__timer-pill {
          background: rgba(255, 255, 255, 0.85);
          border: 1px solid rgba(0, 0, 0, 0.08);
          color: #0F172A;
          box-shadow: 0 4px 12px rgba(0,0,0,0.06);
        }
        .call-timer-dot {
          width: 7px; height: 7px; border-radius: 50%;
          flex-shrink: 0;
          animation: dotPulse 2s ease-in-out infinite;
        }
        .call-header__elapsed { letter-spacing: 0.3px; }

        .call-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          min-height: 0;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          position: relative; z-index: 5;
          padding-top: var(--space-3);
          padding-bottom: calc(140px + env(safe-area-inset-bottom, 0px));
        }
        .call-body > * { width: 100%; }

        .call-waiting-note {
          display: flex; align-items: center; justify-content: center; gap: var(--space-2);
          margin: var(--space-0-5) var(--space-4) var(--space-1-5);
          padding: var(--space-2) var(--space-3);
          background: rgba(255,149,0,0.12);
          border: 1px solid rgba(255,149,0,0.22);
          border-radius: 12px;
          font-size: var(--text-sm); font-weight: var(--weight-semi);
          color: #ffb454;
        }
        .call-waiting-spinner {
          width: 13px; height: 13px; border-radius: 50%;
          border: 2px solid rgba(255,180,84,0.35);
          border-top-color: #ffb454;
          animation: spin 0.8s linear infinite;
        }

        .call-cam-timer {
          position: absolute; top: calc(14px + env(safe-area-inset-top, 0px)); left: 50%; transform: translateX(-50%);
          display: flex; align-items: center; gap: var(--space-1-5);
          background: rgba(0,0,0,0.45);
          backdrop-filter: blur(10px);
          border-radius: 99px; padding: var(--space-1) var(--space-4);
          font-size: var(--text-sm); font-weight: var(--weight-bold);
          color: rgba(255,255,255,0.9);
          font-variant-numeric: tabular-nums;
          z-index: 15; pointer-events: none;
        }

        .call-error-banner {
          position: absolute; top: 12px; left: 12px; right: 12px;
          display: flex; align-items: center; justify-content: space-between;
          background: rgba(220,38,38,0.9);
          backdrop-filter: blur(8px);
          border-radius: 12px; padding: var(--space-3) var(--space-4);
          font-size: var(--text-sm); font-weight: var(--weight-semi); color: #fff;
          z-index: 30; gap: var(--space-3);
          box-shadow: 0 4px 20px rgba(220,38,38,0.4);
        }
        .call-error-banner button {
          font-size: var(--text-md); color: rgba(255,255,255,0.7);
          flex-shrink: 0;
        }

        .video-grid {
          position: absolute; inset: 0;
          background: #000; z-index: 1;
        }
        .video-main {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
          background: #111;
        }
        .video-main video { width: 100%; height: 100%; object-fit: cover; }
        .video-scrim {
          position: absolute; left: 0; right: 0; bottom: 0; height: 140px;
          background: linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 100%);
          z-index: 1; pointer-events: none;
        }
        .video-main--speaking::after {
          content: '';
          position: absolute; inset: 0;
          border: 3px solid var(--success);
          box-shadow: inset 0 0 24px rgba(52,199,89,0.35);
          z-index: 3; pointer-events: none;
          animation: videoSpeak 1.4s ease-in-out infinite;
        }
        @keyframes videoSpeak {
          0%, 100% { opacity: 0.65; }
          50% { opacity: 1; }
        }
        .video-pip {
          position: absolute; bottom: 130px; right: 14px;
          width: 112px; height: 162px;
          border-radius: 18px; overflow: hidden;
          background: #1a1a2e;
          border: 2px solid rgba(255,255,255,0.18);
          box-shadow: 0 6px 28px rgba(0,0,0,0.55);
          cursor: pointer; z-index: 15;
          display: flex; align-items: center; justify-content: center;
          transition: transform 0.15s, border-color 0.18s, box-shadow 0.18s;
        }
        .video-pip:active { transform: scale(0.95); }
        .video-pip--speaking {
          border-color: var(--success);
          box-shadow: 0 6px 28px rgba(0,0,0,0.55), 0 0 0 2px rgba(52,199,89,0.45);
        }
        .video-pip video { width: 100%; height: 100%; object-fit: cover; }
        .video-pip__swap {
          position: absolute; top: 7px; right: 7px;
          width: 24px; height: 24px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(0,0,0,0.5); color: #fff;
          border-radius: 50%; backdrop-filter: blur(6px);
          border: 1px solid rgba(255,255,255,0.18);
          pointer-events: none;
        }
        .video-avatar {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
          background: radial-gradient(circle at 50% 38%, #2a2a45 0%, #14141f 75%);
        }
        .video-avatar span { font-size: 52px; font-weight: var(--weight-bold); color: rgba(255,255,255,0.6); }
        .video-avatar--pip span { font-size: 28px; }
        .video-label {
          position: absolute; bottom: 10px; left: 12px;
          display: inline-flex; align-items: center; gap: var(--space-1-5);
          font-size: var(--text-sm); font-weight: var(--weight-semi);
          color: #fff; background: rgba(0,0,0,0.4);
          padding: var(--space-1) var(--space-3); border-radius: 20px;
          backdrop-filter: blur(6px); z-index: 4; pointer-events: none;
        }
        .video-label__dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: var(--success); flex-shrink: 0;
          box-shadow: 0 0 6px var(--success);
        }
        .video-label--pip {
          font-size: var(--text-xs); bottom: 6px; left: 6px;
          padding: var(--space-0-5) var(--space-1-5);
        }

        .timeout-screen {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: var(--space-5); padding: var(--space-7) var(--space-5);
          flex: 1; height: 100%; background: var(--bg); text-align: center;
        }
        .timeout-info { display: flex; flex-direction: column; gap: var(--space-2); }
        .timeout-info h2 { font-size: var(--text-lg); font-weight: var(--weight-heavy); color: var(--text-primary); }
        .timeout-info p { font-size: var(--text-base); color: var(--text-secondary); line-height: 1.6; }
        .timeout-actions {
          display: flex; flex-direction: column; gap: var(--space-2); width: 100%; max-width: 260px;
        }

        @keyframes dotPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.15); }
        }

      

      `}</style>
    </div>
  );
}
