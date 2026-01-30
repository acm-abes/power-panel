<!-- @format -->

# Email Management System

## Overview

The email management system allows admins to send bulk emails to different groups of users with predefined templates.

## Setup

### 1. Environment Variables

Add the following to your `.env` file:

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

### 2. Gmail Setup (Recommended)

1. Enable 2-factor authentication on your Gmail account
2. Go to https://myaccount.google.com/apppasswords
3. Generate a new App Password
4. Use this App Password as `SMTP_PASS`

### 3. Other SMTP Providers

- **Outlook:** `smtp-mail.outlook.com:587`
- **SendGrid:** `smtp.sendgrid.net:587`
- **AWS SES:** `email-smtp.us-east-1.amazonaws.com:587`

## Features

### Quick Load Email Lists

Pre-built buttons to load common email lists:

- **Team Size = 1:** All members in teams with only 1 member
- **Team Size = 2:** All members in teams with 2 members
- **Team Size = 3:** All members in teams with 3 members
- **Incomplete Teams:** All members in teams with less than 4 members
- **All Participants:** All users with PARTICIPANT role
- **All Judges:** All users with JUDGE role
- **All Mentors:** All users with MENTOR role

### Manual Email Input

Add individual email addresses one by one with validation.

### Email Templates

#### 1. Incomplete Team Alert

Sends a personalized email to team members with:

- Team name and code
- Current team size
- Action required notice
- Important dates and deadlines
- PPT requirements

## Usage

### Via Admin Panel (Recommended)

1. Navigate to `/admin/email`
2. Click a quick load button OR manually add emails
3. Review the email list
4. Select the email template
5. Click "Send Emails"
6. Confirm the action

### Via Script

Run the automated script to send alerts to all incomplete teams:

```bash
bun run src/email/scripts/send-alerts.ts
```

## Code Structure

### Files

- `src/app/admin/email/page.tsx` - Main admin UI
- `src/actions/send-emails.ts` - Server actions for email operations
- `src/hooks/use-email-sender.ts` - Client-side state management
- `src/email/scripts/alert.ts` - Email sending logic and templates
- `src/email/scripts/send-alerts.ts` - Batch sending script
- `src/email/templates/alert.txt` - Email template reference

### Server Actions

```typescript
// Get emails by predefined option
getEmailsByOption(option: EmailListOption)

// Get incomplete teams data
getIncompleteTeamsData()

// Send emails with selected preset
sendEmails(emails: string[], preset: EmailPreset)
```

### Hook API

```typescript
const {
  emails, // Current email list
  selectedPreset, // Selected template
  isPending, // Loading state
  result, // Success/error message
  addEmail, // Add single email
  removeEmail, // Remove email from list
  clearEmails, // Clear all emails
  setSelectedPreset, // Change template
  loadEmailsByOption, // Load predefined list
  loadIncompleteTeamsEmails, // Load incomplete teams
  sendEmailsToList, // Send emails
} = useEmailSender();
```

## Email Template Customization

### HTML Template

Edit `src/email/scripts/alert.ts` - `generateEmailHTML()` function

### Plain Text Template

Edit `src/email/scripts/alert.ts` - `generateEmailText()` function

### Adding New Templates

1. Add new preset to `EmailPreset` type in `src/actions/send-emails.ts`
2. Implement template generation logic in `src/email/scripts/alert.ts`
3. Add case in `sendEmails()` function
4. Update UI dropdown in `src/app/admin/email/page.tsx`

## Testing

### Test Email Configuration

```bash
# Send a test email to yourself
bun run src/email/scripts/send-alerts.ts
```

### Verify SMTP Settings

Check the console output for connection errors or authentication issues.

## Security Notes

- ⚠️ **Never commit `.env` file to version control**
- Use App Passwords instead of your main email password
- Limit SMTP credentials to email sending only
- Monitor email sending for unusual activity
- Consider rate limiting for production use

## Troubleshooting

### "Authentication Failed"

- Verify `SMTP_USER` and `SMTP_PASS` are correct
- For Gmail, ensure you're using an App Password, not your regular password
- Check if 2FA is enabled on your email account

### "Connection Timeout"

- Verify `SMTP_HOST` and `SMTP_PORT` are correct
- Check firewall settings
- Try using port 465 with `secure: true` for SSL

### "No emails sent"

- Check console logs for detailed error messages
- Verify database connection and team/user data exists
- Ensure environment variables are loaded correctly

## Future Enhancements

- [ ] Custom email templates with rich text editor
- [ ] Email scheduling
- [ ] Email history and analytics
- [ ] Attachment support
- [ ] Email preview before sending
- [ ] Unsubscribe mechanism
- [ ] Email bounce tracking
