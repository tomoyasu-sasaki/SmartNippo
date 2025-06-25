import { Stack } from 'expo-router';

export default function ReportsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#3B82F6',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name='index'
        options={{
          title: '日報一覧',
          headerShown: false, // タブのヘッダーを使用するため
        }}
      />
      <Stack.Screen
        name='create'
        options={{
          title: '日報作成',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name='[id]'
        options={{
          title: '日報詳細',
        }}
      />
    </Stack>
  );
}
