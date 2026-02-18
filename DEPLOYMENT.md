# Deployment Guide for TagihanSerampangan

This guide explains how to deploy the refactored application to Cloudflare.

## Prerequisites

- [Node.js](https://nodejs.org/) installed.
- [Cloudflare Account](https://dash.cloudflare.com/sign-up).
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) installed: `npm install -g wrangler`

## 1. Deploy the Backend (Cloudflare Worker)

1.  Navigate to the `worker` directory:
    ```bash
    cd worker
    ```

2.  Install Dependencies:
    ```bash
    npm install
    ```

3.  Login to Cloudflare:
    ```bash
    npx wrangler login
    ```

3.  Create the D1 Database:
    ```bash
    npx wrangler d1 create tagihan-db
    ```
    *Copy the `database_id` from the output.*

4.  Update `wrangler.toml`:
    -   Open `worker/wrangler.toml`.
    -   Replace `database_id = "tagihan-db-id"` with your actual Database ID.

5.  Initialize the Database Schema:
    ```bash
    npx wrangler d1 execute tagihan-db --file=./schema.sql --remote
    ```

6.  Deploy the Worker:
    ```bash
    npx wrangler deploy
    ```
    *Note the URL of your deployed worker (e.g., `https://tagihan-api.your-subdomain.workers.dev`).*

## 2. Configure the Frontend

1.  Navigate back to the root directory:
    ```bash
    cd ..
    ```

2.  Create/Update `.env.production`:
    -   Create a file named `.env.production` in the root.
    -   Add your worker URL:
        ```
        VITE_API_URL=https://tagihan-api.your-subdomain.workers.dev
        ```

## 3. Deploy the Frontend (Cloudflare Pages)

1.  Build the frontend:
    ```bash
    npm run build
    ```

2.  Deploy to Cloudflare Pages:
    ```bash
    npx wrangler pages deploy dist --project-name tagihan-frontend
    ```
    *Follow the prompts to create the project if it doesn't exist.*

## 4. Verification

1.  Open the URL provided by Cloudflare Pages.
2.  Register a new account.
3.  Login and verify you can add income, savings, and budget items.
4.  Try accessing the URL from another device (e.g., your phone) and login with the same credentials. You should see the same data!

## 5. Understanding Environments & Data (Important)

### The "One Database" Architecture
Currently, this project uses a **single Cloudflare D1 database** for both:
1.  **Local Development** (when running `wrangler dev --remote`)
2.  **Production** (the live worker)

This means **your data is real**. If you add an expense locally while connected to remote, it shows up in production.

### Clerk Authentication: Dev vs Prod
Clerk (the auth provider) has two separate environments:
1.  **Development:** Uses `pk_test_...` keys. Users created here are distinct from Production.
2.  **Production:** Uses `pk_live_...` keys.

**Critical Note:**
-   If you log in with `test@example.com` in **Dev** (localhost), Clerk gives you User ID `user_dev_123`.
-   If you log in with `test@example.com` in **Prod** (your live site), Clerk gives you User ID `user_live_456`.

**How We Handle This:**
To prevent data loss when switching environments, the backend links Clerk users to internal data based on **Email Address**.
-   If `user_live_456` logs in, we check if an internal user with that email already exists.
-   If yes, we link them. This ensures you see your data regardless of whether you are on localhost (using Dev keys) or Production (using Live keys), provided the email matches.

### Troubleshooting "Missing Data"
If your data seems to disappear:
1.  Check which environment you are in (Localhost vs Production URL).
2.  Check if you are logged in with the **exact same email**.
3.  The system is designed to auto-link accounts by email. If you used a different email, you created a new, empty account.

## Local Development

To run everything locally while connecting to the **Real Production Database**:

1.  **Backend (Worker)**:
    ```bash
    cd worker
    npm install
    npx wrangler dev --remote --port 8787
    ```
    *   `--remote`: Connects to the real D1 database at Cloudflare.
    *   `--port 8787`: Forces the port to match the frontend config.

2.  **Frontend**:
    -   Ensure `.env.local` exists in the root:
        ```env
        VITE_API_URL=http://localhost:8787
        VITE_CLERK_PUBLISHABLE_KEY=pk_test_... (Your Clerk Dev Key)
        ```
    -   Run:
        ```bash
        npm run dev
        ```

3.  **Access**: Open `http://localhost:8081` (or whatever port Vite assigns).

---

## Deployment Checklist

Before deploying, ensure:
1.  **Environment Variables:**
    -   Frontend `.env.production` has the **Live** Clerk Key (`pk_live_...`).
    -   Worker `wrangler.toml` has the **Live** Clerk Key in `[vars]`.
2.  **Database:**
    -   The D1 database ID in `wrangler.toml` matches your production DB.

