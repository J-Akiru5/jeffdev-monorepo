# n8n Workflow Templates

This directory contains n8n workflow JSON exports that you can import directly
into your n8n instance to automate the JeffDev monorepo ecosystem.

## Prerequisites

- n8n running (via docker-compose or cloud)
- Environment variables configured in n8n (see each workflow's requirements)

## How to Import

1. Open your n8n instance at `http://localhost:5678`
2. Go to **Workflows** → **Add Workflow**
3. Click the **...** menu → **Import from File**
4. Select the JSON file from this directory

## Workflow Index

| File                         | Trigger                    | What It Does                                                                   | Required Env Vars                                                            |
| ---------------------------- | -------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| `release-notifications.json` | Webhook (GitHub release)   | Posts to Discord #changelog, sends newsletter via Resend, tweets announcement  | `DISCORD_WEBHOOK_URL`, `RESEND_API_KEY`, `TWITTER_API_KEY`                   |
| `discord-welcome.json`       | Discord new member         | Sends welcome DM, assigns role, logs to Supabase                               | `DISCORD_BOT_TOKEN`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`                  |
| `waitlist-drip.json`         | Cron (daily)               | Checks Supabase for new waitlist entries, sends drip email sequence via Resend | `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `RESEND_API_KEY`                     |
| `contact-to-discord.json`    | Webhook (contact form)     | Posts contact form submissions to Discord #inquiries                           | `DISCORD_WEBHOOK_URL`                                                        |
| `paypal-events.json`         | Webhook (PayPal forwarded) | Handles subscription lifecycle events with Discord alerts                      | `DISCORD_WEBHOOK_URL`, `RESEND_API_KEY`                                      |
| `weekly-analytics.json`      | Cron (weekly)              | Pulls stats from Supabase/Cosmos DB, sends report to Discord                   | `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `MONGODB_URI`, `DISCORD_WEBHOOK_URL` |

## Architecture Notes

- **Webhook workflows** are triggered by the `N8N_WEBHOOK_URL` endpoint.
  Apps call `publishEvent()` from `@syntaxure-labs/db/webhook-publisher` to fire events.
- **Cron workflows** run on schedules and poll databases directly.
- **Discord workflows** use n8n's native Discord node (requires bot token).
- **Supabase access** uses n8n's PostgreSQL node or HTTP Request node.
