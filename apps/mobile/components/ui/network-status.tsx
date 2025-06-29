import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Toast from 'react-native-toast-message';

export function NetworkStatus() {
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
