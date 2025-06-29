import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { AlertCircle, Calendar } from 'lucide-react-native';
import React, { useState } from 'react';
import { Platform, Pressable, Text, TextInput, View } from 'react-native';
import { REPORTS_CONSTANTS } from '../../../../constants/reports';
import type { ReportFormData } from '../../../../types';
import { WorkingTimePicker } from '../working-time-picker';

interface BasicInfoStepProps {
  formData: ReportFormData;
  errors: Partial<Record<keyof ReportFormData, string>>;
  onUpdateFormData: (updates: Partial<ReportFormData>) => void;
  isEditMode?: boolean;
}

export const BasicInfoStep: React.FC<BasicInfoStepProps> = ({
  formData,
  errors,
  onUpdateFormData,
  isEditMode = false,
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd', { locale: ja });
      onUpdateFormData({ reportDate: formattedDate });
    }
  };

  const currentDate = new Date(formData.reportDate || new Date());

  return (
    <View className='space-y-4'>
      <View>
        <Text className='mb-2 font-medium text-gray-700'>
          {REPORTS_CONSTANTS.CREATE_SCREEN.FORM_LABELS.DATE}
        </Text>
        <Pressable
          onPress={() => setShowDatePicker(true)}
          className='flex-row items-center rounded-lg bg-white px-3 py-3'
        >
          <Calendar size={20} color='#6B7280' />
          <Text className='ml-2 text-gray-900'>
            {format(currentDate, 'yyyy年MM月dd日', { locale: ja })}
          </Text>
        </Pressable>
        {showDatePicker && (
          <DateTimePicker
            value={currentDate}
            mode='date'
            display='default'
            onChange={handleDateChange}
          />
        )}
      </View>

      <View>
        <Text className='mb-2 font-medium text-gray-700'>
          {REPORTS_CONSTANTS.CREATE_SCREEN.FORM_LABELS.TITLE}
          <Text className='text-red-500'>
            {REPORTS_CONSTANTS.CREATE_SCREEN.FORM_LABELS.REQUIRED_MARKER}
          </Text>
        </Text>
        <TextInput
          className='rounded-lg bg-white px-3 py-3 text-gray-900'
          value={formData.title}
          onChangeText={(text) => onUpdateFormData({ title: text })}
          placeholder={REPORTS_CONSTANTS.CREATE_SCREEN.PLACEHOLDERS.TITLE}
          placeholderTextColor='#9CA3AF'
        />
        {errors.title && (
          <View className='mt-1 flex-row items-center'>
            <AlertCircle size={16} color='#EF4444' />
            <Text className='ml-1 text-sm text-red-600'>{errors.title}</Text>
          </View>
        )}
      </View>

      <View>
        <Text className='mb-2 font-medium text-gray-700'>
          {REPORTS_CONSTANTS.CREATE_SCREEN.FORM_LABELS.CONTENT}
          <Text className='text-red-500'>
            {REPORTS_CONSTANTS.CREATE_SCREEN.FORM_LABELS.REQUIRED_MARKER}
          </Text>
        </Text>
        <TextInput
          className='rounded-lg bg-white px-3 py-3 text-gray-900'
          value={formData.content}
          onChangeText={(text) => onUpdateFormData({ content: text })}
          placeholder={REPORTS_CONSTANTS.CREATE_SCREEN.PLACEHOLDERS.CONTENT}
          placeholderTextColor='#9CA3AF'
          multiline
          numberOfLines={6}
          textAlignVertical='top'
        />
        {errors.content && (
          <View className='mt-1 flex-row items-center'>
            <AlertCircle size={16} color='#EF4444' />
            <Text className='ml-1 text-sm text-red-600'>{errors.content}</Text>
          </View>
        )}
        <Text className='mt-1 text-right text-xs text-gray-500'>
          {formData.content.length}/10000
        </Text>
      </View>

      <WorkingTimePicker
        value={formData.workingHours}
        onUpdate={(newValue) =>
          onUpdateFormData({
            workingHours: { ...formData.workingHours, ...newValue },
          })
        }
      />
    </View>
  );
};
