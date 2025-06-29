import { COMMON_CONSTANTS } from './common';

export const REPORTS_CONSTANTS = {
  PAGE_TITLE: '日報一覧',
  PAGE_DESCRIPTION: '日報の作成・管理',
  CREATE_NEW_BUTTON: '新規作成',

  FILTER_CARD_TITLE: 'フィルター',
  SEARCH_PLACEHOLDER: 'タイトルや内容で検索... (⌘K)',
  STATUS_FILTER_PLACEHOLDER: 'ステータスで絞り込み',
  RESET_FILTER_BUTTON: 'フィルターをリセット',

  LOADING_MESSAGE: COMMON_CONSTANTS.LOADING,

  STATUS_ALL: 'すべて',
  STATUS: {
    draft: { variant: 'outline' as const, label: '下書き' },
    submitted: { variant: 'secondary' as const, label: '提出済み' },
    approved: { variant: 'default' as const, label: '承認済み' },
    rejected: { variant: 'destructive' as const, label: '却下' },
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
  ACTION_BUTTON_EDIT: COMMON_CONSTANTS.EDIT_BUTTON,

  PAGINATION_SUMMARY: (total: number, count: number) => `全 ${total} 件中 ${count} 件を表示`,
  PAGINATION_PREVIOUS: '前へ',
  PAGINATION_NEXT: '次へ',

  // --- ReportDetail ---
  DETAIL_PAGE_TITLE: '日報詳細',
  BACK_BUTTON: '戻る',
  EDIT_BUTTON: COMMON_CONSTANTS.EDIT_BUTTON,
  SUBMIT_BUTTON: '提出',

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
  ACTION_REJECT_BUTTON: '却下',
  ACTION_DELETE_BUTTON: '削除',

  // Dialogs
  REJECT_DIALOG: {
    TITLE: '日報を却下しますか？',
    DESCRIPTION: '却下理由を入力してください',
    PLACEHOLDER: '却下理由...',
    CANCEL_BUTTON: 'キャンセル',
    CONFIRM_BUTTON: '却下する',
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

  REJECT_SUBMITTING: '日報を却下しています...',
  REJECT_SUCCESS: '日報を却下しました',
  REJECT_SUCCESS_DESC: '作成者に理由が通知されました。',
  REJECT_ERROR: '日報の却下に失敗しました',

  DELETE_SUBMITTING: '日報を削除しています...',
  DELETE_SUCCESS: '日報を削除しました',
  DELETE_ERROR: '日報の削除に失敗しました',

  SUBMIT_SUBMITTING: '日報を提出しています...',
  SUBMIT_SUCCESS: '日報を提出しました',
  SUBMIT_SUCCESS_DESC: '承認者に通知されました。',
  SUBMIT_ERROR: '日報の提出に失敗しました',
  SUBMIT_CONFLICT_ERROR:
    '他のユーザーが同時に編集したため、提出に失敗しました。ページを更新してください。',

  PERMISSION_ERROR_DESC: 'この操作を実行する権限がありません。',
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

  CANCEL_BUTTON: COMMON_CONSTANTS.CANCEL_BUTTON,
  SAVE_DRAFT_BUTTON: '下書き保存',

  // Editor Toasts
  UPDATING_REPORT: '日報を更新しています...',
  SUBMITTING_REPORT: '日報を提出しています...',
  SAVING_REPORT: '日報を保存しています...',
  UPDATE_SUCCESS: '日報を更新しました',
  UPDATE_SUCCESS_DESC_SUBMITTED: '日報が提出されました。',
  UPDATE_SUCCESS_DESC_DRAFT: '下書きとして保存されました。',
  CREATE_SUCCESS_SUBMITTED: '日報を提出しました',
  CREATE_SUCCESS_DRAFT: '日報を作成しました',
  CREATE_SUCCESS_DESC_SUBMITTED: '承認者に通知されました。',
  CREATE_SUCCESS_DESC_DRAFT: '下書きとして保存されました。',
  SAVE_ERROR: '日報の保存に失敗しました',
  NETWORK_ERROR: 'ネットワークエラーが発生しました。接続を確認してください。',

  // Conflict Dialog
  CONFLICT_DIALOG_TITLE: 'データの競合が検出されました',
  CONFLICT_DIALOG_DESCRIPTION:
    '他のユーザーが同じ日報を編集したため、データの競Gが発生しました。\nどのように処理しますか？',
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
  REPORTS_ERROR_PERMISSION: '日報へのアクセス権限がありません。',
  REPORTS_ERROR_NOT_FOUND: '指定された日報が見つかりません。',
  REPORTS_ERROR_NETWORK: 'ネットワークエラーが発生しました。接続を確認してください。',
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
} as const;
