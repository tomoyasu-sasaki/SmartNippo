/**
 * @fileoverview 組織操作のMutation
 *
 * @description 組織の作成、更新、削除を管理するMutation関数を提供します。
 * Clerk Webhookからの組織データ同期を実装します。
 *
 * @since 1.0.0
 */

import { v } from 'convex/values';
import { internalMutation } from '../_generated/server';

/**
 * [INTERNAL] Clerkから組織を作成または更新
 * @description ClerkのWebhookから受け取ったデータを使用して組織をUPSERTします。
 */
export const upsertOrganization = internalMutation({
  args: {
    clerkOrganization: v.any(),
  },
  handler: async (ctx, { clerkOrganization }) => {
    const { id: clerkId, name, created_by: createdByClerkId } = clerkOrganization;

    console.log('upsertOrganization called with:', {
      clerkId,
      name,
      createdByClerkId,
      fullData: clerkOrganization,
    });

    const orgRecord = await ctx.db
      .query('orgs')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', clerkId))
      .unique();

    if (orgRecord === null) {
      // Create new organization
      const newOrgId = await ctx.db.insert('orgs', {
        clerkId,
        name,
        plan: 'free', // デフォルトプラン
        created_at: Date.now(),
        updated_at: Date.now(),
      });

      // Link the creator to the new organization
      if (createdByClerkId) {
        console.log('Looking for creator with clerkId:', createdByClerkId);
        const creator = await ctx.db
          .query('userProfiles')
          .withIndex('by_clerk_id', (q) => q.eq('clerkId', createdByClerkId))
          .unique();

        if (creator) {
          console.log('Found creator:', creator._id, 'Updating with orgId:', newOrgId);
          await ctx.db.patch(creator._id, {
            orgId: newOrgId,
            role: 'admin', // The creator becomes an admin
            updated_at: Date.now(),
          });
        } else {
          console.warn('Creator not found in userProfiles for clerkId:', createdByClerkId);
          // Note: The creator will be linked via organizationMembership.created event
        }
      } else {
        console.warn('No created_by field in organization webhook data');
        // Note: The creator will be linked via organizationMembership.created event
      }
    } else {
      // Update existing organization
      await ctx.db.patch(orgRecord._id, {
        name,
        updated_at: Date.now(),
      });
    }
  },
});

/**
 * [INTERNAL] Clerkから組織を削除
 * @description ClerkのWebhookから受け取ったIDを使用して組織を削除します。
 */
export const deleteOrganization = internalMutation({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    const orgRecord = await ctx.db
      .query('orgs')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', id))
      .unique();

    if (orgRecord !== null) {
      await ctx.db.delete(orgRecord._id);
    }
  },
});
