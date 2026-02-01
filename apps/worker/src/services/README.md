<!-- @format -->

# Mail Service Dependency Injection

This folder contains the mail service implementations using Dependency Injection pattern, allowing easy switching between different email providers.

## Architecture

### Interface

- **`mail-service.interface.ts`**: Defines the `IMailService` interface that all email providers must implement

### Implementations

- **`resend-mail.service.ts`**: Resend email provider implementation
- **`ses-mail.service.ts`**: AWS SES email provider implementation (stub, ready for implementation)

### Factory

- **`mail-service.factory.ts`**: Factory pattern to create mail service instances based on configuration

## Usage

### Environment Variables

Add to your `.env` file:

```env
# Mail provider selection (default: resend)
MAIL_PROVIDER=resend  # or "ses"

# Required for all providers
EMAIL_FROM=noreply@yourdomain.com

# Required for Resend
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Required for SES
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

### Using the Mail Service

#### Option 1: Use the configured instance (Recommended)

```typescript
import { mailService } from "./mailer";

// Send email
const result = await mailService.sendEmail({
  to: "user@example.com",
  subject: "Welcome!",
  html: "<h1>Hello!</h1>",
  cc: ["manager@example.com"],
  attachments: [
    {
      filename: "invoice.pdf",
      content: "base64-encoded-content",
      contentType: "application/pdf",
    },
  ],
});

if (!result.success) {
  console.error("Failed to send email:", result.error);
}
```

#### Option 2: Create a specific instance

```typescript
import { ResendMailService, SESMailService } from "./services";

// Use Resend
const resendService = new ResendMailService(
  process.env.RESEND_API_KEY!,
  process.env.EMAIL_FROM!
);

// Use SES
const sesService = new SESMailService({
  region: "us-east-1",
  fromEmail: process.env.EMAIL_FROM!,
});

await resendService.sendEmail({ ... });
```

#### Option 3: Use factory dynamically

```typescript
import { MailServiceFactory } from "./services";

const service = MailServiceFactory.create("ses");
await service.sendEmail({ ... });
```

## Switching Providers

To switch from Resend to AWS SES:

1. Update `.env`:

   ```env
   MAIL_PROVIDER=ses
   AWS_REGION=us-east-1
   # Add AWS credentials
   ```

2. Implement the SES sending logic in `ses-mail.service.ts`

3. Install AWS SDK:

   ```bash
   bun add @aws-sdk/client-ses
   ```

4. Restart the worker - no code changes needed!

## Adding a New Provider

1. Create a new service file (e.g., `sendgrid-mail.service.ts`)
2. Implement the `IMailService` interface
3. Add the provider to the factory
4. Update the `MailProvider` type
5. Document the required environment variables

## Benefits of This Approach

- ✅ **Easy provider switching**: Change one env variable
- ✅ **Type-safe**: Full TypeScript support
- ✅ **Testable**: Mock the interface for testing
- ✅ **Extensible**: Add new providers without changing existing code
- ✅ **No vendor lock-in**: Switch providers anytime
- ✅ **Backward compatible**: Old `sendMail()` function still works
