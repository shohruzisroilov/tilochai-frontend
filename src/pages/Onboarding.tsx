import React, { useState } from 'react';
import { Check, Loader2, Sparkles } from 'lucide-react';
import { updateMe } from '../api/endpoints';
import useAppStore from '../store/useAppStore';
import { useT } from '../i18n';
import { tapHaptic, selectionHaptic } from '../utils/haptics';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';

const LEVELS = [1, 2, 3, 4, 5, 6];

export default function Onboarding() {
  const { setUser, navigate } = useAppStore();
  const t = useT();

  const [level, setLevel] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function pickLevel(n: number) {
    selectionHaptic();
    setLevel(n);
  }

  async function handleFinish(chosenLevel = level) {
    tapHaptic('medium');
    setLoading(true);
    setError('');
    try {
      const result = await updateMe({ level: chosenLevel });
      setUser(result.user);
      navigate('home');
    } catch (e: any) {
      setError(e.response?.data?.error || t('ob.error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full bg-[var(--bg)] text-[var(--text-primary)] overflow-hidden">
      {/* Top Bar with brand and Skip */}
      <div className="p-4 pt-10 border-b border-[var(--border)] shrink-0 flex items-center justify-between bg-[var(--chrome-bg)] backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#00B2FE] text-white flex items-center justify-center font-black text-xs shadow-md shadow-purple-900/30">
            <Sparkles size={16} />
          </div>
          <span className="font-extrabold text-sm tracking-tight text-[var(--text-primary)]">Tiloch AI</span>
        </div>

        <button
          type="button"
          onClick={() => handleFinish(3)}
          disabled={loading}
          className="text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-2.5 py-1 rounded-lg hover:bg-[var(--surface-2)] transition-colors active:scale-95"
        >
          {t('common.skip')}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <div className="space-y-1.5 animate-in fade-in duration-200">
          <h1 id="ob-level-heading" className="text-2xl font-black tracking-tight leading-tight text-[var(--text-primary)]">
            {t('ob.chooseLevel')}
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">
            {t('ob.welcome.sub')}
          </p>
        </div>

        <div className="space-y-2.5" role="radiogroup" aria-labelledby="ob-level-heading">
          {LEVELS.map((n) => {
            const active = level === n;
            return (
              <Card
                key={n}
                as="button"
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => pickLevel(n)}
                className={`w-full text-left p-4 cursor-pointer transition-all active:scale-[0.99] border rounded-2xl ${
                  active
                    ? 'border-[rgba(139,92,246,0.6)] bg-[rgba(124,58,237,0.20)] shadow-md ring-1 ring-[#7C3AED]'
                    : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)]'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <span className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-[var(--primary)] bg-[var(--surface-2)] border border-[var(--border)] font-mono shrink-0">
                    {t(`level.${n}`)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold truncate text-[var(--text-primary)]">{t(`levelName.${n}`)}</div>
                    <div className="text-xs text-[var(--text-secondary)] truncate">{t(`ob.level${n}.sub`)}</div>
                  </div>
                  <div
                    className={`h-5 w-5 rounded-full border flex items-center justify-center transition-colors ${
                      active
                        ? 'bg-[#7C3AED] border-[#7C3AED] text-[#FFFFFF]'
                        : 'border-[var(--border)]'
                    }`}
                  >
                    {active && <Check className="h-3 w-3" strokeWidth={3} />}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 text-center font-medium">
            {error}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="p-4 pb-8 border-t border-[var(--border)] shrink-0 bg-[var(--chrome-bg)] backdrop-blur-md">
        <Button
          onClick={() => handleFinish(level)}
          disabled={loading}
          className="w-full h-12 font-bold text-sm bg-gradient-to-r from-[#7C3AED] to-[#00B2FE] text-white rounded-xl shadow-lg shadow-purple-900/30"
          size="lg"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          {loading ? t('ob.saving') : t('ob.start')}
        </Button>
      </div>
    </div>
  );
}
