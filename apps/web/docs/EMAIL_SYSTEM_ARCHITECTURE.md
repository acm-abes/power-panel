<!-- @format -->

# SAH 2.0 Email System Architecture

## Overview

The SAH 2.0 email system has been completely redesigned to follow a "dumb sender" architecture where:

- **All template logic lives in the web app** (not the worker)
- **Worker is just a simple mailer** that sends whatever it receives
- **Full control over email fields** (to, cc, bcc, subject, html) from the web UI

## Architecture Flow

```
Web UI (Email Page)
    ↓
Server Action (send-emails.ts)
    ├── Generate HTML from template functions
    ├── Prepare complete email data (subject, html, cc, bcc)
    └── Enqueue ready-to-send jobs
        ↓
    Redis Queue (BullMQ)
        ↓
    Worker (dumb sender)
        ├── Receive job with complete email data
        ├── Send via Resend API
        └── Track in database
```

## Key Components

### 1. Queue Types (`packages/queue/index.ts`)

**New simplified job type:**

```typescript
export type SendEmailJob = {
  // Email fields - ready to send
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  html: string;

  // Tracking data
  campaignId: string;
  userId: string;
};
```

**Key changes:**

- ❌ Removed: `template`, `recipientName`, `templateData`
- ✅ Added: Direct email fields (`subject`, `html`, `cc`, `bcc`)

### 2. Email Templates (`apps/web/src/lib/email-templates.ts`)

**Template generation functions:**

```typescript
// Generate complete email content
export function generateIncompleteTeamEmail(
  recipientName: string,
  data: { teamName; teamCode; membersInTeam },
): { subject: string; html: string };

export function generateInaugurationInviteEmail(
  recipientName: string,
  data: { eventDate; eventTime; venue },
): { subject: string; html: string };
```

**Key changes:**

- ✅ All HTML generation happens in web app
- ✅ Returns complete `{subject, html}` ready to send
- ✅ No worker dependencies

### 3. Send Emails Action (`apps/web/src/actions/send-emails.ts`)

**Updated signature:**

```typescript
export async function sendEmails(
  emails: string[],
  preset: EmailPreset,
  customData?: {
    cc?: string;
    bcc?: string;
    subject?: string; // For CUSTOM preset
    html?: string; // For CUSTOM preset
  },
);
```

**Key changes:**

- ✅ Generates HTML before enqueuing
- ✅ Supports cc/bcc for ALL presets
- ✅ CUSTOM preset accepts raw HTML + subject
- ✅ Fire-and-forget enqueuing (no await)

**Example INCOMPLETE_TEAM flow:**

```typescript
// 1. Fetch team data
const teams = await prisma.tempTeamData.findMany(...)

// 2. Generate HTML in web app
const { subject, html } = generateIncompleteTeamEmail(recipientName, teamData)

// 3. Enqueue with complete data
emailQueue.enqueue({
  to: email,
  cc: customData?.cc,
  bcc: customData?.bcc,
  subject,  // Generated
  html,     // Generated
  userId,
  campaignId,
})
```

### 4. Worker (`apps/worker/src/worker.ts`)

**New dumb sender logic:**

```typescript
const worker = new Worker<SendEmailJob>(EMAIL_QUEUE, async (job) => {
  const { to, cc, bcc, subject, html, userId, campaignId } = job.data;

  // Just send what we received
  const result = await sendMail({ to, cc, bcc, subject, html });

  // Track in DB (best effort)
  await prisma.emailJob.create({
    data: { campaignId, userId, email: to, status: "SENT" },
  });
});
```

**Key changes:**

- ❌ Removed: `generateEmailContent()` call
- ❌ Removed: Template switching logic
- ✅ Added: Direct passthrough to mailer
- ✅ Mode: "Dumb sender (no template logic)"

### 5. Mailer (`apps/worker/src/mailer.ts`)

**Updated to support cc/bcc:**

```typescript
export async function sendMail({
  to,
  cc,
  bcc,
  subject,
  html,
}: {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  html: string;
});
```

