import React, { useState } from 'react';
import { PersonaProvider, usePersonas } from './PersonaContext';
import { UserProfileProvider, useUserProfile } from './UserProfileContext';
import { ThemeProvider, ThemeToggle } from './ThemeContext';
import { CreateProfileScreen } from './CreateProfileScreen';
import { UserProfileMenu } from './UserProfileMenu';
import { 
  Search, 
  XCircle, 
  Sparkles, 
  Plus, 
  Trash2, 
  Edit2, 
  MessageSquare, 
  Menu, 
  X, 
  Users, 
  Compass, 
  ShieldCheck,
  Lock,
  Zap,
  HelpCircle,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PersonaModal } from './PersonaModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { PersonaChatModal } from './PersonaChatModal';
import { HowItWorksModal } from './HowItWorksModal';
import { TermsPolicyModal, PolicyTab } from './TermsPolicyModal';
import { TermsAcceptanceModal } from './TermsAcceptanceModal';
import { Persona } from './types';
import { getAvatarConfig, renderAvatarIcon } from './avatarHelpers';
import { getPersonalityVibe } from './vibeHelpers';

function AppContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [isFocused, setIsFocused] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { personas, deletePersona } = usePersonas();

  // Modals & interaction state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [personaToDelete, setPersonaToDelete] = useState<Persona | null>(null);
  const [personaToEdit, setPersonaToEdit] = useState<Persona | null>(null);
  const [selectedChatPersona, setSelectedChatPersona] = useState<Persona | null>(null);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [isTermsPolicyOpen, setIsTermsPolicyOpen] = useState(false);
  const [termsDefaultTab, setTermsDefaultTab] = useState<PolicyTab>('terms');

  // Mandatory Terms & Conditions Acceptance Gate
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState<boolean>(() => {
    try {
      return !!localStorage.getItem('aura_terms_accepted_v1');
    } catch {
      return false;
    }
  });
  const [isAcceptanceGateOpen, setIsAcceptanceGateOpen] = useState(false);

  const openTermsPolicy = (tab: PolicyTab = 'terms') => {
    setTermsDefaultTab(tab);
    setIsTermsPolicyOpen(true);
  };

  const availableTags = ['All', 'Creative', 'Fun', 'Work', 'Assistant', 'Gaming'];

  const filteredPersonas = personas.filter((p) => {
    // 1. Tag filtering
    if (selectedTag !== 'All') {
      const hasTag = p.tags?.some((t) => t.toLowerCase() === selectedTag.toLowerCase());
      if (!hasTag) return false;
    }
    // 2. Search query filtering
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const matchesName = p.name.toLowerCase().includes(q);
    const matchesPersonality = p.personality.toLowerCase().includes(q);
    const matchesTags = p.tags?.some((tag) => tag.toLowerCase().includes(q));
    return matchesName || matchesPersonality || matchesTags;
  });

  const openCreateModal = () => {
    setPersonaToEdit(null);
    setIsModalOpen(true);
  };

  const openEditModal = (persona: Persona) => {
    setPersonaToEdit(persona);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setPersonaToEdit(null), 300);
  };

  const scrollToCompanions = () => {
    const el = document.getElementById('companions-grid-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className={`relative min-h-screen bg-[var(--bg)] font-sans text-[var(--text-primary)] transition-colors duration-300 selection:bg-purple-500 selection:text-white overflow-x-hidden ${selectedChatPersona ? 'overflow-hidden max-h-screen' : ''}`}>
      {/* Subtle atmospheric ambient glow blobs for Glass Blush */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="ambient-blob w-[380px] sm:w-[560px] h-[380px] sm:h-[560px] -top-24 left-1/2 -translate-x-1/2 bg-gradient-to-b from-purple-400/25 via-pink-400/20 to-transparent dark:from-purple-900/30 dark:via-pink-900/15" />
        <div className="ambient-blob w-[360px] sm:w-[500px] h-[360px] sm:h-[500px] top-1/3 -left-32 bg-gradient-to-br from-pink-300/30 via-purple-300/20 to-transparent dark:from-purple-950/25 dark:via-pink-950/15" />
        <div className="ambient-blob w-[400px] sm:w-[580px] h-[400px] sm:h-[580px] top-1/2 -right-40 bg-gradient-to-bl from-violet-300/25 via-blue-200/20 to-transparent dark:from-violet-900/20 dark:via-blue-950/20" />
      </div>

      {/* =========================================================================
          1. TOP NAVIGATION BAR (Revamped Modern 3-Zone Navigation with Glass Blush Styling)
          ========================================================================= */}
      <header className="sticky top-0 z-40 w-full bg-[var(--surface-glass)] backdrop-blur-xl border-b border-[var(--border)] transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-3 sm:gap-6">
          
          {/* ZONE 1: BRAND LOGO & WORDMARK */}
          <div className="flex items-center gap-3 shrink-0">
            <motion.a
              href="#"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="flex items-center gap-2.5 group cursor-pointer"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-500 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-purple-500/25 group-hover:shadow-lg group-hover:shadow-purple-500/35 transition-all">
                <Sparkles size={18} className="animate-float" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg sm:text-xl tracking-tight text-[var(--text-primary)]">
                  Aura
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--surface-secondary)] text-[var(--accent)] border border-[var(--border-subtle)] whitespace-nowrap">
                  Human AI
                </span>
              </div>
            </motion.a>
          </div>

          {/* ZONE 2: DESKTOP NAVIGATION LINKS (Streamlined & perfectly fitted without duplicates) */}
          <nav className="hidden md:flex items-center gap-1 p-1 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border-subtle)] backdrop-blur-md">
            {/* 1. Companions Directory Link */}
            <button
              onClick={() => {
                setSelectedTag('All');
                scrollToCompanions();
              }}
              className="px-3 lg:px-3.5 py-1.5 text-xs font-bold rounded-xl text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Users size={14} className="text-[var(--accent)]" />
              <span>Companions</span>
              <span className="w-5 h-5 rounded-full bg-[var(--surface)] text-[var(--accent)] border border-[var(--border-subtle)] text-[10px] flex items-center justify-center font-bold">
                {personas.length}
              </span>
            </button>

            {/* 2. How This Works & Guide Link */}
            <button
              onClick={() => setIsHowItWorksOpen(true)}
              className="px-3 lg:px-3.5 py-1.5 text-xs font-semibold rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-all flex items-center gap-1.5 cursor-pointer group"
              title="How this app works, system functions, developer mission & usage guide"
            >
              <BookOpen size={14} className="text-purple-500 group-hover:scale-110 transition-transform" />
              <span>How It Works</span>
            </button>

            {/* 3. Explore & Search */}
            <button
              onClick={() => {
                const searchEl = document.getElementById('persona-search-input');
                searchEl?.focus();
              }}
              className="px-3 lg:px-3.5 py-1.5 text-xs font-semibold rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Compass size={14} />
              <span>Explore</span>
            </button>

            {/* 4. Terms & Privacy Policy with E2EE Tag */}
            <button
              onClick={() => openTermsPolicy('privacy-e2ee')}
              className="px-3 lg:px-3.5 py-1.5 text-xs font-semibold rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-all flex items-center gap-1.5 cursor-pointer group"
              title="Terms of Service, Zero-Knowledge E2EE & Personal Chat Responsibility"
            >
              <ShieldCheck size={14} className="text-emerald-500 group-hover:scale-110 transition-transform" />
              <span>Terms & Policy</span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                E2EE
              </span>
            </button>
          </nav>

          {/* ZONE 3: ACTIONS & IDENTITY (Primary Create CTA, Theme Switcher, User Profile Menu, Mobile Hamburger) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Primary Create Persona CTA Button */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={openCreateModal}
              className="hidden sm:inline-flex btn-glass-blush font-bold px-3.5 sm:px-4 py-2 rounded-xl text-xs items-center gap-1.5 cursor-pointer shadow-sm shadow-purple-500/20 hover:shadow-purple-500/35 transition-all"
            >
              <Plus size={15} />
              <span>Create Persona</span>
            </motion.button>

            {/* Theme Toggle (Light / Dark) */}
            <ThemeToggle compact />

            {/* User Profile Menu with Encrypted Vault status */}
            <UserProfileMenu />

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-[var(--surface-secondary)] text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-[var(--border)] bg-[var(--surface-glass)] backdrop-blur-2xl px-4 py-3 space-y-2 overflow-hidden"
            >
              {/* How it Works / Guide mobile item */}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsHowItWorksOpen(true);
                }}
                className="w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-between text-[var(--text-primary)] bg-[var(--surface-secondary)] border border-purple-500/30 shadow-xs"
              >
                <span className="flex items-center gap-2">
                  <BookOpen size={16} className="text-purple-500" />
                  <span>How This App Works (Full Guide)</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-[var(--accent)]">
                  Guide
                </span>
              </button>

              {/* Companions Directory mobile link */}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  scrollToCompanions();
                }}
                className="w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-between text-[var(--text-primary)] bg-[var(--surface-secondary)] border border-[var(--border-subtle)]"
              >
                <span className="flex items-center gap-2">
                  <Users size={15} className="text-[var(--accent)]" />
                  <span>Companions Directory</span>
                </span>
                <span className="text-[11px] font-bold text-[var(--accent)]">
                  {personas.length} active
                </span>
              </button>

              {/* Explore & Search mobile link */}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  const searchEl = document.getElementById('persona-search-input');
                  searchEl?.focus();
                }}
                className="w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 text-[var(--text-primary)] bg-[var(--surface-secondary)] border border-[var(--border-subtle)]"
              >
                <Compass size={15} className="text-[var(--text-muted)]" />
                <span>Search & Filter Personas</span>
              </button>

              {/* Terms & Privacy Policy mobile link */}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  openTermsPolicy('terms');
                }}
                className="w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-between text-[var(--text-primary)] bg-[var(--surface-secondary)] border border-emerald-500/20"
              >
                <span className="flex items-center gap-2">
                  <ShieldCheck size={15} className="text-emerald-500" />
                  <span>Terms, E2EE Privacy & AI Guidelines</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  E2EE
                </span>
              </button>

              {/* Review / Re-verify Terms Acceptance */}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsAcceptanceGateOpen(true);
                }}
                className="w-full text-left px-3.5 py-2 rounded-xl text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-2"
              >
                <Lock size={13} className="text-purple-400" />
                <span>Verify Terms & Security Checkmarks</span>
              </button>

              {personas.length > 0 && (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setSelectedChatPersona(personas[0]);
                  }}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]"
                >
                  <Zap size={15} className="text-amber-500" />
                  <span>Quick Chat with {personas[0]?.name}</span>
                </button>
              )}

              {/* Create Custom Persona CTA on Mobile */}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  openCreateModal();
                }}
                className="w-full btn-glass-blush text-center py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-purple-500/20"
              >
                <Plus size={15} />
                <span>Create New Persona</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* =========================================================================
          2. MAIN CONTENT AREA (Centered Hero Section with Fluid Animations)
          ========================================================================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 relative w-full">
        <main>
          {/* AESTHETIC CENTERED HERO SECTION WITH STAGGERED ENTRANCE ANIMATIONS */}
          <section className="text-center pt-4 pb-8 sm:pt-8 sm:pb-12 max-w-4xl mx-auto flex flex-col items-center justify-center">
            
            {/* Centered Animated Micro-Kicker Badge */}
            <motion.div
              initial={{ opacity: 0, y: -15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--accent)] text-xs font-bold uppercase tracking-wider mb-4 sm:mb-6 shadow-2xs backdrop-blur-md"
            >
              <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse shrink-0" />
              <span>AI Companion Studio</span>
              <span className="text-[var(--text-muted)]">•</span>
              <span className="text-[var(--text-secondary)] font-semibold lowercase">
                {personas.length} active personas
              </span>
            </motion.div>

            {/* Centered Grand Hero Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-[var(--text-primary)] tracking-tight leading-[1.08] text-center max-w-3xl mx-auto"
            >
              <span>Aura: Your </span>
              <span className="bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 bg-clip-text text-transparent">
                Human AI
              </span>
            </motion.h1>

            {/* Centered Descriptive Subtitle with Text-Wrap Balance */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-sm sm:text-base md:text-lg text-[var(--text-muted)] mt-3 sm:mt-5 max-w-2xl mx-auto leading-relaxed text-center font-normal"
              style={{ textWrap: 'balance' }}
            >
              Design, customize, and chat with your AI personas. Tailor their voice, personality, and distinct traits with genuine emotional intelligence and contextual memory.
            </motion.p>

            {/* Centered Quick Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="mt-6 sm:mt-8 flex items-center justify-center gap-3 sm:gap-4 flex-wrap w-full max-w-xl mx-auto"
            >
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={openCreateModal}
                className="btn-glass-blush font-bold px-6 sm:px-8 py-3 sm:py-3.5 rounded-2xl text-xs sm:text-sm inline-flex items-center justify-center gap-2.5 shadow-md shadow-purple-500/25 cursor-pointer"
              >
                <Plus size={18} />
                <span>{personas.length === 0 ? 'Create Your First Persona' : 'Create Companion'}</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setIsHowItWorksOpen(true)}
                className="px-5 sm:px-6 py-3 sm:py-3.5 rounded-2xl font-bold text-xs sm:text-sm bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] border border-[var(--border)] transition-all inline-flex items-center justify-center gap-2 shadow-2xs cursor-pointer group"
              >
                <BookOpen size={16} className="text-[var(--accent)] group-hover:scale-110 transition-transform" />
                <span>App Guide</span>
              </motion.button>

              {personas.length > 0 && (
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setSelectedChatPersona(personas[0])}
                  className="px-5 sm:px-6 py-3 sm:py-3.5 rounded-2xl font-bold text-xs sm:text-sm bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] border border-[var(--border)] transition-all inline-flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
                >
                  <MessageSquare size={16} className="text-[var(--accent)]" />
                  <span>Chat with {personas[0].name}</span>
                </motion.button>
              )}
            </motion.div>

            {/* Centered Feature Badges / Highlights */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.35 }}
              className="mt-6 sm:mt-8 flex items-center justify-center gap-4 sm:gap-6 text-xs text-[var(--text-muted)] flex-wrap"
            >
              <div className="flex items-center gap-1.5">
                <Sparkles size={13} className="text-[var(--accent)]" />
                <span>Gemini 3.8 Reasoning</span>
              </div>
              <span className="hidden sm:inline text-[var(--border)]">•</span>
              <button
                type="button"
                onClick={() => openTermsPolicy('privacy-e2ee')}
                className="flex items-center gap-1.5 hover:text-[var(--text-primary)] transition-colors cursor-pointer group"
                title="View End-to-End Encryption & Privacy Policy"
              >
                <ShieldCheck size={13} className="text-emerald-500 group-hover:scale-110 transition-transform" />
                <span className="underline decoration-dotted underline-offset-2">AES-256-GCM Encrypted Vault</span>
              </button>
              <span className="hidden sm:inline text-[var(--border)]">•</span>
              <div className="flex items-center gap-1.5">
                <Zap size={13} className="text-amber-500" />
                <span>Accurate & Context-Aware</span>
              </div>
            </motion.div>

            {/* =========================================================================
                3. CENTERED SEARCH & CATEGORY TAG FILTER STRIP WITH ANIMATION
                ========================================================================= */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="mt-8 sm:mt-10 max-w-2xl w-full mx-auto"
            >
              <div
                className={`relative rounded-2xl transition-all duration-300 ${
                  isFocused
                    ? 'ring-4 ring-purple-500/25 shadow-lg shadow-purple-500/10'
                    : 'shadow-xs hover:shadow-md'
                }`}
              >
                {/* Subtle animated border gradient overlay */}
                <div
                  className={`absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-violet-500 transition-opacity duration-300 -z-10 ${
                    isFocused ? 'opacity-100' : 'opacity-0'
                  }`}
                />

                <div className="relative flex items-center bg-[var(--surface-glass)] backdrop-blur-xl rounded-2xl border border-[var(--border)] overflow-hidden">
                  <div className="pl-3.5 sm:pl-4 pr-1 text-[var(--text-muted)] shrink-0">
                    <motion.div
                      animate={{ scale: isFocused ? 1.15 : 1, rotate: isFocused ? 10 : 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    >
                      <Search
                        size={18}
                        className={`transition-colors duration-200 ${
                          isFocused ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'
                        }`}
                      />
                    </motion.div>
                  </div>

                  <input
                    type="text"
                    id="persona-search-input"
                    placeholder="Search by name, personality, or tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className="w-full bg-transparent px-2.5 sm:px-3 py-3 sm:py-3.5 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] font-medium text-sm sm:text-base outline-none min-w-0"
                  />

                  {/* Right side controls: counter and clear button */}
                  <div className="pr-2.5 sm:pr-3 flex items-center gap-1.5 sm:gap-2 shrink-0">
                    <AnimatePresence>
                      {searchQuery && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md bg-[var(--surface-secondary)] text-[var(--accent)] border border-[var(--border-subtle)] whitespace-nowrap"
                        >
                          {filteredPersonas.length} {filteredPersonas.length === 1 ? 'match' : 'matches'}
                        </motion.span>
                      )}
                    </AnimatePresence>

                    <AnimatePresence>
                      {searchQuery && (
                        <motion.button
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          whileHover={{ scale: 1.15, rotate: 90 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setSearchQuery('')}
                          className="p-1 sm:p-1.5 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] transition-colors cursor-pointer"
                          title="Clear search"
                          id="clear-search-btn"
                        >
                          <XCircle size={18} />
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Centered Category Quick Filter Chips */}
              <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-3.5 sm:mt-4 flex-wrap">
                {availableTags.map((tag) => {
                  const isActive = selectedTag === tag;
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setSelectedTag(tag)}
                      className={`px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[var(--accent)] text-white shadow-xs scale-105'
                          : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)]'
                      }`}
                    >
                      {tag === 'All' ? `All (${personas.length})` : `#${tag}`}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </section>

          {/* =========================================================================
              4. PERSONAS DIRECTORY SECTION
              ========================================================================= */}
          <section id="companions-grid-section" className="mt-4 sm:mt-8">
            {/* Section Header Divider */}
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-[var(--border-subtle)]">
              <div>
                <h2 className="text-base sm:text-xl font-black text-[var(--text-primary)] flex items-center gap-2">
                  <span>Available Companions</span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[var(--surface-secondary)] text-[var(--accent)] border border-[var(--border-subtle)]">
                    {filteredPersonas.length}
                  </span>
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Pick a persona below to start chatting
                </p>
              </div>

              {/* Quick Reset Filter if filtered */}
              {(selectedTag !== 'All' || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedTag('All');
                    setSearchQuery('');
                  }}
                  className="text-xs font-bold text-[var(--accent)] hover:underline cursor-pointer"
                >
                  Reset filters
                </button>
              )}
            </div>

            {/* Empty state when zero personas exist */}
            {personas.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-10 sm:py-16 px-4"
              >
                <div className="glass-blush-card rounded-3xl sm:rounded-[2.5rem] p-8 sm:p-14 shadow-sm inline-block max-w-lg w-full">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-purple-500/15 via-pink-500/15 to-indigo-500/15 text-[var(--accent)] border border-[var(--border)] flex items-center justify-center mx-auto mb-5 shadow-inner">
                    <Sparkles size={32} className="animate-float" />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] mb-3">
                    Zero Personas Found
                  </h3>
                  <p className="text-[var(--text-muted)] text-sm sm:text-base leading-relaxed mb-6 max-w-md mx-auto">
                    You currently have zero AI companions. Tap the button below to design your very first custom persona and start chatting!
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={openCreateModal}
                    className="btn-glass-blush font-bold px-8 py-3.5 rounded-2xl inline-flex items-center gap-2.5 cursor-pointer text-sm sm:text-base shadow-md shadow-purple-500/20"
                  >
                    <Plus size={18} />
                    <span>Create New Persona</span>
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Empty state when personas exist but filters return 0 */}
            {personas.length > 0 && filteredPersonas.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12 sm:py-16 px-4"
              >
                <div className="glass-blush-card rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-12 shadow-sm inline-block max-w-md w-full">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-[var(--surface-secondary)] text-[var(--accent)] border border-[var(--border)] flex items-center justify-center mx-auto mb-4 sm:mb-5 shadow-inner">
                    <Search size={28} className="text-[var(--text-muted)]" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-[var(--text-primary)] mb-2">No Matching Companions</h3>
                  <p className="text-[var(--text-muted)] text-xs sm:text-sm leading-relaxed mb-5 sm:mb-6">
                    We couldn't find any companions matching your search or tag.
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => {
                        setSelectedTag('All');
                        setSearchQuery('');
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--surface-secondary)] text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
                    >
                      Reset Filters
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={openCreateModal}
                      className="btn-glass-blush font-bold px-5 py-2 rounded-xl inline-flex items-center gap-2 cursor-pointer text-xs"
                    >
                      <Plus size={15} />
                      <span>Create Persona</span>
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Personas Display Cards (Glass Blush) */}
            {filteredPersonas.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {filteredPersonas.map((persona, index) => {
                  const avatar = getAvatarConfig(persona.avatarId);
                  const vibe = getPersonalityVibe(persona.personality);
                  const VibeIcon = vibe.icon;

                  return (
                    <motion.div
                      key={persona.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ y: -6, transition: { type: 'spring', stiffness: 350, damping: 25 } }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => setSelectedChatPersona(persona)}
                      className="glass-blush-card rounded-3xl sm:rounded-[2rem] p-5 sm:p-7 transition-all flex flex-col cursor-pointer group relative overflow-hidden"
                    >
                      {/* Floating animated action buttons */}
                      <div className="absolute top-4 right-4 sm:top-5 sm:right-5 flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 bg-[var(--surface)] backdrop-blur-md rounded-xl sm:rounded-2xl p-1 border border-[var(--border)] shadow-md">
                        <motion.button
                          whileHover={{ scale: 1.15, rotate: -6 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(persona);
                          }}
                          className="p-1.5 sm:p-2 text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--surface-secondary)] rounded-lg sm:rounded-xl transition-colors cursor-pointer"
                          title="Edit Persona"
                          aria-label={`Edit ${persona.name}`}
                        >
                          <Edit2 size={15} />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.15, rotate: 6 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setPersonaToDelete(persona);
                          }}
                          className="p-1.5 sm:p-2 text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 rounded-lg sm:rounded-xl transition-colors cursor-pointer"
                          title="Delete Persona"
                          aria-label={`Delete ${persona.name}`}
                        >
                          <Trash2 size={15} />
                        </motion.button>
                      </div>

                      {/* Avatar Display */}
                      <div className="flex items-start justify-between mb-4 sm:mb-5">
                        <motion.div
                          whileHover={{ scale: 1.06 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                          className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shadow-lg overflow-hidden shrink-0 ${
                            persona.iconPath
                              ? 'bg-[var(--surface-secondary)] p-1 border border-[var(--border)]'
                              : avatar.colorClass
                          }`}
                        >
                          {persona.iconPath ? (
                            <img
                              src={persona.iconPath}
                              alt={persona.name}
                              className="w-full h-full object-cover rounded-xl"
                            />
                          ) : (
                            renderAvatarIcon(avatar.iconId, 26)
                          )}
                        </motion.div>

                        {/* Subtle Chat Pill that lights up on hover */}
                        <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-xs font-semibold bg-[var(--surface-secondary)] text-[var(--text-secondary)] border border-[var(--border-subtle)] group-hover:border-[var(--accent)] group-hover:text-[var(--accent)] transition-colors shadow-2xs mr-16 sm:mr-0">
                          <MessageSquare
                            size={12}
                            className="text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors"
                          />
                          <span>Chat</span>
                        </span>
                      </div>

                      {/* Name & Vibe badge */}
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-xl sm:text-2xl font-black text-[var(--text-primary)] tracking-tight group-hover:text-[var(--accent)] transition-colors truncate max-w-full">
                          {persona.name}
                        </h3>
                        <div
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-bold ${vibe.colorClass}`}
                        >
                          <VibeIcon size={11} />
                          <span>{vibe.trait}</span>
                        </div>
                      </div>

                      <p className="text-[var(--text-muted)] text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-3">
                        {persona.age} yrs old • {persona.gender}
                      </p>

                      {/* Categorical tags */}
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {persona.tags?.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-[var(--surface-secondary)] text-[var(--accent)] rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold border border-[var(--border-subtle)] transition-colors"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>

                      {/* Personality Box */}
                      <div className="bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-xl sm:rounded-2xl p-3 sm:p-4 mt-auto mb-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] sm:text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                            Personality
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed font-medium line-clamp-3">
                          {persona.personality}
                        </p>
                      </div>

                      {/* Start Chat action button */}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="btn-glass-blush w-full py-2.5 px-4 font-bold text-xs sm:text-sm rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95"
                      >
                        <MessageSquare size={15} />
                        <span>Start Chat with {persona.name}</span>
                      </motion.button>
                    </motion.div>
                  );
                })}

                {/* Create Custom Persona Card with Animated Plus */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ delay: filteredPersonas.length * 0.05 }}
                  onClick={openCreateModal}
                  className="border-2 border-dashed border-[var(--border)] bg-[var(--surface-glass)] hover:bg-[var(--surface-hover)] backdrop-blur-md rounded-3xl sm:rounded-[2rem] p-6 sm:p-8 flex flex-col items-center justify-center text-[var(--text-muted)] hover:text-[var(--accent)] transition-all cursor-pointer min-h-[240px] sm:min-h-[300px] group shadow-sm hover:shadow-md active:scale-98"
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-[var(--surface-secondary)] border border-[var(--border)] group-hover:border-[var(--accent)] flex items-center justify-center mb-3 sm:mb-4 shadow-sm group-hover:shadow-md transition-all">
                    <Plus
                      size={26}
                      className="text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-transform duration-300 group-hover:rotate-90 group-hover:scale-110"
                    />
                  </div>
                  <span className="font-black text-base sm:text-lg text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors text-center">
                    Create Custom Persona
                  </span>
                  <span className="text-xs font-medium text-[var(--text-muted)] mt-1 text-center">
                    Add voice, avatar, and distinct traits
                  </span>
                </motion.div>
              </div>
            )}
          </section>

          {/* =========================================================================
              5. APP FOOTER & LEGAL POLICY STRIP
              ========================================================================= */}
          <footer className="mt-16 sm:mt-24 pt-8 pb-12 border-t border-[var(--border)] text-xs text-[var(--text-muted)]">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Brand & Mission Statement */}
              <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
                <div className="flex items-center gap-2 font-black text-sm text-[var(--text-primary)]">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white text-[11px] shadow-xs">
                    ✦
                  </div>
                  <span>Aura: Your Human AI</span>
                </div>
                <span className="hidden sm:inline text-[var(--border)]">•</span>
                <p className="text-[11px]">
                  Built by <span className="font-bold text-[var(--text-primary)]">Deepanshu Kumar</span> • Powered by Gemini 3.8
                </p>
              </div>

              {/* Legal & Policy Quick Links */}
              <div className="flex items-center gap-4 sm:gap-6 flex-wrap justify-center text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => openTermsPolicy('terms')}
                  className="hover:text-[var(--accent)] transition-colors cursor-pointer"
                >
                  Terms of Service
                </button>
                <button
                  type="button"
                  onClick={() => openTermsPolicy('privacy-e2ee')}
                  className="hover:text-[var(--accent)] transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Lock size={12} className="text-emerald-500" />
                  <span>Privacy & E2EE</span>
                </button>
                <button
                  type="button"
                  onClick={() => openTermsPolicy('ai-responsibility')}
                  className="hover:text-[var(--accent)] transition-colors cursor-pointer text-amber-500/90 hover:text-amber-500"
                >
                  Chat Responsibility
                </button>
                <button
                  type="button"
                  onClick={() => openTermsPolicy('liability')}
                  className="hover:text-[var(--accent)] transition-colors cursor-pointer"
                >
                  Liability
                </button>
                <button
                  type="button"
                  onClick={() => setIsHowItWorksOpen(true)}
                  className="hover:text-[var(--accent)] transition-colors cursor-pointer text-[var(--text-primary)]"
                >
                  App Guide
                </button>
                <button
                  type="button"
                  onClick={() => setIsAcceptanceGateOpen(true)}
                  className="px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 hover:text-purple-300 transition-colors cursor-pointer flex items-center gap-1 border border-purple-500/20"
                >
                  <ShieldCheck size={12} className="text-purple-400" />
                  <span>Terms Checklist</span>
                </button>
              </div>
            </div>

            {/* Disclaimer & Encryption Tagline */}
            <div className="mt-6 pt-5 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[var(--text-muted)] text-center sm:text-left">
              <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                <ShieldCheck size={13} className="text-emerald-500 shrink-0" />
                <span>
                  All chats and personas are zero-knowledge end-to-end encrypted locally via AES-256-GCM. Extended chatting is conducted at user&apos;s own responsibility.
                </span>
              </div>
              <span className="text-[10px] text-[var(--text-muted)] font-mono shrink-0">
                © {new Date().getFullYear()} Aura Companion Studio.
              </span>
            </div>
          </footer>
        </main>
      </div>

      {/* Root-Level Modals & Dialogs (Stacking cleanly above fixed/sticky elements) */}
      <PersonaModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        personaToEdit={personaToEdit}
      />

      <ConfirmDeleteModal
        isOpen={personaToDelete !== null}
        onClose={() => setPersonaToDelete(null)}
        onConfirm={() => personaToDelete && deletePersona(personaToDelete.id)}
        personaName={personaToDelete?.name}
      />

      <PersonaChatModal
        isOpen={selectedChatPersona !== null}
        onClose={() => setSelectedChatPersona(null)}
        persona={selectedChatPersona}
        onSelectPersona={(p) => setSelectedChatPersona(p)}
        onOpenCreatePersona={() => {
          setSelectedChatPersona(null);
          openCreateModal();
        }}
        onOpenTermsPolicy={(tab) => openTermsPolicy(tab)}
        onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
      />

      <HowItWorksModal
        isOpen={isHowItWorksOpen}
        onClose={() => setIsHowItWorksOpen(false)}
        onOpenCreatePersona={() => {
          setIsHowItWorksOpen(false);
          openCreateModal();
        }}
        onOpenTermsPolicy={() => {
          setIsHowItWorksOpen(false);
          openTermsPolicy('privacy-e2ee');
        }}
      />

      <TermsPolicyModal
        isOpen={isTermsPolicyOpen}
        onClose={() => setIsTermsPolicyOpen(false)}
        defaultTab={termsDefaultTab}
        onOpenAcceptanceChecklist={() => setIsAcceptanceGateOpen(true)}
      />

      {/* Mandatory Terms & Conditions Acceptance Gate on initial visit */}
      <TermsAcceptanceModal
        isOpen={!hasAcceptedTerms || isAcceptanceGateOpen}
        onAccept={() => {
          setHasAcceptedTerms(true);
          setIsAcceptanceGateOpen(false);
        }}
        onOpenDetailedPolicy={(tab) => {
          openTermsPolicy(tab);
        }}
      />
    </div>
  );
}

function MainApp() {
  const { hasProfile, isLoading } = useUserProfile();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-3 border-[var(--accent)] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!hasProfile) {
    return <CreateProfileScreen />;
  }

  return <AppContent />;
}

export default function App() {
  return (
    <ThemeProvider>
      <UserProfileProvider>
        <PersonaProvider>
          <MainApp />
        </PersonaProvider>
      </UserProfileProvider>
    </ThemeProvider>
  );
}
