/**
 * SmartNippo アプリケーション定数
 */

// User roles
export const USER_ROLES = {
  USER: 'user',
  MANAGER: 'manager',
  ADMIN: 'admin',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

// Report statuses
export const REPORT_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export type ReportStatus = (typeof REPORT_STATUS)[keyof typeof REPORT_STATUS];

export const REPORT_STATUS_LABELS = {
  [REPORT_STATUS.DRAFT]: '下書き',
  [REPORT_STATUS.SUBMITTED]: '提出済み',
  [REPORT_STATUS.APPROVED]: '承認済み',
  [REPORT_STATUS.REJECTED]: '差戻し',
} as const;

export const REPORT_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;

export const REPORT_PRIORITY_LABELS = {
  [REPORT_PRIORITY.LOW]: '低',
  [REPORT_PRIORITY.MEDIUM]: '中',
  [REPORT_PRIORITY.HIGH]: '高',
} as const;

export const REPORT_DIFFICULTY = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
} as const;

export const REPORT_DIFFICULTY_LABELS = {
  [REPORT_DIFFICULTY.EASY]: '簡単',
  [REPORT_DIFFICULTY.MEDIUM]: '普通',
  [REPORT_DIFFICULTY.HARD]: '難しい',
} as const;

// Comment types
export const COMMENT_TYPE = {
  USER: 'user',
  SYSTEM: 'system',
  AI: 'ai',
} as const;

export type CommentType = (typeof COMMENT_TYPE)[keyof typeof COMMENT_TYPE];

/**
 * プライバシーレベル定義
 */
export const PRIVACY_LEVELS = {
  public: { label: '公開', description: 'すべてのユーザーに公開' },
  organization: { label: '組織内', description: '組織内のユーザーに公開' },
  team: { label: 'チーム内', description: 'チーム内のユーザーに公開' },
  private: { label: '非公開', description: '自分のみ' },
} as const;

/**
 * ソーシャルプラットフォーム定義
 */
export const SOCIAL_PLATFORMS = {
  twitter: { name: 'Twitter', icon: '🐦', pattern: /^https?:\/\/(www\.)?twitter\.com\/.+$/ },
  linkedin: { name: 'LinkedIn', icon: '💼', pattern: /^https?:\/\/(www\.)?linkedin\.com\/.+$/ },
  github: { name: 'GitHub', icon: '🐙', pattern: /^https?:\/\/(www\.)?github\.com\/.+$/ },
  instagram: { name: 'Instagram', icon: '📷', pattern: /^https?:\/\/(www\.)?instagram\.com\/.+$/ },
  facebook: { name: 'Facebook', icon: '👥', pattern: /^https?:\/\/(www\.)?facebook\.com\/.+$/ },
  youtube: { name: 'YouTube', icon: '🎥', pattern: /^https?:\/\/(www\.)?youtube\.com\/.+$/ },
  website: { name: 'Website', icon: '🌐', pattern: /^https?:\/\/.+$/ },
} as const;

// API endpoints
export const API_ENDPOINTS = {
  REPORTS: '/api/reports',
  USERS: '/api/users',
  ORGANIZATIONS: '/api/organizations',
  COMMENTS: '/api/comments',
  AUTH: '/api/auth',
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'smartnippo_auth_token',
  USER_PREFERENCES: 'smartnippo_user_preferences',
  DRAFT_REPORTS: 'smartnippo_draft_reports',
  THEME: 'smartnippo_theme',
} as const;

// Date formats
export const DATE_FORMATS = {
  ISO_DATE: 'yyyy-MM-dd',
  DISPLAY_DATE: 'yyyy年MM月dd日',
  DISPLAY_DATETIME: 'yyyy年MM月dd日 HH:mm',
  TIME_ONLY: 'HH:mm',
} as const;

// Validation limits
export const VALIDATION_LIMITS = {
  REPORT_TITLE_MAX: 100,
  REPORT_CONTENT_MAX: 5000,
  COMMENT_MAX: 1000,
  USER_NAME_MAX: 50,
  ORG_NAME_MAX: 100,
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 128,
} as const;

// File upload limits
export const FILE_LIMITS = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
} as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

// Theme colors (Tailwind CSS compatible)
export const THEME_COLORS = {
  PRIMARY: {
    50: '#eff6ff',
    100: '#dbeafe',
    500: '#3b82f6',
    600: '#2563eb',
    900: '#1e3a8a',
  },
  SECONDARY: {
    50: '#f8fafc',
    100: '#f1f5f9',
    500: '#64748b',
    600: '#475569',
    900: '#0f172a',
  },
  SUCCESS: {
    50: '#f0fdf4',
    500: '#22c55e',
    600: '#16a34a',
  },
  WARNING: {
    50: '#fffbeb',
    500: '#f59e0b',
    600: '#d97706',
  },
  ERROR: {
    50: '#fef2f2',
    500: '#ef4444',
    600: '#dc2626',
  },
} as const;

// App configuration
export const APP_CONFIG = {
  NAME: 'SmartNippo',
  VERSION: '1.0.0',
  DESCRIPTION: 'Expo × Convex Daily-Report App',
  AUTHOR: 'SmartNippo Team',
} as const;

// Feature flags
export const FEATURE_FLAGS = {
  AI_SUMMARY: true,
  AI_CHAT: true,
  PUSH_NOTIFICATIONS: true,
  OFFLINE_MODE: true,
  ANALYTICS: true,
  DARK_MODE: true,
} as const;

