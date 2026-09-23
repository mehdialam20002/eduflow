# Brief for 57-integrations-and-webhooks.md

Title: Integrations and Webhooks
Minimum words: 3600
Web research needed: no

## What this chapter must cover (every item, fully)

For each external service: what we use it for, setup steps, credentials storage (encrypted, per organization where needed), API calls we make, webhooks we receive with signature verification and idempotent processing through WebhookEvent, failure handling and retries, sandbox/testing, costs, and limits. Cover: Razorpay (orders, payments, refunds, settlements, webhooks payment.captured/payment.failed/refund.processed; Route or sub-merchant options so fee money settles to the institute's own account — explain options and recommend), Stripe (Payment Intents, Connect for institute payouts, webhooks, Stripe Tax), WhatsApp Cloud API (templates, send message, media, status and inbound webhooks, verify token), MSG91 (DLT flow, send, delivery report webhook), Twilio, Amazon SES (send, SNS bounce/complaint), S3, Sentry, PostHog, biometric attendance devices (file import first, vendor push API later), Tally/accounting export (CSV/Excel format), Google Workspace SSO later. Sequence diagrams for Razorpay payment and for WhatsApp message status. Provider abstraction layer design (interfaces in TypeScript) so providers can be swapped per country. Webhook security checklist. Integration health dashboard for support.
