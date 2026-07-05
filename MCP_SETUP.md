# MCP / Plugin Setup

Required MCPs/plugins for autonomous work:

- GitHub: repo changes, PRs, issues, workflow logs.
- Vercel: deployments, env checks, build logs.
- Filesystem: local repo inspection.
- Browser / Playwright: visual QA and user-flow testing.
- Shopify: store/product/cart data when this repo is storefront-related.
- Database: Neon, Supabase, or Postgres when persistence is required.
- Slack: team handoff when workspace access is approved.
- Gmail / Calendar: client communication only when explicitly authorized.

Optional: Figma, Canva, Adobe, Stripe, Google Drive, Replit, Cursor, Codex.

## Security

Never commit secrets, API keys, tokens, `.env`, credentials, or private customer data. Use env vars only. Do not fake integrations; document missing access.

## Env placeholders

```bash
GITHUB_TOKEN=
VERCEL_TOKEN=
SHOPIFY_STORE_DOMAIN=
SHOPIFY_ADMIN_ACCESS_TOKEN=
SHOPIFY_STOREFRONT_ACCESS_TOKEN=
DATABASE_URL=
SLACK_BOT_TOKEN=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
STRIPE_SECRET_KEY=
```
