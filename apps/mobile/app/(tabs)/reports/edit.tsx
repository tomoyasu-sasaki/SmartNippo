import NetInfo from '@react-native-community/netinfo';
import { REPORTS_CONSTANTS } from '@smartnippo/lib';
import type { ReportFormData } from '@smartnippo/types';
import { api } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';
import { useAction, useConvex, useQuery } from 'convex/react';
import { router, useLocalSearchParams } from 'expo-router';
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
import { LoadingScreen } from '../../../components/ui/loading-screen';

// ステップの定義
const { STEPS } = REPORTS_CONSTANTS.MOBILE_STEPS;

export default function EditReportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<ReportFormData | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof ReportFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [deletedWorkItems, setDeletedWorkItems] = useState<ReportFormData['workItems']>([]);
  // 競合解決用の状態
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<ReportFormData | null>(null);
  const [conflictingReport, setConflictingReport] = useState<typeof report | null>(null);

  const reportId = id as Id<'reports'>;
  const report = useQuery(api.index.getReportDetail, { reportId });
  const workItems = useQuery(api.index.listWorkItemsForReport, { reportId });
  const projects = useQuery(api.index.listProjects);
  const saveReport = useAction(api.index.saveReportWithWorkItems);
  const convex = useConvex();

  // ネットワーク状態の監視
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = state.isConnected && state.isInternetReachable;
      setIsConnected(connected);
    });

    return unsubscribe;
  }, []);

  // 既存データの読み込み
  useEffect(() => {
    if (report && workItems && !formData) {
      setFormData({
        reportDate: report.reportDate,
        projectId: report.projectId,
        title: report.title,
        content: report.content,
        workItems: workItems.map((item) => ({
          ...item,
          isNew: false,
        })),
        workingHours: report.workingHours || {
          startHour: 9,
          startMinute: 0,
          endHour: 18,
          endMinute: 0,
        },
        metadata: report.metadata || {
          achievements: [],
          challenges: [],
          learnings: [],
          nextActionItems: [],
        },
      });
    }
  }, [report, workItems, formData]);

  // バリデーション
  const validateStep = (step: number): boolean => {
    if (!formData) {
      return false;
    }

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

  // フォーム送信
  const handleSubmit = async () => {
    if (!formData || !validateStep(currentStep) || !report) {
      return;
    }
    if (isConnected === false) {
      Alert.alert('オフラインです', 'オンラインのときに再試行してください。');
      return;
    }

    setIsSubmitting(true);
    Toast.show({ type: 'info', text1: '日報を更新中...' });

    try {
      const workItemsForBackend = formData.workItems.map((item) => {
        const { projectId, workCategoryId, description, workDuration } = item;
        const commonData = {
          projectId: projectId as Id<'projects'>,
          workCategoryId: workCategoryId as Id<'workCategories'>,
          description,
          workDuration,
        };

        if (item.isNew) {
          return commonData;
        }

        return {
          ...commonData,
          _id: item._id as Id<'workItems'>,
        };
      });

      // 削除されたアイテムを_isDeletedフラグ付きで追加
      const allWorkItems = [
        ...workItemsForBackend,
        ...deletedWorkItems.map((item) => ({
          _id: item._id as Id<'workItems'>,
          projectId: item.projectId as Id<'projects'>,
          workCategoryId: item.workCategoryId as Id<'workCategories'>,
          description: item.description,
          workDuration: item.workDuration,
          _isDeleted: true,
        })),
      ];

      await saveReport({
        reportId,
        expectedUpdatedAt: report.updated_at,
        reportData: {
          reportDate: formData.reportDate,
          projectId: formData.projectId as Id<'projects'>,
          title: formData.title,
          content: formData.content,
          workingHours: formData.workingHours,
          metadata: formData.metadata,
        },
        workItems: allWorkItems,
      });

      Toast.show({ type: 'success', text1: '日報を更新しました', visibilityTime: 2000 });
      setTimeout(() => router.back(), 1500);
    } catch (error) {
      // 競合エラーの判定
      if (error instanceof Error) {
        if (error.message.includes('conflict') || error.message.includes('concurrency')) {
          // データ競合が発生した場合
          const latest = await convex.query(api.index.getReportDetail, { reportId });
          setConflictingReport(latest);
          setPendingValues(formData);
          setConflictDialogOpen(true);
          return; // トーストは表示しない
        }
      }

      Toast.show({
        type: 'error',
        text1: '更新に失敗しました',
        text2: (error as Error).message,
        visibilityTime: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 下書き保存
  const handleSaveDraft = async () => {
    if (!formData || !report) {
      return;
    }
    if (isConnected === false) {
      Alert.alert('オフラインです', 'オンラインのときに再試行してください。');
      return;
    }

    setIsSubmitting(true);
    Toast.show({
      type: 'info',
      text1: REPORTS_CONSTANTS.MOBILE_CREATE_SCREEN.TOAST_MESSAGES.DRAFT_SAVING,
    });

    try {
      const workItemsForBackend = formData.workItems.map((item) => {
        const { projectId, workCategoryId, description, workDuration } = item;
        const commonData = {
          projectId: projectId as Id<'projects'>,
          workCategoryId: workCategoryId as Id<'workCategories'>,
          description,
          workDuration,
        };

        if (item.isNew) {
          return commonData;
        }

        return {
          ...commonData,
          _id: item._id as Id<'workItems'>,
        };
      });

      // 削除されたアイテムを_isDeletedフラグ付きで追加
      const allWorkItems = [
        ...workItemsForBackend,
        ...deletedWorkItems.map((item) => ({
          _id: item._id as Id<'workItems'>,
          projectId: item.projectId as Id<'projects'>,
          workCategoryId: item.workCategoryId as Id<'workCategories'>,
          description: item.description,
          workDuration: item.workDuration,
          _isDeleted: true,
        })),
      ];

      await saveReport({
        reportId,
        expectedUpdatedAt: report.updated_at, // 下書きでも競合チェックは行う
        reportData: {
          reportDate: formData.reportDate,
          projectId: formData.projectId as Id<'projects'>,
          title: formData.title,
          content: formData.content,
          workingHours: formData.workingHours,
          metadata: formData.metadata,
        },
        workItems: allWorkItems,
        status: 'draft', // ステータスを 'draft' に設定
      });

      Toast.show({
        type: 'success',
        text1: REPORTS_CONSTANTS.MOBILE_CREATE_SCREEN.TOAST_MESSAGES.DRAFT_SUCCESS,
        visibilityTime: 2000,
      });
      setTimeout(() => router.back(), 1500);
    } catch (error) {
      // 競合エラーの判定
      if (error instanceof Error) {
        if (error.message.includes('conflict') || error.message.includes('concurrency')) {
          const latest = await convex.query(api.index.getReportDetail, { reportId });
          setConflictingReport(latest);
          setPendingValues(formData);
          setConflictDialogOpen(true);
          return;
        }
      }
      Toast.show({
        type: 'error',
        text1: '下書き保存に失敗しました',
        text2: (error as Error).message,
        visibilityTime: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 競合解決の処理
  const handleConflictResolution = async (forceUpdate: boolean) => {
    if (!pendingValues || !conflictingReport) {
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

        const workItemsForBackend = pendingValues.workItems.map((item) => {
          const { projectId, workCategoryId, description, workDuration } = item;
          const commonData = {
            projectId: projectId as Id<'projects'>,
            workCategoryId: workCategoryId as Id<'workCategories'>,
            description,
            workDuration,
          };

          if (item.isNew) {
            return commonData;
          }

          return {
            ...commonData,
            _id: item._id as Id<'workItems'>,
          };
        });

        // 削除されたアイテムを_isDeletedフラグ付きで追加
        const allWorkItems = [
          ...workItemsForBackend,
          ...deletedWorkItems.map((item) => ({
            _id: item._id as Id<'workItems'>,
            projectId: item.projectId as Id<'projects'>,
            workCategoryId: item.workCategoryId as Id<'workCategories'>,
            description: item.description,
            workDuration: item.workDuration,
            _isDeleted: true,
          })),
        ];

        await saveReport({
          reportId,
          expectedUpdatedAt: conflictingReport.updated_at,
          reportData: {
            reportDate: pendingValues.reportDate,
            projectId: pendingValues.projectId as Id<'projects'>,
            title: pendingValues.title,
            content: pendingValues.content,
            workingHours: pendingValues.workingHours,
            metadata: pendingValues.metadata,
          },
          workItems: allWorkItems,
        });

        Toast.show({
          type: 'success',
          text1: REPORTS_CONSTANTS.FORCE_SAVE_SUCCESS_TOAST,
          text2: REPORTS_CONSTANTS.FORCE_SAVE_SUCCESS_DESC_TOAST,
          visibilityTime: 2000,
        });

        setTimeout(() => router.back(), 1500);
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
      // 編集を破棄してリロード
      router.replace(`/(tabs)/reports/edit?id=${reportId}`);
    }

    setPendingValues(null);
    setConflictingReport(null);
  };

  // フォームデータ更新
  const updateFormData = (updates: Partial<ReportFormData>) => {
    if (!formData) {
      return;
    }
    setFormData({ ...formData, ...updates });
  };

  // 作業項目の操作
  const addWorkItem = () => {
    if (!formData) {
      return;
    }

    const newWorkItem: ReportFormData['workItems'][number] = {
      isNew: true,
      projectId: null,
      workCategoryId: null,
      description: '',
      workDuration: 0,
    };
    setFormData({ ...formData, workItems: [...formData.workItems, newWorkItem] });
  };

  const updateWorkItem = (
    index: number,
    updatedItem: Partial<ReportFormData['workItems'][number]>
  ) => {
    if (!formData) {
      return;
    }

    const newWorkItems = [...formData.workItems];
    newWorkItems[index] = { ...newWorkItems[index], ...updatedItem };
    setFormData({ ...formData, workItems: newWorkItems });
  };

  const deleteWorkItem = (index: number) => {
    if (!formData) {
      return;
    }

    const itemToDelete = formData.workItems[index];
    // isNewでない（＝永続化されている）アイテムのみ削除リストに追加
    if (!itemToDelete.isNew && itemToDelete._id) {
      setDeletedWorkItems([...deletedWorkItems, itemToDelete]);
    }
    setFormData({ ...formData, workItems: formData.workItems.filter((_, i) => i !== index) });
  };

  if (!report || !formData) {
    return <LoadingScreen message='日報を読み込んでいます...' />;
  }

  // 各ステップのコンテンツを表示
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // 基本情報
        return (
          <BasicInfoStep
            formData={formData}
            errors={errors}
            onUpdateFormData={updateFormData}
            _isEditMode={true}
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
              日報を編集 - {STEPS[currentStep]}
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
            {currentStep < STEPS.length - 1 ? (
              // 最終ステップ以前のボタン
              <>
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
                <Pressable
                  onPress={handleNext}
                  className='flex-1 flex-row items-center justify-center rounded-lg bg-blue-500 py-3 active:bg-blue-600'
                >
                  <Text className='mr-1 font-semibold text-white'>
                    {REPORTS_CONSTANTS.MOBILE_CREATE_SCREEN.BUTTONS.NEXT}
                  </Text>
                  <ChevronRight size={20} color='white' />
                </Pressable>
              </>
            ) : (
              // 最終ステップのボタン
              <>
                <Pressable
                  onPress={handlePrevious}
                  className='flex-grow flex-row items-center justify-center rounded-lg bg-gray-200 py-3 active:bg-gray-300'
                >
                  <ChevronLeft size={20} color='#374151' />
                  <Text className='ml-1 font-semibold text-gray-700'>
                    {REPORTS_CONSTANTS.MOBILE_CREATE_SCREEN.BUTTONS.PREVIOUS}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleSaveDraft}
                  disabled={isSubmitting || isConnected === false}
                  className={`flex-1 flex-row items-center justify-center rounded-lg py-3 ml-2 ${
                    isSubmitting || isConnected === false
                      ? 'bg-gray-400'
                      : 'bg-gray-500 active:bg-gray-600'
                  }`}
                >
                  <Text className='text-center font-semibold text-white'>
                    {REPORTS_CONSTANTS.MOBILE_CREATE_SCREEN.BUTTONS.SAVE_DRAFT}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleSubmit}
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
                        ? '更新中...'
                        : '更新する'}
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
