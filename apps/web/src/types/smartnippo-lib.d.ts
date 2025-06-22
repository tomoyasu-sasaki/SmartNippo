declare module '@smartnippo/lib' {
  import type { z } from 'zod';

  export const profileFormSchema: z.ZodSchema<{
    name: string;
    avatarUrl: string;
  }>;

  export const emailSchema: z.ZodString;
  export const passwordSchema: z.ZodString;
  export const userRoleSchema: z.ZodEnum<['viewer', 'user', 'manager', 'admin']>;
  export const reportStatusSchema: z.ZodEnum<['draft', 'submitted', 'approved']>;
  export const dateStringSchema: z.ZodString;
  export const uuidSchema: z.ZodString;
  export const avatarUrlSchema: z.ZodString;

  // Other exports can be added here as needed
}
