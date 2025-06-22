import { useUser } from '@clerk/clerk-expo';
import { Redirect, Tabs } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';

export default function TabLayout() {
  const { user, isLoaded } = useUser();

  // 認証状態の読み込み中
  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  // 未認証の場合は認証画面へリダイレクト
  if (!user) {
    return <Redirect href="/(auth)" />;
  }

  return (
    <Tabs>
      <Tabs.Screen
        name='index'
        options={{
          title: 'Reports',
          tabBarIcon: ({ color }) => <TabBarIcon name='list' color={color} />,
        }}
      />
      <Tabs.Screen
        name='profile'
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <TabBarIcon name='user' color={color} />,
        }}
      />
    </Tabs>
  );
}

// Placeholder icon component
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function TabBarIcon({ name, color }: { name: string; color: string }) {
  return null; // Will be replaced with actual icons later
}
