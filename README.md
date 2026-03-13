# VRF Engineering Platform

Active applications:

- `backend`: Express API with clean module boundaries for `auth`, `billing`, and `designer`
- `auth-front`: React + Vite + Tailwind frontend used by the platform

## Architecture

### Backend

The backend now follows a simple clean architecture split:

- `src/modules/*`: module-specific controllers, routes, and use cases
- `src/repositories/*`: infrastructure persistence adapters
- `src/services/*`: external integrations such as email and Stripe
- `src/shared/*`: cross-cutting errors and shared utilities
- `src/engine/*`: engineering calculations for sizing, cost, and validation

Business logic lives in module use cases, while controllers only adapt HTTP requests and responses.

### Frontend

The active frontend is `auth-front/src`:

- `pages/*`: route-level screens
- `hooks/*` and `services/*`: auth session and API access
- `vrf/*`: VRF designer feature, including canvas, panels, store, and presentation helpers

Legacy route files were removed from the active build so the current app has a single navigation flow.

## Run

```bash
npm run install:all
npm run dev
```

Services:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3100`

## Environment

Create `backend/.env` and configure:

- `DATABASE_URL`
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `EMAIL_USER`
- `EMAIL_PASS`
- `APP_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_ID`

## MySQL bootstrap

The project includes:

- `backend/src/database/schema.sql`: table definitions
- `backend/src/database/mysql.bootstrap.sql`: database + user + grants + schema import

Example from a MySQL admin shell:

```bash
mysql -u root -p
```

Then:

```sql
SOURCE C:/Users/LeudyRN/VRF/VRF/backend/src/database/mysql.bootstrap.sql;
```

Default local credentials in the bootstrap:

- database: `vrf_platform`
- user: `vrf_app`
- password: `ChangeThisPassword123!`

## Notes

- The backend falls back to in-memory repositories for local development when MySQL is unavailable.
- Email delivery degrades safely when `nodemailer` is not installed.
- Equipment seed data lives in `data/equipmentLibrary/genericEquipment.json`.
