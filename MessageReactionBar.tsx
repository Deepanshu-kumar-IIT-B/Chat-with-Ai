import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smile, Plus } from 'lucide-react';
import { MessageReaction } from './types';

export const QUICK_EMOJIS = ['❤️', '👍', '🔥', '😂', '😮', '😢', '👏', '🎉'];

interface MessageReactionBarProps {
  messageId: string;
  reactions?: MessageReaction[];
  onToggleReaction: (emoji: string) => void;
  isUser: boolean;
  isPickerOpen: boolean;
  onTogglePicker: () => void;
  onClosePicker: () => void;
}

export const MessageReactionBar: React.FC<MessageReactionBarProps> = ({
  reactions = [],
  onToggleReaction,
  isUser,
  isPickerOpen,
  onTogglePicker,
  onClosePicker
}) => {
  const hasReactions = reactions && reactions.length > 0;

  return (
    <div className={`relative flex items-center gap-1.5 mt-1 select-none max-w-full min-w-0 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {/* Existing Reactions Pills Bar */}
      {hasReactions && (
        <div className={`flex flex-wrap items-center gap-1.5 max-w-full min-w-0 ${isUser ? 'justify-end' : 'justify-start'}`}>
          {reactions.map((reaction) => {
            const isUserReacted = Boolean(reaction.userReacted);
            return (
              <motion.button
                key={reaction.emoji}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleReaction(reaction.emoji);
                }}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all cursor-pointer shadow-2xs border ${
                  isUserReacted
                    ? 'bg-[var(--accent)]/15 border-[var(--accent)]/60 text-[var(--accent)] font-bold'
                    : 'bg-[var(--surface-secondary)]/90 hover:bg-[var(--surface-hover)] border-[var(--border-subtle)] text-[var(--text-secondary)] font-medium'
                }`}
                title={isUserReacted ? `You reacted with ${reaction.emoji}` : `React with ${reaction.emoji}`}
                aria-label={`Reaction ${reaction.emoji}, count ${reaction.count}`}
              >
                <span className="text-xs leading-none">{reaction.emoji}</span>
                <span className="text-[10px] leading-none font-semibold">{reaction.count}</span>
              </motion.button>
            );
          })}

          {/* Quick Plus button to add more reactions to this message */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePicker();
            }}
            className="w-5 h-5 rounded-full bg-[var(--surface-secondary)]/80 hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center justify-center transition-colors cursor-pointer"
            title="Add reaction"
            aria-label="Add reaction"
          >
            <Plus size={11} />
          </motion.button>
        </div>
      )}

      {/* Floating Quick Emoji Picker Popup */}
      <AnimatePresence>
        {isPickerOpen && (
          <>
            {/* Backdrop click dismisser */}
            <div
              className="fixed inset-0 z-40"
              onClick={(e) => {
                e.stopPropagation();
                onClosePicker();
              }}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: isUser ? 4 : -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: isUser ? 4 : -4 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              className={`absolute z-50 flex items-center gap-1 p-1.5 rounded-full bg-[var(--surface)]/95 backdrop-blur-xl border border-[var(--border)] shadow-xl ${
                isUser ? 'right-0 top-full mt-1' : 'left-0 top-full mt-1'
              }`}
            >
              {QUICK_EMOJIS.map((emoji) => {
                const alreadyReacted = reactions.some((r) => r.emoji === emoji && r.userReacted);
                return (
                  <motion.button
                    key={emoji}
                    whileHover={{ scale: 1.25 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => {
                      onToggleReaction(emoji);
                      onClosePicker();
                    }}
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-sm transition-all cursor-pointer ${
                      alreadyReacted
                        ? 'bg-[var(--accent)]/20 ring-1 ring-[var(--accent)]'
                        : 'hover:bg-[var(--surface-secondary)]'
                    }`}
                    title={`React ${emoji}`}
                  >
                    {emoji}
                  </motion.button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
