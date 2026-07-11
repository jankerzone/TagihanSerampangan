# 💰 TagihanSerampangan

[![Ask DeepWiki](https://devin.ai/assets/askdeepwiki.png)](https://deepwiki.com/jankerzone/TagihanSerampangan)

Monthly budget and expense tracker with a Telegram bot for logging expenses on the go. Plan a budget per category, track actual spending against it, and watch savings goals progress — with an interface in English or Bahasa Indonesia.

## Features

- **Monthly budgeting** — income sources, budget allocations per category (Zakat, Pajak, Keluarga, Rumah, and your own custom categories), and realization tracking against each allocation
- **Savings goals** — per-goal targets with monthly contributions and progress bars
- **Telegram bot** — link your account once (via a 5-minute expiring code), then log expenses by chatting, e.g. `beli kopi 25rb`, into whichever month you choose
- **Charts** — income allocation pie chart and spending-by-category bar chart (Recharts)
- **Inline editing everywhere** — click any field to edit; keyboard shortcuts (`←`/`→` to switch months, `N` for new item)
- **Data portability** — export/import monthly data as JSON (with ID regeneration to avoid conflicts on import), plus one-click "Copy Previous Month"
- **Dark mode** and per-card gradient color customization

## Tech Stack

| Layer | Stack |
|---|---|
| Frontend | React 18, TypeScript, Vite, TanStack Query, shadcn/ui, Tailwind CSS, Recharts, Lucide |
| Backend | Hono on Cloudflare Workers, Cloudflare D1 (SQLite) |
| Auth | Clerk (Google OAuth, GitHub, Magic Link) with JWT verification on the worker |
| Bot | Telegram Bot API via webhook |

The repo is split in two: the frontend at the root, the Worker in `worker/`.

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm
- A Clerk account (free tier works)
- A Cloudflare account (for deployment)

### Local Development

1. Clone and install dependencies in both parts:

   ```bash
   git clone https://github.com/jankerzone/TagihanSerampangan.git
   cd TagihanSerampangan
   pnpm install
   cd worker && pnpm install && cd ..
   ```

2. Create a Clerk application at [clerk.com](https://clerk.com) and grab the Publishable Key and Secret Key.

3. Configure the frontend — create `.env` in the root:

   ```env
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
   VITE_API_URL=http://localhost:8787
   ```

4. Configure the worker — set the publishable keys in `worker/wrangler.toml`:

   ```toml
   [vars]
   CLERK_PUBLISHABLE_KEY = "pk_live_your_clerk_prod_key"
   CLERK_PUBLISHABLE_KEY_DEV = "pk_test_your_clerk_dev_key"
   ```

   The secret key goes into Wrangler's secret store, **not** into wrangler.toml:

   ```bash
   cd worker
   echo "your_clerk_secret_key" | npx wrangler secret put CLERK_SECRET_KEY
   cd ..
   ```

5. Run both dev servers (two terminals):

   ```bash
   # Terminal 1 — worker API on http://localhost:8787
   cd worker && pnpm run dev

   # Terminal 2 — frontend on http://localhost:8081
   pnpm run dev
   ```

## Deployment

1. Deploy the worker:

   ```bash
   cd worker && npx wrangler deploy
   ```

2. Point the frontend at the deployed worker — create `.env.production` in the root:

   ```env
   VITE_API_URL=https://your-worker.your-subdomain.workers.dev
   ```

3. Build and deploy the frontend to Cloudflare Pages:

   ```bash
   pnpm deploy
   ```

## Telegram Bot Setup

1. Create a bot via [@BotFather](https://t.me/BotFather) and copy the token.

2. Add the token to `worker/wrangler.toml`:

   ```toml
   [vars]
   # ... other vars
   TELEGRAM_BOT_TOKEN = "your_bot_token_here"
   ```

3. Set a webhook verification secret (any random string):

   ```bash
   cd worker
   echo "your_random_secret_string" | npx wrangler secret put TELEGRAM_SECRET_TOKEN
   cd ..
   ```

4. Deploy the worker (`npx wrangler deploy`), then register the webhook:

   ```bash
   curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://your-worker.workers.dev/telegram/webhook&secret_token=<YOUR_RANDOM_SECRET>"
   ```

5. In the web app, go to **Settings → Link Telegram Bot**, click **Generate Link Code**, and send the `/link YOUR_CODE` command to your bot. From then on, messages like `beli kopi 25rb` get logged as expenses.

## Usage Notes

- **Income and budget items** are added via the "+" buttons on the dashboard; everything saves as you type.
- **Export Data** (user avatar menu, top right) downloads a JSON backup of the current month; **Import Data** restores it. **Copy Previous Month** clones last month's structure as a starting template.
- **Customization** lives in Settings: dashboard card colors (10 gradient presets), expense categories, and language (English / Bahasa Indonesia).

## Security

- Auth handled by Clerk; the worker verifies JWTs on every API call
- Secrets (Clerk secret key, Telegram secret token) live in Wrangler's secret store, never in the repo
- Telegram webhook requests are verified against `TELEGRAM_SECRET_TOKEN`
- All D1 queries use parameterized statements

## Contributing

PRs are welcome — fork, branch, and open a pull request. For bugs or questions, [open an issue](https://github.com/jankerzone/TagihanSerampangan/issues).

## Changelog

### v3.0.0 — Clerk Authentication
- Migrated auth to Clerk (Google OAuth, Magic Link)
- JWT verification between frontend and worker
- Removed legacy auth code

### v2.0.0 — Frontend Refactor
- Glassmorphism UI with sticky blur header
- Gradient color picker (10 presets)
- Income Allocation and Spending charts
- Fixed export/import with ID regeneration
- Shared hooks refactor; data management moved to the UserNav dropdown
- Keyboard shortcuts

### v1.0.0 — Initial Release
- Expense tracking, budget management, savings goals, Telegram bot

## License

MIT

## Author

**Robsan** ([@jankerzone](https://github.com/jankerzone))
