import { useEffect, useRef, useState } from 'react';
import useAppStore from '../store/useAppStore';
import { notifyHaptic, tapHaptic } from '../utils/haptics';
import {
  ArrowLeft,
  CheckCircle2,
  Crown,
  Copy,
  Check,
  Send,
  Users,
  Clock,
  Sparkles,
  Zap,
} from 'lucide-react';

const CARD_NUMBER = '9860190110799466';
const CARD_HOLDER = 'Shohruz Isroilov';
const AMOUNT_UZS = "26 000 so'm";
const ADMIN_USERNAME = 'Shohruz_Isroilov';

export default function Premium() {
  const { user, navigate, screenParams } = useAppStore();
  const [copied, setCopied] = useState(false);

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

  function handleCopyCard() {
    tapHaptic('light');
    try {
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(CARD_NUMBER).catch(() => {});
      }
    } catch {}
    notifyHaptic('success');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleSendReceipt() {
    tapHaptic('medium');
    const tgId = user?.telegramId ? String(user.telegramId) : '';
    const sysId = user?.id ? String(user.id) : '';
    const name = user?.displayName || 'User';
    const username = user?.username ? ` (@${user.username})` : '';

    const msg = encodeURIComponent(
      `Hello! I sent 26,000 so'm for Tiloch AI Premium.\n\n👤 Name: ${name}${username}\n🆔 Telegram ID: ${tgId || 'N/A'}\n🔑 ID (UUID): ${sysId}\n\nHere is my payment receipt:`
    );
    const url = `https://t.me/${ADMIN_USERNAME}?text=${msg}`;
    const wa = (window as any).Telegram?.WebApp;
    if (wa?.openTelegramLink) {
      wa.openTelegramLink(url);
    } else {
      window.open(url, '_blank');
    }
  }

  const isPremium = Boolean(user?.isPremium);

  return (
    <div className="prem-page">
      {/* Top Bar */}
      <div className="prem-topbar">
        <button className="prem-back" onClick={back} aria-label="Go Back">
          <ArrowLeft size={20} />
        </button>
        <h1 className="prem-topbar-title">Plans &amp; Premium</h1>
        <div style={{ width: 38 }} />
      </div>

      <div className="prem-scroll">
        {/* Header Hero */}
        <div className="prem-hero">
          <div className="prem-hero__glow" />
          <div className={`prem-hero__badge ${isPremium ? 'prem-hero__badge--active' : ''}`}>
            {isPremium ? (
              <Crown size={14} className="text-amber-400" />
            ) : (
              <Sparkles size={14} className="prem-sparkle" />
            )}
            <span>{isPremium ? 'Premium is Active!' : 'Choose Your Plan'}</span>
          </div>
          <h2 className="prem-hero__title">
            {isPremium ? 'Unlimited Speaking Unlocked' : 'Speak English Without Limits'}
          </h2>
          <p className="prem-hero__sub">
            {isPremium
              ? 'You have unlimited daily talk time and VIP priority matching. Enjoy your practice!'
              : 'Practice free for 15 minutes every day, or upgrade to talk as much as you want for 26,000 so\'m/month.'}
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="prem-cards-grid">
          {/* FREE PLAN */}
          <div className="prem-tier-card prem-tier-card--free">
            <div className="prem-tier-header">
              <div>
                <span className="prem-tier-tag">Free Plan</span>
                <h3 className="prem-tier-name">Standard Free</h3>
              </div>
              <div className="prem-tier-price">
                <span className="prem-tier-amount">0</span>
                <span className="prem-tier-period">soʻm</span>
              </div>
            </div>

            <ul className="prem-features-list">
              <li>
                <CheckCircle2 size={16} className="prem-feat-icon text-emerald-400" />
                <span><strong>15 free minutes</strong> every single day</span>
              </li>
              <li>
                <CheckCircle2 size={16} className="prem-feat-icon text-emerald-400" />
                <span>Talk with real partners anytime</span>
              </li>
              <li>
                <Users size={16} className="prem-feat-icon text-sky-400" />
                <span>Invite friends to get <strong>+15 bonus minutes</strong> each</span>
              </li>
            </ul>

            <button
              type="button"
              className="prem-tier-btn prem-tier-btn--free"
              onClick={() => {
                tapHaptic('light');
                navigate('invite', { from: 'premium' });
              }}
            >
              <Users size={16} />
              <span>Invite Friends (+15m)</span>
            </button>
          </div>

          {/* PREMIUM PLAN */}
          <div className="prem-tier-card prem-tier-card--premium">
            <div className="prem-premium-ribbon">
              <Crown size={12} />
              <span>Most Popular</span>
            </div>

            <div className="prem-tier-header">
              <div>
                <span className="prem-tier-tag prem-tier-tag--gold">VIP Plan</span>
                <h3 className="prem-tier-name text-amber-300 flex items-center gap-1.5">
                  <Crown size={18} className="text-amber-400" /> Premium VIP
                </h3>
              </div>
              <div className="prem-tier-price">
                <span className="prem-tier-amount text-amber-300">26 000</span>
                <span className="prem-tier-period">soʻm / month</span>
              </div>
            </div>

            <ul className="prem-features-list">
              <li>
                <Zap size={16} className="prem-feat-icon text-amber-400" />
                <span><strong>Unlimited speaking time</strong> (no daily limit)</span>
              </li>
              <li>
                <Zap size={16} className="prem-feat-icon text-amber-400" />
                <span><strong>Priority matching</strong> — connect faster</span>
              </li>
              <li>
                <Crown size={16} className="prem-feat-icon text-amber-400" />
                <span><strong>Golden Crown VIP</strong> badge on your profile</span>
              </li>
              <li>
                <CheckCircle2 size={16} className="prem-feat-icon text-amber-400" />
                <span>Clean, uninterrupted speaking practice</span>
              </li>
            </ul>

            {/* Bank Card Box */}
            <div className="prem-bank-card" onClick={handleCopyCard}>
              <div className="prem-bank-card__top">
                <span className="prem-bank-card__chip">Uzcard / Humo</span>
                <span className="prem-bank-card__badge">{AMOUNT_UZS}</span>
              </div>

              <div className="prem-bank-card__num-row">
                <span className="prem-bank-card__num">
                  {CARD_NUMBER.replace(/(\d{4})/g, '$1 ').trim()}
                </span>
              </div>

              <div className="prem-bank-card__bot">
                <div>
                  <span className="prem-bank-card__sublabel">Card Holder</span>
                  <p className="prem-bank-card__holder">{CARD_HOLDER}</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyCard();
                  }}
                  className={`prem-copy-btn ${copied ? 'copied' : ''}`}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied ? 'Copied!' : 'Copy Card'}</span>
                </button>
              </div>
            </div>

            {/* Instruction Steps */}
            <div className="prem-steps">
              <div className="prem-step">
                <span className="prem-step__num">1</span>
                <p>Transfer <strong>{AMOUNT_UZS}</strong> to the card above</p>
              </div>
              <div className="prem-step">
                <span className="prem-step__num">2</span>
                <p>Take a screenshot of your payment receipt</p>
              </div>
              <div className="prem-step">
                <span className="prem-step__num">3</span>
                <p>Send the receipt on Telegram to <strong>@{ADMIN_USERNAME}</strong></p>
              </div>
            </div>

            <button
              type="button"
              className="prem-cta-btn"
              onClick={handleSendReceipt}
            >
              <Send size={18} />
              <span>Send Receipt to Admin</span>
            </button>
            <p className="prem-note">
              Your Premium will be activated right after the admin verifies your receipt.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .prem-page {
          display: flex; flex-direction: column; height: 100%;
          background: var(--bg); color: var(--text-primary);
        }
        .prem-topbar {
          display: flex; align-items: center; justify-content: space-between;
          padding: calc(12px + env(safe-area-inset-top, 0px)) 16px 12px;
          border-bottom: 1px solid var(--border);
          background: var(--chrome-bg);
          backdrop-filter: blur(20px);
          flex-shrink: 0; z-index: 10;
        }
        .prem-back {
          width: 38px; height: 38px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          color: var(--text-primary); background: var(--surface);
          border: 1px solid var(--border); cursor: pointer;
        }
        .prem-back:active { transform: scale(0.94); }
        .prem-topbar-title {
          font-size: 16px; font-weight: 800; color: var(--text-primary);
        }
        .prem-scroll {
          flex: 1; overflow-y: auto;
          padding: 18px 16px calc(48px + env(safe-area-inset-bottom, 0px));
          display: flex; flex-direction: column; gap: 20px;
          max-width: 480px; margin: 0 auto; width: 100%;
        }

        .prem-hero {
          position: relative; overflow: hidden;
          text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: flex-start;
          padding: 24px 16px; border-radius: 24px;
          background: var(--surface); border: 1px solid var(--border);
          flex-shrink: 0; width: 100%; box-sizing: border-box;
          min-height: fit-content;
        }
        .prem-hero__glow {
          position: absolute; top: -40px; left: 50%; transform: translateX(-50%);
          width: 220px; height: 110px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(124, 58, 237, 0.35) 0%, transparent 70%);
          pointer-events: none;
        }
        .prem-hero__badge {
          display: inline-flex; align-items: center; justify-content: center; gap: 6px;
          padding: 6px 14px; border-radius: 9999px;
          background: rgba(124, 58, 237, 0.15); color: #A78BFA;
          border: 1px solid rgba(124, 58, 237, 0.35);
          font-size: 12px; font-weight: 700; line-height: 1.3;
          margin-bottom: 12px; flex-shrink: 0;
          box-sizing: border-box;
        }
        .prem-hero__badge--active {
          background: rgba(245, 158, 11, 0.15);
          border-color: rgba(245, 158, 11, 0.45);
          color: #FBBF24;
        }
        .prem-sparkle { color: #F59E0B; }
        .prem-hero__title {
          font-size: 21px; font-weight: 800; line-height: 1.3; margin: 0 0 8px;
          color: var(--text-primary);
        }
        .prem-hero__sub {
          font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin: 0;
          max-width: 320px;
        }

        .prem-cards-grid {
          display: flex; flex-direction: column; gap: 18px;
          width: 100%;
        }

        .prem-tier-card {
          position: relative; border-radius: 24px;
          padding: 20px; display: flex; flex-direction: column; gap: 16px;
          background: var(--surface); border: 1px solid var(--border);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
          flex-shrink: 0; width: 100%; box-sizing: border-box;
        }
        .prem-tier-card--premium {
          border: 2px solid rgba(245, 158, 11, 0.6);
          background: linear-gradient(180deg, rgba(245, 158, 11, 0.05) 0%, var(--surface) 35%);
          box-shadow: 0 12px 40px rgba(245, 158, 11, 0.15);
        }

        .prem-premium-ribbon {
          position: absolute; top: -11px; right: 20px;
          display: flex; align-items: center; gap: 5px;
          background: linear-gradient(135deg, #F59E0B, #D97706);
          color: #000; font-size: 11px; font-weight: 800;
          padding: 4px 12px; border-radius: 999px;
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
        }

        .prem-tier-header {
          display: flex; align-items: flex-start; justify-content: space-between;
        }
        .prem-tier-tag {
          font-size: 11px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.5px; color: var(--text-secondary);
        }
        .prem-tier-tag--gold {
          color: #F59E0B;
        }
        .prem-tier-name {
          font-size: 20px; font-weight: 800; margin: 2px 0 0; color: var(--text-primary);
        }
        .prem-tier-price {
          text-align: right; display: flex; flex-direction: column; align-items: flex-end;
        }
        .prem-tier-amount {
          font-size: 26px; font-weight: 900; line-height: 1; font-family: monospace;
          color: var(--text-primary);
        }
        .prem-tier-period {
          font-size: 11px; color: var(--text-secondary); font-weight: 600; margin-top: 2px;
        }

        .prem-features-list {
          list-style: none; padding: 0; margin: 0;
          display: flex; flex-direction: column; gap: 10px;
        }
        .prem-features-list li {
          display: flex; align-items: center; gap: 10px;
          font-size: 13px; color: var(--text-primary); line-height: 1.4;
        }
        .prem-feat-icon { flex-shrink: 0; }

        .prem-tier-btn {
          width: 100%; height: 46px; border-radius: 14px;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          font-size: 14px; font-weight: 700; border: none; cursor: pointer;
          transition: transform 0.15s, opacity 0.15s;
        }
        .prem-tier-btn:active { transform: scale(0.98); }
        .prem-tier-btn--free {
          background: var(--surface-2); color: var(--text-primary);
          border: 1px solid var(--border);
        }

        /* Bank card visual */
        .prem-bank-card {
          border-radius: 20px; padding: 18px 20px;
          background: linear-gradient(135deg, #181829 0%, #1c2638 50%, #1e1b4b 100%);
          border: 1px solid rgba(255, 255, 255, 0.16);
          color: #FFF; display: flex; flex-direction: column; gap: 14px;
          box-shadow: 0 10px 28px rgba(0, 0, 0, 0.4);
          cursor: pointer;
          transition: transform 0.15s ease;
        }
        .prem-bank-card:active {
          transform: scale(0.99);
        }
        .prem-bank-card__top {
          display: flex; align-items: center; justify-content: space-between;
        }
        .prem-bank-card__chip {
          font-size: 11px; font-weight: 800; letter-spacing: 0.5px;
          color: #38BDF8; text-transform: uppercase;
        }
        .prem-bank-card__badge {
          background: rgba(255, 255, 255, 0.14); padding: 3px 10px; border-radius: 8px;
          font-size: 11px; font-weight: 700; color: #FFF;
        }
        .prem-bank-card__num-row {
          width: 100%; display: flex; align-items: center;
          padding: 4px 0;
        }
        .prem-bank-card__num {
          font-family: monospace; font-size: clamp(16px, 5.2vw, 20px); font-weight: 900;
          letter-spacing: 2px; color: #FFF; white-space: nowrap !important;
          word-break: keep-all; flex-shrink: 0;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
        }
        .prem-bank-card__bot {
          display: flex; align-items: flex-end; justify-content: space-between; gap: 10px;
          padding-top: 10px; border-top: 1px solid rgba(255, 255, 255, 0.12);
          flex-wrap: wrap;
        }
        .prem-bank-card__sublabel {
          font-size: 10px; text-transform: uppercase; color: rgba(255, 255, 255, 0.5);
          letter-spacing: 0.5px; display: block;
        }
        .prem-bank-card__holder {
          font-size: 14px; font-weight: 700; color: #FFF; margin: 2px 0 0;
        }
        .prem-copy-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 6px;
          background: #7C3AED; color: #FFF; border: none; flex-shrink: 0;
          padding: 8px 14px; border-radius: 12px; font-size: 12px; font-weight: 700;
          cursor: pointer; transition: all 0.15s; white-space: nowrap;
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.35);
        }
        .prem-copy-btn.copied { background: #10B981; }
        .prem-copy-btn:active { transform: scale(0.94); }

        /* Instruction steps */
        .prem-steps {
          display: flex; flex-direction: column; gap: 8px;
          background: var(--surface-2); padding: 12px 14px; border-radius: 14px;
          border: 1px solid var(--border);
        }
        .prem-step {
          display: flex; align-items: center; gap: 10px;
        }
        .prem-step__num {
          width: 20px; height: 20px; border-radius: 50%;
          background: rgba(245, 158, 11, 0.2); color: #F59E0B;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 800; flex-shrink: 0;
        }
        .prem-step p {
          font-size: 12px; color: var(--text-secondary); margin: 0; line-height: 1.4;
        }
        .prem-step p strong { color: var(--text-primary); }

        .prem-cta-btn {
          width: 100%; height: 50px; border-radius: 16px;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          font-size: 15px; font-weight: 800; border: none; cursor: pointer;
          background: linear-gradient(135deg, #7C3AED, #00B2FE);
          color: #FFF; box-shadow: 0 6px 20px rgba(124, 58, 237, 0.4);
          transition: transform 0.15s, opacity 0.15s;
        }
        .prem-cta-btn:active { transform: scale(0.98); opacity: 0.95; }
        .prem-note {
          font-size: 11px; color: var(--text-secondary); text-align: center;
          margin: -6px 0 0; line-height: 1.4;
        }
      `}</style>
    </div>
  );
}
