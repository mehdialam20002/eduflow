# Brief for 07-rbac-and-permissions-matrix.md

Title: RBAC and Permissions Matrix
Minimum words: 3800
Web research needed: no

## What this chapter must cover (every item, fully)

The RBAC model in simple words: users, roles, permissions, scopes (Own, Campus), system roles versus custom roles, and how the API and the UI enforce them (requirePermission middleware, ownership checks in services, Can component in React; TypeScript examples). Permission naming rules. Reproduce the COMPLETE permission matrix from `E:/mysaasschool/docs/src/_permissions.md`: one table per module prefix with the seven roles as columns and the exact Yes/No/Own/Campus/View values, plus the 34-module summary matrix. Custom role presets (Librarian, Transport Manager, Hostel Warden, HR Manager, Front Desk, Exam Coordinator). Document the users and roles endpoints (USR group in the registry). ASCII wireframes: roles list, role editor with permission checkboxes, user invite with role and campus. Rules: least privilege, separation of duties for money (the person who creates a refund cannot approve it), SUPER_ADMIN impersonation with audit and customer-visible log, permission caching and invalidation. Edge cases and test scenarios. Write in several steps; the matrix must be complete.
