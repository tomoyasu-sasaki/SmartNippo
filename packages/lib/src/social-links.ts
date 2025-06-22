import { z } from 'zod';

// SNSプラットフォーム定義
export const SOCIAL_PLATFORMS = {
  twitter: {
    name: 'Twitter (X)',
    domain: 'twitter.com',
    urlPattern: /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/?$/,
    usernamePattern: /^[a-zA-Z0-9_]{1,15}$/,
    placeholder: '@username',
  },
  linkedin: {
    name: 'LinkedIn',
    domain: 'linkedin.com',
    urlPattern: /^https?:\/\/(www\.)?linkedin\.com\/(in|pub)\/[a-zA-Z0-9-]+\/?$/,
    usernamePattern: /^[a-zA-Z0-9-]{1,100}$/,
    placeholder: 'your-profile-name',
  },
  github: {
    name: 'GitHub',
    domain: 'github.com',
    urlPattern: /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9]([a-zA-Z0-9]|-(?!-))*[a-zA-Z0-9]\/?$/,
    usernamePattern: /^[a-zA-Z0-9]([a-zA-Z0-9]|-(?!-))*[a-zA-Z0-9]$/,
    placeholder: 'username',
  },
  instagram: {
    name: 'Instagram',
    domain: 'instagram.com',
    urlPattern: /^https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9_.]+\/?$/,
    usernamePattern: /^[a-zA-Z0-9_.]{1,30}$/,
    placeholder: 'username',
  },
  facebook: {
    name: 'Facebook',
    domain: 'facebook.com',
    urlPattern: /^https?:\/\/(www\.)?facebook\.com\/[a-zA-Z0-9.]+\/?$/,
    usernamePattern: /^[a-zA-Z0-9.]{1,50}$/,
    placeholder: 'your.name',
  },
  youtube: {
    name: 'YouTube',
    domain: 'youtube.com',
    urlPattern: /^https?:\/\/(www\.)?youtube\.com\/(c\/|channel\/|user\/|@)?[a-zA-Z0-9_-]+\/?$/,
    usernamePattern: /^[a-zA-Z0-9_-]{1,100}$/,
    placeholder: 'channel-name',
  },
  website: {
    name: 'Website',
    domain: '',
    urlPattern:
      /^https?:\/\/[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\/?.*$/,
    usernamePattern: /.*/,
    placeholder: 'https://your-website.com',
  },
} as const;

export type SocialPlatform = keyof typeof SOCIAL_PLATFORMS;

// ソーシャルリンクの型定義
export interface SocialLink {
  platform: SocialPlatform;
  url: string;
  username?: string | null;
  isVerified?: boolean;
  isPrivate?: boolean;
  displayOrder?: number;
}

// バリデーションスキーマ
export const socialLinkSchema = z.object({
  platform: z.enum(Object.keys(SOCIAL_PLATFORMS) as [SocialPlatform, ...SocialPlatform[]]),
  url: z.string().url('有効なURLを入力してください'),
  username: z.string().optional(),
  isVerified: z.boolean().optional().default(false),
  isPrivate: z.boolean().optional().default(false),
  displayOrder: z.number().int().min(0).optional().default(0),
});

export const socialLinksArraySchema = z
  .array(socialLinkSchema)
  .max(10, '最大10個のソーシャルリンクまで設定できます');

/**
 * URL形式のバリデーション
 */
export function validateSocialUrl(
  platform: SocialPlatform,
  url: string
): {
  isValid: boolean;
  error?: string;
  normalizedUrl?: string;
} {
  if (!url) {
    return { isValid: false, error: 'URLが入力されていません' };
  }

  const platformConfig = SOCIAL_PLATFORMS[platform];

  // 基本的なURL形式チェック
  try {
    new URL(url);
  } catch {
    return { isValid: false, error: '有効なURL形式ではありません' };
  }

  // プラットフォーム固有のパターンチェック
  if (!platformConfig.urlPattern.test(url)) {
    return {
      isValid: false,
      error: `${platformConfig.name}の有効なURL形式ではありません`,
    };
  }

  // URL正規化
  const normalizedUrl = normalizeUrl(url);

  return {
    isValid: true,
    normalizedUrl,
  };
}

/**
 * ユーザー名からURLを生成
 */
export function generateSocialUrl(platform: SocialPlatform, username: string): string | null {
  if (!username) {
    return null;
  }

  const platformConfig = SOCIAL_PLATFORMS[platform];

  // ユーザー名の形式チェック
  if (!platformConfig.usernamePattern.test(username)) {
    return null;
  }

  // プラットフォーム別URL生成
  switch (platform) {
    case 'twitter':
      return `https://twitter.com/${username.replace('@', '')}`;
    case 'linkedin':
      return `https://linkedin.com/in/${username}`;
    case 'github':
      return `https://github.com/${username}`;
    case 'instagram':
      return `https://instagram.com/${username}`;
    case 'facebook':
      return `https://facebook.com/${username}`;
    case 'youtube':
      return `https://youtube.com/@${username}`;
    case 'website':
      return username.startsWith('http') ? username : `https://${username}`;
    default:
      return null;
  }
}

/**
 * URLからユーザー名を抽出
 */
