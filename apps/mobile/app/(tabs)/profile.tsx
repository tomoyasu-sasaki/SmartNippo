import { Text, View } from 'react-native';

export default function ProfileScreen() {
  return (
    <View className='flex-1 items-center justify-center bg-blue-50 p-4'>
      <Text className='text-xl font-bold text-blue-800 mb-2'>Profile Screen</Text>
      <Text className='text-base text-blue-600 text-center'>
        User profile and settings will be here
      </Text>
    </View>
  );
}
