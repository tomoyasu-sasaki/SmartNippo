# Clerk-Convex ユーザー・組織同期問題の調査と解決に関する報告書

**日付**: 2025/06/27 **作成者**: AIアシスタント **ステータス**: 解決済み

## 1. はじめに

本レポートは、ClerkとConvexを連携させたアプリケーションにおいて発生した、組織招待機能利用時のユーザー重複登録および組織情報紐付けの不具合に関する調査、原因分析、および解決策をまとめたものである。

## 2. 問題の概要

Clerkの組織招待機能を利用して新しいユーザーを招待・承認した際に、以下の2つの主要な問題が断続的に発生した。

1.  **ユーザーの重複登録**: 同じ`clerkId`を持つユーザーがConvexの`userProfiles`テーブルに複数作成される。
2.  **組織情報の紐付け失敗**: 新規ユーザーの`orgId`フィールドが更新されず、組織に所属できない。

これらの問題は、システムのデータ一貫性を損ない、ユーザー体験を著しく低下させる深刻なものであった。

## 3. 調査と原因分析

調査は、ClerkのWebhookログとConvexの実行ログを詳細に分析することから開始された。

### 3.1. 初期仮説と対策

当初は、同一のWebhookイベント（例:
`organizationMembership.created`）が複数回送信されることによる単純な重複処理が原因と考えられた。そのため、イベントごとに一意な`idempotencyKey`を生成し、処理の重複を防ぐ対策を実装した。

### 3.2. 根本原因：レースコンディションの特定

しかし、`idempotencyKey`を導入しても問題は解決しなかった。ログを時系列で詳細に分析した結果、問題の根本原因は、Clerkがユーザーの招待承認時に複数の**異なる**Webhookイベント（`user.created`と`organizationMembership.created`）をほぼ同時に送信することによる**競合状態（レースコンディション）**にあると特定した。

- **`user.created`ハンドラ**: ユーザーを作成しようとする。
- **`organizationMembership.created`ハンドラ**: ユーザーを検索し、存在しない場合は作成し、組織情報を更新しようとする。

これら2つのハンドラが並行して実行されると、お互いが「ユーザーはまだ存在しない」と判断してしまい、結果としてデータベースに2つのユーザーレコードが書き込まれていた。

### 3.3. 二次的問題：引数エラー

レースコンディションを解消するためにロジックを修正する過程で、`updateUserOrgAndRoleWithIdempotency`関数から不要な`userData`引数を削除した。しかし、呼び出し元である`convex/http.ts`の修正を怠ったため、`ArgumentValidationError`が発生し、`organizationMembership.created`のWebhookが常に失敗する新たな問題を引き起こした。これが`orgId`紐付け失敗の直接的な原因であった。

## 4. 解決策

根本原因であるレースコンディションを解消するため、Webhookハンドラの責務を明確に分離し、Clerkの自動再試行メカニズムを活用する堅牢なアーキテクチャを導入した。

### 4.1. 責務の明確な分離

- **`user.created`
  (`upsertUserWithIdempotency`)**: ユーザーの**作成・更新**に関する全責任を負う唯一の関数とした。
- **`organizationMembership.created`
  (`updateUserOrgAndRoleWithIdempotency`)**: 既存ユーザーに対する**組織情報（`orgId`と`role`）の更新（パッチ）のみ**を担当し、ユーザー作成ロジックを完全に削除した。

### 4.2. Clerkの再試行メカニズムの活用

- `organizationMembership.created`イベントが`user.created`イベントより先に到着し、対応するユーザーが存在しない場合、この関数は意図的に**エラーをスロー**する。
- これにより、Clerkは自動的にWebhookを再試行する。その間に`user.created`ハンドラがユーザーを作成するため、再試行時にはユーザーが正常に見つかり、組織情報の更新が成功する。

### 4.3. 引数エラーの修正

- `convex/http.ts`を修正し、`updateUserOrgAndRoleWithIdempotency`関数の呼び出しから不要な`userData`引数を削除した。

### 4.4. コードの簡素化とクリーンアップ

- 不要になった古い関数（`upsertUser`,
  `updateUserOrgAndRole`）や冗長な重複チェックロジックを削除し、コードの可読性と保守性を向上させた。
- 手動修正用のテスト関数（`cleanupDuplicateUsers`,
  `linkUserToOrg`）を実装し、開発・運用中のデータ補正を容易にした。

## 5. 検証

以下の手順で解決策を検証し、問題が完全に解消されたことを確認した。

1. 既存の重複ユーザーとデータ不整合を手動修正用関数でクリーンアップ。
2. 修正したコードを`pnpm convex deploy`でデプロイ。
3. 再度、組織招待フローをテスト。
4. ClerkのWebhookログで`organizationMembership.created`が一度失敗し、再試行後に成功することを確認。
5. `pnpm convex run tests/test:listUsers`を実行し、ユーザーが重複なく、かつ正しく組織に紐付いていることを確認。

## 6. 参照ドキュメント

今回の調査と解決にあたり、以下のドキュメントが役立った。

- **Clerk Webhooks**:
  - [Organizations > Invitations](https://clerk.com/docs/organizations/invitations)
  - [Users > Creating users](https://clerk.com/docs/users/creating-users)
- **Clerk API/Types Reference**:
  - [OrganizationMembership Type](https://clerk.com/docs/references/javascript/types/organization-membership)
  - [OrganizationInvitation Type](https://clerk.com/docs/references/javascript/types/organization-invitation)
  - [Backend API > Create organization membership](https://clerk.com/docs/references/backend/organization/create-organization-membership)
- **Convex Documentation**:
  - [Database Auth with Webhooks](https://docs.convex.dev/auth/database-auth)
