import { useUser } from '@clerk/clerk-expo';
import { useMutation, useQuery } from 'convex/react';
import { useEffect } from 'react';
import { Text, View, TouchableOpacity, Alert } from 'react-native';
import { api } from 'convex/_generated/api';

export default function ReportsScreen() {
  const { user, isLoaded } = useUser();
  const storeUser = useMutation(api.users.store);
  const currentUser = useQuery(api.users.current);

  // ユーザー情報を同期
  useEffect(() => {
    if (isLoaded && user) {
      const syncUser = async () => {
        try {
          await storeUser();
        } catch (error) {
          // エラーログは開発時のみ、本番では適切なエラーレポートサービスに送信
          if (__DEV__) {
            console.error('Failed to sync user:', error);
          }
        }
      };

      syncUser();
    }
  }, [isLoaded, user, storeUser]);

  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-gray-600">Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-red-600">Not authenticated</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white p-4">
      <Text className="text-2xl font-bold text-gray-900 mb-4">Reports</Text>

      {currentUser && (
        <View className="bg-gray-50 p-4 rounded-lg mb-6">
          <Text className="text-sm text-gray-600 mb-1">Welcome,</Text>
          <Text className="text-lg font-semibold text-gray-900">{currentUser.name}</Text>
          <Text className="text-sm text-gray-600">{currentUser.email}</Text>
          <Text className="text-xs text-gray-500 mt-1">Role: {currentUser.role}</Text>
        </View>
      )}

      <View className="space-y-4">
        <Text className="text-base text-gray-600 text-center">
          Daily report functionality will be implemented here
      </Text>

        <TouchableOpacity
          className="bg-blue-600 py-3 px-6 rounded-lg"
          onPress={() => Alert.alert('Info', 'Report creation coming soon!')}
        >
          <Text className="text-white text-center font-semibold">Create New Report</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