/**
 * 共通のUIメッセージ
 */
export const COMMON_MESSAGES = {
  LOADING: 'Loading...',
  LOADING_JP: '読み込み中...',
  SAVING: '保存中...',
  SUBMITTING: '送信中...',
  PROCESSING: '処理中...',
  ERROR_GENERIC: 'エラーが発生しました',
  ERROR_NETWORK: 'ネットワークエラーが発生しました',
  ERROR_PERMISSION: '権限がありません',
  SUCCESS_SAVE: '保存しました',
  SUCCESS_SUBMIT: '送信しました',
  SUCCESS_DELETE: '削除しました',
  CONFIRM_DELETE: '本当に削除しますか？',
  CANCEL: 'キャンセル',
  SAVE: '保存',
  SUBMIT: '送信',
  DELETE: '削除',
  EDIT: '編集',
  CREATE: '作成',
  BACK: '戻る',
  NEXT: '次へ',
  PREVIOUS: '前へ',
  CLOSE: '閉じる',
  CONFIRM: '確認',
  RETRY: '再試行',
} as const;

/**
 * フォームバリデーションメッセージ
 */
export const VALIDATION_MESSAGES = {
  REQUIRED: '必須項目です',
  TITLE_REQUIRED: 'タイトルは必須です',
  TITLE_MAX_LENGTH: 'タイトルは200文字以内で入力してください',
  CONTENT_REQUIRED: '内容は必須です',
  CONTENT_MAX_LENGTH: '内容は10000文字以内で入力してください',
  EMAIL_INVALID: '有効なメールアドレスを入力してください',
  DATE_INVALID: '有効な日付を入力してください',
  NAME_REQUIRED: 'Name is required',
  NAME_TOO_LONG: 'Name is too long',
} as const;

/**
 * 日報のメタデータセクション
 */
export const REPORT_METADATA_SECTIONS = {
  DIFFICULTY: '難易度',
  ACHIEVEMENTS: '成果・達成事項',
  CHALLENGES: '課題・困った点',
  LEARNINGS: '学んだこと',
  NEXT_ACTIONS: '次のアクション',
} as const;

/**
 * 認証関連定数
 */
export const AUTH_CONSTANTS = {
  SCREEN_TITLES: {
    SIGN_UP: 'Create Account',
    SIGN_IN: 'Welcome Back',
  },
  DESCRIPTIONS: {
    SIGN_UP: 'Sign up to start managing your daily reports',
    SIGN_IN: 'Sign in to your account',
  },
  FORM_LABELS: {
    EMAIL: 'Email',
    PASSWORD: 'Password',
  },
  PLACEHOLDERS: {
    EMAIL: 'Enter your email',
    PASSWORD: 'Enter your password',
  },
  BUTTONS: {
    SIGN_UP: 'Sign Up',
    SIGN_IN: 'Sign In',
    LOADING: 'Loading...',
    GOOGLE_AUTH: 'Continue with Google',
    LOGIN_SSO: 'SSOでログイン',
    LOGIN: 'ログイン',
    SIGNUP: '新規登録',
  },
  LINKS: {
    HAVE_ACCOUNT: 'Already have an account? ',
    NO_ACCOUNT: "Don't have an account? ",
    TERMS_OF_SERVICE: '利用規約',
    PRIVACY_POLICY: 'プライバシーポリシー',
  },
  ERRORS: {
    REQUIRED_FIELDS: 'Please fill in all fields',
    AUTH_FAILED: 'Authentication failed',
    GOOGLE_AUTH_FAILED: 'Google authentication failed',
  },
  SUCCESS: {
    ACCOUNT_CREATED: 'Account created! Please check your email for verification.',
  },
  MESSAGES: {
    LOGIN_PAGE_TITLE: 'SmartNippoへようこそ',
    LOGIN_PAGE_DESCRIPTION: '日々の記録を、もっとスマートに。',
    WELCOME_TITLE: 'ようこそ SmartNippo へ',
    LOGIN_PROMPT: '日報管理システムを利用するにはログインしてください',
    SYSTEM_DESCRIPTION:
      'SmartNippoは、チームの日報を効率的に管理するためのシステムです。\n日報の作成・閲覧・承認をスムーズに行えます。',
    TERMS_AGREEMENT_PREFIX: 'ログインすることで、',
    TERMS_AGREEMENT_SUFFIX: 'に同意したことになります。',
    COPYRIGHT: '© 2024 SmartNippo. All rights reserved.',
  },
} as const;

/**
 * プロフィール関連定数
 */
