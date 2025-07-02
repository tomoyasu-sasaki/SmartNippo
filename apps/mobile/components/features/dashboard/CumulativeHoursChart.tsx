import { format, parseISO } from 'date-fns';
import { BarChart3 } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

interface CumulativeHoursData {
  date: string;
  cumulativeHours: number;
}

interface CumulativeHoursChartProps {
  data: CumulativeHoursData[];
}

export function CumulativeHoursChart({ data }: CumulativeHoursChartProps) {
  // 30日分のデータの場合、ラベルを間引いて表示
  const chartData = data.map((item, index) => ({
    value: item.cumulativeHours,
    // 5日ごとにラベルを表示（初日、5日、10日、15日、20日、25日、最終日）
    label:
      index === 0 || index === data.length - 1 || index % 5 === 0
        ? format(parseISO(item.date), 'M/d')
        : '',
  }));

  // 30日分のデータに合わせてspacingを調整
  const spacing = data.length > 7 ? 10 : 45;

  return (
    <View className='bg-white rounded-lg p-4 mb-6'>
      <View className='flex-row items-center mb-3'>
        <BarChart3 size={20} color='#3B82F6' />
        <Text className='text-lg font-semibold text-gray-900 ml-2'>累積業務時間</Text>
      </View>
      <Text className='text-sm text-gray-600 mb-4'>過去30日間の累積業務時間</Text>
      <LineChart
        data={chartData}
        color='#3B82F6'
        thickness={2}
        startFillColor='#3B82F6'
        endFillColor='#E0E7FF'
        startOpacity={0.3}
        endOpacity={0.1}
        initialSpacing={5}
        yAxisThickness={0}
        xAxisThickness={0}
        hideRules
        height={150}
        spacing={spacing}
        noOfSections={5}
        yAxisTextStyle={{ color: '#6B7280', fontSize: 9 }}
        xAxisLabelTextStyle={{ color: '#6B7280', fontSize: 9 }}
        areaChart
      />
    </View>
  );
}
