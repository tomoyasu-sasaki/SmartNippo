import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import NetInfo from '@react-native-community/netinfo';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConvexReactClient } from 'convex/react';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { Stack } from 'expo-router';
import { StrictMode, useEffect, useMemo, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import '../global.css';

// Convex & Clerk URLs
const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL ?? 'https://rapid-tapir-749.convex.cloud';
const clerkPublishableKey =
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ??
  'pk_test_bmV1dHJhbC1tYXJtb3NldC0yNi5jbGVyay5hY2NvdW50cy5kZXYk';

// Create Convex client outside of component to avoid re-creation
const convex = new ConvexReactClient(convexUrl, {
  // Disable unsaved changes warning for React 19 compatibility
  unsavedChangesWarning: false,
});

// Network Status Component
function NetworkStatus() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = state.isConnected && state.isInternetReachable;

      if (!isInitialLoad && isConnected !== null) {
        if (connected && !isConnected) {
          // オンライン復帰
          Toast.show({
            type: 'success',
            text1: 'ネットワークに接続しました',
            text2: 'データを同期しています...',
            position: 'top',
            visibilityTime: 2000,
          });
        } else if (!connected && isConnected) {
          // オフライン状態
          Toast.show({
            type: 'info',
            text1: 'オフラインモード',
            text2: 'キャッシュからデータを表示しています',
            position: 'top',
            visibilityTime: 3000,
          });
        }
      }

      setIsConnected(connected);
      if (isInitialLoad) {
        setIsInitialLoad(false);
      }
    });

    return unsubscribe;
  }, [isConnected, isInitialLoad]);

  // オフライン時のバナー表示
  if (isConnected === false) {
    return (
      <View className='bg-orange-500 px-4 py-2'>
        <Text className='text-center text-sm font-medium text-white'>
          オフライン - キャッシュからデータを表示中
        </Text>
      </View>
    );
  }

  return null;
}

function RootLayoutContent() {
  // グローバルエラーハンドリング
  useEffect(() => {
    // JavaScript エラーをキャッチ
    const originalHandler = ErrorUtils.getGlobalHandler();

    ErrorUtils.setGlobalHandler((error, isFatal) => {
      console.error('Global Error:', error);

      if (isFatal) {
        Alert.alert(
          'アプリケーションエラー',
          '予期しないエラーが発生しました。アプリを再起動してください。',
          [
            {
              text: 'OK',
              onPress: () => {
                // アプリを再起動するか、初期画面に戻る
                // 実際の実装では適切な処理を行う
              },
            },
          ]
        );
      } else {
        // 非致命的エラーはトーストで通知
        Toast.show({
          type: 'error',
          text1: 'エラーが発生しました',
          text2: error.message || '不明なエラー',
          position: 'top',
          visibilityTime: 3000,
        });
      }

      // 元のハンドラーも呼び出す
      if (originalHandler) {
        originalHandler(error, isFatal);
      }
    });

    // クリーンアップ
    return () => {
      if (originalHandler) {
        ErrorUtils.setGlobalHandler(originalHandler);
      }
    };
  }, []);

  return (
    <>
      <NetworkStatus />
      <Stack>
        <Stack.Screen name='index' options={{ title: 'Home' }} />
        <Stack.Screen name='(tabs)' options={{ headerShown: false }} />
        <Stack.Screen name='(auth)' options={{ headerShown: false }} />
      </Stack>
      <Toast />
    </>
  );
}

export default function RootLayout() {
  // Create QueryClient using useMemo to avoid re-creation on each render
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: 2,
            // オフライン時もキャッシュからデータを表示
            networkMode: 'offlineFirst',
          },
          mutations: {
            // オフライン時はキューイング
            networkMode: 'offlineFirst',
          },
        },
      }),
    []
  );

  return (
    <StrictMode>
      <ClerkProvider publishableKey={clerkPublishableKey}>
        <QueryClientProvider client={queryClient}>
          <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
            <RootLayoutContent />
          </ConvexProviderWithClerk>
        </QueryClientProvider>
      </ClerkProvider>
    </StrictMode>
  );
}
