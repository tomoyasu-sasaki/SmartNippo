import { useClerk, useUser } from '@clerk/clerk-expo';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from 'convex/react';
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

import {
  PRIVACY_LEVELS,
  PROFILE_CONSTANTS,
  SOCIAL_PLATFORMS,
  VALIDATION_MESSAGES,
  mergeUnsafeMetadata,
  type ClerkUnsafeMetadata,
} from '@smartnippo/lib';
import { api } from 'convex/_generated/api';
import { Image as ExpoImage } from 'expo-image';

// Zodスキーマをこのファイル内で直接定義
const profileFormSchema = z.object({
  name: z
    .string()
    .min(1, VALIDATION_MESSAGES.NAME_REQUIRED)
    .max(100, VALIDATION_MESSAGES.NAME_TOO_LONG),
  avatarUrl: z.string().optional(),
  avatarStorageId: z.string().optional(),
  socialLinks: z
    .object({
      twitter: z.string().optional(),
      linkedin: z.string().optional(),
      github: z.string().optional(),
      instagram: z.string().optional(),
      facebook: z.string().optional(),
      youtube: z.string().optional(),
      website: z.string().optional(),
    })
    .optional(),
  privacySettings: z.any().optional(),
});

// zodスキーマから型を推論
type ProfileFormData = z.infer<typeof profileFormSchema>;

