import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Edit3, Trash2, X, AlertTriangle, Sparkles, Check, Bot } from 'lucide-react';
import { useUserProfile } from './UserProfileContext';
import { UserProfile } from './types';

const DEFAULT_NATURE_TAGS = [
  'Introverted',
  'Extroverted',
  'Creative',
  'Curious',
  'Calm & Grounded',
  'Humorous',
  'Empathetic',
  'Adventurous',
  'Analytical',
  'Warm-hearted',
  'Deep Thinker',
  'Optimistic'
];

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
];

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileDeleted?: () => void;
  onEditPersona?: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  onProfileDeleted,
  onEditPersona
}) => {
  const { userProfile, saveProfile, deleteProfile } = useUserProfile();

  const [mode, setMode] = useState<'view' | 'edit' | 'delete-confirm'>('view');

  // Edit form state
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<UserProfile['gender']>('Prefer not to say');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customNature, setCustomNature] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [editError, setEditError] = useState('');

  // Delete state
  const [alsoDeleteChats, setAlsoDeleteChats] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when modal opens or profile changes
  useEffect(() => {
    if (userProfile && isOpen) {
      setName(userProfile.name);
      setAge(String(userProfile.age));
      setGender(userProfile.gender);
      setSelectedTags(userProfile.natureTags || []);
      setCustomNature(userProfile.nature || '');
      setPhotoUrl(userProfile.photoUrl);
      setMode('view');
      setAlsoDeleteChats(false);
      setEditError('');
    }
  }, [userProfile, isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (mode === 'edit' || mode === 'delete-confirm') {
          setMode('view');
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, mode, onClose]);

  if (!isOpen || !userProfile) return null;

  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 320;
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
          setPhotoUrl(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.src = reader.result;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setEditError('Please enter your name.');
      return;
    }
    const ageNum = parseInt(age, 10);
    if (!age.trim() || isNaN(ageNum) || ageNum <= 0) {
      setEditError('Please enter a valid age.');
      return;
    }

    const tagsDescription = selectedTags.join(', ');
    const fullNature = customNature.trim() || tagsDescription || 'Friendly and thoughtful';

    saveProfile({
      name: name.trim(),
      age: ageNum,
      gender,
      nature: fullNature,
      natureTags: selectedTags,
      photoUrl
    });

    setMode('view');
  };

  const handleConfirmDelete = () => {
    deleteProfile(alsoDeleteChats);
    onClose();
    if (onProfileDeleted) {
      onProfileDeleted();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto pt-safe pb-safe pl-safe pr-safe"
      onClick={(e) => {
        // Clicking outside the modal closes it
        if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
          onClose();
        }
      }}
    >
      <motion.div
        ref={modalRef}
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="w-full max-w-lg bg-white dark:bg-[#111528] rounded-3xl sm:rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-purple-900/30 overflow-hidden text-zinc-900 dark:text-zinc-100 my-auto max-h-[92vh] max-h-[92dvh] overflow-y-auto"
      >
        {/* ==================== VIEW MODE ==================== */}
        {mode === 'view' && (
          <div className="p-6 sm:p-8">
            {/* Modal Top Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
                <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">
                  User Profile
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Profile Hero / Avatar */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pt-6 pb-6">
              <div className="relative shrink-0">
                <div className="w-24 h-24 sm:w-26 sm:h-26 rounded-3xl bg-purple-100 border-2 border-purple-200 overflow-hidden flex items-center justify-center text-purple-700 font-black text-3xl shadow-md">
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
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white" />
                </span>
              </div>

              <div className="flex-1 text-center sm:text-left min-w-0">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight truncate">
                    {userProfile.name}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-50 border border-purple-200/80 text-purple-700 text-xs font-bold">
                    User
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2 text-xs sm:text-sm text-zinc-500 font-semibold">
                  <span>{userProfile.age} years old</span>
                  <span className="text-zinc-300">•</span>
                  <span>{userProfile.gender}</span>
                  <span className="text-zinc-300">•</span>
                  <span className="text-emerald-600 font-bold">Ready to chat</span>
                </div>
              </div>
            </div>

            {/* Complete Profile Details Cards */}
            <div className="space-y-3 mb-6">
              {/* Nature & Personality Traits */}
              <div className="bg-zinc-50 border border-zinc-100/90 rounded-2xl p-4">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                  <Sparkles size={13} className="text-purple-600" />
                  <span>Nature & Personality</span>
                </div>
                <p className="text-sm text-zinc-800 font-medium leading-relaxed">
                  {userProfile.nature || 'Friendly, curious, and thoughtful.'}
                </p>

                {userProfile.natureTags && userProfile.natureTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-zinc-200/60">
                    {userProfile.natureTags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 rounded-full bg-white border border-purple-200 text-purple-800 text-xs font-semibold shadow-2xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons: Edit Persona (optional), Edit Profile & Delete Profile */}
            <div className="space-y-3 pt-2">
              {onEditPersona && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEditPersona();
                  }}
                  className="w-full py-3 px-4 rounded-2xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
                >
                  <Bot size={16} className="text-purple-600" />
                  <span>Edit Persona</span>
                </button>
              )}

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMode('edit')}
                  className="py-3 px-4 rounded-2xl bg-zinc-900 hover:bg-purple-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer hover:shadow-md"
                >
                  <Edit3 size={16} />
                  <span>Edit Profile</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('delete-confirm')}
                  className="py-3 px-4 rounded-2xl bg-white hover:bg-rose-50 border border-rose-200 text-rose-600 font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Trash2 size={16} />
                  <span>Delete Profile</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== EDIT MODE ==================== */}
        {mode === 'edit' && (
          <form onSubmit={handleSaveEdit} className="p-6 sm:p-8">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-zinc-100">
              <div>
                <h2 className="text-xl font-black text-zinc-900 tracking-tight">Edit Profile</h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Update your details. Personas will immediately adapt to your changes.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMode('view')}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5">
              {/* Photo Upload / Change */}
              <div className="flex items-center gap-4">
                <div className="w-18 h-18 rounded-2xl bg-zinc-100 border border-zinc-200 overflow-hidden flex items-center justify-center text-zinc-400 font-bold shrink-0">
                  {photoUrl ? (
                    <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User size={30} />
                  )}
                </div>

                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-purple-50 hover:text-purple-700 text-zinc-700 text-xs font-bold border border-zinc-200 transition-colors cursor-pointer"
                    >
                      Change Photo
                    </button>
                    {photoUrl && (
                      <button
                        type="button"
                        onClick={() => setPhotoUrl(undefined)}
                        className="px-2.5 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  {/* Quick Presets */}
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="text-[10px] text-zinc-400 font-medium">Presets:</span>
                    {PRESET_AVATARS.map((url, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setPhotoUrl(url)}
                        className="w-6 h-6 rounded-full overflow-hidden border border-zinc-200 hover:scale-110 transition-transform cursor-pointer"
                      >
                        <img src={url} alt={`Preset ${i}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Name & Age Fields */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 text-sm font-semibold outline-none focus:bg-white focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                    Age *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    required
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 text-sm font-semibold outline-none focus:bg-white focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Gender Selection */}
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                  Gender
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['Male', 'Female', 'Other', 'Prefer not to say'] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                        gender === g
                          ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                          : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nature Traits */}
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                  Nature & Vibe
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {DEFAULT_NATURE_TAGS.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleTagToggle(tag)}
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold border cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-purple-100 text-purple-900 border-purple-300'
                            : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  placeholder="Custom vibe or extra traits..."
                  value={customNature}
                  onChange={(e) => setCustomNature(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs sm:text-sm font-medium outline-none focus:bg-white focus:border-purple-500"
                />
              </div>

              {editError && (
                <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 text-xs font-bold">
                  {editError}
                </div>
              )}

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setMode('view')}
                  className="px-4 py-2 text-xs sm:text-sm font-bold text-zinc-500 hover:text-zinc-800 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-bold shadow-md transition-colors cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ==================== DELETE CONFIRMATION MODE ==================== */}
        {mode === 'delete-confirm' && (
          <div className="p-6 sm:p-8">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center mb-4">
              <AlertTriangle size={24} />
            </div>

            <h2 className="text-xl font-black text-zinc-900 tracking-tight mb-2">
              Delete Profile?
            </h2>

            <p className="text-sm text-zinc-600 leading-relaxed mb-5">
              Are you sure you want to delete your profile for <strong className="text-zinc-900">{userProfile.name}</strong>?
              This will remove your saved details and return you to the initial Profile Setup screen.
            </p>

            {/* Separate chat history confirmation checkbox */}
            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 mb-6">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={alsoDeleteChats}
                  onChange={(e) => setAlsoDeleteChats(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-rose-600 rounded border-zinc-300 focus:ring-rose-500 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-zinc-900 block">
                    Also delete all persona chat histories
                  </span>
                  <span className="text-[11px] text-zinc-500 leading-normal block mt-0.5">
                    By default, your chat history is preserved safely so you won't lose conversations with your companions.
                  </span>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setMode('view')}
                className="px-4 py-2.5 text-xs sm:text-sm font-bold text-zinc-600 hover:text-zinc-900 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 size={15} />
                <span>Yes, Delete Profile</span>
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
