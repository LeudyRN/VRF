# VRF Engineering Platform

A modular full-stack platform for VRF design workflows with:

- Authentication (register/login/JWT)
- Gmail email verification + password reset flow
- Stripe subscription checkout + webhook status sync
- Access control (verified email + active subscription)
- VRF design dashboard with equipment/canvas/BOM/calculations

## Run

```bash
npm install
npm run dev
```

- Backend: `http://localhost:3100`
- Frontend: `http://localhost:5173`

## Backend environment

Copy `backend/.env.example` to `backend/.env` and configure:

- `DATABASE_URL`
- `JWT_SECRET`
- `EMAIL_USER`
- `EMAIL_PASS` (Gmail app password, 16 chars)
- `APP_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_ID`

## Important notes

- The backend can fallback to an in-memory user/subscription store if MySQL is unavailable in local/dev environments.
- Email sending uses Gmail + Nodemailer when `nodemailer` is available; otherwise it logs a warning and continues in degraded mode.
- Stripe checkout uses Stripe HTTP API; webhook signature validation is implemented with HMAC-SHA256.