export const PROFILE_CONSTANTS = {
  SCREEN_TITLE: 'Profile',
  PAGE_TITLE: 'プロフィール設定',
  PAGE_DESCRIPTION: 'プロフィール情報と設定を管理',
  LOADING_TEXT: 'Loading...',
  ERROR_TEXT: 'Not authenticated',
  LOADING: 'Loading...',

  // 認証関連
  CREATE_PROFILE_ERROR: 'プロフィールの作成に失敗しました。ページを再読み込みしてください。',
  AUTH_REQUIRED_TITLE: '認証が必要です',
  AUTH_REQUIRED_DESCRIPTION: 'プロフィールにアクセスするにはログインしてください。',
  SETUP_PROFILE: 'プロフィールを設定中...',
  PROFILE_ERROR_TITLE: 'プロフィールエラー',
  PROFILE_ERROR_DESCRIPTION: 'プロフィールを読み込めません。ページを再読み込みしてください。',

  // カード関連
  PERSONAL_INFO_CARD_TITLE: '個人情報',
  PERSONAL_INFO_CARD_DESCRIPTION: 'プロフィール詳細を更新',
  SOCIAL_LINKS_CARD_TITLE: 'ソーシャルリンク',
  SOCIAL_LINKS_CARD_DESCRIPTION: 'SNSプロフィールを連携',
  PRIVACY_SETTINGS_CARD_TITLE: 'プライバシー設定',
  PRIVACY_SETTINGS_CARD_DESCRIPTION: '情報の公開範囲を管理',
  EXPORT_PROFILE_CARD_TITLE: 'プロフィールのエクスポート',
  EXPORT_PROFILE_CARD_DESCRIPTION: 'プロフィールデータをダウンロード',
  ACCOUNT_DETAILS_CARD_TITLE: 'アカウント詳細',

  // ラベル関連
  EMAIL_LABEL: 'Email',
  ROLE_LABEL: 'Role',
  MEMBER_SINCE_LABEL: 'Member Since',
  AVATAR_LABEL: 'プロフィール画像',
  NAME_LABEL: '名前',
  ADD_SOCIAL_LINK_LABEL: 'ソーシャルリンクを追加',

  // 状態関連
  EMAIL_NOT_SET: '未設定',

  // フォーム関連
  FORM_LABELS: {
    NAME: '名前',
    SOCIAL_LINKS: 'ソーシャルリンク',
    PRIVACY_SETTINGS: 'プライバシー設定',
    EMAIL: 'Email',
    ROLE: 'Role',
    MEMBER_SINCE: 'Member Since',
    AVATAR: 'プロフィール画像',
  },
  PLACEHOLDERS: {
    NAME: '名前を入力してください',
    SELECT_PLATFORM: 'プラットフォームを選択',
  },
  SELECT_PLATFORM_PLACEHOLDER: 'プラットフォームを選択',

  // プライバシーオプション
  PRIVACY_OPTION_PROFILE: 'プロフィール全体',
  PRIVACY_OPTION_EMAIL: 'メールアドレス',
  PRIVACY_OPTION_SOCIAL_LINKS: 'ソーシャルリンク',
  PRIVACY_OPTION_REPORTS: '日報',

  // ボタン関連
  CANCEL_BUTTON: 'キャンセル',
  SAVE_BUTTON: '保存',
  EDIT_BUTTON: '編集',
  SAVE_SETTINGS_BUTTON: '設定を保存',
  EXPORT_BUTTON: 'プロフィールをエクスポート',
  SUBMIT_BUTTON_TEXT: 'プロフィールを更新',

  // 説明文
  AVATAR_DESCRIPTION: 'プロフィール画像をアップロードまたはドラッグ&ドロップしてください',
  NAME_DESCRIPTION: '表示名として使用されます',
  EXPORT_DESCRIPTION: 'プロフィールデータをJSON形式でダウンロードできます。',

  // エラー・成功メッセージ
  UPDATE_SUCCESS_MESSAGE: 'プロフィールを更新しました',
  UPDATE_CONFLICT_ERROR_MESSAGE:
    'プロフィールが他の場所で更新されています。画面を再読み込みしてください。',
  UPDATE_GENERAL_ERROR_MESSAGE: 'プロフィールの更新に失敗しました',
  AVATAR_UPLOAD_SUCCESS_MESSAGE: '画像がアップロードされました',
  INVALID_URL_ERROR: '無効なURLです',
  UPDATE_ERROR: '更新に失敗しました',
  UPDATE_SOCIAL_LINKS_SUCCESS: 'ソーシャルリンクを更新しました',
  UPDATE_PRIVACY_SUCCESS: 'プライバシー設定を更新しました',
  EXPORT_SUCCESS: 'プロフィールをエクスポートしました',

  // プロンプト
  PROMPT_URL: (platform: string) => `${platform}のURLを入力してください:`,

  BUTTONS: {
    EXPORT_PROFILE: 'Export Profile',
    EXPORT_BUTTON: 'プロフィールをエクスポート',
    SIGN_OUT: 'Sign Out',
    ADD_LINK: 'リンクを追加',
    ADD_SOCIAL_LINK: 'ソーシャルリンクを追加',
    SUBMIT: 'プロフィールを更新',
    SAVE_SETTINGS: '設定を保存',
  },
  DESCRIPTIONS: {
    NAME: '表示名として使用されます',
    AVATAR: 'プロフィール画像をアップロードまたはドラッグ&ドロップしてください',
    EXPORT: 'プロフィールデータをJSON形式でダウンロードできます。',
  },
  ALERTS: {
    SIGN_OUT_TITLE: 'Sign Out',
    SIGN_OUT_MESSAGE: 'Are you sure you want to sign out?',
    SIGN_OUT_CONFIRM: 'Sign Out',
    CANCEL: 'Cancel',
    SIGN_OUT_ERROR: 'Failed to sign out. Please try again.',
    PROFILE_UPDATE_SUCCESS: 'プロフィールを更新しました',
    PROFILE_UPDATE_ERROR: 'プロフィールの更新に失敗しました',
    PROFILE_CONFLICT_ERROR:
      'プロフィールが他の場所で更新されています。画面を再読み込みしてください。',
    IMAGE_UPLOAD_SUCCESS: '画像がアップロードされました',
    IMAGE_UPLOAD_ERROR: '画像のアップロードに失敗しました',
    EXPORT_COMING_SOON: 'この機能は準備中です',
    EXPORT_SUCCESS: 'プロフィールをエクスポートしました',
    URL_PROMPT: 'URLを入力してください',
    INVALID_URL: '無効なURLです',
    UPDATE_SUCCESS: '更新しました',
    UPDATE_ERROR: '更新に失敗しました',
    UPDATE_SOCIAL_LINKS_SUCCESS: 'ソーシャルリンクを更新しました',
    UPDATE_PRIVACY_SUCCESS: 'プライバシー設定を更新しました',
    CREATE_PROFILE_ERROR: 'プロフィールの作成に失敗しました。ページを再読み込みしてください。',
    AUTH_REQUIRED_TITLE: '認証が必要です',
    AUTH_REQUIRED_DESCRIPTION: 'プロフィールにアクセスするにはログインしてください。',
    SETUP_PROFILE: 'プロフィールを設定中...',
    PROFILE_ERROR_TITLE: 'プロフィールエラー',
    PROFILE_ERROR_DESCRIPTION: 'プロフィールを読み込めません。ページを再読み込みしてください。',
  },
  PROMPTS: {
    URL: (platform: string) => `${platform}のURLを入力してください:`,
  },
  SOCIAL_LINKS: {
    ADD_LINK_PROMPT: 'ソーシャルリンクを追加',
  },
  PRIVACY_OPTIONS: [
    { key: 'profile', label: 'プロフィール全体' },
    { key: 'email', label: 'メールアドレス' },
    { key: 'socialLinks', label: 'ソーシャルリンク' },
    { key: 'reports', label: '日報' },
    { key: 'avatar', label: 'プロフィール画像' },
  ],
  CARDS: {
    PERSONAL_INFO_TITLE: '個人情報',
    PERSONAL_INFO_DESCRIPTION: 'プロフィール詳細を更新',
    SOCIAL_LINKS_TITLE: 'ソーシャルリンク',
    SOCIAL_LINKS_DESCRIPTION: 'SNSプロフィールを連携',
    PRIVACY_SETTINGS_TITLE: 'プライバシー設定',
    PRIVACY_SETTINGS_DESCRIPTION: '情報の公開範囲を管理',
    EXPORT_PROFILE_TITLE: 'プロフィールのエクスポート',
    EXPORT_PROFILE_DESCRIPTION: 'プロフィールデータをダウンロード',
    ACCOUNT_DETAILS_TITLE: 'アカウント詳細',
  },
  STATUS: {
    EMAIL_NOT_SET: '未設定',
  },
} as const;

