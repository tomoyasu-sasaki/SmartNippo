import type { Doc } from 'convex/_generated/dataModel';
import { Plus } from 'lucide-react-native';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { REPORTS_CONSTANTS } from '../../../../constants/reports';
import type { ReportFormData, WorkItem } from '../../../../types';
import { WorkItemForm } from '../work-item-form';

interface WorkItemsStepProps {
  formData: ReportFormData;
  projects: Doc<'projects'>[] | undefined;
  onAddWorkItem: () => void;
  onUpdateWorkItem: (index: number, updatedItem: Partial<WorkItem>) => void;
  onDeleteWorkItem: (index: number) => void;
}

export const WorkItemsStep: React.FC<WorkItemsStepProps> = ({
  formData,
  projects,
  onAddWorkItem,
  onUpdateWorkItem,
  onDeleteWorkItem,
}) => {
  return (
    <View>
      <View className='mb-4 flex-row items-center justify-between'>
        <Text className='font-medium text-gray-700'>
          {REPORTS_CONSTANTS.CREATE_SCREEN.WORK_ITEM_MANAGEMENT.TITLE}
        </Text>
        <Pressable
          onPress={onAddWorkItem}
          className='flex-row items-center rounded-lg bg-blue-500 px-3 py-2 active:bg-blue-600'
        >
          <Plus size={16} color='white' />
          <Text className='ml-1 text-sm font-medium text-white'>
            {REPORTS_CONSTANTS.CREATE_SCREEN.BUTTONS.ADD_WORK_ITEM}
          </Text>
        </Pressable>
      </View>

      {formData.workItems.length === 0 ? (
        <View className='rounded-lg bg-gray-50 p-8'>
          <Text className='text-center text-gray-600'>
            {REPORTS_CONSTANTS.CREATE_SCREEN.WORK_ITEM_MANAGEMENT.EMPTY_STATE}
          </Text>
        </View>
      ) : (
        <ScrollView className='max-h-96'>
          {formData.workItems.map((item, index) => (
            <WorkItemForm
              key={item._id}
              workItem={item}
              onUpdate={(updated) => onUpdateWorkItem(index, updated)}
              onDelete={() => onDeleteWorkItem(index)}
              projects={projects}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
};
