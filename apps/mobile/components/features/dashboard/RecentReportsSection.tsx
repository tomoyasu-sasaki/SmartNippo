import { REPORTS_CONSTANTS } from '@smartnippo/lib';
import { format, parseISO } from 'date-fns';
import { router } from 'expo-router';
import { Calendar as CalendarIcon } from 'lucide-react-native';
import { Text, TouchableOpacity, View } from 'react-native';

const getStatusBadge = (status: string) => {
  const statusInfo = REPORTS_CONSTANTS.STATUS[status as keyof typeof REPORTS_CONSTANTS.STATUS];
  const bgColors = {
    draft: 'bg-gray-100',
    submitted: 'bg-yellow-100',
    approved: 'bg-green-100',
    rejected: 'bg-yellow-100',
  };
  const textColors = {
    draft: 'text-gray-700',
    submitted: 'text-yellow-700',
    approved: 'text-green-700',
    rejected: 'text-yellow-700',
  };

  return (
    <View
      className={`px-2 py-1 rounded ${bgColors[status as keyof typeof bgColors] || 'bg-gray-100'}`}
    >
      <Text
        className={`text-xs ${textColors[status as keyof typeof textColors] || 'text-gray-700'}`}
      >
        {statusInfo?.label || '不明'}
      </Text>
    </View>
  );
};

export function RecentReportsSection({ reports }: { reports: any[] }) {
  return (
    <View className='bg-white rounded-lg p-4 mb-6'>
      <Text className='text-lg font-semibold text-gray-900 mb-3'>最近の日報</Text>
      {reports.length === 0 ? (
        <Text className='text-center text-gray-500 py-4'>最近の日報はありません。</Text>
      ) : (
        <View className='space-y-2'>
          {reports.map((report) => (
            <TouchableOpacity
              key={report._id}
              className='border-b border-gray-100 pb-3 mb-3 last:border-b-0 last:mb-0'
              onPress={() => router.push(`/reports/${report._id}`)}
            >
              <Text className='font-medium text-gray-900 mb-1'>{report.title}</Text>
              <View className='flex-row items-center justify-between'>
                <View className='flex-row items-center'>
                  <CalendarIcon size={12} color='#6B7280' />
                  <Text className='text-xs text-gray-600 ml-1'>
                    {format(parseISO(report.reportDate), 'M月d日')}
                  </Text>
                </View>
                {getStatusBadge(report.status)}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}
