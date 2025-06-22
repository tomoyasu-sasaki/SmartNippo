import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { ConvexReactClient } from 'convex/react';
import { Stack } from 'expo-router';
import { useMemo, StrictMode } from 'react';
import '../global.css';

// Convex & Clerk URLs
const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL ?? 'https://rapid-tapir-749.convex.cloud';
const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? 'pk_test_bmV1dHJhbC1tYXJtb3NldC0yNi5jbGVyay5hY2NvdW50cy5kZXYk';

// Create Convex client outside of component to avoid re-creation
const convex = new ConvexReactClient(convexUrl, {
  // Disable unsaved changes warning for React 19 compatibility
  unsavedChangesWarning: false,
});

function RootLayoutContent() {
  return (
        <Stack>
          <Stack.Screen name='index' options={{ title: 'Home' }} />
          <Stack.Screen name='(tabs)' options={{ headerShown: false }} />
          <Stack.Screen name='(auth)' options={{ headerShown: false }} />
        </Stack>
  );
}

export default function RootLayout() {
  // Create QueryClient using useMemo to avoid re-creation on each render
  const queryClient = useMemo(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        retry: 2,
      },
    },
  }), []);

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
