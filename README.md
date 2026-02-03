# 💰 TagihanSerampangan

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
- **JWT Authentication** - Secure user sessions

### Bot Integration
- **Telegram Bot API** - Real-time expense logging
- **Webhook Integration** - Instant updates

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Cloudflare account (for deployment)

### Installation

1. Clone the repository
```bash
git clone https://github.com/jankerzone/TagihanSerampangan.git
cd TagihanSerampangan
```

2. Install dependencies
```bash
npm install
cd worker && npm install && cd ..
```

3. Set up environment variables
```bash
# Create .env.production for frontend
echo "VITE_API_URL=http://localhost:8787" > .env.production

# Configure worker/wrangler.toml for your Cloudflare account
```

4. Start development server
```bash
npm run dev
```

5. Start Cloudflare Workers (in another terminal)
```bash
cd worker
npm run dev
```

Your app should now be running at:
- Frontend: `http://localhost:8080`
- Backend API: `http://localhost:8787`

### Building for Production
```bash
npm run build
```

### Deploying to Cloudflare

1. Deploy the worker:
```bash
cd worker
npx wrangler deploy
```

2. Update `.env.production` with your worker URL:
```bash
VITE_API_URL=https://your-worker.your-subdomain.workers.dev
```

3. Build and deploy frontend to Cloudflare Pages:
```bash
npm run build
npx wrangler pages deploy dist
```

## 📱 Telegram Bot Setup

1. Create a bot via [@BotFather](https://t.me/BotFather)
2. Get your bot token
3. Add to `worker/wrangler.toml`:
```toml
[vars]
TELEGRAM_BOT_TOKEN = "your_bot_token_here"
```
4. Set webhook:
```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://your-worker.workers.dev/telegram/webhook"
```
5. Link your account in Settings → Telegram Bot

## 🎯 Usage

### Adding Income
1. Navigate to dashboard
2. Click "+" in Income Sources section
3. Enter name and amount
4. Data saves automatically

### Setting Budget
1. Click "Add" in Expenses section
2. Enter expense name, allocation, and category
3. Track realization vs. allocation

### Using Telegram Bot
1. Go to Settings → Telegram Bot
2. Click "Generate Link Code"
3. Copy the `/link CODE` command
4. Send to your Telegram bot
5. Start logging expenses on-the-go!

### Importing/Exporting Data
1. Click user avatar (top right)
2. Select "Export Data" to download JSON backup
3. Select "Import Data" to restore from backup
4. Select "Copy Previous Month" to duplicate last month's budget

## 🎨 Customization

### Dashboard Colors
Settings → Dashboard Colors → Choose from 10 gradient options for each metric card

### Categories
Settings → Expense Categories → Add/edit/delete custom categories

### Language
Settings → Language → English or Bahasa Indonesia

## 📊 Key Metrics

- **Total Income** - Sum of all income sources
- **Planned Savings** - Monthly savings contributions
- **Available to Spend** - Total budget allocations
- **Actual Spending** - Real expenses tracked
- **Remaining** - Budget left for the month

## 🔒 Security

- JWT-based authentication
- Secure password hashing (bcrypt)
- HTTPS-only communication
- Environment variable protection
- SQL injection prevention with prepared statements

## 📸 Screenshots

_Coming soon_

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m '✨ Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 👨‍💻 Author

**Robsan** ([@jankerzone](https://github.com/jankerzone))

## 🙏 Acknowledgments

- Built with love using modern web technologies
- Inspired by personal budget management needs
- Community feedback and contributions

## 📝 Changelog

### v2.0.0 - Major Frontend Refactor (Latest)
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

🔗 **Live Demo**: _Coming soon_
