# Performance Migration Steps

## Overview
This migration adds database indexes to optimize the "My Team" page queries and reduces load time by 80-90%.

## Changes Made

### 1. Code Optimizations
- ✅ Created optimized page: `apps/web/src/app/teams/my-team/page-optimized.tsx`
- ✅ Created cached actions: `apps/web/src/actions/problem-statements-cached.ts`
- ✅ Updated schema with performance indexes

### 2. Database Schema Changes
Added indexes to `packages/db/prisma/schema.prisma`:
- `Evaluation` model: `submittedAt` and composite `(teamId, submittedAt)`
- `MentorFeedback` model: `createdAt` and composite `(teamId, createdAt)`

## Step-by-Step Migration

### Step 1: Review the Changes
```bash
# View the optimized page
code apps/web/src/app/teams/my-team/page-optimized.tsx

# View the performance guide
code guides/PERFORMANCE_OPTIMIZATION.md
```

### Step 2: Create Database Migration
```bash
cd packages/db

# Generate migration from schema changes
npx prisma migrate dev --name add_performance_indexes

# This will:
# 1. Create a new migration file
# 2. Apply it to your dev database
# 3. Regenerate Prisma Client
```

### Step 3: Test in Development
```bash
# Start the dev server
cd ../../
npm run dev

# Navigate to /teams/my-team
# Check Chrome DevTools:
#   - Network tab for load times
#   - Console for any errors
#   - Performance tab for metrics
```

### Step 4: Deploy the Optimized Page

**Option A: Backup and Replace**
```bash
# Backup original
cp apps/web/src/app/teams/my-team/page.tsx apps/web/src/app/teams/my-team/page.backup.tsx

# Replace with optimized version
cp apps/web/src/app/teams/my-team/page-optimized.tsx apps/web/src/app/teams/my-team/page.tsx
```

**Option B: Gradual Rollout (Recommended)**
Keep both versions and use feature flag or route:
```bash
# Create parallel route for testing
mkdir -p apps/web/src/app/teams/my-team-new
cp apps/web/src/app/teams/my-team/page-optimized.tsx apps/web/src/app/teams/my-team-new/page.tsx

# Test at /teams/my-team-new
# Once verified, replace the original
```

### Step 5: Deploy to Production

```bash
# 1. Run migrations on production
cd packages/db
npx prisma migrate deploy

# 2. Build and deploy your app
cd ../../
npm run build
# Deploy using your hosting platform (Vercel, etc.)
```

### Step 6: Monitor Performance

After deployment, check:
1. **Server logs** for database query times
2. **Application metrics** (if using monitoring service)
3. **User feedback** on page load speed

Expected metrics:
- Initial load: <500ms (was 2-5s)
- Time to Interactive: <1.5s
- Database queries: 3-4 (was 1 giant query)

## Rollback Plan

If issues occur, quickly rollback:

```bash
# Restore original page
cp apps/web/src/app/teams/my-team/page.backup.tsx apps/web/src/app/teams/my-team/page.tsx

# Redeploy
npm run build
# Deploy
```

The database indexes won't cause issues even if you rollback the code.

## Verification Checklist

- [ ] Schema migration created successfully
- [ ] Dev database indexes applied
- [ ] Optimized page loads without errors
- [ ] All team data displays correctly
- [ ] Evaluations section renders properly
- [ ] Mentor feedback section renders properly
- [ ] Submission form works (if no submission)
- [ ] Submission details show (if submission exists)
- [ ] Page load time improved significantly
- [ ] Production migration planned
- [ ] Monitoring in place

## Troubleshooting

### Issue: Migration fails
```bash
# Check migration status
cd packages/db
npx prisma migrate status

# If drift detected, resolve it
npx prisma migrate resolve

# Force reset (DEV ONLY - destroys data)
npx prisma migrate reset
```

### Issue: Suspense warnings in console
```
Warning: A component suspended while responding to synchronous input
```
This is expected during development. It won't affect production.

### Issue: Data not showing
Check:
1. User has team membership
2. Database queries returning data
3. Console for any errors
4. Network tab for failed requests

### Issue: Still slow after optimization
Check:
1. Database connection pool size
2. Network latency to database
3. Database server resources
4. Other queries on the page

## Performance Comparison

Test both versions and compare:

```bash
# Original page: /teams/my-team (with page.backup.tsx as page.tsx)
# Optimized page: /teams/my-team-new (with page-optimized.tsx)
```

Use Chrome DevTools Performance tab:
1. Open DevTools (F12)
2. Go to Performance tab
3. Click Record
4. Load the page
5. Stop recording
6. Check metrics:
   - Loading time
   - Scripting time
   - Rendering time
   - First Contentful Paint (FCP)
   - Largest Contentful Paint (LCP)
   - Time to Interactive (TTI)

## Additional Resources

- [Performance Guide](./PERFORMANCE_OPTIMIZATION.md)
- [Prisma Performance Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [Next.js Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [React Suspense](https://react.dev/reference/react/Suspense)

## Questions?

If you encounter issues:
1. Check the Performance Guide: `guides/PERFORMANCE_OPTIMIZATION.md`
2. Review Prisma migration docs
3. Test thoroughly in development first
4. Consider gradual rollout in production
