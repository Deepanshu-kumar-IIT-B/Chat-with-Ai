import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Lock,
  HeartHandshake,
  AlertTriangle,
  Scale,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Info,
  Shield
} from 'lucide-react';
import { PolicyTab } from './TermsPolicyModal';

interface TermsAcceptanceModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onOpenDetailedPolicy: (tab: PolicyTab) => void;
}

export const TermsAcceptanceModal: React.FC<TermsAcceptanceModalProps> = ({
  isOpen,
  onAccept,
  onOpenDetailedPolicy,
}) => {
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [agreedResponsibility, setAgreedResponsibility] = useState(false);
  const [agreedLiability, setAgreedLiability] = useState(false);

  const allAgreed = agreedTerms && agreedPrivacy && agreedResponsibility && agreedLiability;
  const agreedCount = [agreedTerms, agreedPrivacy, agreedResponsibility, agreedLiability].filter(Boolean).length;

  const handleToggleAll = () => {
    if (allAgreed) {
      setAgreedTerms(false);
      setAgreedPrivacy(false);
      setAgreedResponsibility(false);
      setAgreedLiability(false);
    } else {
      setAgreedTerms(true);
      setAgreedPrivacy(true);
      setAgreedResponsibility(true);
      setAgreedLiability(true);
    }
  };

  const handleProceed = () => {
    if (!allAgreed) return;
    const acceptanceRecord = {
      version: '1.0',
      acceptedAt: new Date().toISOString(),
      agreements: {
        terms: true,
        privacyE2EE: true,
        aiResponsibility: true,
        liability: true,
      },
    };
    try {
      localStorage.setItem('aura_terms_accepted_v1', JSON.stringify(acceptanceRecord));
    } catch (e) {
      console.warn('Could not save terms acceptance to localStorage', e);
    }
    onAccept();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {/* Full Page Edge-to-Edge Container (fills entire viewport across mobile, tablet, laptop, desktop) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-[120] w-full h-full min-h-screen bg-[var(--bg)] text-[var(--text-primary)] flex flex-col overflow-hidden"
      >
        {/* Ambient atmospheric backdrop glow */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="ambient-blob w-[500px] sm:w-[700px] h-[500px] sm:h-[700px] -top-32 left-1/2 -translate-x-1/2 bg-gradient-to-b from-purple-500/15 via-pink-500/10 to-transparent" />
          <div className="ambient-blob w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bottom-0 right-0 bg-gradient-to-tl from-indigo-500/15 via-purple-500/10 to-transparent" />
        </div>

        {/* Top Decorative Gradient Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 shrink-0" />

        {/* FULL PAGE HEADER */}
        <header className="border-b border-[var(--border)] shrink-0 bg-[var(--surface-glass)] backdrop-blur-2xl px-4 sm:px-8 py-4 sm:py-5">
          <div className="max-w-5xl mx-auto w-full flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-500 to-indigo-500 flex items-center justify-center text-white shadow-xl shadow-purple-500/30 shrink-0">
                <ShieldCheck size={28} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-[var(--text-primary)]">
                    Welcome to Aura: Human AI
                  </h1>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-500/15 text-[var(--accent)] border border-purple-500/25 whitespace-nowrap">
                    Mandatory Terms Gate
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
                  Please review and checkmark all 4 terms & conditions before proceeding into your private companion studio.
                </p>
              </div>
            </div>

            {/* Status Counter & Quick Action */}
            <div className="flex items-center justify-between md:justify-end gap-3 sm:gap-4 shrink-0 bg-[var(--surface-secondary)]/70 px-4 py-2.5 rounded-2xl border border-[var(--border-subtle)]">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${allAgreed ? 'bg-emerald-500 animate-pulse' : 'bg-purple-500'}`} />
                <div>
                  <div className="text-xs font-bold text-[var(--text-primary)]">
                    {agreedCount} of 4 Accepted
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)]">
                    {allAgreed ? 'All conditions met' : 'All 4 required'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleToggleAll}
                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--accent)] border border-[var(--border)] transition-all cursor-pointer shadow-xs whitespace-nowrap"
              >
                {allAgreed ? 'Deselect All' : 'Select All & Check'}
              </button>
            </div>
          </div>
        </header>

        {/* FULL PAGE SCROLLABLE CONTENT BODY */}
        <main className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-8 py-6 sm:py-8 w-full">
          <div className="max-w-5xl mx-auto space-y-4 sm:space-y-5">
            
            {/* Informational intro banner */}
            <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-purple-500/10 via-pink-500/5 to-indigo-500/10 border border-purple-500/20 flex items-start sm:items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-[var(--accent)] flex items-center justify-center shrink-0">
                <Shield size={20} />
              </div>
              <div className="flex-1 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                Aura operates on a <strong className="text-[var(--text-primary)]">Zero-Knowledge, Client-Encrypted Model</strong>. All conversations, custom avatars, and audio records are stored strictly in your browser vault. Review each core principle below to unlock full access.
              </div>
            </div>

            {/* ITEM 1: Terms of Service & Age Eligibility */}
            <label
              className={`block p-4 sm:p-6 rounded-2xl sm:rounded-3xl border transition-all cursor-pointer ${
                agreedTerms
                  ? 'bg-purple-500/10 border-purple-500/40 shadow-md shadow-purple-500/10'
                  : 'bg-[var(--surface)] border-[var(--border)] hover:border-[var(--accent)]/40 hover:bg-[var(--surface-hover)]'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="pt-1 shrink-0">
                  <input
                    type="checkbox"
                    checked={agreedTerms}
                    onChange={(e) => setAgreedTerms(e.target.checked)}
                    className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg text-purple-600 focus:ring-purple-500 focus:ring-offset-0 cursor-pointer accent-purple-600"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <span className="text-sm sm:text-base font-black text-[var(--text-primary)] flex items-center gap-2">
                      <Scale size={18} className="text-purple-500 shrink-0" />
                      1. Terms of Service & Age Eligibility (18+)
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenDetailedPolicy('terms');
                      }}
                      className="text-xs font-bold text-[var(--accent)] hover:underline flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border-subtle)]"
                    >
                      Read Full Terms <ExternalLink size={12} />
                    </button>
                  </div>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-2 leading-relaxed">
                    I confirm that I am at least 18 years of age and agree to strictly adhere to Aura&apos;s Terms of Service, Acceptable Use Policy, and community safety guidelines. I understand harassment, unlawful generation, and hateful behavior are strictly forbidden.
                  </p>
                </div>
              </div>
            </label>

            {/* ITEM 2: End-to-End Encryption & Zero-Knowledge Privacy */}
            <label
              className={`block p-4 sm:p-6 rounded-2xl sm:rounded-3xl border transition-all cursor-pointer ${
                agreedPrivacy
                  ? 'bg-emerald-500/10 border-emerald-500/40 shadow-md shadow-emerald-500/10'
                  : 'bg-[var(--surface)] border-[var(--border)] hover:border-emerald-500/40 hover:bg-[var(--surface-hover)]'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="pt-1 shrink-0">
                  <input
                    type="checkbox"
                    checked={agreedPrivacy}
                    onChange={(e) => setAgreedPrivacy(e.target.checked)}
                    className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg text-emerald-600 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer accent-emerald-600"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <span className="text-sm sm:text-base font-black text-[var(--text-primary)] flex items-center gap-2">
                      <Lock size={18} className="text-emerald-500 shrink-0" />
                      2. End-to-End Encryption & Zero-Knowledge Privacy Vault
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenDetailedPolicy('privacy-e2ee');
                      }}
                      className="text-xs font-bold text-emerald-500 hover:underline flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border-subtle)]"
                    >
                      Read E2EE Policy <ExternalLink size={12} />
                    </button>
                  </div>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-2 leading-relaxed">
                    I understand that chat histories, audio snippets, and custom personas are cryptographically sealed in local browser storage using AES-256-GCM. Decryption keys remain solely on my device and are never shared or sold to advertising networks or unauthenticated cloud databases.
                  </p>
                </div>
              </div>
            </label>

            {/* ITEM 3: AI Simulation & Prolonged Usage Responsibility */}
            <label
              className={`block p-4 sm:p-6 rounded-2xl sm:rounded-3xl border transition-all cursor-pointer ${
                agreedResponsibility
                  ? 'bg-pink-500/10 border-pink-500/40 shadow-md shadow-pink-500/10'
                  : 'bg-[var(--surface)] border-[var(--border)] hover:border-pink-500/40 hover:bg-[var(--surface-hover)]'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="pt-1 shrink-0">
                  <input
                    type="checkbox"
                    checked={agreedResponsibility}
                    onChange={(e) => setAgreedResponsibility(e.target.checked)}
                    className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg text-pink-600 focus:ring-pink-500 focus:ring-offset-0 cursor-pointer accent-pink-600"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <span className="text-sm sm:text-base font-black text-[var(--text-primary)] flex items-center gap-2">
                      <HeartHandshake size={18} className="text-pink-500 shrink-0" />
                      3. AI Persona Simulation & Long-Time Chatting Own Responsibility
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenDetailedPolicy('ai-responsibility');
                      }}
                      className="text-xs font-bold text-pink-500 hover:underline flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border-subtle)]"
                    >
                      Read AI Guidelines <ExternalLink size={12} />
                    </button>
                  </div>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-2 leading-relaxed">
                    I explicitly acknowledge that Aura personas are synthetic artificial intelligence simulations and not real biological humans. <strong>Prolonged chatting, emotional attachment, sleep schedules, and personal boundary management are conducted solely at my own discretion and personal responsibility.</strong>
                  </p>
                </div>
              </div>
            </label>

            {/* ITEM 4: AI Limitations & Limitation of Liability */}
            <label
              className={`block p-4 sm:p-6 rounded-2xl sm:rounded-3xl border transition-all cursor-pointer ${
                agreedLiability
                  ? 'bg-amber-500/10 border-amber-500/40 shadow-md shadow-amber-500/10'
                  : 'bg-[var(--surface)] border-[var(--border)] hover:border-amber-500/40 hover:bg-[var(--surface-hover)]'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="pt-1 shrink-0">
                  <input
                    type="checkbox"
                    checked={agreedLiability}
                    onChange={(e) => setAgreedLiability(e.target.checked)}
                    className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg text-amber-600 focus:ring-amber-500 focus:ring-offset-0 cursor-pointer accent-amber-600"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <span className="text-sm sm:text-base font-black text-[var(--text-primary)] flex items-center gap-2">
                      <AlertTriangle size={18} className="text-amber-500 shrink-0" />
                      4. Generative AI Limitations & Limitation of Liability
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenDetailedPolicy('liability');
                      }}
                      className="text-xs font-bold text-amber-500 hover:underline flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border-subtle)]"
                    >
                      Read Disclaimers <ExternalLink size={12} />
                    </button>
                  </div>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-2 leading-relaxed">
                    I understand that generative AI can hallucinate and is provided strictly &quot;as is&quot;. Aura must never be relied upon for certified medical treatment, psychiatric emergency intervention, legal advice, or financial planning. Developer liability is limited to the fullest extent permitted by law.
                  </p>
                </div>
              </div>
            </label>

            {/* Persistent device note */}
            <div className="p-4 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border-subtle)] text-xs text-[var(--text-muted)] flex items-center gap-3">
              <Info size={18} className="text-[var(--accent)] shrink-0" />
              <span>
                Once accepted, your cryptographic agreement is stored locally so you won&apos;t be prompted again on future visits from this browser. You can re-open or review these terms anytime from the bottom footer.
              </span>
            </div>

          </div>
        </main>

        {/* FULL PAGE STICKY FOOTER */}
        <footer className="border-t border-[var(--border)] shrink-0 bg-[var(--surface-glass)] backdrop-blur-2xl px-4 sm:px-8 py-4 sm:py-5">
          <div className="max-w-5xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-4">
            
            <div className="text-xs sm:text-sm text-center sm:text-left">
              {allAgreed ? (
                <span className="text-emerald-500 font-bold flex items-center gap-2 justify-center sm:justify-start">
                  <CheckCircle2 size={16} /> All 4 agreements verified! You are ready to enter Aura.
                </span>
              ) : (
                <span className="text-[var(--text-secondary)]">
                  Please checkmark all <strong>4 agreements above</strong> to unlock the button.
                </span>
              )}
            </div>

            <button
              type="button"
              disabled={!allAgreed}
              onClick={handleProceed}
              className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-xl ${
                allAgreed
                  ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white hover:opacity-95 shadow-purple-500/30 transform hover:scale-[1.02] active:scale-[0.98]'
                  : 'bg-[var(--surface-secondary)] text-[var(--text-muted)] border border-[var(--border)] opacity-60 cursor-not-allowed shadow-none'
              }`}
            >
              <Sparkles size={18} />
              <span>Agree & Proceed to Aura</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </footer>
      </motion.div>
    </AnimatePresence>
  );
};