/**
 * ダッシュボード関連定数
 */
export const DASHBOARD_CONSTANTS = {
  SCREEN_TITLE: 'Reports',
  PAGE_TITLE: 'ダッシュボード',
  META_TITLE: 'ダッシュボード | SmartNippo',
  META_DESCRIPTION: '日報管理システムのダッシュボード',
  LOADING_TEXT: 'Loading...',
  ERROR_TEXT: 'Not authenticated',
  LOADING_MESSAGE: '読み込み中...',
  CREATE_REPORT_BUTTON: '日報を作成',
  BUTTONS: {
    CREATE_REPORT: '日報を作成',
    CREATE_NEW_REPORT: 'Create New Report',
    VIEW_DETAILS: '詳細を見る',
    VIEW_ALL_REPORTS: 'すべての日報を見る',
  },
  WELCOME_SECTION: {
    WELCOME_TEXT: 'Welcome,',
    ROLE_LABEL: 'Role: ',
  },
  MAIN_CONTENT: {
    DESCRIPTION: 'Daily report functionality will be implemented here',
  },
  ALERTS: {
    USER_SYNC_ERROR: 'Failed to sync user',
    REPORT_CREATION_COMING_SOON: 'Report creation coming soon!',
  },
  STATS_CARD: {
    THIS_MONTH_REPORTS_TITLE: '今月の日報',
    THIS_MONTH_REPORTS_DESC: '作成済み',
    APPROVED_TITLE: '承認済み',
    APPROVAL_RATE: (rate: number) => `承認率 ${rate}%`,
    PENDING_SUBMISSION_TITLE: '承認待ち',
    PENDING_SUBMISSION_DESC: '下書き',
    PENDING_APPROVAL_TITLE: '承認待ち',
    PENDING_APPROVAL_DESC: 'チーム全体',
  },
  RECENT_REPORTS_CARD: {
    TITLE: '最近の日報',
    DESCRIPTION: '過去7日間の日報',
    NO_REPORTS: '最近の日報はありません',
    AUTHOR_PREFIX: '作成者:',
    VIEW_DETAILS_BUTTON: '詳細を見る',
    VIEW_ALL_REPORTS_BUTTON: 'すべての日報を見る',
  },
  QUICK_ACTIONS: {
    MONTHLY_ACTIVITY_TITLE: '今月の活動',
    SUBMISSION_RATE_LABEL: '提出率',
    APPROVAL_RATE_LABEL: '承認率',
    TEAM_STATUS_TITLE: 'チーム状況',
    TEAM_TOTAL_REPORTS_LABEL: 'チーム全体の日報',
    TEAM_PENDING_APPROVAL_LABEL: '承認待ち',
    ACTIVITY_TREND_TITLE: '活動の推移 (過去30日)',
    CHART_NO_DATA: 'チャートを表示するのに十分なデータがありません。',
  },
} as const;

