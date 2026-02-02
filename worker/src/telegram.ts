import { Hono } from 'hono';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

type Bindings = {
  DB: D1Database;
  TELEGRAM_BOT_TOKEN: string;
};

export interface ParsedExpense {
  raw: string;
  description: string;
  amount: number;
  category: string;
  confidence: number;
}

interface TelegramUser {
  id: number;
  first_name: string;
  username?: string;
}

interface TelegramMessage {
  message_id: number;
  from: TelegramUser;
  chat: { id: number; type: string };
  date: number;
  text?: string;
}

interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  message?: TelegramMessage;
  data?: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

// ============================================================================
// EXPENSE PARSER (Keep Kimi's good work)
// ============================================================================

const CATEGORIES: Record<string, string[]> = {
  'Food': ['rice', 'beras', 'sugar', 'gula', 'oil', 'minyak', 'food', 'makan', 'snack', 'makanan', 'nasi', 'ayam', 'ikan'],
  'Transport': ['gasoline', 'bensin', 'motor', 'car', 'mobil', 'bus', 'train', 'transport', 'gojek', 'grab', 'ojek', 'ngecas'],
  'Utilities': ['electricity', 'listrik', 'water', 'air', 'internet', 'wifi', 'pulsa', 'hp', 'token'],
  'Health': ['medicine', 'obat', 'doctor', 'dokter', 'hospital', 'rumah sakit', 'klinik'],
  'Entertainment': ['movie', 'bioskop', 'game', 'netflix', 'spotify', 'fun', 'hiburan'],
  'Shopping': ['clothes', 'baju', 'shoes', 'sepatu', 'beli', 'buy', 'belanja'],
};

const amountPatterns = [
  /(\d+(?:\.\d+)?)\s*(?:rb|k|ribu)/i,
  /(?:rp\.?\s*)?(\d{1,3}(?:\.\d{3})+|\d+)/i,
];

function parseAmount(text: string): number | null {
  for (const pattern of amountPatterns) {
    const match = text.match(pattern);
    if (match) {
      let amount = match[1].replace(/\./g, '');
      let num = parseInt(amount);
      if (match[0].match(/(rb|k|ribu)/i)) {
        num *= 1000;
      }
      return num;
    }
  }
  return null;
}

function detectCategory(text: string): string {
  const lowerText = text.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORIES)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        return category;
      }
    }
  }
  return 'Others';
}

function extractDescription(text: string, amount: number): string {
  let cleaned = text
    .replace(/(\d+(?:\.\d+)?)\s*(?:rb|k|ribu)/gi, '')
    .replace(/(?:rp\.?\s*)?(?:\d{1,3}(?:\.\d{3})+|\d+)/gi, '')
    .replace(/beli|buy|untuk|for/gi, '')
    .trim();
  
  return cleaned || 'expense';
}

export function parseExpense(text: string): ParsedExpense {
  const amount = parseAmount(text);
  const description = extractDescription(text, amount || 0);
  const category = detectCategory(text);
  
  return {
    raw: text,
    description,
    amount: amount || 0,
    category,
    confidence: amount ? 0.8 : 0.3,
  };
}

// ============================================================================
// TELEGRAM API HELPERS
// ============================================================================

async function sendMessage(botToken: string, chatId: number, text: string, options: any = {}) {
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
      ...options,
    }),
  });
}

async function answerCallbackQuery(botToken: string, callbackQueryId: string, text?: string) {
  await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callback_query_id: callbackQueryId,
      text,
    }),
  });
}

async function editMessageText(botToken: string, chatId: number, messageId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: 'Markdown',
    }),
  });
}

// ============================================================================
// DATABASE HELPERS
// ============================================================================

async function getUserByTelegramId(db: D1Database, telegramUserId: string) {
  const result = await db.prepare(
    'SELECT id, username, telegram_user_id FROM users WHERE telegram_user_id = ?'
  ).bind(telegramUserId).first();
  
  return result;
}

