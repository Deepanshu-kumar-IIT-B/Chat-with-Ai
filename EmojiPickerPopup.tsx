import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Smile, ThumbsUp, Heart, Sparkles, Coffee, Trophy } from 'lucide-react';

interface EmojiCategory {
  id: string;
  name: string;
  icon: React.ElementType;
  emojis: string[];
}

const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    id: 'smileys',
    name: 'Smileys',
    icon: Smile,
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '🥲', '🥹',
      '☺️', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘',
      '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐',
      '🤓', '😎', '🥸', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟',
      '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭',
      '😮‍💨', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱',
      '😨', '😰', '😥', '😓', '🤗', '🤔', '🫣', '🤭', '🤫', '🫠',
      '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮'
    ]
  },
  {
    id: 'gestures',
    name: 'Gestures',
    icon: ThumbsUp,
    emojis: [
      '👍', '👎', '👏', '🙌', '🫶', '👐', '🤲', '🤝', '🙏', '✌️',
      '🤞', '🫰', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️',
      '🫵', '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✍️',
      '💅', '🤳', '💪', '🦾', '👀', '👁️', '👅', '👄', '🫦', '🧠'
    ]
  },
  {
    id: 'hearts',
    name: 'Hearts & Vibes',
    icon: Heart,
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
      '❤️‍🔥', '❤️‍🩹', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝',
      '✨', '🌟', '⭐', '💫', '🔥', '💥', '💯', '💢', '💨', '💤'
    ]
  },
  {
    id: 'nature',
    name: 'Animals & Nature',
    icon: Sparkles,
    emojis: [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
      '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆',
      '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🦋', '🐞',
      '🌸', '🌺', '🌹', '🌷', '🌼', '🌻', '💐', '🍀', '🍁', '🍂'
    ]
  },
  {
    id: 'food',
    name: 'Food & Drinks',
    icon: Coffee,
    emojis: [
      '☕', '🍵', '🧋', '🥤', '🧃', '🍎', '🍐', '🍊', '🍋', '🍌',
      '🍉', '🍇', '🍓', '🍒', '🍑', '🥭', '🍍', '🥑', '🍔', '🍟',
      '🍕', '🌭', '🥪', '🌮', '🌯', '🍜', '🍣', '🍱', '🍦', '🍰',
      '🎂', '🍫', '🍿', '🍩', '🍪', '🍷', '🍸', '🍹', '🍺', '🍻'
    ]
  },
  {
    id: 'activities',
    name: 'Activities & Objects',
    icon: Trophy,
    emojis: [
      '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🎱', '🏓', '🏸', '🥊',
      '🛹', '🚴', '🏆', '🥇', '🥈', '🥉', '🎯', '🎮', '🎲', '🎨',
      '🎬', '🎤', '🎧', '🎼', '🎹', '🎸', '📱', '💻', '💡', '🎉'
    ]
  }
];

interface EmojiPickerPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmoji: (emoji: string) => void;
}

export const EmojiPickerPopup: React.FC<EmojiPickerPopupProps> = ({
  isOpen,
  onClose,
  onSelectEmoji
}) => {
  const [activeCategory, setActiveCategory] = useState('smileys');
  const [searchQuery, setSearchQuery] = useState('');
  const popupRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filter emojis if search query exists
  const allEmojis = EMOJI_CATEGORIES.flatMap((c) => c.emojis);
  const displayedEmojis = searchQuery.trim()
    ? allEmojis.filter((emoji) => emoji.includes(searchQuery.trim()))
    : EMOJI_CATEGORIES.find((c) => c.id === activeCategory)?.emojis || EMOJI_CATEGORIES[0].emojis;

  return (
    <AnimatePresence>
      <motion.div
        ref={popupRef}
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="absolute bottom-full right-0 sm:right-0 mb-2 sm:mb-3 w-[290px] xs:w-[320px] sm:w-[350px] max-w-[calc(100vw-20px)] bg-[var(--surface)] backdrop-blur-2xl border border-[var(--border)] rounded-3xl shadow-2xl overflow-hidden z-40 flex flex-col transition-colors origin-bottom-right"
        role="dialog"
        aria-label="Emoji Picker"
      >
        {/* Header & Search */}
        <div className="p-3 border-b border-[var(--border-subtle)] bg-[var(--surface-glass)]">
          <div className="flex items-center gap-2 bg-[var(--surface-secondary)] px-3 py-1.5 rounded-2xl border border-[var(--border-subtle)] focus-within:border-[var(--accent)] transition-colors">
            <Search size={14} className="text-[var(--text-muted)] shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search emojis..."
              className="bg-transparent text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none flex-1 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Category Tabs (when not searching) */}
          {!searchQuery && (
            <div className="flex items-center justify-between gap-1 mt-2.5 px-0.5 overflow-x-auto no-scrollbar">
              {EMOJI_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[var(--accent)] text-white shadow-xs scale-105'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]'
                    }`}
                    title={cat.name}
                  >
                    <Icon size={16} />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Emoji Grid */}
        <div className="p-3 max-h-[220px] overflow-y-auto no-scrollbar">
          <div className="grid grid-cols-7 sm:grid-cols-8 gap-1">
            {displayedEmojis.map((emoji, index) => (
              <motion.button
                key={`${emoji}-${index}`}
                whileHover={{ scale: 1.25 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onSelectEmoji(emoji)}
                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-lg sm:text-xl rounded-xl hover:bg-[var(--surface-secondary)] transition-colors cursor-pointer"
                title={emoji}
              >
                {emoji}
              </motion.button>
            ))}
          </div>

          {displayedEmojis.length === 0 && (
            <div className="py-8 text-center text-xs text-[var(--text-muted)] font-medium">
              No emojis found
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