/**
 * コンポーネント関連定数
 */
export const COMPONENT_CONSTANTS = {
  AVATAR_PICKER: {
    ALERTS: {
      SELECT_TITLE: 'アバター画像を選択',
      SELECT_MESSAGE: '写真の選択方法を選んでください',
      PERMISSION_LIBRARY_TITLE: '権限が必要です',
      PERMISSION_LIBRARY_MESSAGE:
        'フォトライブラリへのアクセス権限が必要です。設定で許可してください。',
      PERMISSION_CAMERA_TITLE: '権限が必要です',
      PERMISSION_CAMERA_MESSAGE: 'カメラへのアクセス権限が必要です。設定で許可してください。',
      ERROR_TITLE: 'エラー',
      ERROR_MESSAGE: '画像の処理中にエラーが発生しました',
    },
    BUTTONS: {
      CANCEL: 'キャンセル',
      PHOTO_LIBRARY: 'フォトライブラリ',
      CAMERA: 'カメラで撮影',
    },
    PROCESSING_TEXT: '処理中...',
  },
} as const;

/**
 * レイアウト関連定数
 */
export const LAYOUT_CONSTANTS = {
  APP_NAME: APP_CONFIG.NAME,

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
    SETTINGS: '設定',
  },

  // User Dropdown Menu
  USER_MENU: {
    MY_ACCOUNT: 'マイアカウント',
    PROFILE: 'プロフィール',
    SETTINGS: '設定',
    LOGOUT: 'ログアウト',
  },

  // Theme Toggle
  THEME: {
    LIGHT: 'Light',
    DARK: 'Dark',
    SYSTEM: 'System',
  },
} as const;

/**
 * エラーページ関連定数
 */
export const ERROR_PAGE_CONSTANTS = {
  NOT_FOUND_TITLE: 'ページが見つかりません',
  NOT_FOUND_DESCRIPTION: 'お探しのページは移動したか、削除された可能性があります。',
  NOT_FOUND_GUIDE: '以下のリンクから、目的のページを探してみてください：',
  ERROR_TITLE: 'エラーが発生しました',
  ERROR_DESCRIPTION: '申し訳ございません。予期しないエラーが発生しました。',
  ERROR_ID_PREFIX: 'エラーID:',
  HOME_BUTTON: 'ホームへ戻る',
  DASHBOARD_BUTTON: 'ダッシュボードへ',
  REPORTS_BUTTON: '日報一覧へ',
} as const;

/**
 * Web アプリケーション固有の定数
 */
export const WEB_SPECIFIC_CONSTANTS = {
  // Web固有のローカルストレージキー
  LOCAL_STORAGE_KEYS: {
    ...STORAGE_KEYS, // 共通キーをインポート
    SIDEBAR_COLLAPSED: 'sidebar-collapsed',
    REPORT_DRAFT: 'report-draft-web', // mobileと区別
  },

  // Web固有のセッションストレージキー
  SESSION_STORAGE_KEYS: {
    RETURN_URL: 'return-url',
    FORM_DATA: 'form-data',
  },

  // Web固有のメタデータ
  DEFAULT_META: {
    SITE_NAME: APP_CONFIG.NAME,
    DESCRIPTION:
      'SmartNippo は、日々の業務報告を効率化し、チームの透明性を高めるための日報管理システムです。',
    KEYWORDS: ['日報', 'レポート', '管理システム', 'チーム', '業務効率化', 'Convex', 'Next.js'],
  },
} as const;

/**
 * 日報関連定数
 */
