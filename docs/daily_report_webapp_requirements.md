# 日報管理アプリ 要件定義書 (Expo × Convex × Mastra)

> **改訂理由** :
> orgs テーブル追加・ロール拡張・非機能要件強化・リスク対策を反映。

---

## 1. 概要

| 項目         | 内容                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------- |
| 目的         | 日報提出・承認・フィードバックをモバイル中心で高速化し、AI 要約で振り返りを効率化する              |
| 対象ユーザー | ・**一般ユーザー** (user)・**閲覧専用ユーザー** (viewer)・**承認者** (manager)・**管理者** (admin) |
| KPI          | ①提出率 ≥95% ②承認24h以内 ③Web LCP≤2.5s/CLS≤0.1 ④Mobile cold‑start≤1.5s                            |
| 使用端末     | iOS 15+/Android 11+（Expo）、Chrome/Edge/Safari 最新                                               |

---

## 2. システム構成

| レイヤ        | 技術                                 | 補足                                     |
| ------------- | ------------------------------------ | ---------------------------------------- |
| モバイル      | **Expo (React Native/TS)**           | OTA 更新／EAS Build、NativeWind v4       |
| Web           | **Next.js 15 (App Router)**          | RSC優先、Cloudflare Pages 配信           |
| UI System     | **shadcn/ui + Tailwind CSS v4**      | 統一デザインシステム、lucide-react icons |
| BaaS          | **Convex**                           | DB + Edge Functions + ACL                |
| AI            | **Mastra GPT‑4o**                    | 要約・QA・改善提案 API                   |
| 状態管理      | **useSWR + nuqs + React Context**    | 楽観的更新、URL状態、最小グローバル状態  |
| CDN & Storage | Cloudflare Pages / R2                |                                          |
| モニタリング  | Sentry + Convex logs export          |                                          |
| CI/CD         | GitHub Actions + Turborepo + EAS CLI |                                          |

---

## 3. データモデル

```mermaid
erDiagram
  orgs {
    uuid id PK
    text name
    text plan
    timestamptz created_at
    timestamptz updated_at
  }
  users {
    uuid id PK
    text email
    text name
    text role "viewer|user|manager|admin"
    uuid orgId FK
    text avatarUrl
    text pushToken
    timestamptz created_at
    timestamptz updated_at
  }
  reports {
    uuid id PK
    uuid authorId FK
    text reportDate
    text title
    text content
    text status "draft|submitted|approved"
    text summary
    array tasks
    array attachments
    object metadata
    boolean isDeleted
    uuid orgId FK
    timestamptz created_at
    timestamptz updated_at
  }
  comments {
    uuid id PK
    uuid reportId FK
    uuid authorId FK "nullable"
    text content
    text type "user|system|ai"
    timestamptz created_at
  }
  approvals {
    uuid id PK
    uuid reportId FK
    uuid managerId FK
    timestamptz approved_at
  }
  audit_logs {
    uuid id PK
    uuid actor_id FK
    text action
    json payload
    timestamptz created_at
    uuid org_id
  }
  orgs ||--o{ users : "has"
  users ||--o{ reports : "creates"
  users ||--o{ comments : "writes"
  users ||--o{ approvals : "approves"
  users ||--o{ audit_logs : "logs"
  reports ||--o{ comments : "has"
  reports ||--o{ approvals : "requires"
```

---

## 4. 機能要件

### 4.1 認証 & 権限

- Magic‑Link 認証 (Convex Auth)
- RLS: `org_id` 完全分離
- ロール別権限:
  - **viewer**: 読取のみ
  - **user**: 自分の日報 CRUD
  - **manager**: チーム日報閲覧/承認/コメント
  - **admin**: 全操作 + org 設定

### 4.2 日報 CRUD & 承認

| 操作 | 権限            | Convex Function       |
| ---- | --------------- | --------------------- |
| 作成 | user 以上       | `createReport`        |
| 更新 | author or admin | `updateReport`        |
| 削除 | author or admin | `deleteReport (soft)` |
| 承認 | manager 以上    | `approveReport`       |

**Note**: Next.js App Router では API Routes を使用せず、Convex
mutations/queries を直接使用

### 4.3 コメント & AI

- `addComment` (user/system)
- `askAI` (Mastra QA) → system コメント保存
- `improveSuggestion` after approve → suggestion コメント

