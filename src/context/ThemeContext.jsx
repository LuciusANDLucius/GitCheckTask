import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import StorageService from '../services/storageService.js';
import { DARK_COLORS, LIGHT_COLORS } from '../constants/colors.js';

const THEME_STORAGE_KEY = '@devrepo_theme_mode';
const FONT_SCALE_STORAGE_KEY = '@devrepo_font_scale';

export const ThemeContext = createContext({
  theme: 'dark',
  isDark: true,
  toggleTheme: () => {},
  setTheme: () => {},
  fontSizeScale: 'normal',
  fontScaleMultiplier: 1.0,
  setFontSizeScale: () => {},
  scaleFont: (s) => s,
  colors: DARK_COLORS,
});

export const FONT_SCALE_MULTIPLIERS = {
  normal: 1.0,
  large:  1.15,
  xlarge: 1.30,
};

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState('dark');
  const [fontSizeScale, setFontSizeScaleState] = useState('normal');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedTheme = await StorageService.getItem(THEME_STORAGE_KEY);
        if (savedTheme === 'light' || savedTheme === 'dark') {
          setThemeState(savedTheme);
        }
        const savedFont = await StorageService.getItem(FONT_SCALE_STORAGE_KEY);
        if (savedFont && FONT_SCALE_MULTIPLIERS[savedFont]) {
          setFontSizeScaleState(savedFont);
        }
      } catch (e) {
        console.warn('Could not restore theme/font settings:', e);
      }
    };
    loadSettings();
  }, []);

  const setTheme = useCallback(async (newTheme) => {
    const next = newTheme === 'light' ? 'light' : 'dark';
    setThemeState(next);
    await StorageService.setItem(THEME_STORAGE_KEY, next);
  }, []);

  const toggleTheme = useCallback(async () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setThemeState(next);
    await StorageService.setItem(THEME_STORAGE_KEY, next);
  }, [theme]);

  const setFontSizeScale = useCallback(async (newScale) => {
    if (FONT_SCALE_MULTIPLIERS[newScale]) {
      setFontSizeScaleState(newScale);
      await StorageService.setItem(FONT_SCALE_STORAGE_KEY, newScale);
    }
  }, []);

  const fontScaleMultiplier = FONT_SCALE_MULTIPLIERS[fontSizeScale] || 1.0;

  const scaleFont = useCallback((baseSize) => {
    return Math.round(baseSize * fontScaleMultiplier);
  }, [fontScaleMultiplier]);

  const isDark = theme === 'dark';
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

  const value = {
    theme,
    isDark,
    toggleTheme,
    setTheme,
    fontSizeScale,
    fontScaleMultiplier,
    setFontSizeScale,
    scaleFont,
    colors,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      theme: 'dark',
      isDark: true,
      toggleTheme: () => {},
      setTheme: () => {},
      fontSizeScale: 'normal',
      fontScaleMultiplier: 1.0,
      setFontSizeScale: () => {},
      scaleFont: (s) => s,
      colors: DARK_COLORS,
    };
  }
  return ctx;
};

export default ThemeContext;
