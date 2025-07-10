// Utility functions for SmartNippo
// Export shared utility functions here

export const version = '0.1.0';

// Re-export all utilities
export * from './avatar-cache';
export * from './constants';
export * from './date';
export * from './format';
export * from './privacy-settings';
export * from './profile-export';
export * from './social-links';
export * from './validation';

// Re-export specific constants that might not be covered by *
export { PRIVACY_LEVELS } from './privacy-settings';
export { SOCIAL_PLATFORMS } from './social-links';

// Explicitly export schemas (excluding duplicates already exported above)
export {
  ProfileUpdateSchema,
  SocialLinksSchema,
  UserProfileSchema,
  profileFormSchema,
} from './schemas/user-profile';

// Export Clerk metadata schemas and helpers
export {
  ClerkPublicMetadataSchema,
  ClerkPublicMetadataUpdateSchema,
  ClerkUnsafeMetadataSchema,
  ClerkUnsafeMetadataUpdateSchema,
  ConvexToClerkMapping,
  isClerkPublicMetadata,
  isClerkUnsafeMetadata,
  mergeUnsafeMetadata,
  normalizeSocialUrl,
  parsePublicMetadata,
  parsePublicMetadataWithErrors,
  parseUnsafeMetadata,
  parseUnsafeMetadataWithErrors,
  shouldShowField,
} from './schemas/clerk-metadata';

// Explicitly export types that might not be picked up by export *
export type {
  FilteredProfile,
  PrivacyImpactAnalysis,
  PrivacyLevel,
  PrivacyPreset,
  PrivacySettings,
  ProfileElement,
  UserRelationship,
} from './privacy-settings';

export type { SocialLink, SocialLinkPreview, SocialPlatform } from './social-links';

export type {
  DataDeletionRequest,
  ExportFormat,
  ExportOptions,
  ExportStatistics,
  ProfileExportData,
} from './profile-export';

export type {
  ProfileFormData,
  ProfileUpdateData,
  SocialLinks,
  UserProfile,
  UserRole,
} from './schemas/user-profile';

// Export Clerk metadata types
export type {
  ClerkPublicMetadata,
  ClerkPublicMetadataUpdate,
  ClerkUnsafeMetadata,
  ClerkUnsafeMetadataUpdate,
} from './schemas/clerk-metadata';
