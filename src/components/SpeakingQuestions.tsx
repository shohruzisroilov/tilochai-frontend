import React, { useState, useEffect, useRef } from 'react';
import useAppStore from '../store/useAppStore';
import { useSocket } from '../hooks/useSocket';
import { PART1, PART3, topicsForPart, findTopic } from '../constants/speakingTopics';
import { useT } from '../i18n';
import { selectionHaptic, tapHaptic } from '../utils/haptics';
import { playNewQuestionSound, playStarSound, playTimerDoneSound, playTapSound } from '../utils/audio';
import {
  Bell,
  Star,
  ChevronLeft,
  MessageSquare,
  Timer,
  Lightbulb,
  ArrowRight,
  RotateCcw,
  Clock,
} from 'lucide-react';
import { SavedQuestion } from '../types';

const PART_CARDS = [
  {
    part: 1,
    title: 'Part 1',
    desc: 'Intro & interview',
    Icon: MessageSquare,
    badge: '1',
    colorKey: 'part1',
  },
  {
    part: 2,
    title: 'Part 2',
    desc: 'Long turn (cue card)',
    Icon: Timer,
    badge: '2',
    colorKey: 'part2',
  },
  {
    part: 3,
    title: 'Part 3',
    desc: 'Discussion',
    Icon: Lightbulb,
    badge: '3',
    colorKey: 'part3',
  },
];

const PART_ACCENT: Record<number, string> = {
  1: '6 182 212',
  2: '168 85 247',
  3: '16 185 129',
};
const SAVED_ACCENT = '245 158 11';

interface SpeakingQuestionsProps {
  onDetailChange?: (inDetail: boolean) => void;
}

