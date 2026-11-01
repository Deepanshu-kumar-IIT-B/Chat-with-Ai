import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CornerUpLeft, Edit3, Trash2, Copy } from 'lucide-react';
import { ChatMessage } from './types';
import { QUICK_EMOJIS } from './MessageReactionBar';

interface ChatMessageContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number } | null;
  message: ChatMessage | null;
  onClose: () => void;
  onReply: (message: ChatMessage) => void;
  onEdit: (message: ChatMessage) => void;
  onDelete: (message: ChatMessage) => void;
  onCopy: (message: ChatMessage) => void;
  onReact: (message: ChatMessage, emoji: string) => void;
}

export const ChatMessageContextMenu: React.FC<ChatMessageContextMenuProps> = ({
  isOpen,
  position,
  message,
  onClose,
  onReply,
  onEdit,
  onDelete,
  onCopy,
  onReact
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen || !position || !message) return null;

  const isUserMessage = message.role === 'user';

  // Calculate safe coordinates inside viewport (menu size ~190px x 230px)
  const menuWidth = 190;
  const menuHeight = isUserMessage ? 230 : 185;
  const padding = 12;

  let left = position.x;
  let top = position.y;

  // Prevent right overflow
  if (left + menuWidth > window.innerWidth - padding) {
    left = Math.max(padding, window.innerWidth - menuWidth - padding);
  }

  // Prevent bottom overflow
  if (top + menuHeight > window.innerHeight - padding) {
    top = Math.max(padding, window.innerHeight - menuHeight - padding);
  }

  // Prevent negative/top left
  left = Math.max(padding, left);
  top = Math.max(padding, top);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Invisible backdrop to capture outside clicks and taps */}
        <div 
          className="fixed inset-0 z-40 bg-black/5"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
            onClose();
          }}
        />

        {/* Telegram-style Context Menu Card */}
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.9, y: 4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 4 }}
          transition={{ duration: 0.12, ease: 'easeOut' }}
          style={{ top: `${top}px`, left: `${left}px` }}
          onClick={(e) => e.stopPropagation()}
          className="fixed z-50 w-[190px] bg-[var(--surface)] backdrop-blur-2xl border border-[var(--border)] shadow-2xl rounded-2xl p-1.5 text-[var(--text-primary)] select-none"
        >
          {/* Quick Reaction Emojis Row */}
          <div className="flex items-center justify-between px-1.5 py-1 mb-1 bg-[var(--surface-secondary)]/80 rounded-xl border border-[var(--border-subtle)]">
            {QUICK_EMOJIS.slice(0, 6).map((emoji) => {
              const isReacted = message.reactions?.some((r) => r.emoji === emoji && r.userReacted);
              return (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    onReact(message, emoji);
                    onClose();
                  }}
                  className={`w-6.5 h-6.5 flex items-center justify-center text-sm rounded-lg transition-transform hover:scale-130 active:scale-95 cursor-pointer ${
                    isReacted ? 'bg-[var(--accent)]/25 ring-1 ring-[var(--accent)]' : 'hover:bg-[var(--surface-hover)]'
                  }`}
                  title={`React with ${emoji}`}
                >
                  {emoji}
                </button>
              );
            })}
          </div>

          {/* ↩ Reply */}
          <button
            type="button"
            onClick={() => {
              onReply(message);
              onClose();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold hover:bg-[var(--surface-hover)] text-[var(--text-primary)] transition-colors cursor-pointer group"
          >
            <span className="flex items-center gap-2.5">
              <CornerUpLeft size={15} className="text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors" />
              <span>Reply</span>
            </span>
            <span className="text-[10px] text-[var(--text-muted)] opacity-60">↩</span>
          </button>

          {/* ✏️ Edit (ONLY for User's own messages) */}
          {isUserMessage && (
            <button
              type="button"
              onClick={() => {
                onEdit(message);
                onClose();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold hover:bg-[var(--surface-hover)] text-[var(--text-primary)] transition-colors cursor-pointer group"
            >
              <span className="flex items-center gap-2.5">
                <Edit3 size={15} className="text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors" />
                <span>Edit</span>
              </span>
              <span className="text-[10px] text-[var(--text-muted)] opacity-60">✏️</span>
            </button>
          )}

          {/* 📋 Copy */}
          <button
            type="button"
            onClick={() => {
              onCopy(message);
              onClose();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold hover:bg-[var(--surface-hover)] text-[var(--text-primary)] transition-colors cursor-pointer group"
          >
            <span className="flex items-center gap-2.5">
              <Copy size={15} className="text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors" />
              <span>Copy</span>
            </span>
            <span className="text-[10px] text-[var(--text-muted)] opacity-60">📋</span>
          </button>

          {/* Subtle Divider */}
          <div className="my-1 border-t border-[var(--border-subtle)]" />

          {/* 🗑️ Delete */}
          <button
            type="button"
            onClick={() => {
              onDelete(message);
              onClose();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold hover:bg-rose-500/15 text-rose-500 transition-colors cursor-pointer group"
          >
            <span className="flex items-center gap-2.5">
              <Trash2 size={15} className="text-rose-500" />
              <span>Delete</span>
            </span>
            <span className="text-[10px] text-rose-400 opacity-60">🗑️</span>
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
