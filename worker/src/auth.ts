import { Hono } from 'hono';
import { clerkAuth, getOrCreateInternalUser, ClerkJWTPayload } from './clerk-auth';

type Bindings = {
    DB: D1Database;
    CLERK_SECRET_KEY: string;
    CLERK_PUBLISHABLE_KEY: string;
};

type Variables = {
    clerkUser: ClerkJWTPayload;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Get current user info with linked devices
app.get('/me', clerkAuth(), async (c) => {
    const clerkUser = c.get('clerkUser');

    if (!clerkUser || !clerkUser.sub) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    try {
        // Get or create internal user (handles migration)
        const internalUser = await getOrCreateInternalUser(
            c.env.DB,
            clerkUser.sub,
            clerkUser.email
        );

        // Fetch linked devices
        const linkedDevices = await c.env.DB.prepare(
            'SELECT id, telegram_user_id, telegram_username, first_name, created_at FROM linked_devices WHERE user_id = ?'
        )
            .bind(internalUser.id)
            .all();

        return c.json({
            user: {
                id: internalUser.id,
                clerkId: clerkUser.sub,
                username: internalUser.username,
                email: clerkUser.email,
                linkedDevices: linkedDevices.results || []
            }
        });
    } catch (error) {
        console.error('Error in /auth/me:', error);
        return c.json({ error: 'Server error' }, 500);
    }
});

export const authRoutes = app;
