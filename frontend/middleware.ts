import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { UserType } from '@/types/domain.types';

const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'];
const authPathPrefix = '/api/auth';

type TokenPayload = { userType?: UserType; role?: string } | null;

function isPublic(pathname: string) {
  return publicPaths.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

/** Admin Dashboard: only role ADMIN + userType SYSTEM_ADMIN */
function isSystemAdmin(token: TokenPayload) {
  return token?.role === 'ADMIN' && token?.userType === 'SYSTEM_ADMIN';
}

/** Landlord Overview flow: role USER + userType LANDLORD */
function isLandlord(token: TokenPayload) {
  return token?.role === 'USER' && token?.userType === 'LANDLORD';
}

export default withAuth(
  function middleware(req) {
    const pathname = req.nextUrl.pathname;
    if (pathname.startsWith(authPathPrefix)) return NextResponse.next();

    const token = req.nextauth.token as TokenPayload;
    const isAuthenticated = Boolean(req.nextauth.token?.sub) && !(req.nextauth.token as { error?: string } | null)?.error;
    const userType = token?.userType;

    if (pathname === '/') {
      if (isSystemAdmin(token)) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
      if (isLandlord(token)) {
        // Let the home page resolve landlord's single Property Group and redirect to /:pgId/overview
        return NextResponse.next();
      }
      if (userType === 'TENANT') {
        return NextResponse.redirect(new URL('/tenant-use-mobile', req.url));
      }
      return NextResponse.redirect(new URL('/login', req.url));
    }

    if (isPublic(pathname) && isAuthenticated) {
      if (isSystemAdmin(token)) return NextResponse.redirect(new URL('/dashboard', req.url));
      if (isLandlord(token)) return NextResponse.redirect(new URL('/', req.url));
      if (userType === 'TENANT') return NextResponse.redirect(new URL('/tenant-use-mobile', req.url));
      // Authenticated but missing role metadata: keep user off auth pages.
      return NextResponse.redirect(new URL('/', req.url));
    }

    if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
      if (!isAuthenticated || !isSystemAdmin(token)) return NextResponse.redirect(new URL('/login', req.url));
    }

    if (userType === 'TENANT') {
      return NextResponse.redirect(new URL('/tenant-use-mobile', req.url));
    }

    return NextResponse.next();
  },
  {
    pages: { signIn: '/login' },
    callbacks: {
      authorized({ req, token }) {
        const pathname = req.nextUrl.pathname;
        if (pathname.startsWith(authPathPrefix)) return true;
        if (isPublic(pathname)) return true;
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
