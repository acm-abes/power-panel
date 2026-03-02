<!-- @format -->

# Power Panel

A comprehensive hackathon management platform designed by and for the **ABES ACM Student Chapter** and **ABES ACM-W Student Chapter** to streamline the entire hackathon lifecycle.

## Overview

Power Panel is a centralized platform that brings together organizers, judges, mentors, and participants to create a seamless hackathon experience. It provides robust tools for participant management, real-time communication, submission handling, and evaluation workflows—all from a single dashboard.

## Key Features

### 👥 Participant Management

- Centralized team and participant registry
- Role-based access control (Participants, Mentors, Judges, Admins)
- Team formation and management
- Submission tracking and analytics

### 📧 Email Communication

- **AWS SES Integration** for sending emails via custom domain
- **Resend Support** via adapter pattern for flexibility
- Batch email campaigns
- Customizable email templates
- Queue-based email processing with BullMQ

### 📤 Submission & Storage

- File uploads (PowerPoint, Documents, etc.)
- **AWS S3 Integration** for secure storage
- Submission versioning and tracking
- Attachment management with preview capabilities

### 📊 Analytics & Evaluation

- Real-time hackathon analytics and metrics
- Judge assignment and panel management
- Evaluation criteria management
- Performance tracking and leaderboards
- Mentor feedback system

### 🎯 Organizer Tools

- Dashboard for comprehensive event oversight
- Judge recruitment and scheduling
- Problem statement management
- Participant statistics and insights
- Availability management for judges/mentors

## Tech Stack

### Frontend

- **Next.js 16** - React framework with SSR
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **React Query** - State management
- **Recharts** - Analytics visualization
- **dnd-kit** - Drag and drop functionality
- **Shadcn/ui** - Component library
- **Phosphor Icons** - Icon set

### Backend & Services

- **Node.js/Bun** - Runtime
- **Prisma** - ORM with PostgreSQL
- **PostgreSQL** - Primary database
- **Redis** - Caching and job queue
- **BullMQ** - Job/task queue
- **Better-auth** - Authentication

### Cloud Services

- **AWS S3** - File storage
- **AWS SES** - Email delivery (with Resend fallback)

### Developer Tools

- **ESLint** - Code linting
- **Monorepo** with pnpm workspaces
- **tsx** - TypeScript execution

## Architecture

The project is organized as a **monorepo** with clear separation of concerns:

### Apps

- **`apps/web`** - Main Next.js application (UI, dashboards, API routes)
- **`apps/worker`** - Background job processor for email and file operations

### Packages (Shared Libraries)

- **`packages/db`** - Prisma schema and database utilities
- **`packages/allocation`** - Judge and panel assignment algorithms
- **`packages/job-runtime`** - Job queue management and enqueuing
- **`packages/jobs`** - Job handlers (email, file deletion, uploads)
- **`packages/mails`** - Email templating and provider abstraction
- **`packages/storage`** - Storage abstraction layer (S3, etc.)

## Project Structure

```
power-panel/
├── apps/
│   ├── web/                 # Main Next.js application
│   │   ├── src/
│   │   │   ├── app/         # Route handlers & pages
│   │   │   ├── components/  # Reusable React components
│   │   │   ├── actions/     # Server actions
│   │   │   ├── hooks/       # Custom React hooks
│   │   │   └── lib/         # Utilities
│   │   └── docs/            # Documentation
│   └── worker/              # Background job processor
├── packages/
│   ├── db/                  # Database layer
│   │   ├── prisma/          # Schema & migrations
│   │   └── scripts/         # Seeding scripts
│   ├── allocation/          # Judge allocation engines
│   ├── job-runtime/         # Queue management
│   ├── jobs/                # Job handlers
│   ├── mails/               # Email system
│   └── storage/             # Storage abstraction
└── package.json            # Root workspace config
```

## Getting Started

### Prerequisites

- **Node.js** 18+ or **Bun** runtime
- **PostgreSQL** 13+
- **Redis** (for job queue)
- AWS account (for S3 and SES) or Resend account

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd power-panel
   ```

2. **Install dependencies**

   ```bash
   bun install
   # or
   npm install
   ```

3. **Set up environment variables**
   Create `.env` file in the root and configure:

   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/power_panel"

   # Redis
   REDIS_URL="redis://localhost:6379"

   # AWS S3
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   AWS_REGION=us-east-1
   AWS_S3_BUCKET=your_bucket_name

   # AWS SES
   AWS_SES_REGION=us-east-1

   # Email Configuration
   EMAIL_FROM="noreply@yourdomain.com"

   # Resend (Optional fallback)
   RESEND_API_KEY=your_resend_key
   ```

