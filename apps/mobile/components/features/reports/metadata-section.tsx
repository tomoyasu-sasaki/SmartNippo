import React from 'react';
import { Text, View } from 'react-native';

interface MetadataSectionProps {
  title: string;
  items: string[];
}

export const MetadataSection: React.FC<MetadataSectionProps> = ({ title, items }) => {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <View className='mb-4'>
      <Text className='mb-2 font-medium text-gray-700'>{title}</Text>
      {items.map((item, index) => (
        <View key={index} className='mb-1 rounded-lg bg-gray-50 px-3 py-2'>
          <Text className='text-sm text-gray-700'>• {item}</Text>
        </View>
      ))}
    </View>
  );
};
