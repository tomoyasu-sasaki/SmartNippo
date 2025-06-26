import { useClerk, useUser } from '@clerk/clerk-expo';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from 'convex/react';
import { router } from 'expo-router';
import { Download, Edit3, Loader2, Plus, Save, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { z } from 'zod';
import AvatarPicker from '../../components/AvatarPicker';

import { PRIVACY_LEVELS, SOCIAL_PLATFORMS } from '@smartnippo/lib';
import { api } from 'convex/_generated/api';
import { Image as ExpoImage } from 'expo-image';

// Zodスキーマをこのファイル内で直接定義
const profileFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  avatarUrl: z.string().optional(),
  socialLinks: z.record(z.string()).optional(),
  privacySettings: z.record(z.string()).optional(),
});

type ProfileFormData = z.infer<typeof profileFormSchema>;

export default function ProfileScreen() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Convexからユーザープロフィールを取得
  const userProfile = useQuery(api.index.current);
  const updateProfile = useMutation(api.index.updateProfile);
  const generateUploadUrl = useMutation(api.index.generateAvatarUploadUrl);
  const saveAvatarToProfile = useMutation(api.index.saveAvatarToProfile);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: '',
      avatarUrl: '',
      socialLinks: {},
      privacySettings: {},
    },
  });

  // フォームのデフォルト値を更新（useEffect内で実行）
  useEffect(() => {
    if (userProfile && !isEditing) {
      form.reset({
        name: userProfile.name ?? '',
        avatarUrl: userProfile.avatarUrl ?? '',
        socialLinks: userProfile.socialLinks ?? {},
        privacySettings: userProfile.privacySettings ?? {},
      });
    }
  }, [userProfile, isEditing, form.reset]);

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
            router.replace('/(auth)');
          } catch {
            Alert.alert('Error', 'Failed to sign out. Please try again.');
          }
        },
      },
    ]);
  };

  const handleSave = async (data: ProfileFormData) => {
    if (!userProfile) {
      return;
    }

    try {
      setIsLoading(true);

      await updateProfile({
        name: data.name,
        avatarUrl: data.avatarUrl ?? undefined,
        socialLinks: data.socialLinks ?? undefined,
        privacySettings: data.privacySettings ?? undefined,
        _version: userProfile.updated_at,
      });

      Alert.alert('成功', 'プロフィールを更新しました');
      setIsEditing(false);
    } catch (error) {
      if (error instanceof Error && error.message.includes('updated by another process')) {
        Alert.alert(
          'エラー',
          'プロフィールが他の場所で更新されています。画面を再読み込みしてください。'
        );
      } else {
        Alert.alert('エラー', 'プロフィールの更新に失敗しました');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (userProfile) {
      form.reset({
        name: userProfile.name ?? '',
        avatarUrl: userProfile.avatarUrl ?? '',
        socialLinks: userProfile.socialLinks ?? {},
        privacySettings: userProfile.privacySettings ?? {},
      });
    }
    setIsEditing(false);
  };

  if (!isLoaded || !userProfile) {
    return (
      <View className='flex-1 items-center justify-center bg-white'>
        <Text className='text-gray-600'>Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View className='flex-1 items-center justify-center bg-white'>
        <Text className='text-red-600'>Not authenticated</Text>
      </View>
    );
  }

  const watchedAvatarUrl = form.watch('avatarUrl');
  const avatarUrl = watchedAvatarUrl ?? userProfile?.avatarUrl ?? user?.imageUrl;

  return (
    <KeyboardAvoidingView
      className='flex-1 bg-white'
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView className='flex-1' contentContainerStyle={{ paddingBottom: 100 }}>
        <View className='px-6 py-8'>
          <View className='flex-row items-center justify-between mb-6'>
            <Text className='text-2xl font-bold text-gray-900'>Profile</Text>
            {!isEditing ? (
              <TouchableOpacity
                className='bg-blue-600 px-4 py-2 rounded-lg'
                onPress={() => setIsEditing(true)}
              >
                <Edit3 size={20} color='white' />
              </TouchableOpacity>
            ) : (
              <View className='flex-row space-x-2'>
                <TouchableOpacity
                  className='bg-green-600 px-4 py-2 rounded-lg'
                  onPress={form.handleSubmit(handleSave)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 size={20} color='white' />
                  ) : (
                    <Save size={20} color='white' />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  className='bg-gray-600 px-4 py-2 rounded-lg'
                  onPress={handleCancel}
                  disabled={isLoading}
                >
                  <X size={20} color='white' />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Avatar Section */}
          <View className='items-center mb-8'>
            {isEditing ? (
              <AvatarPicker
                currentAvatarUrl={avatarUrl}
                onImageSelected={async (result) => {
                  // Convexのファイルストレージにアップロード
                  try {
                    const uploadUrl = await generateUploadUrl();

                    // React Nativeから画像をアップロード
                    const response = await fetch(uploadUrl, {
                      method: 'POST',
                      headers: { 'Content-Type': result.mimeType },
                      body: await fetch(result.uri).then((r) => r.blob()),
                    });

                    if (!response.ok) {
                      throw new Error('Upload failed');
                    }

                    const { storageId } = await response.json();

                    const resultUrl = await saveAvatarToProfile({
                      storageId,
                      fileSize: result.fileSize,
                      fileType: result.mimeType,
                      fileName: result.fileName,
                    });

                    if (resultUrl?.url) {
                      form.setValue('avatarUrl', resultUrl.url);
                      Alert.alert('成功', '画像がアップロードされました');
                    } else {
                      throw new Error('Failed to get avatar URL after saving.');
                    }
                  } catch {
                    Alert.alert('エラー', '画像のアップロードに失敗しました');
                  }
                }}
                disabled={isLoading}
              />
            ) : avatarUrl ? (
              <ExpoImage
                source={{ uri: avatarUrl }}
                style={{ width: 96, height: 96, borderRadius: 48, marginBottom: 16 }}
                placeholder='|r--r,L;00jt?w?bfQj[fQj[fQfQfQfQfQ'
                transition={500}
                cachePolicy='disk'
              />
            ) : (
              <View className='w-24 h-24 rounded-full bg-gray-200 items-center justify-center mb-4'>
                <Text className='text-2xl font-semibold text-gray-600'>
                  {userProfile.name?.[0]?.toUpperCase() ?? 'U'}
                </Text>
              </View>
            )}
          </View>

          {/* Name Section */}
          <View className='mb-6'>
            <Text className='text-sm font-medium text-gray-700 mb-2'>名前</Text>
            {isEditing ? (
              <Controller
                control={form.control}
                name='name'
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <View>
                    <TextInput
                      className='w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900'
                      placeholder='名前を入力してください'
                      value={value}
                      onChangeText={onChange}
                      editable={!isLoading}
                    />
                    {error && <Text className='text-red-600 text-sm mt-1'>{error.message}</Text>}
                  </View>
                )}
              />
            ) : (
              <Text className='text-xl font-semibold text-gray-900'>{userProfile.name}</Text>
            )}
          </View>

          {/* Social Links Section */}
          {isEditing && (
            <View className='mb-6'>
              <Text className='text-sm font-medium text-gray-700 mb-2'>ソーシャルリンク</Text>
              <SocialLinksEditor
                socialLinks={form.watch('socialLinks') ?? userProfile.socialLinks ?? {}}
                onChange={(links) => {
                  form.setValue('socialLinks', links);
                }}
              />
            </View>
          )}

          {/* Privacy Settings Section */}
          {isEditing && (
            <View className='mb-6'>
              <Text className='text-sm font-medium text-gray-700 mb-2'>プライバシー設定</Text>
              <PrivacySettingsEditor
                privacySettings={form.watch('privacySettings') ?? userProfile.privacySettings ?? {}}
                onChange={(settings) => {
                  form.setValue('privacySettings', settings);
                }}
              />
            </View>
          )}

          {/* Account Details */}
          <View className='space-y-4'>
            <View className='bg-gray-50 p-4 rounded-lg'>
              <Text className='text-sm font-medium text-gray-700 mb-1'>Email</Text>
              <Text className='text-base text-gray-900'>
                {userProfile.email ?? user.primaryEmailAddress?.emailAddress ?? 'Not set'}
              </Text>
            </View>

            <View className='bg-gray-50 p-4 rounded-lg'>
              <Text className='text-sm font-medium text-gray-700 mb-1'>Role</Text>
              <Text className='text-base text-gray-900 capitalize'>{userProfile.role}</Text>
            </View>

            <View className='bg-gray-50 p-4 rounded-lg'>
              <Text className='text-sm font-medium text-gray-700 mb-1'>Member Since</Text>
              <Text className='text-base text-gray-900'>
                {new Date(userProfile.created_at).toLocaleDateString()}
              </Text>
            </View>

            {/* Export Profile Button */}
            <TouchableOpacity
              className='bg-gray-600 p-4 rounded-lg mt-4 flex-row items-center justify-center'
              onPress={() => {
                // React NativeでのエクスポートはファイルシステムAPIを使用
                Alert.alert('プロフィールエクスポート', 'この機能は準備中です');
              }}
              disabled={isLoading}
            >
              <Download size={20} color='white' />
              <Text className='ml-2 text-center font-semibold text-white'>Export Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className='bg-red-600 p-4 rounded-lg mt-6'
              onPress={handleSignOut}
              disabled={isLoading}
            >
              <Text className='text-center font-semibold text-white'>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ソーシャルリンクエディターコンポーネント
function SocialLinksEditor({
  socialLinks,
  onChange,
}: {
  socialLinks: Record<string, string>;
  onChange: (links: Record<string, string>) => void;
}) {
  const [links, setLinks] = useState(socialLinks);

  return (
    <View className='space-y-2'>
      {Object.entries(links).map(([platform]) => (
        <View
          key={platform}
          className='flex-row items-center justify-between bg-gray-50 p-3 rounded-lg'
        >
          <Text className='text-sm'>
            {SOCIAL_PLATFORMS[platform as keyof typeof SOCIAL_PLATFORMS]?.name ?? platform}
          </Text>
          <TouchableOpacity
            onPress={() => {
              const newLinks = { ...links };
              delete newLinks[platform];
              setLinks(newLinks);
              onChange(newLinks);
            }}
          >
            <X size={16} color='#ef4444' />
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity
        className='bg-blue-50 p-3 rounded-lg flex-row items-center justify-center'
        onPress={() => {
          Alert.prompt('ソーシャルリンクを追加', 'URLを入力してください', (url) => {
            if (url) {
              // URLからプラットフォームを推測する処理
              const newLinks = { ...links, twitter: url }; // 簡易実装
              setLinks(newLinks);
              onChange(newLinks);
            }
          });
        }}
      >
        <Plus size={16} color='#3b82f6' />
        <Text className='ml-2 text-blue-600 text-sm'>リンクを追加</Text>
      </TouchableOpacity>
    </View>
  );
}

// プライバシー設定エディターコンポーネント
function PrivacySettingsEditor({
  privacySettings,
  onChange,
}: {
  privacySettings: Record<string, string>;
  onChange: (settings: Record<string, string>) => void;
}) {
  const [settings, setSettings] = useState(privacySettings);

  const privacyOptions = [
    { key: 'profile', label: 'プロフィール全体' },
    { key: 'email', label: 'メールアドレス' },
    { key: 'socialLinks', label: 'ソーシャルリンク' },
    { key: 'reports', label: '日報' },
  ];

  return (
    <View className='space-y-2'>
      {privacyOptions.map(({ key, label }) => (
        <View key={key} className='flex-row items-center justify-between bg-gray-50 p-3 rounded-lg'>
          <Text className='text-sm'>{label}</Text>
          <View className='flex-row space-x-2'>
            {Object.entries(PRIVACY_LEVELS).map(([level, { label: levelLabel }]) => (
              <TouchableOpacity
                key={level}
                className={`px-3 py-1 rounded-full ${
                  settings[key] === level ? 'bg-blue-600' : 'bg-gray-200'
                }`}
                onPress={() => {
                  const newSettings = { ...settings, [key]: level };
                  setSettings(newSettings);
                  onChange(newSettings);
                }}
              >
                <Text
                  className={`text-xs ${settings[key] === level ? 'text-white' : 'text-gray-600'}`}
                >
                  {levelLabel}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}