4. **Generate Prisma client**

   ```bash
   bun run db:generate
   ```

5. **Run database migrations**

   ```bash
   bun run db:migrate
   ```

6. **Seed initial data** (optional)
   ```bash
   bun run seed:judges
   ```

### Development

**Start the web application:**

```bash
bun run web
```

Runs on `http://localhost:3000`

**Start the worker:**

```bash
bun run worker
```

Processes background jobs from the queue

**Build for production:**

```bash
bun run web:build
```

### Production

**Run web application:**

```bash
bun run web:prod
```

**Run worker:**

```bash
bun run worker:prod
```

## Core Features in Detail

### Role-Based Access Control

- **Admin**: Full platform access, event management
- **Organizer**: Event oversight, judge management, analytics
- **Judge**: Team evaluations, feedback submission
- **Mentor**: Team guidance, feedback
- **Participant**: View submissions, team management

### Email System

The email system uses an adapter pattern for flexibility:

- **AWS SES** - Primary provider for custom domain emails
- **Resend** - Fallback/alternative provider
- Queue-based processing for reliability
- Template management system

### Job Queue

Built on **BullMQ** and Redis:

- Email sending
- File uploads to S3
- File deletion
- Submission processing

### Data Management

- **Prisma ORM** with PostgreSQL
- Type-safe database operations
- Automated migrations
- Comprehensive schema with relationships

## Email System Architecture

The email system follows a modular architecture:

- **Provider Abstraction**: Support for multiple providers (AWS SES, Resend)
- **Template System**: Reusable email templates
- **Queue Processing**: Asynchronous email delivery
- **Configuration Management**: Environment-based provider selection

## Storage System

File management with S3 integration:

- Direct file uploads
- Secure URL generation
- File metadata tracking
- Support for multiple file types

## Evaluation System

Comprehensive evaluation framework:

- **Evaluation Criteria**: Customizable scoring rubrics
- **Judge Assignments**: Intelligent panel allocation
- **Performance Metrics**: Real-time evaluation analytics
- **Feedback System**: Mentor and judge feedback tracking

## Scripts

Useful commands available in the root `package.json`:

```bash
bun run web              # Start dev server
bun run web:build        # Build for production
bun run web:start        # Start production server
bun run worker           # Start background worker
bun run db:generate      # Generate Prisma client
bun run seed:judges      # Seed judge data
bun run install:all      # Install all dependencies
```

## Environment Configuration

### Web Application

- `DATABASE_URL` - PostgreSQL connection
- `REDIS_URL` - Redis connection
- `AWS_*` - AWS credentials and regions
- `RESEND_API_KEY` - Resend API key
- `EMAIL_FROM` - Default sender email

### Worker

- `REDIS_URL` - Job queue connection
- `DATABASE_URL` - Database connection
- `RESEND_API_KEY` / AWS credentials - Email provider

## Best Practices

### Development

- Use TypeScript for type safety
- Follow the monorepo structure
- Write tests for critical features
- Use server actions for mutations
- Implement proper error handling

### Security

- Never commit `.env` files
- Use environment variables for secrets
- Validate user input on both client and server
- Implement proper RBAC checks
- Use HTTPS in production

### Performance

- Leverage Prisma relationships efficiently
- Use React Query for data fetching
- Implement pagination for large datasets
- Cache frequently accessed data with Redis
- Optimize image and file uploads

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## Documentation

Detailed documentation available in:

- [Email System Architecture](./apps/web/docs/EMAIL_SYSTEM_ARCHITECTURE.md)
- [Database Schema](./apps/web/docs/db.md)
- [Email Migration Guide](./apps/web/docs/EMAIL_MIGRATION.md)
- [Email Queue Setup](./apps/web/docs/EMAIL_QUEUE_SETUP.md)

## Support & Contact

For questions or support regarding the platform:

- **ABES ACM Student Chapter** - acm@abes.ac.in
- **ABES ACM-W Student Chapter** - acmw@abes.ac.in

## License

This project is maintained by ABES ACM Student Chapter and ABES ACM-W Student Chapter.

---

**Built with ❤️ by the ABES ACM Community**
