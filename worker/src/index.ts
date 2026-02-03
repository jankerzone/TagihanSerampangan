import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt';
import { authRoutes } from './auth';
import { dataRoutes } from './data';
import { savingsGoalsRoutes } from './savings-goals';
import { telegramRoutes } from './telegram';

type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
  TELEGRAM_BOT_TOKEN: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('/*', cors());

app.get('/', (c) => {
  return c.text('Tagihan Serampangan API is running!');
});

app.route('/auth', authRoutes);

// Protect data routes
app.use('/api/*', (c, next) => {
  const jwtMiddleware = jwt({
    secret: c.env.JWT_SECRET || 'fallback_secret_for_dev',
  });
  return jwtMiddleware(c, next);
});

app.route('/api', dataRoutes);
app.route('/api/savings', savingsGoalsRoutes);

// Protected telegram endpoint (requires JWT) - MUST be before mounting routes
app.use('/telegram/generate-link-code', (c, next) => {
  const jwtMiddleware = jwt({
    secret: c.env.JWT_SECRET || 'fallback_secret_for_dev',
  });
  return jwtMiddleware(c, next);
});

app.use('/telegram/unlink-account', (c, next) => {
  const jwtMiddleware = jwt({
    secret: c.env.JWT_SECRET || 'fallback_secret_for_dev',
  });
  return jwtMiddleware(c, next);
});

// Telegram bot routes (webhook and setup are public)
app.route('/telegram', telegramRoutes);

export default app;
