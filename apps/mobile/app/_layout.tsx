import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { Stack } from 'expo-router';
import '../global.css';

// Convex URLの設定 - 実際のデプロイメントURLを使用
const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL ?? 'https://rapid-tapir-749.convex.cloud';
const convex = new ConvexReactClient(convexUrl);
const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <ConvexProvider client={convex}>
      <QueryClientProvider client={queryClient}>
        <Stack>
          <Stack.Screen name='index' options={{ title: 'Home' }} />
          <Stack.Screen name='(tabs)' options={{ headerShown: false }} />
          <Stack.Screen name='(auth)' options={{ headerShown: false }} />
        </Stack>
      </QueryClientProvider>
    </ConvexProvider>
  );
}
