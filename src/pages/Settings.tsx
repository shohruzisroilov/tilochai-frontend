import React, { useState } from 'react';
import { useTelegramBackButton } from '../hooks/useTelegramBackButton';
import { useMutation } from '@tanstack/react-query';
import { updateMe, updateNotifications } from '../api/endpoints';
import useAppStore from '../store/useAppStore';
import { useT } from '../i18n';
import { selectionHaptic, tapHaptic } from '../utils/haptics';
import { ArrowLeft, ChevronRight, Gauge, User, Bell, Check, Loader2, Mic, Globe } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { notifyHaptic } from '../utils/haptics';

const LEVELS = [{ value: 1 }, { value: 2 }, { value: 3 }, { value: 4 }, { value: 5 }, { value: 6 }];

const GENDERS = [
  { v: 'male', key: 'gender.male' },
  { v: 'female', key: 'gender.female' },
  { v: 'skip', key: 'gender.notSay' },
];

const TARGET_LANGS = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'ru', name: 'Russian (Русский)', flag: '🇷🇺' },
  { code: 'uz', name: "Uzbek (O'zbekcha)", flag: '🇺🇿' },
];

const NATIVE_LANGS = [
  { code: 'uz', name: "Uzbek (O'zbekcha)", flag: '🇺🇿' },
  { code: 'ru', name: 'Russian (Русский)', flag: '🇷🇺' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
];

const TITLES: Record<string, string> = {
  menu: 'settings.title',
  language: 'Languages & Practice',
  level: 'settings.levelTitle',
  gender: 'settings.genderTitle',
  notifications: 'settings.notifTitle',
  mic: 'Audio & Microphone',
};

export default function Settings() {
  const { user, setUser, navigate, screenParams, setMicErrorModal } = useAppStore();
  const t = useT();

  useTelegramBackButton(() => back());

  const initialSection = (screenParams?.section as any) || 'menu';
  const [section, setSection] = useState<'menu' | 'level' | 'gender' | 'notifications' | 'mic' | 'language'>(initialSection);
  const [micStatus, setMicStatus] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle');
  const [micVolume, setMicVolume] = useState(0);

  const level = user?.level || 1;
  const gender = user?.gender || null;
  const learningLang = user?.learningLang || user?.learning_lang || 'en';
  const nativeLang = user?.nativeLang || user?.native_lang || 'uz';
  const reminders = user?.remindersEnabled !== false;

  // Mutation for updating profile details
  const updateProfileMutation = useMutation({
    mutationFn: (patch: Record<string, any>) => updateMe(patch),
    onSuccess: (data) => {
      if (data?.user) setUser(data.user);
    },
  });

  // Mutation for updating notifications
  const updateNotifMutation = useMutation({
    mutationFn: (prefs: Record<string, any>) => updateNotifications(prefs),
    onSuccess: (data) => {
      if (data?.user) setUser(data.user);
    },
  });

  function pickLearningLang(code: string) {
    if (!user || (user.learningLang === code || user.learning_lang === code)) return;
    selectionHaptic();
    setUser({ ...user, learningLang: code, learning_lang: code });
    updateProfileMutation.mutate({ learningLang: code });
  }

  function pickNativeLang(code: string) {
    if (!user || (user.nativeLang === code || user.native_lang === code)) return;
    selectionHaptic();
    setUser({ ...user, nativeLang: code, native_lang: code });
    updateProfileMutation.mutate({ nativeLang: code });
  }

  function pickLevel(v: number) {
    if (!user || v === level) return;
    selectionHaptic();
    setUser({ ...user, level: v }); // optimistic update
    updateProfileMutation.mutate({ level: v });
  }

  function pickGender(v: string) {
    const next = v === 'skip' ? null : v;
    if (!user || next === gender) return;
    selectionHaptic();
    setUser({ ...user, gender: next }); // optimistic update
    updateProfileMutation.mutate({ gender: next ?? '' });
  }

  function toggleNotif(field: string, value: boolean) {
    if (updateNotifMutation.isPending) return;
    selectionHaptic();
    updateNotifMutation.mutate({ [field]: value });
  }

  function back() {
    tapHaptic('light');
    // If opened directly into a sub-section from another screen (e.g. from home to level)
    if (screenParams?.section && section === screenParams.section) {
      navigate(screenParams?.from || 'profile');
    } else if (section !== 'menu') {
      setSection('menu');
    } else {
      navigate(screenParams?.from || 'profile');
    }
  }

  async function testMic() {
    if (micStatus === 'testing') return;
    tapHaptic('light');
    setMicStatus('testing');
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Unsupported');
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      notifyHaptic('success');
      setMicStatus('ok');
      setTimeout(() => setMicStatus('idle'), 3500);
    } catch {
      notifyHaptic('error');
      setMicStatus('fail');
      setMicErrorModal({
        isOpen: true,
        errorMsg: 'Microphone access is needed for live calls. Please grant permission in your device/Telegram settings.',
      });
      setTimeout(() => setMicStatus('idle'), 3500);
    }
  }

  const notifSummary = reminders ? t('settings.notifAllOn') : t('settings.notifNone');

  return (
    <div className="flex flex-col h-full bg-[var(--bg)] text-[var(--text-primary)]">
      {/* Topbar */}
      <div className="flex items-center justify-between p-4 pt-3 border-b border-[var(--border)] shrink-0 bg-[var(--chrome-bg)] backdrop-blur-md z-10">
        <Button variant="ghost" size="icon" className="rounded-full text-[var(--text-primary)] active:bg-[var(--surface-2)]" onClick={back}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-base font-bold text-[var(--text-primary)]">{t(TITLES[section])}</h1>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-[calc(40px+env(safe-area-inset-bottom,0px))]">
        {/* Main Menu */}
        {section === 'menu' && (
          <div className="space-y-3">
            <Card
              as="button"
              type="button"
              className="w-full text-left p-4 cursor-pointer hover:bg-[var(--surface-2)] transition-all active:scale-[0.99] border-[var(--border)] bg-[var(--surface)] shadow-md rounded-2xl"
              onClick={() => { selectionHaptic(); setSection('language'); }}
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[rgba(124,58,237,0.22)] text-[#A78BFA] flex items-center justify-center shrink-0">
                  <Globe className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-[var(--text-primary)]">Languages &amp; Target</div>
                  <div className="text-xs text-[var(--text-secondary)] truncate">
                    Learning: {learningLang === 'ru' ? 'Russian 🇷🇺' : learningLang === 'uz' ? 'Uzbek 🇺🇿' : 'English 🇬🇧'}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-[#64748B]" />
              </div>
            </Card>

            <Card
              as="button"
              type="button"
              className="w-full text-left p-4 cursor-pointer hover:bg-[var(--surface-2)] transition-all active:scale-[0.99] border-[var(--border)] bg-[var(--surface)] shadow-md rounded-2xl"
              onClick={() => { selectionHaptic(); setSection('level'); }}
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[rgba(124,58,237,0.22)] text-[#A78BFA] flex items-center justify-center shrink-0">
                  <Gauge className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-[var(--text-primary)]">{t('settings.levelTitle')}</div>
                  <div className="text-xs text-[var(--text-secondary)] truncate">
                    {t(`level.${level}`)} · {t(`levelName.${level}`)}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-[#64748B]" />
              </div>
            </Card>

            <Card
              as="button"
              type="button"
              className="w-full text-left p-4 cursor-pointer hover:bg-[var(--surface-2)] transition-all active:scale-[0.99] border-[var(--border)] bg-[var(--surface)] shadow-md rounded-2xl"
              onClick={() => { selectionHaptic(); setSection('gender'); }}
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[rgba(6,182,212,0.22)] text-[#38BDF8] flex items-center justify-center shrink-0">
                  <User className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-[var(--text-primary)]">{t('settings.genderTitle')}</div>
                  <div className="text-xs text-[var(--text-secondary)] truncate">
                    {gender ? t(`gender.${gender}`) : t('settings.genderNotSet')}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-[#64748B]" />
              </div>
            </Card>

            <Card
              as="button"
              type="button"
              className="w-full text-left p-4 cursor-pointer hover:bg-[var(--surface-2)] transition-all active:scale-[0.99] border-[var(--border)] bg-[var(--surface)] shadow-md rounded-2xl"
              onClick={() => { selectionHaptic(); setSection('notifications'); }}
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[rgba(16,185,129,0.22)] text-[#34D399] flex items-center justify-center shrink-0">
                  <Bell className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-[var(--text-primary)]">{t('settings.notifTitle')}</div>
                  <div className="text-xs text-[var(--text-secondary)] truncate">{notifSummary}</div>
                </div>
                <ChevronRight className="h-4 w-4 text-[#64748B]" />
              </div>
            </Card>

            <Card
              as="button"
              type="button"
              className="w-full text-left p-4 cursor-pointer hover:bg-[var(--surface-2)] transition-all active:scale-[0.99] border-[var(--border)] bg-[var(--surface)] shadow-md rounded-2xl"
              onClick={() => {
                tapHaptic('light');
                setSection('mic');
              }}
            >
              <div className="flex items-center gap-3.5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  micStatus === 'ok'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : micStatus === 'fail'
                    ? 'bg-rose-500/20 text-rose-400'
                    : 'bg-[rgba(124,58,237,0.22)] text-[#A78BFA]'
                }`}>
                  {micStatus === 'testing' ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : micStatus === 'ok' ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <Mic className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-[var(--text-primary)]">
                    {micStatus === 'ok'
                      ? 'Microphone Ready!'
                      : micStatus === 'testing'
                      ? 'Testing Microphone…'
                      : micStatus === 'fail'
                      ? 'Permission Needed'
                      : 'Audio & Microphone'}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] truncate">
                    {micStatus === 'ok'
                      ? 'Access granted and working'
                      : micStatus === 'fail'
                      ? 'Tap to review permission guide'
                      : 'Tap to test and verify microphone access'}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-[#64748B]" />
              </div>
            </Card>
          </div>
        )}

        {/* Language Section */}
        {section === 'language' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)] mb-1 px-1">Language You Want to Practice</h2>
              <p className="text-xs text-[var(--text-secondary)] px-1 mb-3">Choose the language you are learning to find compatible speaking partners.</p>
              <div className="space-y-2">
                {TARGET_LANGS.map((lang) => {
                  const selected = learningLang === lang.code;
                  return (
                    <Card
                      as="button"
                      type="button"
                      key={lang.code}
                      onClick={() => pickLearningLang(lang.code)}
                      className={`w-full text-left p-3.5 cursor-pointer transition-all active:scale-[0.98] border rounded-2xl flex items-center justify-between ${
                        selected
                          ? 'border-[var(--primary)] bg-[var(--primary-subtle)] shadow-md ring-1 ring-[var(--primary)]'
                          : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{lang.flag}</span>
                        <span className="text-sm font-bold text-[var(--text-primary)]">{lang.name}</span>
                      </div>
                      <div
                        className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                          selected
                            ? 'bg-[#7C3AED] border-[#7C3AED] text-[#FFFFFF]'
                            : 'border-[var(--border-strong)]'
                        }`}
                      >
                        {selected && <Check className="h-3 w-3" strokeWidth={3} />}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 border-t border-[var(--border)]">
              <h2 className="text-sm font-bold text-[var(--text-primary)] mb-1 px-1">Your Native Language</h2>
              <p className="text-xs text-[var(--text-secondary)] px-1 mb-3">Helps language exchange partners who want to learn your native tongue.</p>
              <div className="space-y-2">
                {NATIVE_LANGS.map((lang) => {
                  const selected = nativeLang === lang.code;
                  return (
                    <Card
                      as="button"
                      type="button"
                      key={lang.code}
                      onClick={() => pickNativeLang(lang.code)}
                      className={`w-full text-left p-3.5 cursor-pointer transition-all active:scale-[0.98] border rounded-2xl flex items-center justify-between ${
                        selected
                          ? 'border-[var(--primary)] bg-[var(--primary-subtle)] shadow-md ring-1 ring-[var(--primary)]'
                          : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{lang.flag}</span>
                        <span className="text-sm font-bold text-[var(--text-primary)]">{lang.name}</span>
                      </div>
                      <div
                        className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                          selected
                            ? 'bg-[#7C3AED] border-[#7C3AED] text-[#FFFFFF]'
                            : 'border-[var(--border-strong)]'
                        }`}
                      >
                        {selected && <Check className="h-3 w-3" strokeWidth={3} />}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Level Section */}
        {section === 'level' && (
          <div className="space-y-3">
            <p className="text-xs text-[var(--text-secondary)] px-1">{t('settings.levelSub')}</p>
            <div className="space-y-2.5" role="radiogroup" aria-label={t('settings.levelTitle')}>
              {LEVELS.map((lv) => {
                const selected = level === lv.value;
                return (
                  <Card
                    as="button"
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    key={lv.value}
                    onClick={() => pickLevel(lv.value)}
                    className={`w-full text-left p-4 cursor-pointer transition-all active:scale-[0.98] border rounded-2xl ${
                      selected
                        ? 'border-[var(--primary)] bg-[var(--primary-subtle)] shadow-md ring-1 ring-[var(--primary)]'
                        : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)]'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <span className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-[var(--primary)] bg-[var(--surface-2)] border border-[var(--border)] font-mono shrink-0">
                        {t(`level.${lv.value}`)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-[var(--text-primary)]">{t(`levelName.${lv.value}`)}</div>
                        <div className="text-xs text-[var(--text-secondary)] truncate">{t(`ob.level${lv.value}.sub`)}</div>
                      </div>
                      <div
                        className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                          selected
                            ? 'bg-[#7C3AED] border-[#7C3AED] text-[#FFFFFF]'
                            : 'border-[var(--border-strong)]'
                        }`}
                      >
                        {selected && <Check className="h-3 w-3" strokeWidth={3} />}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Gender Section */}
        {section === 'gender' && (
          <div className="space-y-3">
            <p className="text-xs text-[var(--text-secondary)] px-1">{t('settings.genderSub')}</p>
            <div className="space-y-2.5" role="radiogroup" aria-label={t('settings.genderTitle')}>
              {GENDERS.map((g) => {
                const selected = (g.v === 'skip' ? null : g.v) === gender;
                return (
                  <Card
                    as="button"
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    key={g.v}
                    onClick={() => pickGender(g.v)}
                    className={`w-full text-left p-4 cursor-pointer transition-all active:scale-[0.98] border rounded-2xl ${
                      selected
                        ? 'border-[var(--primary)] bg-[var(--primary-subtle)] shadow-md ring-1 ring-[var(--primary)]'
                        : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)]'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-[var(--text-primary)]">{t(g.key)}</div>
                      </div>
                      <div
                        className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                          selected
                            ? 'bg-[#7C3AED] border-[#7C3AED] text-[#FFFFFF]'
                            : 'border-[var(--border-strong)]'
                        }`}
                      >
                        {selected && <Check className="h-3 w-3" strokeWidth={3} />}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Notifications Section */}
        {section === 'notifications' && (
          <div className="space-y-3">
            <p className="text-xs text-[var(--text-secondary)] px-1">{t('settings.notifSub')}</p>
            <Card className="p-4 border-[var(--border)] bg-[var(--surface)] rounded-2xl shadow-md">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-sm font-bold text-[var(--text-primary)]">{t('settings.notifReminders')}</div>
                  <div className="text-xs text-[var(--text-secondary)]">{t('settings.notifRemindersSub')}</div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={reminders}
                  onClick={() => toggleNotif('remindersEnabled', !reminders)}
                  disabled={updateNotifMutation.isPending}
                  className={`w-12 h-7 rounded-full transition-colors relative p-0.5 ${
                    reminders ? 'bg-[#7C3AED]' : 'bg-[var(--surface-3)]'
                  }`}
                >
                  <span
                    className={`block w-6 h-6 rounded-full bg-white transition-transform shadow-md ${
                      reminders ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </Card>
          </div>
        )}

        {/* Microphone Test Section */}
        {section === 'mic' && (
          <div className="space-y-4">
            <p className="text-xs text-[var(--text-secondary)] px-1">
              Verify your microphone permissions and audio clarity before starting calls.
            </p>

            <Card className="p-6 border-[var(--border)] bg-[var(--surface)] rounded-2xl shadow-lg text-center flex flex-col items-center gap-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
                micStatus === 'ok'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : micStatus === 'fail'
                  ? 'bg-rose-500/20 text-rose-400'
                  : 'bg-[rgba(124,58,237,0.22)] text-[#A78BFA]'
              }`}>
                {micStatus === 'testing' ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : micStatus === 'ok' ? (
                  <Check className="w-8 h-8" />
                ) : (
                  <Mic className="w-8 h-8" />
                )}
              </div>

              <div>
                <h3 className="font-bold text-base text-[var(--text-primary)]">
                  {micStatus === 'ok'
                    ? 'Microphone Working Great!'
                    : micStatus === 'testing'
                    ? 'Listening… Speak into your phone'
                    : micStatus === 'fail'
                    ? 'Microphone Permission Denied'
                    : 'Test Your Microphone'}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-[260px]">
                  {micStatus === 'ok'
                    ? 'Your microphone is detected and ready for voice calls.'
                    : micStatus === 'fail'
                    ? 'Please grant microphone access in Telegram / device settings.'
                    : 'Tap the button below to test your audio input.'}
                </p>
              </div>

              <Button
                type="button"
                className="w-full font-bold mt-2 bg-gradient-to-r from-[#7C3AED] to-[#00B2FE] text-white hover:opacity-95"
                onClick={testMic}
                disabled={micStatus === 'testing'}
              >
                {micStatus === 'testing' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testing…
                  </>
                ) : micStatus === 'ok' ? (
                  'Test Again'
                ) : (
                  'Start Mic Test'
                )}
              </Button>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
