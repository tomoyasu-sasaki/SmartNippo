import React from 'react';
import { Pressable, Text } from 'react-native';

interface FilterChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export const FilterChip = React.memo(({ label, selected, onPress }: FilterChipProps) => {
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
});

FilterChip.displayName = 'FilterChip';
