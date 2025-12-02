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
npm install

# Generate Prisma client
npx prisma generate

# Push schema to local database
npx prisma db push

# Start development server
npm run dev
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

## License

MIT
