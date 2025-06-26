import { useUser } from '@clerk/clerk-expo';
import { Redirect, Tabs } from 'expo-router';
import { FileText, Home, User } from 'lucide-react-native';
import { ActivityIndicator, View } from 'react-native';
import { LAYOUT_CONSTANTS } from '../../constants/layout';

export default function TabLayout() {
  const { user, isLoaded } = useUser();

  // 認証状態の読み込み中
  if (!isLoaded) {
    return (
      <View className='flex-1 items-center justify-center bg-white'>
        <ActivityIndicator size='large' color='#3B82F6' />
      </View>
    );
  }

  // 未認証の場合は認証画面へリダイレクト
  if (!user) {
    return <Redirect href='/(auth)' />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
        },
        headerStyle: {
          backgroundColor: '#3B82F6',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tabs.Screen
        name='index'
        options={{
          title: LAYOUT_CONSTANTS.TAB_TITLES.HOME,
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name='reports'
        options={{
          title: LAYOUT_CONSTANTS.TAB_TITLES.REPORTS,
          tabBarIcon: ({ color, size }) => <FileText size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name='profile'
        options={{
          title: LAYOUT_CONSTANTS.TAB_TITLES.PROFILE,
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
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
