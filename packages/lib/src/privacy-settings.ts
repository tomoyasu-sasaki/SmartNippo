import { z } from 'zod';

// プライバシーレベル定義
export const PRIVACY_LEVELS = {
  public: {
    label: '公開',
    description: '全員に表示',
    icon: 'Globe',
    value: 'public',
  },
  organization: {
    label: '組織内のみ',
    description: '同じ組織のメンバーのみ表示',
    icon: 'Building2',
    value: 'organization',
  },
  team: {
    label: 'チームのみ',
    description: '同じチームのメンバーのみ表示',
    icon: 'Users',
    value: 'team',
  },
  private: {
    label: 'プライベート',
    description: '自分のみ表示',
    icon: 'Lock',
    value: 'private',
  },
} as const;

export type PrivacyLevel = keyof typeof PRIVACY_LEVELS;

// プロフィール要素定義
export const PROFILE_ELEMENTS = {
  name: {
    label: '名前',
    description: 'ユーザーの表示名',
    defaultPrivacy: 'organization' as PrivacyLevel,
    allowedLevels: ['public', 'organization', 'team'] as PrivacyLevel[],
  },
  email: {
    label: 'メールアドレス',
    description: '連絡先メールアドレス',
    defaultPrivacy: 'organization' as PrivacyLevel,
    allowedLevels: ['organization', 'team', 'private'] as PrivacyLevel[],
  },
  avatar: {
    label: 'アバター画像',
    description: 'プロフィール画像',
    defaultPrivacy: 'organization' as PrivacyLevel,
    allowedLevels: ['public', 'organization', 'team', 'private'] as PrivacyLevel[],
  },
  role: {
    label: '役職・役割',
    description: '組織内での役職',
    defaultPrivacy: 'organization' as PrivacyLevel,
    allowedLevels: ['public', 'organization', 'team'] as PrivacyLevel[],
  },
  socialLinks: {
    label: 'SNSリンク',
    description: 'ソーシャルメディアのリンク',
    defaultPrivacy: 'public' as PrivacyLevel,
    allowedLevels: ['public', 'organization', 'team', 'private'] as PrivacyLevel[],
  },
  reports: {
    label: '日報',
    description: '作成した日報',
    defaultPrivacy: 'organization' as PrivacyLevel,
    allowedLevels: ['organization', 'team', 'private'] as PrivacyLevel[],
  },
  profileHistory: {
    label: 'プロフィール履歴',
    description: 'プロフィール変更履歴',
    defaultPrivacy: 'private' as PrivacyLevel,
    allowedLevels: ['team', 'private'] as PrivacyLevel[],
  },
  lastActive: {
    label: '最終活動日時',
    description: '最後にアクティブだった時刻',
    defaultPrivacy: 'organization' as PrivacyLevel,
    allowedLevels: ['public', 'organization', 'team', 'private'] as PrivacyLevel[],
  },
} as const;

export type ProfileElement = keyof typeof PROFILE_ELEMENTS;

// プライバシー設定の型定義
export type PrivacySettings = Record<ProfileElement, PrivacyLevel>;

// バリデーションスキーマ
export const privacySettingsSchema = z.object({
  name: z.enum(['public', 'organization', 'team', 'private']),
  email: z.enum(['organization', 'team', 'private']),
  avatar: z.enum(['public', 'organization', 'team', 'private']),
  role: z.enum(['public', 'organization', 'team']),
  socialLinks: z.enum(['public', 'organization', 'team', 'private']),
  reports: z.enum(['organization', 'team', 'private']),
  profileHistory: z.enum(['team', 'private']),
  lastActive: z.enum(['public', 'organization', 'team', 'private']),
});

// デフォルトプライバシー設定
export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  name: 'organization',
  email: 'organization',
  avatar: 'organization',
  role: 'organization',
  socialLinks: 'public',
  reports: 'organization',
  profileHistory: 'private',
  lastActive: 'organization',
};

