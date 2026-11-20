import { useEffect, useRef } from 'react';
import useAppStore from '../store/useAppStore';
import { tapHaptic } from '../utils/haptics';
import { ArrowLeft, CheckCircle2, Mic, Users, HeartHandshake } from 'lucide-react';

export default function Premium() {
  const { navigate, screenParams } = useAppStore();

  const back = () => navigate(screenParams?.from || 'home');

  const backRef = useRef(back);
  backRef.current = back;

  useEffect(() => {
    const backBtn = window.Telegram?.WebApp?.BackButton;
    let handleBack: (() => void) | undefined;
    if (backBtn) {
      handleBack = () => backRef.current?.();
      backBtn.onClick(handleBack);
      backBtn.show();
    }
    return () => {
      if (backBtn) {
        if (handleBack) backBtn.offClick(handleBack);
        backBtn.hide();
      }
    };
  }, []);

  return (
    <div className="free-page">
      <div className="free-topbar">
        <button className="free-back" onClick={back} aria-label="Go Back">
          <ArrowLeft size={20} />
        </button>
        <h1 className="free-topbar-title">Tiloch AI</h1>
        <div style={{ width: 36 }} />
      </div>

      <div className="free-scroll">
        <div className="free-hero">
          <div className="free-hero__badge">
            <HeartHandshake size={16} />
            <span>100% Free Platform</span>
          </div>
          <h2>Practice English for Free!</h2>
          <p>
            Talk in English and meet speaking partners completely free. No cards, no fees.
          </p>
        </div>

        <div className="free-features">
          <div className="free-feat-item">
            <span className="free-feat-ico">
              <Mic size={20} />
            </span>
            <div className="free-feat-text">
              <h3>Daily 15 Minutes Free</h3>
              <p>Practice speaking with real partners for 15 minutes every single day.</p>
            </div>
            <CheckCircle2 size={18} className="free-check" />
          </div>

          <div className="free-feat-item">
            <span className="free-feat-ico">
              <Users size={20} />
            </span>
            <div className="free-feat-text">
              <h3>+10 Mins per Friend</h3>
              <p>Invite friends and get +10 bonus minutes for every friend who joins.</p>
            </div>
            <CheckCircle2 size={18} className="free-check" />
          </div>

          <div className="free-feat-item">
            <span className="free-feat-ico">
              <HeartHandshake size={20} />
            </span>
            <div className="free-feat-text">
              <h3>Zero Payments</h3>
              <p>No cards or paid subscriptions needed. Just open, talk and invite friends.</p>
            </div>
            <CheckCircle2 size={18} className="free-check" />
          </div>
        </div>

        <button
          type="button"
          className="btn-primary free-cta-btn"
          onClick={() => {
            tapHaptic('medium');
            navigate('home');
          }}
        >
          <Mic size={18} />
          <span>Start Speaking</span>
        </button>
      </div>

      <style>{`
        .free-page {
          display: flex; flex-direction: column; height: 100%;
          background: var(--bg); color: var(--text-primary);
        }
        .free-topbar {
          display: flex; align-items: center; justify-content: space-between;
          padding: calc(12px + env(safe-area-inset-top, 0px)) 16px 12px;
          border-bottom: 1px solid var(--border);
          background: var(--chrome-bg);
          backdrop-filter: blur(20px);
          flex-shrink: 0;
          z-index: 10;
        }
        .free-back {
          width: 38px; height: 38px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          color: var(--text-primary); background: var(--surface); border: 1px solid var(--border);
          cursor: pointer; transition: transform 0.15s;
        }
        .free-back:active { transform: scale(0.94); }
        .free-topbar-title {
          font-size: 16px; font-weight: 800; color: var(--text-primary);
        }
        .free-scroll {
          flex: 1; overflow-y: auto; padding: 20px 16px calc(40px + env(safe-area-inset-bottom, 0px));
          display: flex; flex-direction: column; gap: 20px; max-width: 440px; margin: 0 auto; width: 100%;
        }
        .free-hero {
          text-align: center; display: flex; flex-direction: column; align-items: center; gap: 10px;
          padding: 28px 18px; border-radius: 24px;
          background: var(--surface);
          border: 1px solid var(--border);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
        }
        .free-hero__badge {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 5px 12px; border-radius: 9999px;
          background: rgba(16, 185, 129, 0.15); color: #10B981;
          border: 1px solid rgba(16, 185, 129, 0.3);
          font-size: 12px; font-weight: 700;
        }
        .free-hero h2 {
          font-size: 24px; font-weight: 800; letter-spacing: -0.4px; line-height: 1.25; color: var(--text-primary);
        }
        .free-hero p {
          font-size: 13px; color: var(--text-secondary); line-height: 1.5;
        }
        .free-features {
          display: flex; flex-direction: column; gap: 12px;
        }
        .free-feat-item {
          display: flex; align-items: center; gap: 14px;
          padding: 16px; border-radius: 20px;
          background: var(--surface); border: 1px solid var(--border);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
        }
        .free-feat-ico {
          width: 44px; height: 44px; border-radius: 12px;
          background: rgba(124, 58, 237, 0.15); color: var(--primary);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .free-feat-text { flex: 1; min-width: 0; }
        .free-feat-text h3 {
          font-size: 15px; font-weight: 700; margin: 0 0 2px 0; color: var(--text-primary);
        }
        .free-feat-text p {
          font-size: 12px; color: var(--text-secondary); margin: 0; line-height: 1.4;
        }
        .free-check { color: #10B981; flex-shrink: 0; }
        .free-cta-btn {
          width: 100%; height: 52px; font-size: 15px; font-weight: 700;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          border-radius: 16px;
          background: linear-gradient(135deg, #7C3AED, #00B2FE);
          color: #FFFFFF; margin-top: 8px; border: none; cursor: pointer;
          box-shadow: 0 4px 20px rgba(124, 58, 237, 0.4);
          transition: transform 0.15s, opacity 0.15s;
        }
        .free-cta-btn:active { transform: scale(0.98); opacity: 0.95; }
      `}</style>
    </div>
  );
}
