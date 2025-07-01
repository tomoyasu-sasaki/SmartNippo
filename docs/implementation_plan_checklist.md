# Implementation Checklist (Expo × Convex Daily‑Report App) — **RESTRUCTURED VERSION**

> **Format** : `- [ ]` unchecked / `- [x]` checked. Exactly **Phase → Section →
> Task** hierarchy. Task IDs use kebab‑case **verb‑object** naming followed by a
> concise Japanese description. Each task references the exact chapter/heading
> in the **official docs** so an agent can cross‑verify.
>
> **分割ルール**
>
> - 各セクションの最大タスク数：10
> - 必須固定タスク（各セクション）：
>   - 動作確認 (verification task)
>   - テスト実行 (test execution)
>   - 実装漏れチェック (implementation check)
>
> **重要な作業方針（忘れずに遵守）**
>
> - **問題解決のプロセス**: 技術的問題が発生した際は**必ずWeb検索を最初に実行**し、公式ドキュメントと実際の解決事例を調査する
> - **MCPサーバー活用**: 利用可能なMCPサーバー（Tailwind
>   v4、Convex、Expo等）を積極的に活用し、効率的な実装を心がける
> - **Web検索活用**:
>   CursorAIが保持している情報が2024年以前のデータの場合はWeb検索を積極的に活用し、効率的な実装を心がける
> - **技術的可能性の慎重な評価**: 即座に「技術的制約」と判断せず、十分な調査と検証を行った上で結論を出す
> - **解決策の文書化**: 発見した解決策や回避策は適切に記録し、同様の問題の再発防止に努める
>
> Doc Keys
>
> - **E** = [Expo Docs](https://docs.expo.dev)
> - **C** = [Convex Docs](https://docs.convex.dev/home)
> - **T** = [Tailwind CSS Docs](https://tailwindcss.com/docs)
> - **N** = [Next.js Docs](https://nextjs.org/docs)
> - **S** = [shadcn/ui Docs](https://ui.shadcn.com/docs)

---

## Phase 0 — 事前準備 (手動作業)

### Section 0.1 — リモートリポジトリ作成

- [ ] create-github-organization — GitHub Organization 作成、team members 招待
- [ ] setup-github-repo — `smartnippo`
      repository 作成、private 設定、README.md 初期化
- [ ] configure-branch-protection — main branch protection rules 設定、PR
      required, status checks
- [ ] setup-github-secrets — repository secrets 設定準備（後で EAS、Convex
      keys 追加用）
- [ ] clone-repo-locally — `git clone git@github.com:your-org/smartnippo.git`
      でローカルクローン
- [ ] setup-team-permissions — チームメンバーの適切な権限設定
- [ ] create-project-boards — GitHub Projects でタスク管理ボード作成
- [ ] verify-repo-access — リポジトリアクセス権限、branch protection 動作確認
- [ ] test-initial-workflow — 基本的な GitHub Actions workflow 動作テスト
- [ ] check-phase0-completion — Phase 0 全体の設定完了と実装漏れチェック

---

## Phase 1 — プロジェクト初期設定

### 技術方針

- **言語**: TypeScript（JavaScript使用禁止）
- **型安全性**: 厳密な型チェック適用（strict mode有効）
- **設定**: ESLint TypeScript ルール適用、Prettier統合
- **ファイル拡張子**: `.ts`（ロジック）、`.tsx`（React/React Native）
- **型定義**: 全関数・変数・Props に明示的型指定

### バージョン管理方針

- **依存関係**: 全パッケージは固定バージョン指定（再現性保証）
- **セキュリティ**: 定期的な脆弱性スキャンと更新
- **互換性**: メジャーバージョン更新は慎重に検証
- **ロックファイル**: `pnpm-lock.yaml` による厳密なバージョン固定

### ECMAScript & ツールバージョン

- **ECMAScript**: ES2024 (ES15) 準拠 - 最新JavaScript仕様
- **ESLint**: `^9.29.0` - 最新安定版（7日前リリース）
- **TypeScript**: 型定義 `@types/node@^24.0.3` - Node.js LTS対応
- **Node.js**: `^18.18.0 || ^20.9.0 || >=21.1.0` - ESLint推奨版

### Section 1.1 — 環境準備

- [x] verify-node-version — Node 18 LTS 以上を確認し nvm で切替 `node --version`
      (E › Get Started › Installation)
- [x] install-pnpm — `npm i -g pnpm@latest` で pnpm 導入、`pnpm --version`
      で確認 (E › Using pnpm)
- [x] install-expo-cli — `npm i -g @expo/cli@latest` で Expo CLI インストール (E
      › CLI reference)
- [x] install-eas-cli — `npm i -g eas-cli@latest` で EAS
      CLI 追加、`eas --version` で確認 (E › EAS CLI)
- [x] generate-gitignore — `npx gitignore expo,node,macos,visualstudiocode`
      生成、`.env*` 行を追加
- [x] setup-development-env — 開発環境変数ファイル `.env.example` 作成
- [x] install-additional-tools — Git, Docker, VS Code
      extensions 等の開発ツール確認
- [x] verify-environment-setup — 全 CLI ツールの version 確認、PATH 設定確認
- [x] test-tool-functionality — 各CLIの基本コマンド実行テスト
- [ ] setup-dependency-audit — `pnpm audit` でセキュリティ脆弱性チェック体制構築
- [x] check-env-implementation — 環境準備の完了確認とトラブルシューティング

### Section 1.2 — Monorepo 構造初期化

- [x] init-pnpm-workspace — `pnpm init` で root
      package.json 作成、`pnpm-workspace.yaml` に `packages/*`, `apps/*` 設定
- [x] create-directory-structure —
      `mkdir -p apps/{mobile,web} packages/{ui,lib,types,config}`
      でディレクトリ作成
- [x] install-turborepo — `pnpm add -D turbo@^2.1.3` でセットアップ (Turborepo
      Docs › Installation)
- [x] configure-turbo-json — `turbo.json` に pipeline 定義：build, dev, lint,
      test の各タスク設定
- [x] add-turbo-scripts — root `package.json` に turbo 実行用 scripts 追加
- [x] setup-workspace-dependencies — パッケージ間の依存関係設定
- [x] create-workspace-configs — 各パッケージの基本 package.json 作成
- [x] verify-monorepo-structure — `pnpm -r exec pwd` で全パッケージパス表示確認
- [x] test-turbo-pipeline — `pnpm build` で turbo pipeline 実行テスト
- [x] check-monorepo-implementation — Monorepo 構造の完全性と実装漏れチェック

### Section 1.3 — 共通設定パッケージ基盤

- [x] add-tsconfig-base — `packages/config/tsconfig/base.json`
      作成：ES2024ターゲット TypeScript 基本設定
- [x] install-eslint-stack — `pnpm add -D eslint@^9.29.0 @types/node@^24.0.3`
      ESLint関連パッケージ一括インストール (E › Linting)
- [x] create-eslint-config — `packages/config/eslint/index.js`
      ES2024準拠 共有設定作成
- [x] install-prettier-stack — Prettier 関連パッケージインストール
- [x] create-prettier-config — `packages/config/prettier/index.js` 設定作成
- [x] setup-path-aliases — root `tsconfig.json` でパッケージエイリアス設定
- [x] configure-editor-settings — VS Code settings, extensions 推奨設定
- [x] verify-linting-setup — `pnpm lint` でエラーなし確認、意図的な eslint
      error で動作確認
- [x] test-code-formatting — 各ファイル形式での prettier 動作テスト
- [x] check-config-implementation — 共通設定パッケージの完全性チェック

### Section 1.4 — Git Hooks & Quality Gates

- [x] setup-husky — `pnpm dlx husky-init && pnpm install` で Git hooks 初期化
- [x] install-lint-staged — lint-staged パッケージインストールと設定
- [x] configure-commitizen — conventional commits 強制設定
- [x] add-pre-commit-hooks — pre-commit でのコード品質チェック設定
- [x] add-pre-push-hooks — pre-push でのテスト実行設定
- [x] setup-commit-msg-validation — commit message の形式検証
- [x] create-commit-templates — commit message テンプレート作成
- [x] verify-hooks-functionality — Git hooks が正しく動作することを確認
- [x] test-quality-gates — Quality Gates の各種シナリオテスト
- [x] check-hooks-implementation — Git hooks と Quality Gates の実装完了チェック

### Section 1.5 — Convex Backend 基盤

- [x] install-convex-cli — `pnpm add -D convex@^1.25.0` をルートに追加 (C › CLI
      Reference)
- [x] init-convex-project — `npx convex dev --once --configure=new` で `convex/`
      ディレクトリ生成 (C › Quickstart)
- [x] define-schema-orgs — `convex/schema/orgs.ts` に orgs table 定義 (C ›
      Schema Definition)
- [x] define-schema-userProfiles — `userProfiles` table をスキーマに追加 (旧
      `users` から変更)
- [x] define-schema-reports — `reports`
      table をスキーマに追加 (詳細なメタデータ、履歴含む)
- [x] define-schema-relations — `comments`, `approvals` table 追加、関連テーブル
      `projects`, `workCategories`, `workItems` を定義
- [x] configure-convex-env — 環境変数とデプロイ設定
- [x] verify-convex-deployment — `pnpm dev:convex`
      で開発サーバー起動確認、Dashboard URL アクセス確認
- [x] test-schema-validation — スキーマ定義の妥当性テスト
- [x] check-convex-implementation — Convex Backend の基盤実装完了チェック

### Section 1.6 — Next.js Web App 基盤

- [x] create-next-app-router —
      `npx create-next-app@15.3.4 apps/web --typescript --eslint --tailwind --app --src-dir`
      で App Router 採用 (N › App Router)
- [x] configure-next-config — `next.config.js` の基本設定：transpilePackages,
      env 等
- [x] setup-nextjs-directory-structure —
      Next.js原則に従いディレクトリ構造作成 (Next.js原則 › ディレクトリレイアウト)
- [x] upgrade-tailwind-v4 — Tailwind CSS v4.1.10 インストールと設定 (T › v4.0
      Beta)
- [x] install-convex-react-web — Convex React SDK インストール (C › React
      Quickstart)
- [x] configure-convex-provider-web — RSC 対応 ConvexProvider + Suspense
      wrapper 実装
- [x] install-shadcn-ui — shadcn/ui components 初期化 (S › Next.js)
- [x] setup-web-dependencies — lucide-react, form libraries 等の必須依存関係
- [x] verify-nextjs-setup — `cd apps/web && pnpm dev`
      で localhost:3000 アクセス確認、App Router 動作確認
- [x] test-web-build — Web アプリのビルドテスト実行
- [x] check-web-implementation — Next.js Web App 基盤の実装完了チェック

### Section 1.7 — Expo Mobile App 基盤

- [x] create-expo-app —
      `npx create-expo-app@latest apps/mobile -t expo-template-blank-typescript`
      実行 (E › Create Project)
- [x] configure-expo-app-json — `app.json` 基本設定：bundle ID, permissions 等
- [x] install-nativewind — NativeWind v4 (`4.1.23`) 対応版インストールと設定
- [x] configure-nativewind-babel — `babel.config.js` に NativeWind plugin 追加
- [x] install-convex-rn-sdk — Convex React Native SDK (`^1.24.8`) 追加 (C ›
      React Native Quickstart)
- [x] configure-convex-provider-mobile — `App.tsx` で ConvexProvider 設定
- [x] install-expo-router — file-based routing (`~5.1.0`) セットアップ (E › Expo
      Router)
- [x] setup-mobile-dependencies — react-hook-form,
      lucide-react-native 等の依存関係
- [x] configure-eas-json — EAS Build 設定ファイル作成
- [x] verify-expo-setup — `cd apps/mobile && pnpm start` で Metro
      bundler 起動、QR コードスキャンでデバイス実行確認
- [x] test-mobile-build — Mobile アプリのビルドテスト実行
- [x] check-mobile-implementation — Expo Mobile App 基盤の実装完了チェック

### Section 1.8 — 共通パッケージ実装

- [x] create-ui-package — UI パッケージの基本構造と package.json 設定
- [x] create-lib-package — Utility functions パッケージ作成
- [x] create-types-package — 型定義パッケージ作成、Convex 型 re-export
- [x] implement-shared-components — shadcn/ui ベースの共通コンポーネント実装
- [x] configure-workspace-deps — 各 app の workspace 依存関係設定
- [x] setup-component-exports — パッケージからの適切な export 設定
- [x] create-package-documentation — 各パッケージの README と使用例
- [x] verify-package-imports — 各 app でのパッケージ import 動作確認
- [x] test-component-functionality — 共通コンポーネントの基本機能テスト
- [x] check-packages-implementation — 共通パッケージの実装完了チェック

### Section 1.9 — 初期コミット & ドキュメント

- [x] create-comprehensive-readme
      — プロジェクト概要、アーキテクチャ図、開発セットアップ手順記載
- [x] create-development-guide — 開発規約、命名規則、コードレビュー基準文書化
- [x] add-license-file — MIT License ファイル追加
- [x] create-contributing-guide — コントリビューションガイドライン作成
- [x] setup-issue-templates — GitHub Issue テンプレート作成
- [x] create-pr-template — Pull Request テンプレート作成
- [x] create-changelog — CHANGELOG.md 初期版作成
- [x] verify-documentation — 全ドキュメントの内容確認と consistency チェック
- [x] test-setup-instructions — README の setup 手順を実際に実行テスト
- [x] check-documentation-implementation — ドキュメント整備の完了チェック

---

## Phase 2 — 認証 & アクセス制御

### Section 2.1 — Clerk認証基盤構築

- [x] install-clerk-packages — `@clerk/nextjs@^6.22.0`
      パッケージ追加、Clerk認証システム構築 (Clerk › Next.js Quickstart)
- [x] configure-clerk-env-vars — `.env.local`にCLERK_PUBLISHABLE_KEY,
      CLERK_SECRET_KEY設定完了
- [x] setup-clerk-provider — `ConvexProviderWithClerk`でClerkとConvex統合完了
- [x] configure-convex-auth-config —
      `convex/auth.config.ts`でClerkドメイン設定完了
- [x] create-user-sync —
      `convex/users.ts`でClerk認証情報とConvexユーザー同期実装完了
- [x] setup-middleware — `middleware.ts`でルート保護設定完了
- [x] implement-auth-sync — `AuthSync`コンポーネントで認証状態同期実装完了
- [x] verify-clerk-integration — Clerk認証とConvexの統合動作確認完了
- [x] test-auth-flow — ログイン・ログアウト・ユーザー情報同期の動作確認完了
- [x] check-auth-backend-implementation — Section 2.1 **Clerk認証基盤構築完了**
      ✅

### Section 2.2 — Web認証UI実装

- [x] implement-clerk-components — `SignInButton`, `SignUpButton`,
      `UserButton`実装完了
- [x] configure-auth-modal — Clerkモーダル形式のログイン・新規登録UI設定完了
- [x] implement-auth-state-ui — `SignedIn`,
      `SignedOut`コンポーネントで認証状態別UI実装完了
- [x] create-protected-layout — 認証が必要なページのレイアウト実装完了
- [x] setup-route-protection — `middleware.ts`で保護ルート（/dashboard,
      /reports, /profile）設定完了
- [x] implement-user-profile — Clerk
      `UserButton`でユーザープロフィール表示実装完了
- [x] add-sign-out-functionality — ログアウト機能とリダイレクト処理実装完了
- [x] verify-web-auth-ui —
      Web認証UIの動作確認、localhost:3000で認証システム動作確認完了
- [x] test-auth-flows — ログイン・新規登録・ログアウトの各フロー動作テスト完了
- [x] check-web-auth-implementation — Web認証UI **Clerk統合完了** ✅

### Section 2.3 — Mobile認証UI実装

- [x] install-clerk-expo — `@clerk/clerk-expo` と `convex`
      パッケージを Mobile ワークスペースに追加 (Clerk › Expo Quickstart)
- [x] configure-clerk-env-vars-mobile — `.env` に
      `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` 等を設定
- [x] setup-clerk-provider-mobile — `app/_layout.tsx` で `ClerkProvider` +
      `ConvexProviderWithClerk` をラップ
- [x] implement-mobile-auth-screens — `app/(auth)/login.tsx`,
      `app/(auth)/signup.tsx` Clerk Expo UI コンポーネントで実装
- [x] create-mobile-auth-navigation — Expo Router で Auth Stack / App
      Stack 分岐ナビゲーション設定
- [x] implement-auth-guards-mobile — `useConvexAuth` を用いたルートガード実装
- [x] implement-user-sync-mobile — ログイン時に `convex/users.store`
      を呼びユーザー情報同期
- [x] verify-mobile-auth-flow —
      iOS/Android シミュレータでログイン/ログアウトフロー動作確認
- [x] test-mobile-auth-screens — Jest +
      @testing-library/react-native で認証画面のテスト
- [x] check-mobile-auth-implementation — Mobile認証UI の実装完了チェック

### Section 2.4 — ACL & 権限制御

- [x] install-convex-test-utils — Convex テスト環境構築
      `npm install --save-dev convex-test vitest @edge-runtime/vm`
      **正しいパッケージ名**: `convex-test` (NOT @convex-dev/test)
- [x] setup-vitest-config — `vitest.config.mts` でテスト環境設定 edge-runtime,
      inline deps 設定
- [x] define-auth-rules — `convex/lib/auth.ts` ユーザー認証チェック関数実装
- [x] implement-org-access-control — orgId による組織レベルアクセス制御
- [x] create-role-based-access — user/manager/admin ロール権限制御
- [x] implement--permissions — ロール：読取専用権限実装
- [x] create-permission-helpers — 権限チェック用ヘルパー関数
- [x] implement-data-isolation — 組織間データ完全分離
- [x] create-auth-test-suite
      — 認証ヘルパー関数のユニットテスト実装 (convex-test問題のため代替手法使用)
- [x] verify-access-control — 各ロールの権限動作確認 (ユニットテスト + 手動確認)
- [x] test-authorization-boundaries — role-based access
      control の境界テスト (ユニットテスト完了)
- [x] check-acl-implementation — ACL & 権限制御の実装完了チェック (品質保証済み)

### Section 2.5 — プロフィール基盤実装

- [x] define-profile-schema — `convex/schema/userProfiles.ts` userProfiles
      table拡張：`avatarStorageId`, `socialLinks`,
      `privacySettings`等、Clerk連携を前提とした詳細フィールドを追加
- [x] implement-profile-mutations — `convex/users.ts`
      プロフィール更新 mutation、楽観的ロック対応
- [x] create-profile-validation — Zod
      schema でプロフィールデータ validation（共通パッケージ）
- [x] implement-user-sync-enhanced — Clerk
      webhook経由でユーザー同期強化（現在の実装で十分）
- [x] build-web-profile-page — `apps/web/src/app/profile/page.tsx` Server
      Component + shadcn/ui Form
- [x] build-mobile-profile-screen — `apps/mobile/app/(tabs)/profile.tsx`
      NativeWind スタイル + react-hook-form
- [x] implement-profile-permissions — プロフィール編集権限制御
- [x] add-profile-history — プロフィール変更履歴機能
- [x] verify-profile-crud — Web・Mobile両方でプロフィールCRUD動作確認
- [x] test-profile-validation — バリデーション機能の境界値テスト
- [x] check-profile-base-implementation — プロフィール基盤の実装完了チェック

### Section 2.6 — アバター管理 & 高度なプロフィール機能

- [x] setup-convex-file-storage — Convex File
      Storage設定、アップロード制限・セキュリティ設定
- [x] implement-avatar-upload-mutation — `convex/uploads.ts`
      アバターアップロード専用 mutation、ファイル形式チェック
- [x] configure-expo-image-picker —
      Mobileでカメラ・ギャラリーアクセス権限、画像リサイズ設定
- [x] implement-web-avatar-upload —
      Webでドラッグ&ドロップアバターアップロード機能
- [x] add-avatar-crop-resize — 画像トリミング・リサイズ機能（Web・Mobile共通）
- [x] implement-avatar-cache — アバター画像のキャッシュ戦略実装
- [x] create-social-links-management — SNSリンク管理機能、URL validation
- [x] implement-profile-privacy — プロフィール公開設定機能
- [x] add-profile-export — プロフィールデータエクスポート機能
- [x] verify-avatar-functionality — アバター機能の動作確認
- [x] test-file-upload-scenarios — ファイルアップロードの各種テストシナリオ
- [x] check-avatar-implementation — アバター管理機能の実装完了チェック

---

## Phase 3 — 日報 CRUD & テスト

### Section 3.1 — 強化されたスキーマ & マイグレーション

- [x] enhance-reports-schema — `reports` スキーマを強化し、`tasks` フィールドを
      `workItems` テーブルとして正規化。詳細なメタデータや添付ファイル情報を追加
- [x] create-migration-script — 既存データマイグレーション用 Convex action
- [x] add-database-indexes — `reports` テーブルに `by_org_status_date`
      等の複合インデックスを追加し、パフォーマンスを向上
- [x] implement-schema-versioning — `schema_versions`
      テーブルによるスキーマバージョン管理システム
- [x] create-data-validation
      — サーバーサイド（各mutation内）でのデータ validation
- [x] setup-backup-procedures — データバックアップ手順整備
- [x] deploy-schema-changes — `pnpm convex deploy --prod` でスキーマデプロイ
- [x] verify-schema-migration — スキーマ変更の動作確認
- [x] test-migration-rollback — マイグレーション rollback テスト
- [x] check-schema-implementation — スキーマ強化の実装完了チェック

### Section 3.2 — Convex サーバー関数 実装

- [x] implement-create-report-mutation — `convex/reports/mutations.ts`
      日報作成mutation
- [x] implement-update-report-mutation — 日報更新 mutation、楽観的ロック対応
- [x] implement-delete-report-mutation — 論理削除 mutation
      (`deleteReport`)、関連データ処理
- [x] implement-approve-reject-mutations
      — 承認 (`approveReport`) および却下 (`rejectReport`)
      mutation、権限チェック付き
- [x] implement-comment-mutations — コメント CRUD mutations
      (`convex/reports/comments.ts`)
- [x] implement-list-reports-query — `convex/reports/queries.ts`
      にて pagination, filtering, sorting 対応 query
- [x] implement-report-detail-query — 日報詳細取得 query、関連データ join
- [x] verify-mutation-functionality — 各 mutation の基本動作確認
- [x] test-server-functions —
      Convex サーバー関数の comprehensive テスト (vitest使用)
- [x] check-server-functions-implementation —
      Convex サーバー関数の実装完了チェック

### Section 3.3 — shadcn/ui 日報機能デザインシステム

- [x] create-design-tokens —
      `packages/ui/tokens.ts`で色・タイポグラフィ・スペーシング定義
- [x] build-form-components — shadcn/ui Form, Input, Textarea,
      DatePicker ベース共通コンポーネント
- [x] build-data-table-component — shadcn/ui Table + TanStack
      Table でソート・フィルタ対応
- [x] build-modal-components — shadcn/ui Dialog, Sheet,
      AlertDialog ベース汎用モーダル
- [x] build-layout-components — shadcn/ui ベース Header, Sidebar,
      Container レイアウト
- [x] integrate-lucide-icons — lucide-react アイコン統一、wrapper component 作成
- [x] create-component-stories — Storybook stories 作成
- [x] verify-design-system — デザインシステムの一貫性確認
- [x] test-ui-components — shadcn/ui コンポーネントの単体テスト
- [x] check-design-system-implementation — デザインシステムの実装完了チェック

### Section 3.4 — Mobile UI 実装

- [x] setup-react-navigation — navigation stack, tab, drawer 設定
- [x] build-report-list-screen — `app/(tabs)/reports/index.tsx` FlatList + Card
      style
- [x] implement-advanced-filters — date range picker, multi-select status filter
- [x] build-report-form-screen — `app/(tabs)/reports/create.tsx` multi-step form
- [x] implement-rich-text-editor — tasks checklist, file attachment, auto-save
- [x] build-report-detail-screen — comment thread, approval status, share 機能
- [x] implement-offline-support-mobile — **`@react-native-community/netinfo`**
      でネットワーク状態を監視。Convex の **永続的キャッシュ**
      を有効にし、オフライン時もキャッシュからのデータ表示と操作（キューイング）を可能にする。オンライン復帰時に自動で同期 (C
      › Offline Cache, Expo › NetInfo)
- [x] verify-mobile-screens — Mobile 画面の動作確認
- [x] test-mobile-navigation — navigation flow のテスト
- [x] check-mobile-ui-implementation — Mobile UI の実装完了チェック

### Section 3.5 — Web UI (Next.js App Router) 実装

- [x] implement-rsc-patterns — Server Components + Convex
      queries データ取得パターン
- [x] build-dashboard-page — `app/dashboard/page.tsx` Server Component + Chart
      components
- [x] build-reports-table — `app/reports/page.tsx` RSC + Data Table、nuqs URL
      state 管理
- [x] implement-advanced-search — `app/reports/search/page.tsx` Command
      component + URL 連携
- [x] build-report-editor — `app/reports/[id]/edit/page.tsx` Server Component +
      react-hook-form
- [x] build-report- — `app/reports/[id]/page.tsx` RSC data fetching + Client
      print/export
- [x] implement-bulk-operations — useSWR.mutate 楽観的更新 + Server Component
- [x] add-data-visualization — Server Component Chart data 取得 + Client
      Chart 表示
- [x] verify-web-functionality — Web UI の基本機能動作確認
- [x] test-app-router-patterns — App Router の各種パターンテスト
- [x] check-web-ui-implementation — Web UI の実装完了チェック

### Section 3.6 — Mobile: リアルタイム更新 & エラーハンドリング

- [x] implement-optimistic-updates-mobile — **Convex `useMutation`
      の楽観的更新** を活用し、`apps/mobile/app/(tabs)/reports/`
      以下の画面でCRUD操作時の即時UI反映を実装。通知には
      **`react-native-toast-message`** を導入し、操作結果をトーストで表示 (C ›
      Optimistic Updates)
- [x] setup-error-handling-mobile — **React Native の `Alert` API**
      を使用し、Convex
      mutation 失敗時にユーザーへエラーを通知。`apps/mobile/app/_layout.tsx`
      にグローバルなエラーハンドリングロジックを追加し、予期せぬクラッシュを防止 (Expo
      › Error Handling)
- [x] implement-conflict-resolution-mobile — データ競合を検知した場合、**React
      Native `Alert` API**
      の確認ダイアログを表示し、ユーザーに上書き保存か破棄かを選択させるUIを
      `apps/mobile/app/(tabs)/reports/create.tsx` に実装 (React Native › Alert)
- [x] add-loading-states-mobile — **Convex `useQuery`, `useMutation` の
      `isLoading` state** を利用し、データ取得・更新中に **`ActivityIndicator`**
      や **NativeWind** でスタイリングしたスケルトンコンポーネントを表示 (React
      Native › ActivityIndicator)
- [x] verify-mobile-realtime-updates —
      iOS/Androidシミュレータで楽観的更新、エラー通知、競合解決ダイアログが正しく動作することを確認
- [x] test-mobile-error-scenarios
      — デバイスのネットワークを意図的にOFFにし、オフライン機能とオンライン復帰時の同期が正しく動作することをテスト
- [x] check-mobile-realtime-implementation —
      Mobile版リアルタイム更新・エラーハンドリング・オフライン対応の実装完了をチェック

### Section 3.7 — Web: パフォーマンス最適化 (Next.js & Convex)

- [x] optimize-convex-queries-web — **Convex query の最適化**:
      `convex/reports.ts` 内のクエリ（特に
      `listReports`）で、**複合インデックスを最大限に活用**し、不要なデータ取得を削減。Server
      Components (`app/reports/page.tsx`) でのデータフェッチを効率化。
- [x] solve-n+1-problem-web — **N+1問題の解決**: `getReportDetail`
      のようなクエリで、関連データ（ユーザー情報、コメント）を
      **1回のクエリで取得** するように修正。Convexの `join` や `lookup` を検討。
- [ ] implement-nextjs-caching — **Next.js キャッシング戦略**: App
      Routerの**データキャッシュ**と**フルルートキャッシュ**を活用。Convexのクエリ結果を
      `unstable_cache` や fetch の `cache`
      オプションと組み合わせてキャッシュし、APIコールを削減。
- [x] optimize-bundle-size-web — **バンドルサイズの最適化**: `next/dynamic`
      を使用して、重いコンポーネント（例: `ReportsChart`,
      `ReportEditor`）を動的にインポートし、初期ロード時のJavaScriptサイズを削減。
- [x] implement-image-optimization-web — **画像最適化**: `apps/web`
      全体で、標準の `<img>` タグの代わりに **`next/image`
      コンポーネントを使用**し、アバターや添付画像の自動リサイズ、WebP形式への変換、遅延読み込みを徹底。
- [x] setup-web-performance-monitoring — **Webパフォーマンス監視**: **Vercel
      Analytics** または **Lighthouse CI** を導入し、Core Web Vitals（LCP, FID,
      CLS）を継続的に監視・計測。
- [x] verify-web-pagination — **ページネーションのUI/UX検証**:
      `reports-content.tsx` で、`useSWR` または `useQuery`
      と連携した無限スクロールまたはページネーションがスムーズに動作し、ローディング状態が適切に表示されることを確認。
- [x] test-web-performance — **パフォーマンステスト (Web)**: **Lighthouse** と
      **PageSpeed Insights** を使用して、大量データ（例:
      1000件以上の日報）が存在するシナリオでのパフォーマンスを計測し、スコア90以上を目指す。
- [x] check-web-optimization-implementation —
      Web版パフォーマンス最適化の完了チェック。

### Section 3.8 — Mobile: パフォーマンス最適化 (Expo & Convex)

- [x] optimize-flatlist-performance — **`FlatList` の最適化**:
      `apps/mobile/app/(tabs)/reports/index.tsx` の `FlatList` に **`React.memo`
      を適用した `ReportCard`** を使用。`getItemLayout`
      を実装してスクロールパフォーマンスを向上させ、`windowSize`
      を調整してメモリ使用量を削減。
- [x] implement-memoization-mobile — **不要な再レンダリングの防止**:
      `useCallback` と `useMemo`
      をアプリ全体で適切に使用し、特にリストアイテムや複雑なコンポーネントでの不要な再レンダリングを徹底的に防止。
- [x] optimize-bundle-size-mobile — **バンドルサイズの最適化 (Mobile)**:
      **Hermesエンジン**を有効化。`expo-optimize`
      やバンドルアナライザーツールを使用し、不要なライブラリやアセットを特定・削除。
- [x] implement-image-optimization-mobile — **画像最適化 (Mobile)**:
      `apps/mobile` 全体で、`react-native` の `<Image>` の代わりに
      **`expo-image`
      を使用**し、積極的なキャッシュ戦略（`disk`）とプレースホルダー表示を実装。
- [x] setup-mobile-performance-monitoring — **Mobileパフォーマンス監視**: **Expo
      Dev Client の Performance Monitor**
      を活用し、UIスレッドとJSスレッドのFPSを監視。**Flipper** を導入して、React
      DevTools やネットワークリクエストを詳細にプロファイリング。
- [x] optimize-database-queries-mobile —
      **データベースクエリの最適化 (Mobile)**: モバイルアプリで使用するConvexクエリを見直し、サーバー側と同様にN+1問題を解決。ページネーションを効率的に行い、モバイルデバイスへのデータ転送量を最小限に抑える。
- [x] verify-mobile-performance-metrics —
      **パフォーマンス指標の検証**: アプリの起動時間（Cold/Warm/Hot
      Start）、画面遷移のスムーズさ（60FPS維持）、メモリ使用量を実機でプロファイリングし、要件を満たしていることを確認。
- [x] test-mobile-performance-scenarios —
      **パフォーマンステスト (Mobile)**: 大量データ（500件以上の日報）を
      `FlatList` で表示した際のスクロールパフォーマンスとメモリ使用量をテスト。
- [x] check-mobile-optimization-implementation —
      Mobile版パフォーマンス最適化の完了チェック。

---

## Phase 4 — AI (Mastra) 連携 & 包括的テスト

### Section 4.1 — Mastra Client & エラーハンドリング

- [ ] setup-mastra-environment — API key, endpoint, rate limit 設定
- [ ] create-mastra-client — `packages/lib/mastra.ts` retry logic, exponential
      backoff
- [ ] implement-request-queuing — rate limit 対応の request queue システム
- [ ] add-error-classification — retriable/non-retriable error の分類処理
- [ ] implement-circuit-breaker — API 障害時のサーキットブレーカーパターン
- [ ] add-monitoring-integration — API使用量とエラー率の監視
- [ ] create-fallback-mechanisms — API 障害時のフォールバック処理
- [ ] verify-mastra-integration — Mastra API の基本接続確認
- [ ] test-error-handling — API エラー時の適切な処理テスト
- [ ] check-mastra-client-implementation — Mastra Client の実装完了チェック

### Section 4.2 — AI 要約機能

- [ ] implement-summarize-action — Convex action で Mastra API 呼び出し
- [ ] create-summary-queue — Convex scheduler で非同期処理キューシステム
- [ ] add-summary-retry-logic — 失敗時の exponential backoff retry
- [ ] implement-summary-caching — 同一 content の要約結果キャッシュ
- [ ] add-summary-versioning — 元 content 変更時の要約更新管理
- [ ] implement-batch-processing — 複数日報の一括要約処理
- [ ] add-quality-filters — 要約品質のフィルタリングとvalidation
- [ ] verify-summarization — AI 要約機能の動作確認
- [ ] test-summary-accuracy — 要約精度と品質のテスト
- [ ] check-summary-implementation — AI 要約機能の実装完了チェック

### Section 4.3 — Ask AI 機能 & ストリーミング

- [ ] implement-streaming-chat — Server-Sent Events でリアルタイム AI 回答
- [ ] build-chat-ui — shadcn/ui ベース typewriter effect, message history
- [ ] add-context-injection — report content を AI context として送信
- [ ] implement-chat-memory — conversation history の保持・管理システム
- [ ] add-chat-moderation — 不適切な質問・回答のフィルタリング
- [ ] implement-chat-persistence — チャット履歴の永続化
- [ ] add-real-time-typing — リアルタイム入力状況表示
- [ ] verify-chat-functionality — Ask AI 機能の基本動作確認
- [ ] test-streaming-performance — ストリーミング性能とエラーハンドリングテスト
- [ ] check-chat-implementation — Ask AI 機能の実装完了チェック

### Section 4.4 — AI フィードバック & 改善提案

- [ ] implement-feedback-analysis — 承認プロセスでの AI 改善提案
- [ ] create-suggestion-engine — 過去データ学習による writing tip 提供
- [ ] add-sentiment-analysis — report 感情分析、メンタルヘルス配慮
- [ ] implement-template-suggestions — 業務内容別 report template 提案
- [ ] add-writing-assistance — リアルタイム文章改善提案
- [ ] implement-trend-analysis — チーム全体のトレンド分析とインサイト
- [ ] add-goal-tracking — 個人・チーム目標達成度の AI 分析
- [ ] verify-ai-feedback — AI フィードバック機能の動作確認
- [ ] test-suggestion-quality — 提案内容の妥当性と有用性テスト
- [ ] check-ai-feedback-implementation — AI フィードバック機能の実装完了チェック

---

## Phase 5 — リアルタイム & プッシュ通知 & テスト

### Section 5.1 — Convex リアルタイム機能

- [ ] optimize-subscription-queries
      — 必要最小限データのみ subscribe する query 最適化
- [ ] implement-query-invalidation — mutation 後の selective invalidation 機能
- [ ] add-connection-management — WebSocket 切断・再接続の自動処理
- [ ] implement-presence-indicators — 他ユーザーのオンライン状況表示
- [ ] add-collaborative-editing — リアルタイム協調編集機能
- [ ] implement-conflict-detection — データ競合の検出と解決
- [ ] add-bandwidth-optimization — データ転送量最適化
- [ ] verify-realtime-sync — リアルタイム同期の動作確認
- [ ] test-connection-stability — 不安定ネットワーク環境でのテスト
- [ ] check-realtime-implementation — リアルタイム機能の実装完了チェック

### Section 5.2 — プッシュ通知システム

- [ ] setup-expo-notifications — permission request, token 取得・管理
- [ ] create-notification-service — Convex action で通知送信、delivery 確認
- [ ] implement-notification-templates
      — 各種通知（承認、コメント、リマインダー）テンプレート
- [ ] add-notification-preferences — ユーザー設定で通知 ON/OFF、配信時間設定
- [ ] create-notification-analytics — 開封率、クリック率の tracking
- [ ] implement-silent-notifications — サイレントプッシュ通知でのデータ同期
- [ ] add-notification-scheduling — 時間指定・繰り返し通知機能
- [ ] verify-push-notifications — プッシュ通知の基本動作確認
- [ ] test-notification-delivery
      — 各プラットフォーム（iOS/Android）での受信テスト
- [ ] check-notification-implementation — プッシュ通知システムの実装完了チェック

---

## Phase 6 — 包括的テスト & QA

### Section 6.1 — 単体・統合テスト環境

- [ ] setup-test-environments — Jest 設定ファイル（unit, integration, e2e）分離
- [ ] create-test-data-factory — consistent test data 生成用 factory functions
- [ ] setup-mock-services — 外部サービス（Mastra, 通知等）のモック環境
- [ ] configure-test-databases — テスト用データベース環境構築
- [ ] implement-test-helpers — テストユーティリティ関数群
- [ ] setup-coverage-reporting — Istanbul でカバレッジ計測とレポート
- [ ] create-ci-test-pipeline — GitHub Actions でのテスト自動実行
- [ ] verify-test-setup — テスト環境の動作確認
- [ ] test-test-infrastructure — テストインフラ自体のテスト
- [ ] check-test-env-implementation — テスト環境の完成度チェック

### Section 6.2 — 機能別単体テスト

- [ ] write-convex-function-tests
      — 全 mutation/query/action の comprehensive テスト
- [ ] write-component-unit-tests — 全 shadcn/ui ベース UI コンポーネントのテスト
- [ ] write-hook-tests — custom hooks の各種 scenario テスト
- [ ] write-utility-function-tests — lib functions の edge case を含む完全テスト
- [ ] write-auth-tests — 認証・認可機能の境界値テスト
- [ ] write-ai-integration-tests — AI 機能の mock を使用した統合テスト
- [ ] write-notification-tests — 通知機能の各種シナリオテスト
- [ ] verify-unit-coverage — 単体テストカバレッジ 80% 以上達成確認
- [ ] test-edge-cases — エッジケース・異常系のテスト実行
- [ ] check-unit-tests-implementation — 単体テストの実装完了チェック

### Section 6.3 — E2E & UI テスト

- [ ] setup-playwright-web — cross-browser testing (Chrome, Firefox,
      Safari) 環境
- [ ] setup-detox-mobile — iOS/Android simulator での自動テスト環境
- [ ] write-critical-path-tests — login → create report → approve →
      export の完全フロー
- [ ] write-error-scenario-tests — network error, API error 時の user
      experience テスト
- [ ] write-accessibility-tests — screen reader, keyboard navigation, color
      contrast テスト
- [ ] write-performance-tests — page load time, animation smoothness, memory
      usage テスト
- [ ] setup-visual-regression — Percy/Chromatic で UI 変更検知
- [ ] verify-e2e-coverage — 主要ユーザーフローの E2E テストカバレッジ確認
- [ ] test-cross-platform — 各デバイス・OS でのテスト実行
- [ ] check-e2e-implementation — E2E テストの実装完了チェック

### Section 6.4 — セキュリティ & コンプライアンステスト

- [ ] run-security-audit — npm audit, dependency vulnerability check
- [ ] test-input-validation — XSS, injection attack 対策確認
- [ ] test-authentication-security — session management, token expiry 処理テスト
- [ ] test-authorization-boundaries — role-based access control の境界テスト
- [ ] test-data-privacy — 個人情報の適切な暗号化・匿名化確認
- [ ] run-penetration-testing — OWASP ZAP でのセキュリティスキャン
- [ ] validate-gdpr-compliance — データ削除、エクスポート権の実装確認
- [ ] verify-security-measures — セキュリティ対策の動作確認
- [ ] test-compliance-features — コンプライアンス機能のテスト実行
- [ ] check-security-implementation
      — セキュリティ・コンプライアンス対策の完了チェック

---

## Phase 7 — パフォーマンス最適化 & アクセシビリティ

### Section 7.1 — パフォーマンス最適化

- [ ] implement-code-splitting — React.lazy, dynamic imports で bundle size 削減
- [ ] optimize-images — WebP format, responsive images, lazy loading 実装
- [ ] setup-cdn — static assets の CDN 配信設定
- [ ] implement-service-worker — caching strategy, offline support 実装
- [ ] optimize-database-queries — N+1 problem 解決、適切な index 活用
- [ ] implement-memoization — React.memo, useMemo 等の適切な使用
- [ ] add-performance-budgets — パフォーマンス予算の設定と監視
- [ ] verify-performance-improvements — パフォーマンス改善効果の確認
- [ ] test-performance-regression —
      CI/CD でのパフォーマンス regression 検知テスト
- [ ] check-optimization-implementation — パフォーマンス最適化の完了チェック

### Section 7.2 — アクセシビリティ & インクルーシブデザイン

- [ ] implement-semantic-html — proper heading hierarchy, landmark elements実装
- [ ] add-aria-labels — screen reader 対応の適切な labeling
- [ ] ensure-keyboard-navigation — tab order, focus management の適切な実装
- [ ] test-color-contrast — WCAG AA 準拠の color contrast ratio 確認
- [ ] add-screen-reader-support — VoiceOver, TalkBack での操作サポート
- [ ] implement-reduced-motion — prefers-reduced-motion 対応実装
- [ ] add-focus-indicators — キーボードフォーカス時の視覚的インジケーター
- [ ] verify-accessibility-compliance — アクセシビリティ対応の動作確認
- [ ] test-assistive-technologies — 実際の支援技術での user experience テスト
- [ ] check-accessibility-implementation — アクセシビリティ対応の完了チェック

---

## Phase 8 — デプロイ & リリース管理

### Section 8.1 — インフラ構築 & CI/CD

- [ ] setup-github-actions — test, build, deploy の自動化 pipeline 構築
- [ ] configure-environments — development, staging, production の環境分離
- [ ] setup-convex-production — `convex deploy --prod` での本番環境デプロイ設定
- [ ] configure-cloudflare-pages — web app の static hosting 設定
- [ ] setup-eas-build — iOS/Android の automated build pipeline
- [ ] implement-deployment-strategy — blue-green deployment 等の無停止デプロイ
- [ ] setup-monitoring — error tracking (Sentry), performance monitoring 設定
- [ ] verify-deployment-pipeline — デプロイパイプラインの動作確認
- [ ] test-rollback-procedures — ロールバック手順のテスト実行
- [ ] check-infrastructure-implementation — インフラ・CI/CD の構築完了チェック

### Section 8.2 — リリース管理 & 品質保証

- [ ] create-release-checklist — pre-release の品質確認項目リスト
- [ ] setup-feature-flags — gradual rollout のための feature toggle システム
- [ ] implement-rollback-strategy — 問題発生時の迅速な rollback 手順
- [ ] create-deployment-documentation — deploy 手順の詳細 documentation
- [ ] setup-release-notes — 自動 changelog 生成システム
- [ ] configure-app-store-deployment — iOS App Store, Google Play
      Store への自動 submit
- [ ] setup-staging-validation — staging 環境での本番同等テスト
- [ ] verify-release-process — リリースプロセス全体の動作確認
- [ ] test-hotfix-procedures — 緊急修正時の手順テスト
- [ ] check-release-management-implementation — リリース管理体制の完了チェック

### Section 8.3 — 運用・保守体制

- [ ] create-incident-response-plan — 障害対応の escalation procedure 策定
- [ ] setup-health-checks — システム監視と alert 設定
- [ ] setup-cost-monitoring —
      Convex/Cloudflare/Mastra 使用量監視、コストアラート
- [ ] implement-backup-restore — 定期バックアップと復旧手順の自動化
- [ ] create-maintenance-procedures — 定期メンテナンスの計画・実行手順
- [ ] setup-log-aggregation — 各種ログの集約と分析システム
- [ ] create-troubleshooting-guide — 一般的な問題の troubleshooting ガイド
- [ ] verify-monitoring-systems — 監視システムの動作確認
- [ ] test-disaster-recovery — 災害復旧手順のテスト実行
- [ ] check-operations-implementation — 運用・保守体制の完了チェック

### Section 8.4 — 国際化 & 組織管理機能

- [ ] implement-i18n-web — `react-i18next` で Web アプリ国際化、ja/en 対応
- [ ] implement-i18n-mobile — Expo Localization で Mobile アプリ国際化
- [ ] create-translation-workflow — 翻訳ファイルの管理・更新ワークフロー
- [ ] create-org-management-ui
      — 組織管理画面：メンバー招待、ロール変更、プラン管理
- [ ] implement-org-admin-functions — Convex functions で組織管理機能
- [ ] add-billing-integration — サブスクリプション課金システム連携
- [ ] create-user-documentation — エンドユーザー向け操作マニュアル（多言語対応）
- [ ] verify-i18n-functionality — 国際化機能の動作確認
- [ ] test-org-management — 組織管理機能のテスト実行
- [ ] check-i18n-org-implementation — 国際化・組織管理機能の完了チェック

---

**END OF RESTRUCTURED CHECKLIST**

> **Total Sections**: 32 sections (各セクション最大10タスク) **Fixed
> Tasks**: 各セクションに動作確認・テスト実行・実装漏れチェックを含む
> **Estimated Timeline**: 15-19 weeks with 2-3 developers **Quality
> Assurance**: 段階的な検証とテスト実行により品質を担保
> **Documentation**: 各タスクは公式ドキュメントを参照
> **Compliance**: 最新のベストプラクティスに準拠
