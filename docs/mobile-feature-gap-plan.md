---
title: 'Mobile 日報機能ギャップ解消 実装計画'
created: '2025-07-02'
author: 'AI Planning Assistant'
summary: |
  Web ⇔ Mobile の機能差分を解消し、Mobile アプリを Web と同等機能に引き上げるためのフェーズ別タスク一覧。
  各セクションは 10 項目のチェックリスト形式で記載。
tech_stack:
  - React Native (Expo SDK)
  - Next.js (App Router)
  - Convex 1.x
  - TypeScript 5.x
  - Tailwind CSS / Nativewind
  - pnpm Monorepo (Turbo)
constraints:
  absolute_prohibitions:
    - git_operations
    - version_changes
    - architecture_changes
    - breaking_changes
  approval_required:
    - technical_decisions
    - unexpected_issues
    - new_dependencies
    - security_changes
  quality_standards:
    - code_consistency
    - directory_structure
    - naming_conventions
    - error_handling
    - documentation
    - testing
---

## Phase 1 – 必須機能 (Must-Have)

### Section 1 – メインプロジェクト選択 UI 追加

- [x] React Native `react-native-picker-select`
      を利用したメインプロジェクト入力欄を **BasicInfoStep** に追加し
      `projectId` を `formData` に保持する
- [x] `create.tsx` / `edit.tsx` で Convex 送信時に `projectId`
      を必須としてバリデーションエラーを表示
- [x] Initial 値に空文字ではなく **未選択**
      状態を明示し、選択後のみ次ステップ遷移可に変更
- [x] Convex `saveReportWithWorkItems` で `projectId`
      が渡らない場合のサーバ側 validation 追加（fail-safe）
- [x] UI テストを Expo Go で実機確認（iOS/Android）
- [x] AccessibilityLabel を付与し VoiceOver 対応
- [x] i18n 定数を `REPORTS_CONSTANTS` へ追加しハードコード排除
- [x] 実装の冗長・整合性確認
- [x] pnpm lintの実行と発生した警告とエラーの修正
- [x] 実装漏れチェック

### Section 2 – Manager/Admin 自レポート承認可ロジック

- [x] `handleApprove` / `handleReject` 権限制御を `canModerate` → Web と同じ
      `canTakeAction` 判定式に置換
- [x] 承認・差戻しボタンの表示条件を更新しユニットテスト追加（role+owner 組み合わせ）
- [x] API 連携 (`approveReport`,
      `rejectReport`) のエラーハンドリング強化（permission message）
- [x] UI 表示文言を `REPORTS_CONSTANTS` 経由に統一
- [x] role 取得のキャッシュ問題を確認、再取得フローを追加
- [x] Storybook(モバイル)で各ロール状態を再現
- [x] QA シナリオ（Admin 自レポート承認）を Notion に記載
- [x] 実装の冗長・整合性確認
- [x] pnpm lintの実行と発生した警告とエラーの修正
- [x] 実装漏れチェック

### Section 3 – 承認履歴 UI (rejected / pending 対応)

- [x] `ReportDetailScreen` の approvals map 内で status 別アイコン&色&文言を分岐
- [x] `AlertCircle`(黄) と `Hourglass`(灰) アイコンをデザインガイドに沿って導入
- [x] `REPORTS_CONSTANTS.MOBILE_DETAIL_SCREEN.APPROVAL_HISTORY`
      に各 status 用ラベルを追加
- [x] レイアウト崩れ防止のため Flex 行揃えを調整
- [x] 過去承認件数 100+ でもスクロール可能にする (ScrollView or SectionList)
- [x] 単体テストで `status="rejected"` の snapshot 追加
- [x] DarkMode 表示確認
- [x] 実装の冗長・整合性確認
- [x] pnpm lintの実行と発生した警告とエラーの修正
- [x] 実装漏れチェック

### Section 4 – Dashboard API days=30 対応

- [x] `DashboardScreen` の
      `useQuery(api.reports.dashboard.getMyDashboardData, { days: 7 })`
      を 30 に変更
- [x] WorkingHoursChart / CumulativeHoursChart の `width/spacing`
      を 30 データ対応にリサイズ
- [x] ActivityCalendarSection の `markedDates` ソースを 30 日分に拡張
- [x] Loading/Skeleton 表示時間をパフォーマンス計測し必要なら Suspense 導入
- [x] ライブラリ `react-native-gifted-charts` の max
      datapoint 確認とパフォーマンス検証
- [x] 日付フォーマット `M/d` → 30 日時系列で重複しないよう工夫 (e.g., 6/1, 6/5,
      …)
- [x] QA: iPhone 8 / Android 小画面で横スクロール不要なことを確認
- [x] 実装の冗長・整合性確認
- [x] pnpm lintの実行と発生した警告とエラーの修正
- [x] 実装漏れチェック

## Phase 2 – 推奨機能 (Should-Have)

### Section 5 – Draft / Submit 切替 UI

