import { REPORTS_CONSTANTS } from '@smartnippo/lib';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

interface AISummaryCardProps {
  summary?: string | null;
  aiSummaryStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  isLoading?: boolean;
}

// LoadingSkeleton Component
const LoadingSkeleton = () => (
  <View className='rounded-lg bg-gray-50 p-4 animate-pulse'>
    <View className='space-y-2'>
      <View className='h-4 bg-gray-200 rounded w-full' />
      <View className='h-4 bg-gray-200 rounded w-5/6' />
      <View className='h-4 bg-gray-200 rounded w-4/6' />
    </View>
  </View>
);

export const AISummaryCard: React.FC<AISummaryCardProps> = ({
  summary,
  aiSummaryStatus,
  isLoading = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const maxLength = 150; // 文字数制限
  const shouldTruncate = summary && summary.length > maxLength;

  const displayText = shouldTruncate && !isExpanded ? `${summary.slice(0, maxLength)}...` : summary;

  const renderContent = () => {
    if (isLoading || aiSummaryStatus === 'processing') {
      return (
        <View>
          <LoadingSkeleton />
          <View className='mt-2 flex-row items-center'>
            <ActivityIndicator size='small' color='#3B82F6' />
            <Text className='ml-2 text-xs text-gray-500'>AI要約を生成中...</Text>
          </View>
        </View>
      );
    }

    if (aiSummaryStatus === 'failed') {
      return (
        <View className='rounded-lg bg-red-50 p-4'>
          <Text className='text-sm text-red-600'>
            AI要約の生成に失敗しました。しばらく時間をおいて再度お試しください。
          </Text>
        </View>
      );
    }

    if (!summary) {
      return (
        <View className='rounded-lg bg-gray-50 p-4'>
          <Text className='text-sm text-gray-500'>
            {REPORTS_CONSTANTS.AI_SUMMARY_NOT_AVAILABLE}
          </Text>
        </View>
      );
    }

    return (
      <View>
        <View className='rounded-lg bg-blue-50 p-4'>
          <Text className='text-sm text-gray-700'>{displayText}</Text>
        </View>
        {shouldTruncate && (
          <Pressable onPress={() => setIsExpanded(!isExpanded)} className='mt-2'>
            <Text className='text-xs text-blue-600 font-medium'>
              {isExpanded ? '短縮表示' : 'もっと見る'}
            </Text>
          </Pressable>
        )}
      </View>
    );
  };

  return (
    <View className='mt-2 bg-white p-4'>
      <Text className='mb-3 text-lg font-semibold text-gray-900'>
        {REPORTS_CONSTANTS.AI_SUMMARY_TITLE}
      </Text>
      {renderContent()}
    </View>
  );
};
