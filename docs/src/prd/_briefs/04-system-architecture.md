# Brief for 04-system-architecture.md

Title: System Architecture
Minimum words: 4200
Web research needed: no

## What this chapter must cover (every item, fully)

The full architecture in simple words with several mermaid diagrams: system context, container diagram (browser/PWA, Next.js on Vercel, Express API, BullMQ workers, PostgreSQL, Redis, S3, external providers), request lifecycle through middleware (request ID, rate limit, auth, tenant, RBAC, validation, controller, service, repository, response envelope) as a sequence diagram, modular monolith structure (module boundaries, events between modules), background processing (queues list, retry and dead-letter policy), caching strategy (what is cached, tenant-prefixed keys, TTLs, invalidation), file storage flow with pre-signed URLs, PDF generation service, search approach (PostgreSQL full-text and trigram first), real-time needs (polling first, server-sent events later), configuration and secrets, environments, observability (logs, metrics, traces, alerts), deployment topology at launch and at scale (link to the Blueprint scaling chapters), technology decisions table with reasons and rejected alternatives (microservices, schema-per-tenant, NoSQL, GraphQL), capacity assumptions and scaling levers, failure modes and resilience (timeouts, circuit breakers for providers, idempotency, graceful degradation).