- [ ] 最終ステップに「下書き保存」ボタンを追加し `status='draft'` 送信
- [ ] 既存「作成する」ボタンは `status='submitted'` に変更
- [ ] ボタン押下時のバリデーションメッセージ差異を `Toast` 表示
- [ ] 下書き保存成功後の遷移を Dashboard ではなく ReportDetail に変更検討
- [ ] Constants の i18n 文言追加
- [ ] E2E (Detox) で draft 保存→編集→送信フローを自動化
- [ ] ドラフト数を StatsSection の `drafts` と連動確認
- [ ] 実装の冗長・整合性確認
- [ ] pnpm lintの実行と発生した警告とエラーの修正
- [ ] 実装漏れチェック

### Section 6 – Draft/Rejected レポート削除機能

- [ ] `ReportDetailScreen` に Delete アイコンを追加 (条件: owner &
      draft|rejected)
- [ ] `Alert` で確認ダイアログ実装し Cancel/OK パターンをテスト
- [ ] Convex `deleteReport` Mutation 呼び出し + 成功 Toast
- [ ] Dashboard RecentReportsSection から即時削除を確認 (react-query cache
      invalidate)
- [ ] Backend 権限制御 (owner or admin)
- [ ] iOS Swipe アクション追加検討 (低優先)
- [ ] ユニットテスト: draft/rejected/approved パスでボタン非表示を確認
- [ ] 実装の冗長・整合性確認
- [ ] pnpm lintの実行と発生した警告とエラーの修正
- [ ] 実装漏れチェック

### Section 7 – CumulativeHoursChart 30 日整合性

- [ ] `CumulativeHoursChart` のデータソースを 30 日分に更新
- [ ] xAxis ラベル密度を自動計算し視認性確保
- [ ] 線グラフ色・グラデーションを Web と一致させる (design token)
- [ ] バージョンアップで breaking 無いか `react-native-gifted-charts`
      の changelog 確認
- [ ] 型定義ファイルが無い場合 `d.ts` 追加
- [ ] Storybook で 5 / 15 / 30 日ケース snapshot
- [ ] パフォーマンス計測 (JS fps とメモリ)
- [ ] 実装の冗長・整合性確認
- [ ] pnpm lintの実行と発生した警告とエラーの修正
- [ ] 実装漏れチェック

### Section 8 – ActivityCalendar UI 文言 & UX

- [ ] カレンダーカードタイトル・説明を Web と同一日本語に揃える
- [ ] Legend 表示を追加 (提出有り / 無し)
- [ ] `react-native-calendars` theme を design tokens 化
- [ ] 30 日分ドット表示のパフォーマンス検証 & Debounce
- [ ] Accessibility: dot の代替テキスト (提出数) を付与
- [ ] iOS DarkMode で視認性確認
- [ ] QA シートにカレンダー操作項目を追加
- [ ] 実装の冗長・整合性確認
- [ ] pnpm lintの実行と発生した警告とエラーの修正
- [ ] 実装漏れチェック

## Phase 3 – Nice-to-Have (Could-Have)

### Section 9 – 競合解決ダイアログ実装

- [ ] `saveReport` エラー `conflict` 捕捉後、Modal を表示し上書き or 破棄を選択
- [ ] `pendingValues` 保持し UI 上で差分 Highlight
- [ ] 上書き時 `expectedUpdatedAt` を最新へ置換して再送
- [ ] 破棄時は最新データを再読込してフォーム更新
- [ ] UX 文言を Web と共通化
- [ ] UnitTest: conflict → overwrite / discard 両経路
- [ ] Hook `useReportConflict` を共通化し Web へも流用検証
- [ ] 実装の冗長・整合性確認
- [ ] pnpm lintの実行と発生した警告とエラーの修正
- [ ] 実装漏れチェック

### Section 10 – AI 要約カード表示

- [ ] `report.summary` が null で無い場合に Card を表示
- [ ] `LoadingSkeleton` を追加し fetch 状態を可視化
- [ ] 文字数オーバーフロー時に `numberOfLines` 制御
- [ ] Constants 文言(`AI_SUMMARY_TITLE` など)を再利用
- [ ] Server で要約生成失敗時 fallback 表示を Web と合わせる
- [ ] QA: summary=長文/短文/null ケース確認
- [ ] DarkMode テキストコントラストチェック
- [ ] 実装の冗長・整合性確認
- [ ] pnpm lintの実行と発生した警告とエラーの修正
- [ ] 実装漏れチェック

### Section 11 – UX 統一改善

- [ ] Toast メッセージの文言・色を Web と共通ファイルへ移動
- [ ] LoadingScreen と ActivityIndicator サイズ一貫性を確認
- [ ] 成功/失敗アニメーションを `react-native-reanimated` へ置換検討
- [ ] Vibration フィードバック(短) をアクション完了時に追加 (アクセシビリティ向上)
- [ ] ページ遷移時に `router.replace` へ統一し戻る履歴を最適化
- [ ] Crashlytics ログ追加でエラー捕捉率向上
- [ ] カラーパレット Token を `global.css` と共有
- [ ] 実装の冗長・整合性確認
- [ ] pnpm lintの実行と発生した警告とエラーの修正
- [ ] 実装漏れチェック
