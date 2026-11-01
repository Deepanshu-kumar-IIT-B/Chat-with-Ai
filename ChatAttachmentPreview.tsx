import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Film, Music, File } from 'lucide-react';
import { ChatAttachment } from './types';

interface ChatAttachmentPreviewProps {
  attachments: ChatAttachment[];
  onRemove: (id: string) => void;
}

export const formatFileSize = (bytes?: number) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const ChatAttachmentPreview: React.FC<ChatAttachmentPreviewProps> = ({
  attachments,
  onRemove
}) => {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-2 px-1">
      <AnimatePresence>
        {attachments.map((att) => {
          const isImage = att.type === 'image';
          const isVideo = att.type === 'video';
          const isAudio = att.type === 'audio';

          return (
            <motion.div
              key={att.id}
              initial={{ opacity: 0, scale: 0.85, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 6 }}
              transition={{ duration: 0.15 }}
              className="relative shrink-0 group"
            >
              {isImage ? (
                /* Image thumbnail preview */
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-[var(--border)] bg-[var(--surface-secondary)] shadow-sm">
                  <img
                    src={att.url}
                    alt={att.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/15 group-hover:bg-black/30 transition-colors" />
                </div>
              ) : (
                /* Document / Video / Audio file preview card */
                <div className="h-16 sm:h-20 px-3.5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] flex items-center gap-2.5 shadow-sm max-w-[200px]">
                  <div className="w-9 h-9 rounded-xl bg-[var(--surface-secondary)] text-[var(--accent)] flex items-center justify-center shrink-0">
                    {isVideo ? (
                      <Film size={18} />
                    ) : isAudio ? (
                      <Music size={18} />
                    ) : att.name.endsWith('.pdf') ? (
                      <FileText size={18} className="text-rose-500" />
                    ) : (
                      <File size={18} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                      {att.name}
                    </p>
                    {att.size && (
                      <span className="text-[10px] font-semibold text-[var(--text-muted)]">
                        {formatFileSize(att.size)}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Remove attachment button */}
              <button
                type="button"
                onClick={() => onRemove(att.id)}
                className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-[var(--surface)] text-[var(--text-muted)] hover:text-rose-500 border border-[var(--border)] shadow-xs flex items-center justify-center cursor-pointer transition-transform hover:scale-110 z-10"
                title={`Remove ${att.name}`}
                aria-label={`Remove ${att.name}`}
              >
                <X size={12} strokeWidth={2.5} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
