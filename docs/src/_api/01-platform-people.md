# EduFlow API Registry — 01-platform-people

Modules in this file: AUTH, USR, DASH, ORG, CAMP, ADM, STU, TCH, STF. Base URL `/api/v1`. This registry is the source of truth for endpoint IDs, methods, paths and permission keys (see `_canon.md`, API conventions).

## Conventions used in this file

- Paths are relative to `/api/v1`, plural kebab-case, one nesting level. Child collections are nested (`/students/:id/documents`); a single child row is addressed flat (`/student-documents/:id`).
- `PATCH` = partial update. `PUT` = replace a whole set (roles, campuses, permissions, subjects). `DELETE` = soft delete (`deletedAt`) unless stated.
- Permission column: `public` = no access token (rate-limited; captcha, signature or one-time token as noted). `self` = any signed-in user acting on the own account. Otherwise an RBAC key, checked with its scope (`ALL`, `CAMPUS`, `OWN`, `VIEW`).
- Tenant comes from the JWT `orgId`. Pre-login (`/auth/...`, `/signup/...`) and `/public/...` endpoints resolve the tenant from the `{slug}.eduflow.app` host or a `tenantSlug` parameter. `/platform/...` requires `SUPER_ADMIN`; tenant context through `X-Organization-Id`.
- `(IK)` = `Idempotency-Key` header required.
- `POST /<resource>/import` creates an `ImportJob` (Excel/CSV, `isDryRun` supported). `POST /<resource>/export` creates an `ExportJob`. Both return `202` with the job id; job status, error workbook and file download use the shared import-job / export-job endpoints (Settings registry).
- Creating students, campuses, users and custom roles checks plan limits and features; failure returns `PLAN_LIMIT_REACHED` (403).
- Static segments (`/lookup`, `/summary`, `/import`, `/export`, `/bulk-*`) are routed before `/:id`.
- `/teachers` is a view of `Staff` rows with `staffType = TEACHING`; teacher ids are `Staff` ids.

## AUTH — Authentication and Sessions

Resource base path(s): `/auth`

| ID | Method | Path | Permission | Purpose | Main models |
|---|---|---|---|---|---|
| AUTH-API-01 | POST | /auth/login | public | Password login by email or phone; returns tokens or an MFA challenge | User, RefreshToken, LoginHistory |
| AUTH-API-02 | POST | /auth/otp/request | public | Send OTP: purpose LOGIN, VERIFY_PHONE, VERIFY_EMAIL, or MFA resend | OtpCode |
| AUTH-API-03 | POST | /auth/otp/verify | public | Verify login OTP and sign in (parents, students) | OtpCode, User, RefreshToken, LoginHistory |
| AUTH-API-04 | POST | /auth/mfa/verify | public | Finish login with TOTP, SMS/email code or recovery code (uses mfaToken) | User, OtpCode, RefreshToken, LoginHistory |
| AUTH-API-05 | POST | /auth/refresh | public | Rotate refresh cookie and issue access token; reuse revokes the family | RefreshToken |
| AUTH-API-06 | POST | /auth/logout | self | Revoke current session (LOGOUT) and clear cookie | RefreshToken |
| AUTH-API-07 | POST | /auth/forgot-password | public | Send reset link (email) or OTP (phone); always answers 200 | PasswordResetToken, OtpCode |
| AUTH-API-08 | POST | /auth/reset-password | public | Set new password with token; revokes all sessions | PasswordResetToken, User, RefreshToken |
| AUTH-API-09 | GET | /auth/invitations/:token | public | Validate invitation; show organization, role and campuses | Invitation, Role |
| AUTH-API-10 | POST | /auth/invitations/:token/accept | public | Create login, link profile, record consents, sign in | Invitation, User, UserRole, UserCampus, ConsentRecord |
| AUTH-API-11 | GET | /auth/tenant | public | Tenant name, logo, type and login options for the login page | Organization |
| AUTH-API-12 | GET | /auth/sso/start | public | Redirect to the tenant identity provider (Enterprise SSO) | Organization, OrganizationSetting |
| AUTH-API-13 | POST | /auth/sso/callback | public | Validate identity provider response and sign in (method SSO) | User, RefreshToken, LoginHistory |
| AUTH-API-14 | GET | /auth/me | self | Current user, roles, permissions with scope, campuses, plan features | User, UserRole, RolePermission, UserCampus, PlanFeature |
| AUTH-API-15 | PATCH | /auth/me | self | Update own name, avatar, locale, timezone, analytics opt-out | User |
| AUTH-API-16 | POST | /auth/change-password | self | Change own password; revokes other sessions | User, RefreshToken |
| AUTH-API-17 | POST | /auth/verify-contact | self | Confirm own phone or email with OTP (sets verifiedAt) | OtpCode, User |
| AUTH-API-18 | POST | /auth/switch-campus | self | Set default campus among assigned campuses | UserCampus |
| AUTH-API-19 | POST | /auth/mfa/setup | self | Start MFA enrolment: TOTP secret and QR, or SMS/email code | User, OtpCode |
| AUTH-API-20 | POST | /auth/mfa/enable | self | Confirm first code, enable MFA, return recovery codes | User |
| AUTH-API-21 | POST | /auth/mfa/disable | self | Disable MFA (password and current code required) | User |
| AUTH-API-22 | POST | /auth/mfa/recovery-codes | self | Regenerate recovery codes | User |
| AUTH-API-23 | GET | /auth/sessions | self | List own active sessions (device, IP, last used) | RefreshToken |
| AUTH-API-24 | DELETE | /auth/sessions/:id | self | Revoke one own session | RefreshToken |
| AUTH-API-25 | POST | /auth/sessions/revoke-all | self | Revoke all own sessions except the current one | RefreshToken |
| AUTH-API-26 | GET | /auth/login-history | self | Own recent login attempts | LoginHistory |

Events emitted: auth.login.succeeded, auth.login.failed, auth.account.locked, auth.otp.requested, auth.password.reset_requested, auth.password.changed, auth.contact.verified, auth.mfa.enabled, auth.mfa.disabled, auth.session.revoked, auth.token.reuse_detected, invitation.accepted

## USR — Users and Roles

Resource base path(s): `/users`, `/roles`, `/permissions`, `/invitations`