### 6. Email Page UI (`apps/web/src/app/admin/email/page.tsx`)

**New features:**

1. **Email Fields (for ALL presets):**
   - CC field (optional)
   - BCC field (optional)

2. **Custom Email Mode:**
   - Subject input (required)
   - HTML textarea (required)
   - Full control over email content

3. **Preset Options:**
   - `INCOMPLETE_TEAM` - Auto-generated from team data
   - `INAUGURATION_INVITE` - Auto-generated with event details
   - `CUSTOM` - Paste your own HTML

## Email Presets

### INCOMPLETE_TEAM

**Auto-generates:**

- Fetches team data from database
- Personalized with recipient name and team details
- Subject: `"SAH 2.0 | {teamName} - Registration Status Update"`

**Supports:**

- CC/BCC fields
- Fallback to defaults if team not found

### INAUGURATION_INVITE

**Auto-generates:**

- Fetches user names from `user` or `analytics` table
- Falls back to "there" if not found
- Subject: `"SAH 2.0 | You're Invited to the Inauguration Ceremony"`

**Supports:**

- CC/BCC fields
- Never skips emails (always sends)

### CUSTOM

**User provides:**

- Complete HTML content (paste in textarea)
- Custom subject line
- Optional CC/BCC

**Use cases:**

- One-off announcements
- Special communications
- Testing email layouts

## Benefits of New Architecture

### 1. **Separation of Concerns**

- Web app = Business logic + Template generation
- Worker = Just send emails
- Clear boundaries

### 2. **Flexibility**

- CC/BCC on any email
- Custom HTML without code changes
- Easy to add new presets

### 3. **Maintainability**

- Template changes don't require worker restart
- Easier to test templates (just functions)
- No deployment coupling

### 4. **Debuggability**

- Can inspect exact HTML being sent
- Worker logs show actual subject lines
- No "which template generated this?" questions

## Usage Examples

### Send Preset Email with CC

```typescript
await sendEmails(["user@example.com"], "INCOMPLETE_TEAM", {
  cc: "organizer@smartabeshackathon.tech",
});
```

### Send Custom HTML Email

```typescript
await sendEmails(["user@example.com"], "CUSTOM", {
  subject: "Special Announcement",
  html: "<h1>Hello!</h1><p>This is custom HTML</p>",
  bcc: "archive@example.com",
});
```

## Migration Notes

### Breaking Changes

1. **Queue job structure changed** - Worker and web app must be updated together
2. **`templates.ts` in worker is no longer used** - Safe to delete after deployment
3. **Email tracking requires userId** - All jobs must provide userId (can be placeholder)

### Deployment Order

1. Update web app first (backwards compatible enqueue)
2. Update worker second (processes new job format)
3. Restart both services

### Database

No schema changes required - `emailJob` table unchanged.

## Troubleshooting

### Worker says "Unknown template"

- **Cause:** Old worker code running
- **Fix:** Restart worker with new code

### Emails have no content

- **Cause:** Web app not generating HTML
- **Fix:** Check template functions are imported and called

### CC/BCC not working

- **Cause:** Mailer not updated
- **Fix:** Ensure mailer.ts passes cc/bcc to Resend

## Future Enhancements

1. **Template Preview** - Show generated HTML before sending
2. **Template Variables** - Support `{{name}}` placeholders in custom HTML
3. **Email Scheduling** - Queue jobs for future delivery
4. **A/B Testing** - Send different versions to different segments
5. **Analytics Dashboard** - Track open rates, click rates, bounces

## Related Files

- `packages/queue/index.ts` - Queue types
- `apps/web/src/lib/email-templates.ts` - Template functions
- `apps/web/src/actions/send-emails.ts` - Server action
- `apps/web/src/hooks/use-email-sender.ts` - React hook
- `apps/web/src/app/admin/email/page.tsx` - UI
- `apps/worker/src/worker.ts` - Email worker
- `apps/worker/src/mailer.ts` - Resend integration

---

**Last Updated:** January 31, 2026
**Architecture Version:** 2.0 (Dumb Sender)
