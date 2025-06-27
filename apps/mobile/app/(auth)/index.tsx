import { useOAuth, useSignIn, useSignUp } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { AUTH_CONSTANTS } from '../../constants/auth';

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
      Alert.alert('Error', AUTH_CONSTANTS.ERRORS.REQUIRED_FIELDS);
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
          Alert.alert('Success', AUTH_CONSTANTS.SUCCESS.ACCOUNT_CREATED);
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
      const errorMessage =
        error &&
        typeof error === 'object' &&
        'errors' in error &&
        Array.isArray(error.errors) &&
        error.errors[0]?.message
          ? error.errors[0].message
          : AUTH_CONSTANTS.ERRORS.AUTH_FAILED;
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
      const errorMessage =
        error &&
        typeof error === 'object' &&
        'message' in error &&
        typeof error.message === 'string'
          ? error.message
          : AUTH_CONSTANTS.ERRORS.GOOGLE_AUTH_FAILED;
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className='flex-1 bg-white'>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className='flex-1 justify-center px-6 py-8'>
          <Text className='text-3xl font-bold text-center text-gray-900 mb-2'>
            {isSignUp ? AUTH_CONSTANTS.SCREEN_TITLES.SIGN_UP : AUTH_CONSTANTS.SCREEN_TITLES.SIGN_IN}
          </Text>
          <Text className='text-base text-center text-gray-600 mb-8'>
            {isSignUp ? AUTH_CONSTANTS.DESCRIPTIONS.SIGN_UP : AUTH_CONSTANTS.DESCRIPTIONS.SIGN_IN}
          </Text>

          <View className='space-y-4 mb-6'>
            <View>
              <Text className='text-sm font-medium text-gray-700 mb-2'>
                {AUTH_CONSTANTS.FORM_LABELS.EMAIL}
              </Text>
              <TextInput
                className='w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900'
                placeholder={AUTH_CONSTANTS.PLACEHOLDERS.EMAIL}
                value={email}
                onChangeText={setEmail}
                keyboardType='email-address'
                autoCapitalize='none'
                autoComplete='email'
                editable={!isLoading}
              />
            </View>

            <View>
              <Text className='text-sm font-medium text-gray-700 mb-2'>
                {AUTH_CONSTANTS.FORM_LABELS.PASSWORD}
              </Text>
              <TextInput
                className='w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900'
                placeholder={AUTH_CONSTANTS.PLACEHOLDERS.PASSWORD}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                editable={!isLoading}
              />
            </View>
          </View>

          <TouchableOpacity
            className={`w-full py-4 rounded-lg mb-4 ${isLoading ? 'bg-gray-400' : 'bg-blue-600'}`}
            onPress={handleEmailAuth}
            disabled={isLoading}
          >
            <Text className='text-white text-center font-semibold text-base'>
              {isLoading
                ? AUTH_CONSTANTS.BUTTONS.LOADING
                : isSignUp
                  ? AUTH_CONSTANTS.BUTTONS.SIGN_UP
                  : AUTH_CONSTANTS.BUTTONS.SIGN_IN}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`w-full py-4 border border-gray-300 rounded-lg mb-6 ${
              isLoading ? 'bg-gray-100' : 'bg-white'
            }`}
            onPress={handleGoogleAuth}
            disabled={isLoading}
          >
            <Text className='text-gray-700 text-center font-semibold text-base'>
              {AUTH_CONSTANTS.BUTTONS.GOOGLE_AUTH}
            </Text>
          </TouchableOpacity>

          <View className='flex-row justify-center'>
            <Text className='text-gray-600'>
              {isSignUp ? AUTH_CONSTANTS.LINKS.HAVE_ACCOUNT : AUTH_CONSTANTS.LINKS.NO_ACCOUNT}
            </Text>
            <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)} disabled={isLoading}>
              <Text className='text-blue-600 font-semibold'>
                {isSignUp ? AUTH_CONSTANTS.BUTTONS.SIGN_IN : AUTH_CONSTANTS.BUTTONS.SIGN_UP}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
