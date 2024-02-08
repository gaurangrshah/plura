import { authMiddleware } from '@clerk/nextjs';

// See https://clerk.com/docs/references/nextjs/auth-middleware -> configuring your Middleware
export default authMiddleware({
  publicRoutes: ['/site', '/api/uploadthing'],
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
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
