import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Sparkles, 
  User, 
  Calendar, 
  Tag, 
  Activity, 
  MessageSquare,
  Smile,
  Edit3,
  Camera,
  Check,
  UploadCloud
} from 'lucide-react';
import { Persona } from './types';
import { getAvatarConfig, renderAvatarIcon, compressImageFile } from './avatarHelpers';
import { getPersonalityVibe } from './vibeHelpers';
import { renderTagIcon } from './tagsHelpers';
import { usePersonas } from './PersonaContext';

interface PersonaProfileDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  persona: Persona | null;
  onEditPersona?: (persona: Persona) => void;
}

export const PersonaProfileDetailsModal: React.FC<PersonaProfileDetailsModalProps> = ({
  isOpen,
  onClose,
  persona,
  onEditPersona
}) => {
  const { updatePersona } = usePersonas();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoUpdatedToast, setPhotoUpdatedToast] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');

  // Close on Escape key press
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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !persona) return;
    try {
      setUploadError('');
      const compressed = await compressImageFile(file, 320, 0.85);
      updatePersona(persona.id, {
        iconPath: compressed,
        photoUrl: compressed
      });
      setPhotoUpdatedToast(true);
      setTimeout(() => setPhotoUpdatedToast(false), 3000);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to update photo');
    }
    e.target.value = '';
  };

  if (!persona) return null;

  const avatar = getAvatarConfig(persona.avatarId);
  const vibe = getPersonalityVibe(persona.personality);
  const VibeIcon = vibe.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          id="persona-profile-details-backdrop"
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto cursor-pointer pt-safe pb-safe pl-safe pr-safe"
        >
          {/* Frosted Backdrop: current chat stays clearly visible behind */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-[var(--overlay)] backdrop-blur-md transition-colors"
            aria-hidden="true"
          />

          {/* Centered Floating Contact Card (Glass Blush) */}
          <motion.div
            id="persona-profile-details-card"
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: 'spring', damping: 25, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-[var(--surface)] backdrop-blur-2xl rounded-3xl sm:rounded-[2.5rem] border border-[var(--border)] shadow-2xl overflow-hidden z-10 text-[var(--text-primary)] my-auto max-h-[92vh] max-h-[92dvh] flex flex-col transition-colors cursor-default"
            role="dialog"
            aria-modal="true"
            aria-labelledby="persona-profile-details-name"
          >
            {/* Top Glass Blush Gradient Accent Ribbon */}
            <div className="h-2 w-full bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 shrink-0" />

            {/* Close Button */}
            <motion.button
              whileHover={{ rotate: 90, scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={onClose}
              id="persona-profile-close-btn"
              className="absolute top-4 right-4 p-2.5 rounded-full bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] transition-colors cursor-pointer z-20 shadow-2xs"
              title="Close contact details"
              aria-label="Close contact details"
            >
              <X size={18} />
            </motion.button>

            {/* Scrollable Modal Body */}
            <div className="p-6 sm:p-7 overflow-y-auto space-y-5 no-scrollbar">
              {/* Hidden File Input for Gallery Photo Selection */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                id="persona-details-photo-input"
              />

              {/* Header Profile Identity: Large Avatar & Name */}
              <div className="flex flex-col items-center text-center pt-2">
                <div className="relative mb-3.5 group">
                  {/* Outer Ambient Ring */}
                  <div className="absolute -inset-1 rounded-[2rem] bg-gradient-to-tr from-purple-500/25 to-pink-500/25 blur-sm opacity-70 group-hover:opacity-100 transition-opacity" />

                  {/* Large Avatar Container */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    title="Click to choose photo from gallery"
                    className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-[1.8rem] flex items-center justify-center shadow-lg border-2 border-[var(--border)] overflow-hidden transition-transform duration-300 group-hover:scale-105 cursor-pointer ${
                      persona.photoUrl || persona.iconPath
                        ? 'bg-[var(--surface-secondary)] p-1'
                        : avatar.colorClass
                    }`}
                  >
                    {persona.photoUrl || persona.iconPath ? (
                      <img
                        src={persona.photoUrl || persona.iconPath}
                        alt={persona.name}
                        className="w-full h-full object-cover rounded-[1.5rem]"
                      />
                    ) : (
                      renderAvatarIcon(avatar.iconId, 48)
                    )}

                    {/* Hover Overlay with Camera Icon */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1 backdrop-blur-2xs">
                      <Camera size={20} />
                      <span className="text-[10px] font-bold tracking-tight">Gallery</span>
                    </div>
                  </div>

                  {/* Camera Quick Button Badge */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="absolute -bottom-1 -left-1 p-2 rounded-2xl bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--accent)] border border-[var(--border-subtle)] shadow-md transition-all cursor-pointer hover:scale-110"
                    title="Choose photo from gallery"
                    aria-label="Choose photo from gallery"
                  >
                    <Camera size={14} />
                  </button>

                  {/* Online Status Pill Badge */}
                  <span className="absolute -bottom-1 -right-1 flex items-center gap-1 bg-[var(--surface)] px-2.5 py-0.5 rounded-full border border-[var(--border-subtle)] shadow-xs">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                    </span>
                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 tracking-wide uppercase">
                      Active
                    </span>
                  </span>
                </div>

                {photoUpdatedToast && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mb-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold shadow-2xs"
                  >
                    <Check size={12} strokeWidth={2.5} />
                    <span>Photo updated from gallery</span>
                  </motion.div>
                )}

                {uploadError && (
                  <div className="mb-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold">
                    <span>{uploadError}</span>
                  </div>
                )}

                {/* Persona Name & Vibe */}
                <h3
                  id="persona-profile-details-name"
                  className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight mt-1"
                >
                  {persona.name}
                </h3>

                <div className="flex items-center gap-2 mt-1.5 flex-wrap justify-center">
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold shadow-2xs ${vibe.colorClass}`}
                  >
                    <VibeIcon size={12} />
                    <span>{vibe.trait} Vibe</span>
                  </div>
                  <span className="text-xs font-semibold text-[var(--text-muted)]">
                    AI Companion
                  </span>
                </div>
              </div>

              {/* Quick Info Grid: Age, Gender, Status */}
              <div className="grid grid-cols-3 gap-2.5 pt-1">
                {/* Age Card */}
                <div className="bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-2xl p-3 flex flex-col items-center text-center shadow-2xs transition-colors">
                  <Calendar size={15} className="text-[var(--accent)] mb-1" />
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                    Age
                  </span>
                  <span className="text-sm font-black text-[var(--text-primary)] mt-0.5">
                    {persona.age} yrs
                  </span>
                </div>

                {/* Gender Card */}
                <div className="bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-2xl p-3 flex flex-col items-center text-center shadow-2xs transition-colors">
                  <User size={15} className="text-[var(--accent)] mb-1" />
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                    Gender
                  </span>
                  <span className="text-sm font-black text-[var(--text-primary)] mt-0.5 truncate max-w-full">
                    {persona.gender}
                  </span>
                </div>

                {/* Status Card */}
                <div className="bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-2xl p-3 flex flex-col items-center text-center shadow-2xs transition-colors">
                  <Activity size={15} className="text-emerald-500 mb-1" />
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                    Status
                  </span>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                    Online
                  </span>
                </div>
              </div>

              {/* Personality / Nature / Bio Section */}
              <div className="bg-[var(--surface-secondary)]/70 border border-[var(--border-subtle)] rounded-2xl p-4 space-y-2 transition-colors">
                <div className="flex items-center gap-1.5 text-xs font-black text-[var(--accent)] uppercase tracking-wider">
                  <Sparkles size={14} className="text-[var(--accent)]" />
                  <span>Personality & Nature</span>
                </div>
                <p className="text-xs sm:text-sm text-[var(--text-primary)] leading-relaxed font-medium">
                  {persona.personality || 'Friendly, empathetic, and ready to chat anytime.'}
                </p>
              </div>

              {/* Tags & Attributes Section */}
              {persona.tags && persona.tags.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-black text-[var(--accent)] uppercase tracking-wider px-1">
                    <Tag size={13} />
                    <span>Specialties & Attributes</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {persona.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs font-bold shadow-2xs hover:border-[var(--accent)]/50 transition-colors"
                      >
                        {renderTagIcon(tag, 13) || <Smile size={13} className="text-[var(--accent)]" />}
                        <span>{tag}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom Actions: Edit Persona and Return to Chat */}
              <div className="pt-2 space-y-2">
                {onEditPersona && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      onClose();
                      onEditPersona(persona);
                    }}
                    className="w-full py-2.5 px-4 rounded-2xl bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-primary)] text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-2xs hover:border-[var(--accent)] transition-all cursor-pointer"
                  >
                    <Edit3 size={15} className="text-[var(--accent)]" />
                    <span>Edit Persona</span>
                  </motion.button>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className="btn-glass-blush w-full py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <MessageSquare size={16} />
                  <span>Continue Chatting</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
