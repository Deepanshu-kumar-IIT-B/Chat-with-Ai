import React, { createContext, useContext, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';

export type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'light';
    try {
      const savedTheme = localStorage.getItem('aura_theme');
      if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
      const savedDark = localStorage.getItem('aura_dark_mode');
      if (savedDark === 'true') return 'dark';
      if (savedDark === 'false') return 'light';
      // System preference check
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch {}
    return 'light';
  });

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('aura_theme', newTheme);
      localStorage.setItem('aura_dark_mode', newTheme === 'dark' ? 'true' : 'false');
    } catch {}
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      body.classList.add('dark');
      body.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      body.classList.remove('dark');
      body.classList.add('light');
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Compact Modern Glass Blush Theme Toggle
export const ThemeToggle: React.FC<{ className?: string; compact?: boolean }> = ({ 
  className = '', 
  compact = false 
}) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  if (compact) {
    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.94 }}
        onClick={toggleTheme}
        className={`p-2 sm:p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-center backdrop-blur-md ${
          isDark
            ? 'bg-white/10 hover:bg-white/15 border-white/15 text-amber-300 shadow-sm'
            : 'bg-white/80 hover:bg-white border-[var(--border)] text-purple-700 shadow-2xs'
        } ${className}`}
        title={isDark ? 'Switch to Light theme' : 'Switch to Dark theme'}
        aria-label={isDark ? 'Switch to Light theme' : 'Switch to Dark theme'}
      >
        {isDark ? <Sun size={17} className="animate-spin-slow" /> : <Moon size={17} />}
      </motion.button>
    );
  }

  return (
    <div
      className={`inline-flex items-center p-1 rounded-2xl border backdrop-blur-xl transition-all ${
        isDark
          ? 'bg-white/[0.06] border-white/10 shadow-inner'
          : 'bg-white/80 border-[var(--border)] shadow-xs'
      } ${className}`}
    >
      <button
        onClick={() => theme !== 'light' && toggleTheme()}
        className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none ${
          !isDark
            ? 'text-[var(--text-primary)] shadow-2xs font-black'
            : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
        }`}
        aria-label="Light mode"
      >
        {!isDark && (
          <motion.div
            layoutId="theme-active-pill"
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="absolute inset-0 bg-white rounded-xl shadow-xs border border-purple-100"
          />
        )}
        <span className="relative z-10 flex items-center gap-1">
          <Sun size={13} className={!isDark ? 'text-amber-500' : ''} />
          <span className="hidden xs:inline sm:inline">Light</span>
        </span>
      </button>

      <button
        onClick={() => theme !== 'dark' && toggleTheme()}
        className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none ${
          isDark
            ? 'text-white shadow-2xs font-black'
            : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
        }`}
        aria-label="Dark mode"
      >
        {isDark && (
          <motion.div
            layoutId="theme-active-pill"
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="absolute inset-0 bg-gradient-to-r from-violet-600/90 to-purple-600/90 rounded-xl shadow-xs border border-white/15"
          />
        )}
        <span className="relative z-10 flex items-center gap-1">
          <Moon size={13} className={isDark ? 'text-violet-200' : ''} />
          <span className="hidden xs:inline sm:inline">Dark</span>
        </span>
      </button>
    </div>
  );
};
