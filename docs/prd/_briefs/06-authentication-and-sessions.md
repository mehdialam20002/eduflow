# Brief for 06-authentication-and-sessions.md

Title: Authentication and Sessions
Minimum words: 3600
Web research needed: no

## What this chapter must cover (every item, fully)

All login methods: email or phone + password for staff, OTP login for parents and students, invitations, first-time password set, forgot/reset password, optional MFA (TOTP) for admins, SSO (Google Workspace/SAML) for Enterprise later. JWT design: access token claims (sub, orgId, roles, campusIds, permissions version), 15-minute life, signing keys and rotation; refresh token rotation with families, reuse detection, hashed storage, httpOnly Secure SameSite cookie, device list and revoke. Sequence diagrams for login, refresh and reuse detection, OTP login. Password policy and bcrypt cost. Brute-force protection and rate limits from the canon, account lockout, OTP limits. Session rules (idle timeout for finance roles, remember device). Document the AUTH endpoints from the registry file `_api/01-platform-people.md` using the module chapter style for API (request, response, errors). ASCII wireframes: login, OTP login (mobile), forgot password, accept invitation, sessions list. Validation and error messages. Security edge cases (user in two organizations, parent with children in two institutes, disabled user with a live token, clock skew). Audit events. Test scenarios.