async function linkTelegramAccount(db: D1Database, code: string, telegramUserId: string) {
  // Find code
  const codeResult = await db.prepare(
    'SELECT user_id, expires_at FROM telegram_link_codes WHERE code = ?'
  ).bind(code).first();
  
  if (!codeResult) {
    return { success: false, error: 'Invalid code' };
  }
  
  // Check expiration
  const now = new Date().toISOString();
  if (now > (codeResult.expires_at as string)) {
    await db.prepare('DELETE FROM telegram_link_codes WHERE code = ?').bind(code).run();
    return { success: false, error: 'Code expired' };
  }
  
  const userId = codeResult.user_id as number;
  
  // Update user
  await db.prepare(
    'UPDATE users SET telegram_user_id = ? WHERE id = ?'
  ).bind(telegramUserId, userId).run();
  
  // Delete code
  await db.prepare('DELETE FROM telegram_link_codes WHERE code = ?').bind(code).run();
  
  // Get user username
  const user = await db.prepare('SELECT username FROM users WHERE id = ?').bind(userId).first();
  
  return { success: true, email: user?.username };
}

async function unlinkTelegramAccount(db: D1Database, telegramUserId: string) {
  const result = await db.prepare(
    'UPDATE users SET telegram_user_id = NULL WHERE telegram_user_id = ?'
  ).bind(telegramUserId).run();
  
  return result.meta.changes > 0;
}

async function saveDailyExpense(
  db: D1Database,
  userId: number,
  monthKey: string,
  expense: ParsedExpense,
  telegramMessageId: number
) {
  const id = `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  await db.prepare(
    `INSERT INTO daily_expenses (id, user_id, month_key, date, description, amount, category, source, telegram_message_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'telegram', ?)`
  ).bind(
    id,
    userId,
    monthKey,
    date,
    expense.description,
    expense.amount,
    expense.category,
    telegramMessageId
  ).run();
  
  return id;
}

async function getMonthlyTotal(db: D1Database, userId: number, monthKey: string) {
  const result = await db.prepare(
    'SELECT COUNT(*) as count, SUM(amount) as total FROM daily_expenses WHERE user_id = ? AND month_key = ?'
  ).bind(userId, monthKey).first();
  
  return {
    count: result?.count as number || 0,
    total: result?.total as number || 0,
  };
}

// ============================================================================
// MONTH HELPERS
// ============================================================================

function getMonthOptions() {
  const now = new Date();
  const months = [];
  
  for (let i = 0; i < 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
    const monthKey = `${d.getFullYear()}-${monthNames[d.getMonth()]}`;
    const displayName = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    
    months.push({ monthKey, displayName });
  }
  
  return months;
}

function createMonthKeyboard(parsed: ParsedExpense) {
  const months = getMonthOptions();
  
  // Encode expense data in callback_data (max 64 bytes)
  // Format: month_MONTHKEY_AMOUNT_DESC_CAT
  return {
    inline_keyboard: [
      months.map(m => ({ 
        text: m.displayName, 
        callback_data: `m_${m.monthKey}_${parsed.amount}_${encodeURIComponent(parsed.description.substring(0, 15))}_${parsed.category}`
      }))
    ]
  };
}

// ============================================================================
// MESSAGE FORMATTERS
// ============================================================================

function formatHelpMessage(): string {
  return `🤖 *TagihanSerampangan Bot*

Track your daily expenses easily!

*How to use:*
1. Link your account: \`/link CODE\`
   (Get code from app settings)
2. Send expenses naturally:
   • "beli beras 30rb"
   • "ngecas motor 15000"
   • "makan siang 25rb"

*Commands:*
/link CODE - Link Telegram account
/unlink - Unlink account
/status - Show account info
/help - Show this message`;
}

function formatExpensePreview(parsed: ParsedExpense): string {
  const amount = parsed.amount > 0 
    ? `Rp ${parsed.amount.toLocaleString('id-ID')}`
    : '⚠️ Amount not detected';
  
  return `📋 *Expense Detected*

📝 Description: ${parsed.description}
💰 Amount: ${amount}
🏷️ Category: ${parsed.category}

${parsed.confidence < 0.5 ? '⚠️ Please check the details' : ''}
Select which month to save this expense:`;
}

