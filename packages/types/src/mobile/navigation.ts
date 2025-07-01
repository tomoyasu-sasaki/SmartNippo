// ========================================
// Navigation types for mobile
// ========================================

// タブナビゲーションのパラメータ型
export interface TabParamList {
  index: undefined;
  reports: undefined;
  profile: undefined;
}

// 認証ナビゲーションのパラメータ型
export interface AuthParamList {
  index: undefined;
}

// レポートナビゲーションのパラメータ型
export interface ReportsParamList {
  index: undefined;
  create: undefined;
  '[id]': {
    id: string;
  };
  _layout: undefined;
}

// ルートナビゲーションのパラメータ型
export interface RootParamList {
  '(auth)': undefined;
  '(tabs)': undefined;
  index: undefined;
}

// ナビゲーション状態の型定義
export interface NavigationState {
  canGoBack: boolean;
  canGoForward: boolean;
  currentRoute: string;
  params?: Record<string, unknown>;
}

// 画面の型定義
export type ScreenName = 'Home' | 'Reports' | 'ReportDetail' | 'CreateReport' | 'Profile' | 'Auth';

// ナビゲーションアクションの型定義
export interface NavigationAction {
  type: 'NAVIGATE' | 'GO_BACK' | 'REPLACE' | 'RESET';
  payload?: {
    screen?: ScreenName;
    params?: Record<string, unknown>;
  };
}
