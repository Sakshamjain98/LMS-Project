# Frontend Documentation

React + Vite frontend for the LMS platform.

## Configuration

Use `frontend/.env.example`:

```bash
cp .env.example .env
```

Environment variables:

- `VITE_API_BASE_URL`: backend API base URL (default fallback is `/api`)
- `VITE_GOOGLE_CLIENT_ID`: Google OAuth client ID

## Local Development

```bash
cd frontend
npm install
npm run dev
```

## Production Build

```bash
cd frontend
npm run build
npm run preview
```

## Dockerized Frontend

The frontend image is multi-stage:

- Build stage with Node.js
- Runtime stage with Nginx

Build and run manually:

```bash
cd frontend
docker build \
	--build-arg VITE_API_BASE_URL=/api \
	--build-arg VITE_GOOGLE_CLIENT_ID=your-google-client-id \
	-t lms-frontend .

docker run --rm -p 5173:80 lms-frontend
```

## Nginx Reverse Proxy

Nginx is configured to:

- Serve SPA routes using `try_files`
- Proxy `/api/*` to backend service
- Send standard security headers
- Enable gzip compression for common text assets

Nginx config file: `frontend/docker/nginx.conf`

## Security Improvements Applied

- Removed hardcoded OAuth client ID from source.
- Moved runtime values to environment-based configuration.
- Added secure default API base fallback and request timeout in Axios.

## Best Practices

- Use HTTPS in production.
- Restrict OAuth redirect/origin settings in Google Console.
- Keep `.env` files out of git and inject env values via CI/CD.

## Deploy on Vercel

Project includes Vercel config: `vercel.json`.

1. Import repository into Vercel.
2. Set Root Directory to `frontend`.
3. Framework preset: Vite.
4. Set environment variables in Vercel:

- `VITE_API_BASE_URL=https://<your-render-backend-domain>`
- `VITE_GOOGLE_CLIENT_ID=<your-google-client-id>`

5. Deploy and copy the generated Vercel domain.

After deployment, set backend `CORS_ORIGIN` and `FRONTEND_URL` in Render to this Vercel URL.

## SPA Routing on Vercel

`vercel.json` contains a rewrite to `index.html` for client-side routes so direct refresh on nested routes works.

## CI Checks

Root workflow `../.github/workflows/ci.yml` validates frontend install, lint, build, Docker build, compose validation, and secret scanning.
