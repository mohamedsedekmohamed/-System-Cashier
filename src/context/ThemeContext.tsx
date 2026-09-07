import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ThemeContextType, ThemeColor, FontSize } from '../types';

const colorMap: Record<ThemeColor, { primary: string; dark: string }> = {
  blue:   { primary: '#3b82f6', dark: '#2563eb' },
  green:  { primary: '#10b981', dark: '#059669' },
  red:    { primary: '#ef4444', dark: '#dc2626' },
  purple: { primary: '#8b5cf6', dark: '#7c3aed' },
  orange: { primary: '#f97316', dark: '#ea580c' },
  teal:   { primary: '#14b8a6', dark: '#0d9488' },
};

const fontSizeMap: Record<FontSize, string> = {
  small:  '13px',
  medium: '16px',
  large:  '19px',
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState<boolean>(() => localStorage.getItem('theme') === 'dark');
  const [themeColor, setThemeColorState] = useState<ThemeColor>(
    () => (localStorage.getItem('themeColor') as ThemeColor) || 'blue'
  );
  const [fontSize, setFontSizeState] = useState<FontSize>(
    () => (localStorage.getItem('fontSize') as FontSize) || 'medium'
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    const { primary, dark } = colorMap[themeColor];
    document.documentElement.style.setProperty('--color-primary', primary);
    document.documentElement.style.setProperty('--color-primary-dark', dark);
    localStorage.setItem('themeColor', themeColor);
  }, [themeColor]);

  useEffect(() => {
    document.documentElement.style.setProperty('--font-size-base', fontSizeMap[fontSize]);
    localStorage.setItem('fontSize', fontSize);
  }, [fontSize]);

  return (
    <ThemeContext.Provider
      value={{
        isDark,
        toggleDark: () => setIsDark(p => !p),
        themeColor,
        setThemeColor: setThemeColorState,
        fontSize,
        setFontSize: setFontSizeState,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be inside ThemeProvider');
  return ctx;
};
