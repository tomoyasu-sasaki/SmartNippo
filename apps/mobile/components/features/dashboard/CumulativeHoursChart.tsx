import { format, parseISO } from 'date-fns';
import { BarChart3 } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

export function CumulativeHoursChart({ data }: { data: any[] }) {
  // TODO: 30日表示にするとレイアウトが崩れるため、一時的に7日表示にしています。
  //レスポンシブなチャートライブラリを検討するか、表示方法の工夫が必要です。
  const chartData = data.map((item) => ({
    value: item.cumulativeHours,
    label: format(parseISO(item.date), 'M/d'),
  }));

  return (
    <View className='bg-white rounded-lg p-4 mb-6'>
      <View className='flex-row items-center mb-3'>
        <BarChart3 size={20} color='#3B82F6' />
        <Text className='text-lg font-semibold text-gray-900 ml-2'>累積業務時間</Text>
      </View>
      <Text className='text-sm text-gray-600 mb-4'>過去7日間の累積業務時間</Text>
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
        // width={280}
        spacing={45}
        noOfSections={5}
        yAxisTextStyle={{ color: '#6B7280', fontSize: 9 }}
        xAxisLabelTextStyle={{ color: '#6B7280', fontSize: 9 }}
        areaChart
      />
    </View>
  );
}
