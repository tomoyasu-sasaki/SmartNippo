'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from 'convex/react';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

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

import { profileFormSchema } from '@smartnippo/lib';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';

interface UserProfile {
  _id: Id<'userProfiles'>;
  name: string;
  email?: string;
  avatarUrl?: string;
  role: 'viewer' | 'user' | 'manager' | 'admin';
  orgId?: Id<'orgs'>;
  pushToken?: string;
  created_at: number;
  updated_at: number;
}

interface ProfileFormData {
  name: string;
  avatarUrl: string;
}

interface ProfileFormProps {
  initialData: UserProfile;
  onSuccess?: () => void;
}

export function ProfileForm({ initialData, onSuccess }: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const updateProfile = useMutation(api.users.updateProfile);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema) as any,
    defaultValues: {
      name: initialData.name,
      avatarUrl: initialData.avatarUrl ?? '',
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setIsLoading(true);

      const updateData: {
        name: string;
        avatarUrl?: string;
        _version: number;
      } = {
        name: data.name,
        _version: initialData.updated_at,
      };

      // avatarUrlが空文字でない場合のみ追加
      if (data.avatarUrl && data.avatarUrl.trim() !== '') {
        updateData.avatarUrl = data.avatarUrl;
      }

      await updateProfile(updateData);

      toast.success('プロフィールを更新しました');
      onSuccess?.();
    } catch (error) {
      // console.error('Profile update error:', error);

      if (error instanceof Error && error.message.includes('updated by another process')) {
        toast.error('プロフィールが他の場所で更新されています。画面を再読み込みしてください。');
      } else {
        toast.error('プロフィールの更新に失敗しました');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
        <div className='flex items-center space-x-6'>
          <Avatar className='h-20 w-20'>
            <AvatarImage
              src={form.watch('avatarUrl') || initialData.avatarUrl}
              alt={initialData.name}
            />
            <AvatarFallback className='text-lg'>
              {initialData.name[0]?.toUpperCase() ?? 'U'}
            </AvatarFallback>
          </Avatar>
          <div className='flex-1'>
            <FormField
              control={form.control}
              name='avatarUrl'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>プロフィール画像</FormLabel>
                  <FormControl>
                    <AvatarUpload
                      avatarUrl={field.value ?? initialData.avatarUrl ?? ''}
                      onUpload={(result: { url: string }) => {
                        // アップロード成功時の処理
                        field.onChange(result.url);
                        toast.success('画像がアップロードされました');
                      }}
                      onRemove={() => {
                        field.onChange('');
                      }}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    プロフィール画像をアップロードまたはドラッグ&ドロップしてください
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>名前</FormLabel>
              <FormControl>
                <Input placeholder='名前を入力してください' {...field} disabled={isLoading} />
              </FormControl>
              <FormDescription>表示名として使用されます</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className='space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='text-sm font-medium text-gray-500'>Email</label>
              <p className='text-sm text-gray-900'>{initialData.email ?? 'Not set'}</p>
            </div>
            <div>
              <label className='text-sm font-medium text-gray-500'>Role</label>
              <p className='text-sm text-gray-900 capitalize'>{initialData.role}</p>
            </div>
          </div>

          <div>
            <label className='text-sm font-medium text-gray-500'>Member Since</label>
            <p className='text-sm text-gray-900'>
              {new Date(initialData.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        <Button type='submit' disabled={isLoading}>
          {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
          プロフィールを更新
        </Button>
      </form>
    </Form>
  );
}
