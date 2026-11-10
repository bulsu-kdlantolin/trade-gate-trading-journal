import React, { createContext, useContext, useEffect, useState } from 'react';
import { storage } from '../utils/storage';

export type AppTheme = 'dark' | 'light';

interface ThemeContextType {
  theme: AppTheme;
  isDark: boolean;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  isDark: true,
  setTheme: () => {},
  toggleTheme: () => {},
});

const THEME_STORAGE_KEY = 'tradegate_crypto_theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>('dark');

  useEffect(() => {
    async function loadTheme() {
      const saved = await storage.get<AppTheme>(THEME_STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') {
        applyTheme(saved);
      } else {
        applyTheme('dark');
      }
    }
    loadTheme();
  }, []);

  const applyTheme = (targetTheme: AppTheme) => {
    setThemeState(targetTheme);
    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(targetTheme);
    root.setAttribute('data-theme', targetTheme);
  };

  const setTheme = (newTheme: AppTheme) => {
    applyTheme(newTheme);
    storage.set(THEME_STORAGE_KEY, newTheme);
  };

  const toggleTheme = () => {
    const nextTheme: AppTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark: theme === 'dark',
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

