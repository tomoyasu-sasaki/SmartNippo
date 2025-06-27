import type { MutationOptions } from '@/types';
import { useMutation } from 'convex/react';
import type { FunctionReference, OptionalRestArgs } from 'convex/server';
import { useState } from 'react';
import { toast } from 'sonner';

export function useConvexMutation<Mutation extends FunctionReference<'mutation'>>(
  mutation: Mutation,
  options?: MutationOptions
) {
  const [isLoading, setIsLoading] = useState(false);
  const mutate = useMutation(mutation);

  const executeMutation = async (...args: OptionalRestArgs<Mutation>) => {
    setIsLoading(true);
    const toastId = options?.loadingMessage ? toast.loading(options.loadingMessage) : undefined;

    try {
      const result = await mutate(...args);

      if (toastId) {
        toast.success(options?.successMessage ?? '操作が完了しました', {
          id: toastId,
        });
      }

      options?.onSuccess?.(result);
      return result;
    } catch (error) {
      console.error('Mutation error:', error);

      // エラーメッセージの判定
      let errorMessage = options?.errorMessage ?? '操作に失敗しました';
      if (error instanceof Error) {
        if (error.message.includes('conflict') || error.message.includes('concurrency')) {
          errorMessage =
            '他のユーザーが同時に編集したため、操作に失敗しました。ページを更新してください。';
        } else if (error.message.includes('permission')) {
          errorMessage = 'この操作を実行する権限がありません。';
        } else if (error.message.includes('network')) {
          errorMessage = 'ネットワークエラーが発生しました。接続を確認してください。';
        }
      }

      if (toastId) {
        toast.error(errorMessage, {
          id: toastId,
          description: '問題が続く場合は、管理者にお問い合わせください。',
          duration: 5000,
        });
      } else {
        toast.error(errorMessage, {
          description: '問題が続く場合は、管理者にお問い合わせください。',
          duration: 5000,
        });
      }

      options?.onError?.(error as Error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    mutate: executeMutation,
    isLoading,
  };
}
