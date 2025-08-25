import { useEffect } from 'react';
import { useAppStore, Theme } from '@/stores';

export default function useTheme() {
  const { theme, setTheme } = useAppStore();

  useEffect(() => {
    // Load theme from localStorage on mount
    const savedTheme = localStorage.getItem('polygent-theme') as Theme;
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      setTheme(savedTheme);
    }
  }, [setTheme]);

  useEffect(() => {
    // Apply theme to document
    const root = document.documentElement;

    const applyTheme = (isDark: boolean) => {
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    if (theme === 'dark') {
      applyTheme(true);
    } else if (theme === 'light') {
      applyTheme(false);
    } else {
      // System theme
      const prefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)'
      ).matches;
      applyTheme(prefersDark);

      // Listen for system theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        if (theme === 'system') {
          applyTheme(e.matches);
        }
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    // Save theme to localStorage
    localStorage.setItem('polygent-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme: Theme =
      theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    setTheme(nextTheme);
  };

  return {
    theme,
    setTheme,
    toggleTheme
  };
}