| ID | Method | Path | Permission | Purpose | Main models |
|---|---|---|---|---|---|
| USR-API-01 | GET | /users | users.view | List users; filters userType, status, roleId, campusId, q | User, UserRole, UserCampus |
| USR-API-02 | POST | /users | users.create | Create staff login with temporary password; checks plan user limit | User, UserRole, UserCampus, Plan |
| USR-API-03 | GET | /users/:id | users.view | User with roles, campuses and linked profile | User, Staff, Guardian, Student |
| USR-API-04 | PATCH | /users/:id | users.update | Update name, email, phone, locale | User |
| USR-API-05 | DELETE | /users/:id | users.delete | Soft delete; status DEACTIVATED; revoke sessions | User, RefreshToken |
| USR-API-06 | POST | /users/:id/suspend | users.manage | ACTIVE to SUSPENDED; revoke sessions | User, RefreshToken |
| USR-API-07 | POST | /users/:id/activate | users.manage | Reactivate SUSPENDED or DEACTIVATED user; unlock LOCKED | User |
| USR-API-08 | POST | /users/:id/deactivate | users.manage | Set DEACTIVATED (for example staff exit); revoke sessions | User, RefreshToken |
| USR-API-09 | POST | /users/:id/reset-password | users.manage | Send reset link or set temporary password (mustChangePassword) | User, PasswordResetToken |
| USR-API-10 | POST | /users/:id/reset-mfa | users.manage | Clear MFA secret and recovery codes | User |
| USR-API-11 | PUT | /users/:id/roles | roles.assign | Replace the roles of a user | UserRole, Role |
| USR-API-12 | PUT | /users/:id/campuses | users.manage | Replace campus assignment and default campus | UserCampus, Campus |
| USR-API-13 | GET | /users/:id/sessions | users.view | Active sessions of a user | RefreshToken |
| USR-API-14 | POST | /users/:id/revoke-sessions | users.manage | Revoke all sessions (ADMIN_REVOKED) | RefreshToken |
| USR-API-15 | GET | /users/:id/login-history | users.view | Login attempts of a user | LoginHistory |
| USR-API-16 | GET | /roles | roles.view | System and custom roles with user counts | Role, UserRole |
| USR-API-17 | POST | /roles | roles.create | Create custom role (plan feature custom_roles) | Role, PlanFeature |
| USR-API-18 | GET | /roles/:id | roles.view | Role with granted permissions and scopes | Role, RolePermission |
| USR-API-19 | PATCH | /roles/:id | roles.update | Rename, describe, activate or deactivate a custom role | Role |
| USR-API-20 | DELETE | /roles/:id | roles.delete | Delete custom role that has no users | Role, UserRole |
| USR-API-21 | PUT | /roles/:id/permissions | roles.update | Replace permission grants with scope (ALL, CAMPUS, OWN, VIEW) | RolePermission, Permission |
| USR-API-22 | POST | /roles/:id/clone | roles.create | Copy a system or custom role into a new custom role | Role, RolePermission |
| USR-API-23 | GET | /permissions | roles.view | Permission catalogue grouped by module, with plan-gated flags | Permission, PlanFeature |
| USR-API-24 | GET | /invitations | users.view | List invitations; filters status, userType | Invitation |
| USR-API-25 | POST | /invitations | users.invite | Invite staff, parent or student; links Staff, Guardian or Student profile | Invitation, Role |
| USR-API-26 | POST | /invitations/:id/resend | users.invite | Issue new token and expiry; resend message | Invitation |
| USR-API-27 | POST | /invitations/:id/revoke | users.invite | PENDING to REVOKED | Invitation |
| USR-API-28 | POST | /invitations/bulk | users.invite | Bulk invite guardians or students of a batch, or a staff list | Invitation, Guardian, Student, Staff |
| USR-API-29 | POST | /users/export | users.export | Export user list | ExportJob |
| USR-API-30 | GET | /users/lookup | users.view | Typeahead for assignee and approver pickers | User |
| USR-API-31 | GET | /users/summary | users.view | Counts by type and status; seats used against plan limit | User, Plan |

Events emitted: user.created, user.updated, user.suspended, user.activated, user.deactivated, user.deleted, user.password.reset_by_admin, user.mfa.reset, user.roles.changed, user.campuses.changed, user.sessions.revoked, role.created, role.updated, role.deleted, role.permissions.changed, invitation.sent, invitation.resent, invitation.revoked, invitation.expired

## DASH — Dashboard

Resource base path(s): `/dashboard` (singleton namespace)

| ID | Method | Path | Permission | Purpose | Main models |
|---|---|---|---|---|---|
| DASH-API-01 | GET | /dashboard/summary | dashboard.view | Role-aware KPI cards for a date range and campus | DailyMetricSnapshot |
| DASH-API-02 | GET | /dashboard/trends | dashboard.view | Time series of one metric (day, week or month) | DailyMetricSnapshot |
| DASH-API-03 | GET | /dashboard/attendance-today | dashboard.view | Batch-wise marked and pending sessions, present percent | AttendanceSession, AttendanceRecord, Batch |
| DASH-API-04 | GET | /dashboard/fee-overview | dashboard.view_finance | Collected today and this month, dues, overdue, split by method | DailyMetricSnapshot, Payment, FeeInvoice |
| DASH-API-05 | GET | /dashboard/admissions-funnel | dashboard.view | Inquiries by stage, applications by status, conversions | AdmissionInquiry, AdmissionApplication |
| DASH-API-06 | GET | /dashboard/tasks | dashboard.view | Pending actions of the user: approvals, unmarked attendance, follow-ups due | StudentTransfer, LeaveRequest, AttendanceSession, InquiryFollowUp |
| DASH-API-07 | GET | /dashboard/alerts | dashboard.view | Plan limit near, trial ending, low message credits, expiring documents | Subscription, Plan, MessageCreditWallet, StaffDocument |
| DASH-API-08 | GET | /dashboard/activity | dashboard.view | Recent activity feed inside the user's data scope | AuditLog |
| DASH-API-09 | GET | /dashboard/upcoming | dashboard.view | Upcoming events, holidays, exams and birthdays | CalendarEvent, Holiday, Exam, Student |
| DASH-API-10 | GET | /dashboard/teacher-today | dashboard.view | Teacher home: today's classes, pending attendance, homework to grade | TimetableEntry, ClassSession, AttendanceSession, Homework |
| DASH-API-11 | GET | /dashboard/counter-today | dashboard.view_finance | Accountant home: collection by method, pending cheques, day-close status | Payment, Receipt, DayClose |
| DASH-API-12 | GET | /dashboard/widgets | dashboard.view | Widget catalogue allowed by role and plan | PlanFeature, RolePermission |
| DASH-API-13 | GET | /dashboard/preferences | dashboard.view | Own saved layouts for all dashboard keys | DashboardPreference |
| DASH-API-14 | PUT | /dashboard/preferences/:dashboardKey | dashboard.view | Save own layout, hidden widgets, default campus and range | DashboardPreference |
| DASH-API-15 | DELETE | /dashboard/preferences/:dashboardKey | dashboard.view | Reset own layout to the role default (hard delete) | DashboardPreference |
| DASH-API-16 | POST | /dashboard/refresh | dashboard.manage | Queue recompute of today's metric snapshot | DailyMetricSnapshot |

