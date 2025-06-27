/**
 * @fileoverview HTTP API ルーティング設定
 *
 * @description SmartNippoアプリケーションのHTTP APIエンドポイントを定義します。
 * 外部システムとの連携やヘルスチェックなど、REST APIとして公開される機能を管理します。
 *
 * @since 1.0.0
 */

import type { WebhookEvent } from '@clerk/backend';
import { httpRouter } from 'convex/server';
import { Webhook } from 'svix';
import { internal } from './_generated/api';
import { httpAction } from './_generated/server';

/**
 * Webhook処理の冪等性を保証するためのキー生成
 */
function generateIdempotencyKey(event: WebhookEvent): string {
  return `${event.type}_${event.data.id}_${Date.now()}`;
}

/**
 * Clerk Webhookを処理するためのハンドラ
 * @param {object} ctx - Convexコンテキスト
 * @param {Request} request - HTTPリクエスト
 * @returns {Response} - HTTPレスポンス
 */
const handleClerkWebhook = httpAction(async (ctx, request) => {
  const event = await validateRequest(request);
  if (!event) {
    return new Response('Error occurred', { status: 400 });
  }

  const idempotencyKey = generateIdempotencyKey(event);
  console.log(`Processing webhook: ${event.type} with idempotency key: ${idempotencyKey}`);

  try {
    switch (event.type) {
      case 'user.created':
      case 'user.updated': {
        console.log(`Processing ${event.type} webhook for user: ${event.data.id}`);
        await ctx.runMutation(internal.users.mutations.upsertUserWithIdempotency, {
          clerkUser: event.data,
          idempotencyKey,
          eventType: event.type,
        });
        console.log(`Completed ${event.type} webhook for user: ${event.data.id}`);
        break;
      }
      case 'user.deleted': {
        const { id } = event.data;
        if (!id) {
          return new Response('User ID is undefined', { status: 400 });
        }
        await ctx.runMutation(internal.users.mutations.deleteUser, { id });
        break;
      }
      case 'organization.created':
      case 'organization.updated': {
        console.log('Organization webhook event:', event.type, event.data);
        await ctx.runMutation(internal.organizations.mutations.upsertOrganization, {
          clerkOrganization: event.data,
        });
        break;
      }
      case 'organization.deleted': {
        const { id } = event.data;
        if (!id) {
          return new Response('Organization ID is undefined', { status: 400 });
        }
        await ctx.runMutation(internal.organizations.mutations.deleteOrganization, { id });
        break;
      }
      case 'organizationMembership.created': {
        console.log(
          `Processing organizationMembership.created webhook for user: ${event.data.public_user_data?.user_id}, org: ${event.data.organization?.id}`
        );
        const { organization, public_user_data, role } = event.data;
        if (!public_user_data?.user_id) {
          return new Response('User ID missing in membership event', { status: 400 });
        }
        await ctx.runMutation(internal.users.mutations.updateUserOrgAndRoleWithIdempotency, {
          clerkUserId: public_user_data.user_id,
          clerkOrgId: organization.id,
          role,
          idempotencyKey,
          eventType: event.type,
        });
        console.log(
          `Completed organizationMembership.created webhook for user: ${public_user_data.user_id}`
        );
        break;
      }
      case 'organizationInvitation.accepted': {
        console.log(
          `Processing organizationInvitation.accepted webhook for invitation: ${event.data.id}`
        );

        // Extract data from the accepted invitation
        const { organization_id, email_address, role } = event.data;

        if (organization_id && email_address && role) {
          await ctx.runMutation(internal.users.mutations.ensureUserOrgLinkage, {
            organizationId: organization_id,
            emailAddress: email_address,
            role,
            idempotencyKey,
          });
        } else {
          console.warn('Missing required data in organizationInvitation.accepted event:', {
            organization_id,
            email_address,
            role,
          });
        }

        console.log(
          `Completed organizationInvitation.accepted webhook for invitation: ${event.data.id}`
        );
        break;
      }
      default: {
        console.log('ignored Clerk webhook event', event.type);
      }
    }

    return new Response(null, {
      status: 200,
    });
  } catch (error) {
    console.error(`Error processing webhook ${event.type}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(`Error processing webhook: ${errorMessage}`, { status: 500 });
  }
});

/**
 * HTTP ルーターインスタンス
 *
 * @description アプリケーションの HTTP API エンドポイントを管理するルーターです。
 * 各 API エンドポイントはこのルーターに登録され、外部からアクセス可能になります。
 *
 * @constant
 * @since 1.0.0
 */
const http = httpRouter();

/**
 * Clerk Webhookエンドポイント
 * @route POST /clerk-webhook
 */
http.route({
  path: '/clerk-webhook',
  method: 'POST',
  handler: handleClerkWebhook,
});

/**
 * API ヘルスチェックエンドポイント
 *
 * @description システムの稼働状況を確認するためのヘルスチェック API です。
 * サービスの稼働状態、タイムスタンプ、サービス名を JSON 形式で返します。
 *
 * @route GET /health
 * @returns {Response} ヘルスチェック結果を含む JSON レスポンス
 * @example
 * ```bash
 * curl -X GET https://your-app.convex.site/health
 * ```
 * @example
 * ```json
 * {
 *   "status": "OK",
 *   "timestamp": "2024-01-01T00:00:00.000Z",
 *   "service": "SmartNippo API"
 * }
 * ```
 * @since 1.0.0
 */
http.route({
  path: '/health',
  method: 'GET',
  handler: httpAction(async () => {
    return new Response(
      JSON.stringify({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'SmartNippo API',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }),
});

/**
 * Webhookリクエストの検証
 * @param {Request} req - HTTPリクエスト
 * @returns {Promise<WebhookEvent | null>} - 検証済みイベントまたはnull
 */
async function validateRequest(req: Request): Promise<WebhookEvent | null> {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('CLERK_WEBHOOK_SECRET is not set');
    return null;
  }
  const payloadString = await req.text();
  const svixHeaders = {
    'svix-id': req.headers.get('svix-id')!,
    'svix-timestamp': req.headers.get('svix-timestamp')!,
    'svix-signature': req.headers.get('svix-signature')!,
  };
  const wh = new Webhook(webhookSecret);
  try {
    return wh.verify(payloadString, svixHeaders) as WebhookEvent;
  } catch (error) {
    console.error('Error verifying webhook event', error);
    return null;
  }
}

/**
 * 設定済み HTTP ルーター
 *
 * @description 全ての HTTP API エンドポイントが登録された HTTP ルーターです。
 * Convex によって自動的に処理され、外部からアクセス可能な API として公開されます。
 *
 * @exports httpRouter
 * @since 1.0.0
 */
export default http;
