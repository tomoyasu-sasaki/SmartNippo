# 開発ガイドライン

このドキュメントは、SmartNippoプロジェクトの開発規約、命名規則、コードレビュー基準を定めています。

## 📋 目次

- [開発環境のセットアップ](#開発環境のセットアップ)
- [コーディング規約](#コーディング規約)
- [命名規則](#命名規則)
- [プロジェクト構造](#プロジェクト構造)
- [Git規約](#git規約)
- [コードレビュー基準](#コードレビュー基準)
- [テスト方針](#テスト方針)
- [パフォーマンス基準](#パフォーマンス基準)

## 開発環境のセットアップ

### 推奨開発環境

- **エディタ**: Visual Studio Code
- **Node.js**: 18 LTS以上（nvmでの管理推奨）
- **パッケージマネージャー**: pnpm 8.0以上
- **OS**: macOS / Windows (WSL2) / Linux

### 必須VS Code拡張機能

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "expo.vscode-expo-tools",
    "prisma.prisma"
  ]
}
```

### VS Code設定

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

## コーディング規約

### TypeScript

1. **厳密な型定義**

   ```typescript
   // ❌ Bad
   function processData(data: any) {}

   // ✅ Good
   function processData(data: ReportData) {}
   ```

2. **型推論の活用**

   ```typescript
   // ❌ Bad
   const reports: Report[] = [];

   // ✅ Good - 型推論可能な場合は省略
   const reports = [] as Report[];
   ```

3. **Enumよりもconst assertionを推奨**

   ```typescript
   // ❌ Bad
   enum Status {
     DRAFT = 'draft',
     SUBMITTED = 'submitted',
   }

   // ✅ Good
   const STATUS = {
     DRAFT: 'draft',
     SUBMITTED: 'submitted',
   } as const;

   type Status = (typeof STATUS)[keyof typeof STATUS];
   ```

4. **エラーハンドリング**
   ```typescript
   // ✅ Good
   try {
     const result = await someAsyncOperation();
     return { success: true, data: result };
   } catch (error) {
     console.error('Operation failed:', error);
     return { success: false, error: error.message };
   }
   ```

### React/React Native

1. **コンポーネント定義**

   ```typescript
   // ✅ Function Componentを使用
   export const ReportCard: React.FC<ReportCardProps> = ({ report, onPress }) => {
     return (
       <Card onPress={onPress}>
         <Text>{report.title}</Text>
       </Card>
     );
   };
   ```

2. **Hooks使用規則**

   ```typescript
   // カスタムフックは use プレフィックス
   export const useReports = (orgId: string) => {
     const reports = useQuery(api.reports.list, { orgId });
     return { reports, isLoading: reports === undefined };
   };
   ```

3. **条件付きレンダリング**

   ```typescript
   // ✅ Good - 早期リターン
   if (isLoading) return <Loading />;
   if (error) return <ErrorMessage error={error} />;

   return <ReportList reports={reports} />;
   ```

### Convex関数

1. **関数の構造**

   ```typescript
   // ✅ Good
   export const createReport = mutation({
     args: {
       title: v.string(),
       content: v.string(),
       orgId: v.id('orgs'),
     },
     handler: async (ctx, args) => {
       // 認証チェック
       const identity = await ctx.auth.getUserIdentity();
       if (!identity) throw new Error('Unauthorized');

       // ビジネスロジック
       const reportId = await ctx.db.insert('reports', {
         ...args,
         authorId: identity.subject,
         createdAt: Date.now(),
       });

       return reportId;
     },
   });
   ```

## 命名規則

### ファイル・ディレクトリ

| 種類              | 規則             | 例                       |
| ----------------- | ---------------- | ------------------------ |
| コンポーネント    | PascalCase       | `ReportCard.tsx`         |
| ページ（Next.js） | kebab-case       | `create-report/page.tsx` |
| ページ（Expo）    | kebab-case       | `create-report.tsx`      |
| ユーティリティ    | camelCase        | `formatDate.ts`          |
| 定数              | UPPER_SNAKE_CASE | `API_ENDPOINTS.ts`       |
| 型定義            | PascalCase       | `Report.types.ts`        |

### 変数・関数

```typescript
// 変数: camelCase
const reportTitle = '日報タイトル';
const isSubmitted = false;

// 関数: camelCase、動詞で開始
function submitReport(reportId: string) {}
async function fetchUserReports(userId: string) {}

// 定数: UPPER_SNAKE_CASE
const MAX_REPORT_LENGTH = 5000;
const DEFAULT_PAGE_SIZE = 20;

// React Component: PascalCase
function ReportDetailScreen() {}

// カスタムフック: use + PascalCase
function useReportSubmission() {}

// 型・インターフェース: PascalCase
interface ReportData {}
type ReportStatus = 'draft' | 'submitted' | 'approved';
```

### Convex関数

```typescript
// Query: 名詞または get/list で開始
export const report = query({
  /* ... */
});
export const listReports = query({
  /* ... */
});

// Mutation: 動詞で開始
export const createReport = mutation({
  /* ... */
});
export const updateReport = mutation({
  /* ... */
});

// Action: 動詞で開始（外部API呼び出し等）
export const generateSummary = action({
  /* ... */
});
```

## プロジェクト構造

### モノレポ構造

```
smartnippo/
├── apps/                    # アプリケーション
│   ├── mobile/              # Expo モバイルアプリ
│   │   ├── app/             # Expo Router ページ
│   │   ├── components/      # モバイル専用コンポーネント
│   │   ├── hooks/           # モバイル専用フック
│   │   └── utils/           # モバイル専用ユーティリティ
│   └── web/                 # Next.js Webアプリ
│       ├── src/
│       │   ├── app/         # App Router ページ
│       │   ├── components/  # Web専用コンポーネント
│       │   ├── hooks/       # Web専用フック
│       │   └── lib/         # Web専用ユーティリティ
│       └── public/          # 静的ファイル
├── packages/                # 共有パッケージ
│   ├── ui/                  # 共通UIコンポーネント
│   ├── lib/                 # 共通ユーティリティ
│   ├── types/               # 共通型定義
│   └── config/              # 共通設定
├── convex/                  # バックエンド
│   ├── _generated/          # 自動生成（編集不可）
│   ├── schema.ts            # データベーススキーマ
│   ├── auth.ts              # 認証関連
│   ├── reports.ts           # 日報関連
│   └── lib/                 # ヘルパー関数
└── docs/                    # ドキュメント
```

### ディレクトリごとの責務

- **apps/**: エンドユーザー向けアプリケーション
- **packages/ui/**: 再利用可能なUIコンポーネント（shadcn/ui拡張）
- **packages/lib/**: ビジネスロジックを含まないユーティリティ
- **packages/types/**: TypeScript型定義（Convex生成型の再エクスポート含む）
- **convex/**: すべてのバックエンドロジック

## Git規約

### ブランチ戦略

- **main**: 本番環境デプロイ用（保護設定）
- **develop**: 開発用統合ブランチ
- **feature/**: 新機能開発（例: `feature/add-ai-summary`）
- **fix/**: バグ修正（例: `fix/report-submission-error`）
- **refactor/**: リファクタリング（例: `refactor/optimize-queries`）

### コミットメッセージ

[Conventional Commits](https://www.conventionalcommits.org/)形式を使用：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type一覧:**

- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント変更
- `style`: コードスタイル変更（機能に影響なし）
- `refactor`: リファクタリング
- `perf`: パフォーマンス改善
- `test`: テスト追加・修正
- `chore`: ビルドプロセスやツールの変更

**例:**

```bash
feat(mobile): 日報作成画面にAI要約ボタンを追加

- Mastra APIとの連携実装
- ローディング状態の管理
- エラーハンドリングの追加

Closes #123
```

## コードレビュー基準

### レビュー観点

1. **機能要件**

   - [ ] 要件を満たしているか
   - [ ] エッジケースが考慮されているか
   - [ ] 既存機能への影響はないか

2. **コード品質**

   - [ ] 命名規則に従っているか
   - [ ] 適切にコメントされているか
   - [ ] DRY原則に従っているか
   - [ ] 単一責任の原則に従っているか

3. **型安全性**

   - [ ] TypeScriptエラーがないか
   - [ ] 適切な型定義がされているか
   - [ ] any型の使用は避けられているか

4. **パフォーマンス**

   - [ ] 不要な再レンダリングはないか
   - [ ] 適切にメモ化されているか
   - [ ] N+1問題はないか

5. **セキュリティ**

   - [ ] 認証・認可が適切か
   - [ ] 入力値の検証がされているか
   - [ ] センシティブ情報の扱いが適切か

6. **テスト**
   - [ ] 新機能に対するテストがあるか
   - [ ] 既存テストが通るか
   - [ ] カバレッジが維持されているか

### レビューコメントの書き方

```markdown
// 提案 suggestion: この処理は `useCallback`
でメモ化することでパフォーマンスを改善できます。

// 必須修正 must-fix: この条件では null 参照エラーが発生する可能性があります。

// 質問 question: このロジックの意図を教えていただけますか？

// 称賛 praise: エラーハンドリングが丁寧で素晴らしいです！
```

## テスト方針

### テストの種類と目標カバレッジ

| 種類       | 目標カバレッジ   | ツール                            |
| ---------- | ---------------- | --------------------------------- |
| 単体テスト | 80%              | Jest + React Testing Library      |
| 統合テスト | 主要フロー       | Jest + Convex Test                |
| E2Eテスト  | クリティカルパス | Playwright (Web) / Detox (Mobile) |

### テストファイルの配置

```
component/
├── ReportCard.tsx
├── ReportCard.test.tsx      # 単体テスト
└── ReportCard.stories.tsx   # Storybook
```

### テストの書き方

```typescript
describe('ReportCard', () => {
  it('should render report title correctly', () => {
    const report = createMockReport({ title: 'テストレポート' });
    const { getByText } = render(<ReportCard report={report} />);

    expect(getByText('テストレポート')).toBeInTheDocument();
  });

  it('should call onPress when clicked', () => {
    const onPress = jest.fn();
    const report = createMockReport();
    const { getByRole } = render(<ReportCard report={report} onPress={onPress} />);

    fireEvent.click(getByRole('button'));
    expect(onPress).toHaveBeenCalledWith(report.id);
  });
});
```

## パフォーマンス基準

### Web (Next.js)

- **Lighthouse Score**: 90以上
- **Core Web Vitals**:
  - LCP: ≤ 2.5s
  - FID: ≤ 100ms
  - CLS: ≤ 0.1

### Mobile (Expo)

- **起動時間**: ≤ 1.5s（コールドスタート）
- **画面遷移**: ≤ 200ms
- **メモリ使用量**: ≤ 150MB

### 最適化チェックリスト

- [ ] 画像の最適化（WebP、適切なサイズ）
- [ ] コード分割（動的インポート）
- [ ] リスト仮想化（大量データ表示時）
- [ ] 適切なキャッシュ戦略
- [ ] 不要な再レンダリングの防止

---

本ガイドラインは、プロジェクトの成長に合わせて継続的に更新されます。提案や改善点がある場合は、Issueを作成してください。
