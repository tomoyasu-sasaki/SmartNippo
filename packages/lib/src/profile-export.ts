import type { PrivacySettings } from './privacy-settings';
import type { SocialLink } from './social-links';

// エクスポート形式定義
export const EXPORT_FORMATS = {
  json: {
    label: 'JSON',
    extension: 'json',
    mimeType: 'application/json',
    description: 'プログラムで処理しやすい形式',
  },
  csv: {
    label: 'CSV',
    extension: 'csv',
    mimeType: 'text/csv',
    description: 'スプレッドシートで開ける形式',
  },
  pdf: {
    label: 'PDF',
    extension: 'pdf',
    mimeType: 'application/pdf',
    description: '印刷や保存に適した形式',
  },
  html: {
    label: 'HTML',
    extension: 'html',
    mimeType: 'text/html',
    description: 'ブラウザで表示できる形式',
  },
} as const;

export type ExportFormat = keyof typeof EXPORT_FORMATS;

// エクスポートデータの型定義
export interface ProfileExportData {
  // 基本情報
  profile: {
    name: string;
    email: string;
    role: string;
    avatarUrl?: string;
    created_at: string;
    updated_at: string;
  };

  // ソーシャルリンク
  socialLinks: SocialLink[];

  // プライバシー設定
  privacySettings: PrivacySettings;

  // 日報データ
  reports: Array<{
    id: string;
    title: string;
    content: string;
    status: string;
    reportDate: string;
    created_at: string;
    updated_at: string;
  }>;

  // プロフィール変更履歴
  profileHistory: Array<{
    action: string;
    changes: Record<string, string>;
    timestamp: string;
  }>;

  // 組織情報
  organization: {
    name: string;
    plan: string;
    joined_at: string;
  };

  // エクスポートメタデータ
  exportMetadata: {
    exportedAt: string;
    format: ExportFormat;
    version: string;
    requestedBy: string;
    includesPersonalData: boolean;
    dataRetentionPeriod?: string;
  };
}

// エクスポートオプション
export interface ExportOptions {
  format: ExportFormat;
  includeReports: boolean;
  includeHistory: boolean;
  includeSocialLinks: boolean;
  includePrivacySettings: boolean;
  dateRange?: {
    from: Date;
    to: Date;
  };
  respectPrivacySettings: boolean;
  includeMetadata: boolean;
}

// デフォルトエクスポートオプション
export const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  format: 'json',
  includeReports: true,
  includeHistory: false,
  includeSocialLinks: true,
  includePrivacySettings: true,
  respectPrivacySettings: true,
  includeMetadata: true,
};

/**
 * プロフィールデータの準備
 */
export function prepareProfileExportData(
  rawData: ProfileExportData,
  options: ExportOptions
): ProfileExportData {
  const exportData: ProfileExportData = {
    profile: {
      name: rawData.profile.name ?? '',
      email: rawData.profile.email ?? '',
      role: rawData.profile.role ?? '',
      avatarUrl: rawData.profile.avatarUrl,
      created_at: new Date(rawData.profile.created_at).toISOString(),
      updated_at: new Date(rawData.profile.updated_at).toISOString(),
    },
    socialLinks: options.includeSocialLinks ? (rawData.socialLinks ?? []) : [],
    privacySettings: options.includePrivacySettings
      ? rawData.privacySettings
      : ({} as PrivacySettings),
    reports: [],
    profileHistory: [],
    organization: {
      name: rawData.organization?.name ?? '',
      plan: rawData.organization?.plan ?? '',
      joined_at: rawData.organization?.joined_at
        ? new Date(rawData.organization.joined_at).toISOString()
        : '',
    },
    exportMetadata: {
      exportedAt: new Date().toISOString(),
      format: options.format,
      version: '1.0',
      requestedBy: rawData.exportMetadata?.requestedBy ?? 'user',
      includesPersonalData: true,
      dataRetentionPeriod: '7年間（法定保存期間）',
    },
  };

  // 日報データの追加
  if (options.includeReports && rawData.reports) {
    exportData.reports = rawData.reports
      .filter((report: ProfileExportData['reports'][number]) => {
        if (!options.dateRange) {
          return true;
        }
        const reportDate = new Date(report.created_at);
        return reportDate >= options.dateRange.from && reportDate <= options.dateRange.to;
      })
      .map((report: ProfileExportData['reports'][number]) => ({
        id: report.id,
        title: report.title,
        content: report.content,
        status: report.status,
        reportDate: report.reportDate,
        created_at: new Date(report.created_at).toISOString(),
        updated_at: new Date(report.updated_at).toISOString(),
      }));
  }

  // プロフィール履歴の追加
  if (options.includeHistory && rawData.profileHistory) {
    exportData.profileHistory = rawData.profileHistory
      .filter((history: ProfileExportData['profileHistory'][number]) => {
        if (!options.dateRange) {
          return true;
        }
        const historyDate = new Date(history.timestamp);
        return historyDate >= options.dateRange.from && historyDate <= options.dateRange.to;
      })
      .map((history: ProfileExportData['profileHistory'][number]) => ({
        action: history.action,
        changes: history.changes,
        timestamp: new Date(history.timestamp).toISOString(),
      }));
  }

  return exportData;
}

