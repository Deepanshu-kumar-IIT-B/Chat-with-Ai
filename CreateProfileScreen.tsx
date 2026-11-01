import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Camera, Check, User, ArrowRight, X } from 'lucide-react';
import { UserProfile } from './types';
import { useUserProfile } from './UserProfileContext';
import { ThemeToggle } from './ThemeContext';

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

export const CreateProfileScreen: React.FC = () => {
  const { saveProfile } = useUserProfile();

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other' | 'Prefer not to say'>('Prefer not to say');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Creative', 'Curious']);
  const [customNature, setCustomNature] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file.');
      return;
    }

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
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          setPhotoUrl(compressed);
          setErrorMsg('');
        };
        img.src = reader.result;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Please enter your name.');
      return;
    }
    const ageNum = parseInt(age, 10);
    if (!age.trim() || isNaN(ageNum) || ageNum <= 0 || ageNum > 120) {
      setErrorMsg('Please enter a valid age.');
      return;
    }

    const tagsDescription = selectedTags.join(', ');
    const fullNature = customNature.trim() 
      ? (tagsDescription ? `${tagsDescription}. ${customNature.trim()}` : customNature.trim())
      : (tagsDescription || 'Friendly and thoughtful');

    const profile: UserProfile = {
      name: name.trim(),
      age: ageNum,
      gender,
      nature: fullNature,
      natureTags: selectedTags,
      photoUrl
    };

    saveProfile(profile);
  };

  const isFormValid = name.trim().length > 0 && age.trim().length > 0 && !isNaN(parseInt(age, 10));

  return (
    <div className="min-h-screen min-h-[100dvh] w-full bg-[var(--bg)] flex flex-col justify-center items-center px-3.5 py-6 sm:p-6 md:p-10 font-sans text-[var(--text-primary)] relative overflow-x-hidden transition-colors duration-300 pt-safe pb-safe pl-safe pr-safe">
      {/* Ambient background glow blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="ambient-blob w-[360px] sm:w-[520px] h-[360px] sm:h-[520px] -top-32 -left-20 bg-gradient-to-br from-pink-300/40 via-purple-300/30 to-transparent dark:from-purple-900/30 dark:via-pink-900/15" />
        <div className="ambient-blob w-[400px] sm:w-[620px] h-[400px] sm:h-[620px] top-1/4 -right-40 bg-gradient-to-bl from-purple-300/35 via-blue-200/25 to-transparent dark:from-violet-900/25 dark:via-blue-950/20" />
      </div>

      {/* Top right theme switcher */}
      <div className="absolute top-4 right-4 sm:top-5 sm:right-5 z-20">
        <ThemeToggle compact />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-2xl bg-[var(--surface)] backdrop-blur-2xl border border-[var(--border)] rounded-3xl sm:rounded-[2.5rem] shadow-2xl p-5 sm:p-10 my-auto text-[var(--text-primary)]"
      >
        {/* Header Branding */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] text-[var(--accent)] text-xs font-bold uppercase tracking-wider mb-3 shadow-2xs backdrop-blur-xs"
          >
            <Sparkles size={14} className="text-[var(--accent)] animate-pulse" />
            <span>Welcome to Persona Hub</span>
          </motion.div>
          <h1 className="text-3xl sm:text-4xl font-black text-[var(--text-primary)] tracking-tight">
            Create Your Profile
          </h1>
          <p className="text-[var(--text-muted)] mt-2 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
            Tell your AI companions who you are so they can connect with you naturally and personally.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Photo Section */}
          <div className="flex flex-col items-center">
            <span className="text-xs font-bold text-[var(--accent)] uppercase tracking-wider mb-3">
              Profile Photo (Optional)
            </span>
            <div className="relative group">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-[var(--surface-secondary)] border-2 border-dashed border-[var(--border)] group-hover:border-[var(--accent)] flex items-center justify-center overflow-hidden shadow-inner transition-colors">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt="Profile preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={40} className="text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors" />
                )}
              </div>

              {photoUrl && (
                <button
                  type="button"
                  onClick={() => setPhotoUrl(undefined)}
                  className="absolute -top-2 -right-2 p-1.5 bg-rose-500 text-white rounded-full shadow-md hover:bg-rose-600 transition-transform active:scale-95 cursor-pointer"
                  title="Remove photo"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Gallery Upload Button */}
            <div className="mt-3 flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="gallery-file-input"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-glass-blush-subtle inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold cursor-pointer shadow-2xs"
              >
                <Camera size={16} />
                <span>Choose from Gallery</span>
              </button>
            </div>

            {/* Quick Preset Avatars */}
            <div className="mt-3 flex items-center gap-2">
              <span className="text-[11px] text-[var(--text-muted)] font-medium">Or pick an avatar:</span>
              <div className="flex items-center gap-1.5">
                {PRESET_AVATARS.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setPhotoUrl(url)}
                    className={`w-7 h-7 rounded-full overflow-hidden border-2 transition-transform hover:scale-110 cursor-pointer ${
                      photoUrl === url ? 'border-purple-600 ring-2 ring-purple-500/30' : 'border-transparent'
                    }`}
                  >
                    <img src={url} alt={`Avatar option ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Name & Age Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="user-name-input" className="block text-xs font-bold text-[var(--accent)] uppercase tracking-wider mb-2">
                Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="user-name-input"
                type="text"
                required
                placeholder="e.g. Deepanshu"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                className="input-glass-blush w-full px-4 py-3 rounded-2xl text-sm sm:text-base font-semibold"
              />
            </div>

            <div>
              <label htmlFor="user-age-input" className="block text-xs font-bold text-[var(--accent)] uppercase tracking-wider mb-2">
                Age <span className="text-rose-500">*</span>
              </label>
              <input
                id="user-age-input"
                type="number"
                min="1"
                max="120"
                required
                placeholder="e.g. 24"
                value={age}
                onChange={(e) => {
                  setAge(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                className="input-glass-blush w-full px-4 py-3 rounded-2xl text-sm sm:text-base font-semibold"
              />
            </div>
          </div>

          {/* Gender Segmented Selection */}
          <div>
            <label className="block text-xs font-bold text-[var(--accent)] uppercase tracking-wider mb-2">
              Gender
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['Male', 'Female', 'Other', 'Prefer not to say'] as const).map((g) => {
                const isSelected = gender === g;
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer text-center ${
                      isSelected
                        ? 'bg-purple-600 text-white border-purple-600 shadow-sm shadow-purple-600/20'
                        : 'bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] border-[var(--border-subtle)]'
                    }`}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nature: Selectable Tags + Custom Text */}
          <div>
            <label className="block text-xs font-bold text-[var(--accent)] uppercase tracking-wider mb-2">
              Nature & Personality Traits
            </label>
            <p className="text-xs text-[var(--text-muted)] mb-3">
              Select traits that match your vibe or write your own. Your companions will naturally adjust to your energy.
            </p>

            {/* Selectable tags */}
            <div className="flex flex-wrap gap-2 mb-3">
              {DEFAULT_NATURE_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagToggle(tag)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                        : 'bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] border-[var(--border-subtle)] text-[var(--text-secondary)]'
                    }`}
                  >
                    {isSelected && <Check size={12} className="text-white" />}
                    <span>{tag}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Nature Text Input */}
            <input
              type="text"
              placeholder="Add more details about yourself (e.g. loves late-night talks, music enthusiast, calm listener)..."
              value={customNature}
              onChange={(e) => setCustomNature(e.target.value)}
              className="input-glass-blush w-full px-4 py-2.5 rounded-xl text-xs sm:text-sm"
            />
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Continue / Create Profile Button */}
          <motion.button
            type="submit"
            disabled={!isFormValid}
            whileHover={isFormValid ? { scale: 1.01 } : {}}
            whileTap={isFormValid ? { scale: 0.99 } : {}}
            className={`w-full py-3.5 px-6 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-md transition-all ${
              isFormValid
                ? 'btn-glass-blush cursor-pointer'
                : 'bg-[var(--surface-secondary)] text-[var(--text-muted)] cursor-not-allowed shadow-none border border-[var(--border-subtle)]'
            }`}
          >
            <span>Continue to Persona Hub</span>
            <ArrowRight size={18} />
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};
