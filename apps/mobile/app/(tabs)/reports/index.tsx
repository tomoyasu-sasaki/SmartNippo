import { api } from 'convex/_generated/api';
import { useQuery } from 'convex/react';
import { router } from 'expo-router';
import { FileText, Plus } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { ReportListSkeleton } from '../../../components/AvatarPicker';
import { FilterChip } from '../../../components/features/reports/filter-chip';
import { ReportCard } from '../../../components/features/reports/report-card';
import { REPORTS_CONSTANTS } from '../../../constants/reports';
import type { Report, UserProfile } from '../../../types';

export default function ReportsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);

  // Convexクエリでデータ取得
  const queryResult = useQuery(api.index.listReports, {
    limit: 20,
    cursor: cursor ?? undefined,
    status: (selectedStatus ?? undefined) as any,
  });

  const reports = queryResult?.reports ?? [];
  const hasMore = queryResult?.hasMore ?? false;
  const isLoading = queryResult === undefined;

  // リフレッシュ処理
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setCursor(null);
    // Convexは自動的に再取得するため、refreshingフラグをリセットするだけ
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  // 次のページを読み込む
  const loadMore = useCallback(() => {
    if (hasMore && queryResult?.nextCursor) {
      setCursor(queryResult.nextCursor);
    }
  }, [hasMore, queryResult?.nextCursor]);

  // 新規作成画面への遷移
  const handleCreateNew = () => {
    router.push('/(tabs)/reports/create');
  };

  // FlatListのアイテムを描画する関数 (メモ化)
  const renderItem = useCallback(
    ({ item }: { item: Report & { author?: Pick<UserProfile, 'name'> } }) => {
      return <ReportCard report={item} />;
    },
    []
  );

  // フィルターチップのプレスハンドラ (メモ化)
  const handleFilterPress = useCallback((status: string | null) => {
    setSelectedStatus(status);
    setCursor(null);
  }, []);

  // アイテムの高さを概算してパフォーマンス向上
  const ITEM_HEIGHT = 180; // おおよその高さを指定
  const getItemLayout = useCallback(
    (data: any, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    []
  );

  // 初回ローディング表示（スケルトン使用）
  if (isLoading && !refreshing) {
    return (
      <SafeAreaView className='flex-1 bg-gray-50'>
        {/* フィルターセクション（スケルトン） */}
        <View className='bg-white px-4 py-3 shadow-sm'>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className='mr-2 h-8 w-16 rounded-full bg-gray-200' />
            <View className='mr-2 h-8 w-12 rounded-full bg-gray-200' />
            <View className='mr-2 h-8 w-16 rounded-full bg-gray-200' />
            <View className='mr-2 h-8 w-16 rounded-full bg-gray-200' />
            <View className='mr-2 h-8 w-12 rounded-full bg-gray-200' />
          </ScrollView>
        </View>

        {/* リストスケルトン */}
        <ReportListSkeleton />
      </SafeAreaView>
    );
  }

  // 空の状態
  const renderEmptyComponent = () => (
    <View className='flex-1 items-center justify-center px-8 py-16'>
      <FileText size={64} color='#D1D5DB' />
      <Text className='mt-4 text-center text-lg font-semibold text-gray-600'>
        {REPORTS_CONSTANTS.LIST_SCREEN.EMPTY_STATE.NO_REPORTS}
      </Text>
      <Text className='mt-2 text-center text-sm text-gray-500'>
        {selectedStatus
          ? REPORTS_CONSTANTS.LIST_SCREEN.EMPTY_STATE.NO_FILTERED_REPORTS(selectedStatus)
          : REPORTS_CONSTANTS.LIST_SCREEN.EMPTY_STATE.CREATE_SUGGESTION}
      </Text>
      {!selectedStatus && (
        <Pressable
          onPress={handleCreateNew}
          className='mt-6 rounded-lg bg-blue-500 px-6 py-3 active:bg-blue-600'
        >
          <Text className='font-semibold text-white'>
            {REPORTS_CONSTANTS.LIST_SCREEN.EMPTY_STATE.CREATE_BUTTON}
          </Text>
        </Pressable>
      )}
    </View>
  );

  return (
    <SafeAreaView className='flex-1 bg-gray-50'>
      {/* フィルターセクション */}
      <View className='bg-white px-4 py-3 shadow-sm'>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <FilterChip
            label={REPORTS_CONSTANTS.LIST_SCREEN.FILTER_LABELS.ALL}
            selected={!selectedStatus}
            onPress={() => handleFilterPress(null)}
          />
          <FilterChip
            label={REPORTS_CONSTANTS.LIST_SCREEN.FILTER_LABELS.DRAFT}
            selected={selectedStatus === 'draft'}
            onPress={() => handleFilterPress('draft')}
          />
          <FilterChip
            label={REPORTS_CONSTANTS.LIST_SCREEN.FILTER_LABELS.SUBMITTED}
            selected={selectedStatus === 'submitted'}
            onPress={() => handleFilterPress('submitted')}
          />
          <FilterChip
            label={REPORTS_CONSTANTS.LIST_SCREEN.FILTER_LABELS.APPROVED}
            selected={selectedStatus === 'approved'}
            onPress={() => handleFilterPress('approved')}
          />
          <FilterChip
            label={REPORTS_CONSTANTS.LIST_SCREEN.FILTER_LABELS.REJECTED}
            selected={selectedStatus === 'rejected'}
            onPress={() => handleFilterPress('rejected')}
          />
        </ScrollView>
      </View>

      {/* 日報リスト */}
      <FlatList
        data={reports}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        windowSize={11} // デフォルト(21)より少し小さくしてメモリ使用量を削減
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.8}
        ListEmptyComponent={renderEmptyComponent}
        ListFooterComponent={
          hasMore ? (
            <View className='py-4'>
              <ActivityIndicator size='small' color='#3B82F6' />
            </View>
          ) : null
        }
      />

      {/* 新規作成ボタン */}
      <Pressable
        onPress={handleCreateNew}
        className='absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-blue-500 shadow-lg active:bg-blue-600'
      >
        <Plus size={24} color='white' />
      </Pressable>
    </SafeAreaView>
  );
}
