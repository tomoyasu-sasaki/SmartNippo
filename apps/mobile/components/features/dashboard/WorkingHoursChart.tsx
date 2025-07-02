import { format, parseISO } from 'date-fns';
import { BarChart3 } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

export function WorkingHoursChart({ data }: { data: any[] }) {
  const chartData = data.map((item) => ({
    value: item.hours,
    label: format(parseISO(item.date), 'M/d'),
  }));

  return (
    <View className='bg-white rounded-lg p-4 mb-6'>
      <View className='flex-row items-center mb-3'>
        <BarChart3 size={20} color='#3B82F6' />
        <Text className='text-lg font-semibold text-gray-900 ml-2'>業務時間の推移</Text>
      </View>
      <Text className='text-sm text-gray-600 mb-4'>過去30日間の日別業務時間</Text>
      <BarChart
        data={chartData}
        barWidth={30}
        barBorderRadius={4}
        frontColor='#3B82F6'
        yAxisThickness={0}
        xAxisThickness={0}
        hideRules
        height={150}
        width={280}
        spacing={6}
        noOfSections={5}
        yAxisTextStyle={{ color: '#6B7280', fontSize: 9 }}
        xAxisLabelTextStyle={{ color: '#6B7280', fontSize: 9 }}
      />
    </View>
  );
}
