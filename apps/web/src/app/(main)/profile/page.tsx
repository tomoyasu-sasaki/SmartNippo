'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  exportProfile,
  getSocialIcon,
  mergeUnsafeMetadata,
  PRIVACY_LEVELS,
  PROFILE_CONSTANTS,
  SOCIAL_PLATFORMS,
  validateSocialUrl,
  type ClerkUnsafeMetadata,
  type PrivacyLevel,
  type PrivacySettings,
  type SocialPlatform,
} from '@smartnippo/lib';

import { ProfileForm } from '@/components/features/profile/profile-form';
import { useUser } from '@clerk/nextjs';
import { isClerkAPIResponseError } from '@clerk/nextjs/errors';
import type { UnifiedUserProfile } from '@smartnippo/types';
import { api } from 'convex/_generated/api';
import { useQuery } from 'convex/react';
import { Download, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  // Fetch user profile from Convex
  const convexProfile = useQuery(api.index.current);

  // Handle authentication state
  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/');
    }
  }, [isLoaded, user, router]);

  // Show loading state
  if (!isLoaded || !convexProfile) {
    return (
      <div className='container mx-auto max-w-4xl py-8 px-4'>
        <div className='flex items-center justify-center h-64'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4'></div>
            <p className='text-muted-foreground'>{PROFILE_CONSTANTS.LOADING}</p>
          </div>
        </div>
      </div>
    );
  }

  // Show authentication required
  if (!user) {
    return (
      <div className='container mx-auto max-w-4xl py-8 px-4'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold mb-4'>{PROFILE_CONSTANTS.AUTH_REQUIRED_TITLE}</h1>
          <p className='text-muted-foreground'>{PROFILE_CONSTANTS.AUTH_REQUIRED_DESCRIPTION}</p>
        </div>
      </div>
    );
  }

  // Parse Clerk metadata
  const metadata = user.unsafeMetadata as ClerkUnsafeMetadata | null;

  // Create unified profile
  const unifiedProfile = {
    id: user.id,
    convexId: convexProfile._id,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: user.fullName,
    emailAddress: user.emailAddresses[0]?.emailAddress || null,
    emailAddresses: user.emailAddresses.map((email) => ({
      id: email.id!,
      emailAddress: email.emailAddress!,
      verified: email.verification?.status === 'verified',
      primary: user.primaryEmailAddressId === email.id,
    })),
    imageUrl: user.imageUrl,
    phoneNumber: user.phoneNumbers[0]?.phoneNumber || null,
    role: convexProfile.role,
    orgId: convexProfile.orgId,
    pushToken: convexProfile.pushToken,
    avatarStorageId: convexProfile.avatarStorageId,
    createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
    updatedAt: user.updatedAt ? new Date(user.updatedAt) : new Date(),
    convexCreatedAt: new Date(convexProfile.created_at),
    convexUpdatedAt: new Date(convexProfile.updated_at),
  } as UnifiedUserProfile;

  // Set optional properties conditionally
  if (metadata?.socialLinks) {
    unifiedProfile.socialLinks = metadata.socialLinks as Record<string, string>;
  }
  if (metadata?.privacySettings) {
    unifiedProfile.privacySettings = metadata.privacySettings as unknown as PrivacySettings;
  }
  if (metadata?.preferences) {
    unifiedProfile.preferences = metadata.preferences as any;
  }
  if (metadata?.notifications) {
    unifiedProfile.notifications = metadata.notifications as any;
  }

  return (
    <div className='container mx-auto max-w-4xl py-8 px-4'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold'>{PROFILE_CONSTANTS.PAGE_TITLE}</h1>
        <p className='text-muted-foreground mt-2'>{PROFILE_CONSTANTS.PAGE_DESCRIPTION}</p>
      </div>

      <div className='grid gap-6'>
        <Card>
          <CardHeader>
            <CardTitle>{PROFILE_CONSTANTS.PERSONAL_INFO_CARD_TITLE}</CardTitle>
            <CardDescription>{PROFILE_CONSTANTS.PERSONAL_INFO_CARD_DESCRIPTION}</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm initialData={unifiedProfile} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{PROFILE_CONSTANTS.SOCIAL_LINKS_CARD_TITLE}</CardTitle>
            <CardDescription>{PROFILE_CONSTANTS.SOCIAL_LINKS_CARD_DESCRIPTION}</CardDescription>
          </CardHeader>
          <CardContent>
            <SocialLinksSection user={user} metadata={metadata} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{PROFILE_CONSTANTS.PRIVACY_SETTINGS_CARD_TITLE}</CardTitle>
            <CardDescription>{PROFILE_CONSTANTS.PRIVACY_SETTINGS_CARD_DESCRIPTION}</CardDescription>
          </CardHeader>
          <CardContent>
            <PrivacySettingsSection user={user} metadata={metadata} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{PROFILE_CONSTANTS.EXPORT_PROFILE_CARD_TITLE}</CardTitle>
            <CardDescription>{PROFILE_CONSTANTS.EXPORT_PROFILE_CARD_DESCRIPTION}</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileExportSection unifiedProfile={unifiedProfile} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{PROFILE_CONSTANTS.ACCOUNT_DETAILS_CARD_TITLE}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              <div>
                <Label className='text-sm font-medium text-muted-foreground'>
                  {PROFILE_CONSTANTS.EMAIL_LABEL}
                </Label>
                <p className='text-sm'>
                  {user.emailAddresses[0]?.emailAddress ?? PROFILE_CONSTANTS.EMAIL_NOT_SET}
                </p>
              </div>
              <div>
                <Label className='text-sm font-medium text-muted-foreground'>
                  {PROFILE_CONSTANTS.ROLE_LABEL}
                </Label>
                <p className='text-sm capitalize'>{convexProfile.role}</p>
              </div>
              <div>
                <Label className='text-sm font-medium text-muted-foreground'>
                  {PROFILE_CONSTANTS.MEMBER_SINCE_LABEL}
                </Label>
                <p className='text-sm'>
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ソーシャルリンク管理セクション
function SocialLinksSection({
  user,
  metadata,
}: {
  user: NonNullable<ReturnType<typeof useUser>['user']>;
  metadata: ClerkUnsafeMetadata | null;
}) {
  const [socialLinks, setSocialLinks] = useState(metadata?.socialLinks ?? {});
  const [isEditing, setIsEditing] = useState(false);

  const handleAddLink = (platform: string, url: string) => {
    const validation = validateSocialUrl(platform as SocialPlatform, url);
    if (!validation.isValid) {
      toast.error(validation.error ?? PROFILE_CONSTANTS.INVALID_URL_ERROR);
      return;
    }

    setSocialLinks({ ...socialLinks, [platform]: validation.normalizedUrl ?? url });
  };

  const handleRemoveLink = (platform: string) => {
    const newLinks = { ...socialLinks };
    delete (newLinks as Record<string, string>)[platform];
    setSocialLinks(newLinks);
  };

  const handleSave = async () => {
    try {
      // Clerkのunsafeメタデータを更新
      const updatedMetadata = mergeUnsafeMetadata(metadata ?? {}, { socialLinks });
      await user.update({
        unsafeMetadata: updatedMetadata,
      });
      await user.reload();
      toast.success(PROFILE_CONSTANTS.UPDATE_SOCIAL_LINKS_SUCCESS);
      setIsEditing(false);
    } catch (error) {
      if (isClerkAPIResponseError(error)) {
        toast.error(error.errors[0]?.message || PROFILE_CONSTANTS.UPDATE_ERROR);
      } else {
        toast.error(PROFILE_CONSTANTS.UPDATE_ERROR);
      }
    }
  };

  return (
    <div className='space-y-4'>
      {Object.entries(socialLinks).map(([platform, url]) => (
        <div key={platform} className='flex items-center justify-between'>
          <div className='flex items-center space-x-3'>
            {getSocialIcon(platform as SocialPlatform)}
            <span className='text-sm'>{url as string}</span>
          </div>
          {isEditing && (
            <Button size='sm' variant='ghost' onClick={() => handleRemoveLink(platform)}>
              <X className='h-4 w-4' />
            </Button>
          )}
        </div>
      ))}

      {isEditing && (
        <div className='space-y-2'>
          <Label>{PROFILE_CONSTANTS.ADD_SOCIAL_LINK_LABEL}</Label>
          <div className='flex space-x-2'>
            <Select
              onValueChange={(platform) => {
                const url = prompt(PROFILE_CONSTANTS.PROMPT_URL(platform));
                if (url) {
                  handleAddLink(platform, url);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={PROFILE_CONSTANTS.SELECT_PLATFORM_PLACEHOLDER} />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SOCIAL_PLATFORMS).map(([key, { name }]) => (
                  <SelectItem key={key} value={key}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <div className='flex justify-end space-x-2'>
        {isEditing ? (
          <>
            <Button variant='outline' onClick={() => setIsEditing(false)}>
              {PROFILE_CONSTANTS.CANCEL_BUTTON}
            </Button>
            <Button onClick={handleSave} variant='outline'>
              {PROFILE_CONSTANTS.SAVE_BUTTON}
            </Button>
          </>
        ) : (
          <Button onClick={() => setIsEditing(true)} variant='outline'>
            {PROFILE_CONSTANTS.EDIT_BUTTON}
          </Button>
        )}
      </div>
    </div>
  );
}

// プライバシー設定セクション
function PrivacySettingsSection({
  user,
  metadata,
}: {
  user: NonNullable<ReturnType<typeof useUser>['user']>;
  metadata: ClerkUnsafeMetadata | null;
}) {
  const [privacySettings, setPrivacySettings] = useState(metadata?.privacySettings ?? {});

  const handlePrivacyChange = (key: string, value: PrivacyLevel) => {
    setPrivacySettings({ ...privacySettings, [key]: value });
  };

  const handleSave = async () => {
    try {
      // Clerkのunsafeメタデータを更新
      const updatedMetadata = mergeUnsafeMetadata(metadata ?? {}, { privacySettings });
      await user.update({
        unsafeMetadata: updatedMetadata,
      });
      await user.reload();
      toast.success(PROFILE_CONSTANTS.UPDATE_PRIVACY_SUCCESS);
    } catch (error) {
      if (isClerkAPIResponseError(error)) {
        toast.error(error.errors[0]?.message || PROFILE_CONSTANTS.UPDATE_ERROR);
      } else {
        toast.error(PROFILE_CONSTANTS.UPDATE_ERROR);
      }
    }
  };

  const privacyOptions = [
    { key: 'profile', label: PROFILE_CONSTANTS.PRIVACY_OPTION_PROFILE },
    { key: 'email', label: PROFILE_CONSTANTS.PRIVACY_OPTION_EMAIL },
    { key: 'socialLinks', label: PROFILE_CONSTANTS.PRIVACY_OPTION_SOCIAL_LINKS },
    { key: 'reports', label: PROFILE_CONSTANTS.PRIVACY_OPTION_REPORTS },
  ];

  return (
    <div className='space-y-4'>
      {privacyOptions.map(({ key, label }) => (
        <div key={key} className='flex items-center justify-between'>
          <Label>{label}</Label>
          <Select
            value={(privacySettings as Record<string, string>)[key] ?? 'organization'}
            onValueChange={(value) => handlePrivacyChange(key, value as PrivacyLevel)}
          >
            <SelectTrigger className='w-48'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PRIVACY_LEVELS).map(([level, { label, icon }]) => (
                <SelectItem key={level} value={level}>
                  <div className='flex items-center space-x-2'>
                    {icon}
                    <span>{label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}

      <div className='flex justify-end'>
        <Button onClick={handleSave} variant='outline'>
          {PROFILE_CONSTANTS.SAVE_SETTINGS_BUTTON}
        </Button>
      </div>
    </div>
  );
}

// プロフィールエクスポートセクション
function ProfileExportSection({ unifiedProfile }: { unifiedProfile: UnifiedUserProfile }) {
  const handleExport = () => {
    // Convert UserProfile to ProfileExportData format
    const exportData = {
      profile: {
        name: unifiedProfile.fullName ?? '',
        email: unifiedProfile.emailAddress ?? '',
        role: unifiedProfile.role,
        avatarUrl: unifiedProfile.imageUrl ?? '',
        created_at: unifiedProfile.createdAt.toISOString(),
        updated_at: unifiedProfile.updatedAt.toISOString(),
      },
      socialLinks: Object.entries(unifiedProfile.socialLinks ?? {})
        .filter(([, url]) => url !== undefined)
        .map(([platformKey, url]) => ({
          platform: platformKey as SocialPlatform,
          url: (url ?? '') as string,
        })),
      privacySettings: unifiedProfile.privacySettings ?? ({} as any),
      reports: [],
      profileHistory: [],
      organization: {
        name: '',
        plan: '',
        joined_at: '',
      },
      exportMetadata: {
        exportedAt: new Date().toISOString(),
        format: 'json' as const,
        version: '1.0',
        requestedBy: 'user',
        includesPersonalData: true,
      },
    };

    const { content, filename, mimeType } = exportProfile(exportData);
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(PROFILE_CONSTANTS.EXPORT_SUCCESS);
  };

  return (
    <div className='space-y-4'>
      <p className='text-sm text-muted-foreground'>{PROFILE_CONSTANTS.EXPORT_DESCRIPTION}</p>
      <Button onClick={handleExport} className='w-full' variant='outline'>
        <Download className='mr-2 h-4 w-4' />
        {PROFILE_CONSTANTS.EXPORT_BUTTON}
      </Button>
    </div>
  );
}
