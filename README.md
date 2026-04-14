# PayNoy — Discord QR Payment Bot Platform

A production-grade, multi-tenant SaaS that enables Discord server owners to sell digital products (roles) through PromptPay QR codes powered by Omise.

## Architecture

This is an npm workspaces monorepo:

- `apps/backend`: Fastify server handling Omise payments, webhooks, and BullMQ job queues.
- `apps/bot`: discord.js v14 bot providing the end-user interface (`/setup`, buy buttons).
- `apps/web`: Next.js frontend dashboard for server owners.
- `packages/types`: Shared TypeScript interfaces and DTOs.
- `packages/db`: Supabase client and PostgreSQL schema.

## Production-Grade Features (v2)

- **BullMQ Integration**: Robust role assignment queue backed by Redis with exponential backoff and localized `failed_jobs` tracking.
- **Payment Reconciliation**: 2-minute cron job that verifies pending orders against the Omise API to catch missed webhooks.
- **Webhook Security**: HMAC-SHA256 signature verification combined with event deduplication.
- **Rate Limiting**: Hard limits on pending orders per user/product to prevent abuse, plus global rate limits.
- **Discord Policy Enforcement**: Pre-validates bot role hierarchy before creating orders.
- **Observability**: Pino structured JSON logging equipped with trace-level `request_id`s, plus comprehensive `audit_logs` tracking inside Postgres.

## Setup Instructions

### 1. Database
1. Create a Supabase project.
2. Run the SQL schema using the provided file: `packages/db/schema.sql`
3. Run the migration script: `packages/db/migrations/001_production_upgrade.sql`

### 2. Environment Variables
Copy `.env.example` to `.env` in both `apps/backend` and `apps/bot` and fill in:
- `OMISE_SECRET_KEY` and `OMISE_PUBLIC_KEY`
- `WEBHOOK_SECRET`
- `REDIS_URL`
- `DISCORD_BOT_TOKEN`, `DISCORD_CLIENT_ID`
- `SUPABASE_URL`, `SUPABASE_KEY`

### 3. Install & Build
```bash
npm install
npm run build
```

### 4. Run Development Servers
```bash
# In separate terminals:
npm run dev:backend
npm run dev:bot
npm run dev:web
```

## Deployment
- **Backend & Bot:** Deploy to Railway. Provision a Redis instance for BullMQ.
- **Frontend:** Deploy to Vercel.
- **Omise Webhook:** Point your Omise Dashboard webhook URL to `https://<your-backend-domain>/webhook/omise`.
