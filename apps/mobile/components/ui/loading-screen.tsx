import { REPORTS_CONSTANTS } from '@smartnippo/lib';
import { ActivityIndicator, Text, View } from 'react-native';

interface LoadingScreenProps {
  message?: string;
  size?: 'small' | 'large';
  color?: string;
}

export function LoadingScreen({
  message = 'Loading...',
  size = REPORTS_CONSTANTS.LOADING_STANDARDS.SIZES.LARGE,
  color = REPORTS_CONSTANTS.LOADING_STANDARDS.COLORS.PRIMARY,
}: LoadingScreenProps) {
  return (
    <View className='flex-1 items-center justify-center bg-white'>
      <ActivityIndicator size={size} color={color} />
      <Text className='text-gray-600 mt-4'>{message}</Text>
    </View>
  );
}
