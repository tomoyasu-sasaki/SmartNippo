'use client';

import { useConvexAuth, useQuery, useMutation } from 'convex/react';
import { api } from "../../../../../convex/_generated/api";
import { ProfileForm } from './profile-form';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Download,
  Globe,
  Github,
  Twitter,
  Linkedin,
  Instagram,
  Youtube,
  Lock,
  Users,
  Building,
  Eye,
  X
} from 'lucide-react';
import {
  type PrivacyLevel,
  SOCIAL_PLATFORMS,
  getSocialIcon,
  validateSocialUrl,
  extractUsername,
  generateSocialUrl,
  PRIVACY_LEVELS,
  PRIVACY_PRESETS,
  createProfileExport
} from '@smartnippo/lib';

export default function ProfilePage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();

  // Fetch user profile from Convex
  const userProfile = useQuery(api.users.current);
  const storeUser = useMutation(api.users.store);

  console.log("🔍 Convex Auth State:", {
    isAuthenticated,
    isLoading,
    userProfile
  });

  // Handle authentication state
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log("❌ Not authenticated with Convex, redirecting to /");
      router.push("/");
      return;
    }

    // Auto-create user if not exists and authenticated
    if (isAuthenticated && userProfile === null) {
      console.log("⚠️ No userProfile found, attempting to create via store mutation");
      storeUser()
        .then(() => {
          console.log("✅ Successfully created user profile");
        })
        .catch((error) => {
          console.error("❌ Error creating user profile:", error);
        });
    }
  }, [isLoading, isAuthenticated, userProfile, router, storeUser]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl py-8 px-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show authentication required
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto max-w-4xl py-8 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="text-muted-foreground">Please log in to access your profile.</p>
        </div>
      </div>
    );
  }

  // Show profile creation in progress
  if (userProfile === null) {
    return (
      <div className="container mx-auto max-w-4xl py-8 px-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Setting up your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show profile not found error (should not happen with auto-creation)
  if (userProfile === undefined) {
    return (
      <div className="container mx-auto max-w-4xl py-8 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Profile Error</h1>
          <p className="text-muted-foreground">Unable to load your profile. Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your profile information and preferences
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your profile details</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm initialData={userProfile} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Social Links</CardTitle>
            <CardDescription>Connect your social media profiles</CardDescription>
          </CardHeader>
          <CardContent>
            <SocialLinksSection userProfile={userProfile} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Privacy Settings</CardTitle>
            <CardDescription>Control who can see your information</CardDescription>
          </CardHeader>
          <CardContent>
            <PrivacySettingsSection userProfile={userProfile} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Export Profile</CardTitle>
            <CardDescription>Download your profile data</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileExportSection userProfile={userProfile} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                <p className="text-sm">{userProfile.email ?? "Not set"}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Role</Label>
                <p className="text-sm capitalize">{userProfile.role}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Member Since</Label>
                <p className="text-sm">
                  {new Date(userProfile.created_at).toLocaleDateString()}
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
function SocialLinksSection({ userProfile }: { userProfile: any }) {
  const [socialLinks, setSocialLinks] = useState(userProfile.socialLinks ?? {});
  const [isEditing, setIsEditing] = useState(false);
  const updateProfile = useMutation(api.users.updateProfile);

  const handleAddLink = (platform: string, url: string) => {
    if (!validateSocialUrl(platform, url)) {
      toast.error('無効なURLです');
      return;
    }

    setSocialLinks({ ...socialLinks, [platform]: url });
  };

  const handleRemoveLink = (platform: string) => {
    const newLinks = { ...socialLinks };
    delete newLinks[platform];
    setSocialLinks(newLinks);
  };

  const handleSave = async () => {
    try {
      await updateProfile({
        socialLinks,
        _version: userProfile.updated_at,
      });
      toast.success('ソーシャルリンクを更新しました');
      setIsEditing(false);
    } catch (error) {
      toast.error('更新に失敗しました');
    }
  };

  return (
    <div className="space-y-4">
      {Object.entries(socialLinks).map(([platform, url]) => (
        <div key={platform} className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getSocialIcon(platform as any)}
            <span className="text-sm">{url as string}</span>
          </div>
          {isEditing && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleRemoveLink(platform)}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}

      {isEditing && (
        <div className="space-y-2">
          <Label>Add Social Link</Label>
          <div className="flex space-x-2">
            <Select onValueChange={(platform) => {
              const url = prompt(`Enter your ${platform} URL:`);
              if (url) {handleAddLink(platform, url);}
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select platform" />
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

      <div className="flex justify-end space-x-2">
        {isEditing ? (
          <>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </>
        ) : (
          <Button onClick={() => setIsEditing(true)}>Edit</Button>
        )}
      </div>
    </div>
  );
}

// プライバシー設定セクション
function PrivacySettingsSection({ userProfile }: { userProfile: any }) {
  const [privacySettings, setPrivacySettings] = useState(
    userProfile.privacySettings ?? {}
  );
  const updateProfile = useMutation(api.users.updateProfile);

  const handlePrivacyChange = (key: string, value: PrivacyLevel) => {
    setPrivacySettings({ ...privacySettings, [key]: value });
  };

  const handleSave = async () => {
    try {
      await updateProfile({
        privacySettings,
        _version: userProfile.updated_at,
      });
      toast.success('プライバシー設定を更新しました');
    } catch (error) {
      toast.error('更新に失敗しました');
    }
  };

  const privacyOptions = [
    { key: 'profile', label: 'プロフィール全体' },
    { key: 'email', label: 'メールアドレス' },
    { key: 'socialLinks', label: 'ソーシャルリンク' },
    { key: 'reports', label: '日報' },
  ];

  return (
    <div className="space-y-4">
      {privacyOptions.map(({ key, label }) => (
        <div key={key} className="flex items-center justify-between">
          <Label>{label}</Label>
          <Select
            value={privacySettings[key] ?? 'organization'}
            onValueChange={(value) => handlePrivacyChange(key, value as PrivacyLevel)}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PRIVACY_LEVELS).map(([level, { label, icon }]) => (
                <SelectItem key={level} value={level}>
                  <div className="flex items-center space-x-2">
                    {icon}
                    <span>{label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}

      <div className="flex justify-end">
        <Button onClick={handleSave}>Save Settings</Button>
      </div>
    </div>
  );
}

// プロフィールエクスポートセクション
function ProfileExportSection({ userProfile }: { userProfile: any }) {
  const handleExport = () => {
    const exportData = createProfileExport(userProfile);
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `profile-${userProfile.name.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('プロフィールをエクスポートしました');
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        プロフィールデータをJSON形式でダウンロードできます。
      </p>
      <Button onClick={handleExport} className="w-full">
        <Download className="mr-2 h-4 w-4" />
        Export Profile
      </Button>
    </div>
  );
}