Events emitted: metrics.snapshot.computed (internal; no notification)

## ORG — Organizations

Resource base path(s): `/plans`, `/countries`, `/signup`, `/onboarding`, `/organizations/current`, `/subscriptions`, `/subscription-invoices`, `/add-ons`, `/webhooks/billing`, `/platform/organizations`, `/platform/subscriptions`, `/platform/subscription-invoices`, `/platform/plans`, `/platform/metrics`, `/platform/users`, `/platform/audit-logs`

| ID | Method | Path | Permission | Purpose | Main models |
|---|---|---|---|---|---|
| ORG-API-01 | GET | /plans | public | Public plan catalogue: prices by currency and cycle, limits, features | Plan, PlanPrice, PlanFeature |
| ORG-API-02 | GET | /signup/slug-availability | public | Check that a subdomain slug is valid and free | Organization |
| ORG-API-03 | POST | /signup | public | Create organization, owner (ORG_ADMIN), main campus, trial subscription; send OTP | Organization, User, Campus, Subscription, ConsentRecord |
| ORG-API-04 | POST | /signup/verify | public | Verify owner OTP, activate the user and sign in | OtpCode, User, RefreshToken |
| ORG-API-05 | GET | /onboarding | organizations.manage | Wizard state: steps done, next step, setup checklist | Organization, OrganizationSetting |
| ORG-API-06 | PUT | /onboarding/steps/:stepKey | organizations.manage | Save one step: profile, campus, academic-year, courses-batches, fees, team | Organization, Campus, AcademicYear, Course, Batch |
| ORG-API-07 | POST | /onboarding/complete | organizations.manage | Set onboardingCompletedAt (skipped steps allowed) | Organization |
| ORG-API-08 | GET | /organizations/current | organizations.view | Tenant profile, branding, status and current plan | Organization, Plan |
| ORG-API-09 | PATCH | /organizations/current | organizations.update | Update name, legal and tax details, address, timezone, locale, financial year, week start | Organization |
| ORG-API-10 | PATCH | /organizations/current/branding | organizations.update | Logo, colours, receipt footer; hide EduFlow branding if plan allows | Organization, FileAsset, PlanFeature |
| ORG-API-11 | PUT | /organizations/current/custom-domain | organizations.manage | Set and verify white-label domain (Enterprise) | Organization |
| ORG-API-12 | GET | /organizations/current/usage | organizations.view | Usage against limits: students, campuses, users, storage, credits; enabled features | Plan, PlanFeature, Subscription, AddOnPurchase |
| ORG-API-13 | POST | /organizations/current/transfer-ownership | organizations.manage | Change ownerUserId to another ORG_ADMIN (password and MFA) | Organization, User |
| ORG-API-14 | POST | /organizations/current/close-account | organizations.manage | Cancel subscription, queue full data export, schedule deletion; status CANCELLED | Organization, Subscription, ExportJob |
| ORG-API-15 | GET | /subscriptions/current | billing.view | Live subscription: plan, cycle, period, status, renewal amount | Subscription, Plan |
| ORG-API-16 | POST | /subscriptions/preview | billing.view | Price preview for a plan or cycle change: proration and tax | Subscription, PlanPrice, Country |
| ORG-API-17 | POST | /subscriptions/checkout | billing.manage | Start paid plan at Razorpay or Stripe; returns checkout data (IK) | Subscription, SubscriptionInvoice |
| ORG-API-18 | POST | /subscriptions/current/change-plan | billing.manage | Upgrade or downgrade plan or cycle; downgrade validates current usage | Subscription, Organization, Plan |
| ORG-API-19 | POST | /subscriptions/current/cancel | billing.manage | Set cancelAtPeriodEnd with cancelReason | Subscription |
| ORG-API-20 | POST | /subscriptions/current/resume | billing.manage | Undo scheduled cancel or resume PAUSED subscription | Subscription |
| ORG-API-21 | POST | /subscriptions/current/payment-method | billing.manage | Gateway session to update card or mandate | Subscription |
| ORG-API-22 | GET | /subscription-invoices | billing.view | List EduFlow invoices of the tenant; filters status, date | SubscriptionInvoice |
| ORG-API-23 | GET | /subscription-invoices/:id | billing.view | Invoice with line items and tax breakdown | SubscriptionInvoice |
| ORG-API-24 | GET | /subscription-invoices/:id/pdf | billing.view | Pre-signed URL of the tax invoice PDF | SubscriptionInvoice, FileAsset |
| ORG-API-25 | POST | /subscription-invoices/:id/pay | billing.manage | Pay an OPEN invoice through the gateway (IK) | SubscriptionInvoice |
| ORG-API-26 | GET | /add-ons/catalog | billing.view | Add-on catalogue priced in tenant currency, eligibility by plan | AddOnPurchase, PlanFeature |
| ORG-API-27 | GET | /add-ons | billing.view | Purchased add-ons with status, credits remaining, expiry | AddOnPurchase |
| ORG-API-28 | POST | /add-ons | billing.manage | Buy add-on: extra campus, AI Insights, credit pack, migration, training (IK) | AddOnPurchase, SubscriptionInvoice |
| ORG-API-29 | POST | /add-ons/:id/cancel | billing.manage | Cancel a recurring add-on at period end | AddOnPurchase |
| ORG-API-30 | POST | /webhooks/billing/:provider | public | Razorpay or Stripe subscription events; signature checked, idempotent | WebhookEvent, Subscription, SubscriptionInvoice, AddOnPurchase |
| ORG-API-31 | GET | /platform/organizations | platform.view | List tenants; filters status, plan, country, type, q | Organization, Subscription |
| ORG-API-32 | POST | /platform/organizations | platform.manage | Create tenant for a sales-led or Enterprise deal | Organization, User, Campus, Subscription |
| ORG-API-33 | GET | /platform/organizations/:id | platform.view | Tenant 360: plan, usage, owner, invoices, activation | Organization, Subscription, DailyMetricSnapshot |
| ORG-API-34 | PATCH | /platform/organizations/:id | platform.manage | Edit tenant profile, type, dataRegion, signupSource | Organization |
| ORG-API-35 | POST | /platform/organizations/:id/suspend | platform.manage | Status SUSPENDED with suspendedReason; blocks tenant logins | Organization |
| ORG-API-36 | POST | /platform/organizations/:id/reactivate | platform.manage | Return SUSPENDED or CANCELLED tenant to ACTIVE | Organization, Subscription |
| ORG-API-37 | POST | /platform/organizations/:id/extend-trial | platform.manage | Move trialEndsAt on organization and subscription | Organization, Subscription |
| ORG-API-38 | POST | /platform/organizations/:id/change-plan | platform.manage | Set plan, limit overrides, custom price, OFFLINE billing | Subscription, Organization |
| ORG-API-39 | POST | /platform/organizations/:id/impersonate | platform.impersonate | Short-lived tenant token with reason; audited as IMPERSONATION | User, AuditLog |
| ORG-API-40 | DELETE | /platform/organizations/:id | platform.manage | Soft delete a cancelled tenant; schedule purge after retention | Organization |
| ORG-API-41 | GET | /platform/subscriptions | platform.view | All subscriptions; renewals due, PAST_DUE (dunning view) | Subscription |
| ORG-API-42 | GET | /platform/subscription-invoices | platform.view | All invoices; filters status, organization, date | SubscriptionInvoice |
| ORG-API-43 | POST | /platform/subscription-invoices | platform.manage | Raise manual invoice (Enterprise contract, migration, training) | SubscriptionInvoice, AddOnPurchase |
| ORG-API-44 | POST | /platform/subscription-invoices/:id/mark-paid | platform.manage | Record offline payment; status PAID | SubscriptionInvoice, Subscription |
| ORG-API-45 | POST | /platform/subscription-invoices/:id/void | platform.manage | Status VOID with voidReason | SubscriptionInvoice |
| ORG-API-46 | POST | /platform/subscription-invoices/:id/refund | platform.manage | Refund and issue credit note; status REFUNDED | SubscriptionInvoice |
| ORG-API-47 | GET | /platform/plans | platform.view | All plans including non-public and archived | Plan, PlanPrice, PlanFeature |
| ORG-API-48 | POST | /platform/plans | platform.manage | Create plan | Plan |
| ORG-API-49 | PATCH | /platform/plans/:id | platform.manage | Update limits, trial days, visibility, status | Plan |
| ORG-API-50 | PUT | /platform/plans/:id/prices | platform.manage | Replace prices per currency and billing cycle | PlanPrice |
| ORG-API-51 | PUT | /platform/plans/:id/features | platform.manage | Replace module and feature gating rows | PlanFeature |
| ORG-API-52 | GET | /platform/metrics | platform.view | MRR, ARR, paying tenants, trials, conversion, churn, active students | Organization, Subscription, SubscriptionInvoice, DailyMetricSnapshot |
| ORG-API-53 | GET | /platform/users | platform.view | List platform staff (userType PLATFORM) | User, UserRole |
| ORG-API-54 | POST | /platform/users | platform.manage | Add platform staff user (MFA mandatory) | User, UserRole |
| ORG-API-55 | PATCH | /platform/users/:id | platform.manage | Update or deactivate platform staff user | User |
| ORG-API-56 | GET | /platform/audit-logs | platform.view | Console actions and impersonation trail | AuditLog |

