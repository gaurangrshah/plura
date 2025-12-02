# Plura

A multi-tenant SaaS platform for agencies to manage sub-accounts, pipelines, funnels, and automations.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** SQLite (local) / Turso (production)
- **ORM:** Prisma with libsql adapter
- **Auth:** Clerk
- **Payments:** Stripe
- **File Uploads:** UploadThing
- **UI:** Tailwind CSS, shadcn/ui

## Getting Started

### Prerequisites

- Node.js 18+
- npm/pnpm
- Turso CLI (for production database management)

### Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
# Database (local development)
DATABASE_URL="file:./prisma/dev.db"

# Database (production - Turso)
TURSO_DATABASE_URL="libsql://your-db.turso.io"
TURSO_AUTH_TOKEN="your-turso-token"

# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_CLIENT_ID=

# UploadThing
UPLOADTHING_SECRET=
UPLOADTHING_APP_ID=

# App
NEXT_PUBLIC_URL=http://localhost:3000
NEXT_PUBLIC_DOMAIN=localhost:3000
NEXT_PUBLIC_SCHEME=http://
```

### Installation

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm exec prisma generate

# Push schema to local database
pnpm exec prisma db push

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Database

### Local Development

Uses SQLite file at `prisma/dev.db`. The app automatically uses this when `TURSO_DATABASE_URL` is not set.

### Production (Turso)

Uses [Turso](https://turso.tech/) - a distributed SQLite database. When `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` are set, the app uses the Turso adapter.

**Setup Turso:**

```bash
# Install CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Login
turso auth login

# Create database
turso db create plura

# Get URL
turso db show plura --url

# Create token
turso db tokens create plura

# Push schema (generate SQL first)
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > schema.sql
turso db shell plura < schema.sql
```

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── (main)/            # Main app routes
│   ├── api/               # API routes
│   └── site/              # Marketing site
├── components/            # React components
├── lib/                   # Utilities and database client
├── prisma/               # Database schema
└── providers/            # React context providers
```

## Deployment

### Vercel

1. Connect GitHub repo to Vercel
2. Add environment variables (see above)
3. Deploy

The build command in `vercel.json`:
```json
{
  "buildCommand": "npx prisma generate && npm run build"
}
```

## Authentication Strategy

### Current State: Clerk

The app currently uses [Clerk](https://clerk.com/) for authentication. Clerk middleware runs on Vercel Edge Functions for every request, which can cause cost spikes at scale.

**Known Issue:** Edge function invocations spike due to middleware running on all routes.

### Migration Plan

#### Phase 1: Optimize Clerk Middleware (Quick Win)

Narrow the middleware matcher to only protected routes:

```typescript
// middleware.ts - BEFORE
export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}

// middleware.ts - AFTER
export const config = {
  matcher: [
    '/agency/:path*',
    '/subaccount/:path*',
    '/api/((?!webhook|uploadthing).*)',
  ],
}
```

**Expected result:** 50-80% reduction in edge function invocations by excluding public pages (landing, pricing, docs).

#### Phase 2: Migrate to NextAuth.js (If Needed)

If costs remain high or Clerk pricing becomes prohibitive, migrate to [NextAuth.js](https://next-auth.js.org/):

| Aspect | Clerk | NextAuth.js |
|--------|-------|-------------|
| Runtime | Edge Functions | Node.js (no edge costs) |
| Cost | Per MAU pricing | Free, open source |
| Database | Clerk-managed | Your database (Turso) |
| Setup | Minimal | More configuration |
| UI | Pre-built components | Build your own or use templates |

**Migration steps:**

1. **Schema changes** - Add to User model:
   ```prisma
   model User {
     // existing fields...
     password      String?
     emailVerified DateTime?
     accounts      Account[]
     sessions      Session[]
   }

   model Account { /* NextAuth schema */ }
   model Session { /* NextAuth schema */ }
   model VerificationToken { /* NextAuth schema */ }
   ```

2. **Install NextAuth:**
   ```bash
   npm install next-auth @auth/prisma-adapter
   ```

3. **Create auth config** at `lib/auth.ts`

4. **Create API route** at `app/api/auth/[...nextauth]/route.ts`

5. **Replace Clerk hooks:**
   - `useAuth()` → `useSession()`
   - `useUser()` → `useSession().data.user`
   - `<SignIn />` → Custom form or NextAuth pages
   - `<UserButton />` → Custom component

6. **Remove middleware** - Check auth in server components instead:
   ```typescript
   // In server components
   import { getServerSession } from "next-auth"
   const session = await getServerSession(authOptions)
   if (!session) redirect("/sign-in")
   ```

7. **Update multi-tenancy logic** - Agency/SubAccount access stays the same, just swap the user ID source.

#### Alternative Options Considered

| Option | Pros | Cons |
|--------|------|------|
| **Lucia Auth** | Lightweight, full control | More DIY, smaller community |
| **Supabase Auth** | RLS built-in, generous free tier | Requires database migration |
| **Better Auth** | Modern DX | Newer, less battle-tested |
| **Kinde** | Multi-tenancy built-in | Still external service costs |

### Recommendation

1. **Immediate:** Implement Phase 1 (optimize middleware matcher)
2. **Monitor:** Track edge function usage for 1-2 weeks
3. **Decide:** If costs still high, proceed with Phase 2 (NextAuth migration)

## Technical Debt

### Typography Inconsistencies

**Status:** Noted
**Priority:** Low
**Effort:** 1-2 hours

Page headings use inconsistent styles across the dashboard:

| Page | Current Style |
|------|---------------|
| Dashboard | `text-4xl` |
| Contacts | `text-4xl p-4` |
| Billing | `text-4xl p-4` |
| Workflows | `text-4xl font-bold` |
| Funnel | `text-3xl mb-8` |
| Pipeline | `text-2xl` |

**Fix:** Create a shared `<PageHeader>` component and refactor all pages to use it.

```tsx
// components/global/page-header.tsx
export function PageHeader({ title, description }: Props) {
  return (
    <div className="mb-6">
      <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
      {description && <p className="text-muted-foreground mt-2">{description}</p>}
    </div>
  )
}
```

## License

MIT
