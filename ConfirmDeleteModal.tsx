import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  personaName?: string;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({ isOpen, onClose, onConfirm, personaName }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-6 pt-safe pb-safe pl-safe pr-safe">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[var(--overlay)] backdrop-blur-md"
          />

          {/* Modal Container (Glass Blush) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.25 }}
            className="relative w-full max-w-sm bg-[var(--surface)] backdrop-blur-2xl rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-7 overflow-hidden shadow-2xl border border-[var(--border)] z-10 text-[var(--text-primary)] transition-colors my-auto"
          >
            {/* Top danger accent */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-rose-500 via-red-500 to-amber-500" />
            
            <motion.button 
              whileHover={{ rotate: 90, scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X size={18} />
            </motion.button>

            <div className="mb-6">
              <div className="relative inline-block mb-4">
                <motion.div 
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  className="p-3.5 bg-rose-500/15 border border-rose-500/25 rounded-2xl text-rose-600 dark:text-rose-400 shadow-2xs inline-flex"
                >
                  <Trash2 size={24} />
                </motion.div>
              </div>

              <h2 className="text-2xl font-black text-[var(--text-primary)] mb-2">Delete Persona?</h2>
              <p className="text-[var(--text-muted)] text-sm leading-relaxed">
                Are you sure you want to permanently remove <strong className="text-[var(--text-primary)] font-bold">{personaName}</strong>? This action cannot be reversed.
              </p>
            </div>

            <div className="flex gap-3 mt-6">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={onClose}
                className="btn-glass-blush-subtle flex-1 font-bold rounded-2xl px-4 py-3.5 text-sm cursor-pointer"
              >
                Cancel
              </motion.button>
              
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className="flex-1 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold rounded-2xl px-4 py-3.5 text-sm shadow-lg shadow-rose-600/25 hover:shadow-rose-600/35 transition-all cursor-pointer"
              >
                Delete Persona
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
