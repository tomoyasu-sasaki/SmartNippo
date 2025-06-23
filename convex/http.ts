import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';

const http = httpRouter();

/**
 * ヘルスチェック用エンドポイント
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

export default http;
