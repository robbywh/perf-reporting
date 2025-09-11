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

This is a **PerfReporting** application - a multi-tenant performance tracking system for engineering teams built with Next.js 15, TypeScript, and PostgreSQL. The system supports multiple organizations with strict data isolation and integrates with ClickUp and GitLab APIs for automated data synchronization.

### Core Architecture
- **Frontend**: Next.js 15 with App Router, React 19, TailwindCSS, shadcn/ui
- **Backend**: Next.js API routes with Prisma ORM
- **Database**: PostgreSQL with Prisma migrations and multi-tenant architecture
- **Authentication**: Clerk integration with organization-based access control
- **Multi-Tenancy**: Organization-level data isolation with per-org API configurations
- **External APIs**: ClickUp API for task data, GitLab API for merge request data (per organization)
- **Deployment**: Vercel with automated cron jobs and blob storage

### Key Data Flow
1. **Automated Sync**: Vercel cron job runs daily at 5 PM (`/api/sprints/sync`) for all organizations
2. **Organization Isolation**: Each sync processes organizations separately with their own API configs
3. **Data Sources**: ClickUp (sprints, tasks, assignments) + GitLab (merge requests) per organization
4. **Performance Tracking**: Story points, coding hours, task completion metrics (organization-scoped)
5. **Reporting**: Dashboard analytics, engineer performance, sprint reports (organization-filtered)

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
│   ├── engineers/        # Engineer-related services (organization-aware)
│   ├── gitlab/           # GitLab API integration (organization-isolated)
│   ├── organizations/    # Organization management services
│   ├── sprint-engineers/ # Sprint-engineer linking with GitLab integration
│   ├── sprint-reviewers/ # Sprint-reviewer linking services
│   ├── sprints/          # Sprint management (organization-scoped)
│   └── tasks/            # Task management (organization-isolated)
├── types/                 # TypeScript type definitions
├── constants/             # Application constants
└── actions/               # Server actions
```

## Database Schema (Prisma)

### Core Multi-Tenant Models
- **Organization**: Root tenant entity for data isolation
- **User**: Authentication users with many-to-many organization relationships
- **Sprint**: Development periods with organization ID and ClickUp integration
- **Engineer**: Team members with many-to-many organization relationships
- **Reviewer**: QA reviewers with many-to-many organization relationships

### Configuration Models (Organization-Scoped)
- **Setting**: Per-organization API configurations (ClickUp, GitLab tokens)
- **Status/Category/Tag**: Task classification systems per organization

### Activity Models
- **Task**: ClickUp tasks with story points, status, categories (via sprint->organization)
- **Leave**: Engineer time-off tracking
- **PublicHoliday**: National holidays
- **SprintGitlab**: GitLab MR to sprint/engineer relationships

### Junction Tables
- **EngineerOrganization**: Many-to-many engineer-organization mapping
- **ReviewerOrganization**: Many-to-many reviewer-organization mapping
- **UserOrganization**: Many-to-many user-organization mapping

## External Integrations

### ClickUp API (Per Organization)
- Syncs sprints from ClickUp Lists using organization-specific tokens
- Imports tasks with assignees, reviewers, story points
- Maps ClickUp statuses to internal status system per organization
- Organization-specific settings: `CLICKUP_API_TOKEN`, `CLICKUP_FOLDER_ID`, `CLICKUP_BASE_URL`

### GitLab API (Per Organization)
- Fetches merged MRs during sprint periods for organization's GitLab instance
- Links GitLab activity to engineer performance within organization
- Organization-specific settings: `GITLAB_PERSONAL_ACCESS_TOKEN`, `GITLAB_GROUP_ID`, `GITLAB_BASE_URL`

### Data Isolation Architecture
- **Organization-Level Isolation**: All data queries filter by organization ID
- **API Configuration**: Each organization has separate ClickUp/GitLab credentials
- **User Access Control**: Users can only access organizations they're assigned to
- **Sprint-Based Filtering**: Tasks and GitLab data accessed through sprint->organization relationship
- **Junction Table Security**: Many-to-many relationships ensure proper organization boundaries

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
- **Organization Context**: URL parameter `?org=<org_id>` for organization selection
- **Multi-tenant Queries**: All database queries include organization filtering
- **API Configuration Storage**: Organization settings stored in database, not env vars
- **Sync Isolation**: Cron jobs process each organization separately to prevent cross-contamination

## Environment Variables

**Important**: API configurations (ClickUp, GitLab) are now stored per-organization in the database `Setting` table, not in environment variables.

Required system-level variables:
- **Authentication**: Clerk keys for user management
- **Database**: PostgreSQL connection string
- **System**: CRON_SECRET, NODE_ENV
- **Storage**: Vercel Blob token for file uploads

See `env.example` for complete list. Legacy API tokens can be kept for backward compatibility.

## Testing & Quality

Run linting before commits to ensure code quality:
- `npm run lint` - ESLint + Prettier + Tailwind CSS class ordering
- `npx tsc --noEmit` - TypeScript compilation check

The project uses:
- TypeScript strict mode with proper type safety
- Standard JS conventions with Prettier formatting
- Organization-aware service functions that require organizationId parameters
- Proper error handling for multi-tenant scenarios

## Data Isolation Principles

When working with this codebase, ensure:
1. **Always filter by organization**: Services should accept and use organizationId
2. **No cross-organization data leakage**: Verify queries include proper organization boundaries
3. **API configuration per org**: Use database settings, not global env vars
4. **Sprint-based filtering**: Most data access goes through sprint->organization relationship
5. **Junction table awareness**: Engineer/reviewer assignments respect organization boundaries