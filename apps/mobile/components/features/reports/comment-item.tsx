import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import React from 'react';
import { Text, View } from 'react-native';
import { REPORTS_CONSTANTS } from '../../../constants/reports';

interface CommentItemProps {
  comment: any;
}

export const CommentItem: React.FC<CommentItemProps> = ({ comment }) => {
  const isSystemComment = comment.type === 'system' || comment.type === 'ai';

  return (
    <View className={`mb-3 ${isSystemComment ? 'pl-4' : ''}`}>
      <View className='flex-row items-start'>
        <View
          className={`mr-3 h-8 w-8 items-center justify-center rounded-full ${
            isSystemComment ? 'bg-gray-200' : 'bg-blue-500'
          }`}
        >
          <Text className={`text-xs font-bold ${isSystemComment ? 'text-gray-600' : 'text-white'}`}>
            {isSystemComment ? 'S' : comment.author?.name?.[0] || '?'}
          </Text>
        </View>
        <View className='flex-1'>
          <View className='mb-1 flex-row items-center'>
            <Text className='text-sm font-medium text-gray-900'>
              {isSystemComment
                ? REPORTS_CONSTANTS.DETAIL_SCREEN.COMMENTS.SYSTEM_AUTHOR
                : comment.author?.name || REPORTS_CONSTANTS.DETAIL_SCREEN.COMMENTS.UNKNOWN_AUTHOR}
            </Text>
            <Text className='ml-2 text-xs text-gray-500'>
              {format(new Date(comment.created_at), 'M月d日 HH:mm', { locale: ja })}
            </Text>
          </View>
          <Text className='text-sm text-gray-700'>{comment.content}</Text>
        </View>
      </View>
    </View>
  );
};
