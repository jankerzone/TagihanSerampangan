# 💰 TagihanSerampangan
[![Ask DeepWiki](https://devin.ai/assets/askdeepwiki.png)](https://deepwiki.com/jankerzone/TagihanSerampangan)

A beautiful, modern expense tracking and budget management application with real-time Telegram bot integration. Track your income, expenses, savings goals, and get insights through interactive charts.

## ✨ Features

### 📊 Financial Management
- **Income Tracking** - Multiple income sources with inline editing
- **Budget Planning** - Allocate budgets by category (Zakat, Pajak, Keluarga, Rumah, etc.)
- **Expense Tracking** - Track actual spending vs. budget allocations
- **Savings Goals** - Set and track progress toward savings goals
- **Monthly Contributions** - Track monthly savings contributions per goal

### 📈 Data Visualization
- **Income Allocation Pie Chart** - Visual breakdown of income distribution
- **Spending by Category Bar Chart** - Compare spending across categories
- **Budget Progress Indicators** - Real-time budget usage tracking
- **Savings Goal Progress** - Visual progress bars for each goal

### 🤖 Telegram Bot Integration
- **Magic Link Authentication** - Secure bot linking with 5-minute expiring codes
- **Quick Expense Logging** - Add expenses directly from Telegram
- **Month Selection** - Choose which month to log expenses to
- **Auto-Save to Database** - Seamless integration with main app

### 🎨 Modern UI/UX
- **Glassmorphism Design** - Sticky blur header with modern aesthetics
- **Dark Mode Support** - Full dark/light theme toggle
- **Gradient Color Picker** - Beautiful 10-color palette for customization
- **Responsive Layout** - Mobile-first design
- **Keyboard Shortcuts** - `←/→` navigate months, `N` for new item
- **Inline Editing** - Click to edit any field instantly

### 💾 Data Management
- **Export/Import** - Backup and restore data as JSON
- **Copy Previous Month** - Quick template from last month
- **Smart ID Generation** - Avoid conflicts when importing
- **Confirmation Dialogs** - Prevent accidental data overwrites

## 🛠️ Tech Stack

### Frontend
- **React 18** + TypeScript
- **Vite** - Lightning fast build tool
- **TanStack Query** - Server state management
- **shadcn/ui** - Beautiful component library
- **Tailwind CSS** - Utility-first styling
- **Recharts** - Interactive data visualization
- **Lucide Icons** - Beautiful icon library

### Backend
- **Cloudflare Workers** - Serverless edge computing
- **Cloudflare D1** - SQLite database at the edge
- **Hono** - Lightweight web framework
- **Clerk Authentication** - Modern authentication with OAuth support

### Bot Integration
- **Telegram Bot API** - Real-time expense logging
- **Webhook Integration** - Instant updates

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- `pnpm` or another package manager
- Cloudflare account (for deployment)

### Installation

1.  Clone the repository
    ```bash
    git clone https://github.com/jankerzone/TagihanSerampangan.git
    cd TagihanSerampangan
    ```

2.  Install dependencies in both root and worker directories
    ```bash
    pnpm install
    cd worker && pnpm install && cd ..
    ```

3.  Set up Clerk Authentication
    -   Sign up at [clerk.com](https://clerk.com)
    -   Create a new application
    -   Get your Frontend API Key (Publishable Key) and Backend API Key (Secret Key).

4.  Set up environment variables
    -   Create a `.env` file in the root directory for the frontend:
        ```env
        VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
        VITE_API_URL=http://localhost:8787
        ```
    -   Update `worker/wrangler.toml` with your Clerk keys:
        ```toml
        [vars]
        CLERK_PUBLISHABLE_KEY = "pk_live_your_clerk_prod_key"
        CLERK_PUBLISHABLE_KEY_DEV = "pk_test_your_clerk_dev_key"
        ```
    -   Set your Clerk secret key for the worker:
        ```bash
        cd worker
        echo "your_clerk_secret_key" | npx wrangler secret put CLERK_SECRET_KEY
        cd ..
        ```

5.  Start development servers
    -   In one terminal, start the backend worker:
        ```bash
        cd worker
        pnpm run dev
        ```
    -   In another terminal, start the frontend:
        ```bash
        pnpm run dev
        ```

Your app should now be running at:
- Frontend: `http://localhost:8081`
- Backend API: `http://localhost:8787`

### Building for Production
```bash
pnpm build
```

### Deploying to Cloudflare

1.  Deploy the worker:
    ```bash
    cd worker
    npx wrangler deploy
    ```

2.  Update your frontend `.env.production` file (create it if it doesn't exist) with your worker's production URL:
    ```env
    VITE_API_URL=https://your-worker.your-subdomain.workers.dev
    ```

3.  Build and deploy the frontend to Cloudflare Pages:
    ```bash
    pnpm deploy
    ```

## 📱 Telegram Bot Setup

1.  Create a bot via [@BotFather](https://t.me/BotFather) and get your bot token.
2.  Add the token to `worker/wrangler.toml`:
    ```toml
    [vars]
    # ... other vars
    TELEGRAM_BOT_TOKEN = "your_bot_token_here"
    ```
3.  Set your Telegram secret for webhook verification (any random string):
    ```bash
    cd worker
    echo "your_random_secret_string" | npx wrangler secret put TELEGRAM_SECRET_TOKEN
    cd ..
    ```
4.  Deploy your worker to get its URL (`npx wrangler deploy`).
5.  Set the webhook URL by sending a request (replace `<YOUR_BOT_TOKEN>` and the URL):
    ```bash
    curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://your-worker.workers.dev/telegram/webhook&secret_token=<YOUR_RANDOM_SECRET>"
    ```
6.  Link your account in **Settings → Link Telegram Bot** in the web app.

## 🎯 Usage

### Adding Income
1.  Navigate to the dashboard.
2.  Click the "+" button in the **Income Sources** section.
3.  Enter the name and amount.
4.  Data saves automatically.

### Setting a Budget
1.  Click the "+" button in the **Expenses List** section.
2.  Enter the expense name, allocation amount, and choose a category.
3.  Track realization vs. allocation as you update expenses.

### Using the Telegram Bot
1.  Go to **Settings → Link Telegram Bot**.
2.  Click **Generate Link Code**.
3.  Copy the `/link YOUR_CODE` command.
4.  Send the command to your Telegram bot.
5.  Start logging expenses on-the-go! (e.g., "beli kopi 25rb")

### Importing/Exporting Data
1.  Click your user avatar in the top-right corner.
2.  Select **Export Data** to download a JSON backup of the current month.
3.  Select **Import Data** to restore from a backup.
4.  Select **Copy Previous Month** to duplicate last month's budget structure.

## 🎨 Customization

### Dashboard Colors
Go to **Settings → Dashboard Colors** and choose from 10 gradient options for each metric card.

### Expense Categories
Go to **Settings → Expense Categories** to add, edit, or delete your custom categories.

### Language
Go to **Settings → Language** and choose between English or Bahasa Indonesia.

## 📊 Key Metrics

- **Total Income**: Sum of all income sources for the month.
- **Planned Savings**: Total monthly contributions to your savings goals.
- **Available to Spend**: Total budget allocated for expenses.
- **Actual Spending**: Real expenses tracked for the month.
- **Remaining**: The difference between your available budget and actual spending.

## 🔒 Security

- **Clerk Authentication**: Industry-standard auth with OAuth (Google, GitHub) and Magic Links.
- **JWT Token Verification**: Secure API authentication between frontend and worker.
- **HTTPS-only**: Encrypted communication enforced by Cloudflare.
- **Environment Variables & Secrets**: Secure storage for credentials and API keys.
- **SQL Injection Prevention**: Parameterized queries via Cloudflare D1 prevent SQL injection.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the repository.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m '✨ Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Robsan** ([@jankerzone](https://github.com/jankerzone))

## 🙏 Acknowledgments

- Built with love using modern web technologies.
- Inspired by personal budget management needs.
- Community feedback and contributions.

## 📝 Changelog

### v3.0.0 - Clerk Authentication (Latest)
- 🔐 Migrated to Clerk for authentication
- 🚀 Google OAuth & Magic Link support
- ✨ Seamless user experience
- 🔒 Enhanced security with JWT verification
- 🧹 Removed legacy auth code

### v2.0.0 - Major Frontend Refactor
- ✨ Glassmorphism UI with sticky blur header
- 🎨 Modern gradient color picker (10 colors)
- 📊 Added Income Allocation & Spending charts
- 🔧 Fixed Export/Import with ID regeneration
- 🧩 Code organization with shared hooks
- 🎯 All data management in UserNav dropdown
- ⌨️ Keyboard shortcuts support

### v1.0.0 - Initial Release
- Basic expense tracking
- Telegram bot integration
- Budget management
- Savings goals

---

⭐ **Star this repo** if you find it helpful!

📧 **Issues & Questions**: [Open an issue](https://github.com/jankerzone/TagihanSerampangan/issues)