/**
 * ユーザー関係を判定
 */
export interface UserRelationship {
  viewerId: string;
  targetUserId: string;
  isSameUser: boolean;
  isSameOrganization: boolean;
  isSameTeam: boolean;
  viewerRole: 'viewer' | 'user' | 'manager' | 'admin';
  targetRole: 'viewer' | 'user' | 'manager' | 'admin';
}

/**
 * プロフィール要素の可視性チェック
 */
export function checkElementVisibility(
  element: ProfileElement,
  privacyLevel: PrivacyLevel,
  relationship: UserRelationship
): boolean {
  // 自分自身は常に全て表示
  if (relationship.isSameUser) {
    return true;
  }

  // 管理者は組織内の全て表示（プライベート以外）
  if (relationship.viewerRole === 'admin' && relationship.isSameOrganization && privacyLevel !== 'private') {
    return true;
  }

  // プライバシーレベル別判定
  switch (privacyLevel) {
    case 'public':
      return true;

    case 'organization':
      return relationship.isSameOrganization;

    case 'team':
      return relationship.isSameTeam;

    case 'private':
      return false;

    default:
      return false;
  }
}

/**
 * プロフィール全体の可視性フィルタリング
 */
export interface FilteredProfile {
  name?: string;
  email?: string;
  avatar?: string;
  role?: string;
  socialLinks?: any[];
  reports?: any[];
  profileHistory?: any[];
  lastActive?: Date;
}

export function filterProfileByPrivacy(
  profile: any,
  privacySettings: PrivacySettings,
  relationship: UserRelationship
): FilteredProfile {
  const filtered: FilteredProfile = {};

  // 各要素の可視性をチェック
  Object.entries(PROFILE_ELEMENTS).forEach(([elementKey, elementConfig]) => {
    const element = elementKey as ProfileElement;
    const privacyLevel = privacySettings[element];

    if (checkElementVisibility(element, privacyLevel, relationship)) {
      // @ts-ignore - プロフィールオブジェクトの動的アクセス
      filtered[element] = profile[element];
    }
  });

  return filtered;
}

/**
 * プライバシー設定のバリデーション
 */
