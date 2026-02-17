import { Context, Next } from 'hono';
import * as jose from 'jose';

type Bindings = {
  DB: D1Database;
  CLERK_SECRET_KEY: string;
  CLERK_PUBLISHABLE_KEY: string;
  CLERK_PUBLISHABLE_KEY_DEV?: string;
};

// Cache for JWKS (keyed by publishable key to support multiple Clerk instances)
const jwksCache = new Map<string, { jwks: jose.JWTVerifyGetKey; time: number }>();
const JWKS_CACHE_DURATION = 60 * 60 * 1000; // 1 hour

async function getJWKS(publishableKey: string): Promise<jose.JWTVerifyGetKey> {
  const now = Date.now();
  const cached = jwksCache.get(publishableKey);
  if (cached && now - cached.time < JWKS_CACHE_DURATION) {
    return cached.jwks;
  }

  // Extract the frontend API domain from the publishable key
  // pk_test_xxx or pk_live_xxx format where xxx is base64 encoded domain
  const keyPart = publishableKey.replace('pk_test_', '').replace('pk_live_', '');
  const frontendApi = atob(keyPart).replace(/[^a-zA-Z0-9.-]/g, ''); // Remove any non-domain characters

  // Use Clerk's JWKS endpoint
  const jwksUrl = new URL(`https://${frontendApi}/.well-known/jwks.json`);

  const jwks = jose.createRemoteJWKSet(jwksUrl);
  jwksCache.set(publishableKey, { jwks, time: now });

  return jwks;
}

export interface ClerkJWTPayload {
  sub: string; // Clerk user ID
  email?: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  azp?: string; // Authorized party
  exp: number;
  iat: number;
  iss: string;
  nbf: number;
  sid?: string; // Session ID
}

export async function verifyClerkToken(
  token: string,
  publishableKey: string
): Promise<ClerkJWTPayload | null> {
  try {
    const jwks = await getJWKS(publishableKey);
    const { payload } = await jose.jwtVerify(token, jwks, {
      clockTolerance: 5, // 5 seconds tolerance for clock skew
    });

    return payload as unknown as ClerkJWTPayload;
  } catch (error) {
    console.error('Clerk token verification failed:', error);
    return null;
  }
}

/**
 * Middleware to verify Clerk JWT tokens
 * Sets c.set('clerkUser', payload) on success
 */
export function clerkAuth() {
  return async (c: Context<{ Bindings: Bindings }>, next: Next) => {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Missing or invalid Authorization header' }, 401);
    }

    const token = authHeader.substring(7);

    // Try production key first, then dev key
    const keys = [c.env.CLERK_PUBLISHABLE_KEY, c.env.CLERK_PUBLISHABLE_KEY_DEV].filter(Boolean);

    if (keys.length === 0) {
      console.error('No CLERK_PUBLISHABLE_KEY configured');
      return c.json({ error: 'Server configuration error' }, 500);
    }

    for (const key of keys) {
      const payload = await verifyClerkToken(token, key);
      if (payload) {
        c.set('clerkUser', payload);
        await next();
        return;
      }
    }

    return c.json({ error: 'Invalid or expired token' }, 401);
  };
}

/**
 * Get or create internal user ID from Clerk user
 * Handles migration of existing users by email matching
 */
export async function getOrCreateInternalUser(
  db: D1Database,
  clerkUserId: string,
  email?: string
): Promise<{ id: number; username: string; isNew: boolean }> {
  // First check if we already have a mapping
  const existingMapping = await db
    .prepare('SELECT internal_user_id FROM clerk_user_mapping WHERE clerk_user_id = ?')
    .bind(clerkUserId)
    .first<{ internal_user_id: number }>();

  if (existingMapping) {
    const user = await db
      .prepare('SELECT id, username FROM users WHERE id = ?')
      .bind(existingMapping.internal_user_id)
      .first<{ id: number; username: string }>();

    if (user) {
      return { id: user.id, username: user.username, isNew: false };
    }
  }

  // Check if there's an existing user with matching email (migration scenario)
  if (email) {
    const existingUser = await db
      .prepare('SELECT id, username FROM users WHERE username = ?')
      .bind(email)
      .first<{ id: number; username: string }>();

    if (existingUser) {
      // Create mapping for existing user
      await db
        .prepare('INSERT INTO clerk_user_mapping (clerk_user_id, internal_user_id, email) VALUES (?, ?, ?)')
        .bind(clerkUserId, existingUser.id, email)
        .run();

      return { id: existingUser.id, username: existingUser.username, isNew: false };
    }
  }

  // Create new user
  const username = email || `clerk_${clerkUserId.substring(0, 8)}`;
  
  // Try to find if username already exists (edge case where email wasn't found but username collision might occur)
  const userCheck = await db.prepare('SELECT id FROM users WHERE username = ?').bind(username).first<{id: number}>();
  
  if (userCheck) {
      // User exists but wasn't caught by email check? Or username collision. Link it.
      await db
        .prepare('INSERT INTO clerk_user_mapping (clerk_user_id, internal_user_id, email) VALUES (?, ?, ?)')
        .bind(clerkUserId, userCheck.id, email || null)
        .run();
      return { id: userCheck.id, username, isNew: false };
  }

  const result = await db
    .prepare('INSERT INTO users (username, password_hash) VALUES (?, ?) RETURNING id')
    .bind(username, 'clerk_managed') // No password needed for Clerk users
    .first<{ id: number }>();

  if (!result) {
    throw new Error('Failed to create user');
  }

  // Create mapping
  await db
    .prepare('INSERT INTO clerk_user_mapping (clerk_user_id, internal_user_id, email) VALUES (?, ?, ?)')
    .bind(clerkUserId, result.id, email || null)
    .run();

  return { id: result.id, username, isNew: true };
}
