import { Picker } from '@react-native-picker/picker';
import { api } from 'convex/_generated/api';
import type { Doc, Id } from 'convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { WorkItem } from '../../../types';

interface WorkItemFormProps {
  workItem: Partial<WorkItem> & { _id?: string };
  onUpdate: (item: Partial<WorkItem>) => void;
  onDelete: () => void;
  projects: Doc<'projects'>[] | undefined;
}

export const WorkItemForm: React.FC<WorkItemFormProps> = ({
  workItem,
  onUpdate,
  onDelete,
  projects,
}) => {
  const [workCategories, setWorkCategories] = useState<Doc<'workCategories'>[]>([]);
  const fetchedCategories = useQuery(
    api.index.listWorkCategories,
    workItem.projectId ? { projectId: workItem.projectId as Id<'projects'> } : 'skip'
  );

  useEffect(() => {
    if (fetchedCategories) {
      setWorkCategories(fetchedCategories);
    }
  }, [fetchedCategories]);

  return (
    <View style={styles.container}>
      <Pressable onPress={onDelete} style={styles.deleteButton}>
        <X size={20} color='#EF4444' />
      </Pressable>

      <View style={styles.content}>
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>プロジェクト</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={workItem.projectId || ''}
              onValueChange={(itemValue) =>
                onUpdate({
                  ...workItem,
                  projectId: itemValue as Id<'projects'>,
                  workCategoryId: undefined,
                })
              }
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              <Picker.Item label='プロジェクトを選択...' value='' />
              {projects?.map((p) => (
                <Picker.Item key={p._id} label={p.name} value={p._id} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>作業区分</Text>
          <View style={[styles.pickerWrapper, !workItem.projectId && styles.disabledPicker]}>
            <Picker
              selectedValue={workItem.workCategoryId || ''}
              onValueChange={(itemValue) =>
                onUpdate({
                  ...workItem,
                  workCategoryId: itemValue ? (itemValue as Id<'workCategories'>) : undefined,
                })
              }
              enabled={!!workItem.projectId}
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              <Picker.Item label='作業区分を選択...' value='' />
              {workCategories.map((c) => (
                <Picker.Item key={c._id} label={c.name} value={c._id} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>作業内容</Text>
          <TextInput
            value={workItem.description}
            onChangeText={(text) => onUpdate({ ...workItem, description: text })}
            placeholder='作業内容を入力してください'
            multiline
            numberOfLines={3}
            textAlignVertical='top'
            style={styles.textInput}
            placeholderTextColor='#9CA3AF'
          />
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>作業時間（分）</Text>
          <TextInput
            value={workItem.workDuration?.toString() || ''}
            onChangeText={(text) => onUpdate({ ...workItem, workDuration: Number(text) || 0 })}
            placeholder='120'
            keyboardType='numeric'
            style={styles.textInput}
            placeholderTextColor='#9CA3AF'
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    position: 'relative',
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
    padding: 4,
  },
  content: {
    paddingRight: 32,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  pickerWrapper: {
    backgroundColor: '#ffffff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'transparent',
    overflow: 'hidden',
    height: 100,
  },
  disabledPicker: {
    backgroundColor: '#f9fafb',
    opacity: 0.6,
  },
  picker: {
    height: 120,
  },
  pickerItem: {
    fontSize: 16,
    color: '#111827',
    height: 120,
  },
  textInput: {
    backgroundColor: '#ffffff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: '#111827',
    minHeight: 40,
  },
});
