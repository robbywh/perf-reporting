# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development**: `npm run dev` (uses Turbo for faster builds)
- **Build**: `npm run build` (includes Prisma generate)
- **Lint**: `npm run lint` (Next.js + ESLint + Prettier + Tailwind)
- **Format**: `npm run format` (Prettier formatting)
- **Database**: 
  - `npx prisma migrate dev` (run migrations)
  - `npx prisma db seed` (seed database)
  - `npx prisma generate --no-engine` (generate client)

## Architecture Overview

This is a **PerfReporting** application - a performance tracking system for engineering teams built with Next.js 15, TypeScript, and PostgreSQL. The system integrates with ClickUp and GitLab APIs for automated data synchronization.

### Core Architecture
- **Frontend**: Next.js 15 with App Router, React 19, TailwindCSS, shadcn/ui
- **Backend**: Next.js API routes with Prisma ORM
- **Database**: PostgreSQL with Prisma migrations
- **Authentication**: Clerk integration with role-based access
- **External APIs**: ClickUp API for task data, GitLab API for merge request data
- **Deployment**: Vercel with automated cron jobs and blob storage

### Key Data Flow
1. **Automated Sync**: Vercel cron job runs daily at 5 PM (`/api/sprints/sync`)
2. **Data Sources**: ClickUp (sprints, tasks, assignments) + GitLab (merge requests)
3. **Performance Tracking**: Story points, coding hours, task completion metrics
4. **Reporting**: Dashboard analytics, engineer performance, sprint reports

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes  
│   ├── (root)/            # Main application routes
│   ├── api/               # API endpoints
│   └── globals.css        # Global styles
├── components/            # Reusable UI components
├── lib/                   # Utilities and configurations
├── services/              # Business logic and external API integrations
│   ├── db/               # Database services
│   ├── engineers/        # Engineer-related services  
│   ├── gitlab/           # GitLab API integration
│   ├── sprints/          # Sprint management
│   └── tasks/            # Task management
├── types/                 # TypeScript type definitions
├── constants/             # Application constants
└── actions/               # Server actions
```

## Database Schema (Prisma)

Key models include:
- **Sprint**: Development periods with ClickUp integration
- **Engineer**: Team members with role assignments  
- **Task**: ClickUp tasks with story points, status, categories
- **User**: Authentication users linked to engineers via Clerk
- **Leave**: Engineer time-off tracking
- **Status/Category/Tag**: Task classification system

## External Integrations

### ClickUp API
- Syncs sprints from ClickUp Lists
- Imports tasks with assignees, reviewers, story points
- Maps ClickUp statuses to internal status system
- Requires: `CLICKUP_API_TOKEN`, `CLICKUP_FOLDER_ID`

### GitLab API  
- Fetches merged MRs during sprint periods
- Links GitLab activity to engineer performance
- Requires: `GITLAB_PERSONAL_ACCESS_TOKEN`, `GITLAB_GROUP_ID`

### Vercel Features
- **Cron Jobs**: Daily sync at 5 PM via `vercel.json`
- **Blob Storage**: File/image storage with `@vercel/blob`
- **Analytics**: Performance tracking with Vercel Analytics

## Configuration Notes

- Uses path alias `@/*` for `./src/*` imports
- ESLint configured with Next.js, Standard, Tailwind, and import ordering
- Middleware handles Clerk authentication for protected routes
- Performance optimized with bundle splitting and resource preloading
- Database URL uses connection pooling via Prisma Accelerate

## Environment Variables

Required variables include authentication keys for Clerk, database connection, ClickUp/GitLab API tokens, and Vercel services. See `env.example` for complete list.

## Testing & Quality

Run linting before commits to ensure code quality. The project uses TypeScript strict mode and follows Standard JS conventions with Prettier formatting.