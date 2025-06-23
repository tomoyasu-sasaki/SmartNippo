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
export * from './utils';
export * from './validation';

// Explicitly export schemas (excluding duplicates already exported above)
export {
  ProfileUpdateSchema,
  SocialLinksSchema,
  UserProfileSchema,
  profileFormSchema,
} from './schemas/user-profile';

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

// TODO: Implement utility functions in future sections
// export { formatDate } from "./utils/date";
// export { validateEmail } from "./utils/validation";
// export { classNames } from "./utils/classNames";

// TODO: Export types when utility functions are implemented
// export type { DateFormat } from "./utils/date";
// export type { ValidationResult } from "./utils/validation";
