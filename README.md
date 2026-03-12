# SIAGA Backend API

[English](README.md) | [Bahasa Indonesia](README.id.md)

REST API server for **SIAGA** (Sistem Informasi dan Aksi untuk Gerakan Aman) — a civic technology platform connecting citizens and local government for transparent environmental and social issue management.

> For full project overview, features, and technical documentation, see the [Frontend Repository](https://github.com/orgs/StackHorizon-ProxoCoris/repositories).

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Related Repositories](#related-repositories)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the Server](#running-the-server)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Database](#database)
- [Technical Documentation](#technical-documentation)
- [Team](#team)

---

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| Express.js | 5 | HTTP server and REST API framework |
| TypeScript | 5.9 | Type-safe server development |
| Supabase JS | 2.97 | PostgreSQL client, authentication, and Realtime |
| Google Gemini AI | 1.43 | AI chat assistant (disaster/safety education) |
| Expo Server SDK | 6.0 | Push notification delivery to mobile clients |
| Helmet | 8.1 | HTTP security headers |
| Morgan | 1.10 | Request logging |
| Express Rate Limit | 8.2 | API rate limiting (200 req/15min production) |
| Multer | 2.0 | Multipart file upload handling |
| fast-xml-parser | 5.4 | BMKG XML data parsing |

---

## Related Repositories

| Repository | Description |
|---|---|
| [Frontend App](https://github.com/orgs/StackHorizon-ProxoCoris/repositories) | React Native / Expo mobile application |
| **Backend API (this repo)** | Express.js REST API server |

---

## Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- A [Supabase](https://supabase.com) project with PostgreSQL database
- A [Google AI Studio](https://aistudio.google.com) API key for Gemini

---

## Installation

Because SIAGA relies on both a frontend application and a backend API, **you must set up and run the backend first** before the frontend can function properly.

### Part 1: Backend Setup (This Repository)

1. Clone the repository:
```bash
git clone https://github.com/StackHorizon-ProxoCoris/backend-mobileapp.git
cd backend-mobileapp
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```
Edit `.env` with your credentials (see [Environment Variables](#environment-variables)).

4. Run database migrations:

> [!NOTE]
> Migration files are located in `src/database/migrations/`. Execute them sequentially (001–015) against your Supabase PostgreSQL database using the Supabase SQL Editor or any PostgreSQL client.

> [!IMPORTANT]
> Migration `008` (budget tables) has been removed from the codebase. If your database was created before this change, you may safely drop the `budget_projects` and `budget_dinas` tables. Migration `015` adds resolution proof columns to the `reports` table — make sure to run it for the Gov Resolution feature.

### Part 2: Frontend Setup

Once the backend is configured, open a new terminal to set up the frontend:

1. Clone the frontend repository:
```bash
git clone https://github.com/StackHorizon-ProxoCoris/frontend-mobileapp.git
cd frontend-mobileapp
```

2. Install dependencies:
```bash
npm install
```

3. Configure Supabase Realtime for the frontend (instructions available in the [Frontend README](https://github.com/StackHorizon-ProxoCoris/frontend-mobileapp/blob/development/README.md)).

4. Run the Expo dev server (ensure the backend server is already running!):
```bash
npx expo start
```

---

## Environment Variables

Create a `.env` file based on `.env.example`:

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Server port (default: `3000`) |
| `NODE_ENV` | No | `development` or `production` (default: `development`) |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-side operations) |
| `JWT_SECRET` | Yes | Secret for JWT token validation (min 32 characters) |
| `CORS_ORIGIN` | No | Allowed CORS origin (default: `http://localhost:8081`) |
| `GEMINI_API_KEY` | Yes | Google AI Studio API key for Gemini chat |

> [!CAUTION]
> Never commit the `.env` file to version control. The `.gitignore` file already excludes it.

---

## Running the Server

Start the development server with hot-reload:

```bash
npm run dev
```

The server will start at `http://localhost:3000` by default.

| Command | Description |
|---|---|
| `npm run dev` | Development server with hot-reload (tsx watch) |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Run compiled production build |
| `npm run lint` | Type-check without emitting output |

> [!TIP]
> In development mode, the rate limiter allows 1000 requests per 15 minutes per IP. In production, this is reduced to 200 to prevent abuse.

---

## Project Structure

```
backend-mobileapp/
├── src/
│   ├── index.ts                  # Server entry point and middleware setup
│   ├── config/
│   │   └── env.ts                # Environment variable configuration
│   ├── controllers/              # Request handlers (business logic)
│   │   ├── auth.controller.ts    #   Authentication (login, register, profile)
│   │   ├── report.controller.ts  #   Report CRUD, voting, verification, resolution proof
│   │   ├── action.controller.ts  #   Positive action CRUD, join/leave
│   │   ├── comment.controller.ts #   Comment creation and listing
│   │   ├── chat.controller.ts    #   Gemini AI chat integration
│   │   ├── bmkg.controller.ts    #   BMKG earthquake data proxy
│   │   ├── notification.controller.ts  # Notification inbox management
│   │   ├── device-token.controller.ts  # Push notification token registry
│   │   ├── activity.controller.ts      # User activity history
│   │   ├── area-status.controller.ts   # District-level area status
│   │   ├── admin.controller.ts         # Super-admin: dashboard, users, moderation
│   │   ├── info.controller.ts          # Info articles and education content
│   │   ├── bookmark.controller.ts      # Report/action bookmarks
│   │   ├── feedback.controller.ts      # User feedback submissions
│   │   └── upload.controller.ts        # File upload to Supabase Storage
│   ├── routes/                   # Route definitions (endpoint mapping)
│   │   ├── auth.routes.ts
│   │   ├── report.routes.ts
│   │   ├── action.routes.ts
│   │   ├── comment.routes.ts
│   │   ├── chat.routes.ts
│   │   ├── bmkg.routes.ts
│   │   ├── notification.routes.ts
│   │   ├── device-token.routes.ts
│   │   ├── activity.routes.ts
│   │   ├── area-status.routes.ts
│   │   ├── admin.routes.ts
│   │   ├── info.routes.ts
│   │   ├── bookmark.routes.ts
│   │   ├── feedback.routes.ts
│   │   ├── upload.routes.ts
│   │   └── health.routes.ts
│   ├── services/                 # Service layer (external integrations)
│   │   ├── ai.service.ts         #   Google Gemini AI client
│   │   ├── notification.service.ts  # Notification creation and radius targeting
│   │   ├── push.service.ts       #   Expo push notification delivery
│   │   └── ecopoints.service.ts  #   Eco-points atomic increment via RPC
│   ├── middleware/               # Express middleware
│   │   ├── auth.middleware.ts    #   JWT token verification
│   │   ├── role.middleware.ts    #   Role-based access control (user/pemerintah/admin)
│   │   ├── validate.middleware.ts #  Request body validation
│   │   └── error.middleware.ts   #   Global error handler
│   ├── database/
│   │   └── migrations/           # SQL migration files (001–015)
│   └── types/                    # TypeScript type definitions
├── .env.example                  # Environment variable template
├── package.json
└── tsconfig.json
```

---

## API Endpoints

All endpoints are prefixed with `/api`.

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | No | Register a new user |
| `POST` | `/api/auth/login` | No | Login with email and password |
| `GET` | `/api/auth/me` | Yes | Get current user profile |
| `PATCH` | `/api/auth/profile` | Yes | Update user profile |
| `POST` | `/api/auth/change-password` | Yes | Change password |
| `PATCH` | `/api/auth/settings` | Yes | Update user settings |

### Reports

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/reports` | Yes | List reports (with filters and pagination) |
| `GET` | `/api/reports/stats` | Yes | Report statistics (total, pending, resolved) |
| `GET` | `/api/reports/:id` | Yes | Get report detail |
| `POST` | `/api/reports` | Yes | Create a new report |
| `PATCH` | `/api/reports/:id/status` | Yes | Update report status (gov only) |
| `POST` | `/api/reports/:id/vote` | Yes | Toggle vote/support on a report |
| `POST` | `/api/reports/:id/verify` | Yes | Verify a report |

### Positive Actions

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/actions` | Yes | List positive actions |
| `GET` | `/api/actions/:id` | Yes | Get action detail |
| `POST` | `/api/actions` | Yes | Create a new action |
| `POST` | `/api/actions/:id/join` | Yes | Join an action |
| `DELETE` | `/api/actions/:id/leave` | Yes | Leave an action |

### Comments

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/comments/:targetType/:targetId` | Yes | List comments for a report or action |
| `POST` | `/api/comments` | Yes | Add a comment |

### AI Chat

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/chat` | Yes | Send message to Gemini AI assistant |

### Notifications

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/notifications` | Yes | Get notification inbox |
| `PATCH` | `/api/notifications/:id/read` | Yes | Mark notification as read |
| `PATCH` | `/api/notifications/read-all` | Yes | Mark all notifications as read |

### Admin (Super-Admin Only)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/admin/dashboard` | Admin | System-wide dashboard summary |
| `GET` | `/api/admin/activity-log` | Admin | System activity log |
| `GET` | `/api/admin/users` | Admin | List all users |
| `POST` | `/api/admin/users` | Admin | Create a new user account |
| `GET` | `/api/admin/users/stats` | Admin | User statistics per role |
| `GET` | `/api/admin/analytics` | Admin | Aggregate analytics dashboard |
| `PATCH` | `/api/admin/users/:id/role` | Admin | Change user role |
| `PATCH` | `/api/admin/users/:id/suspend` | Admin | Suspend or activate a user |

### Other Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | No | Server health check |
| `GET` | `/api/area-status` | Yes | District-level area safety status |
| `GET` | `/api/info` | Yes | Info articles and education content |
| `GET` | `/api/info/:id` | Yes | Article detail |
| `GET` | `/api/activities` | Yes | User activity history |
| `POST` | `/api/upload` | Yes | Upload file to Supabase Storage |
| `POST` | `/api/feedback` | Yes | Submit user feedback |
| `POST` | `/api/bookmarks` | Yes | Toggle bookmark |
| `GET` | `/api/bookmarks` | Yes | List user bookmarks |
| `POST` | `/api/device-tokens` | Yes | Register push notification token |
| `DELETE` | `/api/device-tokens` | Yes | Unregister push token |
| `GET` | `/api/bmkg/gempa-terkini` | No | Latest earthquake data from BMKG |

---

## Database

SIAGA uses **Supabase** (PostgreSQL) with 14 migration files defining the schema (migration 008 was removed when Budget Watch was deprecated):

| Migration | Table/Function | Description |
|---|---|---|
| `001` | `users_metadata` | Extended user profiles (district, eco-points, gov fields) |
| `002` | `reports` | Issue reports with GPS coordinates and urgency scoring |
| `003` | `actions` | Community positive actions |
| `004` | `comments` | Comments on reports and actions |
| `005` | `report_votes` | User votes/support on reports |
| `006` | `feedbacks` | User feedback submissions |
| `007` | `notifications` | In-app notification system |
| `009` | — | User role column addition |
| `010` | `report_verifications`, `action_joins`, `report_bookmarks` | Verification, join, and bookmark tables |
| `011` | `info_articles` | Education and information articles |
| `012` | `device_tokens` | Push notification token registry |
| `013` | `increment_eco_points()` | Atomic PostgreSQL function for eco-points |
| `014` | — | Government profile fields in users_metadata |
| `015` | — | Resolution proof columns (`resolution_notes`, `resolution_image_url`) on reports |

For the full Entity Relationship Diagram, see [ERD Documentation](https://github.com/orgs/StackHorizon-ProxoCoris/repositories) in the frontend repository's `docs/ERD.md`.

---

## Technical Documentation

Detailed technical documentation is maintained in the frontend repository's [`docs/`](https://github.com/orgs/StackHorizon-ProxoCoris/repositories) directory:

| Document | Description |
|---|---|
| Architecture | System architecture diagram and layer descriptions |
| ERD | Entity Relationship Diagram and data model |
| System Flow | Core user journey and process flow diagrams |
| API Documentation | Complete REST API endpoint reference with request/response formats |

---

## Team

**Team StackHorizon** — Universitas Klabat

---

*Built with purpose for ProxoCoris 2026*
