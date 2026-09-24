import { NextResponse, type NextRequest } from 'next/server';
import { DASHBOARD_ROUTE_PREFIXES } from '@/config/navigation';
import { env, sessionCookieName } from '@/lib/env';

// This runs on the Next.js server before a page is sent. It is a convenience,
// not a security layer: the access token lives in browser memory, so this file
// can only see the refresh cookie. The real locks are `authenticate` and
// `requirePermission` on the API.

function isDashboardPath(pathname: string): boolean {
  return DASHBOARD_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function middleware(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl;
  if (!isDashboardPath(pathname)) return NextResponse.next();

  // The sample session has no cookie, so the guard would send the founder
  // straight back to /login and the shell could never be opened.
  if (env.previewSession) return NextResponse.next();

  const hasSession = request.cookies.has(sessionCookieName);
  if (hasSession) return NextResponse.next();

  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('next', `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Static files, images and the Next.js internals never need the check.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
