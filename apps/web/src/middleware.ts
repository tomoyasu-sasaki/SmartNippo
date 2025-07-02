import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

/* -------------------------------------------------------------------------- */
/* ① ルート分類                                                                 */
/* -------------------------------------------------------------------------- */

/** 公開ルート (未認証でもアクセス可) */
const isPublicRoute = createRouteMatcher(['/login', '/api/webhooks(.*)']);

/** 追加 : 未認証時に必ずログインへリダイレクトしたい保護ルート */
const isAuthRequiredRoute = createRouteMatcher(['/', '/dashboard(.*)']);

/* -------------------------------------------------------------------------- */
/* ② ミドルウェア本体                                                           */
/* -------------------------------------------------------------------------- */
export default clerkMiddleware(async (auth, req) => {
  /* -------------------------- 認証保護 (従来どおり) ------------------------- */
  if (!isPublicRoute(req)) {
    await auth.protect(); // 認証必須
  }

  const { userId } = await auth();

  /* ----------------------------- 認証ユーザー用 ----------------------------- */

  // ① 認証済みで「/」なら「/dashboard」に自動リダイレクト
  if (userId && req.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // ② 認証済みで公開ルート(/login)へ来たら「/dashboard」へ
  if (userId && isPublicRoute(req)) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  /* ---------------------------- 未認証ユーザー用 ---------------------------- */

  // 🔹 追加: 「/」または「/dashboard…」系に未認証で来た場合は /login へ
  if (!userId && isAuthRequiredRoute(req)) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect_url', req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // (従来) 未認証で、その他の保護ルートに来た場合は /login へ
  if (!userId && !isPublicRoute(req)) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect_url', req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  /* ------------------------------- 通常処理 -------------------------------- */
  return NextResponse.next();
});

/* -------------------------------------------------------------------------- */
/* ③ 適用マッチャー設定 (変更なし)                                             */
/* -------------------------------------------------------------------------- */
export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
