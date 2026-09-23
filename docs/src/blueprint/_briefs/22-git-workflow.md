# Brief for 22-git-workflow.md

Title: Git Workflow: Branches, Commits and Pull Requests
Minimum words: 2600
Web research needed: no

## What this chapter must cover (every item, fully)

Git strategy for a solo founder that also scales to a team: trunk-based with short-lived branches. Branch model (main = production, develop optional — recommend main + short feature branches + staging deploy from main with tags for production; justify), branch naming (feat/fee-invoices, fix/attendance-lock, chore/, docs/, hotfix/), mermaid gitGraph or flowchart of the flow from branch to production. Commit rules: Conventional Commits with types, scopes = module codes or names, examples table (good vs bad), commit size guidance, committing AI-generated code (review first, one logical change). Full PR template in a markdown fence (summary, PRD IDs covered such as FEE-API-03, screenshots, test evidence, checklist: tenant scope, permissions, validation, migrations, tests, docs). Self-review routine for a solo founder (24-hour rule for risky changes, use Claude Code as a second reviewer with the security review prompt P-52). Branch protection settings on GitHub, required checks. Versioning and releases (semver tags, CHANGELOG, release notes). Database migration rules in Git (never edit an applied migration; expand-and-contract pattern for zero-downtime). Hotfix procedure. .gitignore essentials. Handling secrets leaked by mistake (rotate, purge). Git command cheat sheet table.
