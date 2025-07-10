/**
 * @fileoverview 個人ダッシュボードの統計機能
 *
 * @description 個人ダッシュボード表示用の統計情報を集計するクエリを提供します。
 *
 * @since 2.0.0
 */
import { calculateBreakTimeInMinutes } from '@smartnippo/lib';
import { v } from 'convex/values';
import { query } from '../_generated/server';
import { requireAuthentication } from '../auth/auth';

/**
 * 勤務時間を分単位で計算するヘルパー関数
 */
const calculateTotalMinutes = (wh: {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
}) => {
  const start = wh.startHour * 60 + wh.startMinute;
  const end = wh.endHour * 60 + wh.endMinute;
  return end > start ? end - start : 0;
};

/**
 * 個人ダッシュボード用データの取得
 *
 * @description ログインユーザーのダッシュボードに必要なデータをまとめて取得します。
 * - 今月の統計サマリー
 * - 直近30日間の活動推移（提出状況）
 * - 直近30日間の業務時間推移
 * - 最近の日報（最大5件）
 *
 * @query
 * @returns {Promise<object>} ダッシュボード用データのオブジェクト
 * @throws {Error} 認証失敗時
 */
export const getMyDashboardData = query({
  args: {
    days: v.optional(v.number()),
  },
  handler: async (ctx, { days = 30 }) => {
    const user = await requireAuthentication(ctx);
    const userId = user._id;

    // --- 1. 必要な期間の定義 ---
    const today = new Date();
    const targetDate = new Date();
    targetDate.setDate(today.getDate() - days);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // --- 2. ユーザーの直近[days]日分の日報を一括取得 ---
    const reports = await ctx.db
      .query('reports')
      .withIndex('by_author_date', (q) =>
        q.eq('authorId', userId).gte('reportDate', targetDate.toISOString().split('T')[0])
      )
      .filter((q) => q.eq(q.field('isDeleted'), false))
      .order('desc')
      .collect();

    // --- 3. 統計データの集計 ---
    const stats = {
      reportsThisMonth: 0,
      approvedThisMonth: 0,
      pendingApproval: 0,
      drafts: 0,
    };

    const monthlyReports = reports.filter((r) => new Date(r.reportDate) >= firstDayOfMonth);

    monthlyReports.forEach((report) => {
      stats.reportsThisMonth++;
      if (report.status === 'approved') {
        stats.approvedThisMonth++;
      }
    });

    // 全期間（30日内）でのステータス集計
    reports.forEach((report) => {
      if (report.status === 'submitted') {
        stats.pendingApproval++;
      }
      if (report.status === 'draft') {
        stats.drafts++;
      }
    });

    // --- 4. チャート用データの生成 ---
    const activityTrend: { date: string; submitted: number }[] = [];
    const workingHoursTrend: { date: string; hours: number }[] = [];
    const dailyData = new Map<string, { submitted: boolean; totalMinutes: number }>();

    reports.forEach((report) => {
      const dateStr = report.reportDate;
      const existing = dailyData.get(dateStr) ?? { submitted: false, totalMinutes: 0 };
      existing.submitted = true;
      if (report.workingHours) {
        const duration = calculateTotalMinutes(report.workingHours);
        const breakTime = calculateBreakTimeInMinutes(duration);
        existing.totalMinutes += duration - breakTime;
      }
      dailyData.set(dateStr, existing);
    });

    // 過去[days]日間の日付をループしてデータを埋める
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const [dateStr] = date.toISOString().split('T');

      const data = dailyData.get(dateStr);
      activityTrend.push({ date: dateStr, submitted: data?.submitted ? 1 : 0 });
      workingHoursTrend.push({
        date: dateStr,
        hours: data ? parseFloat((data.totalMinutes / 60).toFixed(2)) : 0,
      });
    }

    // --- 5. 累積時間の計算 ---
    const ascendingWorkingHours = workingHoursTrend.slice().reverse();
    const cumulativeWorkingHoursTrend: { date: string; cumulativeHours: number }[] = [];
    let cumulativeSum = 0;
    for (const day of ascendingWorkingHours) {
      cumulativeSum += day.hours;
      cumulativeWorkingHoursTrend.push({
        date: day.date,
        cumulativeHours: parseFloat(cumulativeSum.toFixed(2)),
      });
    }

    // --- 6. 最近の日報リスト ---
    const recentReports = reports.slice(0, 5).map((r) => ({
      _id: r._id,
      title: r.title,
      status: r.status,
      reportDate: r.reportDate,
    }));

    // --- 7. 結果を返す ---
    return {
      stats,
      activityTrend: activityTrend.reverse(),
      workingHoursTrend: ascendingWorkingHours,
      cumulativeWorkingHoursTrend,
      recentReports,
    };
  },
});
