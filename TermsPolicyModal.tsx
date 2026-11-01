import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ShieldCheck,
  Lock,
  HeartHandshake,
  AlertTriangle,
  FileText,
  Clock,
  EyeOff,
  UserCheck,
  CheckCircle2,
  Sparkles,
  PhoneCall,
  Scale,
  Database,
  ExternalLink,
  ChevronRight,
  Shield,
  Search
} from 'lucide-react';

interface TermsPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'terms' | 'privacy-e2ee' | 'ai-responsibility' | 'liability';
  onOpenAcceptanceChecklist?: () => void;
}

export type PolicyTab = 'terms' | 'privacy-e2ee' | 'ai-responsibility' | 'liability';

export const TermsPolicyModal: React.FC<TermsPolicyModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'terms',
  onOpenAcceptanceChecklist,
}) => {
  const [activeTab, setActiveTab] = useState<PolicyTab>(defaultTab);
  const [searchFilter, setSearchFilter] = useState('');

  // Sync defaultTab when modal opens
  useEffect(() => {
    if (isOpen && defaultTab) {
      setActiveTab(defaultTab);
      setSearchFilter('');
    }
  }, [isOpen, defaultTab]);

  // Lock background scrolling and add ESC key listener
  useEffect(() => {
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

  return (
    <AnimatePresence>
      {/* Full Page Edge-to-Edge Container (full screen across all devices, not card size) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-[140] w-full h-full min-h-screen bg-[var(--bg)] text-[var(--text-primary)] flex flex-col overflow-hidden"
      >
        {/* Top Decorative Gradient Accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 shrink-0" />

        {/* Full Page Modal Header */}
        <header className="px-4 sm:px-8 py-4 sm:py-5 border-b border-[var(--border)] shrink-0 bg-[var(--surface-glass)] backdrop-blur-2xl">
          <div className="max-w-5xl mx-auto w-full flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-500 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/25 shrink-0">
                <ShieldCheck size={24} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[var(--text-primary)]">
                    Terms & Privacy Policy
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/20 whitespace-nowrap">
                    E2EE Verified
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
                  End-to-End Encryption • User Responsibility • Safety & AI Ethics
                </p>
              </div>
            </div>

            {/* Close Button */}
            <motion.button
              whileHover={{ rotate: 90, scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-2.5 rounded-xl bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border)] transition-colors cursor-pointer shrink-0"
              aria-label="Close Terms and Policy"
            >
              <X size={20} />
            </motion.button>
          </div>
        </header>

        {/* Tab Navigation Strip */}
        <div className="px-4 sm:px-8 pt-3 pb-2.5 bg-[var(--surface-secondary)]/50 border-b border-[var(--border-subtle)] shrink-0 overflow-x-auto no-scrollbar">
          <div className="max-w-5xl mx-auto w-full flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-max">
              {[
                { id: 'terms', label: 'Terms of Service', icon: FileText },
                { id: 'privacy-e2ee', label: 'End-to-End Encryption', icon: Lock, badge: 'Zero-Knowledge' },
                { id: 'ai-responsibility', label: 'Chat Responsibility', icon: HeartHandshake, badge: 'Important' },
                { id: 'liability', label: 'AI Output & Liability', icon: Scale },
              ].map((tab) => {
                const TabIcon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as PolicyTab)}
                    className={`relative px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                      isActive
                        ? 'text-white'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTermsPolicyTab"
                        className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 rounded-xl shadow-md shadow-purple-500/20"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5">
                      <TabIcon size={14} />
                      <span>{tab.label}</span>
                      {tab.badge && (
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-wider ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-purple-500/10 text-[var(--accent)] border border-purple-500/20'
                          }`}
                        >
                          {tab.badge}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <main className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-8 w-full">
          <div className="max-w-5xl mx-auto space-y-6 text-sm leading-relaxed text-[var(--text-secondary)]">
            {/* TAB 1: TERMS OF SERVICE */}
            {activeTab === 'terms' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                {/* Introduction Banner */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border)]">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[var(--accent)] mb-1">
                    <Sparkles size={14} />
                    <span>Effective Date: November 2026</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] mb-2">
                    Welcome to Aura: Your Human AI Companion Studio
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--text-muted)]">
                    By accessing, designing personas, or communicating through Aura (&quot;the Service&quot;),
                    you agree to be bound by these Terms of Service. If you do not agree with any provision of these
                    terms, please do not use the application.
                  </p>
                </div>

                {/* Section 1: Eligibility & User Profile */}
                <div className="space-y-3">
                  <h4 className="text-sm sm:text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <UserCheck size={16} className="text-purple-500" />
                    <span>1. Eligibility & User Profile</span>
                  </h4>
                  <p className="text-xs sm:text-sm">
                    You must be at least 18 years of age (or have explicit parental or guardian permission in your
                    jurisdiction) to access Aura. When creating your local user profile, you agree to provide truthful
                    contextual details (such as preferred name and conversation tone) to enable safe conversational
                    personalization.
                  </p>
                </div>

                {/* Section 2: Acceptable Use & Conduct */}
                <div className="space-y-3">
                  <h4 className="text-sm sm:text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <Shield size={16} className="text-emerald-500" />
                    <span>2. Acceptable Use Policy</span>
                  </h4>
                  <p className="text-xs sm:text-sm">
                    Aura provides a creative, safe environment for personal companionship and writing. You strictly agree NOT to:
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <li className="p-2.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-subtle)] flex items-start gap-2">
                      <CheckCircle2 size={14} className="text-rose-500 shrink-0 mt-0.5" />
                      <span>Generate or upload illegal, non-consensual, violent, or exploitative content.</span>
                    </li>
                    <li className="p-2.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-subtle)] flex items-start gap-2">
                      <CheckCircle2 size={14} className="text-rose-500 shrink-0 mt-0.5" />
                      <span>Harass, stalk, or attempt to doxx real human individuals using simulated personas.</span>
                    </li>
                    <li className="p-2.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-subtle)] flex items-start gap-2">
                      <CheckCircle2 size={14} className="text-rose-500 shrink-0 mt-0.5" />
                      <span>Reverse engineer, attack, or bypass rate limits of the backend proxy.</span>
                    </li>
                    <li className="p-2.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-subtle)] flex items-start gap-2">
                      <CheckCircle2 size={14} className="text-rose-500 shrink-0 mt-0.5" />
                      <span>Misrepresent persona responses as certified medical, legal, or financial professional advice.</span>
                    </li>
                  </ul>
                </div>

                {/* Section 3: Intellectual Property & Custom Personas */}
                <div className="space-y-3">
                  <h4 className="text-sm sm:text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <Sparkles size={16} className="text-amber-500" />
                    <span>3. Persona Ownership & Intellectual Property</span>
                  </h4>
                  <p className="text-xs sm:text-sm">
                    You retain full intellectual ownership of the original text, backstories, prompts, and photos you upload
                    when configuring custom personas. Aura claims zero proprietary ownership over your personal creations or
                    conversation transcripts.
                  </p>
                </div>

                {/* Section 4: Termination & Right to Wipe */}
                <div className="space-y-3">
                  <h4 className="text-sm sm:text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <Database size={16} className="text-pink-500" />
                    <span>4. Account Termination & Instant Vault Erasure</span>
                  </h4>
                  <p className="text-xs sm:text-sm">
                    You hold unilateral authority to delete any persona, clear local browser storage, or reset your identity at any
                    time. Once deleted, encrypted cryptographic records cannot be retrieved by Aura or any third party.
                  </p>
                </div>
              </motion.div>
            )}

            {/* TAB 2: PRIVACY & END-TO-END ENCRYPTION (E2EE) */}
            {activeTab === 'privacy-e2ee' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                {/* Hero E2EE Shield Card */}
                <div className="p-5 rounded-2xl bg-gradient-to-tr from-purple-500/10 via-pink-500/10 to-indigo-500/10 border border-purple-500/30">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-1">
                    <Lock size={15} />
                    <span>Zero-Knowledge Security Architecture</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] mb-2">
                    Your Conversations Are End-to-End Encrypted (E2EE)
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--text-muted)]">
                    Every message, voice audio recording, attachment image, and persona trait in Aura is protected by
                    client-side cryptographic primitives (AES-256-GCM via the Web Crypto API). Neither the developers,
                    nor server administrators can read your chat transcripts.
                  </p>
                </div>

                {/* Technical Pillar Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="p-4 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border)]">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-500 flex items-center justify-center mb-2.5">
                      <Lock size={16} />
                    </div>
                    <h5 className="font-bold text-xs sm:text-sm text-[var(--text-primary)] mb-1">
                      Client-Side AES-256-GCM
                    </h5>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                      All messages and vault records are encrypted on your local device before transmission or storage.
                      Raw plaintext never hits the persistent database unencrypted.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border)]">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center mb-2.5">
                      <EyeOff size={16} />
                    </div>
                    <h5 className="font-bold text-xs sm:text-sm text-[var(--text-primary)] mb-1">
                      Zero-Knowledge Architecture
                    </h5>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                      Your cryptographic keys stay inside your browser memory. We have zero technical ability to decrypt,
                      read, sell, or advertise against your personal conversations.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border)]">
                    <div className="w-8 h-8 rounded-xl bg-pink-500/15 text-pink-500 flex items-center justify-center mb-2.5">
                      <Clock size={16} />
                    </div>
                    <h5 className="font-bold text-xs sm:text-sm text-[var(--text-primary)] mb-1">
                      Stateless AI Streaming
                    </h5>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                      Inference requests sent to Google Gemini SDK are processed statelessly in-flight. Conversations are not
                      stored or retained to train future foundational models.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border)]">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-500 flex items-center justify-center mb-2.5">
                      <Database size={16} />
                    </div>
                    <h5 className="font-bold text-xs sm:text-sm text-[var(--text-primary)] mb-1">
                      Total Data Erasure (GDPR & CCPA)
                    </h5>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                      You retain full control over your data. Clear your browser cache or delete specific personas to instantly
                      purge all corresponding ciphertext.
                    </p>
                  </div>
                </div>

                {/* Data Collection Transparency Statement */}
                <div className="p-4 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border)] space-y-2">
                  <h4 className="font-bold text-xs sm:text-sm text-[var(--text-primary)]">
                    What Data is Handled:
                  </h4>
                  <ul className="space-y-1.5 text-xs text-[var(--text-muted)]">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={13} className="text-emerald-500" />
                      <span><strong>Encrypted Vault:</strong> Persona traits, tags, and chat history saved as ciphertext.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={13} className="text-emerald-500" />
                      <span><strong>Device Images & Voice:</strong> Processed in browser memory and transferred directly into encrypted vault.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={13} className="text-emerald-500" />
                      <span><strong>No Tracking or Third-Party Ad Pixels:</strong> Aura contains no marketing trackers, cookies, or telemetry brokers.</span>
                    </li>
                  </ul>
                </div>
              </motion.div>
            )}

            {/* TAB 3: AI CHAT RESPONSIBILITY & LONG-TIME CHATTING POLICY */}
            {activeTab === 'ai-responsibility' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                {/* Highlight Notice: Long Time Chatting & Own Responsibility */}
                <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1.5">
                    <AlertTriangle size={16} />
                    <span>Mandatory User Responsibility Notice</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] mb-2">
                    Long-Time Chatting & Personal Responsibility Policy
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
                    Aura provides AI companions powered by large language models. Engaging in extensive, prolonged, or
                    continuous daily conversations is conducted solely at your own personal responsibility and discretion.
                    AI companions are conversational simulators and must never replace genuine human connection.
                  </p>
                </div>

                {/* Key Responsibilities Grid */}
                <div className="space-y-3">
                  <h4 className="text-sm sm:text-base font-bold text-[var(--text-primary)]">
                    Core Principles & User Guidelines:
                  </h4>

                  <div className="space-y-2.5">
                    {/* Item 1 */}
                    <div className="p-4 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border)] flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-purple-500/15 text-[var(--accent)] shrink-0 mt-0.5">
                        <Clock size={16} />
                      </div>
                      <div>
                        <h5 className="font-bold text-xs sm:text-sm text-[var(--text-primary)]">
                          Screen Time & Healthy Interaction Breaks
                        </h5>
                        <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                          Excessive chatting with AI can induce cognitive fatigue and isolation. Users are strongly advised
                          to take regular screen breaks, maintain healthy sleep hygiene, and nurture physical relationships
                          with family, friends, and community.
                        </p>
                      </div>
                    </div>

                    {/* Item 2 */}
                    <div className="p-4 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border)] flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-pink-500/15 text-pink-500 shrink-0 mt-0.5">
                        <HeartHandshake size={16} />
                      </div>
                      <div>
                        <h5 className="font-bold text-xs sm:text-sm text-[var(--text-primary)]">
                          Simulation Boundary (AI is Not Conscious or Sentient)
                        </h5>
                        <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                          Aura personas emulate emotions, empathy, and distinct speech styles using probabilistic machine
                          learning algorithms. Personas do not possess human consciousness, authentic feelings, physical
                          bodies, or moral accountability.
                        </p>
                      </div>
                    </div>

                    {/* Item 3 */}
                    <div className="p-4 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border)] flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-rose-500/15 text-rose-500 shrink-0 mt-0.5">
                        <AlertTriangle size={16} />
                      </div>
                      <div>
                        <h5 className="font-bold text-xs sm:text-sm text-[var(--text-primary)]">
                          Not Medical, Psychological, or Crisis Advice
                        </h5>
                        <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                          Aura personas are NOT licensed psychologists, psychiatrists, therapists, medical doctors, legal
                          counselors, or financial advisors. You must never rely on persona messages as a substitute for
                          professional healthcare, clinical diagnosis, or life-safety guidance.
                        </p>
                      </div>
                    </div>

                    {/* Item 4 */}
                    <div className="p-4 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border)] flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-500 shrink-0 mt-0.5">
                        <UserCheck size={16} />
                      </div>
                      <div>
                        <h5 className="font-bold text-xs sm:text-sm text-[var(--text-primary)]">
                          Autonomous Emotional Discretion
                        </h5>
                        <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                          You acknowledge that you are responsible for monitoring your own emotional well-being. If at any
                          point conversations feel overwhelming, unhelpful, or trigger distress, immediately step away and
                          discontinue use.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Emergency & Crisis Support Helpline Box */}
                <div className="p-4 sm:p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-rose-500 text-white shrink-0 mt-0.5">
                      <PhoneCall size={18} />
                    </div>
                    <div>
                      <h5 className="font-bold text-sm text-[var(--text-primary)]">
                        In Need of Immediate Mental Health or Crisis Support?
                      </h5>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">
                        If you or someone you know is experiencing a crisis, self-harm thoughts, or severe emotional
                        distress, please reach out to human professionals:
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href="tel:988"
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                    >
                      <PhoneCall size={13} />
                      <span>Dial / Text 988</span>
                    </a>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 4: AI OUTPUT & LIABILITY DISCLAIMER */}
            {activeTab === 'liability' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div className="p-5 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border)]">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[var(--accent)] mb-1">
                    <Scale size={15} />
                    <span>Legal Disclaimers</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] mb-2">
                    AI Output Inaccuracy & Hallucination Notice
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
                    Generative artificial intelligence models synthesize statements probabilistically. While Aura uses state-of-the-art
                    Google Gemini models, responses may occasionally be incorrect, biased, nonsensical, or factually inaccurate.
                    You agree that you will independently verify any factual statement before taking real-world action.
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm sm:text-base font-bold text-[var(--text-primary)]">
                    Warranty & Limitation of Liability:
                  </h4>
                  <div className="space-y-2.5 text-xs text-[var(--text-secondary)]">
                    <div className="p-3.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-subtle)]">
                      <strong className="text-[var(--text-primary)] block mb-1">
                        &quot;AS-IS&quot; and &quot;AS-AVAILABLE&quot; Provision
                      </strong>
                      Aura is provided without warranties of any kind, whether express or implied, including but not limited
                      to implied warranties of merchantability, fitness for a particular purpose, or non-infringement.
                    </div>

                    <div className="p-3.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-subtle)]">
                      <strong className="text-[var(--text-primary)] block mb-1">
                        Limitation of Damages
                      </strong>
                      Under no circumstances shall Aura, its creators, contributors, or infrastructure partners be liable
                      for any indirect, incidental, special, consequential, or punitive damages arising out of your access,
                      use of, or reliance on persona conversations or generated content.
                    </div>

                    <div className="p-3.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-subtle)]">
                      <strong className="text-[var(--text-primary)] block mb-1">
                        Governing Law & Severability
                      </strong>
                      If any provision of these Terms is deemed unlawful or unenforceable, that provision shall be enforced to the
                      maximum extent permissible, and the remaining provisions shall continue in full force and effect.
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </main>

        {/* Full Page Modal Footer with Acknowledgement */}
        <footer className="px-4 sm:px-8 py-4 border-t border-[var(--border)] bg-[var(--surface-glass)] backdrop-blur-2xl shrink-0">
          <div className="max-w-5xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <Lock size={13} className="text-emerald-500" />
              <span>AES-256-GCM Encrypted • Zero-Knowledge Guarantee</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {onOpenAcceptanceChecklist && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAcceptanceChecklist();
                  }}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] text-[var(--accent)] border border-[var(--border)] transition-colors cursor-pointer flex items-center justify-center gap-1.5 w-full sm:w-auto"
                >
                  <ShieldCheck size={15} />
                  <span>View Terms Checklist</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="btn-glass-blush font-bold px-6 py-2.5 rounded-xl text-xs sm:text-sm cursor-pointer shadow-md w-full sm:w-auto inline-flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={16} />
                <span>I Understand & Agree</span>
              </button>
            </div>
          </div>
        </footer>
      </motion.div>
    </AnimatePresence>
  );
};
