# Webアプリケーション画面表示エラー 調査報告書

- **作成日**: 2025年6月21日
- **担当**: AIアシスタント
- **ステータス**: ✅ 解決済み

---

## 1. 問題の概要

### 1.1 発生事象
- `http://localhost:3000` にアクセスした際、Next.jsアプリケーションのルートページが表示されず、**404 Not Found** エラー、その後 **500 Internal Server Error** が発生した。

### 1.2 期待される動作
- **未認証時**: `http://localhost:3000/` にアクセスすると `/auth/login` へリダイレクトされる。
- **認証済み時**: ダッシュボードページ (`/`) が表示される。

---

## 2. 調査プロセス

### 2.1 初期調査 (Lint & Buildエラー)
1.  `pnpm lint` と `pnpm build` を実行。
2.  **結果**: `<a>` タグの使用に関するESLintエラーが検出されたが、これは画面表示の404/500エラーの直接的な原因ではないと判断。

### 2.2 依存関係と構成ファイルの確認
1.  **`react-router` の確認**: プロジェクト内に `react-router` への依存はなく、Next.js App Routerが正しく使用されていることを確認。
2.  **`next.config.js` vs `next.config.ts`**: `apps/web` ディレクトリに両方の設定ファイルが存在し、競合の可能性が浮上。
3.  **`app` ディレクトリ構造**: `apps/web/app` は空であり、Next.jsのルーティングを混乱させる原因と特定。

### 2.3 エラーの深堀り (500 Internal Server Error)
1.  構成ファイルを修正後、開発サーバーを再起動したところ、エラーが `404` から `500` に変化。
2.  サーバーログを確認し、以下のエラーメッセージを特定。
    ```
    TypeError: Cannot destructure property 'isLoading' of 'useAuth(...)' as it is undefined.
    ```
3.  このエラーは `useAuth` フックが `ConvexProvider` のコンテキスト外で呼び出されているか、プロバイダー自体が正しく機能していないことを示唆。

### 2.4 根本原因の特定
1.  `apps/web/src/components/convex-provider.tsx` を調査。
2.  **発見**: `ConvexAuthNextjsProvider` を `@convex-dev/auth/nextjs` からインポートしようとしていたが、このパッケージ/モジュールは存在しない。
3.  **正しい実装**: `@convex-dev/auth/react` の `ConvexAuthProvider` を使用する必要があった。
4.  さらに、`ConvexAuthProvider` に必須の `client` プロパティが渡されていないことも判明。

---

## 3. 根本原因

1.  **最重要原因**: **Convex認証プロバイダーの不適切な設定**
    - 存在しない `@convex-dev/auth/nextjs` モジュールをインポートしようとしていた。
    - `ConvexAuthProvider` コンポーネントに必須の `client={convex}` プロパティが欠けていた。

2.  **副次的要因**:
    - **Next.js設定の競合**: `next.config.js` と `next.config.ts` が共存していた。
    - **不正なディレクトリ構造**: `apps/web/app` (空のディレクトリ) が存在し、App Routerの動作を妨げていた。
    - **依存関係の不整合**: `@auth/core` のバージョンが `@convex-dev/auth` の要求と一時的に異なっていた。

---

## 4. 実施した修正内容

1.  **ConvexProviderの修正 (`convex-provider.tsx`)**
    - `ConvexAuthNextjsProvider` の使用を中止。
    - `convex/react` から `ConvexProvider` を、`@convex-dev/auth/react` から `ConvexAuthProvider` をインポート。
    - `ConvexAuthProvider` に `client={convex}` プロパティを正しく設定。

    ```tsx
    // Before
    import { ConvexAuthNextjsProvider } from '@convex-dev/auth/nextjs';
    // ...
    <ConvexAuthNextjsProvider client={convex}>{children}</ConvexAuthNextjsProvider>

    // After
    import { ConvexProvider } from 'convex/react';
    import { ConvexAuthProvider } from '@convex-dev/auth/react';
    // ...
    <ConvexProvider client={convex}>
      <ConvexAuthProvider client={convex}>
        {children}
      </ConvexAuthProvider>
    </ConvexProvider>
    ```

2.  **Next.js設定ファイルの統一**
    - `next.config.js` の内容を `next.config.ts` にマージ。
    - `next.config.js` を削除し、設定を一本化。

3.  **ディレクトリ構造のクリーンアップ**
    - `apps/web/app` (空のディレクトリ) を削除。

4.  **堅牢性の向上 (`use-auth.ts`)**
    - `useAuth` フックに `try...catch` ブロックを追加し、プロバイダーが未初期化の場合でもアプリケーションがクラッシュしないようにフォールバック処理を実装。

5.  **依存関係の整理**
    - `pnpm install` を再実行し、`@auth/core` のバージョン問題を解決。

---

## 5. 結果

- 上記の修正を適用し、開発サーバーを再起動した結果、**404/500エラーは完全に解消**。
- ルートURL (`/`) にアクセスすると、`ProtectedRoute` が正しく機能し、未認証ユーザーは `/auth/login` にリダイレクトされる。
- すべての認証関連ページが正常に表示されることを確認。

**結論**: 問題は複数の設定ミスが重なって発生していましたが、**Convex認証プロバイダーの誤ったセットアップが最も直接的な原因**でした。現在はシステムが正常に動作しています。
