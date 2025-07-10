---
title: 'Clerkへのプロフィール情報一元化 実装計画 (v2)'
date: 2024-07-29
author: 'AI Assistant'
tech_stack:
  - 'Clerk'
  - 'Convex'
  - 'Next.js'
  - 'React Native'
  - 'TypeScript'
  - 'Zod'
constraints:
  - 'Clerkをユーザー情報のSingle Source of Truth (SSoT)とする'
  - 'ユーザー編集可能な情報はClerkの`unsafeMetadata`に格納する'
  - 'アプリケーション固有の役割(role)や組織ID(orgId)はConvexの`userProfiles`テーブルに保持し、Clerkの`publicMetadata`と同期する'
  - '既存ユーザーのデータはマイグレーションスクリプトでClerkに移行する'
  - 'WebとMobileで一貫したデータ構造と型定義を利用する'
---

# Clerkへのプロフィール情報一元化 実装計画書 (v2)

このドキュメントは、ユーザープロフィール情報の管理をConvexからClerkに一元化するための、より詳細で具体的な実装計画を定義します。

## Phase 1: スキーマ設計と型定義

### Section 1.1: Clerkメタデータと型定義の共通化

- [x] Task 1: `packages/lib/src/schemas` に `clerk-metadata.ts`
      を作成し、Zodを用いてClerkの `unsafeMetadata` (socialLinks,
      privacySettings等) と `publicMetadata` (role) のスキーマを定義する
- [x] Task 2: 定義したZodスキーマからTypeScriptの型 (`ClerkUnsafeMetadata`,
      `ClerkPublicMetadata`) を生成し、`packages/types` からエクスポートする
- [x] Task 3: `socialLinks` や `privacySettings`
      の具体的な構造（プラットフォームごとのURL、各プライバシー項目のレベルなど）をZodスキーマで厳密に定義する
- [x] Task 4: Clerkの `useUser()` フックから返される `unsafeMetadata` や
      `publicMetadata` を安全にパースするための型ガード関数 or
      `schema.safeParse()` を使用するヘルパー関数を作成する
- [x] Task 5: 既存の `userProfiles`
      テーブルから移行するフィールドと、Clerkメタデータで管理するフィールドのマッピングを明確にドキュメント化する
- [x] Task
      6: アプリケーション全体で利用するユーザー情報の統合的な型定義 (`UnifiedUserProfile`) を作成する (ClerkのUserオブジェクトとConvexの
      `role` `orgId` を組み合わせた形)
- [x] Task 7: `packages/config/eslint`
      にZod関連のベストプラクティスを強制するルールがあれば追加を検討する
- [x] Task
      8: 実装の冗長・整合性確認 (Web/Mobileで個別に定義されている類似の型を削除し、共通の型定義に統一する)
- [x] Task 9: `pnpm lint` の実行と発生した警告とエラーの修正
      **エラーが解消されるまでpnpm lintを繰り返す**
- [x] Task
      10: 実装漏れチェック (将来的な拡張性を考慮したスキーマ設計になっているかレビュー)

### Section 1.2: Convexスキーマのスリム化とマイグレーション準備

- [x] Task 1: `convex/schema/userProfiles.ts` を修正し、`name`, `email`,
      `avatarUrl`, `socialLinks`, `privacySettings`
      等のフィールド定義を完全に削除する
- [x] Task 2: `userProfiles` テーブルに `clerkId` と `orgId` のみ残し、`role`
      フィールドはClerkの `publicMetadata`
      と同期するため残すか検討する（最終的には削除する方向で）
- [x] Task 3: `convex/users/mutations.ts` 内の既存 `storeUser` や
      `updateProfile` を見直し、Clerk
      Webhook経由の処理に一本化するため、不要な関数を洗い出す
- [x] Task
      4: 既存ユーザーデータをConvexからClerkメタデータに移行するための、1回限りのConvex
      Action (`internal.users.actions.migrateToClerkMetadata`) の骨子を作成する
- [x] Task 5: マイグレーションAction内で、全 `userProfiles`
      を取得し、ClerkのBackend SDK
      (`clerkClient.users.updateUserMetadata`) を使って `unsafeMetadata`
      を更新するロジックを実装する
- [x] Task
      6: マイグレーションActionが特定のユーザーIDを対象に実行できるよう、引数で制御可能にする（テスト用）
- [x] Task
      7: マイグレーションActionのレートリミット対策やエラーハンドリングを実装する (Clerk
      APIの呼び出し制限を考慮)
- [x] Task
      8: 実装の冗長・整合性確認 (スリム化されたスキーマに伴い、不要になったConvexインデックスを削除する)
- [x] Task 9: `pnpm lint` の実行と発生した警告とエラーの修正
      **エラーが解消されるまでpnpm lintを繰り返す**
- [x] Task 10: 実装漏れチェック (マイグレーション失敗時のロールバック手順を検討)

## Phase 2: バックエンド連携の強化

### Section 2.1: Clerk Webhookハンドラの改修

- [x] Task 1: `convex/http.ts` のWebhookハンドラが、`user.created`
      イベントでClerkの基本情報 (`id`, `first_name`, `last_name`,
      `image_url`) を受け取っているか確認する
- [x] Task 2: `user.updated`
      イベントのペイロードを詳細に調査し、どのフィールドが変更されたか (`email_addresses`,
      `unsafe_metadata`等) を特定するロジックを実装する
- [x] Task 3:
      Webhookハンドラ内のDB更新処理を、イベントペイロードに含まれるデータのみを更新する部分更新ロジックに修正する (例: メタデータ更新なら
      `updateUserMetadata` のみ呼ぶ)
