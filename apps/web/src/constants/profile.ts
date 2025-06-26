import { COMMON_CONSTANTS } from './common';

export const PROFILE_CONSTANTS = {
  UPDATE_SUCCESS_MESSAGE: 'プロフィールを更新しました',
  UPDATE_CONFLICT_ERROR_MESSAGE:
    'プロフィールが他の場所で更新されています。画面を再読み込みしてください。',
  UPDATE_GENERAL_ERROR_MESSAGE: 'プロフィールの更新に失敗しました',

  AVATAR_LABEL: 'プロフィール画像',
  AVATAR_UPLOAD_SUCCESS_MESSAGE: '画像がアップロードされました',
  AVATAR_DESCRIPTION: 'プロフィール画像をアップロードまたはドラッグ&ドロップしてください',

  NAME_LABEL: '名前',
  NAME_PLACEHOLDER: '名前を入力してください',
  NAME_DESCRIPTION: '表示名として使用されます',

  EMAIL_LABEL: 'メールアドレス',
  EMAIL_NOT_SET: '未設定',
  ROLE_LABEL: '役割',
  MEMBER_SINCE_LABEL: '登録日',

  SUBMIT_BUTTON_TEXT: 'プロフィールを更新',

  // --- ProfilePage ---
  PAGE_TITLE: 'プロフィール設定',
  PAGE_DESCRIPTION: 'プロフィール情報と設定を管理',

  CREATE_PROFILE_ERROR: 'プロフィールの作成に失敗しました。ページを再読み込みしてください。',
  LOADING: COMMON_CONSTANTS.LOADING,
  AUTH_REQUIRED_TITLE: '認証が必要です',
  AUTH_REQUIRED_DESCRIPTION: 'プロフィールにアクセスするにはログインしてください。',
  SETUP_PROFILE: 'プロフィールを設定中...',
  PROFILE_ERROR_TITLE: 'プロフィールエラー',
  PROFILE_ERROR_DESCRIPTION: 'プロフィールを読み込めません。ページを再読み込みしてください。',

  PERSONAL_INFO_CARD_TITLE: '個人情報',
  PERSONAL_INFO_CARD_DESCRIPTION: 'プロフィール詳細を更新',

  SOCIAL_LINKS_CARD_TITLE: 'ソーシャルリンク',
  SOCIAL_LINKS_CARD_DESCRIPTION: 'SNSプロフィールを連携',
  INVALID_URL_ERROR: '無効なURLです',
  UPDATE_SOCIAL_LINKS_SUCCESS: 'ソーシャルリンクを更新しました',
  UPDATE_ERROR: '更新に失敗しました',
  ADD_SOCIAL_LINK_LABEL: 'ソーシャルリンクを追加',
  PROMPT_URL: (platform: string) => `${platform}のURLを入力してください:`,
  SELECT_PLATFORM_PLACEHOLDER: 'プラットフォームを選択',
  CANCEL_BUTTON: COMMON_CONSTANTS.CANCEL_BUTTON,
  SAVE_BUTTON: COMMON_CONSTANTS.SAVE_BUTTON,
  EDIT_BUTTON: COMMON_CONSTANTS.EDIT_BUTTON,

  PRIVACY_SETTINGS_CARD_TITLE: 'プライバシー設定',
  PRIVACY_SETTINGS_CARD_DESCRIPTION: '情報の公開範囲を管理',
  UPDATE_PRIVACY_SUCCESS: 'プライバシー設定を更新しました',
  PRIVACY_OPTION_PROFILE: 'プロフィール全体',
  PRIVACY_OPTION_EMAIL: 'メールアドレス',
  PRIVACY_OPTION_SOCIAL_LINKS: 'ソーシャルリンク',
  PRIVACY_OPTION_REPORTS: '日報',
  SAVE_SETTINGS_BUTTON: '設定を保存',

  EXPORT_PROFILE_CARD_TITLE: 'プロフィールのエクスポート',
  EXPORT_PROFILE_CARD_DESCRIPTION: 'プロフィールデータをダウンロード',
  EXPORT_DESCRIPTION: 'プロフィールデータをJSON形式でダウンロードできます。',
  EXPORT_BUTTON: 'プロフィールをエクスポート',
  EXPORT_SUCCESS: 'プロフィールをエクスポートしました',

  ACCOUNT_DETAILS_CARD_TITLE: 'アカウント詳細',
} as const;