export const REPORTS_CONSTANTS = {
  // Screen titles and headers
  SCREEN_TITLE: 'Reports',
  PAGE_TITLE: '日報管理',
  META_TITLE: '日報管理 | SmartNippo',
  META_DESCRIPTION: '日報の作成、編集、閲覧ができます',

  // Navigation and UI
  LOADING_TEXT: '読み込み中...',
  ERROR_TEXT: 'エラーが発生しました',
  EMPTY_STATE_TEXT: '日報がありません',

  PAGE_DESCRIPTION: '日報の作成・管理',
  CREATE_NEW_BUTTON: '新規作成',

  FILTER_CARD_TITLE: 'フィルター',
  SEARCH_PLACEHOLDER: 'タイトルや内容で検索... (⌘K)',
  STATUS_FILTER_PLACEHOLDER: 'ステータスで絞り込み',
  RESET_FILTER_BUTTON: 'フィルターをリセット',

  STATUS_ALL: 'すべて',
  STATUS: {
    draft: { variant: 'outline' as const, label: REPORT_STATUS_LABELS.draft },
    submitted: { variant: 'secondary' as const, label: REPORT_STATUS_LABELS.submitted },
    approved: { variant: 'default' as const, label: REPORT_STATUS_LABELS.approved },
    rejected: { variant: 'destructive' as const, label: REPORT_STATUS_LABELS.rejected },
  },

  TABLE_HEADER: {
    DATE: '日付',
    TITLE: 'タイトル',
    AUTHOR: '作成者',
    STATUS: 'ステータス',
    CREATED_AT: '作成日時',
    ACTIONS: '操作',
  },

  NO_REPORTS_MESSAGE: '日報が見つかりません',
  UNKNOWN_AUTHOR: 'Unknown',

  ACTION_BUTTON_DETAILS: '詳細',
  ACTION_BUTTON_EDIT: '編集',

  PAGINATION_SUMMARY: (total: number, count: number) => `全 ${total} 件中 ${count} 件を表示`,
  PAGINATION_PREVIOUS: '前へ',
  PAGINATION_NEXT: '次へ',

  // --- ReportDetail ---
  DETAIL_PAGE_TITLE: '日報詳細',
  BACK_BUTTON: '戻る',
  EDIT_BUTTON: '編集',
  SUBMIT_BUTTON: '送信',

  AUTHOR_PREFIX: '作成者',
  CREATED_AT_PREFIX: '作成日時',

  TASK_ESTIMATED_HOURS: '予定',
  TASK_ACTUAL_HOURS: '実績',

  AI_SUMMARY_TITLE: 'AI Summary',
  AI_SUMMARY_NOT_AVAILABLE: 'AI summary is not available yet.',

  APPROVAL_HISTORY_CARD_TITLE: '承認履歴',
  APPROVAL_ACTION_TEXT: (name: string) => `${name} が承認しました`,

  COMMENTS_CARD_TITLE: 'コメント',
  COMMENTS_COUNT: (count: number) => `${count} 件のコメント`,
  COMMENT_PLACEHOLDER: 'コメントを入力...',
  COMMENT_SUBMIT_BUTTON: 'コメントを送信',
  COMMENT_AUTHOR_SYSTEM: 'システム',

  ACTIONS_CARD_TITLE: 'アクション',
  ACTION_APPROVE_BUTTON: '承認',
  ACTION_REJECT_BUTTON: '差戻し',
  ACTION_DELETE_BUTTON: '削除',

  // Dialogs
  REJECT_DIALOG: {
    TITLE: '日報を差し戻しますか？',
    DESCRIPTION: '差戻し理由を入力してください',
    PLACEHOLDER: '差戻し理由...',
    CANCEL_BUTTON: 'キャンセル',
    CONFIRM_BUTTON: '差し戻す',
  },
  DELETE_DIALOG: {
    TITLE: '日報を削除しますか？',
    DESCRIPTION: 'この操作は取り消せません。本当に削除しますか？',
    CANCEL_BUTTON: 'キャンセル',
    CONFIRM_BUTTON: '削除する',
  },

  // Toasts
  COMMENT_SUBMITTING: 'コメントを送信しています...',
  COMMENT_SUBMIT_SUCCESS: 'コメントを送信しました',
  COMMENT_SUBMIT_ERROR: 'コメントの送信に失敗しました',

  APPROVE_SUBMITTING: '日報を承認しています...',
  APPROVE_SUCCESS: '日報を承認しました',
  APPROVE_SUCCESS_DESC: '作成者に通知されました。',
  APPROVE_ERROR: '日報の承認に失敗しました',

  REJECT_SUBMITTING: '日報を差し戻しています...',
  REJECT_SUCCESS: '日報を差し戻しました',
  REJECT_SUCCESS_DESC: '作成者に理由が通知されました。',
  REJECT_ERROR: '日報の差戻しに失敗しました',

  DELETE_SUBMITTING: '日報を削除しています...',
  DELETE_SUCCESS: '削除しました',
  DELETE_ERROR: '日報の削除に失敗しました',

  SUBMIT_SUBMITTING: '日報を提出しています...',
  SUBMIT_SUCCESS: '日報を提出しました',
  SUBMIT_SUCCESS_DESC: '承認者に通知されました。',
  SUBMIT_ERROR: '日報の提出に失敗しました',
  SUBMIT_CONFLICT_ERROR:
    '他のユーザーが同時に編集したため、提出に失敗しました。ページを更新してください。',

  PERMISSION_ERROR_DESC: '権限がありません',
  GENERIC_ERROR_DESC: '問題が続く場合は、管理者にお問い合わせください。',

  // --- ReportEditor ---
  EDIT_PAGE_TITLE: '日報編集',
  EDIT_PAGE_DESCRIPTION: '日報を編集します',
  CREATE_PAGE_TITLE: '日報作成',
  CREATE_PAGE_DESCRIPTION: '新しい日報を作成します',

  BASIC_INFO_CARD_TITLE: '基本情報',
  BASIC_INFO_CARD_DESCRIPTION: '日報の基本情報を入力してください',

  FORM_FIELD_DATE_LABEL: '日付',
  FORM_FIELD_DATE_PLACEHOLDER: '日付を選択',
  FORM_FIELD_DATE_DESCRIPTION: '日報を作成する日付を選択してください',

  FORM_FIELD_TITLE_LABEL: 'タイトル',
  FORM_FIELD_TITLE_PLACEHOLDER: '本日の作業内容',
  FORM_FIELD_TITLE_DESCRIPTION: '日報のタイトルを入力してください（200文字以内）',

  FORM_FIELD_CONTENT_LABEL: '内容',
  FORM_FIELD_CONTENT_PLACEHOLDER: '本日の作業内容を詳しく記載してください...',
  FORM_FIELD_CONTENT_DESCRIPTION: '作業内容、成果、課題などを記載してください（10000文字以内）',

  CANCEL_BUTTON: 'キャンセル',
  SAVE_DRAFT_BUTTON: '下書き保存',

  // Editor Toasts
  UPDATING_REPORT: '日報を更新しています...',
  SUBMITTING_REPORT: '日報を提出しています...',
  SAVING_REPORT: '保存中...',
  UPDATE_SUCCESS: '日報を更新しました',
  UPDATE_SUCCESS_DESC_SUBMITTED: '日報が提出されました。',
  UPDATE_SUCCESS_DESC_DRAFT: '下書きとして保存されました。',
  CREATE_SUCCESS_SUBMITTED: '日報を提出しました',
  CREATE_SUCCESS_DRAFT: '日報を作成しました',
  CREATE_SUCCESS_DESC_SUBMITTED: '承認者に通知されました。',
  CREATE_SUCCESS_DESC_DRAFT: '下書きとして保存されました。',
  SAVE_ERROR: '日報の保存に失敗しました',
  NETWORK_ERROR: 'ネットワークエラーが発生しました',

  // Conflict Dialog
  CONFLICT_DIALOG_TITLE: 'データの競合が検出されました',
  CONFLICT_DIALOG_DESCRIPTION:
    '他のユーザーが同じ日報を編集したため、データの競合が発生しました。\nどのように処理しますか？',
  CONFLICT_DIALOG_FORCE_SAVE_INFO:
    '• 「上書き保存」を選択すると、あなたの変更で他のユーザーの変更を上書きします。',
  CONFLICT_DIALOG_DISCARD_INFO:
    '• 「破棄」を選択すると、あなたの変更を破棄して最新の内容を表示します。',
  CONFLICT_DIALOG_DISCARD_BUTTON: '変更を破棄',
  CONFLICT_DIALOG_FORCE_SAVE_BUTTON: '上書き保存',
  FORCE_SAVING_TOAST: '日報を上書き保存しています...',
  FORCE_SAVE_SUCCESS_TOAST: '日報を上書き保存しました',
  FORCE_SAVE_SUCCESS_DESC_TOAST: '最新の内容で更新されました。',
  FORCE_SAVE_ERROR_TOAST: '上書き保存に失敗しました',

  // --- Reports Error Page ---
  REPORTS_ERROR_TITLE: '日報エラー',
  REPORTS_ERROR_PERMISSION: '権限がありません',
  REPORTS_ERROR_NOT_FOUND: '指定された日報が見つかりません。',
  REPORTS_ERROR_NETWORK: 'ネットワークエラーが発生しました',
  REPORTS_ERROR_GENERAL: '日報の読み込み中にエラーが発生しました。',
  REPORTS_ERROR_DETAILS_SUMMARY: 'エラーの詳細',

  // --- Search Page ---
  SEARCH_PLACEHOLDER_MODAL: '日報のタイトルや内容で検索...',
  SEARCH_NO_RESULTS: '検索結果がありません。',
  SEARCHING: '検索中...',
  SEARCH_RESULTS_HEADING: '検索結果',
  SEARCH_LOADING: 'Loading search...',

  // --- Metadata ---
  META_LIST_TITLE: '日報一覧 | SmartNippo',
  META_LIST_DESCRIPTION: '日報の作成・管理',
  META_DETAIL_TITLE: '日報詳細 | SmartNippo',
  META_DETAIL_DESCRIPTION: '日報の詳細を表示',
  META_NEW_TITLE: '日報作成 | SmartNippo',
  META_NEW_DESCRIPTION: '新しい日報を作成',
  META_EDIT_TITLE: '日報編集 | SmartNippo',
  META_EDIT_DESCRIPTION: '日報を編集',

  // Validation messages from common
  VALIDATION_ERRORS: {
    TITLE_REQUIRED: VALIDATION_MESSAGES.TITLE_REQUIRED,
    TITLE_TOO_LONG: VALIDATION_MESSAGES.TITLE_MAX_LENGTH,
    CONTENT_REQUIRED: VALIDATION_MESSAGES.CONTENT_REQUIRED,
    CONTENT_TOO_LONG: VALIDATION_MESSAGES.CONTENT_MAX_LENGTH,
  },

  // Metadata sections from common
  METADATA_SECTIONS: REPORT_METADATA_SECTIONS,

  LOADING_MESSAGE: '読み込み中...',

  // --- Mobile Specific ---
  MOBILE_STEPS: {
    STEPS: ['基本情報', 'タスク', 'メタデータ'],
  },
  MOBILE_LIST_SCREEN: {
    FILTER_LABELS: {
      ALL: 'すべて',
    },
    EMPTY_STATE: {
      NO_REPORTS: '日報がありません',
      NO_FILTERED_REPORTS: () => `該当ステータスの日報はありません`,
      CREATE_SUGGESTION: '新しい日報を作成してください',
      CREATE_BUTTON: '日報を作成',
    },
    WORK_ITEM_SUMMARY: '作業項目: ',
    AUTHOR_LABEL: '作成者: ',
  },
  MOBILE_CREATE_SCREEN: {
    NETWORK_STATUS: {
      OFFLINE: 'オフライン',
      ONLINE: 'オンライン',
    },
    FORM_LABELS: {
      DATE: '日付',
      PROJECT_MAIN: 'メインプロジェクト',
      TITLE: 'タイトル',
      CONTENT: '内容',
      REQUIRED_MARKER: ' *',
      WORK_ITEM_NAME: '作業項目名',
    },
    PLACEHOLDERS: {
      PROJECT_MAIN: 'プロジェクトを選択してください',
      TITLE: '今日の作業内容を簡潔に',
      CONTENT: '今日の作業内容を詳しく記入してください',
      TASK_NAME: 'タスク名',
      ESTIMATED_HOURS: '予定時間',
      ACTUAL_HOURS: '実績時間',
      CATEGORY: 'カテゴリ',
      METADATA_INPUT: (label: string) => `${label}を入力`,
    },
    BUTTONS: {
      PREVIOUS: '前へ',
      NEXT: '次へ',
      CREATE: '日報を作成',
      CREATING: '作成中...',
      OFFLINE_DISABLED: 'オフライン',
      ADD_WORK_ITEM: '作業内容追加',
      RETRY: '再試行',
      DISCARD: '破棄',
    },
    WORK_ITEM_MANAGEMENT: {
      TITLE: '作業内容',
      EMPTY_STATE: '作業内容がありません',
    },
    VALIDATION_ERRORS: {
      TITLE_REQUIRED: 'タイトルは必須です',
      TITLE_TOO_LONG: 'タイトルは200文字以内で入力してください',
      CONTENT_REQUIRED: '内容は必須です',
      CONTENT_TOO_LONG: '内容は10000文字以内で入力してください',
      WORK_ITEM_INCOMPLETE: 'すべての作業項目でプロジェクトと作業分類を選択してください。',
    },
    ALERTS: {
      OFFLINE_TITLE: 'オフラインです',
      OFFLINE_MESSAGE: 'インターネット接続を確認してから再度お試しください。',
      CONFLICT_TITLE: 'データ競合が発生しました',
      CONFLICT_MESSAGE: (errorMessage: string) =>
        `${errorMessage}\n\n現在の入力内容を保持して再試行しますか？`,
    },
    TOAST_MESSAGES: {
      CREATING: '日報を作成中...',
      CREATING_SUBTITLE: '少々お待ちください',
      SUCCESS: '日報を作成しました',
      SUCCESS_SUBTITLE: 'リストページに戻ります',
      NETWORK_ERROR: 'ネットワークエラーが発生しました',
      NETWORK_ERROR_SUBTITLE: 'インターネット接続を確認してください',
      FAILED: '日報の作成に失敗しました',
      RETRY_INFO: '再試行します',
      RETRY_INFO_SUBTITLE: '最新のデータを確認してください',
      DISCARD_INFO: '入力内容を破棄しました',
      DISCARD_INFO_SUBTITLE: 'リストページに戻ります',
    },
  },
  MOBILE_DETAIL_SCREEN: {
    SECTIONS: {
      CONTENT: '内容',
      METADATA: 'メタデータ',
      STATISTICS: '統計',
      APPROVAL_HISTORY: '承認履歴',
      COMMENTS: 'コメント',
      WORK_ITEMS: '作業項目',
    },
    STATISTICS: {
      ESTIMATED_HOURS: '予定時間',
      ACTUAL_HOURS: '実績時間',
      COMMENT_COUNT: 'コメント数',
      COMPLETED_WORK_ITEMS: (completed: number, total: number) => `${completed}/${total} 完了`,
    },
    REJECTION: {
      TITLE: '差戻し理由',
    },
    COMMENTS: {
      SYSTEM_AUTHOR: 'システム',
      UNKNOWN_AUTHOR: '不明',
      EMPTY_STATE: 'コメントはありません',
      PLACEHOLDER: 'コメントを入力...',
    },
    ACTIONS: {
      SUBMIT: '送信',
      APPROVE: '承認',
      REJECT: '差戻し',
      PROCESSING: '処理中...',
    },
    ALERTS: {
      COMMENT_ERROR: 'コメントの追加に失敗しました',
      APPROVE_TITLE: '承認確認',
      APPROVE_MESSAGE: 'この日報を承認しますか？',
      APPROVE_SUCCESS: '日報を承認しました',
      APPROVE_ERROR: (message: string) => `承認に失敗しました: ${message}`,
      PERMISSION_ERROR: '権限がありません',
      REJECT_TITLE: '差戻し確認',
      REJECT_MESSAGE: '差戻し理由を入力してください',
      REJECT_SUCCESS: '日報を差し戻しました',
      REJECT_ERROR: (message: string) => `差戻しに失敗しました: ${message}`,
      REJECT_REASON_ERROR: '差戻し理由を入力してください',
      SUBMIT_TITLE: '提出確認',
      SUBMIT_MESSAGE: 'この日報を提出しますか？',
      SUBMIT_SUCCESS: '日報を提出しました',
      SUBMIT_ERROR: (message: string) => `提出に失敗しました: ${message}`,
      CANCEL: 'キャンセル',
    },
    APPROVAL_HISTORY: {
      APPROVED_BY: (name: string) => `${name}が承認`,
      REJECTED_BY: (name: string) => `${name}が差し戻しました`,
      PENDING: (name: string) => `${name} (承認待ち)`,
    },
  },
} as const;
