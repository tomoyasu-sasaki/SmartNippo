# SmartNippo Convex Backend

このディレクトリには、SmartNippoアプリケーションのConvexバックエンド設定とサーバー関数が含まれています。

## 🔧 セットアップ

### 環境変数設定

プロジェクトルートの `.env` ファイルに以下の環境変数を設定してください：

```bash
# Convex認証設定
CLERK_DOMAIN=https://your-app-name.clerk.accounts.dev
CLERK_APPLICATION_ID=convex

# その他のConvex設定
CONVEX_DEPLOYMENT=dev:your-deployment-name
CONVEX_URL=your_convex_url
CONVEX_DEPLOY_KEY=your_convex_deploy_key
```

### 認証設定（auth.config.ts）

Clerk認証プロバイダーの設定は環境変数を使用して管理されています：

#### 開発環境

```bash
CLERK_DOMAIN=https://neutral-marmoset-26.clerk.accounts.dev
CLERK_APPLICATION_ID=convex
```

#### 本番環境

```bash
CLERK_DOMAIN=https://clerk.your-production-domain.com
CLERK_APPLICATION_ID=convex
```

#### 設定の妥当性

- `CLERK_DOMAIN`: 有効なHTTPS URLである必要があります
- `CLERK_APPLICATION_ID`: 空文字列は許可されません
- 設定が無効な場合、ビルド時にエラーが発生します

### 開発サーバーの起動

```bash
# Convex開発サーバーを起動
pnpm dev:convex

# または
npx convex dev
```

## 📁 ディレクトリ構造

```
convex/
├── _generated/          # Convex自動生成ファイル
├── lib/                # 共通ユーティリティ
│   └── auth.ts         # 認証ヘルパー関数
├── auth.config.ts      # Clerk認証設定
├── schema.ts           # データベーススキーマ
├── users.ts            # ユーザー関連関数
├── uploads.ts          # ファイルアップロード関数
└── http.ts             # HTTP ルーター
```

## 🔐 認証とセキュリティ

### 認証フロー

1. **Clerk認証**: フロントエンド（Web/Mobile）でClerk認証
2. **トークン検証**: Convexで認証トークンを検証
3. **ユーザー情報取得**: `userProfiles`テーブルからユーザー情報を取得
4. **権限チェック**: ロールベースアクセス制御（RBAC）

### 権限レベル

- `viewer`: 読取専用アクセス
- `user`: 自分の日報のCRUD操作
- `manager`: チーム日報の閲覧・承認
- `admin`: 全操作 + 組織設定

### セキュリティヘルパー

```typescript
import { requireAuthentication, requireRole } from './lib/auth';

// 認証必須チェック
const user = await requireAuthentication(ctx);

// 特定のロール以上が必要
const manager = await requireRole(ctx, 'manager', orgId);
```

## 🗄️ データベーススキーマ

### 主要テーブル

- `orgs`: 組織（マルチテナント）
- `userProfiles`: ユーザープロファイル
- `daily_reports`: 日報データ
- `audit_logs`: 監査ログ

詳細は `schema.ts` を参照してください。

## 🚀 開発とデプロイ

### ローカル開発

```bash
# 設定確認
npx convex dashboard

# 関数のテスト
npx convex run test:hello

# スキーマの更新
npx convex schema push
```

### デプロイ

```bash
# 本番環境へのデプロイ
npx convex deploy --prod

# 環境変数の設定
npx convex env set CLERK_DOMAIN https://clerk.your-domain.com
npx convex env set CLERK_APPLICATION_ID convex
```

## 🧪 テスト

```bash
# ユニットテスト実行
npm test

# 特定のテストファイル
npm test lib/auth.unit.test.ts
```

## ⚠️ 注意事項

1. **環境変数の設定**: `CLERK_DOMAIN`と`CLERK_APPLICATION_ID`は必須です
2. **ビルド時解決**: Convexでは環境変数がビルド時に解決されます
3. **HTTPS必須**: Clerkドメインは必ずHTTPSである必要があります
4. **設定の同期**: Web/Mobileアプリと同じClerk設定を使用してください

## 📝 トラブルシューティング

### よくある問題

1. **認証エラー**: `CLERK_DOMAIN`が正しく設定されているか確認
2. **ビルドエラー**: 環境変数が有効な値かチェック
3. **権限エラー**: ユーザーのロールと組織設定を確認

### デバッグ

```bash
# 設定の確認
npx convex env ls

# ログの確認
npx convex logs --tail
```

# Welcome to your Convex functions directory!

Write your Convex functions here. See https://docs.convex.dev/functions for
more.

A query function that takes two arguments looks like:

```ts
// functions.js
import { query } from './_generated/server';
import { v } from 'convex/values';

export const myQueryFunction = query({
  // Validators for arguments.
  args: {
    first: v.number(),
    second: v.string(),
  },

  // Function implementation.
  handler: async (ctx, args) => {
    // Read the database as many times as you need here.
    // See https://docs.convex.dev/database/reading-data.
    const documents = await ctx.db.query('tablename').collect();

    // Arguments passed from the client are properties of the args object.
    console.log(args.first, args.second);

    // Write arbitrary JavaScript here: filter, aggregate, build derived data,
    // remove non-public properties, or create new objects.
    return documents;
  },
});
```

Using this query function in a React component looks like:

```ts
const data = useQuery(api.functions.myQueryFunction, {
  first: 10,
  second: 'hello',
});
```

A mutation function looks like:

```ts
// functions.js
import { mutation } from './_generated/server';
import { v } from 'convex/values';

export const myMutationFunction = mutation({
  // Validators for arguments.
  args: {
    first: v.string(),
    second: v.string(),
  },

  // Function implementation.
  handler: async (ctx, args) => {
    // Insert or modify documents in the database here.
    // Mutations can also read from the database like queries.
    // See https://docs.convex.dev/database/writing-data.
    const message = { body: args.first, author: args.second };
    const id = await ctx.db.insert('messages', message);

    // Optionally, return a value from your mutation.
    return await ctx.db.get(id);
  },
});
```

Using this mutation function in a React component looks like:

```ts
const mutation = useMutation(api.functions.myMutationFunction);
function handleButtonPress() {
  // fire and forget, the most common way to use mutations
  mutation({ first: 'Hello!', second: 'me' });
  // OR
  // use the result once the mutation has completed
  mutation({ first: 'Hello!', second: 'me' }).then((result) =>
    console.log(result)
  );
}
```

Use the Convex CLI to push your functions to a deployment. See everything the
Convex CLI can do by running `npx convex -h` in your project root directory. To
learn more, launch the docs with `npx convex docs`.
