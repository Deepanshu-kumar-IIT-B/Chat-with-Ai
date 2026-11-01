import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Sparkles, 
  Edit2, 
  Check, 
  User, 
  Hash, 
  Smile, 
  Camera,
  UploadCloud,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { usePersonas } from './PersonaContext';
import { predefinedAvatars, compressImageFile } from './avatarHelpers';
import { AVAILABLE_TAGS } from './tagsHelpers';
import { getPersonalityVibe } from './vibeHelpers';
import { Persona } from './types';

interface PersonaModalProps {
  isOpen: boolean;
  onClose: () => void;
  personaToEdit?: Persona | null;
}

const PERSONALITY_SUGGESTIONS = [
  'Empathetic & supportive',
  'Analytical & logical thinker',
  'Witty, energetic & adventurous',
  'Calm, philosophical & reflective',
  'Artistic, imaginative dreamer',
];

export const PersonaModal: React.FC<PersonaModalProps> = ({ isOpen, onClose, personaToEdit }) => {
  const { addPersona, updatePersona } = usePersonas();
  const [name, setName] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [gender, setGender] = useState('');
  const [personality, setPersonality] = useState('');
  const [avatarId, setAvatarId] = useState(predefinedAvatars[0].id);
  const [iconPath, setIconPath] = useState<string | undefined>(undefined);
  const [customPhoto, setCustomPhoto] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setUploadError('');
      setIsDragging(false);
      if (personaToEdit) {
        setName(personaToEdit.name);
        setAge(personaToEdit.age);
        setGender(personaToEdit.gender);
        setPersonality(personaToEdit.personality);
        setAvatarId(personaToEdit.avatarId || predefinedAvatars[0].id);
        const existingPhoto = personaToEdit.photoUrl || personaToEdit.iconPath;
        setCustomPhoto(existingPhoto || null);
        setIconPath(existingPhoto || undefined);
        setTags(personaToEdit.tags || []);
      } else {
        setName('');
        setAge('');
        setGender('');
        setPersonality('');
        setAvatarId(predefinedAvatars[0].id);
        setCustomPhoto(null);
        setIconPath(undefined);
        setTags([]);
      }
    }
  }, [isOpen, personaToEdit]);

  const toggleTag = (tagId: string) => {
    setTags(prev => prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]);
  };

  const handlePhotoSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }
    try {
      setUploadError('');
      const compressed = await compressImageFile(file, 320, 0.85);
      setCustomPhoto(compressed);
      setIconPath(compressed);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to process selected image.');
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handlePhotoSelect(file);
    }
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handlePhotoSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleRemovePhoto = () => {
    setCustomPhoto(null);
    setIconPath(undefined);
    setUploadError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !age || !gender.trim() || !personality.trim()) return;

    const fallbackPhoto = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name.trim())}&backgroundColor=8b5cf6,ec4899`;
    const resolvedPhoto = customPhoto || iconPath || fallbackPhoto;
    const personaData = {
      name: name.trim(),
      age: Number(age),
      gender: gender.trim(),
      personality: personality.trim(),
      avatarId: customPhoto || iconPath ? undefined : avatarId,
      iconPath: resolvedPhoto,
      photoUrl: resolvedPhoto,
      tags
    };

    if (personaToEdit) {
      updatePersona(personaToEdit.id, personaData);
    } else {
      addPersona(personaData);
    }

    onClose();
  };

  const appendSuggestion = (sug: string) => {
    if (!personality) {
      setPersonality(sug);
    } else if (!personality.includes(sug)) {
      setPersonality(prev => `${prev}, ${sug.toLowerCase()}`);
    }
  };

  const detectedVibe = personality ? getPersonalityVibe(personality) : null;
  const DetectedIcon = detectedVibe?.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto pt-safe pb-safe pl-safe pr-safe">
          {/* Animated Glass Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[var(--overlay)] backdrop-blur-md"
          />

          {/* Modal Container (Glass Blush) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 25 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 15 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.25 }}
            className="relative w-full max-w-xl bg-[var(--surface)] backdrop-blur-2xl rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-8 shadow-2xl border border-[var(--border)] z-10 max-h-[92vh] max-h-[92dvh] overflow-y-auto text-[var(--text-primary)] transition-colors my-auto"
          >
            {/* Top gradient accent line */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-violet-600 via-purple-600 to-pink-500" />
            
            <motion.button 
              whileHover={{ rotate: 90, scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="absolute top-6 right-6 p-2.5 rounded-full bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] transition-colors shadow-2xs cursor-pointer"
              aria-label="Close modal"
            >
              <X size={18} />
            </motion.button>

            {/* Header */}
            <div className="mb-7">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 bg-[var(--surface-secondary)] border border-[var(--border)] rounded-2xl text-[var(--accent)] shadow-2xs">
                  {personaToEdit ? <Edit2 size={22} /> : <Sparkles size={22} />}
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
                    {personaToEdit ? 'Edit Persona' : 'Create Persona'}
                  </h2>
                  <p className="text-[var(--text-muted)] text-sm mt-0.5">
                    {personaToEdit ? "Update your companion's voice and attributes." : 'Bring a new AI companion to life with a custom personality.'}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Avatar Picker - Gallery Image Option Only */}
              <div className="p-4 sm:p-5 bg-[var(--surface-secondary)] rounded-3xl border border-[var(--border-subtle)] space-y-4">
                {/* Header with live active avatar preview */}
                <div className="flex items-center justify-between flex-wrap gap-2.5">
                  <div className="flex items-center gap-3">
                    {/* Live Preview Avatar */}
                    <div className="relative w-12 h-12 rounded-2xl overflow-hidden border-2 border-[var(--accent)]/50 shadow-md flex items-center justify-center shrink-0 bg-[var(--surface)]">
                      {customPhoto || iconPath ? (
                        <img
                          src={customPhoto || iconPath}
                          alt="Active persona avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-purple-500/20 via-pink-500/20 to-indigo-500/20 text-[var(--accent)]">
                          <Camera size={22} />
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-black uppercase tracking-wider text-[var(--text-primary)] block">
                        Persona Profile Photo
                      </label>
                      <span className="text-[11px] text-[var(--text-muted)] font-medium">
                        {customPhoto || iconPath ? 'Custom photo from device gallery' : 'Upload custom photo from gallery'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Gallery Badge */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--surface-glass)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--accent)] shadow-2xs">
                    <Camera size={13} />
                    <span>Gallery</span>
                  </div>
                </div>

                {/* Hidden File Input for Gallery */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                  id="persona-gallery-file-input"
                />

                {/* Choose from Gallery Photo */}
                <div className="space-y-3">
                  {customPhoto || iconPath ? (
                    <div className="flex items-center justify-between p-3.5 bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-purple-500 shadow-md shrink-0">
                          <img
                            src={customPhoto || iconPath}
                            alt="Custom chosen photo"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-1 right-1 bg-purple-600 text-white rounded-full p-0.5 shadow-2xs">
                            <Check size={10} strokeWidth={3} />
                          </div>
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-[var(--text-primary)] truncate">Photo Selected from Gallery</h4>
                          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Optimized for high-resolution chat avatars</p>
                          <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            <Check size={10} /> Active Profile Photo
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="btn-glass-blush text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs hover:scale-102 transition-transform"
                        >
                          <Camera size={13} />
                          <span>Change</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="text-xs font-semibold text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 p-1.5 rounded-xl transition-colors cursor-pointer"
                          title="Remove photo"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      className={`border-2 border-dashed rounded-2xl p-6 sm:p-7 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                        isDragging
                          ? 'border-[var(--accent)] bg-[var(--accent)]/10 scale-101'
                          : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] hover:border-[var(--accent)]/60'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-2xl bg-[var(--surface-secondary)] text-[var(--accent)] border border-[var(--border)] flex items-center justify-center mb-3 shadow-2xs">
                        <UploadCloud size={24} />
                      </div>
                      <h4 className="text-sm font-bold text-[var(--text-primary)]">
                        Choose Photo from Gallery
                      </h4>
                      <p className="text-xs text-[var(--text-muted)] mt-1 max-w-xs leading-relaxed">
                        Click to browse device photos or drag & drop an image here
                      </p>
                      <div className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-subtle)] text-[11px] font-semibold text-[var(--text-secondary)]">
                        <Camera size={13} className="text-[var(--accent)]" />
                        <span>Supports JPG, PNG, WebP or GIF</span>
                      </div>
                    </div>
                  )}

                  {uploadError && (
                    <p className="text-xs text-rose-500 font-semibold flex items-center gap-1.5 px-1">
                      <AlertCircle size={14} />
                      <span>{uploadError}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Name Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--accent)] mb-1.5 ml-1">
                  Persona Name
                </label>
                <div className="relative flex items-center rounded-2xl bg-[var(--input-bg)] border border-[var(--border)] focus-within:border-[var(--accent)] focus-within:ring-4 focus-within:ring-purple-500/20 transition-all shadow-2xs">
                  <div className="pl-4 text-[var(--text-muted)]">
                    <User size={18} />
                  </div>
                  <input 
                    type="text" 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Luna or Orion"
                    className="w-full bg-transparent px-3 py-3.5 outline-none font-semibold text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm sm:text-base"
                    required
                  />
                </div>
              </div>

              {/* Age & Gender 2-Column Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--accent)] mb-1.5 ml-1">
                    Age
                  </label>
                  <div className="relative flex items-center rounded-2xl bg-[var(--input-bg)] border border-[var(--border)] focus-within:border-[var(--accent)] focus-within:ring-4 focus-within:ring-purple-500/20 transition-all shadow-2xs">
                    <div className="pl-4 text-[var(--text-muted)]">
                      <Hash size={18} />
                    </div>
                    <input 
                      type="number" 
                      min="1"
                      max="999"
                      value={age}
                      onChange={e => setAge(e.target.value ? Number(e.target.value) : '')}
                      placeholder="e.g. 24"
                      className="w-full bg-transparent px-3 py-3.5 outline-none font-semibold text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm sm:text-base"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--accent)] mb-1.5 ml-1">
                    Gender
                  </label>
                  <div className="relative flex items-center rounded-2xl bg-[var(--input-bg)] border border-[var(--border)] focus-within:border-[var(--accent)] focus-within:ring-4 focus-within:ring-purple-500/20 transition-all shadow-2xs">
                    <div className="pl-4 text-[var(--text-muted)]">
                      <Smile size={18} />
                    </div>
                    <input 
                      type="text" 
                      value={gender}
                      onChange={e => setGender(e.target.value)}
                      placeholder="e.g. Female, Male, Non-binary"
                      className="w-full bg-transparent px-3 py-3.5 outline-none font-semibold text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm sm:text-base"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Personality Traits Input & Dynamic Feedback */}
              <div>
                <div className="flex items-center justify-between mb-1.5 ml-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
                    Personality Traits & Voice
                  </label>
                  {detectedVibe && DetectedIcon && (
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-bold ${detectedVibe.colorClass}`}
                    >
                      <DetectedIcon size={12} />
                      <span>Vibe: {detectedVibe.trait}</span>
                    </motion.div>
                  )}
                </div>

                <div className="relative rounded-2xl bg-[var(--input-bg)] border border-[var(--border)] focus-within:border-[var(--accent)] focus-within:ring-4 focus-within:ring-purple-500/20 transition-all shadow-2xs">
                  <textarea 
                    value={personality}
                    onChange={e => setPersonality(e.target.value)}
                    placeholder="Describe how they think, speak, and respond (e.g. Empathetic, creative, insightful, and always positive)..."
                    rows={3}
                    className="w-full bg-transparent px-4 py-3.5 outline-none font-medium text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm sm:text-base resize-none"
                    required
                  />
                  <div className="px-4 pb-2.5 flex justify-end text-[11px] font-bold text-[var(--text-muted)]">
                    {personality.length} characters
                  </div>
                </div>

                {/* Quick Personality Suggestions */}
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-bold text-[var(--text-muted)] mr-1">Inspirations:</span>
                  {PERSONALITY_SUGGESTIONS.map(sug => (
                    <motion.button
                      key={sug}
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => appendSuggestion(sug)}
                      className="text-xs bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--accent)] px-2.5 py-1 rounded-full border border-[var(--border-subtle)] transition-colors cursor-pointer"
                    >
                      + {sug}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Categorical Tags */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--accent)] mb-2 ml-1">
                  Role Tags (Optional)
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_TAGS.map(tag => {
                    const isSelected = tags.includes(tag.id);
                    const Icon = tag.icon;
                    return (
                      <motion.button
                        key={tag.id}
                        type="button"
                        whileHover={{ scale: 1.06 }}
                        whileTap={{ scale: 0.94 }}
                        onClick={() => toggleTag(tag.id)}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20 ring-2 ring-purple-400/40' 
                            : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)]'
                        }`}
                      >
                        <Icon size={14} className={isSelected ? 'text-white' : 'text-[var(--text-muted)]'} />
                        {tag.id}
                        {isSelected && <Check size={12} strokeWidth={3} className="ml-0.5" />}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Button */}
              <motion.button 
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-glass-blush w-full mt-6 font-bold rounded-2xl px-5 py-4 flex items-center justify-center gap-2.5 text-base cursor-pointer shadow-md"
              >
                <Sparkles size={18} />
                <span>{personaToEdit ? 'Save Changes' : 'Create Companion'}</span>
              </motion.button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
