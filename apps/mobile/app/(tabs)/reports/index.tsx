import { api } from 'convex/_generated/api';
import { useQuery } from 'convex/react';
import { router } from 'expo-router';
import { Calendar, Clock, FileText, Plus } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
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

// 日報のステータスを日本語に変換
const statusLabels = {
  draft: '下書き',
  submitted: '提出済み',
  approved: '承認済み',
  rejected: '却下',
} as const;

// ステータスに応じた色を返す
const getStatusColor = (status: string) => {
  switch (status) {
    case 'draft':
      return 'bg-gray-100 text-gray-600';
    case 'submitted':
      return 'bg-blue-100 text-blue-600';
    case 'approved':
      return 'bg-green-100 text-green-600';
    case 'rejected':
      return 'bg-red-100 text-red-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
};

// 日報カードコンポーネント (メモ化)
const ReportCard = React.memo(({ report }: { report: any }) => {
  const handlePress = useCallback(() => {
    router.push(`/(tabs)/reports/${report._id}`);
  }, [report._id]);

  return (
    <Pressable
      onPress={handlePress}
      className='mb-4 rounded-lg bg-white p-4 shadow-sm active:opacity-80'
    >
      {/* ヘッダー部分 */}
      <View className='mb-2 flex-row items-center justify-between'>
        <View className='flex-row items-center'>
          <Calendar size={16} color='#6B7280' />
          <Text className='ml-1 text-sm text-gray-600'>{report.reportDate}</Text>
        </View>
        <View className={`rounded-full px-3 py-1 ${getStatusColor(report.status)}`}>
          <Text className='text-xs font-medium'>
            {statusLabels[report.status as keyof typeof statusLabels]}
          </Text>
        </View>
      </View>

      {/* タイトル */}
      <Text numberOfLines={2} className='mb-2 text-base font-semibold text-gray-900'>
        {report.title}
      </Text>

      {/* 内容プレビュー */}
      <Text numberOfLines={3} className='mb-3 text-sm text-gray-600'>
        {report.content}
      </Text>

      {/* フッター部分 */}
      <View className='flex-row items-center justify-between'>
        <View className='flex-row items-center'>
          <View className='flex-row items-center'>
            <Clock size={14} color='#6B7280' />
            <Text className='ml-1 text-xs text-gray-500'>
              {new Date(report.created_at).toLocaleDateString('ja-JP', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>

        {/* タスク数表示 */}
        {report.tasks && report.tasks.length > 0 && (
          <View className='flex-row items-center'>
            <FileText size={14} color='#6B7280' />
            <Text className='ml-1 text-xs text-gray-500'>
              タスク: {report.tasks.filter((t: any) => t.completed).length}/{report.tasks.length}
            </Text>
          </View>
        )}
      </View>

      {/* 作成者情報 */}
      {report.author && (
        <View className='mt-2 border-t border-gray-100 pt-2'>
          <Text className='text-xs text-gray-500'>作成者: {report.author.name}</Text>
        </View>
      )}
    </Pressable>
  );
});

// フィルターチップコンポーネント (メモ化)
const FilterChip = React.memo(
  ({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) => {
    return (
      <Pressable
        onPress={onPress}
        className={`mr-2 rounded-full px-4 py-2 ${
          selected ? 'bg-blue-500' : 'bg-gray-100'
        } active:opacity-80`}
      >
        <Text className={`text-sm font-medium ${selected ? 'text-white' : 'text-gray-700'}`}>
          {label}
        </Text>
      </Pressable>
    );
  }
);

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
  const renderItem = useCallback(({ item }: { item: any }) => {
    return <ReportCard report={item} />;
  }, []);

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
      <Text className='mt-4 text-center text-lg font-semibold text-gray-600'>日報がありません</Text>
      <Text className='mt-2 text-center text-sm text-gray-500'>
        {selectedStatus
          ? `${statusLabels[selectedStatus as keyof typeof statusLabels]}の日報はありません`
          : '新しい日報を作成してください'}
      </Text>
      {!selectedStatus && (
        <Pressable
          onPress={handleCreateNew}
          className='mt-6 rounded-lg bg-blue-500 px-6 py-3 active:bg-blue-600'
        >
          <Text className='font-semibold text-white'>日報を作成</Text>
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
            label='すべて'
            selected={!selectedStatus}
            onPress={() => handleFilterPress(null)}
          />
          <FilterChip
            label='下書き'
            selected={selectedStatus === 'draft'}
            onPress={() => handleFilterPress('draft')}
          />
          <FilterChip
            label='提出済み'
            selected={selectedStatus === 'submitted'}
            onPress={() => handleFilterPress('submitted')}
          />
          <FilterChip
            label='承認済み'
            selected={selectedStatus === 'approved'}
            onPress={() => handleFilterPress('approved')}
          />
          <FilterChip
            label='却下'
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
