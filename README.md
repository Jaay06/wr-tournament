# Wild Rift Tournament Web App

A modern web platform for managing a Wild Rift community tournament. It handles player registration, tier assignment (T1–T4), team formation with rule enforcement, and admin oversight. Built with Next.js, Drizzle ORM, PostgreSQL, and NextAuth.

## Tech Stack

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS
- **Backend:** Next.js API routes / server actions
- **Database:** PostgreSQL with Drizzle ORM
- **Authentication:** NextAuth (Discord OAuth + Email/Password)

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (local or hosted)
- Discord OAuth application (for Discord login)
- SMTP credentials (optional for email verification)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Copy `.env.example` to `.env` and fill in required variables (see `docs/ENV_VARIABLES.md`).
4. Run database migrations:
   ```bash
   pnpm run db:migrate
   ```
5. Start development server:
   ```bash
   pnpm run dev
   ```

## Documentation

- `docs/SPECIFICATIONS.md` – functional requirements and rules
- `docs/DATABASE_SCHEMA.md` – data model
- `docs/API_ENDPOINTS.md` – API design
- `docs/UI_UX_GUIDELINES.md` – design guidelines
- `docs/AUTHENTICATION.md` – auth setup
- `docs/ADMIN_FEATURES.md` – admin capabilities
- `docs/DEVELOPMENT_ROADMAP.md` – phased plan
