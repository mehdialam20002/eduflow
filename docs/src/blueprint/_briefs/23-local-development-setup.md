# Brief for 23-local-development-setup.md

Title: Local Development Setup
Minimum words: 2400
Web research needed: no

## What this chapter must cover (every item, fully)

Step-by-step from a clean Windows 11 laptop (primary) with notes for macOS/Linux: install Node.js 24 LTS, Git, Docker Desktop (WSL2), VS Code + extensions, Claude Code. Clone/create repo, npm install with workspaces, docker-compose.yml for PostgreSQL 16 + Redis 7 + Mailpit (full YAML), .env.example for server and client (full list with safe dummy values and one-line meaning each), Prisma commands (generate, migrate dev, studio, seed), run scripts (dev for client, server, worker together), seed accounts table (super admin, org admin, principal, teacher, accountant, parent, student with demo passwords for LOCAL only), testing webhooks locally (Razorpay/Stripe/WhatsApp with a tunnel such as ngrok or Cloudflare Tunnel), S3 locally (MinIO option) or a dev bucket, sending test WhatsApp with Meta test number, common errors and fixes table (port in use, Prisma client out of date, Docker not running, CORS, cookies on localhost, timezone), daily start/stop routine, how to reset the database safely, VS Code launch/debug config, recommended npm scripts table.
