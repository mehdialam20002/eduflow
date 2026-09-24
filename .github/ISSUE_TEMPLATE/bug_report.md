---
name: Bug report
about: Something in EduFlow behaves differently from the specification
title: "fix: <short description of what is wrong>"
labels: ["bug", "needs-triage"]
assignees: []
---

## What happens

<!-- One or two sentences. The behaviour you saw, not your theory about the cause. -->

## What should happen

<!-- Quote the rule. For example: docs/prd/25-fees-module.md, FEE-AC-07. -->

## Steps to reproduce

1.
2.
3.

## Where

- Module (for example `fees`, `attendance`):
- Role used (`ORG_ADMIN`, `TEACHER`, `PARENT`, ...):
- Environment: local / staging / production
- Organization and campus (use the seed names, never a real institute):
- Browser and screen width (UI bugs only):

## Evidence

<!-- The error message, the request id from the error envelope, the relevant log lines, or a
     screenshot with seed data only. Never paste real student, parent or staff data. -->

- Request id (`requestId` in the error response):
- Error code (`VALIDATION_ERROR`, `FORBIDDEN`, ...):
- Log lines (30 lines is plenty):

## Impact

- [ ] Blocker — money is wrong, data leaks across organizations, or nobody can log in
- [ ] High — a core daily task is broken and has no workaround
- [ ] Medium — annoying, but there is a workaround
- [ ] Low — cosmetic

## Notes

<!-- Anything already ruled out, the commit where it last worked, related issues. -->
