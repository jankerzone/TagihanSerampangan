import { Hono } from 'hono';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

type Bindings = {
  DB: D1Database;
  TELEGRAM_BOT_TOKEN: string;
  AI: any;
};

export interface ParsedExpense {
  raw: string;
  description: string;
  amount: number;
  category: string;
  confidence: number;
  categorySource?: 'keyword' | 'ai' | 'default';
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
  /(\d+(?:[.,]\d+)?)\s*(?:juta|jt|million|m)\b/i,  // Millions: 1juta, 1.5jt, 2million
  /(\d+(?:[.,]\d+)?)\s*(?:rb|k|ribu)\b/i,           // Thousands: 300rb, 50k, 100ribu
  /(?:rp\.?\s*)?(\d{1,3}(?:[.,]\d{3})+|\d+)/i,     // Formatted: Rp 1.000.000 or plain numbers
];

function parseAmount(text: string): number | null {
  for (const pattern of amountPatterns) {
    const match = text.match(pattern);
    if (match) {
      // Clean the matched number (remove dots/commas used as thousand separators)
      let amount = match[1].replace(/[.,]/g, '');
      let num = parseFloat(match[1].replace(/\./g, '').replace(',', '.'));

      // Check for million suffix
      if (match[0].match(/(?:juta|jt|million|m)\b/i)) {
        num *= 1000000;
      }
      // Check for thousand suffix
      else if (match[0].match(/(?:rb|k|ribu)\b/i)) {
        num *= 1000;
      }

      return Math.round(num);
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
    .replace(/(\d+(?:[.,]\d+)?)\s*(?:juta|jt|million|m)\b/gi, '')  // Remove millions
    .replace(/(\d+(?:[.,]\d+)?)\s*(?:rb|k|ribu)\b/gi, '')           // Remove thousands
    .replace(/(?:rp\.?\s*)?(?:\d{1,3}(?:[.,]\d{3})+|\d+)/gi, '')   // Remove plain numbers
    .replace(/beli|buy|untuk|for/gi, '')                            // Remove filler words
    .trim();

  return cleaned || 'expense';
}

// ============================================================================
// AI-POWERED CATEGORY DETECTION
// ============================================================================

async function getUserCategories(db: D1Database, userId: number): Promise<string[]> {
  const result = await db.prepare(
    'SELECT DISTINCT category FROM daily_expenses WHERE user_id = ? ORDER BY category'
  ).bind(userId).all();

  const categories = result.results?.map((r: any) => r.category as string) || [];

  // If user has no categories yet, provide defaults
  if (categories.length === 0) {
    return ['Food', 'Transport', 'Utilities', 'Health', 'Education', 'Shopping', 'Entertainment', 'Others'];
  }

  // Always ensure "Others" exists
  if (!categories.includes('Others')) {
    categories.push('Others');
  }

  return categories;
}

async function detectCategoryWithAI(
  ai: any,
  description: string,
  userCategories: string[]
): Promise<{ category: string; source: 'ai' }> {
  try {
    const prompt = `You are an expense categorization assistant.

User's categories: ${userCategories.join(', ')}

Expense: "${description}"

Rules:
- Choose the BEST category from the user's list
- SPP/sekolah/les/kursus → Education (if exists)
- Bensin/motor/gojek/grab → Transport (if exists)
- Beras/makan/food → Food (if exists)
- Susu anak/popok/mainan anak → Family/Kids (if exists)
- If no good match → "Others"
- Return ONLY the category name

Category:`;

    const response = await ai.run('@cf/meta/llama-3-8b-instruct', {
      prompt: prompt,
      max_tokens: 20
    });

    const aiCategory = response.response?.trim().replace(/['"]/g, '') || 'Others';

    // Validate: category must exist in user's list
    const matchedCategory = userCategories.find(cat =>
      aiCategory.toLowerCase() === cat.toLowerCase() ||
      aiCategory.toLowerCase().includes(cat.toLowerCase()) ||
      cat.toLowerCase().includes(aiCategory.toLowerCase())
    );

    return {
      category: matchedCategory || 'Others',
      source: 'ai'
    };
  } catch (error) {
    console.error('AI categorization error:', error);
    return { category: 'Others', source: 'ai' };
  }
}

async function detectCategoryEnhanced(
  description: string,
  userId: number,
  db: D1Database,
  ai?: any
): Promise<{ category: string; source: 'keyword' | 'ai' | 'default' }> {
  // Step 1: Try keyword matching (fast, free)
  const keywordCategory = detectCategory(description);
  if (keywordCategory !== 'Others') {
    return { category: keywordCategory, source: 'keyword' };
  }

  // Step 2: If AI available, use it with user's categories
  if (ai) {
    const userCategories = await getUserCategories(db, userId);
    const aiResult = await detectCategoryWithAI(ai, description, userCategories);
    if (aiResult.category !== 'Others') {
      return aiResult;
    }
  }

  // Step 3: Fallback to Others
  return { category: 'Others', source: 'default' };
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
  // Join users table with linked_devices table
  const result = await db.prepare(
    `SELECT u.id, u.username, ld.telegram_user_id 
     FROM users u 
     JOIN linked_devices ld ON u.id = ld.user_id 
     WHERE ld.telegram_user_id = ?`
  ).bind(telegramUserId).first();
  
  return result;
}

async function linkTelegramAccount(db: D1Database, code: string, telegramUserId: string, username?: string, firstName?: string) {
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

  // Check if this Telegram account is already linked to ANY user (prevent duplicates)
  const existingLink = await db.prepare('SELECT id FROM linked_devices WHERE telegram_user_id = ?').bind(telegramUserId).first();
  if (existingLink) {
    return { success: false, error: 'This Telegram account is already linked.' };
  }
  
  // Insert into linked_devices
  await db.prepare(
    'INSERT INTO linked_devices (user_id, telegram_user_id, telegram_username, first_name) VALUES (?, ?, ?, ?)'
  ).bind(userId, telegramUserId, username || null, firstName || null).run();
  
  // Delete code
  await db.prepare('DELETE FROM telegram_link_codes WHERE code = ?').bind(code).run();
  
  // Get user username
  const user = await db.prepare('SELECT username FROM users WHERE id = ?').bind(userId).first();
  
  return { success: true, email: user?.username };
}

async function unlinkTelegramAccount(db: D1Database, telegramUserId: string) {
  const result = await db.prepare(
    'DELETE FROM linked_devices WHERE telegram_user_id = ?'
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

async function getMonthlyExpenses(db: D1Database, userId: number, monthKey: string, limit = 20) {
  const result = await db.prepare(
    `SELECT date, description, amount, category 
     FROM daily_expenses 
     WHERE user_id = ? AND month_key = ? 
     ORDER BY created_at DESC 
     LIMIT ?`
  ).bind(userId, monthKey, limit).all();
  
  return result.results || [];
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

function createCategoryKeyboard(userCategories: string[], messageId: number, amount: number) {
  // Create rows of 2 buttons each for better layout
  const rows = [];
  for (let i = 0; i < userCategories.length; i += 2) {
    const row = userCategories.slice(i, i + 2).map(cat => ({
      text: cat,
      callback_data: `cat_${messageId}_${amount}_${cat}`
    }));
    rows.push(row);
  }

  return {
    inline_keyboard: rows
  };
}

function createMonthKeyboard(parsed: ParsedExpense, messageId: number) {
  const months = getMonthOptions();

  // Encode expense data in callback_data (max 64 bytes)
  // Format: month_MONTHKEY_AMOUNT_MSGID_CAT
  // Use message ID instead of description to avoid truncation
  return {
    inline_keyboard: [
      months.map(m => ({
        text: m.displayName,
        callback_data: `m_${m.monthKey}_${parsed.amount}_${messageId}_${parsed.category}`
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
/list - List recent expenses
/help - Show this message`;
}

function formatExpensePreview(parsed: ParsedExpense, showCategoryPrompt: boolean = false): string {
  const amount = parsed.amount > 0
    ? `Rp ${parsed.amount.toLocaleString('id-ID')}`
    : '⚠️ Amount not detected';

  const categoryDisplay = parsed.categorySource === 'ai'
    ? `${parsed.category} 🤖`
    : parsed.category;

  if (showCategoryPrompt) {
    return `📋 *Expense Detected*

📝 Description: ${parsed.description}
💰 Amount: ${amount}
🏷️ Category: ${categoryDisplay}

${parsed.categorySource === 'ai' ? '🤖 AI detected this category. ' : ''}Choose the correct category:`;
  }

  return `📋 *Expense Detected*

📝 Description: ${parsed.description}
💰 Amount: ${amount}
🏷️ Category: ${categoryDisplay}

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

      // Handle category selection (format: "cat_MSGID_AMOUNT_CATEGORY")
      if (query.data?.startsWith('cat_')) {
        const parts = query.data.split('_');
        if (parts.length < 4) {
          await answerCallbackQuery(botToken, query.id, '❌ Invalid data');
          return c.json({ ok: true });
        }

        const originalMessageId = parseInt(parts[1]);
        const amount = parseInt(parts[2]);
        const selectedCategory = parts.slice(3).join('_'); // Handle categories with underscores

        // Extract description from message
        const messageText = query.message?.text || '';
        const descMatch = messageText.match(/📝 Description: (.+)/m);
        const description = descMatch ? descMatch[1].split('\n')[0].trim() : 'expense';

        const parsed: ParsedExpense = {
          raw: description,
          description,
          amount,
          category: selectedCategory,
          confidence: 0.9
        };

        // Update message to show month selection
        await editMessageText(
          botToken,
          chatId,
          messageId,
          formatExpensePreview(parsed, false)
        );

        // Send month selection inline keyboard
        await fetch(`https://api.telegram.org/bot${botToken}/editMessageReplyMarkup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            message_id: messageId,
            reply_markup: createMonthKeyboard(parsed, originalMessageId)
          }),
        });

        await answerCallbackQuery(botToken, query.id, `✅ Category: ${selectedCategory}`);
        return c.json({ ok: true });
      }

      // Parse callback data (format: "m_2026-February_30000_MSGID_Food")
      if (query.data?.startsWith('m_')) {
        const parts = query.data.split('_');
        if (parts.length < 5) {
          await answerCallbackQuery(botToken, query.id, '❌ Invalid data');
          return c.json({ ok: true });
        }

        const monthKey = parts[1];
        const amount = parseInt(parts[2]);
        const originalMessageId = parseInt(parts[3]);
        const category = parts[4];

        // Extract full description from the displayed message text
        // The message shows "📝 Description: XXX" so we parse it
        const messageText = query.message?.text || '';
        const descMatch = messageText.match(/📝 Description: (.+)/m);
        let description = 'expense';

        if (descMatch) {
          // Get the line after "Description:" and before the next line
          description = descMatch[1].split('\n')[0].trim();
        }

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
      
      const username = message.from.username;
      const firstName = message.from.first_name;

      const result = await linkTelegramAccount(db, code.toUpperCase(), telegramUserId, username, firstName);
      
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
    
    // Command: /list
    if (text === '/list') {
      const user = await getUserByTelegramId(db, telegramUserId);
      if (!user) {
        await sendMessage(botToken, chatId, '❌ Please link your account first with /link CODE');
        return c.json({ ok: true });
      }

      const currentMonth = getMonthOptions()[0];
      const expenses = await getMonthlyExpenses(db, user.id as number, currentMonth.monthKey);
      const stats = await getMonthlyTotal(db, user.id as number, currentMonth.monthKey);
      
      if (expenses.length === 0) {
        await sendMessage(botToken, chatId, `📋 *${currentMonth.displayName}*\n\nNo expenses recorded yet.`);
        return c.json({ ok: true });
      }

      let message = `📋 *Expenses for ${currentMonth.displayName}*\n\n`;
      
      expenses.forEach((e: any) => {
        const date = e.date.split('-').slice(1).reverse().join('/'); // MM-DD -> DD/MM
        const amount = e.amount.toLocaleString('id-ID');
        message += `• ${date}: ${e.description} - Rp ${amount}\n`;
      });
      
      message += `\n📊 *Summary:*\n• Count: ${stats.count}\n• Total: Rp ${stats.total.toLocaleString('id-ID')}`;
      
      await sendMessage(botToken, chatId, message);
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

    // First parse amount and description with regex
    const parsed = parseExpense(text);

    if (parsed.amount === 0) {
      await sendMessage(botToken, chatId,
        '⚠️ Could not detect amount.\n\nTry formats like:\n• "beli beras 30rb"\n• "ngecas motor 15000"'
      );
      return c.json({ ok: true });
    }

    // Enhance category detection with AI
    const ai = c.env.AI;
    const enhancedCategory = await detectCategoryEnhanced(
      parsed.description,
      user.id as number,
      db,
      ai
    );

    parsed.category = enhancedCategory.category;
    parsed.categorySource = enhancedCategory.source;

    // Get user's categories for selection
    const userCategories = await getUserCategories(db, user.id as number);

    // Send category selection first (new improved flow)
    await sendMessage(
      botToken,
      chatId,
      formatExpensePreview(parsed, true),
      { reply_markup: createCategoryKeyboard(userCategories, message.message_id, parsed.amount) }
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

// Unlink account endpoint (requires JWT)
telegramRoutes.post('/unlink-account', async (c) => {
  try {
    // Get user from JWT payload
    const payload = c.get('jwtPayload');
    if (!payload || !payload.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const { telegram_id } = await c.req.json().catch(() => ({ telegram_id: null }));
    const userId = payload.id;
    const db = c.env.DB;
    
    if (telegram_id) {
      // Unlink specific device
       await db.prepare('DELETE FROM linked_devices WHERE id = ? AND user_id = ?').bind(telegram_id, userId).run();
    } else {
      // Unlink ALL (legacy behavior or failsafe)
      await db.prepare('DELETE FROM linked_devices WHERE user_id = ?').bind(userId).run();
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Unlink account error:', error);
    return c.json({ error: 'Failed to unlink account' }, 500);
  }
});

// Test endpoint
telegramRoutes.post('/test-parse', async (c) => {
  const { text } = await c.req.json();
  const parsed = parseExpense(text);
  return c.json(parsed);
});
