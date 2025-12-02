import { NextResponse } from 'next/server';

import { authMiddleware } from '@clerk/nextjs';

// See https://clerk.com/docs/references/nextjs/auth-middleware -> configuring your Middleware
export default authMiddleware({
  publicRoutes: ['/site', '/api/uploadthing'],
  async beforeAuth(auth, req) {},
  async afterAuth(auth, req) {
    // rewrite for domains
    const url = req.nextUrl;
    const searchParams = url.searchParams.toString();
    let hostname = req.headers;

    const pathWithSearchParams = `${url.pathname}${searchParams.length > 0 ? `?${searchParams}` : ''}`;

    const customSubdomain = hostname
      .get('host')
      ?.split(`${process.env.NEXT_PUBLIC_DOMAIN}`)
      .filter(Boolean)[0];

    if (customSubdomain) {
      return NextResponse.rewrite(
        new URL(`/${customSubdomain}${pathWithSearchParams}`, req.url)
      );
    }

    if (url.pathname === '/sign-in' || url.pathname === '/sign-up') {
      return NextResponse.redirect(new URL(`/agency/sign-in`, req.url));
    }

    if (
      url.pathname === '/' ||
      (url.pathname === '/site' && url.host === process.env.NEXT_PUBLIC_DOMAIN)
    ) {
      return NextResponse.rewrite(new URL(`/site`, req.url));
    }

    if (
      url.pathname.startsWith('/agency') ||
      url.pathname.startsWith('/subaccount')
    ) {
      return NextResponse.rewrite(new URL(`${pathWithSearchParams}`, req.url));
    }
  },
});

export const config = {
  // Optimized matcher - only run middleware on routes that need auth or routing
  // This reduces Vercel Edge Function invocations significantly
  matcher: [
    // Protected app routes
    '/agency/:path*',
    '/subaccount/:path*',
    // Auth redirects
    '/sign-in',
    '/sign-up',
    // Root (for subdomain detection)
    '/',
    // API routes (except webhooks and uploadthing which are public)
    '/api/((?!webhook|uploadthing).*)',
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
