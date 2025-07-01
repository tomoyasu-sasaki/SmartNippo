import { REPORTS_CONSTANTS } from '@smartnippo/lib';
import { Plus, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

interface MetadataInputProps {
  label: string;
  items?: string[];
  onAdd: (item: string) => void;
  onRemove: (index: number) => void;
}

export const MetadataInput: React.FC<MetadataInputProps> = ({
  label,
  items = [],
  onAdd,
  onRemove,
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    if (inputValue.trim()) {
      onAdd(inputValue.trim());
      setInputValue('');
    }
  };

  const safeItems = items || [];

  return (
    <View className='mb-4'>
      <Text className='mb-2 font-medium text-gray-700'>{label}</Text>
      <View className='mb-2 flex-row'>
        <TextInput
          className='flex-1 rounded-l-lg bg-white px-3 py-2 text-gray-900'
          value={inputValue}
          onChangeText={setInputValue}
          placeholder={REPORTS_CONSTANTS.MOBILE_CREATE_SCREEN.PLACEHOLDERS.METADATA_INPUT(label)}
          placeholderTextColor='#9CA3AF'
          onSubmitEditing={handleAdd}
        />
        <Pressable
          onPress={handleAdd}
          className='rounded-r-lg bg-blue-500 px-4 py-2 active:bg-blue-600'
        >
          <Plus size={20} color='white' />
        </Pressable>
      </View>
      {safeItems.map((item, index) => (
        <View
          key={index}
          className='mb-1 flex-row items-center justify-between rounded-lg bg-gray-50 px-3 py-2'
        >
          <Text className='flex-1 text-sm text-gray-700'>{item}</Text>
          <Pressable onPress={() => onRemove(index)} className='ml-2'>
            <X size={16} color='#6B7280' />
          </Pressable>
        </View>
      ))}
    </View>
  );
};