function formatSaveConfirmation(
  parsed: ParsedExpense,
  monthKey: string,
  monthTotal: { count: number; total: number }
): string {
  return `✅ *Expense Saved!*

📝 ${parsed.description}
💰 Rp ${parsed.amount.toLocaleString('id-ID')}
🏷️ ${parsed.category}
📅 ${monthKey}

📊 *${monthKey.split('-')[1]} Summary:*
• Total Expenses: ${monthTotal.count}
• Total Spent: Rp ${monthTotal.total.toLocaleString('id-ID')}`;
}

// ============================================================================
// ROUTER
// ============================================================================

export const telegramRoutes = new Hono<{ Bindings: Bindings }>();

// Webhook handler
telegramRoutes.post('/webhook', async (c) => {
  try {
    const update: TelegramUpdate = await c.req.json();
    const botToken = c.env.TELEGRAM_BOT_TOKEN;
    const db = c.env.DB;
    
    if (!botToken) {
      console.error('TELEGRAM_BOT_TOKEN not set');
      return c.json({ ok: true });
    }
    
    // Handle callback queries (month selection)
    if (update.callback_query) {
      const query = update.callback_query;
      const chatId = query.message?.chat.id!;
      const messageId = query.message?.message_id!;
      const telegramUserId = query.from.id.toString();
      
      // Check if user is linked
      const user = await getUserByTelegramId(db, telegramUserId);
      if (!user) {
        await answerCallbackQuery(botToken, query.id, '❌ Please /link your account first');
        return c.json({ ok: true });
      }
      
      // Parse callback data (format: "m_2026-February_30000_beras_Food")
      if (query.data?.startsWith('m_')) {
        const parts = query.data.split('_');
        if (parts.length < 5) {
          await answerCallbackQuery(botToken, query.id, '❌ Invalid data');
          return c.json({ ok: true });
        }
        
        const monthKey = parts[1];
        const amount = parseInt(parts[2]);
        const description = decodeURIComponent(parts[3]);
        const category = parts[4];
        
        const parsed: ParsedExpense = {
          raw: description,
          description,
          amount,
          category,
          confidence: 0.8
        };
        
        // Save expense
        await saveDailyExpense(db, user.id as number, monthKey, parsed, messageId);
        
        // Get monthly total
        const monthTotal = await getMonthlyTotal(db, user.id as number, monthKey);
        
        // Update message
        await editMessageText(
          botToken,
          chatId,
          messageId,
          formatSaveConfirmation(parsed, monthKey, monthTotal)
        );
        
        await answerCallbackQuery(botToken, query.id, '✅ Saved!');
      }
      
      return c.json({ ok: true });
    }
    
    // Handle text messages
    const message = update.message;
    if (!message?.text) {
      return c.json({ ok: true });
    }
    
    const text = message.text;
    const chatId = message.chat.id;
    const telegramUserId = message.from.id.toString();
    
    // Command: /start
    if (text === '/start') {
      await sendMessage(botToken, chatId, 
        `👋 *Welcome to TagihanSerampangan!*\n\n${formatHelpMessage()}`
      );
      return c.json({ ok: true });
    }
    
    // Command: /help
    if (text === '/help') {
      await sendMessage(botToken, chatId, formatHelpMessage());
      return c.json({ ok: true });
    }
    
    // Command: /link CODE
    if (text.startsWith('/link')) {
      const code = text.split(' ')[1];
      if (!code) {
        await sendMessage(botToken, chatId, 
          '❌ Usage: `/link YOUR_CODE`\n\nGet your code from app settings.'
        );
        return c.json({ ok: true });
      }
      
      const result = await linkTelegramAccount(db, code.toUpperCase(), telegramUserId);
      
      if (result.success) {
        await sendMessage(botToken, chatId, 
          `✅ *Account Linked!*\n\nYou're now logged in as: ${result.email}\n\nStart tracking expenses by sending messages like:\n• "beli beras 30rb"\n• "ngecas motor 15rb"`
        );
      } else {
        await sendMessage(botToken, chatId, `❌ ${result.error}`);
      }
      
      return c.json({ ok: true });
    }
    
    // Command: /unlink
    if (text === '/unlink') {
      const success = await unlinkTelegramAccount(db, telegramUserId);
      
      if (success) {
        await sendMessage(botToken, chatId, '✅ Account unlinked!');
      } else {
        await sendMessage(botToken, chatId, '❌ No linked account found');
      }
      
      return c.json({ ok: true });
    }
    
    // Command: /status
    if (text === '/status') {
      const user = await getUserByTelegramId(db, telegramUserId);
      
      if (user) {
        const currentMonth = getMonthOptions()[0];
        const stats = await getMonthlyTotal(db, user.id as number, currentMonth.monthKey);
        
        await sendMessage(botToken, chatId, 
          `📊 *Account Status*\n\nLinked to: ${user.username}\n\n*${currentMonth.displayName} Stats:*\n• Expenses: ${stats.count}\n• Total: Rp ${stats.total.toLocaleString('id-ID')}`
        );
      } else {
        await sendMessage(botToken, chatId, 
          '❌ No linked account\n\nUse `/link CODE` to link your account.'
        );
      }
      
      return c.json({ ok: true });
    }
    
    // Parse expense
    const user = await getUserByTelegramId(db, telegramUserId);
    if (!user) {
      await sendMessage(botToken, chatId, 
        '❌ Please link your account first!\n\nUse `/link CODE` (get code from app settings)'
      );
      return c.json({ ok: true });
    }
    
    const parsed = parseExpense(text);
    
    if (parsed.amount === 0) {
      await sendMessage(botToken, chatId, 
        '⚠️ Could not detect amount.\n\nTry formats like:\n• "beli beras 30rb"\n• "ngecas motor 15000"'
      );
      return c.json({ ok: true });
    }
    
    // Send month selection (expense data encoded in buttons)
    await sendMessage(
      botToken,
      chatId,
      formatExpensePreview(parsed),
      { reply_markup: createMonthKeyboard(parsed) }
    );
    
    return c.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return c.json({ ok: false, error: 'Processing failed' }, 500);
  }
});

