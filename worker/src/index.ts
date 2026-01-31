import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt';
import { authRoutes } from './auth';
import { dataRoutes } from './data';
import { savingsGoalsRoutes } from './savings-goals';

type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
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

export default app;
