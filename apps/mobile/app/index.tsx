import { useUser } from '@clerk/clerk-expo';
import { Redirect } from 'expo-router';
import { LoadingScreen } from '../components/ui/loading-screen';

export default function HomeScreen() {
  const { user, isLoaded } = useUser();

  // 認証状態の読み込み中
  if (!isLoaded) {
    return <LoadingScreen />;
  }

  // 認証済みの場合は Tab ナビゲーションへ
  if (user) {
    return <Redirect href='/(tabs)' />;
  }

  // 未認証の場合は認証画面へ
  return <Redirect href='/(auth)' />;
}
