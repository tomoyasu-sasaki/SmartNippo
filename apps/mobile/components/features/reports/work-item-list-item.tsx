import React from 'react';
import { Text, View } from 'react-native';

interface WorkItemListItemProps {
  item: any;
}

export const WorkItemListItem: React.FC<WorkItemListItemProps> = ({ item }) => {
  return (
    <View className='mb-2 rounded-lg bg-gray-50 p-3'>
      <Text className='text-sm font-medium text-gray-900'>{item.description}</Text>
      <View className='mt-1 flex-row flex-wrap items-center'>
        {item.projectName && (
          <Text className='mr-3 text-xs text-gray-600'>プロジェクト: {item.projectName}</Text>
        )}
        {item.workCategoryName && (
          <Text className='mr-3 text-xs text-gray-600'>区分: {item.workCategoryName}</Text>
        )}
        {typeof item.workDuration === 'number' && (
          <Text className='text-xs text-gray-600'>
            時間: {Math.round((item.workDuration / 60) * 10) / 10}h
          </Text>
        )}
      </View>
    </View>
  );
};
