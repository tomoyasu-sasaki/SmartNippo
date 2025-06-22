// Jest setup for React Native
// react-native-gesture-handler removed as it's not needed for this project

// Mock react-native modules
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Platform: {
      ...RN.Platform,
      OS: 'ios',
      select: jest.fn((obj) => obj.ios),
    },
  };
});

// Mock Expo modules
jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
    push: jest.fn(),
    back: jest.fn(),
  },
  Redirect: jest.fn(),
  Stack: jest.fn(),
  Tabs: jest.fn(),
}));

// Mock Clerk
jest.mock('@clerk/clerk-expo', () => ({
  useUser: jest.fn(() => ({
    user: null,
    isLoaded: true,
  })),
  useSignIn: jest.fn(() => ({
    signIn: {
      create: jest.fn(),
    },
    setActive: jest.fn(),
    isLoaded: true,
  })),
  useSignUp: jest.fn(() => ({
    signUp: {
      create: jest.fn(),
      prepareEmailAddressVerification: jest.fn(),
    },
    setActive: jest.fn(),
    isLoaded: true,
  })),
  useOAuth: jest.fn(() => ({
    startOAuthFlow: jest.fn(),
  })),
  useClerk: jest.fn(() => ({
    signOut: jest.fn(),
  })),
  ClerkProvider: jest.fn(({ children }) => children),
}));

// Mock Convex
jest.mock('convex/react', () => ({
  useMutation: jest.fn(() => jest.fn()),
  useQuery: jest.fn(() => null),
}));

jest.mock('convex/react-clerk', () => ({
  ConvexProviderWithClerk: jest.fn(({ children }) => children),
}));

// Global test environment setup
global.__DEV__ = true;