export default function ProfileScreen() {
  const { isLoaded, user } = useUser();
  const { signOut } = useClerk();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Convexプロフィールを取得
  const convexProfile = useQuery(api.index.current);

  // Clerkメタデータを取得
  const metadata = user?.unsafeMetadata as ClerkUnsafeMetadata | null;

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
    if (user && !isEditing) {
      form.reset({
        name: user.fullName || '',
        avatarUrl: user.imageUrl || '',
        socialLinks: metadata?.socialLinks ?? {},
        privacySettings: (metadata?.privacySettings as any) ?? {},
      });
    }
  }, [user, metadata, isEditing, form.reset]);

  const handleSignOut = async () => {
    Alert.alert(
      PROFILE_CONSTANTS.ALERTS.SIGN_OUT_TITLE,
      PROFILE_CONSTANTS.ALERTS.SIGN_OUT_MESSAGE,
      [
        { text: PROFILE_CONSTANTS.ALERTS.CANCEL, style: 'cancel' },
        {
          text: PROFILE_CONSTANTS.ALERTS.SIGN_OUT_CONFIRM,
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/(auth)');
            } catch {
              Alert.alert('Error', PROFILE_CONSTANTS.ALERTS.SIGN_OUT_ERROR);
            }
          },
        },
      ]
    );
  };

  const handleSubmit = async (data: ProfileFormData) => {
    if (!user) {
      return;
    }
    setIsLoading(true);
    try {
      // 名前の更新（firstName/lastNameに分割）
      const nameParts = data.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Clerkのユーザー情報を更新
      await user.update({
        firstName,
        lastName,
      });

      // メタデータの更新
      const updatedMetadata = mergeUnsafeMetadata(metadata ?? {}, {
        socialLinks: data.socialLinks,
        privacySettings: data.privacySettings as any,
      });
      await user.update({
        unsafeMetadata: updatedMetadata,
      });

      // 変更を反映するためにユーザー情報をリロード
      await user.reload();

      Alert.alert('成功', PROFILE_CONSTANTS.ALERTS.PROFILE_UPDATE_SUCCESS);
      setIsEditing(false);
    } catch {
      Alert.alert('エラー', PROFILE_CONSTANTS.ALERTS.PROFILE_UPDATE_ERROR);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      form.reset({
        name: user.fullName || '',
        avatarUrl: user.imageUrl || '',
        socialLinks: metadata?.socialLinks ?? {},
        privacySettings: (metadata?.privacySettings as any) ?? {},
      });
    }
    setIsEditing(false);
  };

  if (!isLoaded || !user || !convexProfile) {
    return (
      <View className='flex-1 items-center justify-center bg-white'>
        <Text className='text-gray-600'>{PROFILE_CONSTANTS.LOADING_TEXT}</Text>
      </View>
    );
  }

  const watchedAvatarUrl = form.watch('avatarUrl');
  const avatarUrl = watchedAvatarUrl || user.imageUrl;

  return (
    <KeyboardAvoidingView
      className='flex-1 bg-white'
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView className='flex-1' contentContainerStyle={{ paddingBottom: 100 }}>
        <View className='px-6 py-8'>
          <View className='flex-row items-center justify-between mb-6'>
            <Text className='text-2xl font-bold text-gray-900'>
              {PROFILE_CONSTANTS.SCREEN_TITLE}
            </Text>
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
                  onPress={form.handleSubmit(handleSubmit)}
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
                  // TODO: Implement avatar upload with Clerk
                  form.setValue('avatarUrl', result.uri);
                  Alert.alert('注意', 'アバターアップロード機能は現在実装中です。');
                }}
                disabled={isLoading}
              />
            ) : (
              <ExpoImage
                source={{ uri: avatarUrl }}
                style={{ width: 96, height: 96, borderRadius: 48, marginBottom: 16 }}
                placeholder='|r--r,L;00jt?w?bfQj[fQj[fQfQfQfQfQ'
                transition={500}
                cachePolicy='disk'
              />
            )}
          </View>

          {/* Name Section */}
          <View className='mb-6'>
            <Text className='text-sm font-medium text-gray-700 mb-2'>
              {PROFILE_CONSTANTS.FORM_LABELS.NAME}
            </Text>
            {isEditing ? (
              <Controller
                control={form.control}
                name='name'
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <View>
                    <TextInput
                      className='w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900'
                      placeholder={PROFILE_CONSTANTS.PLACEHOLDERS.NAME}
                      value={value}
                      onChangeText={onChange}
                      editable={!isLoading}
                    />
                    {error && <Text className='text-red-600 text-sm mt-1'>{error.message}</Text>}
                  </View>
                )}
              />
            ) : (
              <Text className='text-xl font-semibold text-gray-900'>
                {user.fullName || 'No name'}
              </Text>
            )}
          </View>

          {/* Social Links Section */}
          {isEditing && (
            <View className='mb-6'>
              <Text className='text-sm font-medium text-gray-700 mb-2'>
                {PROFILE_CONSTANTS.FORM_LABELS.SOCIAL_LINKS}
              </Text>
              <SocialLinksEditor
                socialLinks={form.watch('socialLinks') ?? metadata?.socialLinks ?? {}}
                onChange={(links) => {
                  form.setValue('socialLinks', links);
                }}
              />
            </View>
          )}

          {/* Privacy Settings Section */}
          {isEditing && (
            <View className='mb-6'>
              <Text className='text-sm font-medium text-gray-700 mb-2'>
                {PROFILE_CONSTANTS.FORM_LABELS.PRIVACY_SETTINGS}
              </Text>
              <PrivacySettingsEditor
                privacySettings={
                  form.watch('privacySettings') ?? (metadata?.privacySettings as any) ?? {}
                }
                onChange={(settings) => {
                  form.setValue('privacySettings', settings);
                }}
              />
            </View>
          )}

          {/* Account Details */}
          <View className='space-y-4'>
            <View className='bg-gray-50 p-4 rounded-lg'>
              <Text className='text-sm font-medium text-gray-700 mb-1'>
                {PROFILE_CONSTANTS.FORM_LABELS.EMAIL}
              </Text>
              <Text className='text-base text-gray-900'>
                {user.emailAddresses[0]?.emailAddress ?? 'Not set'}
              </Text>
            </View>

            <View className='bg-gray-50 p-4 rounded-lg'>
              <Text className='text-sm font-medium text-gray-700 mb-1'>
                {PROFILE_CONSTANTS.FORM_LABELS.ROLE}
              </Text>
              <Text className='text-base text-gray-900 capitalize'>{convexProfile.role}</Text>
            </View>

            <View className='bg-gray-50 p-4 rounded-lg'>
              <Text className='text-sm font-medium text-gray-700 mb-1'>
                {PROFILE_CONSTANTS.FORM_LABELS.MEMBER_SINCE}
              </Text>
              <Text className='text-base text-gray-600'>
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </Text>
            </View>

            {/* Export Profile Button */}
            <TouchableOpacity
              className='bg-gray-600 p-4 rounded-lg mt-4 flex-row items-center justify-center'
              onPress={() => {
                // React NativeでのエクスポートはファイルシステムAPIを使用
                Alert.alert(
                  'プロフィールエクスポート',
                  PROFILE_CONSTANTS.ALERTS.EXPORT_COMING_SOON
                );
              }}
              disabled={isLoading}
            >
              <Download size={20} color='white' />
              <Text className='ml-2 text-center font-semibold text-white'>
                {PROFILE_CONSTANTS.BUTTONS.EXPORT_PROFILE}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className='bg-red-600 p-4 rounded-lg mt-6'
              onPress={handleSignOut}
              disabled={isLoading}
            >
              <Text className='text-center font-semibold text-white'>
                {PROFILE_CONSTANTS.BUTTONS.SIGN_OUT}
              </Text>
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
          Alert.prompt(
            PROFILE_CONSTANTS.SOCIAL_LINKS.ADD_LINK_PROMPT,
            PROFILE_CONSTANTS.ALERTS.URL_PROMPT,
            (url) => {
              if (url) {
                // URLからプラットフォームを推測する処理
                const newLinks = { ...links, twitter: url }; // 簡易実装
                setLinks(newLinks);
                onChange(newLinks);
              }
            }
          );
        }}
      >
        <Plus size={16} color='#3b82f6' />
        <Text className='ml-2 text-blue-600 text-sm'>{PROFILE_CONSTANTS.BUTTONS.ADD_LINK}</Text>
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

  const privacyOptions = PROFILE_CONSTANTS.PRIVACY_OPTIONS;

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