Events emitted: organization.created, organization.verified, organization.onboarding.completed, organization.activated, organization.updated, organization.ownership.transferred, organization.suspended, organization.reactivated, organization.cancelled, organization.limit.near, organization.limit.reached, subscription.trial.ending, subscription.trial.expired, subscription.activated, subscription.plan_changed, subscription.renewed, subscription.payment_failed, subscription.past_due, subscription.cancelled, subscription.invoice.issued, subscription.invoice.paid, subscription.invoice.refunded, addon.purchased, addon.activated, addon.expired, addon.cancelled, platform.impersonation.started

## CAMP — Multi Campus

Resource base path(s): `/campuses`

| ID | Method | Path | Permission | Purpose | Main models |
|---|---|---|---|---|---|
| CAMP-API-01 | GET | /campuses | campuses.view | List campuses; filters status, q; non-admins see assigned campuses | Campus, UserCampus |
| CAMP-API-02 | POST | /campuses | campuses.create | Create campus; checks maxCampuses plus EXTRA_CAMPUS add-ons | Campus, Plan, AddOnPurchase |
| CAMP-API-03 | GET | /campuses/:id | campuses.view | Campus detail | Campus |
| CAMP-API-04 | PATCH | /campuses/:id | campuses.update | Update contact, address, geo-fence, tax, board codes, weekly offs, logo | Campus |
| CAMP-API-05 | DELETE | /campuses/:id | campuses.delete | Soft delete when no active students, staff or batches; never the main campus | Campus |
| CAMP-API-06 | POST | /campuses/:id/deactivate | campuses.manage | Status INACTIVE; hidden from pickers | Campus |
| CAMP-API-07 | POST | /campuses/:id/activate | campuses.manage | Status ACTIVE; rechecks campus limit | Campus, Plan |
| CAMP-API-08 | POST | /campuses/:id/archive | campuses.manage | Status ARCHIVED; data stays read-only | Campus |
| CAMP-API-09 | POST | /campuses/:id/set-main | campuses.manage | Make this the main campus (one per organization) | Campus |
| CAMP-API-10 | GET | /campuses/:id/users | campuses.view | Users assigned to the campus | UserCampus, User |
| CAMP-API-11 | PUT | /campuses/:id/users | campuses.manage | Replace the user assignments of the campus | UserCampus |
| CAMP-API-12 | POST | /campuses/:id/copy-setup | campuses.manage | Copy courses, fee structures, period slots, late-fee rules from another campus | Course, FeeStructure, PeriodSlot, LateFeeRule |
| CAMP-API-13 | POST | /campuses/export | campuses.export | Export campus list | ExportJob |
| CAMP-API-14 | GET | /campuses/lookup | campuses.view | Assigned campuses (id, name, code) for the switcher and dropdowns | Campus, UserCampus |
| CAMP-API-15 | GET | /campuses/:id/summary | campuses.view | Campus KPIs: students, staff, attendance percent, fee collected, dues | DailyMetricSnapshot |
| CAMP-API-16 | GET | /campuses/comparison | campuses.view | Compare KPIs across campuses for a date range | DailyMetricSnapshot, Campus |

Events emitted: campus.created, campus.updated, campus.deactivated, campus.activated, campus.archived, campus.deleted, campus.main_changed, campus.users.changed, campus.setup.copied

## ADM — Student Admission

Resource base path(s): `/admission-inquiries`, `/inquiry-follow-ups`, `/admission-applications`, `/admission-application-documents`, `/public/admission-form`, `/public/admission-inquiries`, `/public/admission-applications`