/**
 * JSON形式でのエクスポート
 */
export function exportToJSON(data: ProfileExportData): {
  content: string;
  filename: string;
  mimeType: string;
} {
  const content = JSON.stringify(data, null, 2);
  const [timestamp] = new Date().toISOString().split('T');
  const filename = `profile_export_${data.profile.name}_${timestamp}.json`;

  return {
    content,
    filename,
    mimeType: EXPORT_FORMATS.json.mimeType,
  };
}

/**
 * CSV形式でのエクスポート
 */
export function exportToCSV(data: ProfileExportData): {
  content: string;
  filename: string;
  mimeType: string;
} {
  const csvRows: string[] = [];

  // ヘッダー行
  csvRows.push('Category,Field,Value,Date');

  // プロフィール基本情報
  csvRows.push(`Profile,Name,"${data.profile.name}","${data.profile.updated_at}"`);
  csvRows.push(`Profile,Email,"${data.profile.email}","${data.profile.updated_at}"`);
  csvRows.push(`Profile,Role,"${data.profile.role}","${data.profile.updated_at}"`);

  // ソーシャルリンク
  data.socialLinks.forEach((link) => {
    csvRows.push(`Social Links,${link.platform},"${link.url}",`);
  });

  // 日報データ
  data.reports.forEach((report) => {
    csvRows.push(
      `Reports,${report.title},"${report.content.substring(0, 100)}...","${report.created_at}"`
    );
  });

  // プロフィール履歴
  data.profileHistory.forEach((history) => {
    csvRows.push(
      `History,${history.action},"${JSON.stringify(history.changes)}","${history.timestamp}"`
    );
  });

  const content = csvRows.join('\n');
  const [timestamp] = new Date().toISOString().split('T');
  const filename = `profile_export_${data.profile.name}_${timestamp}.csv`;

  return {
    content,
    filename,
    mimeType: EXPORT_FORMATS.csv.mimeType,
  };
}

/**
 * HTML形式でのエクスポート
 */
export function exportToHTML(data: ProfileExportData): {
  content: string;
  filename: string;
  mimeType: string;
} {
  const html = `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>プロフィールエクスポート - ${data.profile.name}</title>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 2rem; line-height: 1.6; }
    .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 1rem; margin-bottom: 2rem; }
    .section { margin-bottom: 2rem; }
    .section h2 { color: #2d3748; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.5rem; }
    .info-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 0.5rem; margin-bottom: 1rem; }
    .info-label { font-weight: bold; color: #4a5568; }
    .report-item { border: 1px solid #e2e8f0; padding: 1rem; margin-bottom: 1rem; border-radius: 0.5rem; }
    .social-link { display: inline-block; margin: 0.25rem; padding: 0.5rem 1rem; background: #f7fafc; border-radius: 0.25rem; }
    .metadata { font-size: 0.875rem; color: #718096; margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>プロフィールデータエクスポート</h1>
    <p>エクスポート日時: ${new Date(data.exportMetadata.exportedAt).toLocaleString('ja-JP')}</p>
  </div>

  <div class="section">
    <h2>基本情報</h2>
    <div class="info-grid">
      <div class="info-label">名前:</div>
      <div>${data.profile.name}</div>
      <div class="info-label">メールアドレス:</div>
      <div>${data.profile.email}</div>
      <div class="info-label">役職:</div>
      <div>${data.profile.role}</div>
      <div class="info-label">登録日:</div>
      <div>${new Date(data.profile.created_at).toLocaleDateString('ja-JP')}</div>
    </div>
  </div>

  ${
    data.socialLinks.length > 0
      ? `
  <div class="section">
    <h2>ソーシャルリンク</h2>
    ${data.socialLinks
      .map(
        (link) => `
      <div class="social-link">
        <strong>${link.platform}:</strong> <a href="${link.url}" target="_blank">${link.url}</a>
      </div>
    `
      )
      .join('')}
  </div>
  `
      : ''
  }

  ${
    data.reports.length > 0
      ? `
  <div class="section">
    <h2>日報データ (${data.reports.length}件)</h2>
    ${data.reports
      .map(
        (report) => `
      <div class="report-item">
        <h3>${report.title}</h3>
        <p><strong>日付:</strong> ${report.reportDate}</p>
        <p><strong>ステータス:</strong> ${report.status}</p>
        <div>${report.content.substring(0, 200)}${report.content.length > 200 ? '...' : ''}</div>
      </div>
    `
      )
      .join('')}
  </div>
  `
      : ''
  }

  <div class="section">
    <h2>組織情報</h2>
    <div class="info-grid">
      <div class="info-label">組織名:</div>
      <div>${data.organization.name}</div>
      <div class="info-label">プラン:</div>
      <div>${data.organization.plan}</div>
      <div class="info-label">参加日:</div>
      <div>${data.organization.joined_at ? new Date(data.organization.joined_at).toLocaleDateString('ja-JP') : '不明'}</div>
    </div>
  </div>

  <div class="metadata">
    <h3>エクスポート情報</h3>
    <p>形式: ${data.exportMetadata.format.toUpperCase()}</p>
    <p>バージョン: ${data.exportMetadata.version}</p>
    <p>個人データ含有: ${data.exportMetadata.includesPersonalData ? 'はい' : 'いいえ'}</p>
    <p>データ保存期間: ${data.exportMetadata.dataRetentionPeriod}</p>
  </div>
</body>
</html>
  `.trim();

  const [timestamp] = new Date().toISOString().split('T');
  const filename = `profile_export_${data.profile.name}_${timestamp}.html`;

  return {
    content: html,
    filename,
    mimeType: EXPORT_FORMATS.html.mimeType,
  };
}

