'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AvatarUpload } from '@/components/ui/avatar-upload';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useUser } from '@clerk/nextjs';
import { isClerkAPIResponseError } from '@clerk/nextjs/errors';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { PROFILE_CONSTANTS, profileFormSchema, type ProfileFormData } from '@smartnippo/lib';
import type { UnifiedUserProfile } from '@smartnippo/types';

interface ProfileFormProps {
  initialData: UnifiedUserProfile;
  onSuccess?: () => void;
}

export function ProfileForm({ initialData, onSuccess }: ProfileFormProps) {
  const { isLoaded, user } = useUser();
  const [isLoading, setIsLoading] = useState(false);

  // Clerk のローディング状態を確認
  if (!isLoaded) {
    return (
      <div className='space-y-6'>
        <div className='flex items-center space-x-6'>
          <div className='h-20 w-20 rounded-full bg-gray-200 animate-pulse' />
          <div className='flex-1 space-y-2'>
            <div className='h-4 bg-gray-200 rounded w-24 animate-pulse' />
            <div className='h-10 bg-gray-200 rounded animate-pulse' />
          </div>
        </div>
        <div className='space-y-4'>
          <div className='h-4 bg-gray-200 rounded w-16 animate-pulse' />
          <div className='h-10 bg-gray-200 rounded animate-pulse' />
        </div>
        <div className='space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <div className='h-4 bg-gray-200 rounded w-20 animate-pulse' />
              <div className='h-4 bg-gray-200 rounded w-32 animate-pulse' />
            </div>
            <div className='space-y-2'>
              <div className='h-4 bg-gray-200 rounded w-16 animate-pulse' />
              <div className='h-4 bg-gray-200 rounded w-24 animate-pulse' />
            </div>
          </div>
        </div>
        <div className='h-10 bg-gray-200 rounded w-32 animate-pulse' />
      </div>
    );
  }

  if (!user) {
    return <div>ユーザー情報が見つかりません。</div>;
  }

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.fullName ?? initialData.fullName ?? '',
      avatarUrl: user?.imageUrl ?? initialData.imageUrl ?? '',
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setIsLoading(true);

      // 名前の更新（firstName/lastNameに分割）
      const nameParts = data.name.trim().split(' ');
      const firstName = nameParts[0] ?? '';
      const lastName = nameParts.slice(1).join(' ') ?? '';

      // Clerkのユーザー情報を更新
      await user.update({
        firstName,
        lastName,
      });

      // アバターURLの更新
      if (data.avatarUrl && data.avatarUrl !== user.imageUrl) {
        try {
          const res = await fetch(data.avatarUrl);
          const blob = await res.blob();
          await user.setProfileImage({ file: blob });
        } catch {
          // Fallback: ignore if fetch fails
        }
      }

      // 変更を反映するためにユーザー情報をリロード
      await user.reload();

      toast.success(PROFILE_CONSTANTS.UPDATE_SUCCESS_MESSAGE);
      onSuccess?.();
    } catch (error) {
      if (isClerkAPIResponseError(error)) {
        toast.error(error.errors[0]?.message ?? PROFILE_CONSTANTS.UPDATE_GENERAL_ERROR_MESSAGE);
      } else {
        toast.error(PROFILE_CONSTANTS.UPDATE_GENERAL_ERROR_MESSAGE);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const displayName =
    user.fullName ?? user.firstName ?? user.emailAddresses[0]?.emailAddress ?? 'User';
  const displayAvatar = form.watch('avatarUrl') ?? user.imageUrl ?? '';

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
        <div className='flex items-center space-x-6'>
          <Avatar className='h-20 w-20'>
            <AvatarImage src={displayAvatar} alt={displayName} />
            <AvatarFallback className='text-lg'>
              {displayName[0]?.toUpperCase() ?? 'U'}
            </AvatarFallback>
          </Avatar>
          <FormField
            control={form.control}
            name='avatarUrl'
            render={({ field }) => (
              <FormItem className='flex-1'>
                <FormLabel>{PROFILE_CONSTANTS.AVATAR_LABEL}</FormLabel>
                <FormControl>
                  <AvatarUpload
                    avatarUrl={field.value ?? user.imageUrl ?? ''}
                    onUpload={(result: { url: string }) => {
                      // アップロード成功時の処理
                      field.onChange(result.url);
                      toast.success(PROFILE_CONSTANTS.AVATAR_UPLOAD_SUCCESS_MESSAGE);
                    }}
                    onRemove={() => {
                      field.onChange(undefined);
                    }}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormDescription>{PROFILE_CONSTANTS.AVATAR_DESCRIPTION}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>{PROFILE_CONSTANTS.NAME_LABEL}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={PROFILE_CONSTANTS.PLACEHOLDERS.NAME}
                  disabled={isLoading}
                />
              </FormControl>
              <FormDescription>{PROFILE_CONSTANTS.NAME_DESCRIPTION}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className='space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='text-sm font-medium text-gray-500'>
                {PROFILE_CONSTANTS.EMAIL_LABEL}
              </label>
              <p className='text-sm text-gray-900'>
                {user.emailAddresses[0]?.emailAddress ?? PROFILE_CONSTANTS.EMAIL_NOT_SET}
              </p>
            </div>
            <div>
              <label className='text-sm font-medium text-gray-500'>
                {PROFILE_CONSTANTS.ROLE_LABEL}
              </label>
              <p className='text-sm text-gray-900 capitalize'>{initialData.role}</p>
            </div>
          </div>

          <div>
            <label className='text-sm font-medium text-gray-500'>
              {PROFILE_CONSTANTS.MEMBER_SINCE_LABEL}
            </label>
            <p className='text-sm text-gray-900'>
              {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>

        <Button type='submit' disabled={isLoading} variant='outline'>
          {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
          {PROFILE_CONSTANTS.SUBMIT_BUTTON_TEXT}
        </Button>
      </form>
    </Form>
  );
}
