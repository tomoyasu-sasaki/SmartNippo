import { useEffect } from 'react';
import { Alert } from 'react-native';
import Toast from 'react-native-toast-message';

export function GlobalErrorHandler() {
  useEffect(() => {
    // JavaScript エラーをキャッチ
    const originalHandler = ErrorUtils.getGlobalHandler();

    ErrorUtils.setGlobalHandler((error, isFatal) => {
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

  return null;
}
