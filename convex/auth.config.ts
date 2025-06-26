/**
 * @fileoverview Convex 認証設定
 *
 * @description Clerk認証プロバイダーとの統合設定を管理します。
 * 環境変数を使用して開発・本番環境に対応した認証設定を提供し、
 * セキュアな認証プロセスを実現します。
 *
 * @since 1.0.0
 */

/**
 * 認証プロバイダー設定
 *
 * @description 個別の認証プロバイダー（Clerk）の設定情報を定義するインターフェース。
 * ドメインとアプリケーションIDを管理し、認証プロバイダーとの連携を可能にします。
 *
 * @interface
 * @since 1.0.0
 */
interface AuthProvider {
  /** 認証プロバイダーのドメインURL */
  domain: string;
  /** Convexアプリケーション識別子 */
  applicationID: string;
}

/**
 * 認証設定全体
 *
 * @description アプリケーション全体の認証設定を定義するインターフェース。
 * 複数の認証プロバイダーをサポートする構造になっています。
 *
 * @interface
 * @since 1.0.0
 */
interface AuthConfig {
  /** 設定済み認証プロバイダーの配列 */
  providers: AuthProvider[];
}

/**
 * 環境変数から認証設定を構築
 *
 * @description 環境変数から認証プロバイダーの設定を取得し、妥当性を検証します。
 * Clerkドメインの形式チェック、アプリケーションIDの必須確認などを行います。
 *
 * @function
 * @returns {AuthProvider} 検証済みの認証プロバイダー設定
 * @throws {Error} 必須環境変数が不正または未設定の場合
 * @example
 * ```typescript
 * // 環境変数設定例
 * // NEXT_PUBLIC_CLERK_FRONTEND_API_URL=https://your-app.clerk.accounts.dev
 * // CLERK_APPLICATION_ID=convex
 *
 * const config = getAuthConfig();
 * console.log('Auth domain:', config.domain);
 * ```
 * @since 1.0.0
 */
const getAuthConfig = (): AuthProvider => {
  // Convexでは process.env へのアクセスが制限されているため、
  // ビルド時に値が解決される必要があります
  const clerkDomain =
    process.env.NEXT_PUBLIC_CLERK_FRONTEND_API_URL ??
    process.env.CLERK_FRONTEND_API_URL ??
    process.env.CLERK_DOMAIN;
  const applicationId = process.env.CLERK_APPLICATION_ID ?? 'convex';

  // 設定の妥当性チェック
  if (!clerkDomain) {
    throw new Error(
      'Add NEXT_PUBLIC_CLERK_FRONTEND_API_URL, CLERK_FRONTEND_API_URL, or CLERK_DOMAIN to .env.local'
    );
  }

  if (!clerkDomain.startsWith('https://')) {
    throw new Error('NEXT_PUBLIC_CLERK_FRONTEND_API_URL must be a valid HTTPS URL');
  }

  if (!applicationId || applicationId.trim().length === 0) {
    throw new Error('CLERK_APPLICATION_ID is required and cannot be empty');
  }

  // Clerkドメインの形式チェック（基本的な検証）
  if (!clerkDomain.includes('.clerk.accounts.dev') && !clerkDomain.includes('clerk.')) {
    throw new Error('NEXT_PUBLIC_CLERK_FRONTEND_API_URL must be a valid Clerk domain');
  }

  return {
    domain: clerkDomain,
    applicationID: applicationId,
  };
};

/**
 * Convex 認証設定オブジェクト
 *
 * @description アプリケーション全体で使用される認証設定です。
 * Clerk認証プロバイダーとの統合に必要な情報を含み、
 * セキュアな認証フローを提供します。
 *
 * @constant
 * @type {AuthConfig}
 * @example
 * ```typescript
 * import authConfig from './auth.config';
 *
 * // 設定された認証プロバイダーを確認
 * console.log('Configured providers:', authConfig.providers);
 * ```
 * @since 1.0.0
 */
const authConfig: AuthConfig = {
  providers: [getAuthConfig()],
};

export default authConfig;
