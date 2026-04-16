# LMS Project

Production-ready monorepo for LMS backend (Node.js/Express/MongoDB/Redis) and frontend (React/Vite), now Dockerized with security and scalability enhancements.

## What Was Added

- Containerization for backend and frontend.
- Orchestration with MongoDB and Redis via Docker Compose.
- Backend hardening:
  - Environment schema validation at startup.
  - Safer CORS policy via env-driven allowlist.
  - Security middleware: Helmet, HPP, Mongo sanitization.
  - Compression and improved HTTP server timeouts.
  - Readiness endpoint and graceful shutdown handling.
- Frontend hardening:
  - Removed hardcoded Google OAuth Client ID.
  - Env-driven API/OAuth configuration.
  - Nginx security headers and reverse proxy for `/api`.
- Documentation for backend/frontend setup and operations.

## Project Structure

- `backend`: API server and business logic
- `frontend`: React client
- `docker-compose.yml`: full local container stack

## Quick Start (Docker)

1. Review and update secrets in `backend/.env.docker`.
2. (Optional) set `VITE_GOOGLE_CLIENT_ID` in shell before build:

```bash
export VITE_GOOGLE_CLIENT_ID="your-google-client-id"
```

3. Start full stack:

```bash
docker compose up --build
```

4. Access services:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:4040`
- Health: `http://localhost:4040/api/health`

## Security Notes

- Existing committed secrets should be rotated immediately (JWT, DB, Redis, Cloudinary, email, Razorpay, OAuth).
- Keep real credentials only in local `.env`/secret manager, never in git.
- Set strict `CORS_ORIGIN` in production.
- Keep `ENABLE_SWAGGER=false` in production.

## Horizontal Scaling

- Backend is stateless and ready for multiple replicas.
- Redis is centralized for shared cache/queue behavior.
- Scale backend replicas:

```bash
docker compose up --build --scale backend=3
```

Use a gateway/load balancer in front of backend replicas for production traffic management.

## Documentation

- Backend docs: `backend/README.md`
- Frontend docs: `frontend/README.md`

## CI Pipeline (GitHub Actions)

Workflow file: `.github/workflows/ci.yml`

Checks included:

- Lint and build for `backend` and `frontend`
- Docker image build for backend and frontend
- `docker compose config` validation
- Secret scanning with Gitleaks

The workflow runs on pushes to `main`, `master`, `develop` and on all pull requests.

## Deploy Backend on Render

Render blueprint file: `render.yaml`

### Option A: Blueprint Deploy (recommended)

1. Push this repository to GitHub.
2. In Render, choose **New +** -> **Blueprint**.
3. Select this repo and deploy.
4. Fill all `sync: false` environment variables in Render dashboard.

### Option B: Manual Web Service

Use these settings:

- Runtime: Node
- Root Directory: `backend`
- Build Command: `npm ci`
- Start Command: `npm start`
- Health Check Path: `/api/health`

Set env vars from `backend/.env.example`.

Important production values:

- `NODE_ENV=production`
- `TRUST_PROXY=true`
- `ENABLE_SWAGGER=false`
- `CORS_ORIGIN=https://<your-vercel-domain>`
- `FRONTEND_URL=https://<your-vercel-domain>`

## Deploy Frontend on Vercel

Vercel config file: `frontend/vercel.json`

1. Import the same GitHub repo into Vercel.
2. Set **Root Directory** to `frontend`.
3. Framework preset: Vite.
4. Add environment variables:

- `VITE_API_BASE_URL=https://<your-render-backend-domain>`
- `VITE_GOOGLE_CLIENT_ID=<your-google-client-id>`

5. Deploy.

After deploy, update backend CORS value in Render to include the Vercel domain.