- [x] Task 4: `organizationMembership.created` や `organization.updated`
      イベントを処理するロジックが、ユーザーの `orgId` と `role` を正しく
      `userProfiles` テーブルに反映しているか再検証する
- [x] Task 5: ユーザーの `role` がClerk側で更新された場合 (例: Admin
      API経由)、その変更をConvexに同期するため、`publicMetadata`
      の変更をWebhookで検知し、`userProfiles.role` を更新する処理を追加する
- [x] Task 6: `user.deleted` イベントの処理が、関連する `userProfiles`
      レコードを安全に削除または無効化することを確認する
- [x] Task 7:
      Webhook処理におけるエラーロギングを強化し、どのイベントで、どのユーザーIDで問題が発生したか追跡しやすくする
- [x] Task 8: 実装の冗長・整合性確認 (各`case`文での処理の共通化、idempotency
      key生成ロジックの妥当性確認)
- [x] Task 9: `pnpm lint` の実行と発生した警告とエラーの修正
      **エラーが解消されるまでpnpm lintを繰り返す**
- [x] Task
      10: 実装漏れチェック (ClerkのWebhook再試行ポリシーを考慮した設計になっているか確認)

## Phase 3: Web・Mobileアプリケーションの改修

### Section 3.1: プロフィール編集機能の改修 (Web & Mobile共通ロジック)

- [x] Task
      1: プロフィールフォームのデータソースをConvexからClerkに置き換え (WebではuseUser()、MobileではClerk
      Expo SDKのuseUser())
- [x] Task
      2: フォームの初期値設定ロジックで、Clerkメタデータを安全にパースして利用 (parseClerkUnsafeMetadata)
- [x] Task
      3: フォームの送信処理をClerkのuser.update()に統一し、メタデータ更新にmergeUnsafeMetadataを利用
- [x] Task 4:
      socialLinksとprivacySettingsの更新が部分的なディープマージとして機能することを確認
- [x] Task
      5: アバター更新の処理を見直し、Clerkのuser.update()でimageUrlを更新するか、Convexストレージと連携
- [x] Task 6: 更新成功後のUIへの即時反映 (user.reload()やoptimistic update)
- [x] Task 7: Clerk APIのエラーハンドリング (isClerkAPIResponseError)
- [x] Task 8:
      WebとMobileで重複しているフォームロジックを packages/hooksに共通化 (useProfileForm)
- [x] Task 9: `pnpm lint` の実行と発生した警告とエラーの修正
      **エラーが解消されるまでpnpm lintを繰り返す**
- [x] Task
      10: 実装漏れチェック (プロフィール編集でConvexへの依存が残っていないか確認)

### Section 3.2: プロフィール情報の表示ロジック統一

- [x] Task
      1: ヘッダー、サイドバー、コメント欄など、ユーザー名やアバターを表示する全てのコンポーネントで、useUser()フックに統一する
- [x] Task
      2: 他のユーザー情報を参照する箇所で、clerkIdをキーにしたデータ取得方法を実装 (ConvexクエリでClerkユーザー情報を取得)
- [x] Task 3: ユーザーのroleやorgIdに基づく条件分岐で、Convexのuser
      Profilesを継続利用
- [x] Task 4:
      useUser().isLoadedを利用したスケルトンローダーやプレースホルダーの実装
- [x] Task 5:
      useUnifiedUserProfileカスタムフックの作成 (ClerkとConvexのユーザー情報を統合)
- [x] Task 6:
      ProfileExportSectionの修正で、ClerkとConvexの情報を組み合わせてエクスポート
- [x] Task 7:
      user.deletedイベント時のUI対応確認 (Webhookで処理済み、UIは自動対応)
- [x] Task 8: ユーザー情報取得ロジックの集約と冗長性確認
- [x] Task 9: `pnpm lint` の実行と発生した警告とエラーの修正
      **エラーが解消されるまでpnpm lintを繰り返す**
- [x] Task
      10: 実装漏れチェック (プロフィール表示の統一性とユーザー体験の一貫性確認)

## Phase 4: データ移行と最終検証

### Section 4.1: 既存ユーザーのデータ移行とクリーンアップ

- [x] Task 1: 開発環境で、`Section 1.2` で作成したマイグレーションAction
      (`migrateToClerkMetadata`) をテストユーザーに対して実行し、データが正しくClerkに移行されることを確認する
- [x] Task
      2: 本番環境でのマイグレーション実行手順書を作成する (メンテナンス時間、実行コマンド、ロールバック手順を含む)
- [x] Task 3: マイグレーション完了後、`convex/schema/userProfiles.ts`
      から移行元の古いフィールド (`socialLinks` 等) を完全に削除する
- [x] Task
      4: 使用されなくなったConvexのミューテーション (`updateProfile`等) やクエリを完全に削除する
- [x] Task 5: マイグレーションAction
      (`migrateToClerkMetadata`) 自体も、役割を終えたらコードベースから削除する
- [x] Task
      6: 古いプロフィール関連の型定義や定数をプロジェクト全体から検索し、完全に削除する
- [x] Task 7: `docs/DEVELOPMENT_GUIDE.md`
      を更新し、新しいプロフィール管理のアーキテクチャ、特にClerkメタデータの構造と利用方法について詳細に記述する
- [x] Task 8: 実装の冗長・整合性確認 (環境変数 `.env.example`
      から不要になった変数を削除)
- [x] Task 9: `pnpm lint` の実行と発生した警告とエラーの修正
      **エラーが解消されるまでpnpm lintを繰り返す**
- [x] Task
      10: 実装漏れチェック (本番データでのマイグレーションリハーサル、CI/CDパイプラインへの影響がないことの最終確認)