/**
 * メインエクスポート関数
 */
export function exportProfile(
  rawData: ProfileExportData,
  options: Partial<ExportOptions> = {}
): {
  content: string;
  filename: string;
  mimeType: string;
} {
  const exportOptions = { ...DEFAULT_EXPORT_OPTIONS, ...options };
  const exportData = prepareProfileExportData(rawData, exportOptions);

  switch (exportOptions.format) {
    case 'json':
      return exportToJSON(exportData);
    case 'csv':
      return exportToCSV(exportData);
    case 'html':
      return exportToHTML(exportData);
    default:
      throw new Error(`Unsupported export format: ${exportOptions.format}`);
  }
}

/**
 * ブラウザでのファイルダウンロード
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  if (typeof window === 'undefined') {
    throw new Error('downloadFile can only be used in browser environment');
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // メモリリークを防ぐためURLを解放
  URL.revokeObjectURL(url);
}

/**
 * エクスポート統計情報
 */
export interface ExportStatistics {
  totalDataSize: number;
  recordCounts: {
    reports: number;
    socialLinks: number;
    historyEntries: number;
  };
  dateRange: {
    from: string;
    to: string;
  };
  includesPersonalData: boolean;
  estimatedExportTime: number; // milliseconds
}

export function calculateExportStatistics(
  rawData: ProfileExportData,
  options: ExportOptions
): ExportStatistics {
  const exportData = prepareProfileExportData(rawData, options);
  const exportResult = exportProfile(rawData, options);

  return {
    totalDataSize: new Blob([exportResult.content]).size,
    recordCounts: {
      reports: exportData.reports.length,
      socialLinks: exportData.socialLinks.length,
      historyEntries: exportData.profileHistory.length,
    },
    dateRange: {
      from: options.dateRange?.from.toISOString() ?? '',
      to: options.dateRange?.to.toISOString() ?? '',
    },
    includesPersonalData: true,
    estimatedExportTime: Math.max(500, exportData.reports.length * 10), // 最低500ms
  };
}

/**
 * GDPR/APPI準拠の個人データ削除要求対応
 */
export interface DataDeletionRequest {
  requestId: string;
  userId: string;
  requestedAt: Date;
  requestType: 'full_deletion' | 'anonymization' | 'specific_data';
  specificData?: string[];
  reason: string;
  confirmationRequired: boolean;
}

export function generateDeletionConfirmation(request: DataDeletionRequest): {
  confirmationText: string;
  warningItems: string[];
} {
  const warnings: string[] = [];

  if (request.requestType === 'full_deletion') {
    warnings.push('すべてのプロフィールデータが完全に削除されます');
    warnings.push('日報データも合わせて削除されます');
    warnings.push('この操作は取り消すことができません');
  }

  if (request.requestType === 'anonymization') {
    warnings.push('個人を特定できる情報が匿名化されます');
    warnings.push('統計データとしては残存する可能性があります');
  }

  const confirmationText = `
個人データ削除要求の確認

要求ID: ${request.requestId}
要求タイプ: ${request.requestType}
要求日時: ${request.requestedAt.toLocaleString('ja-JP')}
理由: ${request.reason}

この操作を実行すると、上記の変更が適用されます。
法的要件に基づき、一部のデータは法定保存期間中保持される場合があります。
  `.trim();

  return {
    confirmationText,
    warningItems: warnings,
  };
}

// Backward-compatible named export
export const createProfileExport = exportProfile;
