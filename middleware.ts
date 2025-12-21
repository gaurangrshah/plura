import { NextResponse } from 'next/server';

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/agency(.*)',
  '/subaccount(.*)',
]);

// Routes that are always public (no auth check needed)
const isPublicRoute = createRouteMatcher([
  '/site(.*)',
  '/api/uploadthing(.*)',
  '/api/webhook(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  const url = req.nextUrl;
  const searchParams = url.searchParams.toString();
  const hostname = req.headers;

  const pathWithSearchParams = `${url.pathname}${searchParams.length > 0 ? `?${searchParams}` : ''}`;

  // Check for custom subdomain
  const customSubdomain = hostname
    .get('host')
    ?.split(`${process.env.NEXT_PUBLIC_DOMAIN}`)
    .filter(Boolean)[0];

  if (customSubdomain) {
    return NextResponse.rewrite(
      new URL(`/${customSubdomain}${pathWithSearchParams}`, req.url)
    );
  }

  // Redirect /sign-in and /sign-up to /agency/sign-in
  if (url.pathname === '/sign-in' || url.pathname === '/sign-up') {
    return NextResponse.redirect(new URL('/agency/sign-in', req.url));
  }

  // Rewrite root to /site
  if (
    url.pathname === '/' ||
    (url.pathname === '/site' && url.host === process.env.NEXT_PUBLIC_DOMAIN)
  ) {
    return NextResponse.rewrite(new URL('/site', req.url));
  }

  // Protect agency and subaccount routes
  if (isProtectedRoute(req) && !isPublicRoute(req)) {
    await auth.protect();
  }

  // Rewrite agency and subaccount routes
  if (
    url.pathname.startsWith('/agency') ||
    url.pathname.startsWith('/subaccount')
  ) {
    return NextResponse.rewrite(new URL(pathWithSearchParams, req.url));
  }
});

export const config = {
  // Optimized matcher - only run middleware on routes that need auth or routing
  // This reduces Vercel Edge Function invocations significantly
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};

/**
 * NOTE: Order of operations
 *
 * 1. Check if the request is for a subdomain that exists (in db?)
 * 1.1. if it does exist route the user to the subdomain along with any query params
 *
 * 2. Check if the user is attempting to login or register
 * 2.1. if they are, route them to the right page (agency/sign-in or agency/sign-up)
 *
 * 3. Is the user trying to access the landing page?
 * 3.1. if they are, route them to the landing page (/site)
 *
 * 4. Is the user trying to access the dashboard?
 * 4.1. if they are, route them to the dashboard
 *
 */