| ID | Method | Path | Permission | Purpose | Main models |
|---|---|---|---|---|---|
| ADM-API-01 | GET | /admission-inquiries | admissions.view | List leads; filters stage, priority, source, assignedToId, courseId, followUpDue, q | AdmissionInquiry |
| ADM-API-02 | POST | /admission-inquiries | admissions.create | Add walk-in or phone lead; duplicate phone warning; inquiryNo issued | AdmissionInquiry, NumberSequence |
| ADM-API-03 | GET | /admission-inquiries/:id | admissions.view | Lead with follow-ups and applications | AdmissionInquiry, InquiryFollowUp |
| ADM-API-04 | PATCH | /admission-inquiries/:id | admissions.update | Update lead details, priority, notes, consent | AdmissionInquiry |
| ADM-API-05 | DELETE | /admission-inquiries/:id | admissions.delete | Soft delete lead | AdmissionInquiry |
| ADM-API-06 | POST | /admission-inquiries/:id/change-stage | admissions.update | Move stage; LOST needs lostReason; JUNK allowed | AdmissionInquiry |
| ADM-API-07 | POST | /admission-inquiries/:id/schedule-demo | admissions.update | Set demoBatchId and demoAt; stage DEMO_SCHEDULED | AdmissionInquiry, Batch |
| ADM-API-08 | POST | /admission-inquiries/:id/convert | admissions.create | Create prefilled application; stage APPLICATION_STARTED | AdmissionInquiry, AdmissionApplication |
| ADM-API-09 | POST | /admission-inquiries/:id/follow-ups | admissions.update | Log or schedule a follow-up; updates lastContactedAt, nextFollowUpAt, stage | InquiryFollowUp, AdmissionInquiry |
| ADM-API-10 | GET | /inquiry-follow-ups | admissions.view | Follow-ups due today or overdue; filters inquiryId, doneById, date | InquiryFollowUp |
| ADM-API-11 | PATCH | /inquiry-follow-ups/:id | admissions.update | Complete with outcome, or reschedule | InquiryFollowUp |
| ADM-API-12 | POST | /admission-inquiries/bulk-assign | admissions.manage | Assign one or many leads to a counsellor | AdmissionInquiry, User |
| ADM-API-13 | GET | /admission-applications | admissions.view | List applications; filters status, courseId, academicYearId, fee status, q | AdmissionApplication |
| ADM-API-14 | POST | /admission-applications | admissions.create | Front-desk application in DRAFT; applicationNo issued | AdmissionApplication, NumberSequence |
| ADM-API-15 | GET | /admission-applications/:id | admissions.view | Application with form data, documents and fee status | AdmissionApplication, AdmissionApplicationDocument |
| ADM-API-16 | PATCH | /admission-applications/:id | admissions.update | Edit form data, preferred batch, test score | AdmissionApplication |
| ADM-API-17 | DELETE | /admission-applications/:id | admissions.delete | Soft delete; DRAFT only | AdmissionApplication |
| ADM-API-18 | POST | /admission-applications/:id/submit | admissions.update | DRAFT to SUBMITTED; guardian consent captured | AdmissionApplication, ConsentRecord |
| ADM-API-19 | POST | /admission-applications/:id/review | admissions.update | Set UNDER_REVIEW or DOCUMENTS_PENDING with remarks | AdmissionApplication |
| ADM-API-20 | POST | /admission-applications/:id/schedule-test | admissions.update | Set entrance test time, venue, max score; TEST_SCHEDULED | AdmissionApplication |
| ADM-API-21 | POST | /admission-applications/:id/schedule-interview | admissions.update | Set interviewAt; INTERVIEW_SCHEDULED | AdmissionApplication |
| ADM-API-22 | POST | /admission-applications/:id/approve | admissions.approve | Status APPROVED with decision remarks | AdmissionApplication |
| ADM-API-23 | POST | /admission-applications/:id/waitlist | admissions.approve | Status WAITLISTED | AdmissionApplication |
| ADM-API-24 | POST | /admission-applications/:id/reject | admissions.approve | Status REJECTED with decision remarks | AdmissionApplication |
| ADM-API-25 | POST | /admission-applications/:id/withdraw | admissions.update | Status WITHDRAWN at the parent's request | AdmissionApplication |
| ADM-API-26 | POST | /admission-applications/:id/waive-fee | admissions.approve | Application fee status WAIVED with reason | AdmissionApplication |
| ADM-API-27 | POST | /admission-applications/:id/enroll | admissions.enroll | Convert APPROVED application to student, guardians, enrollment; copy documents; ENROLLED | Student, Guardian, StudentGuardian, Enrollment, StudentDocument |
| ADM-API-28 | GET | /admission-applications/:id/documents | admissions.view | List application documents | AdmissionApplicationDocument |
| ADM-API-29 | POST | /admission-applications/:id/documents | admissions.update | Attach an uploaded file as a document | AdmissionApplicationDocument, FileAsset |
| ADM-API-30 | DELETE | /admission-application-documents/:id | admissions.update | Remove document (hard delete of the row) | AdmissionApplicationDocument |
| ADM-API-31 | POST | /admission-application-documents/:id/verify | admissions.update | Mark document verified | AdmissionApplicationDocument |
| ADM-API-32 | GET | /admission-applications/:id/pdf | admissions.view | Printable application form PDF | AdmissionApplication, FileAsset |
| ADM-API-33 | POST | /admission-inquiries/import | admissions.import | Import leads from Excel (type INQUIRIES) | ImportJob |
| ADM-API-34 | POST | /admission-inquiries/export | admissions.export | Export lead list | ExportJob |
| ADM-API-35 | POST | /admission-applications/export | admissions.export | Export application list | ExportJob |
| ADM-API-36 | GET | /admission-inquiries/summary | admissions.view | Funnel by stage, source and counsellor; conversion percent; applications by status | AdmissionInquiry, AdmissionApplication |
| ADM-API-37 | GET | /admission-applications/seat-availability | admissions.view | Capacity against active enrollments and approved applications per batch | Batch, Enrollment, AdmissionApplication |
| ADM-API-38 | GET | /public/admission-form | public | Online form config: open courses, campuses, session, custom fields, fee, consent text | Course, Campus, AcademicYear, CustomFieldDefinition, PolicyDocument |
| ADM-API-39 | POST | /public/admission-inquiries | public | Website lead form; captcha, consent, UTM saved | AdmissionInquiry, ConsentRecord |
| ADM-API-40 | POST | /public/admission-applications | public | Submit online application; returns applicationNo and tracking token | AdmissionApplication, ConsentRecord |
| ADM-API-41 | POST | /public/admission-applications/:id/documents | public | Attach document with pre-signed upload (tracking token) | AdmissionApplicationDocument, FileAsset |
| ADM-API-42 | POST | /public/admission-applications/:id/pay | public | Create gateway order for the application fee (tracking token, IK) | PaymentOrder, Payment |
| ADM-API-43 | GET | /public/admission-applications/:id/status | public | Track application status (tracking token) | AdmissionApplication |