export function validatePrivacySettings(settings: Partial<Record<ProfileElement, PrivacyLevel>>): {
  isValid: boolean;
  errors: string[];
  validatedSettings: PrivacySettings;
} {
  const errors: string[] = [];
  const validated = { ...DEFAULT_PRIVACY_SETTINGS };

  // Zodスキーマによる基本検証
  const schemaValidation = privacySettingsSchema.safeParse({
    ...DEFAULT_PRIVACY_SETTINGS,
    ...settings,
  });

  if (!schemaValidation.success) {
    errors.push(...schemaValidation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`));
    return { isValid: false, errors, validatedSettings: validated };
  }

  const validatedData = schemaValidation.data;

  // 各要素の許可レベルチェック
  Object.entries(validatedData).forEach(([elementKey, privacyLevel]) => {
    const element = elementKey as ProfileElement;
    const elementConfig = PROFILE_ELEMENTS[element];

    if (!elementConfig.allowedLevels.includes(privacyLevel)) {
      errors.push(`${elementConfig.label}: ${PRIVACY_LEVELS[privacyLevel].label}は選択できません`);
    } else {
      validated[element] = privacyLevel;
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    validatedSettings: validated,
  };
}

/**
 * プライバシー設定のプリセット
 */
export const PRIVACY_PRESETS = {
  open: {
    name: 'オープン',
    description: '多くの情報を公開する設定',
    settings: {
      name: 'public',
      email: 'organization',
      avatar: 'public',
      role: 'public',
      socialLinks: 'public',
      reports: 'organization',
      profileHistory: 'private',
      lastActive: 'public',
    } as PrivacySettings,
  },
  balanced: {
    name: 'バランス',
    description: '組織内での情報共有を重視した設定',
    settings: {
      name: 'organization',
      email: 'organization',
      avatar: 'organization',
      role: 'organization',
      socialLinks: 'organization',
      reports: 'organization',
      profileHistory: 'private',
      lastActive: 'organization',
    } as PrivacySettings,
  },
  conservative: {
    name: '控えめ',
    description: '必要最小限の情報のみ公開する設定',
    settings: {
      name: 'organization',
      email: 'team',
      avatar: 'organization',
      role: 'organization',
      socialLinks: 'team',
      reports: 'team',
      profileHistory: 'private',
      lastActive: 'team',
    } as PrivacySettings,
  },
  private: {
    name: 'プライベート',
    description: '最も制限的な設定',
    settings: {
      name: 'team',
      email: 'private',
      avatar: 'team',
      role: 'team',
      socialLinks: 'private',
      reports: 'private',
      profileHistory: 'private',
      lastActive: 'private',
    } as PrivacySettings,
  },
} as const;

export type PrivacyPreset = keyof typeof PRIVACY_PRESETS;

/**
 * プライバシー設定の適用
 */
export function applyPrivacyPreset(preset: PrivacyPreset): PrivacySettings {
  return { ...PRIVACY_PRESETS[preset].settings };
}

/**
 * カスタムプライバシー設定の保存可能性チェック
 */
export function canSavePrivacySettings(
  settings: PrivacySettings,
  userRole: 'viewer' | 'user' | 'manager' | 'admin'
): {
  canSave: boolean;
  restrictions: string[];
} {
  const restrictions: string[] = [];

  // 閲覧専用ユーザーの制限
  if (userRole === 'viewer') {
    restrictions.push('閲覧専用アカウントはプライバシー設定を変更できません');
    return { canSave: false, restrictions };
  }

  // 特定の要素に対する制限（将来の拡張用）
  // 例: 組織管理者が特定の設定を強制する場合など

  return {
    canSave: restrictions.length === 0,
    restrictions,
  };
}

/**
 * プライバシー影響分析
 */
export interface PrivacyImpactAnalysis {
  element: ProfileElement;
  currentLevel: PrivacyLevel;
  newLevel: PrivacyLevel;
  impact: 'increase' | 'decrease' | 'same';
  affectedUsers: string[];
  description: string;
}

export function analyzePrivacyChanges(
  currentSettings: PrivacySettings,
  newSettings: PrivacySettings,
  orgMemberCount: number,
  teamMemberCount: number
): PrivacyImpactAnalysis[] {
  const analysis: PrivacyImpactAnalysis[] = [];

  const levelOrder = ['private', 'team', 'organization', 'public'];
  const getVisibilityCount = (level: PrivacyLevel): number => {
    switch (level) {
      case 'private': return 1;
      case 'team': return teamMemberCount;
      case 'organization': return orgMemberCount;
      case 'public': return 9999; // 仮の値
      default: return 0;
    }
  };

  Object.entries(PROFILE_ELEMENTS).forEach(([elementKey, elementConfig]) => {
    const element = elementKey as ProfileElement;
    const currentLevel = currentSettings[element];
    const newLevel = newSettings[element];

    if (currentLevel !== newLevel) {
      const currentOrder = levelOrder.indexOf(currentLevel);
      const newOrder = levelOrder.indexOf(newLevel);

      const impact = newOrder > currentOrder ? 'increase' : 'decrease';
      const currentCount = getVisibilityCount(currentLevel);
      const newCount = getVisibilityCount(newLevel);

      analysis.push({
        element,
        currentLevel,
        newLevel,
        impact,
        affectedUsers: [], // 実際の実装では具体的なユーザーリストを返す
        description: impact === 'increase'
          ? `約${newCount - currentCount}人に新たに公開されます`
          : `約${currentCount - newCount}人から非公開になります`,
      });
    }
  });

  return analysis;
}
