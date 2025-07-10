import { useMutation } from 'convex/react';
import type { FunctionReference } from 'convex/server';
import { useState } from 'react';
import { toast } from 'sonner';

interface UseConvexMutationOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
}

export function useConvexMutation(
  mutation: FunctionReference<'mutation', 'public', any, any>,
  options?: UseConvexMutationOptions
) {
  const [isLoading, setIsLoading] = useState(false);
  const convexMutation = useMutation(mutation);

  const mutate = async (args: any) => {
    setIsLoading(true);
    try {
      const result = await convexMutation(args);
      if (options?.successMessage) {
        toast.success(options.successMessage);
      }
      options?.onSuccess?.();
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(options?.errorMessage ?? errorMessage);
      options?.onError?.(error instanceof Error ? error : new Error(errorMessage));
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { mutate, isLoading };
}
