# Backend Documentation

Express-based API for LMS with MongoDB and Redis integration.

## Runtime Stack

- Node.js 20+
- Express 5
- MongoDB (Mongoose)
- Redis

## Security & Scalability Enhancements

- Environment validation with Zod at startup (`src/config/env.js`).
- Security middleware:
  - `helmet`
  - `hpp`
  - `express-mongo-sanitize`
- Configurable CORS allowlist from `CORS_ORIGIN`.
- Request compression enabled.
- Configurable body-size limit (`REQUEST_SIZE_LIMIT`).
- DB connection tuning:
  - `DB_SERVER_SELECTION_TIMEOUT_MS`
  - `DB_MAX_POOL_SIZE`
- Health and readiness endpoints:
  - `GET /api/health`
  - `GET /api/ready`
- Graceful shutdown on `SIGINT`/`SIGTERM` and tuned keep-alive timeouts.
- Swagger gated by env (`ENABLE_SWAGGER=true` only when needed).

## Key Files

- `src/server.js`: startup, graceful shutdown, HTTP tuning
- `src/app.js`: middleware, CORS policy, routes
- `src/config/env.js`: environment schema validation
- `src/config/db.js`: Mongo connection settings
- `Dockerfile`: production image definition

## Environment Variables

Use `backend/.env.example` as the base template.

Minimum required for startup:

- `MONGO_URI`
- `JWT_SECRET` (16+ chars)

Important recommended settings:

- `NODE_ENV=production`
- `CORS_ORIGIN=https://your-frontend-domain`
- `TRUST_PROXY=true` (behind reverse proxy)
- `ENABLE_SWAGGER=false`

## Local Development

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

## One-Time Migration: Legacy PYQ Types

If older tests were saved with `type: "PYQ"` or missing `type`, run this migration once.

By default, it converts:
- `type: "PYQ"` (always), and
- missing type only when title/description/instructions indicate PYQ intent.

- Dry-run (preview only):

```bash
cd backend
npm run migrate:test-types:pyq
```

- Apply updates:

```bash
cd backend
npm run migrate:test-types:pyq -- --apply
```

This script updates matching records to `type: "pyq"`.

If you want to force-convert **all** missing types (use carefully):

```bash
cd backend
npm run migrate:test-types:pyq -- --apply --force-all-missing
```

## Run with Docker

```bash
cd backend
docker build -t lms-backend .
docker run --rm -p 4040:4040 --env-file .env.docker lms-backend
```

## API Availability Checks

- Liveness:

```bash
curl http://localhost:4040/api/health
```

- Readiness (includes DB connectivity):

```bash
curl http://localhost:4040/api/ready
```

## Production Recommendations

- Keep secrets in a managed secret store (Vault, cloud secret manager).
- Rotate any previously exposed credentials immediately.
- Add centralized log collection and metrics (ELK/Datadog/Prometheus).
- Run multiple backend instances with a load balancer.
- Enforce TLS at ingress/reverse proxy.

## Deploy on Render

Project includes a Render blueprint: `../render.yaml`.

### Deploy using Blueprint

1. Push the repository to GitHub.
2. In Render, click **New +** -> **Blueprint**.
3. Select repository and deploy.
4. Add all sensitive env vars marked with `sync: false`.

### Deploy as Manual Web Service

Use:

- Runtime: Node
- Root Directory: `backend`
- Build Command: `npm ci`
- Start Command: `npm start`
- Health Check Path: `/api/health`

Critical env vars:

- `MONGO_URI`
- `JWT_SECRET`
- `CORS_ORIGIN` (set to Vercel frontend URL)
- `REDIS_URL` (or `REDIS_HOST`/`REDIS_PORT`)
- `TRUST_PROXY=true`
- `NODE_ENV=production`

If you use third-party features, also set email, Cloudinary, Google OAuth and Razorpay values.

## CI Checks

CI workflow: `../.github/workflows/ci.yml`

It validates:

- install + lint + build
- Docker image build
- Docker Compose config
- secret scanning