Events emitted: admission.inquiry.created, admission.inquiry.assigned, admission.inquiry.stage_changed, admission.inquiry.lost, admission.followup.scheduled, admission.followup.due, admission.demo.scheduled, admission.application.submitted, admission.application.documents_requested, admission.application.test_scheduled, admission.application.interview_scheduled, admission.application.approved, admission.application.waitlisted, admission.application.rejected, admission.application.withdrawn, admission.application.fee_paid, admission.application.enrolled

## STU — Student Profile

Resource base path(s): `/students`, `/guardians`, `/student-guardians`, `/families`, `/enrollments`, `/student-documents`, `/student-notes`, `/student-transfers`, `/portal/parent/students`, `/portal/parent/profile`, `/portal/student/profile`

| ID | Method | Path | Permission | Purpose | Main models |
|---|---|---|---|---|---|
| STU-API-01 | GET | /students | students.view | List and search; filters campusId, batchId, courseId, academicYearId, status, category, quota, q | Student, Enrollment |
| STU-API-02 | POST | /students | students.create | Direct admission: student, guardians, enrollment; admissionNo issued; plan limit check | Student, Guardian, StudentGuardian, Enrollment, NumberSequence |
| STU-API-03 | GET | /students/:id | students.view | Profile with guardians, family and current enrollment | Student, StudentGuardian, Enrollment |
| STU-API-04 | PATCH | /students/:id | students.update | Update personal, address, identity, photo and custom fields | Student, CustomFieldValue |
| STU-API-05 | DELETE | /students/:id | students.delete | Soft delete; blocked when invoices or payments exist | Student |
| STU-API-06 | GET | /students/:id/overview | students.view | 360 snapshot: attendance percent, fee dues, last result, notes count | Student, AttendanceRecord, FeeInvoice, ExamMark |
| STU-API-07 | POST | /students/:id/change-status | students.manage | Change status with reason and effective date; leaving ends enrollments | Student, StudentStatusHistory, Enrollment |
| STU-API-08 | GET | /students/:id/status-history | students.view | Status changes with reason and actor | StudentStatusHistory |
| STU-API-09 | GET | /students/:id/medical | students.view_medical | Decrypt medical notes; logged as sensitive read | Student, AuditLog |
| STU-API-10 | PUT | /students/:id/medical | students.update_medical | Replace encrypted medical notes | Student |
| STU-API-11 | POST | /students/:id/guardians | students.update | Link existing guardian (phone match) or create and link | Guardian, StudentGuardian |
| STU-API-12 | PATCH | /student-guardians/:id | students.update | Relation and flags: primary, fee payer, pickup, emergency, portal access | StudentGuardian |
| STU-API-13 | DELETE | /student-guardians/:id | students.update | Unlink guardian; the only primary cannot be removed (hard delete) | StudentGuardian |
| STU-API-14 | GET | /guardians | students.view | Search guardians by name, phone, email; sibling detection | Guardian |
| STU-API-15 | GET | /guardians/:id | students.view | Guardian with children and portal login status | Guardian, StudentGuardian, User |
| STU-API-16 | PATCH | /guardians/:id | students.update | Update contact, language, preferred channel, occupation, income | Guardian |
| STU-API-17 | GET | /families | students.view | List and search households | Family |
| STU-API-18 | POST | /families | students.update | Create household with students and guardians; familyCode issued | Family, Student, Guardian |
| STU-API-19 | GET | /families/:id | students.view | Household with siblings and guardians | Family, Student, Guardian |
| STU-API-20 | PATCH | /families/:id | students.update | Update name, primary guardian, notes, members | Family, Student, Guardian |
| STU-API-21 | GET | /students/:id/enrollments | students.view | Enrollment history across academic years | Enrollment |
| STU-API-22 | POST | /students/:id/enrollments | students.enroll | Enroll in a batch (new year or extra coaching batch); capacity check | Enrollment, Batch |
| STU-API-23 | POST | /enrollments/:id/end | students.enroll | End as WITHDRAWN, CANCELLED or COMPLETED with date and reason | Enrollment, Student |
| STU-API-24 | GET | /students/:id/documents | students.view | List student documents | StudentDocument |
| STU-API-25 | POST | /students/:id/documents | students.update | Attach an uploaded file as a document; parent visibility flag | StudentDocument, FileAsset |
| STU-API-26 | DELETE | /student-documents/:id | students.update | Soft delete document | StudentDocument |
| STU-API-27 | POST | /student-documents/:id/verify | students.manage | Mark document verified | StudentDocument |
| STU-API-28 | GET | /students/:id/notes | students.view | List notes; filters noteType, pinned | StudentNote |
| STU-API-29 | POST | /students/:id/notes | students.manage_notes | Add note; optionally shared with parent | StudentNote |
| STU-API-30 | PATCH | /student-notes/:id | students.manage_notes | Edit, pin or share a note | StudentNote |
| STU-API-31 | DELETE | /student-notes/:id | students.manage_notes | Soft delete note | StudentNote |
| STU-API-32 | GET | /student-transfers | students.view | List transfers; filters status, transferType, fromCampusId, toCampusId | StudentTransfer |
| STU-API-33 | POST | /student-transfers | students.transfer | Request batch change, course change or campus transfer with fee treatment | StudentTransfer |
| STU-API-34 | GET | /student-transfers/:id | students.view | Transfer detail | StudentTransfer |
| STU-API-35 | POST | /student-transfers/:id/approve | students.approve | Approve and execute: end old enrollment (TRANSFERRED), create new one | StudentTransfer, Enrollment, Student |
| STU-API-36 | POST | /student-transfers/:id/reject | students.approve | Status REJECTED with reason | StudentTransfer |
| STU-API-37 | POST | /student-transfers/:id/cancel | students.transfer | Requester cancels a PENDING transfer | StudentTransfer |
| STU-API-38 | POST | /students/bulk-update | students.update | Set house, category, quota or RFID card for selected students | Student |
| STU-API-39 | POST | /enrollments/bulk-promote | students.promote | Year end: mark PROMOTED, DETAINED or COMPLETED; create next-year enrollments | Enrollment, Student, AcademicYear, Batch |
| STU-API-40 | POST | /enrollments/assign-roll-numbers | students.enroll | Auto roll numbers for a batch (by name or admission order) | Enrollment, NumberSequence |
| STU-API-41 | POST | /students/import | students.import | Import students with guardians and enrollments from Excel; dry run | ImportJob |
| STU-API-42 | POST | /students/export | students.export | Export student list with chosen columns | ExportJob |
| STU-API-43 | POST | /students/id-cards | students.export | ID card PDF for a batch or selection | ExportJob, FileAsset |
| STU-API-44 | GET | /students/lookup | students.view | Typeahead by name, admission number or phone | Student |
| STU-API-45 | GET | /students/summary | students.view | Counts by status, gender, course, batch, category; admissions and withdrawals | Student, Enrollment, DailyMetricSnapshot |
| STU-API-46 | GET | /portal/parent/students | parentportal.access | Own children with batch and photo | StudentGuardian, Student, Family |
| STU-API-47 | GET | /portal/parent/students/:id | parentportal.access | Child profile (needs hasPortalAccess) | Student, Enrollment |
| STU-API-48 | GET | /portal/parent/students/:id/documents | parentportal.access | Child documents with visibleToParent | StudentDocument |
| STU-API-49 | GET | /portal/parent/profile | parentportal.access | Own guardian profile | Guardian |
| STU-API-50 | PATCH | /portal/parent/profile | parentportal.access | Update own contact details, language, preferred channel | Guardian |
| STU-API-51 | GET | /portal/student/profile | studentportal.access | Own student profile with current enrollment | Student, Enrollment |

