import React, { createContext, useContext } from 'react';

export const palettes = {
  light: {
    background: '#F2F2F2',
    surface: '#FFFFFF',
    primary: '#5C4E4E',
    secondary: '#988686',
    text: '#000000',
    textMuted: '#5C4E4E',
    border: '#988686',
    onPrimary: '#FFFFFF',
  },
  dark: {
    background: '#000000',
    surface: '#121212',
    primary: '#5C4E4E',
    secondary: '#988686',
    text: '#D1D0D0',
    textMuted: '#988686',
    border: '#988686',
    onPrimary: '#FFFFFF',
  },
};

export const ThemeContext = createContext(palettes.light);

export function ThemeProvider({ themeName = 'light', children }) {
  const palette = palettes[themeName] || palettes.light;
  return (
    <ThemeContext.Provider value={palette}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}