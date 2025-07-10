# Clerk Profile Field Mapping Documentation

このドキュメントは、ConvexのuserProfilesテーブルからClerkへのフィールドマッピングを詳細に説明します。

## 概要

ユーザープロフィール情報の管理をConvexからClerkに移行するため、以下のマッピング戦略を採用します：

1. **Clerkの標準フィールド**: 基本的なユーザー情報
2. **unsafeMetadata**: ユーザーが編集可能なカスタム情報
3. **publicMetadata**: システムが管理する情報
4. **Convexに残す情報**: アプリケーション固有の情報

## フィールドマッピング詳細

### 1. Clerkの標準フィールドへ移行

| Convex Field | Clerk Field              | 型     | 説明                                 |
| ------------ | ------------------------ | ------ | ------------------------------------ |
| `name`       | `firstName` + `lastName` | string | フルネームをfirstName/lastNameに分割 |
| `email`      | `emailAddress`           | string | プライマリメールアドレス             |
| `avatarUrl`  | `imageUrl`               | string | プロフィール画像URL                  |

#### 実装詳細：

- `name`フィールドは、スペースで分割して`firstName`と`lastName`に変換
- 分割できない場合は全体を`firstName`に設定
- `imageUrl`はClerkのCDNを通じて配信される

### 2. unsafeMetadata（ユーザー編集可能）へ移行

| Convex Field      | Clerk unsafeMetadata Path        | 型     | 説明                     |
| ----------------- | -------------------------------- | ------ | ------------------------ |
| `socialLinks`     | `unsafeMetadata.socialLinks`     | object | ソーシャルメディアリンク |
| `privacySettings` | `unsafeMetadata.privacySettings` | object | プライバシー設定         |

#### socialLinksの構造：

```typescript
{
  twitter?: string;    // https://twitter.com/username
  linkedin?: string;   // https://linkedin.com/in/username
  github?: string;     // https://github.com/username
  instagram?: string;  // https://instagram.com/username
  facebook?: string;   // https://facebook.com/username
  youtube?: string;    // https://youtube.com/channel/id
  website?: string;    // カスタムウェブサイトURL
}
```

#### privacySettingsの構造：

```typescript
{
  profile?: {
    visibility: 'public' | 'organization' | 'team' | 'private';
    showFullName: boolean;
    showEmail: boolean;
    showAvatar: boolean;
  };
  email?: {
    visibility: 'public' | 'organization' | 'team' | 'private';
    allowContactRequests: boolean;
  };
  socialLinks?: {
    visibility: 'public' | 'organization' | 'team' | 'private';
    platformVisibility?: Record<SocialPlatform, boolean>;
  };
  reports?: {
    visibility: 'public' | 'organization' | 'team' | 'private';
    showWorkDetails: boolean;
    showWorkingHours: boolean;
    showComments: boolean;
  };
  avatar?: {
    visibility: 'public' | 'organization' | 'team' | 'private';
    allowDownload: boolean;
  };
}
```

### 3. publicMetadata（システム管理）へ移行

| Convex Field | Clerk publicMetadata Path | 型                             | 説明           |
| ------------ | ------------------------- | ------------------------------ | -------------- |
| `role`       | `publicMetadata.role`     | 'user' \| 'manager' \| 'admin' | ユーザーロール |

#### 追加のpublicMetadataフィールド：

- `permissions`: string[] - 将来の権限管理用
- `features`: string[] - 有効化された機能フラグ
- `lastActiveAt`: number - 最終アクティビティタイムスタンプ
- `accountStatus`: 'active' | 'suspended' | 'deactivated' - アカウント状態

### 4. Convexに残すフィールド

| Field             | 型      | 説明                 | 理由                 |
| ----------------- | ------- | -------------------- | -------------------- |
| `_id`             | string  | Convex内部ID         | Convex固有           |
| `clerkId`         | string  | ClerkユーザーID      | 紐付けに必要         |
| `orgId`           | string? | 組織ID               | Convexリレーション   |
| `pushToken`       | string? | プッシュ通知トークン | Convex Functions利用 |
| `avatarStorageId` | string? | Convexストレージ参照 | Convex Storage利用   |
| `created_at`      | number  | 作成日時             | Convex固有           |
| `updated_at`      | number  | 更新日時             | Convex固有           |

### 5. 削除するフィールド

| Field             | 理由                |
| ----------------- | ------------------- |
| `tokenIdentifier` | Clerk移行により不要 |

## マイグレーション手順

### 1. データ変換ロジック

```typescript
// Convex userProfile から Clerk メタデータへの変換
function convertToClerkMetadata(userProfile: UserProfile) {
  // 名前の分割
  const nameParts = userProfile.name?.split(' ') || [];
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  return {
    // Clerk標準フィールド
    standardFields: {
      firstName,
      lastName,
      imageUrl: userProfile.avatarUrl,
    },

    // unsafeMetadata
    unsafeMetadata: {
      socialLinks: userProfile.socialLinks,
      privacySettings: userProfile.privacySettings,
    },

    // publicMetadata
    publicMetadata: {
      role: userProfile.role,
    },
  };
}
```

### 2. 逆変換（Clerk → アプリケーション）

```typescript
// ClerkユーザーとConvexデータから統合プロフィールを作成
function createUnifiedProfile(
  clerkUser: ClerkUser,
  convexData: { orgId?: string; pushToken?: string }
) {
  const unsafeMetadata = parseUnsafeMetadata(clerkUser.unsafeMetadata);
  const publicMetadata = parsePublicMetadata(clerkUser.publicMetadata);

  return {
    // 基本情報
    id: clerkUser.id,
    firstName: clerkUser.firstName,
    lastName: clerkUser.lastName,
    fullName: clerkUser.fullName,
    emailAddress: clerkUser.emailAddresses[0]?.emailAddress,
    imageUrl: clerkUser.imageUrl,

    // メタデータ
    socialLinks: unsafeMetadata?.socialLinks,
    privacySettings: unsafeMetadata?.privacySettings,
    preferences: unsafeMetadata?.preferences,
    role: publicMetadata?.role || 'user',

    // Convex固有
    orgId: convexData.orgId,
    pushToken: convexData.pushToken,

    // タイムスタンプ
    createdAt: new Date(clerkUser.createdAt),
    updatedAt: new Date(clerkUser.updatedAt),
  };
}
```

## 注意事項

1. **データ整合性**: マイグレーション中は両方のシステムにデータが存在する可能性があるため、Clerkを信頼できる情報源として扱う

2. **バックワード互換性**: 既存のAPIは統合プロフィールを返すように修正し、クライアントコードの変更を最小限に抑える

3. **プライバシー設定の移行**: 既存のプライバシー設定は完全に保持され、新しい構造に拡張される

4. **ロールの同期**:
   `role`フィールドはClerkのpublicMetadataとConvexの両方に保持し、Webhookで同期する

5. **アバター管理**:
   - 新規アップロード: Convex Storageに保存後、URLをClerkの`imageUrl`に設定
   - 既存アバター: ConvexのURLをそのままClerkに移行

## 検証チェックリスト

- [ ] すべてのフィールドがマッピングされているか確認
- [ ] データ型の互換性を確認
- [ ] プライバシー設定が正しく移行されるか確認
- [ ] ロールと権限が保持されるか確認
- [ ] タイムスタンプが正しく処理されるか確認