// Setup webhook endpoint
telegramRoutes.get('/setup-webhook', async (c) => {
  const botToken = c.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return c.json({ error: 'TELEGRAM_BOT_TOKEN not configured' }, 500);
  }
  
  const webhookUrl = `${new URL(c.req.url).origin}/telegram/webhook`;
  
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message', 'callback_query'],
      }),
    });
    
    const result = await response.json();
    return c.json({ 
      success: result.ok, 
      webhook_url: webhookUrl,
      telegram_response: result 
    });
  } catch (error) {
    return c.json({ error: 'Failed to setup webhook', details: error }, 500);
  }
});

// Generate link code endpoint (requires JWT)
telegramRoutes.post('/generate-link-code', async (c) => {
  try {
    // Get user from JWT payload
    const payload = c.get('jwtPayload');
    if (!payload || !payload.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const userId = payload.id;
    const db = c.env.DB;
    
    // Generate 6-character code
    const code = Math.random().toString(36).substr(2, 6).toUpperCase();
    
    // Set expiration (10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    
    // Delete old codes for this user
    await db.prepare('DELETE FROM telegram_link_codes WHERE user_id = ?').bind(userId).run();
    
    // Insert new code
    await db.prepare(
      'INSERT INTO telegram_link_codes (code, user_id, expires_at) VALUES (?, ?, ?)'
    ).bind(code, userId, expiresAt).run();
    
    return c.json({ code, expires_at: expiresAt });
  } catch (error) {
    console.error('Generate code error:', error);
    return c.json({ error: 'Failed to generate code' }, 500);
  }
});

// Test endpoint
telegramRoutes.post('/test-parse', async (c) => {
  const { text } = await c.req.json();
  const parsed = parseExpense(text);
  return c.json(parsed);
});
