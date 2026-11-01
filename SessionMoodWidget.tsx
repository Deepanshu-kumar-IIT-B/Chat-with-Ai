import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HeartPulse, 
  Sparkles, 
  X, 
  RotateCcw, 
  Check, 
  ChevronDown,
  Smile
} from 'lucide-react';
import { UserSessionMood } from './types';
import { AVAILABLE_MOODS } from './moodHelpers';

interface SessionMoodCheckinBannerProps {
  currentMood: UserSessionMood | null;
  onSelectMood: (mood: UserSessionMood) => void;
  onClearMood: () => void;
  onDismiss: () => void;
  personaName: string;
}

export const SessionMoodCheckinBanner: React.FC<SessionMoodCheckinBannerProps> = ({
  currentMood,
  onSelectMood,
  onClearMood,
  onDismiss,
  personaName
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="w-full my-2.5 p-4 sm:p-5 rounded-3xl bg-[var(--surface-glass)] backdrop-blur-md border border-[var(--border)] shadow-xs relative overflow-hidden group"
    >
      {/* Decorative gradient glow corner */}
      <div className="absolute -top-12 -right-12 w-28 h-28 rounded-full bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-transparent blur-xl pointer-events-none" />

      {/* Header bar of banner */}
      <div className="flex items-center justify-between gap-3 mb-3.5 relative z-10">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-subtle)] text-[var(--accent)] flex items-center justify-center shrink-0 shadow-2xs">
            <HeartPulse size={16} className="animate-pulse" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-black text-[var(--text-primary)] flex items-center gap-1.5 truncate">
              <span>How are you feeling right now?</span>
              {currentMood && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
                  Tone active
                </span>
              )}
            </h3>
            <p className="text-[11px] text-[var(--text-muted)] font-medium truncate">
              {currentMood 
                ? `Influencing ${personaName}'s conversational tone for this session`
                : `Log your mood to shape ${personaName}'s initial conversational tone`
              }
            </p>
          </div>
        </div>

        {/* Top-right actions: Reset or Dismiss */}
        <div className="flex items-center gap-1.5 shrink-0">
          {currentMood && (
            <button
              type="button"
              onClick={onClearMood}
              className="text-[11px] font-semibold text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 px-2 py-1 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
              title="Reset session mood"
            >
              <RotateCcw size={11} />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
          <button
            type="button"
            onClick={onDismiss}
            className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
            title="Dismiss mood check-in"
            aria-label="Dismiss mood check-in"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Mood Chips Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 relative z-10">
        {AVAILABLE_MOODS.map((mood) => {
          const isSelected = currentMood?.id === mood.id;
          return (
            <motion.button
              key={mood.id}
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelectMood(mood)}
              className={`p-2.5 sm:p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                isSelected
                  ? mood.activeBgClass + ' shadow-sm'
                  : 'bg-[var(--surface)] hover:bg-[var(--surface-hover)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]/40 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xl sm:text-2xl select-none" role="img" aria-label={mood.label}>
                  {mood.emoji}
                </span>
                {isSelected && (
                  <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-2xs shrink-0">
                    <Check size={10} strokeWidth={3} />
                  </div>
                )}
              </div>
              <div>
                <span className="text-xs font-black block text-[var(--text-primary)] tracking-tight">
                  {mood.label}
                </span>
                <span className="text-[10px] text-[var(--text-muted)] font-medium leading-tight line-clamp-1">
                  {mood.subtitle}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Active Mood Guide Note if selected */}
      {currentMood && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs text-[var(--text-secondary)] relative z-10"
        >
          <div className="flex items-center gap-1.5">
            <span className="text-sm">{currentMood.emoji}</span>
            <span className="font-bold text-[var(--text-primary)]">{currentMood.label} mood logged:</span>
            <span className="text-[11px] text-[var(--text-muted)] italic">
              {currentMood.toneGuide}
            </span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

interface SessionMoodHeaderBadgeProps {
  currentMood: UserSessionMood | null;
  onSelectMood: (mood: UserSessionMood) => void;
  onClearMood: () => void;
}

export const SessionMoodHeaderBadge: React.FC<SessionMoodHeaderBadgeProps> = ({
  currentMood,
  onSelectMood,
  onClearMood
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  return (
    <div className="relative shrink-0" ref={popoverRef}>
      <motion.button
        type="button"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`px-2.5 sm:px-3 py-1.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs border ${
          currentMood
            ? currentMood.badgeBorderClass + ' ring-1 ring-[var(--accent)]/20'
            : 'bg-[var(--surface)] hover:bg-[var(--surface-hover)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
        }`}
        title={currentMood ? `Current mood: ${currentMood.label}. Click to change` : 'Log current mood'}
        aria-label="Mood selector"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {currentMood ? (
          <>
            <span className="text-sm select-none" role="img" aria-label={currentMood.label}>
              {currentMood.emoji}
            </span>
            <span className="hidden sm:inline font-bold tracking-tight">
              {currentMood.label}
            </span>
            <ChevronDown size={12} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </>
        ) : (
          <>
            <Sparkles size={13} className="text-[var(--accent)]" />
            <span className="hidden sm:inline font-semibold">Log Mood</span>
            <span className="sm:hidden font-semibold">Mood</span>
          </>
        )}
      </motion.button>

      {/* Floating Popover Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute right-0 mt-2 w-72 sm:w-80 p-3.5 bg-[var(--surface)]/95 backdrop-blur-xl border border-[var(--border)] rounded-3xl shadow-xl z-50 text-[var(--text-primary)]"
          >
            <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-1.5">
                <Smile size={15} className="text-[var(--accent)]" />
                <span className="text-xs font-black uppercase tracking-wider text-[var(--text-primary)]">
                  Session Mood Check-in
                </span>
              </div>
              {currentMood && (
                <button
                  type="button"
                  onClick={() => {
                    onClearMood();
                    setIsOpen(false);
                  }}
                  className="text-[10px] font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 px-2 py-0.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw size={10} />
                  <span>Reset</span>
                </button>
              )}
            </div>

            <p className="text-[11px] text-[var(--text-muted)] mb-3 leading-relaxed">
              Your logged mood influences the AI companion's tone, pacing, and empathy during this chat session.
            </p>

            <div className="grid grid-cols-2 gap-1.5 max-h-60 overflow-y-auto pr-1 no-scrollbar">
              {AVAILABLE_MOODS.map((mood) => {
                const isSelected = currentMood?.id === mood.id;
                return (
                  <button
                    key={mood.id}
                    type="button"
                    onClick={() => {
                      onSelectMood(mood);
                      setIsOpen(false);
                    }}
                    className={`p-2 rounded-xl text-left transition-all cursor-pointer flex items-center gap-2 border ${
                      isSelected
                        ? mood.activeBgClass + ' font-bold'
                        : 'bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] border-[var(--border-subtle)] text-[var(--text-secondary)]'
                    }`}
                  >
                    <span className="text-lg select-none shrink-0" role="img" aria-label={mood.label}>
                      {mood.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold truncate text-[var(--text-primary)]">
                          {mood.label}
                        </span>
                        {isSelected && <Check size={11} className="text-emerald-500 shrink-0" />}
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)] truncate block">
                        {mood.subtitle}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
