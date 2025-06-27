# Webアプリケーション ディレクトリ構造最適化計画書

## 1. はじめに

本ドキュメントは、`apps/web`
ディレクトリの構造を最適化し、プロジェクト全体の可読性、保守性、拡張性を向上させるための計画を定義します。技術スタックは要件定義書
`docs/daily_report_webapp_requirements.md` に準拠し、Next.js App
Router のベストプラクティスを最大限に活用します。

## 2. 現状のディレクトリ構造

現在の `apps/web/src` の主要なディレクトリ構造は以下の通りです。

```
src/
├── app/
│   ├── dashboard/
│   │   ├── dashboard-content.tsx
│   │   └── page.tsx
│   ├── profile/
│   │   ├── page.tsx
│   │   └── profile-form.tsx
│   ├── reports/
│   │   ├── [id]/
│   │   ├── new/
│   │   ├── search/
│   │   ├── report-editor.tsx
│   │   └── reports-content.tsx
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── auth-sync.tsx
│   ├── convex-provider.tsx
│   ├── layout/
│   │   ├── container.tsx
│   │   └── header.tsx
│   ├── navigation.tsx
│   └── ui/
│       └── ... (shadcn/ui components)
├── hooks/
│   └── ...
├── lib/
│   └── utils.ts
├── providers/
│   └── convex-client-provider.tsx
└── middleware.ts
```

## 3. 課題

現状の構造には、以下の課題が存在します。

- **コンポーネントの関心事が混在**:
  - `app/` ディレクトリ内に、ルーティング定義だけでなく、本来 `components/`
    に配置すべきUIコンポーネント (`dashboard-content.tsx`, `report-editor.tsx`
    など) が混在しています。
  - `components/`
    ディレクトリがフラットな構造に近く、汎用UI、レイアウト、特定機能のコンポーネントが分離されていません。
- **ルーティング構造の不明瞭さ**:
  - 認証状態（認証済み/未認証）に応じたレイアウトの切り替えやページのグルーピングが、ファイル構造から読み取りにくくなっています。
- **拡張性の懸念**:
  - 型定義 (`types/`) や定数 (`constants/`) を管理する専用ディレクトリがなく、プロジェクトが拡大するにつれて管理が煩雑になる可能性があります。
- **ドメインの分離不足**:
  - 「日報」や「プロフィール」といった機能ドメインごとの関連ファイル（コンポーネント、フック、型定義など）が各ディレクトリに分散しており、機能単位での見通しが悪くなっています。

## 4. 提案するディレクトリ構造

上記の課題を解決するため、以下のようなディレクトリ構造を提案します。

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── _layout.tsx
│   ├── (main)/
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── profile/
│   │   │   └── page.tsx
│   │   ├── reports/
│   │   │   ├── page.tsx
│   │   │   ├── new/
│   │   │   │   └── page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       └── edit/
│   │   │           └── page.tsx
│   │   └── _layout.tsx
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── features/
│   │   ├── profile/
│   │   │   └── profile-form.tsx
│   │   └── reports/
│   │       ├── report-detail.tsx
│   │       ├── report-editor.tsx
│   │       ├── report-editor-wrapper.tsx
│   │       └── reports-content.tsx
│   ├── layouts/
│   │   ├── header.tsx
│   │   └── dashboard-sidebar.tsx
│   └── ui/
│       └── ... (shadcn/ui components)
├── constants/
│   └── index.ts
├── hooks/
│   ├── use-convex-mutation.ts
│   └── use-debounce.ts
├── lib/
│   ├── convex.ts
│   ├── utils.ts
│   └── validators/
│       └── report-schema.ts
├── providers/
│   ├── convex-provider.tsx
│   └── theme-provider.tsx
├── types/
│   ├── convex.d.ts
│   └── index.ts
└── middleware.ts
```

## 5. 主要な変更点と理由

### 5.1 `app/` - ルートグループによる関心の分離

- **`(auth)` と `(main)` ルートグループを導入**:
  - `(auth)`: ログインページなど、認証が不要なページを配置します。
  - `(main)`: ダッシュボードなど、認証が必要なメインアプリケーションのページを配置します。
  - これにより、認証状態に基づいたレイアウトの適用が容易になり、URLに影響を与えずにディレクトリを整理できます。
- **ページコンポーネントのみを配置**:
  - ルーティングに直接関連しないコンポーネントは `components/` に移動し、`app/`
    内は Next.js の規約に従うページ (`page.tsx`) とレイアウト (`layout.tsx`) に特化させます。

### 5.2 `components/` - Feature-Sliced Design に着想を得た再編成

- **`features/` ディレクトリの新設**:
  - 「日報」「プロフィール」といった機能ドメインごとにコンポーネントをまとめます。
  - これにより、特定の機能に関連するコンポーネントの見通しが良くなり、修正や機能追加が容易になります。
  - 例: `components/features/reports/report-editor.tsx`
- **`layouts/` ディレクトリの新設**:
  - ヘッダー、サイドバーなど、複数ページで共有されるレイアウトパーツを配置します。
- **`ui/` ディレクトリの役割明確化**:
  - `shadcn/ui`
    によって生成されるような、特定のビジネスロじっくを持たない再利用可能な最小単位のUIコンポーネント（Button,
    Inputなど）のみを配置します。

### 5.3 `constants/`, `lib/`, `types/` - プロジェクト基盤の整備

- **`constants/` の新設**:
  - アプリケーション全体で使用する定数（APIエンドポイント、固定メッセージなど）を一元管理します。
- **`lib/` の役割整理**:
  - `utils.ts`: 汎用的なヘルパー関数。
  - `convex.ts`: Convexクライアントの設定や関連ヘルパー。
  - `validators/`: Zodなどを用いたバリデーションスキーマを機能ごとに管理します。
- **`types/` の新設**:
  - アプリケーション固有の型定義を管理します。`packages/types`
    にある共有型と区別し、Webフロントエンドに特化した型をここに置きます。

## 6. 期待される効果

- **可読性の向上**: ディレクトリ名と構造から、ファイルやコンポーネントの役割が直感的に理解できるようになります。
- **保守性の向上**: 関心事の分離と機能ごとのグルーピングにより、コードの修正や影響範囲の特定が容易になります。
- **拡張性の向上**: 新機能を追加する際に、既存の構造に倣ってファイルを追加するだけで済み、破綻のないスケーリングが可能になります。
- **チーム開発の効率化**: 明確なルールに基づいた構造により、開発者間の認識齟齬が減り、オンボーディングコストも低減します。

## 7. 備考

本計画はディレクトリ構造の最適化に焦点を当てており、既存のロジックや機能の変更は含みません。実際の移行作業は、影響範囲を考慮し、段階的に進めることを推奨します。
