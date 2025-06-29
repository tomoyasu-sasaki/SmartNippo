import { ActivityIndicator, Text, View } from 'react-native';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
  return (
    <View className='flex-1 items-center justify-center bg-white'>
      <ActivityIndicator size='large' color='#3B82F6' />
      <Text className='text-gray-600 mt-4'>{message}</Text>
    </View>
  );
}
