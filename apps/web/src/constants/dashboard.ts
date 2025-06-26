import { COMMON_CONSTANTS } from './common';

export const DASHBOARD_CONSTANTS = {
  PAGE_TITLE: 'ダッシュボード',
  META_TITLE: 'ダッシュボード | SmartNippo',
  META_DESCRIPTION: '日報管理システムのダッシュボード',
  CREATE_REPORT_BUTTON: '日報を作成',
  LOADING_MESSAGE: COMMON_CONSTANTS.LOADING,

  STATS_CARD: {
    THIS_MONTH_REPORTS_TITLE: '今月の日報',
    THIS_MONTH_REPORTS_DESC: '作成済み',
    APPROVED_TITLE: '承認済み',
    APPROVAL_RATE: (rate: number) => `承認率 ${rate}%`,
    PENDING_SUBMISSION_TITLE: '提出待ち',
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
