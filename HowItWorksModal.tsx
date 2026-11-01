import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Sparkles, 
  MessageSquare, 
  Sliders, 
  ShieldCheck, 
  Mic, 
  Image as ImageIcon, 
  Smile, 
  Zap, 
  CheckCircle2, 
  ArrowRight, 
  UserCheck, 
  Lock, 
  BrainCircuit,
  Layers,
  HelpCircle,
  User,
  Mail,
  Copy,
  Check,
  Code2,
  Cpu,
  Globe,
  Database,
  ExternalLink,
  Volume2,
  Heart,
  Terminal,
  Activity,
  Compass,
  FileCode,
  ShieldAlert
} from 'lucide-react';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCreatePersona: () => void;
  onOpenTermsPolicy?: () => void;
}

export type GuideTab = 
  | 'about-app'
  | 'about-developer'
  | 'how-it-works'
  | 'functions-used'
  | 'how-to-use';

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({
  isOpen,
  onClose,
  onOpenCreatePersona,
  onOpenTermsPolicy,
}) => {
  const [activeTab, setActiveTab] = useState<GuideTab>('about-app');
  const [activeStep, setActiveStep] = useState<number>(0);
  const [copiedEmail, setCopiedEmail] = useState<boolean>(false);

  // Lock background scrolling and add ESC key listener when guide window is open
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('dkumar9319850585@gmail.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const steps = [
    {
      number: '01',
      title: 'Design Your AI Persona',
      subtitle: 'Build custom digital companions from scratch',
      icon: <Sliders className="text-purple-500" size={24} />,
      badge: 'Step 1: Customization',
      description:
        'Start with a blank canvas. Choose an illustrated avatar, configure their age and gender, select an emotional vibe (Warm, Analytical, Playful, Empathetic), and craft a custom backstory detailing how they speak, their passions, and their boundaries.',
      details: [
        'Curated illustrated avatars with pastel & neon gradient backgrounds',
        'Distinct personality vibes that shape conversational tone and vocabulary',
        'Custom role tags (Creative, Fun, Work, Assistant, Gaming, Deep Talk)',
        'Rich backstories and memory parameters injected into every turn'
      ],
      proTip: 'Pro-Tip: Write 2-3 sentences about their personal mannerisms or humor style in the backstory for noticeably authentic dialogue.'
    },
    {
      number: '02',
      title: 'Converse with Natural Depth',
      subtitle: 'Experience human-like dialogue with real memory',
      icon: <MessageSquare className="text-pink-500" size={24} />,
      badge: 'Step 2: Interactive Chat',
      description:
        'Engage in dynamic dialogue powered by Google Gemini 3.8 Flash. Your companions actively remember past turns in the session, empathize with your emotional state, and avoid repetitive canned answers.',
      details: [
        'Nuanced, emotionally intelligent responses tailored to your feelings',
        'Contextual memory of ongoing conversation topics throughout the session',
        'Instant message reaction bar with contextual emoji responses',
        'Built-in speech synthesis playback for listening to answers out loud'
      ],
      proTip: 'Pro-Tip: Click the speaker icon on any persona message bubble to hear it read aloud with native voice synthesis.'
    },
    {
      number: '03',
      title: 'Voice Notes & Photo Vision',
      subtitle: 'Express yourself with speech and visual media',
      icon: <Mic className="text-amber-500" size={24} />,
      badge: 'Step 3: Multi-Modal',
      description:
        'Record hands-free voice messages using the native microphone tool, or attach photos, screenshots, and visual assets for your companion to review, analyze, and discuss in real-time.',
      details: [
        'Real-time voice audio recording with interactive waveform playback',
        'Multi-modal image analysis for photos, diagrams, and screenshots',
        'Visual preview carousel with 1-click removal before sending',
        'Seamless blend of text, audio, and visual context in the same thread'
      ],
      proTip: 'Pro-Tip: Share photos of your workspace, artwork, or travel scenes and ask your persona for feedback or creative stories.'
    },
    {
      number: '04',
      title: 'Live Mood & Cryptographic Vault',
      subtitle: 'Emotional well-being with zero-knowledge privacy',
      icon: <ShieldCheck className="text-emerald-500" size={24} />,
      badge: 'Step 4: Privacy & Well-Being',
      description:
        'Watch your companion adapt to your emotional state via the live Session Mood Widget. All chat histories and persona files are secured inside an AES-256-GCM encrypted vault with zero plaintext storage.',
      details: [
        'Dynamic session mood tracker monitoring conversational atmosphere',
        'Zero-knowledge AES-256-GCM encryption at rest on client & server',
        'Cryptographic session key derivation ensuring cross-user isolation',
        '1-click vault reset and cache purging for complete privacy ownership'
      ],
      proTip: 'Pro-Tip: Check the Session Mood Widget at the top of your chat window to see how your conversation vibe is evolving.'
    }
  ];

  const functionalCapabilities = [
    {
      icon: <BrainCircuit className="text-purple-500" size={22} />,
      title: 'Gemini 3.8 Flash Adaptive Engine',
      category: 'Conversational AI',
      badge: 'Live & Connected',
      badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      description: 'Delivers high-accuracy contextual reasoning, fluid conversational flow, and authentic emotional resonance without robotic templates.'
    },
    {
      icon: <Mic className="text-amber-500" size={22} />,
      title: 'Voice Audio Message Pipeline',
      category: 'Audio & Speech',
      badge: 'Two-Way Audio',
      badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      description: 'Records voice notes directly via the browser Web Audio API, packages audio blobs, and enables one-click voice speech playback.'
    },
    {
      icon: <ImageIcon className="text-blue-500" size={22} />,
      title: 'Multi-Modal Photo & File Vision',
      category: 'Computer Vision',
      badge: 'Multi-Modal',
      badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      description: 'Accepts PNG, JPG, and WebP attachments, parses base64 payloads, and passes visual data to Gemini 3.8 Flash for deep scene comprehension.'
    },
    {
      icon: <Lock className="text-emerald-500" size={22} />,
      title: 'AES-256-GCM Cryptographic Vault',
      category: 'Security & Privacy',
      badge: 'Zero-Knowledge',
      badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      description: 'Encrypts personas, transcripts, and credentials at rest using AES-256-GCM cipher with initialization vectors (IV) and auth tags.'
    },
    {
      icon: <Sliders className="text-pink-500" size={22} />,
      title: 'Custom Persona Generator',
      category: 'Persona Studio',
      badge: 'Zero-Limit Studio',
      badgeColor: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20',
      description: 'Builds tailored AI companions with distinct emotional vibes (Warm, Analytical, Playful, Empathetic), ages, tags, and personalized backstories.'
    },
    {
      icon: <Activity className="text-rose-500" size={22} />,
      title: 'Session Mood & Emotional Resonance',
      category: 'Affective Computing',
      badge: 'Live Adaptive',
      badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      description: 'Analyzes conversational sentiment in real-time, dynamically updating the Mood Bar (Calm, Joyful, Inspired, Deep, Cozy) and informing AI tone.'
    },
    {
      icon: <Smile className="text-amber-400" size={22} />,
      title: 'Emoji Message Reactions & Actions',
      category: 'Chat Interaction',
      badge: 'Interactive',
      badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      description: 'Enables instant contextual reactions (❤️, 😂, 💡, 🔥, 🥺), quick message copy, text-to-speech audio, and granular message deletion.'
    },
    {
      icon: <Globe className="text-indigo-500" size={22} />,
      title: 'Adaptive Glassmorphism Theme Engine',
      category: 'Design System',
      badge: 'Light / Dark Mode',
      badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
      description: 'Supports fluid light and dark mode switches, dynamic CSS variable themes, smooth Framer Motion transitions, and responsive mobile drawers.'
    }
  ];

  const systemArchitectureSteps = [
    {
      step: '01',
      title: 'Client Interaction & Input',
      desc: 'User writes a message, captures a voice recording via Web Audio, or uploads photo attachments with image previews.'
    },
    {
      step: '02',
      title: 'Sanitization & Vault Packaging',
      desc: 'Client-side sanitizers eliminate unsafe payloads. User session key isolates data before payload leaves browser memory.'
    },
    {
      step: '03',
      title: 'Secure Express Backend Proxy',
      desc: 'Routes to /api/chat. Proxies request to Gemini SDK while keeping API keys strictly private and isolated from the browser.'
    },
    {
      step: '04',
      title: 'Gemini 3.8 Flash Contextual Reasoning',
      desc: 'The model digests the persona vibe, age, backstory, conversation history, and user profile to craft an empathetic answer.'
    },
    {
      step: '05',
      title: 'AES-256-GCM Vault Sealing',
      desc: 'Both user inputs and persona responses are encrypted at rest with AES-256-GCM cipher before writing to disk/session storage.'
    },
    {
      step: '06',
      title: 'Emotional Feedback & UI Delivery',
      desc: 'Answers are displayed with typewriter animation, updating the live Session Mood Bar and enabling speech audio playback.'
    }
  ];

  return (
    <AnimatePresence>
      {/* Full Page Edge-to-Edge Container (full screen across all devices, not card size) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-[100] w-full h-full min-h-screen bg-[var(--bg)] text-[var(--text-primary)] flex flex-col overflow-hidden"
      >
        {/* Top Decorative Gradient Accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 shrink-0" />

        {/* Full Page Header Bar */}
        <header className="px-4 sm:px-8 py-4 sm:py-5 border-b border-[var(--border)] bg-[var(--surface-glass)] backdrop-blur-2xl shrink-0">
          <div className="max-w-5xl mx-auto w-full flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-500 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/25 shrink-0">
                <Sparkles size={22} className="animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-2xl font-black text-[var(--text-primary)] tracking-tight truncate">
                    Aura System & App Guide
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-[var(--accent)] border border-purple-500/20 whitespace-nowrap">
                    Official Guidebook
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5 line-clamp-1 sm:line-clamp-none">
                  Explore developer info, system architecture, active functions, and usage guide
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] border border-[var(--border)] transition-colors cursor-pointer shrink-0"
              aria-label="Close guide modal"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        {/* 5-Tab Navigation Bar */}
        <div className="px-4 sm:px-8 pt-3 pb-2.5 border-b border-[var(--border-subtle)] bg-[var(--surface-secondary)]/50 shrink-0 overflow-x-auto no-scrollbar">
          <div className="max-w-5xl mx-auto w-full flex items-center gap-1.5 sm:gap-2">
            {/* Tab 1: About App */}
            <button
              onClick={() => setActiveTab('about-app')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0 ${
                activeTab === 'about-app'
                  ? 'bg-[var(--accent)] text-white shadow-sm shadow-purple-500/25'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]'
              }`}
            >
              <Sparkles size={14} />
              <span>About App</span>
            </button>

            {/* Tab 2: About Developer */}
            <button
              onClick={() => setActiveTab('about-developer')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0 ${
                activeTab === 'about-developer'
                  ? 'bg-[var(--accent)] text-white shadow-sm shadow-purple-500/25'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]'
              }`}
            >
              <User size={14} />
              <span>About Developer</span>
            </button>

            {/* Tab 3: How This App Works */}
            <button
              onClick={() => setActiveTab('how-it-works')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0 ${
                activeTab === 'how-it-works'
                  ? 'bg-[var(--accent)] text-white shadow-sm shadow-purple-500/25'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]'
              }`}
            >
              <Cpu size={14} />
              <span>How This App Works</span>
            </button>

            {/* Tab 4: Which Functions Work */}
            <button
              onClick={() => setActiveTab('functions-used')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0 ${
                activeTab === 'functions-used'
                  ? 'bg-[var(--accent)] text-white shadow-sm shadow-purple-500/25'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]'
              }`}
            >
              <Zap size={14} />
              <span>Functions Used ({functionalCapabilities.length})</span>
            </button>

            {/* Tab 5: How to Use This App */}
            <button
              onClick={() => setActiveTab('how-to-use')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0 ${
                activeTab === 'how-to-use'
                  ? 'bg-[var(--accent)] text-white shadow-sm shadow-purple-500/25'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]'
              }`}
            >
              <Compass size={14} />
              <span>How to Use App</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <main className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-8 w-full text-left">
          <div className="max-w-5xl mx-auto space-y-6">
          
          {/* ========================================================= */}
          {/* TAB 1: ABOUT APP                                          */}
          {/* ========================================================= */}
          {activeTab === 'about-app' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {/* Vision Card */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-indigo-500/10 border border-purple-500/20 shadow-xs relative overflow-hidden">
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/25 text-[var(--accent)] text-xs font-black uppercase tracking-wider mb-3">
                    <Sparkles size={13} />
                    <span>The Vision Behind Aura</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-[var(--text-primary)] tracking-tight">
                    Human-First Emotional Intelligence
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed mt-2.5 max-w-2xl">
                    Most traditional AI assistants are sterile, transactional, and forgettable. Aura was built to give AI personas genuine emotional resonance, personal warmth, conversational memory, and human-like empathy. Every companion you create reflects your vision, speaks with distinct personality nuances, and connects with you on a real level.
                  </p>
                </div>
              </div>

              {/* 4 Core Pillars */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-[var(--text-muted)] mb-3">
                  Core Foundations & Architecture
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="p-4 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border)] hover:border-purple-500/40 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center mb-2.5">
                      <BrainCircuit size={18} />
                    </div>
                    <h5 className="text-sm font-bold text-[var(--text-primary)]">Nuanced Emotional Tone</h5>
                    <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                      Powered by customized prompt synthesis and emotional vibes (Warm, Analytical, Playful, Empathetic) that adapt to your personal cadence.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border)] hover:border-pink-500/40 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20 flex items-center justify-center mb-2.5">
                      <Mic size={18} />
                    </div>
                    <h5 className="text-sm font-bold text-[var(--text-primary)]">Multi-Modal Communication</h5>
                    <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                      Express yourself without limitations: send text messages, speak hands-free with voice notes, or upload pictures for your AI to inspect.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border)] hover:border-emerald-500/40 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-2.5">
                      <Lock size={18} />
                    </div>
                    <h5 className="text-sm font-bold text-[var(--text-primary)]">Zero-Knowledge Vault</h5>
                    <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                      All conversations and personas are shielded by AES-256-GCM cipher encryption. No plaintext storage or tracking of your personal thoughts.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border)] hover:border-amber-500/40 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center mb-2.5">
                      <Sliders size={18} />
                    </div>
                    <h5 className="text-sm font-bold text-[var(--text-primary)]">Complete Creator Autonomy</h5>
                    <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                      You hold absolute control over your companions: customize avatars, ages, genders, speaking rules, tags, and memory backstories.
                    </p>
                  </div>
                </div>
              </div>

              {/* Quality & Safety Note */}
              <div className="p-4 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border-subtle)] flex items-start gap-3">
                <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Aura operates in full compliance with content safety guidelines, removing robotic repetitive scripts while maintaining respectful, authentic, and emotionally supportive interactions.
                </p>
              </div>
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: ABOUT DEVELOPER                                    */}
          {/* ========================================================= */}
          {activeTab === 'about-developer' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {/* Developer Profile Header Card */}
              <div className="p-6 rounded-3xl bg-[var(--surface-secondary)] border border-[var(--border)] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-purple-500/30 shrink-0">
                    D
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xl font-black text-[var(--text-primary)]">
                        Deepanshu Kumar
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Lead Engineer & Creator
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-[var(--accent)] mt-0.5">
                      AI Solutions Architect & Full-Stack Systems Engineer
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      Creator of Aura: Human AI Companion Studio
                    </p>
                  </div>
                </div>

                {/* Direct Contact Button */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleCopyEmail}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-primary)] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
                  >
                    {copiedEmail ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    <span>{copiedEmail ? 'Email Copied!' : 'Copy Email'}</span>
                  </button>

                  <a
                    href="mailto:dkumar9319850585@gmail.com"
                    className="flex-1 sm:flex-none btn-glass-blush px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm shadow-purple-500/20 cursor-pointer"
                  >
                    <Mail size={14} />
                    <span>Send Email</span>
                  </a>
                </div>
              </div>

              {/* Developer Bio & Mission */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border)] space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[var(--accent)]">
                    <Cpu size={15} />
                    <span>Engineering Philosophy</span>
                  </div>
                  <h4 className="text-sm font-bold text-[var(--text-primary)]">
                    Humanizing Intelligent Systems
                  </h4>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    Deepanshu Kumar focuses on engineering AI applications that surpass sterile automation. By pairing cutting-edge LLMs (Gemini 3.8 Flash) with low-latency client architecture and end-to-end cryptographic vaults, Aura demonstrates how technology can feel genuinely warm and empathetic while remaining safe and secure.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border)] space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-pink-500">
                    <Code2 size={15} />
                    <span>Technical Architecture</span>
                  </div>
                  <h4 className="text-sm font-bold text-[var(--text-primary)]">
                    Full-Stack Precision
                  </h4>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    Designed and built with React 18, TypeScript, Tailwind CSS, Framer Motion, Node.js Express proxy, Web Audio API recording, and AES-256-GCM zero-knowledge cryptographic vault. Every component is tuned for 60fps performance and responsive fidelity.
                  </p>
                </div>
              </div>

              {/* Developer Contact Card */}
              <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-[var(--accent)] flex items-center justify-center shrink-0">
                    <Mail size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent)]">Official Contact</span>
                    <p className="text-xs font-bold text-[var(--text-primary)]">dkumar9319850585@gmail.com</p>
                  </div>
                </div>
                <span className="text-xs text-[var(--text-muted)]">
                  Available for inquiries, feature suggestions & technical feedback
                </span>
              </div>
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: HOW THIS APP WORKS (System Architecture)           */}
          {/* ========================================================= */}
          {activeTab === 'how-it-works' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {/* Architecture Intro */}
              <div className="p-5 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border)]">
                <div className="flex items-center gap-2.5 mb-2">
                  <Cpu size={18} className="text-[var(--accent)]" />
                  <h3 className="text-sm sm:text-base font-black text-[var(--text-primary)]">
                    End-to-End System Pipeline & Request Lifecycle
                  </h3>
                </div>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Understand how your inputs, persona traits, multi-modal attachments, and responses travel safely through our zero-knowledge architecture.
                </p>
              </div>

              {/* Pipeline Flow Steps */}
              <div className="space-y-3">
                {systemArchitectureSteps.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border)] hover:border-[var(--accent)]/40 transition-colors flex items-start gap-4"
                  >
                    <span className="w-8 h-8 rounded-xl bg-[var(--surface)] text-[var(--accent)] border border-[var(--border)] text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                      {item.step}
                    </span>
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-[var(--text-primary)]">
                        {item.title}
                      </h4>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Security Banner */}
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 flex items-start gap-3">
                <ShieldCheck size={20} className="text-emerald-500 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <span className="font-bold">Cryptographic Isolation: </span>
                  API keys never touch the client browser. All Gemini calls are executed via server-side isolated endpoints with tokenized authentication and AES-256-GCM cipher encryption.
                </div>
              </div>
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: WHICH FUNCTIONS WORK                               */}
          {/* ========================================================= */}
          {activeTab === 'functions-used' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Zap size={18} className="text-[var(--accent)] shrink-0" />
                  <p className="text-xs text-[var(--text-primary)] font-medium">
                    Every function below is <strong>100% active</strong> and wired to real backend services and model inference.
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[var(--surface)] text-[var(--accent)] border border-purple-500/20 shrink-0">
                  {functionalCapabilities.length} Live Functions
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {functionalCapabilities.map((feat, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border)] hover:border-[var(--accent)]/50 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <div className="w-9 h-9 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center">
                          {feat.icon}
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${feat.badgeColor}`}>
                          {feat.badge}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent)] block mb-0.5">
                        {feat.category}
                      </span>
                      <h4 className="text-sm font-bold text-[var(--text-primary)] mb-1">
                        {feat.title}
                      </h4>
                      <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                        {feat.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: HOW TO USE THIS APP                                */}
          {/* ========================================================= */}
          {activeTab === 'how-to-use' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {/* Step Selector Tabs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {steps.map((st, idx) => (
                  <button
                    key={st.number}
                    onClick={() => setActiveStep(idx)}
                    className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                      activeStep === idx
                        ? 'border-[var(--accent)] bg-[var(--surface-secondary)] shadow-sm'
                        : 'border-[var(--border-subtle)] hover:border-[var(--border)] hover:bg-[var(--surface-secondary)]/50'
                    }`}
                  >
                    <span className="text-[10px] font-black uppercase tracking-wider text-[var(--accent)] block">
                      {st.number}
                    </span>
                    <span className="text-xs font-bold text-[var(--text-primary)] block truncate mt-0.5">
                      {st.title}
                    </span>
                  </button>
                ))}
              </div>

              {/* Active Step Showcase Card */}
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="p-5 sm:p-6 rounded-3xl bg-[var(--surface-secondary)] border border-[var(--border)] shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-[var(--border-subtle)]">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center shadow-xs shrink-0">
                      {steps[activeStep].icon}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent)]">
                        {steps[activeStep].badge}
                      </span>
                      <h3 className="text-base sm:text-lg font-black text-[var(--text-primary)]">
                        {steps[activeStep].title}
                      </h3>
                    </div>
                  </div>
                  <span className="text-xs text-[var(--text-muted)] font-medium">
                    {steps[activeStep].subtitle}
                  </span>
                </div>

                <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-5">
                  {steps[activeStep].description}
                </p>

                {/* Bullet Points */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
                  {steps[activeStep].details.map((detail, dIdx) => (
                    <div
                      key={dIdx}
                      className="p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border-subtle)] flex items-start gap-2.5 text-xs text-[var(--text-primary)]"
                    >
                      <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>

                {/* Pro-Tip Box */}
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-[var(--accent)] font-medium flex items-center gap-2">
                  <Sparkles size={14} className="shrink-0" />
                  <span>{steps[activeStep].proTip}</span>
                </div>
              </motion.div>

              {/* Step Navigation Controls */}
              <div className="flex items-center justify-between pt-1">
                <button
                  disabled={activeStep === 0}
                  onClick={() => setActiveStep(prev => Math.max(0, prev - 1))}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-[var(--border)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--surface-secondary)] transition-all cursor-pointer"
                >
                  Previous Step
                </button>

                {activeStep < steps.length - 1 ? (
                  <button
                    onClick={() => setActiveStep(prev => Math.min(steps.length - 1, prev + 1))}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--accent)] text-white hover:opacity-90 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-purple-500/20"
                  >
                    <span>Next: {steps[activeStep + 1].title}</span>
                    <ArrowRight size={14} />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenCreatePersona();
                    }}
                    className="btn-glass-blush px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm shadow-purple-500/25"
                  >
                    <Sparkles size={14} />
                    <span>Create Your Persona Now</span>
                  </button>
                )}
              </div>
            </motion.div>
          )}

          </div>
        </main>

        {/* Full Page Footer Actions */}
        <footer className="px-4 sm:px-8 py-4 border-t border-[var(--border)] bg-[var(--surface-glass)] backdrop-blur-2xl shrink-0">
          <div className="max-w-5xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <HelpCircle size={14} className="text-[var(--accent)]" />
              <span>Built by Deepanshu Kumar • Powered by Gemini 3.8</span>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap justify-end w-full sm:w-auto">
              {onOpenTermsPolicy && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenTermsPolicy();
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/30 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <ShieldAlert size={14} />
                  <span>Terms & Privacy</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] border border-[var(--border)] transition-colors cursor-pointer"
              >
                Close Guide
              </button>
              <button
                onClick={() => {
                  onClose();
                  onOpenCreatePersona();
                }}
                className="btn-glass-blush px-5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm shadow-purple-500/20 cursor-pointer"
              >
                <Sparkles size={14} />
                <span>Create New Persona</span>
              </button>
            </div>
          </div>
        </footer>
      </motion.div>
    </AnimatePresence>
  );
};
