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

## Local Development

To run everything locally:

1.  **Backend**:
    ```bash
    cd worker
    npm install
    npx wrangler dev
    ```
    *This runs the worker at `http://localhost:8787`.*

2.  **Frontend**:
    -   Ensure `.env` or `.env.local` has `VITE_API_URL=http://localhost:8787`.
    -   Run:
        ```bash
        npm run dev
        ```
