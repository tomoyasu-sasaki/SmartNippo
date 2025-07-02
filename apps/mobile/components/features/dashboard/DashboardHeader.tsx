import { DASHBOARD_CONSTANTS } from '@smartnippo/lib';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { router } from 'expo-router';
import { FileText } from 'lucide-react-native';
import { Text, TouchableOpacity, View } from 'react-native';

export function DashboardHeader() {
  return (
    <>
      <View className='mb-6'>
        <Text className='text-2xl font-bold text-gray-900'>{DASHBOARD_CONSTANTS.PAGE_TITLE}</Text>
        <Text className='text-gray-600 mt-1'>
          {format(new Date(), 'yyyy年M月d日 (E)', { locale: ja })}
        </Text>
      </View>
      <TouchableOpacity
        className='bg-blue-600 py-3 px-4 rounded-lg mb-6'
        onPress={() => router.push('/reports/create')}
      >
        <View className='flex-row items-center justify-center'>
          <FileText size={20} color='white' />
          <Text className='text-white font-semibold ml-2'>
            {DASHBOARD_CONSTANTS.CREATE_REPORT_BUTTON}
          </Text>
        </View>
      </TouchableOpacity>
    </>
  );
}
