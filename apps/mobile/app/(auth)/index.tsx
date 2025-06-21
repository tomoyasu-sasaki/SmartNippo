import { Text, View } from 'react-native';

export default function AuthScreen() {
  return (
    <View className='flex-1 items-center justify-center bg-green-50 p-4'>
      <Text className='text-xl font-bold text-green-800 mb-2'>Authentication Screen</Text>
      <Text className='text-base text-green-600 text-center'>
        Login and signup functionality will be implemented here
      </Text>
    </View>
  );
}
