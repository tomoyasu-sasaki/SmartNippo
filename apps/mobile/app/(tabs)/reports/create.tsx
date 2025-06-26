import NetInfo from '@react-native-community/netinfo';
import { api } from 'convex/_generated/api';
import { useMutation } from 'convex/react';
import { router } from 'expo-router';
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Plus,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView as SafeAreaViewContext } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { REPORTS_CONSTANTS } from '../../../constants/reports';

// ステップの定義
const { STEPS } = REPORTS_CONSTANTS;

// 共通型定義をインポート
import type { ReportFormData, Task } from '../../../types';

// 初期フォームデータ
const initialFormData: ReportFormData = {
  reportDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD形式
  title: '',
  content: '',
  tasks: [],
  metadata: {
    achievements: [],
    challenges: [],
    learnings: [],
    nextActionItems: [],
  },
};

// 優先度の表示名
const priorityLabels = REPORTS_CONSTANTS.PRIORITY_LABELS;

// 難易度の表示名
const difficultyLabels = REPORTS_CONSTANTS.DIFFICULTY_LABELS;

// ステップインジケーター
function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <View className='mb-6 flex-row items-center justify-center px-4'>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <React.Fragment key={index}>
          <View
            className={`h-8 w-8 items-center justify-center rounded-full ${
              index === currentStep
                ? 'bg-blue-500'
                : index < currentStep
                  ? 'bg-green-500'
                  : 'bg-gray-300'
            }`}
          >
            {index < currentStep ? (
              <CheckCircle size={16} color='white' />
            ) : (
              <Text
                className={`text-sm font-bold ${index === currentStep ? 'text-white' : 'text-gray-600'}`}
              >
                {index + 1}
              </Text>
            )}
          </View>
          {index < totalSteps - 1 && (
            <View
              className={`h-1 flex-1 ${index < currentStep ? 'bg-green-500' : 'bg-gray-300'}`}
            />
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

// タスクアイテムコンポーネント
function TaskItem({
  task,
  onUpdate,
  onDelete,
}: {
  task: Task;
  onUpdate: (task: Task) => void;
  onDelete: () => void;
}) {
  return (
    <View className='mb-3 rounded-lg bg-gray-50 p-3'>
      <View className='mb-2 flex-row items-center justify-between'>
        <TextInput
          className='flex-1 font-medium text-gray-900'
          value={task.title}
          onChangeText={(text) => onUpdate({ ...task, title: text })}
          placeholder={REPORTS_CONSTANTS.CREATE_SCREEN.PLACEHOLDERS.TASK_NAME}
          placeholderTextColor='#9CA3AF'
        />
        <Pressable onPress={onDelete} className='ml-2 p-1'>
          <X size={20} color='#EF4444' />
        </Pressable>
      </View>

      <View className='flex-row space-x-2'>
        <Pressable
          onPress={() => onUpdate({ ...task, completed: !task.completed })}
          className={`flex-row items-center rounded-full px-3 py-1 ${
            task.completed ? 'bg-green-100' : 'bg-gray-200'
          }`}
        >
          <Text className={`text-xs ${task.completed ? 'text-green-700' : 'text-gray-600'}`}>
            {task.completed
              ? REPORTS_CONSTANTS.CREATE_SCREEN.TASK_MANAGEMENT.COMPLETED
              : REPORTS_CONSTANTS.CREATE_SCREEN.TASK_MANAGEMENT.INCOMPLETE}
          </Text>
        </Pressable>

        <View className='flex-row items-center space-x-1'>
          {(['low', 'medium', 'high'] as const).map((priority) => (
            <Pressable
              key={priority}
              onPress={() => onUpdate({ ...task, priority })}
              className={`rounded-full px-2 py-1 ${
                task.priority === priority ? 'bg-blue-100' : 'bg-gray-200'
              }`}
            >
              <Text
                className={`text-xs ${
                  task.priority === priority ? 'text-blue-700' : 'text-gray-600'
                }`}
              >
                {priorityLabels[priority]}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View className='mt-2 flex-row space-x-2'>
        <TextInput
          className='flex-1 rounded-md bg-white px-2 py-1 text-xs'
          value={task.estimatedHours?.toString() || ''}
          onChangeText={(text) =>
            onUpdate({ ...task, estimatedHours: text ? parseFloat(text) : undefined })
          }
          placeholder={REPORTS_CONSTANTS.CREATE_SCREEN.PLACEHOLDERS.ESTIMATED_HOURS}
          keyboardType='numeric'
          placeholderTextColor='#9CA3AF'
        />
        <TextInput
          className='flex-1 rounded-md bg-white px-2 py-1 text-xs'
          value={task.actualHours?.toString() || ''}
          onChangeText={(text) =>
            onUpdate({ ...task, actualHours: text ? parseFloat(text) : undefined })
          }
          placeholder={REPORTS_CONSTANTS.CREATE_SCREEN.PLACEHOLDERS.ACTUAL_HOURS}
          keyboardType='numeric'
          placeholderTextColor='#9CA3AF'
        />
        <TextInput
          className='flex-1 rounded-md bg-white px-2 py-1 text-xs'
          value={task.category || ''}
          onChangeText={(text) => onUpdate({ ...task, category: text })}
          placeholder={REPORTS_CONSTANTS.CREATE_SCREEN.PLACEHOLDERS.CATEGORY}
          placeholderTextColor='#9CA3AF'
        />
      </View>
    </View>
  );
}

// メタデータ入力コンポーネント
function MetadataInput({
  label,
  items,
  onAdd,
  onRemove,
}: {
  label: string;
  items: string[];
  onAdd: (item: string) => void;
  onRemove: (index: number) => void;
}) {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    if (inputValue.trim()) {
      onAdd(inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <View className='mb-4'>
      <Text className='mb-2 font-medium text-gray-700'>{label}</Text>
      <View className='mb-2 flex-row'>
        <TextInput
          className='flex-1 rounded-l-lg bg-white px-3 py-2 text-gray-900'
          value={inputValue}
          onChangeText={setInputValue}
          placeholder={REPORTS_CONSTANTS.CREATE_SCREEN.PLACEHOLDERS.METADATA_INPUT(label)}
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
      {items.map((item, index) => (
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
}

export default function CreateReportScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<ReportFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof ReportFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  const createReport = useMutation(api.index.createReport);

  // ネットワーク状態の監視
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = state.isConnected && state.isInternetReachable;
      setIsConnected(connected);
    });

    return unsubscribe;
  }, []);

  // バリデーション
  const validateStep = (step: number): boolean => {
    const newErrors: Partial<Record<keyof ReportFormData, string>> = {};

    switch (step) {
      case 0: // 基本情報
        if (!formData.title.trim()) {
          newErrors.title = REPORTS_CONSTANTS.CREATE_SCREEN.VALIDATION_ERRORS.TITLE_REQUIRED;
        } else if (formData.title.length > 200) {
          newErrors.title = REPORTS_CONSTANTS.CREATE_SCREEN.VALIDATION_ERRORS.TITLE_TOO_LONG;
        }
        if (!formData.content.trim()) {
          newErrors.content = REPORTS_CONSTANTS.CREATE_SCREEN.VALIDATION_ERRORS.CONTENT_REQUIRED;
        } else if (formData.content.length > 10000) {
          newErrors.content = REPORTS_CONSTANTS.CREATE_SCREEN.VALIDATION_ERRORS.CONTENT_TOO_LONG;
        }
        break;
      case 1: // タスク
        // タスクの検証（オプショナル）
        break;
      case 2: // メタデータ
        // メタデータの検証（オプショナル）
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ステップ進行
  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  // ステップ戻る
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // フォーム送信（楽観的更新対応）
  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    // オフライン時の処理
    if (isConnected === false) {
      Alert.alert(
        REPORTS_CONSTANTS.CREATE_SCREEN.ALERTS.OFFLINE_TITLE,
        REPORTS_CONSTANTS.CREATE_SCREEN.ALERTS.OFFLINE_MESSAGE,
        [{ text: 'OK' }]
      );
      return;
    }

    setIsSubmitting(true);

    // 楽観的更新: 即座に成功のフィードバックを表示
    Toast.show({
      type: 'info',
      text1: REPORTS_CONSTANTS.CREATE_SCREEN.TOAST_MESSAGES.CREATING,
      text2: REPORTS_CONSTANTS.CREATE_SCREEN.TOAST_MESSAGES.CREATING_SUBTITLE,
      position: 'top',
    });

    try {
      await createReport({
        reportDate: formData.reportDate,
        title: formData.title,
        content: formData.content,
        tasks: formData.tasks.length > 0 ? formData.tasks : undefined,
        metadata: formData.metadata,
      });

      // 成功時のトースト通知
      Toast.show({
        type: 'success',
        text1: REPORTS_CONSTANTS.CREATE_SCREEN.TOAST_MESSAGES.SUCCESS,
        text2: REPORTS_CONSTANTS.CREATE_SCREEN.TOAST_MESSAGES.SUCCESS_SUBTITLE,
        position: 'top',
        visibilityTime: 2000,
      });

      // 少し遅延を入れてからナビゲーション
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error) {
      const errorMessage = (error as Error).message;

      // ネットワークエラーの検出
      if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        Toast.show({
          type: 'error',
          text1: REPORTS_CONSTANTS.CREATE_SCREEN.TOAST_MESSAGES.NETWORK_ERROR,
          text2: REPORTS_CONSTANTS.CREATE_SCREEN.TOAST_MESSAGES.NETWORK_ERROR_SUBTITLE,
          position: 'top',
          visibilityTime: 4000,
        });
        return;
      }

      // データ競合エラーの検出
      if (
        errorMessage.includes('他のユーザーによって更新されています') ||
        errorMessage.includes('既に存在します')
      ) {
        // 競合解決ダイアログを表示
        Alert.alert(
          REPORTS_CONSTANTS.CREATE_SCREEN.ALERTS.CONFLICT_TITLE,
          REPORTS_CONSTANTS.CREATE_SCREEN.ALERTS.CONFLICT_MESSAGE(errorMessage),
          [
            {
              text: REPORTS_CONSTANTS.CREATE_SCREEN.BUTTONS.DISCARD,
              style: 'destructive',
              onPress: () => {
                Toast.show({
                  type: 'info',
                  text1: REPORTS_CONSTANTS.CREATE_SCREEN.TOAST_MESSAGES.DISCARD_INFO,
                  text2: REPORTS_CONSTANTS.CREATE_SCREEN.TOAST_MESSAGES.DISCARD_INFO_SUBTITLE,
                  position: 'top',
                });
                setTimeout(() => router.back(), 1000);
              },
            },
            {
              text: REPORTS_CONSTANTS.CREATE_SCREEN.BUTTONS.RETRY,
              onPress: () => {
                Toast.show({
                  type: 'info',
                  text1: REPORTS_CONSTANTS.CREATE_SCREEN.TOAST_MESSAGES.RETRY_INFO,
                  text2: REPORTS_CONSTANTS.CREATE_SCREEN.TOAST_MESSAGES.RETRY_INFO_SUBTITLE,
                  position: 'top',
                });
                // 再試行の場合は、ユーザーが手動で再度送信する
              },
            },
          ]
        );
      } else {
        // 通常のエラー時のトースト通知
        Toast.show({
          type: 'error',
          text1: REPORTS_CONSTANTS.CREATE_SCREEN.TOAST_MESSAGES.FAILED,
          text2: errorMessage,
          position: 'top',
          visibilityTime: 4000,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // タスク追加
  const addTask = () => {
    const newTask: Task = {
      id: Date.now().toString(),
      title: '',
      completed: false,
    };
    setFormData({ ...formData, tasks: [...formData.tasks, newTask] });
  };

  // タスク更新
  const updateTask = (index: number, updatedTask: Task) => {
    const newTasks = [...formData.tasks];
    newTasks[index] = updatedTask;
    setFormData({ ...formData, tasks: newTasks });
  };

  // タスク削除
  const deleteTask = (index: number) => {
    const newTasks = formData.tasks.filter((_, i) => i !== index);
    setFormData({ ...formData, tasks: newTasks });
  };

  // 各ステップのコンテンツを表示
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // 基本情報
        return (
          <View className='space-y-4'>
            <View>
              <Text className='mb-2 font-medium text-gray-700'>
                {REPORTS_CONSTANTS.CREATE_SCREEN.FORM_LABELS.DATE}
              </Text>
              <View className='flex-row items-center rounded-lg bg-white px-3 py-3'>
                <Calendar size={20} color='#6B7280' />
                <Text className='ml-2 text-gray-900'>{formData.reportDate}</Text>
              </View>
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
                onChangeText={(text) => setFormData({ ...formData, title: text })}
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
                onChangeText={(text) => setFormData({ ...formData, content: text })}
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
          </View>
        );

      case 1: // タスク
        return (
          <View>
            <View className='mb-4 flex-row items-center justify-between'>
              <Text className='font-medium text-gray-700'>
                {REPORTS_CONSTANTS.CREATE_SCREEN.TASK_MANAGEMENT.TITLE}
              </Text>
              <Pressable
                onPress={addTask}
                className='flex-row items-center rounded-lg bg-blue-500 px-3 py-2 active:bg-blue-600'
              >
                <Plus size={16} color='white' />
                <Text className='ml-1 text-sm font-medium text-white'>
                  {REPORTS_CONSTANTS.CREATE_SCREEN.BUTTONS.ADD_TASK}
                </Text>
              </Pressable>
            </View>

            {formData.tasks.length === 0 ? (
              <View className='rounded-lg bg-gray-50 p-8'>
                <Text className='text-center text-gray-600'>
                  {REPORTS_CONSTANTS.CREATE_SCREEN.TASK_MANAGEMENT.EMPTY_STATE}
                </Text>
              </View>
            ) : (
              <ScrollView className='max-h-96'>
                {formData.tasks.map((task, index) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onUpdate={(updatedTask) => updateTask(index, updatedTask)}
                    onDelete={() => deleteTask(index)}
                  />
                ))}
              </ScrollView>
            )}
          </View>
        );

      case 2: // メタデータ
        return (
          <ScrollView className='max-h-96'>
            <View className='mb-4'>
              <Text className='mb-2 font-medium text-gray-700'>
                {REPORTS_CONSTANTS.CREATE_SCREEN.METADATA_SECTIONS.DIFFICULTY}
              </Text>
              <View className='flex-row space-x-2'>
                {(['easy', 'medium', 'hard'] as const).map((difficulty) => (
                  <Pressable
                    key={difficulty}
                    onPress={() =>
                      setFormData({
                        ...formData,
                        metadata: { ...formData.metadata, difficulty },
                      })
                    }
                    className={`flex-1 rounded-lg py-3 ${
                      formData.metadata.difficulty === difficulty ? 'bg-blue-500' : 'bg-gray-200'
                    }`}
                  >
                    <Text
                      className={`text-center font-medium ${
                        formData.metadata.difficulty === difficulty ? 'text-white' : 'text-gray-700'
                      }`}
                    >
                      {difficultyLabels[difficulty]}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <MetadataInput
              label={REPORTS_CONSTANTS.CREATE_SCREEN.METADATA_SECTIONS.ACHIEVEMENTS}
              items={formData.metadata.achievements}
              onAdd={(item) =>
                setFormData({
                  ...formData,
                  metadata: {
                    ...formData.metadata,
                    achievements: [...formData.metadata.achievements, item],
                  },
                })
              }
              onRemove={(index) =>
                setFormData({
                  ...formData,
                  metadata: {
                    ...formData.metadata,
                    achievements: formData.metadata.achievements.filter((_, i) => i !== index),
                  },
                })
              }
            />

            <MetadataInput
              label={REPORTS_CONSTANTS.CREATE_SCREEN.METADATA_SECTIONS.CHALLENGES}
              items={formData.metadata.challenges}
              onAdd={(item) =>
                setFormData({
                  ...formData,
                  metadata: {
                    ...formData.metadata,
                    challenges: [...formData.metadata.challenges, item],
                  },
                })
              }
              onRemove={(index) =>
                setFormData({
                  ...formData,
                  metadata: {
                    ...formData.metadata,
                    challenges: formData.metadata.challenges.filter((_, i) => i !== index),
                  },
                })
              }
            />

            <MetadataInput
              label={REPORTS_CONSTANTS.CREATE_SCREEN.METADATA_SECTIONS.LEARNINGS}
              items={formData.metadata.learnings}
              onAdd={(item) =>
                setFormData({
                  ...formData,
                  metadata: {
                    ...formData.metadata,
                    learnings: [...formData.metadata.learnings, item],
                  },
                })
              }
              onRemove={(index) =>
                setFormData({
                  ...formData,
                  metadata: {
                    ...formData.metadata,
                    learnings: formData.metadata.learnings.filter((_, i) => i !== index),
                  },
                })
              }
            />

            <MetadataInput
              label={REPORTS_CONSTANTS.CREATE_SCREEN.METADATA_SECTIONS.NEXT_ACTIONS}
              items={formData.metadata.nextActionItems}
              onAdd={(item) =>
                setFormData({
                  ...formData,
                  metadata: {
                    ...formData.metadata,
                    nextActionItems: [...formData.metadata.nextActionItems, item],
                  },
                })
              }
              onRemove={(index) =>
                setFormData({
                  ...formData,
                  metadata: {
                    ...formData.metadata,
                    nextActionItems: formData.metadata.nextActionItems.filter(
                      (_, i) => i !== index
                    ),
                  },
                })
              }
            />
          </ScrollView>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaViewContext className='flex-1 bg-gray-50'>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className='flex-1'
      >
        {/* ヘッダー */}
        <View className='border-b border-gray-200 bg-white px-4 py-4'>
          <View className='flex-row items-center justify-between'>
            <Text className='text-center text-lg font-bold text-gray-900'>
              {STEPS[currentStep]}
            </Text>
            {/* ネットワーク状態インジケーター */}
            <View className='flex-row items-center'>
              {isConnected === false ? (
                <View className='flex-row items-center'>
                  <WifiOff size={16} color='#EF4444' />
                  <Text className='ml-1 text-xs text-red-600'>
                    {REPORTS_CONSTANTS.CREATE_SCREEN.NETWORK_STATUS.OFFLINE}
                  </Text>
                </View>
              ) : isConnected === true ? (
                <View className='flex-row items-center'>
                  <Wifi size={16} color='#10B981' />
                  <Text className='ml-1 text-xs text-green-600'>
                    {REPORTS_CONSTANTS.CREATE_SCREEN.NETWORK_STATUS.ONLINE}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {/* ステップインジケーター */}
        <View className='bg-white pb-2 pt-4'>
          <StepIndicator currentStep={currentStep} totalSteps={STEPS.length} />
        </View>

        {/* コンテンツ */}
        <ScrollView className='flex-1 p-4' showsVerticalScrollIndicator={false}>
          {renderStepContent()}
        </ScrollView>

        {/* ナビゲーションボタン */}
        <View className='border-t border-gray-200 bg-white px-4 py-4'>
          <View className='flex-row space-x-2'>
            {currentStep > 0 && (
              <Pressable
                onPress={handlePrevious}
                className='flex-1 flex-row items-center justify-center rounded-lg bg-gray-200 py-3 active:bg-gray-300'
              >
                <ChevronLeft size={20} color='#374151' />
                <Text className='ml-1 font-semibold text-gray-700'>
                  {REPORTS_CONSTANTS.CREATE_SCREEN.BUTTONS.PREVIOUS}
                </Text>
              </Pressable>
            )}

            {currentStep < STEPS.length - 1 ? (
              <Pressable
                onPress={handleNext}
                className='flex-1 flex-row items-center justify-center rounded-lg bg-blue-500 py-3 active:bg-blue-600'
              >
                <Text className='mr-1 font-semibold text-white'>
                  {REPORTS_CONSTANTS.CREATE_SCREEN.BUTTONS.NEXT}
                </Text>
                <ChevronRight size={20} color='white' />
              </Pressable>
            ) : (
              <Pressable
                onPress={handleSubmit}
                disabled={isSubmitting || isConnected === false}
                className={`flex-1 flex-row items-center justify-center rounded-lg py-3 ${
                  isSubmitting || isConnected === false
                    ? 'bg-gray-400'
                    : 'bg-green-500 active:bg-green-600'
                }`}
              >
                {isSubmitting && <ActivityIndicator size='small' color='white' className='mr-2' />}
                <Text className='text-center font-semibold text-white'>
                  {isConnected === false
                    ? REPORTS_CONSTANTS.CREATE_SCREEN.BUTTONS.OFFLINE_DISABLED
                    : isSubmitting
                      ? REPORTS_CONSTANTS.CREATE_SCREEN.BUTTONS.CREATING
                      : REPORTS_CONSTANTS.CREATE_SCREEN.BUTTONS.CREATE}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaViewContext>
  );
}
