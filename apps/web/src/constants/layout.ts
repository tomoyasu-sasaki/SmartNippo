import { COMMON_CONSTANTS } from './common';

export const LAYOUT_CONSTANTS = {
  APP_NAME: COMMON_CONSTANTS.APP_NAME,

  // for screen reader
  TOGGLE_NAVIGATION_MENU_SR: 'Toggle navigation menu',
  TOGGLE_USER_MENU_SR: 'Toggle user menu',
  TOGGLE_THEME_SR: 'Toggle theme',

  // Navigation Links
  NAV_LINKS: {
    DASHBOARD: 'ダッシュボード',
    REPORTS: '日報',
    ANALYTICS: '分析（準備中）',
    PROFILE: 'プロフィール',
    ADMIN: '管理',
    SETTINGS: '設定', // This seems to be in header.tsx but not in navigation.tsx
  },

  // User Dropdown Menu
  USER_MENU: {
    MY_ACCOUNT: 'マイアカウント',
    PROFILE: 'プロフィール',
    SETTINGS: '設定',
    LOGOUT: 'ログアウト',
  },

  // Auth Buttons
  LOGIN_BUTTON: 'ログイン',

  // Theme Toggle
  THEME: {
    LIGHT: 'Light',
    DARK: 'Dark',
    SYSTEM: 'System',
  },
} as const;
