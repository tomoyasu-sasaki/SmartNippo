export const PROFILE_CONSTANTS = {
  SCREEN_TITLE: 'Profile',
  LOADING_TEXT: 'Loading...',
  ERROR_TEXT: 'Not authenticated',
  FORM_LABELS: {
    NAME: '名前',
    SOCIAL_LINKS: 'ソーシャルリンク',
    PRIVACY_SETTINGS: 'プライバシー設定',
    EMAIL: 'Email',
    ROLE: 'Role',
    MEMBER_SINCE: 'Member Since',
  },
  PLACEHOLDERS: {
    NAME: '名前を入力してください',
  },
  BUTTONS: {
    EXPORT_PROFILE: 'Export Profile',
    SIGN_OUT: 'Sign Out',
    ADD_LINK: 'リンクを追加',
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
    URL_PROMPT: 'URLを入力してください',
  },
  SOCIAL_LINKS: {
    ADD_LINK_PROMPT: 'ソーシャルリンクを追加',
  },
  PRIVACY_OPTIONS: [
    { key: 'profile', label: 'プロフィール全体' },
    { key: 'email', label: 'メールアドレス' },
    { key: 'socialLinks', label: 'ソーシャルリンク' },
    { key: 'reports', label: '日報' },
  ],
  VALIDATION_ERRORS: {
    NAME_REQUIRED: 'Name is required',
    NAME_TOO_LONG: 'Name is too long',
  },
} as const;