export default function SpeakingQuestions({ onDetailChange }: SpeakingQuestionsProps) {
  const {
    session,
    speakingTopicId,
    speakingPart,
    speakingQuestionIndex,
    setSpeakingState,
    savedQuestions,
    toggleSavedQuestion,
  } = useAppStore();
  const { changeSpeakingTopic } = useSocket();
  const t = useT();

  const [view, setView] = useState<'parts' | 'topics' | 'questions' | 'saved'>('parts');
  const [browsePart, setBrowsePart] = useState(speakingPart || 1);
  const [query, setQuery] = useState('');
  const [pendingPartnerChange, setPendingPartnerChange] = useState(false);

  // Today's featured question
  const [featured, setFeatured] = useState({
    part: 1,
    topicId: 'accommodation',
    topicTitle: 'Daily Life',
    question: 'What do you like most about your city?',
    hint: 'Try to speak for 1–2 minutes.',
    index: 0,
  });

  const viewRef = useRef(view);
  viewRef.current = view;
  const localActionRef = useRef(false);

  const [prepTimeLeft, setPrepTimeLeft] = useState(60);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    if (localActionRef.current) {
      localActionRef.current = false;
      return;
    }
    if (viewRef.current !== 'questions') {
      setPendingPartnerChange(true);
    }
  }, [speakingTopicId, speakingPart, speakingQuestionIndex]);

  const mountedRef = useRef(false);

  useEffect(() => {
    stopTimer();
    setPrepTimeLeft(60);
  }, [speakingTopicId, speakingPart]);

  useEffect(() => () => stopTimer(), []);

  useEffect(() => {
    onDetailChange?.(view !== 'parts');
  }, [view, onDetailChange]);

  useEffect(() => () => onDetailChange?.(false), [onDetailChange]);

  const startTimer = () => {
    if (timerRunning) return;
    setTimerRunning(true);
    timerRef.current = setInterval(() => {
      setPrepTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setTimerRunning(false);
          playTimerDoneSound();
          (window as any).Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setTimerRunning(false);
  };

  const resetTimer = () => {
    stopTimer();
    setPrepTimeLeft(60);
  };

  if (!session) return null;

  const topic = findTopic(speakingPart, speakingTopicId);

  const applySelection = (topicId: string, part: number, qIdx: number) => {
    localActionRef.current = true;
    setSpeakingState(topicId, part, qIdx);
    if (session?.id) {
      changeSpeakingTopic(session.id, topicId, part, qIdx);
    }
  };

  const viewPartnerChange = () => {
    tapHaptic('light');
    setPendingPartnerChange(false);
    setView('questions');
  };

  const openPart = (part: number) => {
    selectionHaptic();
    playTapSound();
    setBrowsePart(part);
    setQuery('');
    setView('topics');
  };

  const openTopic = (topicId: string) => {
    selectionHaptic();
    setPendingPartnerChange(false);
    applySelection(topicId, browsePart, 0);
    setView('questions');
  };

  const pickQuestion = (i: number) => {
    selectionHaptic();
    applySelection(speakingTopicId, speakingPart, i);
  };

  const isSaved = (part: number, topicId: string, index = 0) =>
    savedQuestions.some(
      (s) => s.part === part && s.topicId === topicId && (s.index ?? 0) === index
    );

  const toggleSave = (item: SavedQuestion) => {
    selectionHaptic();
    playStarSound(3);
    toggleSavedQuestion(item);
  };

  const openSaved = (s: SavedQuestion) => {
    selectionHaptic();
    setPendingPartnerChange(false);
    if (s.topicId) applySelection(s.topicId, s.part, s.index ?? 0);
    setView('questions');
  };

  const backToParts = () => {
    tapHaptic('light');
    setView('parts');
  };
  const backToTopics = () => {
    tapHaptic('light');
    setBrowsePart(speakingPart);
    setView('topics');
  };

  const pickNewQuestion = (e: React.MouseEvent) => {
    e.stopPropagation();
    tapHaptic('light');
    playNewQuestionSound();
    const pool = Math.random() > 0.4 ? PART1 : PART3;
    const randTopic = pool[Math.floor(Math.random() * pool.length)];
    const qList = randTopic.questions || [];
    const qIdx = Math.floor(Math.random() * Math.max(1, qList.length));
    setFeatured({
      part: pool === PART1 ? 1 : 3,
      topicId: randTopic.id,
      topicTitle: randTopic.title,
      question: qList[qIdx] || 'What do you like most about your city?',
      hint: 'Try to speak for 1–2 minutes.',
      index: qIdx,
    });
  };

  const isFeaturedSaved = isSaved(featured.part, featured.topicId, featured.index);

  const toggleFeaturedSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleSave({
      id: `${featured.part}:${featured.topicId}:${featured.index}`,
      part: featured.part,
      topicId: featured.topicId,
      index: featured.index,
      text: featured.question,
      question: featured.question,
      topicTitle: featured.topicTitle,
      savedAt: new Date().toISOString(),
    });
  };

  const handleSelectFeatured = () => {
    selectionHaptic();
    applySelection(featured.topicId, featured.part, featured.index);
  };

  const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const partnerBanner = pendingPartnerChange ? (
    <button className="sq-banner" onClick={viewPartnerChange}>
      <Bell size={13} /> {t('sq.partnerPicked')}
    </button>
  ) : null;

  if (view === 'parts') {
    return (
      <div className="sq sq--parts">
        {partnerBanner}

        {/* ── Featured "Today's Question" Card ── */}
        <div className="sq-featured">
          <div className="sq-featured__top">
            <div className="sq-featured__title-wrap">
              <span className="sq-featured__icon">
                <MessageSquare size={16} />
              </span>
              <span className="sq-featured__heading">Today's Question</span>
            </div>
            <button className="sq-featured__new-btn" onClick={pickNewQuestion}>
              <RotateCcw size={13} />
              <span>New Question</span>
            </button>
          </div>

          <div className="sq-featured__content" onClick={handleSelectFeatured} role="button" tabIndex={0}>
            <p className="sq-featured__question">{featured.question}</p>
            <div className="sq-featured__hint">
              <Clock size={13} />
              <span>{featured.hint}</span>
            </div>
          </div>

          <div className="sq-featured__footer">
            <span className="sq-featured__meta">
              Part {featured.part} • {featured.topicTitle}
            </span>
            <button
              className={`sq-featured__save-btn${isFeaturedSaved ? ' sq-featured__save-btn--active' : ''}`}
              onClick={toggleFeaturedSave}
            >
              <Star size={14} fill={isFeaturedSaved ? 'currentColor' : 'none'} strokeWidth={1.8} />
              <span>{isFeaturedSaved ? 'Saved' : 'Save'}</span>
            </button>
          </div>
        </div>

        {/* ── 2x2 Grid of 4 Cards ── */}
        <div className="sq-grid">
          {PART_CARDS.map((card) => (
            <button
              key={card.part}
              className={`sq-card sq-card--${card.colorKey}`}
              onClick={() => openPart(card.part)}
            >
              <div className="sq-card__top">
                <div className="sq-card__icon-box">
                  <card.Icon size={20} />
                </div>
                <span className="sq-card__badge">{card.badge}</span>
              </div>
              <div className="sq-card__bottom">
                <div className="sq-card__text">
                  <span className="sq-card__title">{card.title}</span>
                  <span className="sq-card__desc">{card.desc}</span>
                </div>
                <div className="sq-card__arrow">
                  <ArrowRight size={13} />
                </div>
              </div>
            </button>
          ))}

          {/* 4th Card: Saved */}
          <button
            className="sq-card sq-card--saved"
            onClick={() => {
              selectionHaptic();
              setView('saved');
            }}
          >
            <div className="sq-card__top">
              <div className="sq-card__icon-box">
                <Star size={20} fill="none" strokeWidth={1.9} />
              </div>
              {savedQuestions.length > 0 && (
                <span className="sq-card__badge sq-card__badge--saved">{savedQuestions.length}</span>
              )}
            </div>
            <div className="sq-card__bottom">
              <div className="sq-card__text">
                <span className="sq-card__title">Saved</span>
                <span className="sq-card__desc">Your favourites</span>
              </div>
              <div className="sq-card__arrow">
                <ArrowRight size={13} />
              </div>
            </div>
          </button>
        </div>

        <style>{css}</style>
      </div>
    );
  }

  if (view === 'saved') {
    return (
      <div className="sq" style={{ '--acc': SAVED_ACCENT } as React.CSSProperties}>
        {partnerBanner}
        <div className="sq-nav">
          <button className="sq-back" onClick={backToParts}>
            <ChevronLeft size={16} />
            <span>{t('sq.parts')}</span>
          </button>
          <span className="sq-nav__title">
            <Star size={14} /> {t('sq.saved')}
          </span>
        </div>
        {savedQuestions.length === 0 ? (
          <p className="sq-empty">{t('sq.savedEmpty')}</p>
        ) : (
          <div className="sq-qlist">
            {savedQuestions.map((s) => (
              <div key={`${s.part}:${s.topicId}:${s.index ?? 0}`} className="sq-qrow">
                <button className="sq-qrow__pick" onClick={() => openSaved(s)}>
                  <span className="sq-qrow__tag">
                    {t('sq.part', { n: s.part })} · {s.topicTitle}
                  </span>
                  <span className="sq-qrow__text">{s.text}</span>
                </button>
                <button
                  className="sq-star sq-star--on"
                  onClick={() => toggleSave(s)}
                  aria-label="Unsave"
                >
                  <Star size={17} fill="currentColor" strokeWidth={0} />
                </button>
              </div>
            ))}
          </div>
        )}
        <style>{css}</style>
      </div>
    );
  }

  if (view === 'topics') {
    return (
      <div className="sq" style={{ '--acc': PART_ACCENT[browsePart] } as React.CSSProperties}>
        {partnerBanner}
        <div className="sq-nav">
          <button className="sq-back" onClick={backToParts}>
            <ChevronLeft size={16} />
            <span>{t('sq.parts')}</span>
          </button>
          <span className="sq-nav__title">{t('sq.part', { n: browsePart })}</span>
        </div>
        <input
          className="sq-search"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('sq.search')}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
        <div className="sq-topics">
          {(() => {
            const q = query.trim().toLowerCase();
            const list = topicsForPart(browsePart).filter(
              (tp) => !q || tp.title.toLowerCase().includes(q)
            );
            if (!list.length) {
              return <p className="sq-empty">{t('sq.noResults')}</p>;
            }
            return list.map((tp) => {
              const active = browsePart === speakingPart && tp.id === speakingTopicId;
              return (
                <button
                  key={tp.id}
                  className={`sq-topic-row${active ? ' sq-topic-row--on' : ''}`}
                  onClick={() => openTopic(tp.id)}
                >
                  <span className="sq-topic-row__title">{tp.title}</span>
                  <span className="sq-topic-row__count">
                    {browsePart === 2
                      ? t('sq.cueCardLabel')
                      : t('sq.questionCount', { n: tp.questions?.length ?? 0 })}
                  </span>
                </button>
              );
            });
          })()}
        </div>
        <style>{css}</style>
      </div>
    );
  }

  const questions = speakingPart === 2 ? [] : topic.questions || [];

  return (
    <div className="sq" style={{ '--acc': PART_ACCENT[speakingPart] } as React.CSSProperties}>
      <div className="sq-nav">
        <button className="sq-back" onClick={backToTopics}>
          <ChevronLeft size={16} />
          <span>{t('sq.topics')}</span>
        </button>
        <span className="sq-nav__title">
          {t('sq.part', { n: speakingPart })} · {topic.title}
        </span>
      </div>

      {speakingPart === 2 ? (
        <div className="sq-cue">
          <div className="sq-cue__head">
            <p className="sq-cue__prompt">"{topic.cue}"</p>
            <button
              className={`sq-star${isSaved(2, topic.id, 0) ? ' sq-star--on' : ''}`}
              onClick={() =>
                toggleSave({
                  id: `2:${topic.id}:0`,
                  part: 2,
                  topicId: topic.id,
                  index: 0,
                  text: topic.cue || '',
                  question: topic.cue || '',
                  topicTitle: topic.title,
                  savedAt: new Date().toISOString(),
                })
              }
              aria-label="Save"
            >
              <Star size={17} fill={isSaved(2, topic.id, 0) ? 'currentColor' : 'none'} strokeWidth={1.75} />
            </button>
          </div>
          <div className="sq-bullets">
            <span className="sq-bullets__label">{t('sq.youShouldSay')}</span>
            <ul>
              {topic.bullets?.map((b: string, i: number) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </div>
          <div className="sq-timer">
            <div
              className={`sq-timer__left${timerRunning ? ' running' : ''}${
                prepTimeLeft === 0 ? ' done' : ''
              }`}
            >
              <span className="sq-timer__label">{t('sq.prepTime')}</span>
              <span className="sq-timer__time">{fmtTime(prepTimeLeft)}</span>
            </div>
            <div className="sq-timer__btns">
              {!timerRunning ? (
                <button className="sq-tbtn sq-tbtn--start" onClick={startTimer}>
                  {prepTimeLeft === 60 ? t('sq.start') : t('sq.resume')}
                </button>
              ) : (
                <button className="sq-tbtn sq-tbtn--pause" onClick={stopTimer}>
                  {t('sq.pause')}
                </button>
              )}
              <button className="sq-tbtn sq-tbtn--reset" onClick={resetTimer} aria-label="Reset">
                ↺
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="sq-qlist">
          {questions.map((q: string, i: number) => {
            const active = i === speakingQuestionIndex;
            const saved = isSaved(speakingPart, topic.id, i);
            return (
              <div key={i} className={`sq-qrow${active ? ' sq-qrow--on' : ''}`}>
                <button className="sq-qrow__pick" onClick={() => pickQuestion(i)}>
                  <span className="sq-qrow__num">{i + 1}</span>
                  <span className="sq-qrow__text">{q}</span>
                </button>
                <button
                  className={`sq-star${saved ? ' sq-star--on' : ''}`}
                  onClick={() =>
                    toggleSave({
                      id: `${speakingPart}:${topic.id}:${i}`,
                      part: speakingPart,
                      topicId: topic.id,
                      index: i,
                      text: q,
                      question: q,
                      topicTitle: topic.title,
                      savedAt: new Date().toISOString(),
                    })
                  }
                  aria-label="Save"
                >
                  <Star size={17} fill={saved ? 'currentColor' : 'none'} strokeWidth={1.75} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <style>{css}</style>
    </div>
  );
}

const css = `
  .sq {
    width: 100%;
    padding: 0 16px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .sq--parts {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
  }

  /* ── Featured "Today's Question" Card ── */
  .sq-featured {
    width: 100%;
    border-radius: 22px;
    padding: 16px 18px;
    background: linear-gradient(145deg, rgba(139, 92, 246, 0.16) 0%, rgba(59, 130, 246, 0.05) 100%), rgba(20, 15, 42, 0.72);
    border: 1px solid rgba(139, 92, 246, 0.38);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    box-shadow: 0 10px 30px rgba(139, 92, 246, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.1);
    display: flex;
    flex-direction: column;
    gap: 12px;
    transition: transform 0.12s ease, border-color 0.15s ease;
  }
  .light .sq-featured {
    background: linear-gradient(145deg, rgba(139, 92, 246, 0.08) 0%, rgba(59, 130, 246, 0.03) 100%), #ffffff;
    border: 1px solid rgba(139, 92, 246, 0.22);
    box-shadow: 0 8px 24px rgba(139, 92, 246, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9);
  }

  .sq-featured__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }
  .sq-featured__title-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .sq-featured__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #C084FC;
  }
  .light .sq-featured__icon {
    color: #8B5CF6;
  }
  .sq-featured__heading {
    font-size: 13px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.85);
    letter-spacing: -0.1px;
  }
  .light .sq-featured__heading {
    color: #475569;
  }
  .sq-featured__new-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: transparent;
    border: none;
    color: #C084FC;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 99px;
    transition: all 0.12s ease;
  }
  .light .sq-featured__new-btn {
    color: #7C3AED;
  }
  .sq-featured__new-btn:active {
    transform: scale(0.94);
    background: rgba(139, 92, 246, 0.15);
  }

  .sq-featured__content {
    cursor: pointer;
    text-align: center;
    padding: 4px 0 2px;
  }
  .sq-featured__question {
    font-size: 18px;
    font-weight: 700;
    line-height: 1.35;
    color: #FFFFFF;
    margin: 0;
    letter-spacing: -0.2px;
  }
  .light .sq-featured__question {
    color: #0F172A;
  }
  .sq-featured__hint {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    margin-top: 8px;
    font-size: 12px;
    font-weight: 500;
    color: #94A3B8;
  }
  .light .sq-featured__hint {
    color: #64748B;
  }

  .sq-featured__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 6px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }
  .light .sq-featured__footer {
    border-top: 1px solid rgba(0, 0, 0, 0.06);
  }
  .sq-featured__meta {
    font-size: 12px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.6);
  }
  .light .sq-featured__meta {
    color: #64748B;
  }
  .sq-featured__save-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.75);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 99px;
    transition: all 0.12s ease;
  }
  .light .sq-featured__save-btn {
    color: #64748B;
  }
  .sq-featured__save-btn--active {
    color: #FBBF24 !important;
  }
  .sq-featured__save-btn:active {
    transform: scale(0.92);
  }

  /* ── 2x2 Grid of 4 Cards ── */
  .sq-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    width: 100%;
  }

  .sq-card {
    position: relative;
    border-radius: 20px;
    padding: 14px 14px 12px 14px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 128px;
    text-align: left;
    cursor: pointer;
    overflow: hidden;
    transition: transform 0.12s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.15s ease;
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
  }
  .sq-card:active {
    transform: scale(0.96);
  }

  .sq-card__top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    width: 100%;
  }
  .sq-card__icon-box {
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
  }
  .sq-card__badge {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 800;
    line-height: 1;
  }

  .sq-card__bottom {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 8px;
    width: 100%;
    margin-top: 14px;
  }
  .sq-card__text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .sq-card__title {
    font-size: 16px;
    font-weight: 700;
    color: #FFFFFF;
    letter-spacing: -0.2px;
    line-height: 1.2;
  }
  .light .sq-card__title {
    color: #0F172A;
  }
  .sq-card__desc {
    font-size: 11px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.7);
    line-height: 1.25;
  }
  .sq-card__arrow {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: transform 0.12s ease;
  }
  .sq-card:active .sq-card__arrow {
    transform: translateX(2px);
  }

  /* ── Card 1 (Part 1 - Cyan) ── */
  .sq-card--part1 {
    background: linear-gradient(145deg, rgba(6, 182, 212, 0.18) 0%, rgba(14, 165, 233, 0.05) 100%), rgba(12, 24, 46, 0.75);
    border: 1px solid rgba(6, 182, 212, 0.45);
    box-shadow: 0 8px 24px rgba(6, 182, 212, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }
  .sq-card--part1 .sq-card__icon-box { color: #38BDF8; }
  .sq-card--part1 .sq-card__badge { background: #0284C7; color: #FFFFFF; }
  .sq-card--part1 .sq-card__desc { color: rgba(186, 230, 253, 0.85); }
  .sq-card--part1 .sq-card__arrow { background: rgba(255, 255, 255, 0.12); color: #FFFFFF; }

  .light .sq-card--part1 {
    background: linear-gradient(145deg, rgba(14, 165, 233, 0.14) 0%, rgba(6, 182, 212, 0.04) 100%), #FFFFFF;
    border: 1px solid rgba(14, 165, 233, 0.35);
    box-shadow: 0 6px 18px rgba(14, 165, 233, 0.1);
  }
  .light .sq-card--part1 .sq-card__icon-box { color: #0284C7; }
  .light .sq-card--part1 .sq-card__desc { color: #0284C7; }
  .light .sq-card--part1 .sq-card__arrow { background: rgba(14, 165, 233, 0.15); color: #0284C7; }

  /* ── Card 2 (Part 2 - Purple) ── */
  .sq-card--part2 {
    background: linear-gradient(145deg, rgba(168, 85, 247, 0.18) 0%, rgba(147, 51, 234, 0.05) 100%), rgba(26, 16, 48, 0.75);
    border: 1px solid rgba(168, 85, 247, 0.45);
    box-shadow: 0 8px 24px rgba(168, 85, 247, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }
  .sq-card--part2 .sq-card__icon-box { color: #C084FC; }
  .sq-card--part2 .sq-card__badge { background: #9333EA; color: #FFFFFF; }
  .sq-card--part2 .sq-card__desc { color: rgba(233, 213, 255, 0.85); }
  .sq-card--part2 .sq-card__arrow { background: rgba(255, 255, 255, 0.12); color: #FFFFFF; }

  .light .sq-card--part2 {
    background: linear-gradient(145deg, rgba(168, 85, 247, 0.14) 0%, rgba(147, 51, 234, 0.04) 100%), #FFFFFF;
    border: 1px solid rgba(168, 85, 247, 0.35);
    box-shadow: 0 6px 18px rgba(168, 85, 247, 0.1);
  }
  .light .sq-card--part2 .sq-card__icon-box { color: #7C3AED; }
  .light .sq-card--part2 .sq-card__desc { color: #7C3AED; }
  .light .sq-card--part2 .sq-card__arrow { background: rgba(168, 85, 247, 0.15); color: #7C3AED; }

  /* ── Card 3 (Part 3 - Emerald Green) ── */
  .sq-card--part3 {
    background: linear-gradient(145deg, rgba(16, 185, 129, 0.18) 0%, rgba(5, 150, 105, 0.05) 100%), rgba(12, 34, 26, 0.75);
    border: 1px solid rgba(16, 185, 129, 0.45);
    box-shadow: 0 8px 24px rgba(16, 185, 129, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }
  .sq-card--part3 .sq-card__icon-box { color: #34D399; }
  .sq-card--part3 .sq-card__badge { background: #059669; color: #FFFFFF; }
  .sq-card--part3 .sq-card__desc { color: rgba(167, 243, 208, 0.85); }
  .sq-card--part3 .sq-card__arrow { background: rgba(255, 255, 255, 0.12); color: #FFFFFF; }

  .light .sq-card--part3 {
    background: linear-gradient(145deg, rgba(16, 185, 129, 0.14) 0%, rgba(5, 150, 105, 0.04) 100%), #FFFFFF;
    border: 1px solid rgba(16, 185, 129, 0.35);
    box-shadow: 0 6px 18px rgba(16, 185, 129, 0.1);
  }
  .light .sq-card--part3 .sq-card__icon-box { color: #059669; }
  .light .sq-card--part3 .sq-card__desc { color: #059669; }
  .light .sq-card--part3 .sq-card__arrow { background: rgba(16, 185, 129, 0.15); color: #059669; }

  /* ── Card 4 (Saved - Amber / Gold) ── */
  .sq-card--saved {
    background: linear-gradient(145deg, rgba(245, 158, 11, 0.18) 0%, rgba(217, 119, 6, 0.05) 100%), rgba(36, 25, 12, 0.75);
    border: 1px solid rgba(245, 158, 11, 0.45);
    box-shadow: 0 8px 24px rgba(245, 158, 11, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }
  .sq-card--saved .sq-card__icon-box { color: #FBBF24; }
  .sq-card--saved .sq-card__badge--saved { background: #D97706; color: #FFFFFF; }
  .sq-card--saved .sq-card__desc { color: rgba(253, 230, 138, 0.85); }
  .sq-card--saved .sq-card__arrow { background: rgba(255, 255, 255, 0.12); color: #FFFFFF; }

  .light .sq-card--saved {
    background: linear-gradient(145deg, rgba(245, 158, 11, 0.14) 0%, rgba(217, 119, 6, 0.04) 100%), #FFFFFF;
    border: 1px solid rgba(245, 158, 11, 0.35);
    box-shadow: 0 6px 18px rgba(245, 158, 11, 0.1);
  }
  .light .sq-card--saved .sq-card__icon-box { color: #D97706; }
  .light .sq-card--saved .sq-card__desc { color: #D97706; }
  .light .sq-card--saved .sq-card__arrow { background: rgba(245, 158, 11, 0.15); color: #D97706; }

  /* ── Subviews (nav, search, list, cues) ── */
  .sq-banner {
    width: 100%;
    display: flex; align-items: center; justify-content: center; gap: 6px;
    padding: 10px 14px; border-radius: 14px;
    background: rgba(59, 130, 246, 0.18);
    border: 1px solid rgba(122, 184, 255, 0.4);
    color: #cfe3ff;
    font-size: 13px; font-weight: 700;
    animation: sqBannerIn 0.2s ease both;
    transition: transform 0.1s, background 0.12s;
  }
  .sq-banner:active { transform: scale(0.98); background: rgba(59, 130, 246, 0.28); }
  @keyframes sqBannerIn {
    from { opacity: 0; transform: translateY(-6px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .sq-nav {
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    min-height: 42px; padding: 4px 0;
  }
  .sq-back {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 14px 8px 10px; border-radius: 12px;
    background: var(--surface-2);
    border: 1px solid var(--border);
    color: var(--text-primary);
    font-size: 13px; font-weight: 700;
    box-shadow: var(--shadow-sm);
    backdrop-filter: blur(8px);
    transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
    cursor: pointer;
  }
  .sq-back:active {
    transform: scale(0.94);
    background: var(--surface-3);
  }
  .sq-nav__title {
    flex: 1; min-width: 0;
    font-size: 13px; font-weight: 700;
    color: var(--text-secondary);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    text-align: right;
  }

  .sq-search {
    width: 100%;
    padding: 11px 14px;
    border-radius: 14px;
    background: var(--surface-2);
    border: 1px solid var(--border);
    color: var(--text-primary);
    font-size: 14px;
    outline: none;
    transition: border-color 0.12s, background 0.12s;
  }
  .sq-search::placeholder { color: var(--text-tertiary); }
  .sq-search:focus {
    border-color: rgb(var(--acc) / 0.6);
    box-shadow: 0 0 0 3px rgb(var(--acc) / 0.12);
  }

  .sq-empty {
    text-align: center;
    font-size: 14px; font-weight: 600;
    color: var(--text-secondary);
    padding: 24px 0;
  }

  .sq-topics {
    display: flex; flex-direction: column; gap: 8px;
  }
  .sq-topic-row {
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    width: 100%; padding: 12px 14px;
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 14px;
    text-align: left;
    transition: background 0.12s, transform 0.1s, border-color 0.12s;
  }
  .sq-topic-row:active { transform: scale(0.98); background: var(--surface-2); }
  .sq-topic-row--on {
    border-color: rgb(var(--acc) / 0.55);
    background: linear-gradient(90deg, rgb(var(--acc) / 0.18), rgb(var(--acc) / 0.06));
  }
  .sq-topic-row__title { font-size: 14px; font-weight: 700; color: var(--text-primary); }
  .sq-topic-row__count {
    flex-shrink: 0; font-size: 11px; font-weight: 700;
    padding: 2px 8px; border-radius: 99px;
    color: rgb(var(--acc) / 0.95);
    background: rgb(var(--acc) / 0.14);
  }

  .sq-qlist {
    display: flex; flex-direction: column; gap: 8px;
  }
  .sq-qrow {
    display: flex; align-items: stretch; gap: 4px;
    width: 100%;
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 14px;
    overflow: hidden;
    transition: background 0.12s, border-color 0.12s;
  }
  .sq-qrow--on {
    border-color: rgb(var(--acc) / 0.6);
    background: linear-gradient(90deg, rgb(var(--acc) / 0.2), rgb(var(--acc) / 0.06));
  }
  .sq-qrow__pick {
    flex: 1; min-width: 0;
    display: flex; align-items: flex-start; gap: 10px;
    padding: 12px 6px 12px 14px;
    text-align: left;
    background: transparent;
    border: none;
    cursor: pointer;
  }
  .sq-qrow__num {
    flex-shrink: 0;
    width: 22px; height: 22px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    background: var(--surface-2);
    color: var(--text-secondary);
    font-size: 11px; font-weight: 800;
  }
  .sq-qrow--on .sq-qrow__num {
    background: rgb(var(--acc));
    color: #fff;
    box-shadow: 0 2px 8px rgb(var(--acc) / 0.5);
  }
  .sq-qrow__text {
    font-size: 14px; font-weight: 600; line-height: 1.45;
    color: var(--text-primary);
  }
  .sq-qrow__tag {
    display: block; font-size: 10px; font-weight: 700;
    color: rgb(var(--acc) / 0.9); margin-bottom: 3px;
    text-transform: uppercase; letter-spacing: 0.4px;
  }

  .sq-star {
    flex-shrink: 0;
    width: 44px;
    display: flex; align-items: center; justify-content: center;
    background: transparent; border: none;
    color: var(--text-tertiary);
    cursor: pointer;
    transition: transform 0.1s, color 0.12s;
  }
  .sq-star:active { transform: scale(0.8); }
  .sq-star--on { color: #ffc107; }

  .sq-cue { display: flex; flex-direction: column; gap: 12px; }
  .sq-cue__head {
    display: flex; align-items: flex-start; gap: 8px;
    background:
      radial-gradient(120% 140% at 50% 0%, rgb(var(--acc) / 0.16) 0%, transparent 70%),
      var(--bg-secondary);
    border: 1px solid rgb(var(--acc) / 0.25);
    border-radius: 16px;
    padding: 14px;
  }
  .sq-cue__prompt {
    flex: 1; min-width: 0;
    font-size: 15px; font-weight: 700;
    line-height: 1.5; color: var(--text-primary);
    text-align: center;
  }
  .sq-bullets {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 12px 14px;
  }
  .sq-bullets__label {
    display: block;
    font-size: 11px; font-weight: 700;
    color: rgb(var(--acc) / 0.9);
    text-transform: uppercase; letter-spacing: 1px;
    margin-bottom: 8px;
  }
  .sq-bullets ul {
    list-style: none; padding: 0; margin: 0;
    display: flex; flex-direction: column; gap: 6px;
  }
  .sq-bullets li {
    font-size: 13px; font-weight: 500;
    color: var(--text-primary);
    padding-left: 14px; position: relative;
    line-height: 1.4;
  }
  .sq-bullets li::before {
    content: "•"; position: absolute; left: 2px;
    color: rgb(var(--acc)); font-size: 14px; line-height: 1.3;
  }

  .sq-timer {
    display: flex; align-items: center; justify-content: space-between;
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 12px 14px; gap: 12px;
  }
  .sq-timer__left { display: flex; flex-direction: column; gap: 2px; }
  .sq-timer__label {
    font-size: 10px; font-weight: 700;
    color: var(--text-secondary);
    text-transform: uppercase; letter-spacing: 1px;
  }
  .sq-timer__time {
    font-size: 20px; font-weight: 800; color: var(--text-primary);
    font-variant-numeric: tabular-nums; line-height: 1;
  }
  .sq-timer__left.running .sq-timer__time {
    color: var(--warning);
    animation: tPulse 1.5s ease-in-out infinite;
  }
  .sq-timer__left.done .sq-timer__time { color: var(--success); }
  .sq-timer__btns { display: flex; gap: 6px; align-items: center; }
  .sq-tbtn {
    border-radius: 11px; font-size: 13px; font-weight: 700;
    min-height: 38px; padding: 0 14px;
    display: flex; align-items: center; justify-content: center; gap: 4px;
    border: none; cursor: pointer;
    transition: transform 0.1s, background 0.12s;
  }
  .sq-tbtn:active { transform: scale(0.93); }
  .sq-tbtn--start {
    background: rgb(var(--acc)); color: #fff; min-width: 90px;
    box-shadow: 0 3px 12px rgb(var(--acc) / 0.4);
  }
  .sq-tbtn--pause {
    background: rgba(255, 149, 0, 0.16); color: var(--warning);
    border: 1px solid rgba(255, 149, 0, 0.25); min-width: 90px;
  }
  .sq-tbtn--reset {
    background: var(--surface-2); color: var(--text-secondary);
    min-width: 38px; padding: 0; font-size: 17px;
  }

  @keyframes tPulse {
    0%, 100% { opacity: 1; } 50% { opacity: 0.55; }
  }

  @media (max-width: 375px) {
    .sq { gap: 10px; padding: 0 12px; }
    .sq-featured__question { font-size: 16px; }
    .sq-card { min-height: 116px; padding: 12px 12px 10px 12px; }
    .sq-card__title { font-size: 15px; }
  }
`;
