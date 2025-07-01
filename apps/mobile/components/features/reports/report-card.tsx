import { REPORT_STATUS_LABELS } from '@smartnippo/lib';
import type { Report, UserProfile } from '@smartnippo/types';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { router } from 'expo-router';
import { Calendar, Clock, User } from 'lucide-react-native';
import React, { useCallback } from 'react';
import { Pressable, Text, View } from 'react-native';

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

interface ReportCardProps {
  report: Report & { author?: Pick<UserProfile, 'name'> };
}

export const ReportCard = React.memo(({ report }: ReportCardProps) => {
  const handlePress = useCallback(() => {
    router.push(`/(tabs)/reports/${report._id}`);
  }, [report._id]);

  const statusLabel = REPORT_STATUS_LABELS[report.status] || report.status;
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
          <User size={14} color='#6B7280' />
          <Text className='ml-1 text-xs text-gray-500'>
            {report.author?.name ?? '不明な作成者'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
});

ReportCard.displayName = 'ReportCard';
