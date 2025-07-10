# Clerkプロフィール情報マイグレーション実行手順書

## 概要

既存のConvexユーザープロファイル情報をClerkメタデータに移行するための手順書です。

## 前提条件

1. **環境変数の設定**
   - `CLERK_SECRET_KEY`: ClerkのSecret Key（Admin API用）
   - Convex開発環境またはプロダクション環境への適切なアクセス権限

2. **バックアップの作成**
   - マイグレーション実行前に必ずデータベースのフルバックアップを作成
   - 特に`userProfiles`テーブルの完全なエクスポート

3. **メンテナンス時間の確保**
   - 推定時間: ユーザー100人あたり約10-15分
   - ユーザー数に応じて適切なメンテナンス時間を設定

## 実行手順

### Step 1: 事前準備

```bash
# 1. 現在のユーザー数を確認
npx convex run users/queries:listByOrg

# 2. バックアップの作成
npx convex run backup/actions:createFullBackup '{"description": "Pre-migration backup"}'

# 3. 環境変数の確認
echo $CLERK_SECRET_KEY
```

### Step 2: テスト実行（開発環境）

```bash
# 少数ユーザーでのテスト実行
npx convex run users/actions:migrateToClerkMetadata '{"limit": 1}'

# 結果の確認
# - Clerkダッシュボードでメタデータが正しく設定されているか確認
# - エラーログの確認
```

### Step 3: 段階的実行（本番環境）

```bash
# 段階1: 10ユーザーずつ実行
npx convex run users/actions:migrateToClerkMetadata '{"limit": 10}'

# 段階2: 結果確認後、残りユーザーを実行
npx convex run users/actions:migrateToClerkMetadata '{"limit": 50}'

# 段階3: 全ユーザーの実行
npx convex run users/actions:migrateToClerkMetadata '{}'
```

### Step 4: 検証

```bash
# 1. マイグレーション結果の確認
npx convex run users/queries:getAllProfiles '{"limit": 100}'

# 2. Clerkダッシュボードでの確認
# - Users > [ユーザー選択] > Metadata タブ
# - unsafeMetadata に socialLinks, privacySettings が設定されているか
# - publicMetadata に role が設定されているか

# 3. アプリケーションでの動作確認
# - プロフィール表示が正常に動作するか
# - プロフィール編集が正常に動作するか
```

## ロールバック手順

マイグレーションに問題が発生した場合：

### Step 1: 緊急停止

```bash
# 実行中のマイグレーションを停止（該当する場合）
# Convex Actionは通常自動的に停止しますが、長時間実行される場合は監視が必要
```

### Step 2: データ復旧

```bash
# バックアップからの復旧
npx convex run backup/actions:restoreFromBackup '{"backupId": "backup_id_here"}'
```

### Step 3: Clerkメタデータのクリア

```bash
# 必要に応じて、Clerk Admin APIを使用してメタデータをクリア
# 手動でClerkダッシュボードから削除するか、専用スクリプトを実行
```

## 監視ポイント

1. **実行時間**: 予想時間を大幅に超過していないか
2. **エラー率**: 失敗率が10%を超えていないか
3. **Clerk API制限**: レートリミットに引っかかっていないか
4. **メモリ使用量**: Convex Actionのメモリ使用量が異常でないか

## トラブルシューティング

### よくある問題

1. **CLERK_SECRET_KEY未設定**
   - 解決: 環境変数を正しく設定
   - 確認: `echo $CLERK_SECRET_KEY`

2. **Clerk APIレートリミット**
   - 解決: マイグレーション内の待機時間を増加（現在100ms）
   - 確認: Clerkダッシュボードのログで429エラーをチェック

3. **ユーザーが見つからない**
   - 解決: ClerkとConvexのユーザーIDマッピングを確認
   - 確認: `clerkId`フィールドの整合性をチェック

4. **メタデータ形式エラー**
   - 解決: 既存の`socialLinks`や`privacySettings`の形式を確認
   - 確認: Zodスキーマとの互換性をテスト

## 実行後の作業

マイグレーション成功後に実行する作業：

1. **スキーマクリーンアップ**: レガシーフィールドの削除
2. **使用されなくなったミューテーションの削除**
3. **マイグレーションActionの削除**
4. **ドキュメント更新**: 新しいアーキテクチャの記録

## 連絡先

- 技術責任者: [担当者名]
- 緊急連絡先: [連絡先]
- Slackチャンネル: #smartnippo-dev
