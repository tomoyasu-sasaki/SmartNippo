import { Calendar as CalendarIcon } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { Calendar } from 'react-native-calendars';

// カレンダーのテーマ定数
const CALENDAR_THEME = {
  backgroundColor: '#ffffff',
  calendarBackground: '#ffffff',
  textSectionTitleColor: '#6B7280', // gray-500
  selectedDayBackgroundColor: '#3B82F6', // blue-500
  selectedDayTextColor: '#ffffff',
  todayTextColor: '#3B82F6', // blue-500
  dayTextColor: '#1F2937', // gray-900
  textDisabledColor: '#D1D5DB', // gray-300
  monthTextColor: '#1F2937', // gray-900
  textDayFontSize: 14,
  textMonthFontSize: 16,
  textDayHeaderFontSize: 12,
} as const;

interface ActivityData {
  date: string;
  submitted: number;
}

interface ActivityCalendarSectionProps {
  data: ActivityData[];
}

export function ActivityCalendarSection({ data }: ActivityCalendarSectionProps) {
  const markedDates = data.reduce(
    (acc, day) => {
      if (day.submitted > 0) {
        acc[day.date] = { marked: true, dotColor: '#3B82F6' };
      }
      return acc;
    },
    {} as Record<string, { marked: boolean; dotColor: string }>
  );

  return (
    <View className='bg-white rounded-lg p-4'>
      <View className='flex-row items-center mb-3'>
        <CalendarIcon size={20} color='#3B82F6' />
        <Text className='text-lg font-semibold text-gray-900 ml-2'>日報提出状況</Text>
      </View>
      <Text className='text-sm text-gray-600 mb-4'>過去30日間の提出記録</Text>
      <Calendar
        markedDates={markedDates}
        theme={CALENDAR_THEME}
        accessibilityLabel='日報提出カレンダー'
      />

      {/* 凡例 */}
      <View className='flex-row items-center justify-center mt-4 space-x-6'>
        <View className='flex-row items-center'>
          <View className='w-3 h-3 rounded-full bg-blue-500 mr-2' />
          <Text className='text-xs text-gray-600'>提出済み</Text>
        </View>
        <View className='flex-row items-center'>
          <View className='w-3 h-3 rounded-full bg-gray-200 mr-2' />
          <Text className='text-xs text-gray-600'>未提出</Text>
        </View>
      </View>
    </View>
  );
}
