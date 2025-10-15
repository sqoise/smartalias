## Backend Deployment Guide (Render / Railway / Fly.io + Supabase)

This document prepares the SMARTLIAS backend for production hosting with minimal CORS friction and stable file uploads.

### 1. Prerequisites
| Component | Status |
|-----------|--------|
| Supabase PostgreSQL | Provisioned (get `DATABASE_URL`) |
| Frontend URL | e.g. https://smartlias.netlify.app |
| JWT Secret | 64+ char random value |
| SMS Provider (optional) | iprog credentials |

### 2. Required Environment Variables
```
PORT=9000
NODE_ENV=production
FRONTEND_URL=https://smartlias.netlify.app
ALLOWED_ORIGINS=https://smartlias.netlify.app
DATABASE_URL=postgresql://<user>:<pass>@<host>:5432/<db>
JWT_SECRET=<LONG_RANDOM_SECRET>
JWT_EXPIRES_IN=12h
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=10
LOCKOUT_TIME=1800000
UPLOADS_DIR=uploads
UPLOADS_PUBLIC_URL=https://<backend-domain>/uploads
```
Optional:
```
SMS_PROVIDER=iprog
IPROG_API_TOKEN=...
IPROG_SMS_PROVIDER=0
GEMINI_ENABLED=false
GEMINI_API_KEY=...
```

Preview Deployments (optional):
```
PREVIEW_ORIGIN_PATTERN=^https:\/\/[a-z0-9-]+--smartlias\.netlify\.app$
```

### 3. Deployment Steps (Render Example)
1. Create Web Service → Select repo → root: `backend/`.
2. Build command: (empty) Render auto installs; or `npm install --production`.
3. Start command: `node server.js`.
4. Add environment variables.
5. (Optional) Add disk for uploads → mount at `/app/uploads` and keep `UPLOADS_DIR=uploads`.
6. Deploy.

### 4. Smoke Tests
```
curl -s https://<backend-domain>/api/health | jq
curl -H "Origin: https://smartlias.netlify.app" -I https://<backend-domain>/api/health
```
Expect: 200, no CORS errors.

Upload test (via app) then:
```
curl -I https://<backend-domain>/uploads/<filename>
```

### 5. CORS Policy
- Only allow explicit origins in `ALLOWED_ORIGINS` (comma-separated).
- Preview regex (if set) enables dynamic Netlify preview URLs.
- Credentials disabled (bearer tokens only) → simpler preflight.

### 6. Logs To Watch
- `CORS blocked origin` → Add origin if valid.
- `PostgreSQL connection failed` → Re-check `DATABASE_URL` or Supabase network settings.
- `File deleted successfully` / `Created uploads directory` on file ops.

### 7. Security Hardening
- Rotate `JWT_SECRET` before launch.
- Enforce HTTPS at platform layer.
- Keep `LOCKOUT_TIME=1800000` (30m) to mitigate brute force.
- Remove any demo accounts in production data set.

### 8. Scaling Considerations
- Stateless API (horizontal scaling fine; shared disk for uploads needed or move to object storage later).
- Future: implement storage adapter → swap local disk for object storage.

### 9. Troubleshooting Matrix
| Symptom | Likely Cause | Resolution |
|---------|--------------|------------|
| 500 on /api/health | DB unreachable | Verify `DATABASE_URL`, network, credentials |
| CORS blocked | Origin mismatch | Add correct https origin (no trailing slash) |
| Upload 404 | Missing disk / wrong UPLOADS_DIR | Ensure mount + path matches env |
| Token invalid sooner than expected | JWT_EXPIRES_IN mismatch | Adjust value / redeploy |
| Slow first request | Cold start / plan tier | Warm with health pings |

### 10. Production Checklist
- [ ] Backend deployed & healthy
- [ ] Frontend hitting correct API
- [ ] CORS warnings absent
- [ ] Upload persists after restart
- [ ] JWT secret secure
- [ ] Logs clean (no repeated error spam)

---
Document version: Initial backend deployment guide.
