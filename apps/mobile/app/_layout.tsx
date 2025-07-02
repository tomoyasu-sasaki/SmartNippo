import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConvexReactClient } from 'convex/react';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { Stack } from 'expo-router';
import { StrictMode, useMemo } from 'react';
import Toast from 'react-native-toast-message';
import { GlobalErrorHandler } from '../components/lib/global-error-handler';
import { NetworkStatus } from '../components/ui/network-status';
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

function RootLayoutContent() {
  return (
    <>
      <GlobalErrorHandler />
      <NetworkStatus />
      <Stack>
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
