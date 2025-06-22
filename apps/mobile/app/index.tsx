import { useUser } from '@clerk/clerk-expo';
import { Redirect } from 'expo-router';
import { View, Text, ActivityIndicator } from 'react-native';

export default function HomeScreen() {
  const { user, isLoaded } = useUser();

  // 認証状態の読み込み中
  if (!isLoaded) {
  return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-gray-600 mt-4">Loading...</Text>
    </View>
  );
  }

  // 認証済みの場合は Tab ナビゲーションへ
  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  // 未認証の場合は認証画面へ
  return <Redirect href="/(auth)" />;
}
