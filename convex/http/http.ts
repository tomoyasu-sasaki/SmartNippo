/**
 * @fileoverview HTTP API ルーティング設定
 *
 * @description SmartNippoアプリケーションのHTTP APIエンドポイントを定義します。
 * 外部システムとの連携やヘルスチェックなど、REST APIとして公開される機能を管理します。
 *
 * @since 1.0.0
 */

import { httpRouter } from 'convex/server';
import { httpAction } from '../_generated/server';

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
 * 設定済み HTTP ルーター
 *
 * @description 全ての HTTP API エンドポイントが登録された HTTP ルーターです。
 * Convex によって自動的に処理され、外部からアクセス可能な API として公開されます。
 *
 * @exports httpRouter
 * @since 1.0.0
 */
export default http;
