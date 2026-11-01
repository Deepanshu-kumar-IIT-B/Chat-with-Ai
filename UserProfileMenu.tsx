import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Edit3, 
  Trash2, 
  Sparkles, 
  Upload, 
  AlertTriangle,
  ArrowLeft,
  User,
  Bot
} from 'lucide-react';
import { useUserProfile } from './UserProfileContext';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=faces'
];

const NATURE_TAGS = [
  'Creative',
  'Calm',
  'Funny',
  'Curious',
  'Empathetic',
  'Analytical',
  'Outgoing',
  'Adventurous'
];

interface UserProfileMenuProps {
  onProfileDeleted?: () => void;
  onEditPersona?: () => void;
  compactMode?: boolean;
}

export const UserProfileMenu: React.FC<UserProfileMenuProps> = ({ 
  onProfileDeleted,
  onEditPersona,
  compactMode = false
}) => {
  const { userProfile, updateProfile, deleteProfile } = useUserProfile();
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'view' | 'edit' | 'delete'>('view');

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editAge, setEditAge] = useState<number>(24);
  const [editGender, setEditGender] = useState('Male');
  const [editNatureTags, setEditNatureTags] = useState<string[]>([]);
  const [editCustomNature, setEditCustomNature] = useState('');
  const [editPhotoUrl, setEditPhotoUrl] = useState<string | undefined>(undefined);
  const [editError, setEditError] = useState('');

  // Delete confirmation state
  const [alsoDeleteChats, setAlsoDeleteChats] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync edit state whenever user opens edit mode
  const openEditMode = () => {
    if (!userProfile) return;
    setEditName(userProfile.name);
    setEditAge(userProfile.age);
    setEditGender(userProfile.gender);
    setEditPhotoUrl(userProfile.photoUrl);
    setEditError('');

    // Parse nature tags vs custom nature
    const parts = userProfile.nature.split(',').map((s) => s.trim()).filter(Boolean);
    const matchedTags = parts.filter((p) => NATURE_TAGS.includes(p));
    const customParts = parts.filter((p) => !NATURE_TAGS.includes(p));
    setEditNatureTags(matchedTags);
    setEditCustomNature(customParts.join(', '));
    setViewMode('edit');
  };

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setViewMode('view');
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setViewMode('view');
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!userProfile) return null;

  const toggleNatureTag = (tag: string) => {
    if (editNatureTags.includes(tag)) {
      setEditNatureTags(editNatureTags.filter((t) => t !== tag));
    } else {
      setEditNatureTags([...editNatureTags, tag]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setEditError('Please select a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 240;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          setEditPhotoUrl(compressed);
          setEditError('');
        };
        img.src = reader.result;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      setEditError('Please enter your name');
      return;
    }
    if (!editAge || editAge < 10 || editAge > 120) {
      setEditError('Please enter a valid age between 10 and 120');
      return;
    }

    const tagsPart = editNatureTags.join(', ');
    const combinedNature = editCustomNature.trim()
      ? tagsPart
        ? `${tagsPart}, ${editCustomNature.trim()}`
        : editCustomNature.trim()
      : tagsPart || 'Friendly';

    updateProfile({
      name: editName.trim(),
      age: editAge,
      gender: editGender,
      nature: combinedNature,
      natureTags: editNatureTags,
      photoUrl: editPhotoUrl
    });

    setViewMode('view');
  };

  const handleConfirmDelete = () => {
    if (alsoDeleteChats) {
      // Clear all aura chat sessions from sessionStorage
      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith('aura_chat_')) {
          sessionStorage.removeItem(key);
        }
      });
    }
    deleteProfile();
    setIsOpen(false);
    setViewMode('view');
    if (onProfileDeleted) {
      onProfileDeleted();
    }
  };

  const natureChips = userProfile.nature
    ? userProfile.nature.split(',').map((s) => s.trim()).filter(Boolean)
    : ['Friendly'];

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      {/* Top Header User Profile Identity Button */}
      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => {
          setIsOpen(!isOpen);
          setViewMode('view');
        }}
        className={`flex items-center gap-2 sm:gap-2.5 p-1 sm:px-3 sm:py-1.5 rounded-2xl border transition-all cursor-pointer group ${
          isOpen
            ? 'bg-[var(--surface-secondary)] border-[var(--accent)] ring-2 ring-[var(--accent)]/30'
            : 'bg-[var(--surface-glass)] hover:bg-[var(--surface-hover)] border-[var(--border)] shadow-2xs'
        } backdrop-blur-md`}
        title="View your profile"
        aria-label="View your profile"
        aria-expanded={isOpen}
      >
        <div className="relative shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] overflow-hidden flex items-center justify-center text-[var(--accent)] font-bold shadow-2xs">
            {userProfile.photoUrl ? (
              <img
                src={userProfile.photoUrl}
                alt={userProfile.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs sm:text-sm">{userProfile.name.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[var(--surface)]" />
        </div>

        <div className="hidden xs:block sm:block text-left pr-1 max-w-[110px] sm:max-w-[140px]">
          <div className="text-xs font-black text-[var(--text-primary)] leading-tight truncate group-hover:text-[var(--accent)] transition-colors">
            {userProfile.name}
          </div>
          {!compactMode && (
            <div className="text-[10px] font-semibold text-[var(--text-muted)] truncate">
              {userProfile.age} yrs • {userProfile.gender}
            </div>
          )}
        </div>
      </motion.button>

      {/* Modern Floating Profile Card / Popover (Glass Blush) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-2 w-[calc(100vw-28px)] xs:w-80 sm:w-92 max-w-[360px] bg-[var(--surface)] backdrop-blur-2xl border border-[var(--border)] rounded-3xl shadow-2xl z-50 p-4 sm:p-5 text-[var(--text-primary)] origin-top-right overflow-hidden transition-colors"
          >
            {/* ================= VIEW MODE ================= */}
            {viewMode === 'view' && (
              <div className="space-y-4">
                {/* Popover Header */}
                <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                  <div className="flex items-center gap-1.5 text-xs font-black text-[var(--accent)] uppercase tracking-wider">
                    <User size={14} />
                    <span>Your Profile</span>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] transition-colors cursor-pointer"
                    title="Close"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Profile Identity Details */}
                <div className="flex items-center gap-3.5">
                  <div className="relative shrink-0">
                    <div className="w-16 h-16 rounded-2xl bg-[var(--surface-secondary)] border-2 border-[var(--border)] overflow-hidden flex items-center justify-center text-[var(--accent)] font-black text-xl shadow-xs">
                      {userProfile.photoUrl ? (
                        <img
                          src={userProfile.photoUrl}
                          alt={userProfile.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{userProfile.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[var(--surface)] shadow-2xs" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-black text-[var(--text-primary)] truncate tracking-tight">
                      {userProfile.name}
                    </h3>
                    <p className="text-xs font-bold text-[var(--text-muted)] mt-0.5">
                      {userProfile.age} years old • {userProfile.gender}
                    </p>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full mt-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Persona Synced
                    </span>
                  </div>
                </div>

                {/* Nature & Personality Traits */}
                <div className="bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-2xl p-3 space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--accent)] uppercase tracking-wider">
                    <Sparkles size={12} className="text-[var(--accent)]" />
                    <span>Nature & Vibe</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {natureChips.map((trait, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-xl bg-[var(--surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs font-bold shadow-2xs"
                      >
                        {trait}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Buttons: Edit Persona (if provided), Edit Profile & Delete Profile */}
                <div className="space-y-2 pt-1">
                  {onEditPersona && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setIsOpen(false);
                        onEditPersona();
                      }}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-primary)] text-xs font-bold transition-all shadow-2xs hover:border-[var(--accent)] cursor-pointer"
                    >
                      <Bot size={14} className="text-[var(--accent)]" />
                      <span>Edit Persona</span>
                    </motion.button>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={openEditMode}
                      className="btn-glass-blush flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      <Edit3 size={14} />
                      <span>Edit Profile</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setViewMode('delete')}
                      className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/25 text-xs font-bold transition-all cursor-pointer"
                    >
                      <Trash2 size={14} />
                      <span>Delete</span>
                    </motion.button>
                  </div>
                </div>
              </div>
            )}

            {/* ================= EDIT MODE ================= */}
            {viewMode === 'edit' && (
              <form onSubmit={handleSaveProfile} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
                <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                  <button
                    type="button"
                    onClick={() => setViewMode('view')}
                    className="flex items-center gap-1 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors cursor-pointer"
                  >
                    <ArrowLeft size={14} />
                    <span>Back</span>
                  </button>
                  <span className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wider">
                    Edit Profile
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      setViewMode('view');
                    }}
                    className="p-1 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                {editError && (
                  <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs font-semibold">
                    {editError}
                  </div>
                )}

                {/* Photo Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--text-secondary)] flex items-center justify-between">
                    <span>Profile Photo</span>
                    {editPhotoUrl && (
                      <button
                        type="button"
                        onClick={() => setEditPhotoUrl(undefined)}
                        className="text-[11px] text-rose-500 hover:underline cursor-pointer"
                      >
                        Remove Photo
                      </button>
                    )}
                  </label>

                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border)] overflow-hidden flex items-center justify-center text-[var(--accent)] font-bold shrink-0 shadow-2xs">
                      {editPhotoUrl ? (
                        <img src={editPhotoUrl} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <span>{editName ? editName.charAt(0).toUpperCase() : 'U'}</span>
                      )}
                    </div>

                    <div className="flex-1 space-y-1.5">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="btn-glass-blush-subtle w-full py-1.5 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Upload size={13} />
                        <span>Upload Photo</span>
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>
                  </div>

                  {/* Preset Avatars */}
                  <div className="pt-1">
                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                      Or Choose Preset
                    </span>
                    <div className="flex items-center gap-2 mt-1 overflow-x-auto no-scrollbar py-0.5">
                      {PRESET_AVATARS.map((url, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setEditPhotoUrl(url)}
                          className={`w-8 h-8 rounded-xl overflow-hidden shrink-0 border-2 transition-transform cursor-pointer ${
                            editPhotoUrl === url
                              ? 'border-purple-600 scale-105 shadow-xs'
                              : 'border-transparent hover:scale-105'
                          }`}
                        >
                          <img src={url} alt={`Preset ${i}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[var(--text-secondary)]">Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Your name"
                    required
                    className="input-glass-blush w-full px-3 py-2 rounded-xl text-xs font-semibold"
                  />
                </div>

                {/* Age & Gender */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[var(--text-secondary)]">Age</label>
                    <input
                      type="number"
                      min={10}
                      max={120}
                      value={editAge}
                      onChange={(e) => setEditAge(Number(e.target.value))}
                      required
                      className="input-glass-blush w-full px-3 py-2 rounded-xl text-xs font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[var(--text-secondary)]">Gender</label>
                    <select
                      value={editGender}
                      onChange={(e) => setEditGender(e.target.value)}
                      className="input-glass-blush w-full px-2.5 py-2 rounded-xl text-xs font-semibold"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>
                </div>

                {/* Nature Tags */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--text-secondary)]">Nature / Personality</label>
                  <div className="flex flex-wrap gap-1.5">
                    {NATURE_TAGS.map((tag) => {
                      const selected = editNatureTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleNatureTag(tag)}
                          className={`px-2 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                            selected
                              ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                              : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-[var(--accent)]'
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                  <input
                    type="text"
                    value={editCustomNature}
                    onChange={(e) => setEditCustomNature(e.target.value)}
                    placeholder="Add custom traits (comma separated)..."
                    className="input-glass-blush w-full px-3 py-1.5 rounded-xl text-xs mt-1"
                  />
                </div>

                {/* Save Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setViewMode('view')}
                    className="btn-glass-blush-subtle py-2 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-glass-blush py-2 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            )}

            {/* ================= DELETE CONFIRMATION MODE ================= */}
            {viewMode === 'delete' && (
              <div className="space-y-4">
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-3">
                  <AlertTriangle className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" size={18} />
                  <div>
                    <h4 className="text-xs font-black text-rose-700 dark:text-rose-300">Delete Profile?</h4>
                    <p className="text-[11px] text-rose-600/90 dark:text-rose-300/90 mt-0.5 leading-relaxed">
                      This removes your saved profile and resets you back to the profile setup screen.
                    </p>
                  </div>
                </div>

                {/* Optional chat history wipe */}
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-subtle)] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={alsoDeleteChats}
                    onChange={(e) => setAlsoDeleteChats(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-zinc-300"
                  />
                  <span className="text-xs font-semibold text-[var(--text-primary)]">
                    Also clear all conversation history
                  </span>
                </label>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setViewMode('view')}
                    className="btn-glass-blush-subtle py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Keep Profile
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    Confirm Delete
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
