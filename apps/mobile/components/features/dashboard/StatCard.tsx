import type { Calendar as CalendarIcon } from 'lucide-react-native';
import { Text, View } from 'react-native';

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: typeof CalendarIcon;
  iconColor: string;
}) {
  return (
    <View className='bg-white p-4 rounded-lg border border-gray-200 flex-1 min-w-[45%] m-1'>
      <View className='flex-row justify-between items-start mb-2'>
        <Text className='text-sm text-gray-600'>{title}</Text>
        <Icon size={16} color={iconColor} />
      </View>
      <Text className='text-2xl font-bold text-gray-900'>{value}</Text>
      <Text className='text-xs text-gray-500 mt-1'>{subtitle}</Text>
    </View>
  );
}