### 4.4 監査ログ

- 重要操作 (`approveReport`, `deleteReport`, role 変更) は `audit_logs`
  に自動 insert

### 4.5 バックアップ / DR

- Convex export → Cloudflare R2 へ 1 日 1 回 JSON スナップショット (RPO ≤24h)
- 復旧手順: export → import (RTO ≤4h)

### 4.6 国際化 (i18n)

- UI 文言を `react-i18next` で管理。初期は `ja`, `en` 提供

### 4.7 通知

- Expo Push (新規コメント・承認完了・AI 返信完了)

### 4.8 受け入れ基準 (DoD)

- 各ユーザーストーリーに E2E テストが通過
- ESLint/TypeScript エラーゼロ
- Lighthouse モバイル LCP 2.5s 以内
- Jest カバレッジ 80% 以上

---

## 5. 非機能要件

| カテゴリ             | 指標 / 要件                                                              |
| -------------------- | ------------------------------------------------------------------------ |
| **可用性**           | SLA 99.9%, Multi‑AZ (Convex)                                             |
| **性能**             | Web LCP ≤2.5s, CLS ≤0.1, API P95 ≤300 ms                                 |
| **DR**               | RPO ≤24h, RTO ≤4h                                                        |
| **セキュリティ**     | OWASP Top10 対策, Least Privilege ACL, HTTPS 強制                        |
| **監査**             | 全操作を `audit_logs`, 保存 1 年                                         |
| **コスト**           | 月額上限 ¥20,000。Convex/Cloudflare/Mastra 使用量を毎日集計し Slack 通知 |
| **法規制**           | GDPR & 日本個人情報保護法 (APPI) 準拠。30 日以内の削除要求対応           |
| **アクセシビリティ** | WCAG 2.1 AA (色コントラスト 4.5:1 など)                                  |

---

## 6. パフォーマンス & モニタリング

- **Web**: App Router RSC, Cloudflare Pages Edge キャッシュ, `next/image`
  で画像最適化, shadcn/ui コンポーネント最適化
- **Mobile**: NativeWind v4, bundle splitting, Hermes + RAM bundles,
  lucide-react-native アイコン最適化
- **状態管理**: useSWR 楽観的更新, nuqs URL状態管理, React Context 最小構成
- **モニタリング**: Sentry (error rate), Convex Observability (queries/sec),
  Core Web Vitals tracking
- **CI/CD**: Lighthouse CI + React Native Performance plugin,
  demo/ 手動テストページ

---

## 7. CI/CD & 開発フロー

| 項目         | 内容                                                               |
| ------------ | ------------------------------------------------------------------ |
| ブランチ戦略 | Trunk‑based; `main` 保護、Feature ブランチ PR                      |
| CI           | GitHub Actions (`lint`, `typecheck`, `unit`, `e2e`, `lighthouse`)  |
| CD           | Cloudflare Pages Preview → Prod, Convex `deploy`, EAS Build/Update |
| コード規約   | Conventional Commits, Prettier auto‑format                         |
| コスト監視   | `scripts/cost-report.ts` → Cron in GitHub Actions → Slack 通知     |

---

## 8. リスク & 対策

| リスク               | 対策                                               |
| -------------------- | -------------------------------------------------- |
| Mastra API 遅延/障害 | Retry ×3, 30 s フォールバックで空 summary, UI 通知 |
| Convex 書込競合      | Optimistic UI + Server merge, nightly diff test    |
| 大量 Push 通知スパム | Throttle 15 min per user per report                |
| 法規制変更           | 年 1 回コンプライアンスレビュー                    |

---

## 9. マイルストーン (Fast MVP)

| フェーズ             | 完了条件                                    |
| -------------------- | ------------------------------------------- |
| **M0** 要件確定      | 本書レビュー承認                            |
| **M1** 基盤構築      | Auth & RLS 動作、Schema deploy 成功         |
| **M2** CRUD 完成     | 日報作成→承認→コメント E2E テスト通過       |
| **M3** AI 統合       | 要約・AskAI 機能稼働、fallback 動作確認     |
| **M4** QA & リリース | SLA/SLO 計測合格、App Store / Prod デプロイ |

---

> **備考** : 本改訂版は実装チェックリスト rev.
> FINAL と完全対応しつつ、長期運用に必要な非機能・リスクを補強しました。追加の要望があれば随時アップデートします。
