# Deploying SmartLoan to Render.com

This repository is fully configured and optimized for 1-click deployment on [Render](https://render.com).

---

## Quick Start: Push to GitHub / GitLab

Before deploying on Render, push your local code to your GitHub or GitLab account:

```bash
# 1. Initialize git (if not already done)
git init
git branch -M main

# 2. Stage all files and commit
git add .
git commit -m "feat: configure SmartLoan for Render deployment"

# 3. Link your remote repository and push (replace YOUR_USERNAME / REPO_NAME)
git remote add origin https://github.com/YOUR_USERNAME/smartloan.git
git push -u origin main
```

---

## Deployment Options

### Option 1: Render Static Site (Recommended — 100% Free & Fastest)

Render Static Sites are **completely free**, include automatic SSL certificates, have zero spin-down / cold start delays, and are hosted on Render's global CDN.

#### Setup Steps:
1. Log into your [Render Dashboard](https://dashboard.render.com).
2. Click **New +** → **Static Site**.
3. Connect your `smartloan` GitHub/GitLab repository.
4. Configure the settings:
   - **Name**: `smartloan` (or your preferred name)
   - **Branch**: `main`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
5. Click **Advanced** → **Add Rewrite / Redirect Rule**:
   - **Type**: `Rewrite`
   - **Source**: `/*`
   - **Destination**: `/index.html`
6. Click **Create Static Site**.
7. In ~1 minute, your site is live with HTTPS!

---

### Option 2: Render Blueprint (Automatic via `render.yaml`)

We have pre-configured [render.yaml](file:///c:/Users/Administrator/Desktop/smartloan/render.yaml) with production security headers, SPA rewrite rules, and asset caching.

#### Setup Steps:
1. In the Render Dashboard, click **New +** → **Blueprint**.
2. Connect your `smartloan` repository.
3. Render automatically parses `render.yaml` and applies all build commands, headers, and rewrite rules.
4. Click **Apply**.

---

### Option 3: Render Web Service (Node.js)

If you prefer hosting SmartLoan as a dynamic Node.js service:

- **Environment**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Health Check Path**: `/health`
- **Port**: Automatic (reads Render's dynamic `$PORT` or defaults to `10000`)

Features included in [server.js](file:///c:/Users/Administrator/Desktop/smartloan/server.js):
- High-performance native Node.js HTTP server (zero heavy dependencies).
- Built-in `/health` JSON endpoint for zero-downtime health checks.
- Graceful shutdown handlers for `SIGTERM` and `SIGINT`.
- Strict Content-Security-Policy (CSP), HSTS, X-Content-Type-Options, and X-Frame-Options.
- Long-term cache headers for bundled assets (`/assets/*`).

---

## Local Verification Commands

```powershell
# Development server with live reload
npm.cmd run dev

# Production bundle build
npm.cmd run build

# Run production Node.js server locally
npm.cmd start
# or
node server.js
```
