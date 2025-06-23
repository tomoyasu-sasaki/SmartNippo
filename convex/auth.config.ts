/**
 * Convex Authentication Configuration
 *
 * Clerk認証プロバイダーの設定
 * 環境変数を使用して異なる環境（開発、本番）をサポート
 *
 * 環境変数:
 * - CLERK_DOMAIN: Clerkのドメイン（例: https://your-app.clerk.accounts.dev）
 * - CLERK_APPLICATION_ID: Convexアプリケーション識別子（通常は"convex"）
 */

/**
 * 認証プロバイダー設定の型定義
 */
interface AuthProvider {
  domain: string;
  applicationID: string;
}

/**
 * 認証設定全体の型定義
 */
interface AuthConfig {
  providers: AuthProvider[];
}

/**
 * 環境変数から認証設定を取得する関数
 *
 * @returns {AuthProvider} 認証プロバイダー設定
 * @throws {Error} 必須環境変数が不正または未設定の場合
 */
const getAuthConfig = (): AuthProvider => {
  // Convexでは process.env へのアクセスが制限されているため、
  // ビルド時に値が解決される必要があります
  const clerkDomain = process.env.CLERK_DOMAIN ?? 'https://neutral-marmoset-26.clerk.accounts.dev';
  const applicationId = process.env.CLERK_APPLICATION_ID ?? 'convex';

  // 設定の妥当性チェック
  if (!clerkDomain?.startsWith('https://')) {
    throw new Error('CLERK_DOMAIN must be a valid HTTPS URL');
  }

  if (!applicationId || applicationId.trim().length === 0) {
    throw new Error('CLERK_APPLICATION_ID is required and cannot be empty');
  }

  // Clerkドメインの形式チェック（基本的な検証）
  if (!clerkDomain.includes('.clerk.accounts.dev') && !clerkDomain.includes('clerk.')) {
    throw new Error('CLERK_DOMAIN must be a valid Clerk domain');
  }

  return {
    domain: clerkDomain,
    applicationID: applicationId,
  };
};

/**
 * Convex認証設定
 *
 * この設定は認証プロバイダー（Clerk）との統合に使用されます。
 * 環境ごとに異なるClerkドメインを設定できます。
 */
const authConfig: AuthConfig = {
  providers: [getAuthConfig()],
};

export default authConfig;
