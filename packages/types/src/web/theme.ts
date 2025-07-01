// ========================================
// Theme-related types specific to web
// ========================================

export interface Theme {
  mode: 'light' | 'dark' | 'system';
}

export interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  foreground: string;
  muted: string;
  accent: string;
  error: string;
  warning: string;
  success: string;
  info: string;
}
