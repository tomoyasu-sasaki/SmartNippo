import NetInfo from '@react-native-community/netinfo';
import { REPORTS_CONSTANTS } from '@smartnippo/lib';
import type { ReportFormData } from '@smartnippo/types';
import { api } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';
import { useAction, useQuery } from 'convex/react';
import { router } from 'expo-router';
import { ChevronLeft, ChevronRight, Wifi, WifiOff } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView as SafeAreaViewContext } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { StepIndicator } from '../../../components/features/reports/step-indicator';
import {
  BasicInfoStep,
  MetadataStep,
  WorkItemsStep,
} from '../../../components/features/reports/steps';

// ステップの定義
const { STEPS } = REPORTS_CONSTANTS.MOBILE_STEPS;

// 初期フォームデータ
const initialFormData: ReportFormData = {
  reportDate: new Date().toISOString().split('T')[0],
  projectId: undefined,
  title: '',
  content: '',
  workItems: [],
  workingHours: {
    startHour: 9,
    startMinute: 0,
    endHour: 18,
    endMinute: 0,
  },
  metadata: {
    achievements: [],
    challenges: [],
    learnings: [],
    nextActionItems: [],
  },
};

export default function CreateReportScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<ReportFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof ReportFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  // 競合解決用の状態
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<ReportFormData | null>(null);
  const [pendingIsDraft, setPendingIsDraft] = useState(false);

  const saveReport = useAction(api.index.saveReportWithWorkItems);
  const projects = useQuery(api.index.listProjects);

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
        if (!formData.projectId) {
          newErrors.projectId = 'メインプロジェクトを選択してください';
        }
        if (!formData.title.trim()) {
          newErrors.title = REPORTS_CONSTANTS.MOBILE_CREATE_SCREEN.VALIDATION_ERRORS.TITLE_REQUIRED;
        } else if (formData.title.length > 200) {
          newErrors.title = REPORTS_CONSTANTS.MOBILE_CREATE_SCREEN.VALIDATION_ERRORS.TITLE_TOO_LONG;
        }
        if (!formData.content.trim()) {
          newErrors.content =
            REPORTS_CONSTANTS.MOBILE_CREATE_SCREEN.VALIDATION_ERRORS.CONTENT_REQUIRED;
        } else if (formData.content.length > 10000) {
          newErrors.content =
            REPORTS_CONSTANTS.MOBILE_CREATE_SCREEN.VALIDATION_ERRORS.CONTENT_TOO_LONG;
        }
        break;
      case 1: // 作業内容
        if (
          formData.workItems.length > 0 &&
          formData.workItems.some((item) => !item.projectId || !item.workCategoryId)
        ) {
          newErrors.workItems =
            REPORTS_CONSTANTS.MOBILE_CREATE_SCREEN.VALIDATION_ERRORS.WORK_ITEM_INCOMPLETE;
          Toast.show({
            type: 'error',
            text1: '入力が完了していません',
            text2: REPORTS_CONSTANTS.MOBILE_CREATE_SCREEN.VALIDATION_ERRORS.WORK_ITEM_INCOMPLETE,
            visibilityTime: 4000,
          });
        }
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
  const handleSubmit = async (isDraft = false) => {
    // 全ステップのバリデーションを実行（下書きの場合は基本情報のみ）
    const stepsToValidate = isDraft ? 1 : STEPS.length;
    for (let i = 0; i < stepsToValidate; i++) {
      if (!validateStep(i)) {
        setCurrentStep(i);
        Toast.show({
          type: 'error',
          text1: '入力内容に不備があります',
          text2: `${STEPS[i]}の項目を確認してください。`,
        });
        return;
      }
    }

    if (isConnected === false) {
      Alert.alert('オフラインです', 'オンラインのときに再試行してください。');
      return;
    }

    setIsSubmitting(true);

    if (isDraft) {
      Toast.show({
        type: 'info',
        text1: REPORTS_CONSTANTS.MOBILE_CREATE_SCREEN.TOAST_MESSAGES.DRAFT_SAVING,
        text2: REPORTS_CONSTANTS.MOBILE_CREATE_SCREEN.TOAST_MESSAGES.DRAFT_SAVING_SUBTITLE,
      });
    } else {
      Toast.show({ type: 'info', text1: '日報を作成中...' });
    }

    try {
      const workItemsForBackend = formData.workItems
        .filter((item) => item.projectId && item.workCategoryId)
        .map(({ _id: __id, isNew: _isNew, ...rest }) => ({
          ...rest,
          // バリデーションにより、projectIdとworkCategoryIdがnullでないことが保証される
          projectId: rest.projectId as Id<'projects'>,
          workCategoryId: rest.workCategoryId as Id<'workCategories'>,
        }));

      const reportId = await saveReport({
        reportData: {
          reportDate: formData.reportDate,
          projectId: formData.projectId as Id<'projects'>,
          title: formData.title,
          content: formData.content,
          workingHours: formData.workingHours,
          metadata: formData.metadata,
        },
        workItems: workItemsForBackend,
        status: isDraft ? 'draft' : 'submitted',
      });

      if (isDraft) {
        Toast.show({
          type: 'success',
          text1: REPORTS_CONSTANTS.MOBILE_CREATE_SCREEN.TOAST_MESSAGES.DRAFT_SUCCESS,
          text2: REPORTS_CONSTANTS.MOBILE_CREATE_SCREEN.TOAST_MESSAGES.DRAFT_SUCCESS_SUBTITLE,
          visibilityTime: 2000,
        });
        // 下書き保存後は詳細画面に遷移
        setTimeout(() => router.replace(`/reports/${reportId}`), 1500);
      } else {
        Toast.show({ type: 'success', text1: '日報を作成しました', visibilityTime: 2000 });
        setTimeout(() => router.back(), 1500);
      }
    } catch (error) {
      // 競合エラーの判定
      if (error instanceof Error) {
        if (error.message.includes('conflict') || error.message.includes('concurrency')) {
          // データ競合が発生した場合
          setPendingValues(formData);
          setPendingIsDraft(isDraft);
          setConflictDialogOpen(true);
          return; // トーストは表示しない
        }
      }

      Toast.show({
        type: 'error',
        text1: '作成に失敗しました',
        text2: (error as Error).message,
        visibilityTime: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 競合解決の処理
  const handleConflictResolution = async (forceUpdate: boolean) => {
    if (!pendingValues) {
      return;
    }

    setConflictDialogOpen(false);

    if (forceUpdate) {
      // 強制的に上書き保存
      try {
        setIsSubmitting(true);
        Toast.show({
          type: 'info',
          text1: REPORTS_CONSTANTS.FORCE_SAVING_TOAST,
        });

        const workItemsForBackend = pendingValues.workItems
          .filter((item) => item.projectId && item.workCategoryId)
          .map(({ _id: __id, isNew: _isNew, ...rest }) => ({
            ...rest,
            projectId: rest.projectId as Id<'projects'>,
            workCategoryId: rest.workCategoryId as Id<'workCategories'>,
          }));

        const reportId = await saveReport({
          reportData: {
            reportDate: pendingValues.reportDate,
            projectId: pendingValues.projectId as Id<'projects'>,
            title: pendingValues.title,
            content: pendingValues.content,
            workingHours: pendingValues.workingHours,
            metadata: pendingValues.metadata,
          },
          workItems: workItemsForBackend,
          status: pendingIsDraft ? 'draft' : 'submitted',
        });

        Toast.show({
          type: 'success',
          text1: REPORTS_CONSTANTS.FORCE_SAVE_SUCCESS_TOAST,
          text2: REPORTS_CONSTANTS.FORCE_SAVE_SUCCESS_DESC_TOAST,
          visibilityTime: 2000,
        });

        if (pendingIsDraft) {
          setTimeout(() => router.replace(`/reports/${reportId}`), 1500);
        } else {
          setTimeout(() => router.back(), 1500);
        }
      } catch {
        Toast.show({
          type: 'error',
          text1: REPORTS_CONSTANTS.FORCE_SAVE_ERROR_TOAST,
          visibilityTime: 4000,
        });
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // 編集を破棄して初期状態にリセット
      setFormData(initialFormData);
      setCurrentStep(0);
      Toast.show({
        type: 'info',
        text1: '変更を破棄しました',
        text2: '最新の状態にリセットされました',
        visibilityTime: 2000,
      });
    }

    setPendingValues(null);
    setPendingIsDraft(false);
  };

  // フォームデータ更新
  const updateFormData = (updates: Partial<ReportFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  // 作業項目の操作
  const addWorkItem = () => {
    const newWorkItem: ReportFormData['workItems'][number] = {
      isNew: true,
      projectId: null,
      workCategoryId: null,
      description: '',
      workDuration: 0,
    };
    setFormData((prev) => ({ ...prev, workItems: [...prev.workItems, newWorkItem] }));
  };

  const updateWorkItem = (
    index: number,
    updatedItem: Partial<ReportFormData['workItems'][number]>
  ) => {
    setFormData((prev) => {
      const newWorkItems = [...prev.workItems];
      newWorkItems[index] = { ...newWorkItems[index], ...updatedItem };
      return { ...prev, workItems: newWorkItems };
    });
  };

  const deleteWorkItem = (index: number) => {
    setFormData((prev) => ({ ...prev, workItems: prev.workItems.filter((_, i) => i !== index) }));
  };

  // 各ステップのコンテンツを表示
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // 基本情報
        return (
          <BasicInfoStep
            formData={formData}
            errors={errors}
            onUpdateFormData={updateFormData}
            projects={projects}
          />
        );

      case 1: // 作業内容
        return (
          <WorkItemsStep
            formData={formData}
            projects={projects}
            onAddWorkItem={addWorkItem}
            onUpdateWorkItem={updateWorkItem}
            onDeleteWorkItem={deleteWorkItem}
          />
        );

      case 2: // メタデータ
        return <MetadataStep formData={formData} onUpdateFormData={updateFormData} />;

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
                    {REPORTS_CONSTANTS.MOBILE_CREATE_SCREEN.NETWORK_STATUS.OFFLINE}
                  </Text>
                </View>
              ) : isConnected === true ? (
                <View className='flex-row items-center'>
                  <Wifi size={16} color='#10B981' />
                  <Text className='ml-1 text-xs text-green-600'>
                    {REPORTS_CONSTANTS.MOBILE_CREATE_SCREEN.NETWORK_STATUS.ONLINE}
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
                  {REPORTS_CONSTANTS.MOBILE_CREATE_SCREEN.BUTTONS.PREVIOUS}
                </Text>
              </Pressable>
            )}

            {currentStep < STEPS.length - 1 ? (
              <Pressable
                onPress={handleNext}
                className='flex-1 flex-row items-center justify-center rounded-lg bg-blue-500 py-3 active:bg-blue-600'
              >
                <Text className='mr-1 font-semibold text-white'>
                  {REPORTS_CONSTANTS.MOBILE_CREATE_SCREEN.BUTTONS.NEXT}
                </Text>
                <ChevronRight size={20} color='white' />
              </Pressable>
            ) : (
              <>
                <Pressable
                  onPress={() => handleSubmit(true)}
                  disabled={isSubmitting || isConnected === false}
                  className={`flex-1 flex-row items-center justify-center rounded-lg py-3 ${
                    isSubmitting || isConnected === false
                      ? 'bg-gray-400'
                      : 'bg-gray-500 active:bg-gray-600'
                  }`}
                >
                  {isSubmitting && (
                    <ActivityIndicator size='small' color='white' className='mr-2' />
                  )}
                  <Text className='text-center font-semibold text-white'>
                    {isConnected === false
                      ? REPORTS_CONSTANTS.MOBILE_CREATE_SCREEN.BUTTONS.OFFLINE_DISABLED
                      : isSubmitting
                        ? REPORTS_CONSTANTS.MOBILE_CREATE_SCREEN.BUTTONS.SAVING_DRAFT
                        : REPORTS_CONSTANTS.MOBILE_CREATE_SCREEN.BUTTONS.SAVE_DRAFT}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => handleSubmit(false)}
                  disabled={isSubmitting || isConnected === false}
                  className={`flex-1 flex-row items-center justify-center rounded-lg py-3 ml-2 ${
                    isSubmitting || isConnected === false
                      ? 'bg-gray-400'
                      : 'bg-green-500 active:bg-green-600'
                  }`}
                >
                  {isSubmitting && (
                    <ActivityIndicator size='small' color='white' className='mr-2' />
                  )}
                  <Text className='text-center font-semibold text-white'>
                    {isConnected === false
                      ? REPORTS_CONSTANTS.MOBILE_CREATE_SCREEN.BUTTONS.OFFLINE_DISABLED
                      : isSubmitting
                        ? REPORTS_CONSTANTS.MOBILE_CREATE_SCREEN.BUTTONS.CREATING
                        : REPORTS_CONSTANTS.MOBILE_CREATE_SCREEN.BUTTONS.CREATE}
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        </View>

        {/* 競合解決ダイアログ */}
        <Modal
          visible={conflictDialogOpen}
          animationType='fade'
          transparent={true}
          onRequestClose={() => setConflictDialogOpen(false)}
        >
          <View className='flex-1 items-center justify-center bg-black/50'>
            <View className='mx-4 rounded-lg bg-white p-6 shadow-lg'>
              <Text className='mb-4 text-lg font-semibold text-gray-900'>
                {REPORTS_CONSTANTS.CONFLICT_DIALOG_TITLE}
              </Text>
              <Text className='mb-4 text-sm text-gray-600'>
                {REPORTS_CONSTANTS.CONFLICT_DIALOG_DESCRIPTION}
              </Text>

              <View className='mb-6 space-y-2'>
                <Text className='text-sm text-gray-500'>
                  • {REPORTS_CONSTANTS.CONFLICT_DIALOG_FORCE_SAVE_INFO}
                </Text>
                <Text className='text-sm text-gray-500'>
                  • {REPORTS_CONSTANTS.CONFLICT_DIALOG_DISCARD_INFO}
                </Text>
              </View>

              <View className='flex-row space-x-3'>
                <Pressable
                  onPress={() => handleConflictResolution(false)}
                  className='flex-1 rounded-lg bg-gray-500 py-3 active:bg-gray-600'
                >
                  <Text className='text-center font-semibold text-white'>
                    {REPORTS_CONSTANTS.CONFLICT_DIALOG_DISCARD_BUTTON}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => handleConflictResolution(true)}
                  className='flex-1 rounded-lg bg-red-500 py-3 active:bg-red-600'
                >
                  <Text className='text-center font-semibold text-white'>
                    {REPORTS_CONSTANTS.CONFLICT_DIALOG_FORCE_SAVE_BUTTON}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaViewContext>
  );
}
