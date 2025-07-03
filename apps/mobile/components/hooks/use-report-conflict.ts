import { REPORTS_CONSTANTS } from '@smartnippo/lib';
import type { ReportFormData } from '@smartnippo/types';
import { useState } from 'react';
import Toast from 'react-native-toast-message';

export interface ConflictState {
  isOpen: boolean;
  pendingValues: ReportFormData | null;
  context?: {
    isDraft?: boolean;
    reportId?: string;
    expectedUpdatedAt?: number;
  };
}

export function useReportConflict() {
  const [conflictState, setConflictState] = useState<ConflictState>({
    isOpen: false,
    pendingValues: null,
    context: undefined,
  });

  const showConflictDialog = (values: ReportFormData, context?: ConflictState['context']) => {
    setConflictState({
      isOpen: true,
      pendingValues: values,
      context,
    });
  };

  const hideConflictDialog = () => {
    setConflictState({
      isOpen: false,
      pendingValues: null,
      context: undefined,
    });
  };

  const handleConflictError = (
    error: Error,
    formData: ReportFormData,
    context?: ConflictState['context']
  ) => {
    if (error.message.includes('conflict') || error.message.includes('concurrency')) {
      showConflictDialog(formData, context);
      return true; // 競合エラーが処理された
    }
    return false; // 他のエラー
  };

  const resolveConflict = async (
    forceUpdate: boolean,
    onForceUpdate: (values: ReportFormData, context?: ConflictState['context']) => Promise<void>,
    onDiscard?: () => void
  ) => {
    if (!conflictState.pendingValues) {
      return;
    }

    const { pendingValues, context } = conflictState;
    hideConflictDialog();

    if (forceUpdate) {
      // 強制的に上書き保存
      try {
        Toast.show({
          type: 'info',
          text1: REPORTS_CONSTANTS.FORCE_SAVING_TOAST,
        });

        await onForceUpdate(pendingValues, context);

        Toast.show({
          type: 'success',
          text1: REPORTS_CONSTANTS.FORCE_SAVE_SUCCESS_TOAST,
          text2: REPORTS_CONSTANTS.FORCE_SAVE_SUCCESS_DESC_TOAST,
          visibilityTime: 2000,
        });
      } catch (error) {
        Toast.show({
          type: 'error',
          text1: REPORTS_CONSTANTS.FORCE_SAVE_ERROR_TOAST,
          visibilityTime: 4000,
        });
        throw error;
      }
    } else {
      // 編集を破棄
      if (onDiscard) {
        onDiscard();
      }
      Toast.show({
        type: 'info',
        text1: '変更を破棄しました',
        text2: '最新の状態にリセットされました',
        visibilityTime: 2000,
      });
    }
  };

  return {
    conflictState,
    showConflictDialog,
    hideConflictDialog,
    handleConflictError,
    resolveConflict,
  };
}
