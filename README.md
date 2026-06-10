# CultTrack AI - Smart Asset Management System

CultTrack AI is a full-stack inventory, booking, resource allocation, and audit platform built for the Cultural Council of IIT Roorkee. It helps council admins manage shared assets such as cameras, lights, audio gear, costumes, props, and stage infrastructure while giving members a simple way to request resource loans.

The platform includes live inventory tracking, booking approvals, issue/return workflows, QR-assisted check-in, notification emails, password reset, analytics, and demand forecasting.

## Live Deployment

- Frontend: [https://frontend-seven-lyart-83.vercel.app](https://frontend-seven-lyart-83.vercel.app)
- Backend API: [https://smart-asset-management-system-oiyh.onrender.com](https://smart-asset-management-system-oiyh.onrender.com)
- Backend health check: [https://smart-asset-management-system-oiyh.onrender.com/healthz](https://smart-asset-management-system-oiyh.onrender.com/healthz)
- Repository: [https://github.com/arnaviitr2135/smart-asset-management-system](https://github.com/arnaviitr2135/smart-asset-management-system)

## Features

- User authentication with JWT-based sessions
- User and admin roles
- User registration and login
- Forgot password and reset password flow
- Email notifications through Resend API, with Gmail SMTP fallback
- Inventory catalog with category filters and availability counts
- Asset categories for camera, lighting, audio, costume, prop, recording, and infrastructure items
- Asset CRUD operations for council admins
- Booking request workflow with quantity and date validation
- Overlapping booking checks to prevent over-allocation
- Admin approval and rejection workflow
- Asset issue, return, and overdue allocation tracking
- QR-code based asset scan simulation
- Asset health reports and damaged/maintenance state handling
- In-app notifications
- Audit log for important user and admin actions
- Analytics dashboard with utilization metrics
- AI-style demand forecasting and shortage prediction
- Responsive Vite React frontend
- Docker Compose setup for local full-stack development
- Render, Vercel, and Neon deployment support

## Tech Stack

Frontend:

- React
- Vite
- TypeScript
- Tailwind CSS
- Recharts
- Lucide React icons

Backend:

- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT authentication
- Nodemailer
- Resend email API

Deployment:

- Vercel for frontend
- Render for backend
- Neon PostgreSQL for production database
- Docker and Docker Compose for local development

## Project Structure

```text
smart-asset-management-system/
  backend/
    prisma/
      schema.prisma
      seed.ts
    src/
      controllers/
      middleware/
      routes/
      services/
      index.ts
    Dockerfile
    Dockerfile.render
    package.json
  frontend/
    src/
      context/
      pages/
      App.tsx
      main.tsx
    Dockerfile
    vercel.json
    package.json
  docker-compose.yml
  render.yaml
  README.md
```

## Demo Accounts

The local seed script creates these accounts:

| Role | Email | Password | Access |
| --- | --- | --- | --- |
| Council Admin | `admin@culttrack.in` | `password123` | Asset management, approvals, issue/return desk, health logs, audit logs |
| Society Member | `member@culttrack.in` | `password123` | Browse catalog, request bookings, view loans and notifications |

Production data depends on the connected Neon database. If a password reset email is not sent, confirm that the email address exists in the production users table.

## Local Setup With Docker

Prerequisites:

- Docker Desktop
- Git

Clone and run:

```bash
git clone https://github.com/arnaviitr2135/smart-asset-management-system.git
cd smart-asset-management-system
docker compose up --build
```

Local URLs:

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend API: [http://localhost:5000](http://localhost:5000)
- Health check: [http://localhost:5000/healthz](http://localhost:5000/healthz)

The Docker setup starts PostgreSQL, syncs the Prisma schema, seeds demo users/assets, starts the backend, and starts the frontend.

## Manual Local Setup

Prerequisites:

- Node.js 20+
- PostgreSQL
- Git

Backend:

```bash
cd backend
npm install
npx prisma db push
npm run prisma:seed
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

Create `backend/.env` for local backend development:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/culttrack?schema=public
JWT_SECRET=culttrack-super-secret-key
PORT=5000
FRONTEND_URL=http://localhost:5173

# Recommended email provider
RESEND_API_KEY=
RESEND_FROM=CultTrack AI <onboarding@resend.dev>

# Optional Gmail SMTP fallback
SMTP_USER=
SMTP_PASS=
```

Frontend local env, if running without Docker:

```env
VITE_API_URL=http://localhost:5000
```

Never commit real secrets or API keys.

## Production Environment

Vercel frontend environment:

```env
VITE_API_URL=https://smart-asset-management-system-oiyh.onrender.com
```

Render backend environment:

```env
DATABASE_URL=<Neon pooled PostgreSQL connection string>
JWT_SECRET=<strong random secret>
PORT=5000
FRONTEND_URL=https://frontend-seven-lyart-83.vercel.app
RESEND_API_KEY=<Resend API key>
RESEND_FROM=CultTrack AI <onboarding@resend.dev>
```

Optional Render SMTP fallback:

```env
SMTP_USER=<gmail address>
SMTP_PASS=<gmail app password>
```

For production-quality email delivery, verify a domain in Resend and use an address such as:

```env
RESEND_FROM=CultTrack AI <noreply@yourdomain.com>
```

## Deployment Notes

Frontend deployment:

- Deployed on Vercel from the `frontend` app.
- `VITE_API_URL` must point to the Render backend URL.
- Redeploy Vercel after changing frontend environment variables.

Backend deployment:

- Deployed on Render using Docker.
- Current backend Dockerfile path is `backend/Dockerfile.render`.
- Docker build context should be `backend`.
- The backend starts with `node dist/index.js`.
- Run Prisma schema sync separately when schema changes:

```bash
npx prisma db push
```

Database:

- Production uses Neon PostgreSQL.
- Local Docker uses a Postgres 16 container.

## Email And Password Reset

Password reset flow:

1. User requests a reset link from the frontend.
2. Backend checks if the email exists.
3. If the user exists, a reset token is created.
4. The email provider sends a reset link to the user.
5. The user opens the link and sets a new password.

Important behavior:

- The backend intentionally returns a generic success message for both registered and non-registered emails.
- If Render logs show `Request received for non-registered email`, no email will be sent.
- If Resend is configured correctly, Render logs should show `[Resend] Sent to ...`.
- If Gmail SMTP fallback is used, Render logs should show `[SMTP] Gmail SMTP connected ...`.

## API Overview

Base URL:

```text
https://smart-asset-management-system-oiyh.onrender.com
```

Main route groups:

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`
- `/api/v1/assets`
- `/api/v1/bookings`
- `/api/v1/allocations`
- `/api/v1/analytics`
- `/api/v1/audit`
- `/api/v1/notifications`
- `GET /healthz`

Most protected routes require:

```http
Authorization: Bearer <jwt_token>
```

## Typical Workflow

Member workflow:

1. Register or log in.
2. Browse the inventory catalog.
3. Select an asset, quantity, start date, end date, and purpose.
4. Submit a booking request.
5. Track booking status and notifications.
6. Return issued assets after use.

Admin workflow:

1. Log in as an admin.
2. Add or update inventory assets.
3. Review pending booking requests.
4. Approve or reject requests.
5. Issue approved assets.
6. Mark returns and asset condition.
7. Review health logs, audit logs, and analytics.

## Troubleshooting

Backend health:

```bash
curl https://smart-asset-management-system-oiyh.onrender.com/healthz
```

If forgot password does not send email:

- Confirm the email is registered in production.
- Confirm `RESEND_API_KEY` is set on Render.
- Confirm `RESEND_FROM` is set.
- Redeploy/restart Render after changing environment variables.
- Check Render logs for `[Password Reset]`, `[Resend]`, `[SMTP]`, or `[Email Error]`.

If frontend cannot reach backend:

- Confirm Vercel has `VITE_API_URL=https://smart-asset-management-system-oiyh.onrender.com`.
- Redeploy Vercel after changing env vars.
- Confirm Render health check is passing.

If Docker local database has old data:

```bash
docker compose down -v
docker compose up --build
```

This resets the local Postgres volume and reseeds demo data.

## Security Notes

- Do not commit `.env` files or secrets.
- Use a strong `JWT_SECRET` in production.
- Rotate leaked SMTP passwords or API keys immediately.
- Prefer Resend API keys over Gmail SMTP for hosted deployments.
- Use verified Resend domains for production email.

## License

This project is currently marked as ISC in `package.json`.
