import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// 認証が必要なルートを定義
const isPublicRoute = createRouteMatcher(['/']);
const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/reports(.*)', '/profile(.*)']);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  // 認証済みで、かつパブリックルート（'/'）にアクセスした場合、ダッシュボードにリダイレクト
  if (userId && isPublicRoute(req)) {
    const dashboardUrl = new URL('/dashboard', req.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // 保護されたルートの場合は認証を要求
  if (isProtectedRoute(req)) {
    await auth.protect();
  }

  // 上記のいずれにも該当しない、または auth.protect() がリダイレクトしない場合、リクエストを続行
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
