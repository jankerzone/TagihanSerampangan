import { Hono } from 'hono';
import { sign } from 'hono/jwt';
import * as bcrypt from 'bcryptjs';

type Bindings = {
    DB: D1Database;
    JWT_SECRET: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.post('/register', async (c) => {
    const { username, password } = await c.req.json();

    if (!username || !password) {
        return c.json({ error: 'Username and password required' }, 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const result = await c.env.DB.prepare(
            'INSERT INTO users (username, password_hash) VALUES (?, ?) RETURNING id'
        )
            .bind(username, hashedPassword)
            .first();

        if (!result) {
            return c.json({ error: 'Failed to register' }, 500);
        }

        return c.json({ message: 'User registered', userId: result.id }, 201);
    } catch (e: any) {
        if (e.message.includes('UNIQUE constraint failed')) {
            return c.json({ error: 'Username already exists' }, 409);
        }
        return c.json({ error: 'Server error' }, 500);
    }
});

app.post('/login', async (c) => {
    const { username, password } = await c.req.json();

    if (!username || !password) {
        return c.json({ error: 'Username and password required' }, 400);
    }

    const user = await c.env.DB.prepare(
        'SELECT * FROM users WHERE username = ?'
    )
        .bind(username)
        .first<any>();

    if (!user) {
        return c.json({ error: 'Invalid credentials' }, 401);
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
        return c.json({ error: 'Invalid credentials' }, 401);
    }

    const token = await sign(
        { id: user.id, username: user.username, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 }, // 7 days
        c.env.JWT_SECRET || 'fallback_secret_for_dev'
    );

    return c.json({ token, user: { id: user.id, username: user.username } });
});

export const authRoutes = app;
