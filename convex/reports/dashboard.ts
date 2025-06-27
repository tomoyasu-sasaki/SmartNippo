/**
 * @fileoverview ダッシュボード統計機能
 *
 * @description ダッシュボード表示用の統計情報を集計するクエリを提供します。
 * 直近30日間の日報提出状況と承認状況を日別に集計し、グラフ表示用のデータソースとして利用されます。
 *
 * @since 1.0.0
 */

import { query } from '../_generated/server';
import { requireAuthentication } from '../auth/auth';

/**
 * ダッシュボード統計データの構造
 *
 * @description 日別の提出数と承認数を格納するインターフェース。
 * グラフ表示ライブラリで利用しやすい形式になっています。
 *
 * @interface
 * @since 1.0.0
 */
interface DashboardStatsData {
  /** 日付 (YYYY-MM-DD形式) */
  date: string;
  /** 提出済み日報数 */
  submitted: number;
  /** 承認済み日報数 */
  approved: number;
}

/**
 * ダッシュボード用統計情報の取得
 *
 * @description 直近30日間の日報提出状況と承認状況を日別に集計します。
 * 組織メンバーであれば誰でも閲覧可能です。データが存在しない日付は0埋めされ、
 * 連続した30日分のデータセットを返します。
 *
 * @query
 * @returns {Promise<DashboardStatsData[]>} 30日分の日別統計データの配列
 * @throws {Error} 認証失敗またはユーザーが組織に所属していない場合
 * @example
 * ```typescript
 * const stats = await getDashboardStats();
 * // stats は30日分の DashboardStatsData 配列
 * stats.forEach(day => {
 *   console.log(`${day.date}: Submitted ${day.submitted}, Approved ${day.approved}`);
 * });
 * ```
 * @since 1.0.0
 */
export const getDashboardStats = query({
  args: {},
  handler: async (ctx): Promise<DashboardStatsData[]> => {
    const user = await requireAuthentication(ctx);
    if (!user.orgId) {
      // 組織がまだない場合は空の統計データを返す
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      const filledResult: DashboardStatsData[] = [];
      const currentDate = new Date(thirtyDaysAgo);
      while (currentDate <= today) {
        const [dateStr] = currentDate.toISOString().split('T');
        filledResult.push({ date: dateStr, submitted: 0, approved: 0 });
        currentDate.setDate(currentDate.getDate() + 1);
      }
      return filledResult;
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoTimestamp = thirtyDaysAgo.getTime();
    const { orgId } = user;

    const reports = await ctx.db
      .query('reports')
      .withIndex('by_org_created_status', (q) => q.eq('orgId', orgId))
      .filter((q) => q.gt(q.field('created_at'), thirtyDaysAgoTimestamp))
      .filter((q) => q.eq(q.field('isDeleted'), false))
      .order('asc')
      .collect();

    // 日付ごとに集計
    const statsByDate = new Map<string, { submitted: number; approved: number }>();

    reports.forEach((report) => {
      const dateStr = report.reportDate;
      if (!statsByDate.has(dateStr)) {
        statsByDate.set(dateStr, { submitted: 0, approved: 0 });
      }
      const stats = statsByDate.get(dateStr) ?? { submitted: 0, approved: 0 };
      if (report.status === 'submitted' || report.status === 'approved') {
        stats.submitted++;
      }
      if (report.status === 'approved') {
        stats.approved++;
      }
    });

    // 結果を配列に変換
    const result: DashboardStatsData[] = Array.from(statsByDate.entries())
      .map(([date, stats]) => ({
        date,
        submitted: stats.submitted,
        approved: stats.approved,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 30日分の連続したデータを生成（データがない日も0で埋める）
    const filledResult: DashboardStatsData[] = [];
    const currentDate = new Date(thirtyDaysAgo);
    const today = new Date();

    while (currentDate <= today) {
      const [dateStr] = currentDate.toISOString().split('T');
      const existing = result.find((r) => r.date === dateStr);
      filledResult.push(
        existing ?? {
          date: dateStr,
          submitted: 0,
          approved: 0,
        }
      );
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return filledResult;
  },
});
