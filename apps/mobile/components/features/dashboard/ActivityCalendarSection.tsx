import { Calendar as CalendarIcon } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { Calendar } from 'react-native-calendars';

export function ActivityCalendarSection({ data }: { data: any[] }) {
  const markedDates = data.reduce(
    (acc, day) => {
      if (day.submitted > 0) {
        acc[day.date] = { marked: true, dotColor: '#3B82F6' };
      }
      return acc;
    },
    {} as Record<string, any>
  );

  return (
    <View className='bg-white rounded-lg p-4'>
      <View className='flex-row items-center mb-3'>
        <CalendarIcon size={20} color='#3B82F6' />
        <Text className='text-lg font-semibold text-gray-900 ml-2'>日報提出状況</Text>
      </View>
      <Text className='text-sm text-gray-600 mb-4'>日報を提出した日に青い点が表示されます</Text>
      <Calendar
        markedDates={markedDates}
        theme={{
          backgroundColor: '#ffffff',
          calendarBackground: '#ffffff',
          textSectionTitleColor: '#6B7280',
          selectedDayBackgroundColor: '#3B82F6',
          selectedDayTextColor: '#ffffff',
          todayTextColor: '#3B82F6',
          dayTextColor: '#1F2937',
          textDisabledColor: '#D1D5DB',
          monthTextColor: '#1F2937',
          textDayFontSize: 14,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 12,
        }}
      />
    </View>
  );
}
