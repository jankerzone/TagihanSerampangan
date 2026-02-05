import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authRoutes } from './auth';
import { dataRoutes } from './data';
import { savingsGoalsRoutes } from './savings-goals';
import { telegramRoutes } from './telegram';
import { clerkAuth, getOrCreateInternalUser, ClerkJWTPayload } from './clerk-auth';

type Bindings = {
  DB: D1Database;
  CLERK_SECRET_KEY: string;
  CLERK_PUBLISHABLE_KEY: string;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_SECRET_TOKEN: string;
};

type Variables = {
  clerkUser: ClerkJWTPayload;
  internalUserId: number;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.use('/*', cors());

app.get('/', (c) => {
  return c.text('Tagihan Serampangan API is running!');
});

app.route('/auth', authRoutes);

// Protect data routes with Clerk auth and resolve internal user ID
app.use('/api/*', clerkAuth(), async (c, next) => {
  const clerkUser = c.get('clerkUser');

  try {
    const internalUser = await getOrCreateInternalUser(
      c.env.DB,
      clerkUser.sub,
      clerkUser.email
    );
    c.set('internalUserId', internalUser.id);
    // Also set jwtPayload for backwards compatibility with existing data routes
    c.set('jwtPayload' as any, { id: internalUser.id, username: internalUser.username });
  } catch (error) {
    console.error('Error resolving internal user:', error);
    return c.json({ error: 'Failed to resolve user' }, 500);
  }

  await next();
});

app.route('/api', dataRoutes);
app.route('/api/savings', savingsGoalsRoutes);

// Protected telegram endpoints (requires Clerk auth)
app.use('/telegram/generate-link-code', clerkAuth(), async (c, next) => {
  const clerkUser = c.get('clerkUser');

  try {
    const internalUser = await getOrCreateInternalUser(
      c.env.DB,
      clerkUser.sub,
      clerkUser.email
    );
    c.set('jwtPayload' as any, { id: internalUser.id, username: internalUser.username });
  } catch (error) {
    console.error('Error resolving internal user:', error);
    return c.json({ error: 'Failed to resolve user' }, 500);
  }

  await next();
});

app.use('/telegram/unlink-account', clerkAuth(), async (c, next) => {
  const clerkUser = c.get('clerkUser');

  try {
    const internalUser = await getOrCreateInternalUser(
      c.env.DB,
      clerkUser.sub,
      clerkUser.email
    );
    c.set('jwtPayload' as any, { id: internalUser.id, username: internalUser.username });
  } catch (error) {
    console.error('Error resolving internal user:', error);
    return c.json({ error: 'Failed to resolve user' }, 500);
  }

  await next();
});

// Telegram bot routes (webhook and setup are public)
app.route('/telegram', telegramRoutes);

export default app;
