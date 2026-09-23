# Brief for 20-folder-structure.md

Title: Folder Structure
Minimum words: 3000
Web research needed: no

## What this chapter must cover (every item, fully)

The complete monorepo layout with npm workspaces: root files (package.json workspaces, tsconfig.base.json, .editorconfig, .nvmrc, .env.example, docker-compose.yml, CLAUDE.md, .claude/commands, .github/workflows, docs/). Full annotated trees in text fences (max 76 chars wide) for: client/ (Next.js App Router: src/app route groups (auth), (dashboard), (portal); feature folders under src/features/<module>/ with components, hooks, api, schemas; src/components/ui (shadcn), src/lib (api client, auth, permissions, formatters for currency/date), src/providers, middleware.ts, public, tests), server/ (src/app.ts, server.ts, config/, modules/<module>/ with routes.ts, controller.ts, service.ts, repository.ts, schemas.ts, events.ts, tests; middleware/ (auth, tenant, rbac, validate, rateLimit, errorHandler, requestId), lib/ (prisma with tenant extension, redis, queue, s3, logger, mailer, whatsapp, sms, payments/razorpay, payments/stripe, pdf), jobs/ (BullMQ workers), prisma/schema/*.prisma, prisma/migrations, prisma/seed), shared/ (types, zod schemas shared by client and server, constants: permissions, roles, error codes, enums; utils). A table explaining every top-level folder and the rule for what goes where. A worked example: every file that the Fees module touches (path list) and the request flow through them (mermaid sequence or flowchart). Naming rules for files and folders. How to add a new module in 8 steps. Import boundaries (client never imports server; both import shared) and path aliases. What not to do (no business logic in controllers or React components, no Prisma calls outside repositories/services).