export function extractUsernameFromUrl(platform: SocialPlatform, url: string): string | null {
  if (!url) {
    return null;
  }

  try {
    const urlObj = new URL(url);
    const { pathname } = urlObj;

    switch (platform) {
      case 'twitter':
        const twitterMatch = pathname.match(/^\/([a-zA-Z0-9_]+)\/?$/);
        return twitterMatch ? twitterMatch[1] : null;

      case 'linkedin':
        const linkedinMatch = pathname.match(/^\/(in|pub)\/([a-zA-Z0-9-]+)\/?$/);
        return linkedinMatch ? linkedinMatch[2] : null;

      case 'github':
        const githubMatch = pathname.match(/^\/([a-zA-Z0-9-]+)\/?$/);
        return githubMatch ? githubMatch[1] : null;

      case 'instagram':
        const instagramMatch = pathname.match(/^\/([a-zA-Z0-9_.]+)\/?$/);
        return instagramMatch ? instagramMatch[1] : null;

      case 'facebook':
        const facebookMatch = pathname.match(/^\/([a-zA-Z0-9.]+)\/?$/);
        return facebookMatch ? facebookMatch[1] : null;

      case 'youtube':
        const youtubeMatch = pathname.match(/^\/(c\/|channel\/|user\/|@)?([a-zA-Z0-9_-]+)\/?$/);
        return youtubeMatch ? youtubeMatch[2] : null;

      case 'website':
        return urlObj.hostname;

      default:
        return null;
    }
  } catch {
    return null;
  }
}

/**
 * URL正規化
 */
export function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);

    // HTTPSに統一
    urlObj.protocol = 'https:';

    // www. を削除（一部のプラットフォームは除く）
    if (urlObj.hostname.startsWith('www.')) {
      urlObj.hostname = urlObj.hostname.substring(4);
    }

    // 末尾のスラッシュを削除
    if (urlObj.pathname.endsWith('/') && urlObj.pathname.length > 1) {
      urlObj.pathname = urlObj.pathname.slice(0, -1);
    }

    return urlObj.toString();
  } catch {
    return url;
  }
}

/**
 * ソーシャルリンク配列のバリデーション
 */
export function validateSocialLinks(links: SocialLink[]): {
  isValid: boolean;
  errors: string[];
  validLinks: SocialLink[];
} {
  const errors: string[] = [];
  const validLinks: SocialLink[] = [];
  const usedPlatforms = new Set<SocialPlatform>();

  // 基本的な配列検証
  const arrayValidation = socialLinksArraySchema.safeParse(links);
  if (!arrayValidation.success) {
    errors.push(...arrayValidation.error.errors.map((e) => e.message));
    return { isValid: false, errors, validLinks: [] };
  }

  // 各リンクの詳細検証
  for (let i = 0; i < links.length; i++) {
    const link = links[i];

    // 重複プラットフォームチェック
    if (usedPlatforms.has(link.platform)) {
      errors.push(`${SOCIAL_PLATFORMS[link.platform].name}は既に追加されています`);
      continue;
    }

    // URL検証
    const urlValidation = validateSocialUrl(link.platform, link.url);
    if (!urlValidation.isValid) {
      errors.push(`${SOCIAL_PLATFORMS[link.platform].name}: ${urlValidation.error}`);
      continue;
    }

    // 正規化されたリンクを追加
    const normalizedLink: SocialLink = {
      ...link,
      url: urlValidation.normalizedUrl ?? link.url,
      username: link.username ?? extractUsernameFromUrl(link.platform, link.url) ?? undefined,
      displayOrder: link.displayOrder ?? i,
    };

    usedPlatforms.add(link.platform);
    validLinks.push(normalizedLink);
  }

  // 表示順序でソート
  validLinks.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

  return {
    isValid: errors.length === 0,
    errors,
    validLinks,
  };
}

/**
 * ソーシャルリンクの可視性フィルタリング
 */
export function filterPublicSocialLinks(links: SocialLink[]): SocialLink[] {
  return links.filter((link) => !link.isPrivate);
}

/**
 * プラットフォーム別のアイコン名取得（Lucide React用）
 */
export function getSocialIcon(platform: SocialPlatform): string {
  const iconMap: Record<SocialPlatform, string> = {
    twitter: 'Twitter',
    linkedin: 'Linkedin',
    github: 'Github',
    instagram: 'Instagram',
    facebook: 'Facebook',
    youtube: 'Youtube',
    website: 'Globe',
  };

  return iconMap[platform] || 'Link';
}

/**
 * ソーシャルリンクのプレビュー情報取得
 */
export interface SocialLinkPreview {
  platform: SocialPlatform;
  platformName: string;
  url: string;
  username?: string;
  icon: string;
  color: string;
}

export function getSocialLinkPreview(link: SocialLink): SocialLinkPreview {
  const platformConfig = SOCIAL_PLATFORMS[link.platform];

  const colorMap: Record<SocialPlatform, string> = {
    twitter: '#1DA1F2',
    linkedin: '#0077B5',
    github: '#333333',
    instagram: '#E4405F',
    facebook: '#1877F2',
    youtube: '#FF0000',
    website: '#6B7280',
  };

  return {
    platform: link.platform,
    platformName: platformConfig.name,
    url: link.url,
    username: link.username ?? undefined,
    icon: getSocialIcon(link.platform),
    color: colorMap[link.platform],
  };
}

// Alias export for backward compatibility
export const extractUsername = extractUsernameFromUrl;