Events emitted: student.admitted, student.updated, student.status_changed, student.withdrawn, student.deleted, student.guardian.linked, student.guardian.unlinked, student.enrolled, student.enrollment.ended, student.promoted, student.detained, student.document.uploaded, student.document.verified, student.note.shared, student.transfer.requested, student.transfer.approved, student.transfer.rejected, student.import.completed, student.birthday

## TCH — Teachers

Resource base path(s): `/teachers`, `/batch-subject-teachers`, `/teacher-documents`

| ID | Method | Path | Permission | Purpose | Main models |
|---|---|---|---|---|---|
| TCH-API-01 | GET | /teachers | teachers.view | List teachers; filters campusId, departmentId, subjectId, status, employmentType, q | Staff, TeacherSubject |
| TCH-API-02 | POST | /teachers | teachers.create | Create teaching staff; employeeCode issued; optional login invitation | Staff, NumberSequence, Invitation |
| TCH-API-03 | GET | /teachers/:id | teachers.view | Teacher profile with subjects, batches and login status | Staff, TeacherSubject, BatchSubjectTeacher |
| TCH-API-04 | PATCH | /teachers/:id | teachers.update | Update personal, contact, qualification, department, designation | Staff |
| TCH-API-05 | DELETE | /teachers/:id | teachers.delete | Soft delete; blocked while batch assignments are active | Staff |
| TCH-API-06 | POST | /teachers/:id/change-status | teachers.manage | Change StaffStatus with reason and date; exit deactivates the login | Staff, StaffStatusHistory, User |
| TCH-API-07 | GET | /teachers/:id/subjects | teachers.view | Subjects the teacher is qualified to teach | TeacherSubject, Subject |
| TCH-API-08 | PUT | /teachers/:id/subjects | teachers.update | Replace qualified subjects and the primary subject | TeacherSubject |
| TCH-API-09 | GET | /teachers/:id/batch-assignments | teachers.view | Batches and subjects taught; class-teacher batches | BatchSubjectTeacher, Batch |
| TCH-API-10 | POST | /teachers/:id/batch-assignments | teachers.assign | Assign batch and subject with dates and primary flag | BatchSubjectTeacher |
| TCH-API-11 | GET | /teachers/:id/documents | teachers.view | List teacher documents | StaffDocument |
| TCH-API-12 | POST | /teachers/:id/documents | teachers.update | Attach an uploaded file as a document | StaffDocument, FileAsset |
| TCH-API-13 | DELETE | /teacher-documents/:id | teachers.update | Soft delete document | StaffDocument |
| TCH-API-14 | GET | /teachers/:id/timetable | teachers.view | Weekly timetable with substitutions | TimetableEntry, PeriodSlot, Substitution |
| TCH-API-15 | POST | /teachers/import | teachers.import | Import teachers from Excel (type STAFF, staffType TEACHING) | ImportJob |
| TCH-API-16 | POST | /teachers/export | teachers.export | Export teacher list | ExportJob |
| TCH-API-17 | GET | /teachers/lookup | teachers.view | Dropdown search; filters subjectId, campusId | Staff, TeacherSubject |
| TCH-API-18 | GET | /teachers/summary | teachers.view | Counts by status, department, employment type; student-teacher ratio | Staff, Enrollment |
| TCH-API-19 | GET | /teachers/workload | teachers.view | Periods per week, batches, students and substitutions per teacher | TimetableEntry, BatchSubjectTeacher, ClassSession |

Events emitted: teacher.created, teacher.updated, teacher.status_changed, teacher.deleted, teacher.subjects.changed, teacher.batch.assigned, teacher.batch.unassigned, teacher.document.uploaded, teacher.import.completed

## STF — Staff

Resource base path(s): `/staff`, `/staff-documents`, `/departments`, `/designations`

