import { useUser } from '@clerk/clerk-expo';
import { DASHBOARD_CONSTANTS } from '@smartnippo/lib';
import { api } from 'convex/_generated/api';
import { useMutation, useQuery } from 'convex/react';
import { useEffect } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';

export default function ReportsScreen() {
  const { user, isLoaded } = useUser();
  const storeUser = useMutation(api.index.store);
  const currentUser = useQuery(api.index.current);

  // ユーザー情報を同期
  useEffect(() => {
    if (isLoaded && user) {
      const syncUser = async () => {
        try {
          await storeUser();
        } catch {
          // エラーログは開発時のみ、本番では適切なエラーレポートサービスに送信
          if (__DEV__) {
            Alert.alert('Error', DASHBOARD_CONSTANTS.ALERTS.USER_SYNC_ERROR);
          }
        }
      };

      syncUser();
    }
  }, [isLoaded, user, storeUser]);

  if (!isLoaded) {
    return (
      <View className='flex-1 items-center justify-center bg-white'>
        <Text className='text-gray-600'>{DASHBOARD_CONSTANTS.LOADING_TEXT}</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View className='flex-1 items-center justify-center bg-white'>
        <Text className='text-red-600'>{DASHBOARD_CONSTANTS.ERROR_TEXT}</Text>
      </View>
    );
  }

  return (
    <View className='flex-1 bg-white p-4'>
      <Text className='text-2xl font-bold text-gray-900 mb-4'>
        {DASHBOARD_CONSTANTS.SCREEN_TITLE}
      </Text>

      {currentUser && (
        <View className='bg-gray-50 p-4 rounded-lg mb-6'>
          <Text className='text-sm text-gray-600 mb-1'>
            {DASHBOARD_CONSTANTS.WELCOME_SECTION.WELCOME_TEXT}
          </Text>
          <Text className='text-lg font-semibold text-gray-900'>{currentUser.name}</Text>
          <Text className='text-sm text-gray-600'>{currentUser.email}</Text>
          <Text className='text-xs text-gray-500 mt-1'>
            {DASHBOARD_CONSTANTS.WELCOME_SECTION.ROLE_LABEL}
            {currentUser.role}
          </Text>
        </View>
      )}

      <View className='space-y-4'>
        <Text className='text-base text-gray-600 text-center'>
          {DASHBOARD_CONSTANTS.MAIN_CONTENT.DESCRIPTION}
        </Text>

        <TouchableOpacity
          className='bg-blue-600 py-3 px-6 rounded-lg'
          onPress={() =>
            Alert.alert('Info', DASHBOARD_CONSTANTS.ALERTS.REPORT_CREATION_COMING_SOON)
          }
        >
          <Text className='text-white text-center font-semibold'>
            {DASHBOARD_CONSTANTS.BUTTONS.CREATE_NEW_REPORT}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
