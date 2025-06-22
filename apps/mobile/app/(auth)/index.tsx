import { useSignIn, useSignUp, useOAuth } from '@clerk/clerk-expo';
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { router } from 'expo-router';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { signIn, setActive: setActiveSignIn, isLoaded: isSignInLoaded } = useSignIn();
  const { signUp, setActive: setActiveSignUp, isLoaded: isSignUpLoaded } = useSignUp();
  const { startOAuthFlow: startGoogleFlow } = useOAuth({ strategy: 'oauth_google' });

  const handleEmailAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      if (isSignUp) {
        if (!isSignUpLoaded) {
          return;
        }

        const result = await signUp?.create({
          emailAddress: email,
          password,
        });

        if (result?.status === 'complete') {
          await setActiveSignUp({ session: result.createdSessionId });
          router.replace('/(tabs)');
        } else {
          Alert.alert('Success', 'Account created! Please check your email for verification.');
        }
      } else {
        if (!isSignInLoaded) {
          return;
        }

        const result = await signIn?.create({
          identifier: email,
          password,
        });

        if (result?.status === 'complete') {
          await setActiveSignIn({ session: result.createdSessionId });
          router.replace('/(tabs)');
        }
      }
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'errors' in error && Array.isArray(error.errors) && error.errors[0]?.message
        ? error.errors[0].message
        : 'Authentication failed';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    try {
      const { createdSessionId, setActive } = await startGoogleFlow();

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace('/(tabs)');
      }
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
        ? error.message
        : 'Google authentication failed';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 justify-center px-6 py-8">
          <Text className="text-3xl font-bold text-center text-gray-900 mb-2">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </Text>
          <Text className="text-base text-center text-gray-600 mb-8">
            {isSignUp
              ? 'Sign up to start managing your daily reports'
              : 'Sign in to your account'
            }
          </Text>

          <View className="space-y-4 mb-6">
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Email</Text>
              <TextInput
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900"
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!isLoading}
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Password</Text>
              <TextInput
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                editable={!isLoading}
              />
            </View>
          </View>

          <TouchableOpacity
            className={`w-full py-4 rounded-lg mb-4 ${
              isLoading ? 'bg-gray-400' : 'bg-blue-600'
            }`}
            onPress={handleEmailAuth}
            disabled={isLoading}
          >
            <Text className="text-white text-center font-semibold text-base">
              {isLoading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`w-full py-4 border border-gray-300 rounded-lg mb-6 ${
              isLoading ? 'bg-gray-100' : 'bg-white'
            }`}
            onPress={handleGoogleAuth}
            disabled={isLoading}
          >
            <Text className="text-gray-700 text-center font-semibold text-base">
              Continue with Google
            </Text>
          </TouchableOpacity>

          <View className="flex-row justify-center">
            <Text className="text-gray-600">
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            </Text>
            <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)} disabled={isLoading}>
              <Text className="text-blue-600 font-semibold">
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