| ID | Method | Path | Permission | Purpose | Main models |
|---|---|---|---|---|---|
| STF-API-01 | GET | /staff | staff.view | List all staff; filters campusId, staffType, departmentId, designationId, status, q | Staff |
| STF-API-02 | POST | /staff | staff.create | Create staff profile; employeeCode issued; optional login invitation | Staff, NumberSequence, Invitation |
| STF-API-03 | GET | /staff/:id | staff.view | Staff profile; bank and identity data masked | Staff, Department, Designation |
| STF-API-04 | PATCH | /staff/:id | staff.update | Update personal, contact, qualification, manager, custom fields | Staff, CustomFieldValue |
| STF-API-05 | DELETE | /staff/:id | staff.delete | Soft delete; blocked when payslips or active assignments exist | Staff |
| STF-API-06 | POST | /staff/:id/change-status | staff.manage | Set ACTIVE, ON_LEAVE or SUSPENDED with reason and date | Staff, StaffStatusHistory |
| STF-API-07 | POST | /staff/:id/change-position | staff.manage | Change designation, department or employment type; history row written | Staff, StaffStatusHistory |
| STF-API-08 | POST | /staff/:id/transfer | staff.manage | Campus transfer; updates home campus and campus access | Staff, StaffStatusHistory, UserCampus |
| STF-API-09 | POST | /staff/:id/exit | staff.manage | Record resignation, termination or retirement; login deactivated on exitDate | Staff, StaffStatusHistory, User |
| STF-API-10 | GET | /staff/:id/history | staff.view | Status, campus, department and designation changes | StaffStatusHistory |
| STF-API-11 | GET | /staff/:id/sensitive-details | staff.view_sensitive | Decrypt bank, tax and national id; logged as sensitive read | Staff, AuditLog |
| STF-API-12 | PUT | /staff/:id/sensitive-details | staff.update_sensitive | Replace encrypted bank, tax, national and statutory ids | Staff |
| STF-API-13 | GET | /staff/:id/documents | staff.view | List staff documents | StaffDocument |
| STF-API-14 | POST | /staff/:id/documents | staff.update | Attach an uploaded file as a document with expiry date | StaffDocument, FileAsset |
| STF-API-15 | DELETE | /staff-documents/:id | staff.update | Soft delete document | StaffDocument |
| STF-API-16 | POST | /staff-documents/:id/verify | staff.manage | Mark document verified | StaffDocument |
| STF-API-17 | GET | /staff-documents/expiring | staff.view | Documents expiring within N days | StaffDocument, Staff |
| STF-API-18 | GET | /departments | staff.view | List departments (also the dropdown source) | Department |
| STF-API-19 | POST | /departments | staff.manage | Create department, optional campus and head | Department |
| STF-API-20 | PATCH | /departments/:id | staff.manage | Update name, code, head, status | Department |
| STF-API-21 | DELETE | /departments/:id | staff.manage | Soft delete when no active staff | Department |
| STF-API-22 | GET | /designations | staff.view | List designations (also the dropdown source) | Designation |
| STF-API-23 | POST | /designations | staff.manage | Create designation | Designation |
| STF-API-24 | PATCH | /designations/:id | staff.manage | Update name, staff type, level, status | Designation |
| STF-API-25 | DELETE | /designations/:id | staff.manage | Soft delete when no active staff | Designation |
| STF-API-26 | POST | /staff/import | staff.import | Import staff from Excel (type STAFF); dry run | ImportJob |
| STF-API-27 | POST | /staff/export | staff.export | Export staff list; sensitive columns excluded | ExportJob |
| STF-API-28 | POST | /staff/id-cards | staff.export | ID card PDF for selected staff | ExportJob, FileAsset |
| STF-API-29 | GET | /staff/lookup | staff.view | Typeahead by name or employee code; filters staffType, campusId | Staff |
| STF-API-30 | GET | /staff/summary | staff.view | Headcount by department, type, status, campus; joiners and leavers | Staff, DailyMetricSnapshot |
| STF-API-31 | GET | /staff/org-chart | staff.view | Reporting tree from reportsToId | Staff |

Events emitted: staff.created, staff.updated, staff.status_changed, staff.position_changed, staff.transferred, staff.exit.recorded, staff.exited, staff.deleted, staff.document.uploaded, staff.document.verified, staff.document.expiring, staff.import.completed, staff.birthday, staff.work_anniversary

## Permission keys used in this file

| Permission | Meaning |
|---|---|
| public | No access token; rate-limited; captcha, signature or one-time token where noted |
| self | Any signed-in user, own account only |
| dashboard.view | See the role dashboard and save own layout |
| dashboard.view_finance | See fee and collection widgets |
| dashboard.manage | Force a metric snapshot recompute |
| users.view | View users, sessions, login history, invitations |
| users.create | Create user logins directly |
| users.update | Edit user details |
| users.delete | Soft delete users |
| users.manage | Suspend, activate, deactivate, reset password or MFA, revoke sessions, set campuses |
| users.invite | Send, resend, revoke and bulk-send invitations |
| users.export | Export the user list |
| roles.view | View roles and the permission catalogue |
| roles.create | Create or clone custom roles |
| roles.update | Edit custom roles and their permission grants |
| roles.delete | Delete custom roles |
| roles.assign | Assign roles to users |
| organizations.view | View tenant profile, plan usage and enabled features |
| organizations.update | Edit tenant profile and branding |
| organizations.manage | Onboarding wizard, custom domain, ownership transfer, account closure |
| billing.view | View subscription, invoices and add-ons |
| billing.manage | Buy or change plan, pay invoices, buy or cancel add-ons |
| platform.view | SUPER_ADMIN console: read tenants, subscriptions, invoices, plans, metrics, audit |
| platform.manage | SUPER_ADMIN console: manage tenants, plans, invoices, platform users |
| platform.impersonate | SUPER_ADMIN console: act inside a tenant with an audited token |
| campuses.view | View campuses, campus users and campus KPIs |
| campuses.create | Create a campus |
| campuses.update | Edit a campus |
| campuses.delete | Soft delete a campus |
| campuses.manage | Activate, deactivate, archive, set main, assign users, copy setup |
| campuses.export | Export the campus list |
| admissions.view | View leads, follow-ups, applications, funnel and seats |
| admissions.create | Add leads and applications; convert lead to application |
| admissions.update | Edit leads and applications, follow-ups, documents, stage and review steps |
| admissions.delete | Soft delete leads and draft applications |
| admissions.manage | Assign leads to counsellors |
| admissions.approve | Approve, waitlist or reject applications; waive application fee |
| admissions.enroll | Convert an approved application into a student |
| admissions.import | Import leads from Excel |
| admissions.export | Export leads and applications |
| students.view | View students, guardians, families, enrollments, documents, notes, transfers |
| students.create | Admit a student directly |
| students.update | Edit students, guardians, families and documents; bulk update |
| students.delete | Soft delete students |
| students.manage | Change student status; verify documents |
| students.view_medical | Read decrypted medical notes (schema comment names it students.medical.view) |
| students.update_medical | Write medical notes |
| students.manage_notes | Add, edit, share and delete student notes |
| students.enroll | Create, edit and end enrollments; assign roll numbers |
| students.promote | Run year-end bulk promotion |
| students.transfer | Request or cancel a batch, course or campus transfer |
| students.approve | Approve or reject student transfers |
| students.import | Import students from Excel |
| students.export | Export students; generate ID cards |
| teachers.view | View teachers, subjects, assignments, timetable, workload |
| teachers.create | Create a teacher |
| teachers.update | Edit teachers, qualified subjects and documents |
| teachers.delete | Soft delete teachers |
| teachers.manage | Change teacher status |
| teachers.assign | Assign teachers to batches and subjects |
| teachers.import | Import teachers from Excel |
| teachers.export | Export the teacher list |
| staff.view | View staff, history, documents, departments, designations, org chart |
| staff.create | Create a staff profile |
| staff.update | Edit staff and documents |
| staff.delete | Soft delete staff |
| staff.manage | Status, position, transfer, exit; verify documents; manage departments and designations |
| staff.view_sensitive | Read decrypted bank, tax and national ids |
| staff.update_sensitive | Write bank, tax, national and statutory ids |
| staff.import | Import staff from Excel |
| staff.export | Export staff; generate ID cards |
| parentportal.access | Parent Portal access; ownership through StudentGuardian and Family checked in code |
| studentportal.access | Student Portal access; own record only, checked in code |
