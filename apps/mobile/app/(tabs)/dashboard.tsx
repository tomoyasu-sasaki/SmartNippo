import { useUser } from '@clerk/clerk-expo';
import { DASHBOARD_CONSTANTS } from '@smartnippo/lib';
import { api } from 'convex/_generated/api';
import { useMutation, useQuery } from 'convex/react';
import { useEffect } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native';
import { LocaleConfig } from 'react-native-calendars';
import {
  ActivityCalendarSection,
  CumulativeHoursChart,
  DashboardHeader,
  RecentReportsSection,
  StatsSection,
  WorkingHoursChart,
} from '../../components/features/dashboard';

// カレンダーの日本語設定
LocaleConfig.locales['ja'] = {
  monthNames: [
    '1月',
    '2月',
    '3月',
    '4月',
    '5月',
    '6月',
    '7月',
    '8月',
    '9月',
    '10月',
    '11月',
    '12月',
  ],
  monthNamesShort: [
    '1月',
    '2月',
    '3月',
    '4月',
    '5月',
    '6月',
    '7月',
    '8月',
    '9月',
    '10月',
    '11月',
    '12月',
  ],
  dayNames: ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'],
  dayNamesShort: ['日', '月', '火', '水', '木', '金', '土'],
  today: '今日',
};
LocaleConfig.defaultLocale = 'ja';

export default function DashboardScreen() {
  const { user, isLoaded } = useUser();
  const storeUser = useMutation(api.index.store);
  const dashboardData = useQuery(api.reports.dashboard.getMyDashboardData, { days: 30 });

  // ユーザー情報を同期
  useEffect(() => {
    if (isLoaded && user) {
      const syncUser = async () => {
        try {
          await storeUser();
        } catch {
          if (__DEV__) {
            Alert.alert('Error', DASHBOARD_CONSTANTS.ALERTS.USER_SYNC_ERROR);
          }
        }
      };
      syncUser();
    }
  }, [isLoaded, user, storeUser]);

  if (!isLoaded || dashboardData === undefined) {
    return (
      <View className='flex-1 items-center justify-center bg-gray-50'>
        <ActivityIndicator size='large' color='#3B82F6' />
        <Text className='mt-4 text-gray-600'>{DASHBOARD_CONSTANTS.LOADING_TEXT}</Text>
        <Text className='mt-1 text-sm text-gray-500'>過去30日分のデータを読み込み中...</Text>
      </View>
    );
  }

  if (!user || dashboardData === null) {
    return (
      <View className='flex-1 items-center justify-center bg-gray-50'>
        <Text className='text-red-600'>{DASHBOARD_CONSTANTS.ERROR_TEXT}</Text>
      </View>
    );
  }

  const { stats, activityTrend, workingHoursTrend, recentReports, cumulativeWorkingHoursTrend } =
    dashboardData;

  return (
    <ScrollView className='flex-1 bg-gray-50'>
      <View className='p-4'>
        <DashboardHeader />
        <StatsSection stats={stats} />
        <RecentReportsSection reports={recentReports} />
        <WorkingHoursChart data={workingHoursTrend} />
        <CumulativeHoursChart data={cumulativeWorkingHoursTrend} />
        <ActivityCalendarSection data={activityTrend} />
      </View>
    </ScrollView>
  );
}
