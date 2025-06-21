import { Link } from 'expo-router';
import { Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View className='flex-1 items-center justify-center bg-white p-4'>
      <Text className='text-2xl font-bold text-blue-600 mb-4'>SmartNippo Mobile</Text>
      <Text className='text-base text-gray-600 text-center mb-8'>
        Expo Router + NativeWind + Convex Integration
      </Text>

      <View className='space-y-4'>
        <Link href='/(tabs)' asChild>
          <Text className='bg-blue-500 text-white px-6 py-3 rounded-lg text-center font-semibold'>
            Go to Tabs
          </Text>
        </Link>

        <Link href='/(auth)' asChild>
          <Text className='bg-green-500 text-white px-6 py-3 rounded-lg text-center font-semibold'>
            Go to Auth
          </Text>
        </Link>
      </View>
    </View>
  );
}
