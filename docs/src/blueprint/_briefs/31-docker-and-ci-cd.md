# Brief for 31-docker-and-ci-cd.md

Title: Docker and CI/CD
Minimum words: 3200
Web research needed: no

## What this chapter must cover (every item, fully)

Complete, correct, copy-paste files with explanations line by line in simple words: multi-stage Dockerfile for the server (Node 24 alpine/slim, npm workspaces, prisma generate, non-root user, healthcheck), Dockerfile for the worker (same image, different command), optional Dockerfile for the client (when not on Vercel; Next.js standalone output), .dockerignore, docker-compose.yml for local full stack. GitHub Actions workflows (full YAML): ci.yml (install with cache, lint, typecheck, unit + integration tests with postgres and redis service containers, prisma validate, build), deploy-staging.yml (on push to main: build, run prisma migrate deploy, deploy to Railway via CLI or deploy hook, notify), deploy-production.yml (on tag v*: approval environment, migrate, deploy, smoke test, rollback note), security.yml (npm audit, CodeQL or dependency review, secret scanning), scheduled backup-check job. Database migrations in CI/CD (migrate deploy, never migrate dev; backup before risky migrations). Caching and speed tips, required secrets table for GitHub, branch protection tie-in, how to roll back (redeploy previous image/tag; database rollback strategy = forward fix), build badges, cost of GitHub Actions minutes. Mermaid flowchart of the pipeline. Validate YAML mentally: correct indentation, real action names (actions/checkout, actions/setup-node, docker/build-push-action), no invented actions.
