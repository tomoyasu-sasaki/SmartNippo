import { api } from 'convex/_generated/api';
import { useQuery } from 'convex/react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
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
import { REPORTS_CONSTANTS } from '../../../constants/reports';
import type { Report, UserProfile } from '../../../types';

// ステータスに応じた色を返す
const getStatusColor = (status: string) => {
  switch (status) {
    case 'draft':
      return 'bg-gray-100 text-gray-800';
    case 'submitted':
      return 'bg-blue-100 text-blue-800';
    case 'approved':
      return 'bg-green-100 text-green-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// 日報カードコンポーネント (メモ化)
const ReportCard = React.memo(
  ({ report }: { report: Report & { author?: Pick<UserProfile, 'name'> } }) => {
    const handlePress = useCallback(() => {
      router.push(`/(tabs)/reports/${report._id}`);
    }, [report._id]);

    const completedTasks = report.tasks.filter((task) => task.completed).length;
    const statusLabel = REPORTS_CONSTANTS.STATUS_LABELS[report.status] || report.status;
    const statusColor = getStatusColor(report.status);

    return (
      <Pressable onPress={handlePress} className='mb-3 rounded-lg bg-white p-4 shadow-sm'>
        {/* ヘッダー */}
        <View className='mb-2 flex-row items-center justify-between'>
          <View className='flex-row items-center'>
            <Calendar size={16} color='#6B7280' />
            <Text className='ml-1 text-sm text-gray-600'>{report.reportDate}</Text>
          </View>
          <View className={`rounded-full px-3 py-1 ${statusColor}`}>
            <Text className='text-xs font-medium'>{statusLabel}</Text>
          </View>
        </View>

        {/* タイトル */}
        <Text className='mb-2 text-base font-semibold text-gray-900' numberOfLines={2}>
          {report.title}
        </Text>

        {/* 本文プレビュー */}
        <Text className='mb-3 text-sm text-gray-600' numberOfLines={3}>
          {report.content}
        </Text>

        {/* フッター */}
        <View className='flex-row items-center justify-between'>
          <View className='flex-row items-center'>
            <Clock size={14} color='#6B7280' />
            <Text className='ml-1 text-xs text-gray-500'>
              {format(new Date(report.created_at), 'M月d日 HH:mm', { locale: ja })}
            </Text>
          </View>
          <View className='flex-row items-center'>
            <FileText size={14} color='#6B7280' />
            <Text className='ml-1 text-xs text-gray-500'>
              {REPORTS_CONSTANTS.LIST_SCREEN.TASK_SUMMARY}
              {completedTasks}/{report.tasks.length}
            </Text>
          </View>
          {report.author?.name && (
            <Text className='text-xs text-gray-500'>
              {REPORTS_CONSTANTS.LIST_SCREEN.AUTHOR_LABEL}
              {report.author.name}
            </Text>
          )}
        </View>
      </Pressable>
    );
  }
);

ReportCard.displayName = 'ReportCard';

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
