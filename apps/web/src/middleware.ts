import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// 認証が必要なルートを定義
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/reports(.*)',
  '/profile(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  // 保護されたルートの場合は認証を要求
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
