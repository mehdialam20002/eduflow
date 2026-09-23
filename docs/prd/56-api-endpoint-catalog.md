# API Endpoint Catalog

**In simple words:** This chapter lists every REST endpoint of EduFlow in one place: its ID, method, path, the permission it needs and what it does. Module chapters explain requests and responses in detail; this catalog is the quick index.

All paths are relative to `/api/v1`. The catalog has **1250 endpoints** across 37 groups. Rules for headers, the response envelope, errors, pagination and rate limits are in the *API Standards and Conventions* chapter.

## Endpoint Count by Module

| Code | Module or group | Endpoints |
|---|---|---|
| AUTH | Authentication and Sessions | 26 |
| USR | Users and Roles | 31 |
| DASH | Dashboard | 16 |
| ORG | Organizations | 56 |
| CAMP | Multi Campus | 16 |
| ADM | Student Admission | 43 |
| STU | Student Profile | 51 |
| TCH | Teachers | 19 |
| STF | Staff | 31 |
| ATT | Attendance | 27 |
| LEV | Leave | 26 |
| BAT | Batch | 60 |
| TT | Timetable | 29 |
| SUB | Subjects | 22 |
| HW | Homework | 27 |
| EXM | Exams | 45 |
| RPT | Report Cards | 25 |
| FEE | Fees | 46 |
| PAY | Payments | 46 |
| DSC | Discounts | 16 |
| SCH | Scholarships | 28 |
| PP | Parent Portal | 32 |
| SP | Student Portal | 22 |
| NTF | Notifications | 31 |
| WA | WhatsApp | 26 |
| EML | Email | 16 |
| SMS | SMS | 21 |
| LIB | Library | 37 |
| INV | Inventory | 46 |
| TRN | Transport | 50 |
| HST | Hostel | 47 |
| PRL | Payroll | 62 |
| CRT | Certificates | 31 |
| ANL | Analytics | 32 |
| AI | AI Insights | 20 |
| SET | Settings | 55 |
| CMN | Common cross-cutting endpoints | 36 |
| | **Total** | **1250** |

## AUTH: Authentication and Sessions

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

## USR: Users and Roles

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

## DASH: Dashboard

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

## ORG: Organizations

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

## CAMP: Multi Campus

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

## ADM: Student Admission

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

## STU: Student Profile

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

## TCH: Teachers

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

## STF: Staff

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

## ATT: Attendance

Resource base path(s): `/attendance-sessions`, `/attendance-records`, `/attendance-reports`, `/staff-attendance`, `/portal/parent/attendance`, `/portal/student/attendance`

| ID | Method | Path | Permission | Purpose | Main models |
|---|---|---|---|---|---|
| ATT-API-01 | GET | /attendance-sessions | attendance.view | List sessions (batch, date range, period, locked) | AttendanceSession |
| ATT-API-02 | POST | /attendance-sessions | attendance.mark | Create day / period / lecture session with all student records; idempotent on batch + date + slotKey | AttendanceSession, AttendanceRecord |
| ATT-API-03 | GET | /attendance-sessions/:id | attendance.view | Session with records and counters | AttendanceSession, AttendanceRecord |
| ATT-API-04 | PUT | /attendance-sessions/:id/records | attendance.mark | Save statuses of an unlocked session; recount totals | AttendanceRecord, AttendanceSession |
| ATT-API-05 | POST | /attendance-sessions/:id/lock | attendance.manage | Lock session (isLocked, lockedAt) | AttendanceSession |
| ATT-API-06 | POST | /attendance-sessions/:id/unlock | attendance.unlock | Reopen a locked session for correction | AttendanceSession |
| ATT-API-07 | POST | /attendance-sessions/:id/notify-absentees | attendance.mark | Queue absent / late alerts to parents (parentsNotifiedAt, notifiedAt) | AttendanceSession, AttendanceRecord |
| ATT-API-08 | GET | /attendance-sessions/roster | attendance.mark | Mark sheet for batch + date: active enrollments, approved leave, holiday flag, existing marks | Enrollment, StudentLeaveRequest, Holiday |
| ATT-API-09 | POST | /attendance-sessions/bulk-lock | attendance.manage | Lock all sessions up to a date (month close) | AttendanceSession |
| ATT-API-10 | GET | /attendance-records | attendance.view | List records (student, batch, date range, status, source) | AttendanceRecord |
| ATT-API-11 | PATCH | /attendance-records/:id | attendance.update | Correct one record (status, lateMinutes, halfDaySession, remark) | AttendanceRecord |
| ATT-API-12 | POST | /attendance-records/device-punches | attendance.mark | Ingest RFID / biometric / QR / face punches (API key); writes student or staff rows | AttendanceRecord, StaffAttendance |
| ATT-API-13 | POST | /attendance-records/import | attendance.import | Excel import of student attendance (ImportType ATTENDANCE) | ImportJob, AttendanceRecord |
| ATT-API-14 | POST | /attendance-records/export | attendance.export | Export records or monthly register (XLSX / PDF) | ExportJob |
| ATT-API-15 | GET | /attendance-reports/daily-summary | attendance.view | Dashboard: present / absent / late / leave per campus and batch, unmarked batches | AttendanceSession, Batch |
| ATT-API-16 | GET | /attendance-reports/monthly-register | attendance.view | Batch x month grid with totals and percent | AttendanceRecord, Holiday |
| ATT-API-17 | GET | /attendance-reports/student-summary | attendance.view | Per-student working days, present, absent, late, percent | AttendanceRecord |
| ATT-API-18 | GET | /attendance-reports/defaulters | attendance.view | Students below a percent threshold or with N consecutive absences | AttendanceRecord, Enrollment |
| ATT-API-19 | GET | /staff-attendance | attendance.view_staff | List staff attendance (campus, date range, staff, status) | StaffAttendance |
| ATT-API-20 | PATCH | /staff-attendance/:id | attendance.mark_staff | Correct one row (status, times, remark) | StaffAttendance |
| ATT-API-21 | POST | /staff-attendance/bulk-mark | attendance.mark_staff | Upsert the day register for many staff | StaffAttendance |
| ATT-API-22 | POST | /staff-attendance/check-in | self | Self check-in (GEO / QR) with lat, lng, deviceRef | StaffAttendance |
| ATT-API-23 | POST | /staff-attendance/check-out | self | Self check-out; computes workedMinutes | StaffAttendance |
| ATT-API-24 | POST | /staff-attendance/import | attendance.import | Excel import of biometric / manual staff register (ImportType ATTENDANCE) | ImportJob, StaffAttendance |
| ATT-API-25 | POST | /staff-attendance/export | attendance.export | Export staff register (XLSX / PDF) | ExportJob |
| ATT-API-26 | GET | /staff-attendance/monthly-register | attendance.view_staff | Staff x month grid with payable-day totals (feeds Payroll) | StaffAttendance, LeaveRequest |
| ATT-API-27 | GET | /portal/parent/attendance | parentportal.access | Child's month calendar and summary | AttendanceRecord |

Events emitted: attendance.marked, attendance.updated, attendance.session.locked, attendance.session.unlocked, student.absent, student.late, student.attendance.low, staff.checked_in, staff.checked_out, staff.absent, attendance.import.completed

## LEV: Leave

Resource base path(s): `/leave-types`, `/leave-policies`, `/leave-balances`, `/leave-requests`, `/student-leave-requests`, `/portal/parent/leave-requests`

| ID | Method | Path | Permission | Purpose | Main models |
|---|---|---|---|---|---|
| LEV-API-01 | GET | /leave-types | leave.view | List leave types (also dropdown) | LeaveType |
| LEV-API-02 | POST | /leave-types | leave.manage | Create leave type (code, isPaid, allowHalfDay, isCompOff) | LeaveType |
| LEV-API-03 | PATCH | /leave-types/:id | leave.manage | Update leave type or status | LeaveType |
| LEV-API-04 | DELETE | /leave-types/:id | leave.manage | Archive (soft delete); blocked with pending requests | LeaveType |
| LEV-API-05 | GET | /leave-policies | leave.view | List policies (leave type, staff type, status) | LeavePolicy |
| LEV-API-06 | POST | /leave-policies | leave.manage | Create entitlement rule (quota, accrual, carry-forward, approvalLevels) | LeavePolicy |
| LEV-API-07 | PATCH | /leave-policies/:id | leave.manage | Update policy or end it (effectiveTo) | LeavePolicy |
| LEV-API-08 | DELETE | /leave-policies/:id | leave.manage | Archive policy (soft delete) | LeavePolicy |
| LEV-API-09 | GET | /leave-balances | leave.view | Balances by staff, leave type, academic year with computed available days | LeaveBalance |
| LEV-API-10 | POST | /leave-balances/:id/adjust | leave.manage | Manual + / - adjustment with reason (audited) | LeaveBalance, AuditLog |
| LEV-API-11 | POST | /leave-balances/allocate | leave.manage | Create or accrue balances for a year from active policies (bulk, idempotent) | LeaveBalance, LeavePolicy |
| LEV-API-12 | POST | /leave-balances/carry-forward | leave.manage | Year end: carry forward, lapse and open next-year balances | LeaveBalance, AcademicYear |
| LEV-API-13 | GET | /leave-requests | leave.view | List requests (status, staff, type, campus, date range); feeds the leave calendar | LeaveRequest |
| LEV-API-14 | POST | /leave-requests | leave.create | Apply for leave (self or on behalf); checks policy, balance, notice; builds approval chain | LeaveRequest, LeaveApprovalStep, LeaveBalance |
| LEV-API-15 | GET | /leave-requests/:id | leave.view | Request with approval steps and attachment | LeaveRequest, LeaveApprovalStep |
| LEV-API-16 | POST | /leave-requests/:id/approve | leave.approve | Approve current level; final level sets APPROVED, moves pending to used, writes ON_LEAVE rows | LeaveRequest, LeaveApprovalStep, LeaveBalance, StaffAttendance |
| LEV-API-17 | POST | /leave-requests/:id/reject | leave.approve | Reject with remarks; release pending days | LeaveRequest, LeaveApprovalStep, LeaveBalance |
| LEV-API-18 | POST | /leave-requests/:id/cancel | leave.create | Cancel pending or future approved leave; restore balance | LeaveRequest, LeaveBalance, StaffAttendance |
| LEV-API-19 | GET | /leave-requests/pending-approvals | leave.approve | Approval inbox of the logged-in approver | LeaveApprovalStep, LeaveRequest |
| LEV-API-20 | GET | /leave-requests/summary | leave.view | Dashboard: pending count, on leave today, days by leave type | LeaveRequest, LeaveBalance |
| LEV-API-21 | POST | /leave-requests/export | leave.export | Export leave register or balances (XLSX) | ExportJob |
| LEV-API-22 | GET | /student-leave-requests | leave.view_student | List student leave (batch, status, date range) | StudentLeaveRequest |
| LEV-API-23 | POST | /student-leave-requests | leave.create_student | Staff records a request on behalf of a parent | StudentLeaveRequest |
| LEV-API-24 | GET | /student-leave-requests/:id | leave.view_student | Request detail with attachment and pickup guardian | StudentLeaveRequest, Guardian |
| LEV-API-25 | POST | /student-leave-requests/:id/approve | leave.approve_student | Approve; marks covered dates as LEAVE (leaveRequestId) | StudentLeaveRequest, AttendanceRecord |
| LEV-API-26 | POST | /student-leave-requests/:id/reject | leave.approve_student | Reject with reviewRemarks | StudentLeaveRequest |

Events emitted: leave.request.submitted, leave.approval.pending, leave.request.approved, leave.request.rejected, leave.request.cancelled, leave.balance.allocated, leave.balance.adjusted, student.leave.requested, student.leave.approved, student.leave.rejected, student.leave.cancelled

## BAT: Batch

Resource base path(s): `/academic-years`, `/terms`, `/courses`, `/batches`, `/enrollments`, `/rooms`, `/holidays`, `/calendar-events`, `/ptm-bookings`, `/portal/parent/calendar-events`, `/portal/parent/ptm-bookings`, `/portal/student/calendar-events`

| ID | Method | Path | Permission | Purpose | Main models |
|---|---|---|---|---|---|
| BAT-API-01 | GET | /academic-years | batches.view | List years (also dropdown; flags the current one) | AcademicYear |
| BAT-API-02 | POST | /academic-years | batches.manage | Create year (PLANNED) | AcademicYear |
| BAT-API-03 | PATCH | /academic-years/:id | batches.manage | Update name or dates | AcademicYear |
| BAT-API-04 | DELETE | /academic-years/:id | batches.manage | Soft delete a PLANNED year without batches | AcademicYear |
| BAT-API-05 | POST | /academic-years/:id/set-current | batches.manage | Make the year ACTIVE and current; unset the previous one | AcademicYear |
| BAT-API-06 | POST | /academic-years/:id/close | batches.manage | Set CLOSED: locks attendance, marks and enrollments | AcademicYear |
| BAT-API-07 | GET | /terms | batches.view | List terms of a year (also dropdown) | Term |
| BAT-API-08 | POST | /terms | batches.manage | Create term | Term |
| BAT-API-09 | PATCH | /terms/:id | batches.manage | Update term, order or status | Term |
| BAT-API-10 | DELETE | /terms/:id | batches.manage | Soft delete; blocked when exams or report cards use it | Term |
| BAT-API-11 | GET | /courses | batches.view | List courses (campus, stream, board, status; also dropdown) | Course |
| BAT-API-12 | POST | /courses | batches.manage | Create course (class / program) | Course |
| BAT-API-13 | GET | /courses/:id | batches.view | Course with subjects and batch counts | Course, CourseSubject, Batch |
| BAT-API-14 | PATCH | /courses/:id | batches.manage | Update course, level or status | Course |
| BAT-API-15 | DELETE | /courses/:id | batches.manage | Archive (soft delete); blocked with active batches | Course |
| BAT-API-16 | GET | /batches | batches.view | List batches (campus, year, course, status, class teacher, q) with strength | Batch, Enrollment |
| BAT-API-17 | POST | /batches | batches.create | Create batch (capacity, shift, days, class teacher, room) | Batch |
| BAT-API-18 | GET | /batches/:id | batches.view | Batch detail: strength vs capacity, class teacher, room, subject teachers | Batch, BatchSubjectTeacher |
| BAT-API-19 | PATCH | /batches/:id | batches.update | Update batch | Batch |
| BAT-API-20 | DELETE | /batches/:id | batches.delete | Soft delete; blocked with active enrollments | Batch |
| BAT-API-21 | POST | /batches/:id/change-status | batches.update | Move between PLANNED, ACTIVE, COMPLETED, CANCELLED | Batch |
| BAT-API-22 | POST | /batches/:id/assign-roll-numbers | batches.enroll | Generate roll numbers by name or admission-number order | Enrollment |
| BAT-API-23 | GET | /batches/:id/students | batches.view | Active roster with roll numbers and electives | Enrollment, Student |
| BAT-API-24 | GET | /batches/lookup | batches.view | Light dropdown list; TEACHER gets own batches | Batch |
| BAT-API-25 | POST | /batches/copy-from-year | batches.create | Clone batches of a previous year into a target year (no students) | Batch, AcademicYear |
| BAT-API-26 | POST | /batches/export | batches.export | Export batch list or batch rosters (XLSX / PDF) | ExportJob |
| BAT-API-27 | GET | /batches/summary | batches.view | Dashboard: batches by status, strength vs capacity, batches without class teacher | Batch, Enrollment |
| BAT-API-28 | GET | /enrollments | batches.view | List enrollments (student, batch, course, year, status) | Enrollment |
| BAT-API-29 | POST | /enrollments | batches.enroll | Enroll a student in a batch (capacity, primary flag, electives) | Enrollment, Batch |
| BAT-API-30 | PATCH | /enrollments/:id | batches.enroll | Update rollNo, electiveSubjectIds, isPrimary | Enrollment |
| BAT-API-31 | POST | /enrollments/:id/withdraw | batches.enroll | End enrollment as WITHDRAWN or CANCELLED with endDate, endReason | Enrollment |
| BAT-API-32 | POST | /enrollments/bulk | batches.enroll | Enroll many students into one batch | Enrollment |
| BAT-API-33 | POST | /enrollments/import | batches.import | Excel import (ImportType ENROLLMENTS) | ImportJob, Enrollment |
| BAT-API-34 | GET | /enrollments/promotion-preview | batches.promote | Students of a source batch with suggested outcome (annual ReportCard.result) and target batch | Enrollment, ReportCard, Course |
| BAT-API-35 | POST | /enrollments/promote | batches.promote | Bulk year end: mark PROMOTED / DETAINED / COMPLETED and create next-year enrollments (previousEnrollmentId) | Enrollment, Student |
| BAT-API-36 | GET | /rooms | batches.view | List rooms (campus, type, status; also dropdown) | Room |
| BAT-API-37 | POST | /rooms | batches.manage | Create room | Room |
| BAT-API-38 | PATCH | /rooms/:id | batches.manage | Update room or status | Room |
| BAT-API-39 | DELETE | /rooms/:id | batches.manage | Soft delete room | Room |
| BAT-API-40 | GET | /holidays | batches.view | List holidays (campus, year, type, date range) | Holiday |
| BAT-API-41 | POST | /holidays | batches.manage | Create holiday or vacation range | Holiday |
| BAT-API-42 | PATCH | /holidays/:id | batches.manage | Update holiday | Holiday |
| BAT-API-43 | DELETE | /holidays/:id | batches.manage | Soft delete holiday | Holiday |
| BAT-API-44 | POST | /holidays/bulk | batches.manage | Create many at once (weekly offs, preset public-holiday list) | Holiday |
| BAT-API-45 | GET | /calendar-events | batches.view | List events (campus, type, audience, date range, published) | CalendarEvent |
| BAT-API-46 | POST | /calendar-events | batches.manage | Create event (draft or published) | CalendarEvent |
| BAT-API-47 | PATCH | /calendar-events/:id | batches.manage | Update or publish event (isPublished) | CalendarEvent |
| BAT-API-48 | DELETE | /calendar-events/:id | batches.manage | Soft delete event | CalendarEvent |
| BAT-API-49 | GET | /calendar-events/feed | batches.view | Merged calendar for a date range: events, holidays, exam dates | CalendarEvent, Holiday, Exam |
| BAT-API-50 | GET | /ptm-bookings | batches.view | List PTM bookings (event, teacher, student, status) | PtmBooking |
| BAT-API-51 | POST | /ptm-bookings | batches.manage_ptm | Staff books a slot for a parent | PtmBooking, CalendarEvent |
| BAT-API-52 | PATCH | /ptm-bookings/:id | batches.manage_ptm | Mark ATTENDED / NO_SHOW, write teacherNotes | PtmBooking |
| BAT-API-53 | POST | /ptm-bookings/:id/cancel | batches.manage_ptm | Cancel booking and free the slot | PtmBooking |
| BAT-API-54 | GET | /portal/parent/calendar-events | parentportal.access | Published events and holidays for the child's batches | CalendarEvent, Holiday |
| BAT-API-55 | GET | /portal/parent/ptm-bookings | parentportal.access | Own PTM bookings | PtmBooking |
| BAT-API-56 | GET | /portal/parent/ptm-bookings/available-slots | parentportal.access | Free slots per teacher for a PTM event | PtmBooking, CalendarEvent, BatchSubjectTeacher |
| BAT-API-57 | POST | /portal/parent/ptm-bookings | parentportal.access | Book a slot | PtmBooking |
| BAT-API-58 | POST | /portal/parent/ptm-bookings/:id/cancel | parentportal.access | Cancel own booking | PtmBooking |
| BAT-API-59 | POST | /portal/parent/ptm-bookings/:id/feedback | parentportal.access | Save parentFeedback after the meeting | PtmBooking |
| BAT-API-60 | GET | /portal/student/calendar-events | studentportal.access | Published events and holidays for own batches | CalendarEvent, Holiday |

Events emitted: academic_year.activated, academic_year.closed, batch.created, batch.status_changed, enrollment.created, enrollment.withdrawn, enrollment.promoted, enrollment.detained, holiday.declared, calendar.event.published, calendar.event.updated, ptm.booking.created, ptm.booking.cancelled

## TT: Timetable

Resource base path(s): `/period-slots`, `/timetable-entries`, `/substitutions`, `/class-sessions`, `/portal/parent/timetable-entries`, `/portal/student/timetable-entries`

| ID | Method | Path | Permission | Purpose | Main models |
|---|---|---|---|---|---|
| TT-API-01 | GET | /period-slots | timetable.view | Bell schedule of a campus and shift (also dropdown) | PeriodSlot |
| TT-API-02 | POST | /period-slots | timetable.manage | Create period, break, lunch or assembly slot | PeriodSlot |
| TT-API-03 | PATCH | /period-slots/:id | timetable.manage | Update times, order or status | PeriodSlot |
| TT-API-04 | DELETE | /period-slots/:id | timetable.manage | Soft delete; blocked when timetable entries use it | PeriodSlot |
| TT-API-05 | GET | /timetable-entries | timetable.view | Weekly grid by batchId, staffId or roomId | TimetableEntry, PeriodSlot |
| TT-API-06 | POST | /timetable-entries | timetable.create | Add one cell; CONFLICT on batch, teacher or room clash | TimetableEntry |
| TT-API-07 | PATCH | /timetable-entries/:id | timetable.update | Change subject, teacher, room, group or combined class | TimetableEntry |
| TT-API-08 | DELETE | /timetable-entries/:id | timetable.delete | Remove one cell (hard delete) | TimetableEntry |
| TT-API-09 | POST | /timetable-entries/bulk-replace | timetable.update | Replace a batch's weekly grid in one transaction; `dryRun` returns clashes only | TimetableEntry |
| TT-API-10 | POST | /timetable-entries/copy | timetable.create | Copy a grid from another batch or academic year | TimetableEntry |
| TT-API-11 | POST | /timetable-entries/export | timetable.export | Batch, teacher or room timetable (PDF / XLSX) | ExportJob |
| TT-API-12 | GET | /timetable-entries/availability | timetable.view | Free teachers and rooms for a weekDay + periodSlot or a date | TimetableEntry, Substitution, TeacherSubject, Room |
| TT-API-13 | GET | /timetable-entries/day-view | timetable.view | Resolved schedule of a date: entries, substitutions, class-session changes, holiday | TimetableEntry, Substitution, ClassSession, Holiday |
| TT-API-14 | GET | /timetable-entries/workload | timetable.view | Periods per teacher per week; coverage vs CourseSubject.weeklyPeriods | TimetableEntry, CourseSubject |
| TT-API-15 | GET | /substitutions | timetable.view | List substitutions (campus, date, teacher, status) | Substitution |
| TT-API-16 | POST | /substitutions | timetable.substitute | Assign substitute or free period for an entry + date; clash checked | Substitution, TimetableEntry |
| TT-API-17 | PATCH | /substitutions/:id | timetable.substitute | Change substitute, room or reason | Substitution |
| TT-API-18 | POST | /substitutions/:id/cancel | timetable.substitute | Cancel substitution | Substitution |
| TT-API-19 | GET | /substitutions/uncovered | timetable.substitute | Periods of a date whose teacher is on leave or absent and not yet covered | TimetableEntry, LeaveRequest, StaffAttendance |
| TT-API-20 | GET | /class-sessions | timetable.view | List dated lectures (batch, teacher, date range, type, status) | ClassSession |
| TT-API-21 | POST | /class-sessions | timetable.create | Create ad hoc lecture (EXTRA, DOUBT_CLEARING, REVISION, TEST_DISCUSSION, ONLINE) | ClassSession |
| TT-API-22 | GET | /class-sessions/:id | timetable.view | Lecture detail with linked attendance session | ClassSession, AttendanceSession |
| TT-API-23 | PATCH | /class-sessions/:id | timetable.update | Update teacher, room, time, topic, meetingUrl | ClassSession |
| TT-API-24 | POST | /class-sessions/:id/cancel | timetable.update | Cancel with reason; alert students and parents | ClassSession |
| TT-API-25 | POST | /class-sessions/:id/reschedule | timetable.update | Mark RESCHEDULED and create the replacement (rescheduledFromId) | ClassSession |
| TT-API-26 | POST | /class-sessions/:id/complete | timetable.update | Mark COMPLETED with topic covered | ClassSession |
| TT-API-27 | POST | /class-sessions/generate | timetable.manage | Generate REGULAR sessions from the weekly grid for a date range, skipping holidays | ClassSession, TimetableEntry, Holiday |
| TT-API-28 | GET | /portal/parent/timetable-entries | parentportal.access | Child's weekly grid plus dated changes and upcoming lectures | TimetableEntry, Substitution, ClassSession |
| TT-API-29 | GET | /portal/student/timetable-entries | studentportal.access | Own weekly grid plus dated changes and upcoming lectures | TimetableEntry, Substitution, ClassSession |

Events emitted: timetable.updated, substitution.assigned, substitution.cancelled, class.session.scheduled, class.session.cancelled, class.session.rescheduled, class.session.completed

## SUB: Subjects

Resource base path(s): `/subjects`, `/course-subjects`, `/batch-subject-teachers`, `/portal/parent/subjects`, `/portal/student/subjects`

| ID | Method | Path | Permission | Purpose | Main models |
|---|---|---|---|---|---|
| SUB-API-01 | GET | /subjects | subjects.view | List subjects (type, status, q) | Subject |
| SUB-API-02 | POST | /subjects | subjects.create | Create subject (code, subjectType, color) | Subject |
| SUB-API-03 | GET | /subjects/:id | subjects.view | Subject with courses and teachers using it | Subject, CourseSubject, TeacherSubject |
| SUB-API-04 | PATCH | /subjects/:id | subjects.update | Update subject or status | Subject |
| SUB-API-05 | DELETE | /subjects/:id | subjects.delete | Archive (soft delete); blocked when used in timetable or exams | Subject |
| SUB-API-06 | POST | /subjects/bulk | subjects.create | Create many subjects at once (onboarding preset list) | Subject |
| SUB-API-07 | GET | /subjects/lookup | subjects.view | Light dropdown list filtered by courseId or batchId; TEACHER gets own subjects | Subject, CourseSubject, BatchSubjectTeacher |
| SUB-API-08 | POST | /subjects/export | subjects.export | Export curriculum and teacher-allocation matrix (XLSX) | ExportJob |
| SUB-API-09 | GET | /subjects/summary | subjects.view | Dashboard: subjects by type, batch subjects without a teacher | Subject, CourseSubject, BatchSubjectTeacher |
| SUB-API-10 | GET | /course-subjects | subjects.view | Curriculum of a course in sortOrder | CourseSubject |
| SUB-API-11 | POST | /course-subjects | subjects.manage | Add subject to a course (elective group, default marks, weeklyPeriods) | CourseSubject |
| SUB-API-12 | PATCH | /course-subjects/:id | subjects.manage | Update elective rules, marks defaults, includeInTotal | CourseSubject |
| SUB-API-13 | DELETE | /course-subjects/:id | subjects.manage | Remove subject from a course; blocked when exam papers exist | CourseSubject |
| SUB-API-14 | POST | /course-subjects/reorder | subjects.manage | Save sortOrder of a course's subjects (report-card order) | CourseSubject |
| SUB-API-15 | POST | /course-subjects/copy | subjects.manage | Copy curriculum from another course | CourseSubject |
| SUB-API-16 | GET | /batch-subject-teachers | subjects.view | Teacher allocation by batchId or staffId | BatchSubjectTeacher |
| SUB-API-17 | POST | /batch-subject-teachers | subjects.assign_teachers | Assign a teacher to a subject in a batch | BatchSubjectTeacher, TeacherSubject |
| SUB-API-18 | PATCH | /batch-subject-teachers/:id | subjects.assign_teachers | Update isPrimary or effective dates | BatchSubjectTeacher |
| SUB-API-19 | DELETE | /batch-subject-teachers/:id | subjects.assign_teachers | Remove assignment | BatchSubjectTeacher |
| SUB-API-20 | POST | /batch-subject-teachers/bulk-replace | subjects.assign_teachers | Replace all subject-teacher rows of one batch | BatchSubjectTeacher |
| SUB-API-21 | GET | /portal/parent/subjects | parentportal.access | Child's subjects with teachers and chosen electives | CourseSubject, BatchSubjectTeacher, Enrollment |
| SUB-API-22 | GET | /portal/student/subjects | studentportal.access | Own subjects with teachers and chosen electives | CourseSubject, BatchSubjectTeacher, Enrollment |

Events emitted: subject.created, subject.archived, curriculum.updated, subject.teacher.assigned, subject.teacher.unassigned

## HW: Homework

Resource base path(s): `/homework`, `/homework-attachments`, `/homework-submissions`, `/study-materials`, `/portal/parent/homework`, `/portal/parent/study-materials`, `/portal/student/homework`, `/portal/student/study-materials`

| ID | Method | Path | Permission | Purpose | Main models |
|---|---|---|---|---|---|
| HW-API-01 | GET | /homework | homework.view | List homework (batch, subject, teacher, status, due range) with submission counters | Homework |
| HW-API-02 | POST | /homework | homework.create | Create DRAFT or publish now; `batchIds` creates one row per batch; attachments inline | Homework, HomeworkAttachment |
| HW-API-03 | GET | /homework/:id | homework.view | Homework with attachments and counters | Homework, HomeworkAttachment |
| HW-API-04 | PATCH | /homework/:id | homework.update | Update text, due date, mode, marks | Homework |
| HW-API-05 | DELETE | /homework/:id | homework.delete | Soft delete; submissions are kept | Homework |
| HW-API-06 | POST | /homework/:id/publish | homework.update | DRAFT to PUBLISHED; create PENDING submissions; notify students and parents | Homework, HomeworkSubmission |
| HW-API-07 | POST | /homework/:id/close | homework.update | Set CLOSED; PENDING submissions become MISSING | Homework, HomeworkSubmission |
| HW-API-08 | POST | /homework/:id/cancel | homework.update | Set CANCELLED and notify | Homework |
| HW-API-09 | POST | /homework/:id/remind | homework.update | Remind students with PENDING or RESUBMIT_REQUESTED work | Homework, HomeworkSubmission |
| HW-API-10 | POST | /homework/:id/attachments | homework.update | Add a file or link | HomeworkAttachment, FileAsset |
| HW-API-11 | DELETE | /homework-attachments/:id | homework.update | Remove an attachment | HomeworkAttachment |
| HW-API-12 | GET | /homework/:id/submissions | homework.view | Per-student submission status list | HomeworkSubmission, Student |
| HW-API-13 | POST | /homework/:id/mark-submissions | homework.grade | Bulk set status, marks, grade for many students (offline work) | HomeworkSubmission |
| HW-API-14 | GET | /homework-submissions/:id | homework.view | Submission with files and feedback | HomeworkSubmission, HomeworkSubmissionFile |
| HW-API-15 | POST | /homework-submissions/:id/grade | homework.grade | Save marks, grade, feedback; set GRADED | HomeworkSubmission |
| HW-API-16 | POST | /homework-submissions/:id/request-resubmit | homework.grade | Set RESUBMIT_REQUESTED with feedback | HomeworkSubmission |
| HW-API-17 | POST | /homework/export | homework.export | Export homework and submission report (XLSX) | ExportJob |
| HW-API-18 | GET | /homework/summary | homework.view | Dashboard: due today, to grade, submission rate by batch and subject | Homework, HomeworkSubmission |
| HW-API-19 | GET | /study-materials | homework.view | List materials (course, batch, subject, type, published) | StudyMaterial |
| HW-API-20 | POST | /study-materials | homework.create | Share a file or link with batches | StudyMaterial, FileAsset |
| HW-API-21 | PATCH | /study-materials/:id | homework.update | Update, publish / unpublish, parent visibility | StudyMaterial |
| HW-API-22 | DELETE | /study-materials/:id | homework.delete | Soft delete material | StudyMaterial |
| HW-API-23 | GET | /portal/parent/homework | parentportal.access | Child's homework with own submission status | Homework, HomeworkSubmission |
| HW-API-24 | GET | /portal/parent/homework/:id | parentportal.access | Homework detail, attachments, feedback | Homework, HomeworkAttachment, HomeworkSubmission |
| HW-API-25 | POST | /portal/parent/homework/:id/submit | parentportal.access | Submit or resubmit for the child (answerText, files); SUBMITTED or LATE | HomeworkSubmission, HomeworkSubmissionFile |
| HW-API-26 | GET | /portal/parent/study-materials | parentportal.access | Published materials with visibleToParents | StudyMaterial |
| HW-API-27 | POST | /portal/student/homework/:id/submit | studentportal.access | Submit or resubmit own work; SUBMITTED or LATE | HomeworkSubmission, HomeworkSubmissionFile |

Events emitted: homework.published, homework.updated, homework.cancelled, homework.closed, homework.reminder.sent, homework.submitted, homework.graded, homework.resubmit_requested, study_material.published

## EXM: Exams

Resource base path(s): `/grade-scales`, `/exams`, `/exam-schedules`, `/exam-marks`, `/exam-re-evaluation-requests`, `/portal/parent/exams`, `/portal/parent/exam-results`, `/portal/parent/exam-re-evaluation-requests`, `/portal/student/exams`, `/portal/student/exam-results`

| ID | Method | Path | Permission | Purpose | Main models |
|---|---|---|---|---|---|
| EXM-API-01 | GET | /grade-scales | exams.view | List grade scales with bands (also dropdown) | GradeScale, GradeBand |
| EXM-API-02 | POST | /grade-scales | exams.manage | Create scale with bands | GradeScale, GradeBand |
| EXM-API-03 | PATCH | /grade-scales/:id | exams.manage | Update scale and replace bands | GradeScale, GradeBand |
| EXM-API-04 | DELETE | /grade-scales/:id | exams.manage | Soft delete; blocked when exams use it | GradeScale |
| EXM-API-05 | POST | /grade-scales/:id/set-default | exams.manage | Make this the organization default scale | GradeScale |
| EXM-API-06 | GET | /exams | exams.view | List exams (campus, year, term, type, status) | Exam |
| EXM-API-07 | POST | /exams | exams.create | Create exam (DRAFT); `parentExamId` for SUPPLEMENTARY / RETEST | Exam |
| EXM-API-08 | GET | /exams/:id | exams.view | Exam with papers and marks-entry progress | Exam, ExamSchedule |
| EXM-API-09 | PATCH | /exams/:id | exams.update | Update exam details | Exam |
| EXM-API-10 | DELETE | /exams/:id | exams.delete | Soft delete an exam without marks | Exam |
| EXM-API-11 | POST | /exams/:id/publish-schedule | exams.update | DRAFT to SCHEDULED; send date sheet to students and parents | Exam, ExamSchedule |
| EXM-API-12 | POST | /exams/:id/open-marks-entry | exams.update | Set MARKS_ENTRY; notify subject teachers | Exam |
| EXM-API-13 | POST | /exams/:id/publish | exams.publish | Needs all papers VERIFIED; compute grades and ranks, set papers LOCKED, exam PUBLISHED | Exam, ExamSchedule, ExamMark |
| EXM-API-14 | POST | /exams/:id/unpublish | exams.publish | Back to MARKS_ENTRY for corrections; papers back to VERIFIED | Exam, ExamSchedule |
| EXM-API-15 | POST | /exams/:id/cancel | exams.update | Set CANCELLED and notify | Exam |
| EXM-API-16 | POST | /exams/:id/admit-cards | exams.export | Generate admit cards (PDF) for a batch or students | ExportJob, ExamSchedule, Student |
| EXM-API-17 | POST | /exams/:id/export | exams.export | Date sheet, marks sheet or result sheet (XLSX / PDF) | ExportJob |
| EXM-API-18 | GET | /exams/:id/results | exams.view | Batch result sheet: subject marks, total, percent, grade, rank, pass / fail | ExamMark, ExamSchedule |
| EXM-API-19 | GET | /exams/:id/analysis | exams.view | Subject averages, pass percent, grade distribution, toppers | ExamMark |
| EXM-API-20 | GET | /exams/lookup | exams.view | Light dropdown list (year, term, status) | Exam |
| EXM-API-21 | GET | /exams/summary | exams.view | Dashboard: upcoming exams, marks-entry progress, recent pass percent | Exam, ExamSchedule |
| EXM-API-22 | GET | /exam-schedules | exams.view | List papers (exam, batch, subject, date, invigilator, marksEntryStatus) | ExamSchedule |
| EXM-API-23 | POST | /exam-schedules | exams.create | Create one paper with optional components | ExamSchedule, ExamScheduleComponent |
| EXM-API-24 | GET | /exam-schedules/:id | exams.view | Paper with components | ExamSchedule, ExamScheduleComponent |
| EXM-API-25 | PATCH | /exam-schedules/:id | exams.update | Update date, time, room, invigilator, marks limits, components | ExamSchedule, ExamScheduleComponent |
| EXM-API-26 | DELETE | /exam-schedules/:id | exams.delete | Soft delete a paper without marks | ExamSchedule |
| EXM-API-27 | POST | /exam-schedules/bulk | exams.create | Create papers for many batches x subjects from CourseSubject defaults | ExamSchedule, CourseSubject |
| EXM-API-28 | GET | /exam-schedules/:id/marks | exams.view | Marks sheet: batch students with marks and components | ExamMark, ExamMarkComponent, Enrollment |
| EXM-API-29 | PUT | /exam-schedules/:id/marks | exams.enter_marks | Bulk save marks, absent, exempt; sets IN_PROGRESS | ExamMark, ExamMarkComponent |
| EXM-API-30 | POST | /exam-schedules/:id/submit-marks | exams.enter_marks | Teacher submits the paper (SUBMITTED) | ExamSchedule |
| EXM-API-31 | POST | /exam-schedules/:id/verify-marks | exams.verify_marks | Verify a submitted paper (VERIFIED) | ExamSchedule, ExamMark |
| EXM-API-32 | POST | /exam-schedules/:id/reopen-marks | exams.verify_marks | Send back to IN_PROGRESS with a reason | ExamSchedule |
| EXM-API-33 | GET | /exam-schedules/:id/marks-template | exams.enter_marks | Excel template prefilled with the batch students | ExamSchedule, Enrollment |
| EXM-API-34 | GET | /exam-marks | exams.view | Query marks (student, exam, subject, batch) | ExamMark |
| EXM-API-35 | POST | /exam-marks/import | exams.import | Excel import of marks for a paper or exam (ImportType EXAM_MARKS) | ImportJob, ExamMark |
| EXM-API-36 | GET | /exam-re-evaluation-requests | exams.view | List requests (campus, exam, status) | ExamReEvaluationRequest |
| EXM-API-37 | POST | /exam-re-evaluation-requests | exams.reevaluate | Staff records a request for a student | ExamReEvaluationRequest, ExamMark |
| EXM-API-38 | GET | /exam-re-evaluation-requests/:id | exams.view | Request detail with original and revised marks | ExamReEvaluationRequest |
| EXM-API-39 | POST | /exam-re-evaluation-requests/:id/accept | exams.reevaluate | Accept: FEE_PENDING with ad hoc invoice, or UNDER_REVIEW when no fee | ExamReEvaluationRequest, FeeInvoice |
| EXM-API-40 | POST | /exam-re-evaluation-requests/:id/resolve | exams.reevaluate | Close as NO_CHANGE or MARKS_REVISED; update mark and revisionCount | ExamReEvaluationRequest, ExamMark |
| EXM-API-41 | POST | /exam-re-evaluation-requests/:id/reject | exams.reevaluate | Reject with reviewRemarks | ExamReEvaluationRequest |
| EXM-API-42 | GET | /portal/parent/exams | parentportal.access | Child's upcoming exams and date sheet | Exam, ExamSchedule |
| EXM-API-43 | GET | /portal/parent/exam-results | parentportal.access | Child's marks for PUBLISHED exams | ExamMark, Exam |
| EXM-API-44 | POST | /portal/parent/exam-re-evaluation-requests | parentportal.access | Parent asks for re-checking of one paper | ExamReEvaluationRequest |
| EXM-API-45 | GET | /portal/student/exam-results | studentportal.access | Own marks for PUBLISHED exams | ExamMark, Exam |

Events emitted: exam.schedule.published, exam.marks_entry.opened, exam.marks.submitted, exam.marks.verified, exam.marks.reopened, exam.results.published, exam.results.unpublished, exam.cancelled, exam.marks.import.completed, exam.reevaluation.requested, exam.reevaluation.fee_pending, exam.reevaluation.resolved, exam.reevaluation.rejected

## RPT: Report Cards

Resource base path(s): `/report-card-templates`, `/report-cards`, `/report-card-remarks`, `/portal/parent/report-cards`, `/portal/student/report-cards`

| ID | Method | Path | Permission | Purpose | Main models |
|---|---|---|---|---|---|
| RPT-API-01 | GET | /report-card-templates | reportcards.view | List templates (board style, status; also dropdown) | ReportCardTemplate |
| RPT-API-02 | POST | /report-card-templates | reportcards.manage | Create template (boardStyle, layout, settings, courseIds) | ReportCardTemplate |
| RPT-API-03 | GET | /report-card-templates/:id | reportcards.view | Template with layout JSON | ReportCardTemplate |
| RPT-API-04 | PATCH | /report-card-templates/:id | reportcards.manage | Update template or status | ReportCardTemplate |
| RPT-API-05 | DELETE | /report-card-templates/:id | reportcards.manage | Soft delete template | ReportCardTemplate |
| RPT-API-06 | POST | /report-card-templates/:id/set-default | reportcards.manage | Make this the default template | ReportCardTemplate |
| RPT-API-07 | POST | /report-card-templates/:id/preview | reportcards.manage | Render a sample PDF with demo data | ReportCardTemplate, FileAsset |
| RPT-API-08 | GET | /report-cards | reportcards.view | List cards (batch, student, scope, exam, term, status, result) | ReportCard |
| RPT-API-09 | GET | /report-cards/:id | reportcards.view | Card with subject results, attendance summary, remarks | ReportCard, ReportCardRemark |
| RPT-API-10 | PATCH | /report-cards/:id | reportcards.update | Edit overall remarks, result override, template | ReportCard |
| RPT-API-11 | DELETE | /report-cards/:id | reportcards.delete | Soft delete a DRAFT or GENERATED card | ReportCard |
| RPT-API-12 | POST | /report-cards/:id/regenerate | reportcards.generate | Recompute and rebuild the PDF after a marks or remark change | ReportCard, ExamMark, FileAsset |
| RPT-API-13 | POST | /report-cards/:id/publish | reportcards.publish | Set PUBLISHED (also releases a WITHHELD card); notify parent | ReportCard |
| RPT-API-14 | POST | /report-cards/:id/withhold | reportcards.publish | Set WITHHELD with a reason (for example fee dues) | ReportCard |
| RPT-API-15 | GET | /report-cards/:id/pdf | reportcards.view | Pre-signed URL of the PDF | ReportCard, FileAsset |
| RPT-API-16 | POST | /report-cards/:id/remarks | reportcards.remark | Add class-teacher, principal, subject or co-scholastic remark | ReportCardRemark |
| RPT-API-17 | PATCH | /report-card-remarks/:id | reportcards.remark | Update a remark | ReportCardRemark |
| RPT-API-18 | DELETE | /report-card-remarks/:id | reportcards.remark | Delete a remark | ReportCardRemark |
| RPT-API-19 | POST | /report-card-remarks/bulk | reportcards.remark | Save remarks and co-scholastic grades for a whole batch | ReportCardRemark |
| RPT-API-20 | POST | /report-cards/generate | reportcards.generate | Bulk generate for a batch + scope (EXAM / TERM / ANNUAL): totals, grade, ranks, attendance, PDFs | ReportCard, ExamMark, AttendanceRecord, GradeBand |
| RPT-API-21 | POST | /report-cards/bulk-publish | reportcards.publish | Publish all GENERATED cards of a batch + scope; skips WITHHELD | ReportCard |
| RPT-API-22 | POST | /report-cards/bulk-download | reportcards.export | Merged PDF or ZIP of a batch's cards | ExportJob, ReportCard |
| RPT-API-23 | POST | /report-cards/export | reportcards.export | Consolidated result register (XLSX) | ExportJob |
| RPT-API-24 | GET | /report-cards/summary | reportcards.view | Dashboard: generated / published / withheld per batch, result distribution | ReportCard |
| RPT-API-25 | GET | /portal/parent/report-cards | parentportal.access | Child's PUBLISHED report cards | ReportCard |

Events emitted: reportcard.generated, reportcard.regenerated, reportcard.published, reportcard.withheld, reportcard.generation.failed

## FEE: Fees

Resource base path(s): `/fee-heads`, `/tax-rates`, `/late-fee-rules`, `/fee-structures`, `/student-fee-assignments`, `/fee-invoices`, `/fee-invoice-adjustments`, `/fee-reports`, `/students/:id/fee-ledger`

| ID | Method | Path | Permission | Purpose | Main models |
|---|---|---|---|---|---|
| FEE-API-01 | GET | `/fee-heads` | fees.view | List fee heads (type, status; dropdown) | FeeHead |
| FEE-API-02 | POST | `/fee-heads` | fees.manage | Create fee head with tax settings | FeeHead, TaxRate |
| FEE-API-03 | PATCH | `/fee-heads/:id` | fees.manage | Update fee head | FeeHead |
| FEE-API-04 | DELETE | `/fee-heads/:id` | fees.manage | Archive fee head (blocked if in an active structure) | FeeHead |
| FEE-API-05 | GET | `/tax-rates` | fees.view | List effective-dated tax rates | TaxRate |
| FEE-API-06 | POST | `/tax-rates` | fees.manage | Create tax rate with components (CGST/SGST/IGST, VAT) | TaxRate |
| FEE-API-07 | PATCH | `/tax-rates/:id` | fees.manage | Update, end-date or archive tax rate | TaxRate |
| FEE-API-08 | GET | `/late-fee-rules` | fees.view | List late-fee rules | LateFeeRule |
| FEE-API-09 | POST | `/late-fee-rules` | fees.manage | Create late-fee rule (fixed, per day, percent, cap) | LateFeeRule |
| FEE-API-10 | PATCH | `/late-fee-rules/:id` | fees.manage | Update, set default or archive rule | LateFeeRule |
| FEE-API-11 | GET | `/fee-structures` | fees.view | List structures (year, campus, course, batch) | FeeStructure |
| FEE-API-12 | POST | `/fee-structures` | fees.manage | Create structure with items and installments (or copy via `copyFromId`) | FeeStructure, FeeStructureItem, FeeInstallment |
| FEE-API-13 | GET | `/fee-structures/:id` | fees.view | Structure detail with items, installments, assignment count | FeeStructure, FeeStructureItem, FeeInstallment |
| FEE-API-14 | PATCH | `/fee-structures/:id` | fees.manage | Update structure, items, installments (locked once invoiced) | FeeStructure, FeeStructureItem, FeeInstallment |
| FEE-API-15 | DELETE | `/fee-structures/:id` | fees.manage | Archive structure | FeeStructure |
| FEE-API-16 | POST | `/fee-structures/:id/assign` | fees.create | Bulk assign to a course, batch or student list (job) | StudentFeeAssignment, Enrollment |
| FEE-API-17 | GET | `/student-fee-assignments` | fees.view | List assignments (student, batch, year, status) | StudentFeeAssignment |
| FEE-API-18 | POST | `/student-fee-assignments` | fees.create | Assign structure to one student: overrides, excluded heads, start date (proration) | StudentFeeAssignment |
| FEE-API-19 | PATCH | `/student-fee-assignments/:id` | fees.update | Update overrides, excluded heads, end date, notes | StudentFeeAssignment |
| FEE-API-20 | PUT | `/student-fee-assignments/:id/installments` | fees.update | Replace the student's custom payment schedule | StudentFeeInstallment, StudentFeeAssignment |
| FEE-API-21 | POST | `/student-fee-assignments/:id/pause` | fees.update | ACTIVE to PAUSED (invoicing on hold) | StudentFeeAssignment |
| FEE-API-22 | POST | `/student-fee-assignments/:id/resume` | fees.update | PAUSED to ACTIVE | StudentFeeAssignment |
| FEE-API-23 | POST | `/student-fee-assignments/:id/cancel` | fees.delete | Cancel assignment (no issued invoices allowed) | StudentFeeAssignment |
| FEE-API-24 | GET | `/fee-invoices` | fees.view | List invoices (status, student, batch, due date, q) | FeeInvoice |
| FEE-API-25 | POST | `/fee-invoices` | fees.create | Create ad-hoc DRAFT invoice (fine, certificate fee, misc.) | FeeInvoice, FeeInvoiceItem |
| FEE-API-26 | GET | `/fee-invoices/:id` | fees.view | Invoice detail: items, adjustments, allocations, reminders | FeeInvoice, FeeInvoiceItem, FeeReminderLog |
| FEE-API-27 | PATCH | `/fee-invoices/:id` | fees.update | Edit a DRAFT invoice only | FeeInvoice, FeeInvoiceItem |
| FEE-API-28 | POST | `/fee-invoices/:id/issue` | fees.create | DRAFT to ISSUED: invoice number, tax freeze, PDF | FeeInvoice, NumberSequence |
| FEE-API-29 | POST | `/fee-invoices/:id/cancel` | fees.delete | Discard DRAFT or cancel issued invoice (credit note, optional reissue) | FeeInvoice, ScholarshipDisbursement |
| FEE-API-30 | POST | `/fee-invoices/:id/write-off` | fees.approve | Write off the balance, status WRITTEN_OFF | FeeInvoice |
| FEE-API-31 | GET | `/fee-invoices/:id/pdf` | fees.view | Invoice PDF link | FeeInvoice, FileAsset |
| FEE-API-32 | POST | `/fee-invoices/:id/remind` | fees.remind | Send a manual reminder to the fee payer | FeeReminderLog, MessageLog |
| FEE-API-33 | POST | `/fee-invoices/:id/adjustments` | fees.update | Request credit/debit note: concession, late-fee waiver, correction, partial write-off | FeeInvoiceAdjustment |
| FEE-API-34 | GET | `/fee-invoice-adjustments` | fees.view | Adjustment approval queue | FeeInvoiceAdjustment |
| FEE-API-35 | POST | `/fee-invoice-adjustments/:id/approve` | fees.approve | Approve; recompute adjustmentTotal, total, balance | FeeInvoiceAdjustment, FeeInvoice |
| FEE-API-36 | POST | `/fee-invoice-adjustments/:id/reject` | fees.approve | Reject with reason | FeeInvoiceAdjustment |
| FEE-API-37 | POST | `/fee-invoices/generate` | fees.create | Bulk generate for an installment or period (`dryRun`, `autoIssue`) (job) | FeeInvoice, StudentFeeAssignment, FeeInstallment |
| FEE-API-38 | POST | `/fee-invoices/bulk-issue` | fees.create | Issue many DRAFT invoices (job) | FeeInvoice |
| FEE-API-39 | POST | `/fee-invoices/bulk-remind` | fees.remind | Remind by filter or id list (job) | FeeReminderLog, MessageLog |
| FEE-API-40 | POST | `/fee-invoices/carry-forward` | fees.manage | Year end: move balances to ARREARS invoices (CARRIED_FORWARD) (job) | FeeInvoice |
| FEE-API-41 | POST | `/fee-invoices/import` | fees.import | Import opening dues from Excel (FEE_DUES) (job) | ImportJob, FeeInvoice |
| FEE-API-42 | GET | `/students/:id/fee-ledger` | fees.view | Student ledger: invoices, payments, refunds, credits, advance | FeeInvoice, PaymentAllocation, Refund, ScholarshipDisbursement |
| FEE-API-43 | GET | `/fee-reports/dues` | fees.view | Dues report by student, batch, course or fee head | FeeInvoice, FeeInvoiceItem |
| FEE-API-44 | GET | `/fee-reports/defaulters` | fees.view | Defaulters: overdue age buckets, reminder count | FeeInvoice, FeeReminderLog |
| FEE-API-45 | GET | `/fee-reports/summary` | fees.view | Dashboard stats: billed, collected, outstanding, overdue | FeeInvoice, DailyMetricSnapshot |
| FEE-API-46 | POST | `/fee-reports/export` | fees.export | Export invoices, dues or defaulters to Excel/PDF (job) | ExportJob |

Events emitted: fee.structure.assigned, fee.invoices.generated, fee.invoice.issued, fee.invoice.due_soon, fee.invoice.due_today, fee.invoice.overdue, fee.late_fee.applied, fee.invoice.paid, fee.invoice.cancelled, fee.invoice.written_off, fee.invoice.carried_forward, fee.adjustment.requested, fee.adjustment.approved, fee.adjustment.rejected, fee.reminder.sent

## PAY: Payments

Resource base path(s): `/payments`, `/receipts`, `/payment-orders`, `/refunds`, `/payment-gateway-accounts`, `/settlements`, `/day-closes`, `/webhooks/razorpay`, `/webhooks/stripe`, `/webhook-events`, `/payment-reports`

| ID | Method | Path | Permission | Purpose | Main models |
|---|---|---|---|---|---|
| PAY-API-01 | GET | `/payments` | payments.view | List payments (date, method, status, collector, student) | Payment |
| PAY-API-02 | POST | `/payments` | fees.collect | Record counter payment with allocations (oldest first or manual); issues receipt (IK) | Payment, PaymentAllocation, PaymentAllocationItem, Receipt |
| PAY-API-03 | GET | `/payments/:id` | payments.view | Payment detail: allocations, receipt, refunds | Payment, PaymentAllocation, Receipt |
| PAY-API-04 | POST | `/payments/:id/cancel` | payments.cancel | Cancel payment: reverse allocations, cancel receipt | Payment, PaymentAllocation, Receipt |
| PAY-API-05 | POST | `/payments/:id/allocate` | fees.collect | Allocate the unallocated advance to invoices | PaymentAllocation, PaymentAllocationItem, FeeInvoice |
| PAY-API-06 | POST | `/payments/:id/update-cheque` | payments.update | Mark cheque DEPOSITED, CLEARED or RETURNED | Payment |
| PAY-API-07 | POST | `/payments/:id/bounce-cheque` | payments.update | Cheque BOUNCED: reverse allocations, raise bounce-charge invoice | Payment, PaymentAllocation, FeeInvoice |
| PAY-API-08 | GET | `/receipts` | payments.view | List receipts (no, date, status) | Receipt |
| PAY-API-09 | GET | `/receipts/:id/pdf` | payments.view | Receipt PDF link | Receipt, FileAsset |
| PAY-API-10 | POST | `/receipts/:id/send` | fees.collect | Send receipt on WhatsApp, email or SMS | Receipt, MessageLog |
| PAY-API-11 | POST | `/receipts/:id/reissue` | payments.cancel | Cancel receipt and issue a replacement | Receipt, NumberSequence |
| PAY-API-12 | GET | `/payment-orders` | payments.view | List online orders (created, failed, paid, expired) | PaymentOrder |
| PAY-API-13 | POST | `/payment-orders` | fees.collect | Create Razorpay/Stripe order for invoices: counter checkout or pay link (IK) | PaymentOrder, PaymentGatewayAccount |
| PAY-API-14 | GET | `/payment-orders/:id` | payments.view | Order status (poll after checkout) | PaymentOrder, Payment |
| PAY-API-15 | POST | `/payment-orders/:id/verify` | fees.collect | Verify checkout signature; capture if the webhook is not in yet | PaymentOrder, Payment, Receipt |
| PAY-API-16 | POST | `/payment-orders/:id/send-link` | fees.collect | Send pay link to the guardian (opens portal checkout) | PaymentOrder, MessageLog |
| PAY-API-17 | POST | `/payment-orders/:id/cancel` | fees.collect | Cancel an unpaid order or link | PaymentOrder |
| PAY-API-18 | GET | `/refunds` | payments.view | List refunds (status, type, date) | Refund |
| PAY-API-19 | POST | `/refunds` | payments.refund | Request refund: full or part, deductions, split (IK) | Refund, RefundAllocation |
| PAY-API-20 | GET | `/refunds/:id` | payments.view | Refund detail | Refund, RefundAllocation |
| PAY-API-21 | POST | `/refunds/:id/approve` | payments.approve | REQUESTED to APPROVED | Refund |
| PAY-API-22 | POST | `/refunds/:id/reject` | payments.approve | REQUESTED to REJECTED with reason | Refund |
| PAY-API-23 | POST | `/refunds/:id/process` | payments.refund | Gateway refund or record offline payout; reopen invoices | Refund, Payment, FeeInvoice |
| PAY-API-24 | GET | `/payment-gateway-accounts` | payments.manage | List gateway accounts | PaymentGatewayAccount |
| PAY-API-25 | POST | `/payment-gateway-accounts` | payments.manage | Connect Razorpay/Stripe account (secrets stored encrypted) | PaymentGatewayAccount |
| PAY-API-26 | PATCH | `/payment-gateway-accounts/:id` | payments.manage | Update mode, methods, convenience fee, default | PaymentGatewayAccount |
| PAY-API-27 | DELETE | `/payment-gateway-accounts/:id` | payments.manage | Disconnect account | PaymentGatewayAccount |
| PAY-API-28 | POST | `/payment-gateway-accounts/:id/verify` | payments.manage | Test credentials; sets lastVerifiedAt | PaymentGatewayAccount |
| PAY-API-29 | GET | `/settlements` | payments.view | List gateway payouts | Settlement |
| PAY-API-30 | GET | `/settlements/:id` | payments.view | Payout detail with payments and refunds | Settlement, Payment, Refund |
| PAY-API-31 | POST | `/settlements/sync` | payments.reconcile | Fetch payouts from the gateway (job) | Settlement |
| PAY-API-32 | POST | `/settlements/:id/reconcile` | payments.reconcile | Mark RECONCILED or resolve MISMATCH | Settlement, Payment |
| PAY-API-33 | GET | `/day-closes` | payments.view | List day closes | DayClose |
| PAY-API-34 | POST | `/day-closes` | payments.close_day | Open or refresh today's close with system totals | DayClose, Payment, Refund |
| PAY-API-35 | GET | `/day-closes/:id` | payments.view | Day-close detail with payments | DayClose, Payment |
| PAY-API-36 | POST | `/day-closes/:id/submit` | payments.close_day | Counted cash, denominations, deposit; status SUBMITTED | DayClose |
| PAY-API-37 | POST | `/day-closes/:id/verify` | payments.approve | Set VERIFIED or DISCREPANCY | DayClose |
| PAY-API-38 | POST | `/webhooks/razorpay/:gatewayAccountId` | public | Razorpay webhook receiver (signature, idempotent) | WebhookEvent, Payment, Refund, Settlement |
| PAY-API-39 | POST | `/webhooks/stripe/:gatewayAccountId` | public | Stripe webhook receiver (signature, idempotent) | WebhookEvent, Payment, Refund, Settlement |
| PAY-API-40 | GET | `/webhook-events` | payments.manage | Webhook inbox log (provider, status) | WebhookEvent |
| PAY-API-41 | POST | `/webhook-events/:id/retry` | payments.manage | Re-process a FAILED event | WebhookEvent |
| PAY-API-42 | POST | `/payments/import` | payments.import | Import historical payments from Excel (FEE_PAYMENTS) (job) | ImportJob, Payment, PaymentAllocation |
| PAY-API-43 | GET | `/payment-reports/summary` | payments.view | Collection stats: today, month, by method, online share | Payment, DailyMetricSnapshot |
| PAY-API-44 | GET | `/payment-reports/day-book` | payments.view | Day book by date, method, collector | Payment, Refund |
| PAY-API-45 | GET | `/payment-reports/head-wise` | payments.view | Head-wise collection with tax portion | PaymentAllocationItem, FeeHead |
| PAY-API-46 | POST | `/payment-reports/export` | payments.export | Export payments, receipts, refunds or day book (job) | ExportJob |

Events emitted: payment.order.created, payment.link.sent, payment.captured, payment.failed, payment.cancelled, payment.cheque.cleared, payment.cheque.bounced, payment.disputed, receipt.issued, receipt.cancelled, refund.requested, refund.approved, refund.rejected, refund.processed, refund.failed, settlement.reconciled, settlement.mismatch, dayclose.submitted, dayclose.discrepancy

## DSC: Discounts

Resource base path(s): `/discounts`, `/student-discounts`, `/discount-reports`

| ID | Method | Path | Permission | Purpose | Main models |
|---|---|---|---|---|---|
| DSC-API-01 | GET | `/discounts` | discounts.view | List discount schemes (category, status; dropdown) | Discount |
| DSC-API-02 | POST | `/discounts` | discounts.manage | Create scheme: percent/fixed, scope, stacking, cap, validity | Discount |
| DSC-API-03 | GET | `/discounts/:id` | discounts.view | Scheme detail with grant count | Discount, StudentDiscount |
| DSC-API-04 | PATCH | `/discounts/:id` | discounts.manage | Update scheme | Discount |
| DSC-API-05 | DELETE | `/discounts/:id` | discounts.manage | Archive scheme | Discount |
| DSC-API-06 | GET | `/student-discounts` | discounts.view | List grants and approval queue (status, student, year) | StudentDiscount |
| DSC-API-07 | POST | `/student-discounts` | discounts.create | Grant discount to a student (PENDING or auto-approved) | StudentDiscount, Discount |
| DSC-API-08 | PATCH | `/student-discounts/:id` | discounts.update | Edit a PENDING grant (value override, validity, reason) | StudentDiscount |
| DSC-API-09 | POST | `/student-discounts/:id/approve` | discounts.approve | Approve; applies to DRAFT and future invoices | StudentDiscount, FeeInvoice |
| DSC-API-10 | POST | `/student-discounts/:id/reject` | discounts.approve | Reject with reason | StudentDiscount |
| DSC-API-11 | POST | `/student-discounts/:id/revoke` | discounts.delete | Revoke an approved grant from a date | StudentDiscount |
| DSC-API-12 | POST | `/student-discounts/bulk` | discounts.create | Grant one scheme to many students (job) | StudentDiscount |
| DSC-API-13 | POST | `/student-discounts/preview` | discounts.view | Preview net effect on a student's fees (stacking, priority, cap) | Discount, StudentDiscount, StudentFeeAssignment |
| DSC-API-14 | GET | `/student-discounts/sibling-suggestions` | discounts.view | Auto-detected sibling-discount candidates | Family, StudentGuardian, Discount |
| DSC-API-15 | GET | `/discount-reports/impact` | discounts.view | Discount impact by scheme, category, batch | StudentDiscount, FeeInvoice |
| DSC-API-16 | POST | `/discount-reports/export` | discounts.export | Export grants or impact report (job) | ExportJob |

Events emitted: discount.requested, discount.approved, discount.rejected, discount.revoked

## SCH: Scholarships

Resource base path(s): `/scholarships`, `/scholarship-applications`, `/scholarship-awards`, `/scholarship-disbursements`, `/scholarship-reports`

| ID | Method | Path | Permission | Purpose | Main models |
|---|---|---|---|---|---|
| SCH-API-01 | GET | `/scholarships` | scholarships.view | List schemes (status, funding source; dropdown) | Scholarship |
| SCH-API-02 | POST | `/scholarships` | scholarships.manage | Create scheme: value, criteria, seats, dates (DRAFT) | Scholarship |
| SCH-API-03 | GET | `/scholarships/:id` | scholarships.view | Scheme detail with seats and utilisation | Scholarship, ScholarshipAward |
| SCH-API-04 | PATCH | `/scholarships/:id` | scholarships.manage | Update scheme | Scholarship |
| SCH-API-05 | DELETE | `/scholarships/:id` | scholarships.manage | Archive scheme | Scholarship |
| SCH-API-06 | POST | `/scholarships/:id/open` | scholarships.manage | DRAFT or CLOSED to OPEN | Scholarship |
| SCH-API-07 | POST | `/scholarships/:id/close` | scholarships.manage | OPEN to CLOSED | Scholarship |
| SCH-API-08 | GET | `/scholarship-applications` | scholarships.view | List applications (scheme, status, score) | ScholarshipApplication |
| SCH-API-09 | POST | `/scholarship-applications` | scholarships.create | Create application for a student (staff) | ScholarshipApplication |
| SCH-API-10 | GET | `/scholarship-applications/:id` | scholarships.view | Application detail with documents | ScholarshipApplication, FileAsset |
| SCH-API-11 | PATCH | `/scholarship-applications/:id` | scholarships.update | Edit DRAFT fields, documents | ScholarshipApplication |
| SCH-API-12 | POST | `/scholarship-applications/:id/submit` | scholarships.create | DRAFT to SUBMITTED | ScholarshipApplication |
| SCH-API-13 | POST | `/scholarship-applications/:id/review` | scholarships.update | UNDER_REVIEW with score and remarks | ScholarshipApplication |
| SCH-API-14 | POST | `/scholarship-applications/:id/shortlist` | scholarships.update | UNDER_REVIEW to SHORTLISTED | ScholarshipApplication |
| SCH-API-15 | POST | `/scholarship-applications/:id/approve` | scholarships.approve | Approve (seat check) | ScholarshipApplication, Scholarship |
| SCH-API-16 | POST | `/scholarship-applications/:id/reject` | scholarships.approve | Reject with remarks | ScholarshipApplication |
| SCH-API-17 | POST | `/scholarship-applications/:id/withdraw` | scholarships.update | Mark WITHDRAWN | ScholarshipApplication |
| SCH-API-18 | GET | `/scholarship-awards` | scholarships.view | List awards (scheme, student, year, status) | ScholarshipAward |
| SCH-API-19 | POST | `/scholarship-awards` | scholarships.approve | Award from an approved application or directly | ScholarshipAward, ScholarshipApplication, Scholarship |
| SCH-API-20 | GET | `/scholarship-awards/:id` | scholarships.view | Award detail with disbursements | ScholarshipAward, ScholarshipDisbursement |
| SCH-API-21 | POST | `/scholarship-awards/:id/suspend` | scholarships.approve | ACTIVE to SUSPENDED (renewal condition failed) | ScholarshipAward |
| SCH-API-22 | POST | `/scholarship-awards/:id/reinstate` | scholarships.approve | SUSPENDED to ACTIVE | ScholarshipAward |
| SCH-API-23 | POST | `/scholarship-awards/:id/revoke` | scholarships.approve | Revoke; reverse unpaid-invoice credits | ScholarshipAward, ScholarshipDisbursement |
| SCH-API-24 | POST | `/scholarship-awards/:id/renew` | scholarships.approve | Create next-year award (renewedFromAwardId) | ScholarshipAward |
| SCH-API-25 | POST | `/scholarship-disbursements` | scholarships.disburse | Credit an invoice or record direct payment to beneficiary | ScholarshipDisbursement, FeeInvoice, Payment |
| SCH-API-26 | POST | `/scholarship-disbursements/:id/reverse` | scholarships.disburse | Reverse a disbursement with reason | ScholarshipDisbursement, FeeInvoice |
| SCH-API-27 | GET | `/scholarship-reports/utilisation` | scholarships.view | Funder and scheme utilisation: seats, awarded, disbursed | Scholarship, ScholarshipAward, ScholarshipDisbursement |
| SCH-API-28 | POST | `/scholarship-reports/export` | scholarships.export | Export applications, awards or utilisation (job) | ExportJob |

Events emitted: scholarship.opened, scholarship.closed, scholarship.application.submitted, scholarship.application.shortlisted, scholarship.application.approved, scholarship.application.rejected, scholarship.awarded, scholarship.disbursed, scholarship.disbursement.reversed, scholarship.award.suspended, scholarship.award.reinstated, scholarship.award.revoked, scholarship.award.renewed

## PP: Parent Portal

Resource base path(s): `/portal/parent/...`. Login is OTP through the auth endpoints. The in-app feed, notification preferences and device tokens use NTF-API-19 to NTF-API-26 (`self`). Every `:studentId` must be linked to the guardian through `StudentGuardian`.

| ID | Method | Path | Permission | Purpose | Main models |
|---|---|---|---|---|---|
| PP-API-01 | GET | `/portal/parent/me` | parentportal.access | Own profile, language, branding, pending consents | Guardian, User, Organization |
| PP-API-02 | PATCH | `/portal/parent/me` | parentportal.access | Update allowed contact fields and language | Guardian, User |
| PP-API-03 | GET | `/portal/parent/children` | parentportal.access | Children for the switcher (batch, photo, badges) | StudentGuardian, Student, Enrollment |
| PP-API-04 | GET | `/portal/parent/home` | parentportal.access | Home feed per child: today, dues, homework, notices | AttendanceRecord, FeeInvoice, Homework, Announcement |
| PP-API-05 | GET | `/portal/parent/children/:studentId/attendance` | parentportal.access | Month calendar and summary | AttendanceRecord, AttendanceSession, Holiday |
| PP-API-06 | GET | `/portal/parent/children/:studentId/timetable` | parentportal.access | Weekly timetable and class changes | TimetableEntry, PeriodSlot, ClassSession |
| PP-API-07 | GET | `/portal/parent/children/:studentId/homework` | parentportal.access | Homework with submission status | Homework, HomeworkSubmission |
| PP-API-08 | GET | `/portal/parent/children/:studentId/exams` | parentportal.access | Exam schedule (date sheet) | Exam, ExamSchedule |
| PP-API-09 | GET | `/portal/parent/children/:studentId/results` | parentportal.access | Published marks by exam | ExamMark, ExamSchedule |
| PP-API-10 | GET | `/portal/parent/children/:studentId/report-cards` | parentportal.access | Published report cards | ReportCard |
| PP-API-11 | GET | `/portal/parent/report-cards/:id/pdf` | parentportal.access | Report card PDF link | ReportCard, FileAsset |
| PP-API-12 | GET | `/portal/parent/children/:studentId/notes` | parentportal.access | Teacher remarks shared with the parent | StudentNote |
| PP-API-13 | GET | `/portal/parent/fee-invoices` | parentportal.access | Dues and invoice history of all children (no DRAFT) | FeeInvoice |
| PP-API-14 | GET | `/portal/parent/fee-invoices/:id` | parentportal.access | Invoice detail with lines and payments | FeeInvoice, FeeInvoiceItem, PaymentAllocation |
| PP-API-15 | GET | `/portal/parent/fee-invoices/:id/pdf` | parentportal.access | Invoice PDF link | FeeInvoice, FileAsset |
| PP-API-16 | POST | `/portal/parent/payment-orders` | parentportal.access | Create checkout order for one or more invoices (IK) | PaymentOrder, PaymentGatewayAccount |
| PP-API-17 | POST | `/portal/parent/payment-orders/:id/verify` | parentportal.access | Verify checkout signature; return payment and receipt | PaymentOrder, Payment, Receipt |
| PP-API-18 | GET | `/portal/parent/payments` | parentportal.access | Payment history with receipts | Payment, Receipt |
| PP-API-19 | GET | `/portal/parent/receipts/:id/pdf` | parentportal.access | Receipt PDF link | Receipt, FileAsset |
| PP-API-20 | GET | `/portal/parent/leave-requests` | parentportal.access | List leave requests of own children | StudentLeaveRequest |
| PP-API-21 | POST | `/portal/parent/leave-requests` | parentportal.access | Apply leave for a child | StudentLeaveRequest |
| PP-API-22 | POST | `/portal/parent/leave-requests/:id/cancel` | parentportal.access | Cancel a PENDING request | StudentLeaveRequest |
| PP-API-23 | GET | `/portal/parent/announcements` | parentportal.access | Notice inbox (unread, pinned) | AnnouncementRecipient, Announcement |
| PP-API-24 | GET | `/portal/parent/announcements/:id` | parentportal.access | Notice detail; marks read | Announcement, AnnouncementRecipient |
| PP-API-25 | POST | `/portal/parent/announcements/:id/acknowledge` | parentportal.access | Confirm "I have read this" | AnnouncementRecipient |
| PP-API-26 | GET | `/portal/parent/consents` | parentportal.access | Consents per child with policy text | ConsentRecord, PolicyDocument |
| PP-API-27 | POST | `/portal/parent/consents` | parentportal.access | Grant consent (OTP-verified) | ConsentRecord, OtpCode |
| PP-API-28 | POST | `/portal/parent/consents/:id/withdraw` | parentportal.access | Withdraw a consent | ConsentRecord |
| PP-API-29 | GET | `/portal/parent/certificate-requests` | parentportal.access | List certificate requests | CertificateRequest, IssuedCertificate |
| PP-API-30 | POST | `/portal/parent/certificate-requests` | parentportal.access | Request a certificate for a child | CertificateRequest |
| PP-API-31 | GET | `/portal/parent/scholarship-applications` | parentportal.access | Open schemes and own application status | Scholarship, ScholarshipApplication, ScholarshipAward |
| PP-API-32 | POST | `/portal/parent/scholarship-applications` | parentportal.access | Apply to an OPEN scheme with documents | ScholarshipApplication |

Events emitted: portal.parent.first_login, student.leave.requested, student.leave.cancelled, consent.granted, consent.withdrawn, announcement.acknowledged, certificate.requested, scholarship.application.submitted, payment.order.created (payment.captured and receipt.issued come from PAY)

## SP: Student Portal

Resource base path(s): `/portal/student/...`. The in-app feed, notification preferences and device tokens use NTF-API-19 to NTF-API-26 (`self`). All data is limited to the student linked to the signed-in user. PP-style payment endpoints work only when the organization setting allows student payments.

| ID | Method | Path | Permission | Purpose | Main models |
|---|---|---|---|---|---|
| SP-API-01 | GET | `/portal/student/me` | studentportal.access | Own profile, batch, branding, enabled features | Student, Enrollment, User |
| SP-API-02 | PATCH | `/portal/student/me` | studentportal.access | Update allowed fields only (photo, language) | Student, User |
| SP-API-03 | GET | `/portal/student/home` | studentportal.access | Dashboard: today's classes, homework due, attendance %, notices | TimetableEntry, Homework, AttendanceRecord, Announcement |
| SP-API-04 | GET | `/portal/student/timetable` | studentportal.access | Weekly timetable and class changes | TimetableEntry, PeriodSlot, ClassSession |
| SP-API-05 | GET | `/portal/student/attendance` | studentportal.access | Month calendar and summary | AttendanceRecord, AttendanceSession |
| SP-API-06 | GET | `/portal/student/homework` | studentportal.access | Homework list with own status | Homework, HomeworkSubmission |
| SP-API-07 | GET | `/portal/student/homework/:id` | studentportal.access | Homework detail, attachments, own submission | Homework, HomeworkAttachment, HomeworkSubmission |
| SP-API-08 | POST | `/portal/student/homework/:id/submissions` | studentportal.access | Submit or resubmit work with files | HomeworkSubmission, HomeworkSubmissionFile |
| SP-API-09 | GET | `/portal/student/study-materials` | studentportal.access | Notes, worksheets, video links of own batches | StudyMaterial |
| SP-API-10 | GET | `/portal/student/exams` | studentportal.access | Exam schedule (date sheet) | Exam, ExamSchedule |
| SP-API-11 | GET | `/portal/student/results` | studentportal.access | Published marks by exam | ExamMark, ExamSchedule |
| SP-API-12 | GET | `/portal/student/report-cards` | studentportal.access | Published report cards | ReportCard |
| SP-API-13 | GET | `/portal/student/report-cards/:id/pdf` | studentportal.access | Report card PDF link | ReportCard, FileAsset |
| SP-API-14 | GET | `/portal/student/announcements` | studentportal.access | Notice inbox | AnnouncementRecipient, Announcement |
| SP-API-15 | GET | `/portal/student/announcements/:id` | studentportal.access | Notice detail; marks read | Announcement, AnnouncementRecipient |
| SP-API-16 | GET | `/portal/student/library-loans` | studentportal.access | Books issued, due dates, fines | BookIssue, BookCopy, Book |
| SP-API-17 | GET | `/portal/student/certificate-requests` | studentportal.access | List own certificate requests | CertificateRequest, IssuedCertificate |
| SP-API-18 | POST | `/portal/student/certificate-requests` | studentportal.access | Request a certificate | CertificateRequest |
| SP-API-19 | GET | `/portal/student/fee-invoices` | studentportal.access | Own dues and invoices (read only by default) | FeeInvoice, FeeInvoiceItem |
| SP-API-20 | POST | `/portal/student/payment-orders` | studentportal.access | Create checkout order, if student payment is enabled (IK) | PaymentOrder, PaymentGatewayAccount |
| SP-API-21 | POST | `/portal/student/payment-orders/:id/verify` | studentportal.access | Verify checkout signature | PaymentOrder, Payment, Receipt |
| SP-API-22 | GET | `/portal/student/receipts/:id/pdf` | studentportal.access | Receipt PDF link | Receipt, FileAsset |

Events emitted: portal.student.first_login, homework.submitted, homework.resubmitted, certificate.requested, payment.order.created

## NTF: Notifications

Resource base path(s): `/notification-templates`, `/notification-events`, `/announcements`, `/notifications`, `/notification-preferences`, `/device-tokens`, `/message-logs`, `/notification-reports`

| ID | Method | Path | Permission | Purpose | Main models |
|---|---|---|---|---|---|
| NTF-API-01 | GET | `/notification-templates` | notifications.view | List templates: tenant overrides merged over system defaults | NotificationTemplate |
| NTF-API-02 | POST | `/notification-templates` | notifications.manage | Create tenant template for event + channel + language | NotificationTemplate, WhatsAppTemplate, SmsDltTemplate |
| NTF-API-03 | PATCH | `/notification-templates/:id` | notifications.manage | Update body, subject, linked provider template, status | NotificationTemplate |
| NTF-API-04 | DELETE | `/notification-templates/:id` | notifications.manage | Remove override; fall back to system default | NotificationTemplate |
| NTF-API-05 | POST | `/notification-templates/:id/preview` | notifications.view | Render with sample variables | NotificationTemplate |
| NTF-API-06 | POST | `/notification-templates/:id/test` | notifications.manage | Send a test message to own phone or email | NotificationTemplate, MessageLog |
| NTF-API-07 | GET | `/notification-events` | notifications.view | Event catalog: variables, channels, active templates | NotificationTemplate |
| NTF-API-08 | GET | `/announcements` | notifications.view | List announcements (status, campus, audience) | Announcement |
| NTF-API-09 | POST | `/announcements` | notifications.create | Create DRAFT with audience filter, channels, attachments | Announcement |
| NTF-API-10 | GET | `/announcements/:id` | notifications.view | Announcement detail with delivery counts | Announcement, MessageLog |
| NTF-API-11 | PATCH | `/announcements/:id` | notifications.update | Edit DRAFT or SCHEDULED; pin or unpin | Announcement |
| NTF-API-12 | DELETE | `/announcements/:id` | notifications.delete | Delete DRAFT or hide a sent notice | Announcement |
| NTF-API-13 | POST | `/announcements/audience-preview` | notifications.create | Recipient count and credit cost for a filter | Announcement, MessageCreditWallet |
| NTF-API-14 | POST | `/announcements/:id/send` | notifications.send | Send now or schedule; reserves credits (job) | Announcement, AnnouncementRecipient, CreditTransaction |
| NTF-API-15 | POST | `/announcements/:id/cancel` | notifications.send | Cancel SCHEDULED; release credits | Announcement, CreditTransaction |
| NTF-API-16 | GET | `/announcements/:id/recipients` | notifications.view | Recipients with read and acknowledgement status | AnnouncementRecipient |
| NTF-API-17 | GET | `/announcements/inbox` | self | Notices addressed to the signed-in staff user | AnnouncementRecipient, Announcement |
| NTF-API-18 | POST | `/announcements/:id/acknowledge` | self | Mark read or acknowledged (staff) | AnnouncementRecipient |
| NTF-API-19 | GET | `/notifications` | self | Own in-app feed (`unread`, category) | Notification |
| NTF-API-20 | GET | `/notifications/unread-count` | self | Bell badge count | Notification |
| NTF-API-21 | POST | `/notifications/:id/read` | self | Mark one as read | Notification |
| NTF-API-22 | POST | `/notifications/read-all` | self | Mark all as read | Notification |
| NTF-API-23 | GET | `/notification-preferences` | self | Own channel x category matrix | NotificationPreference |
| NTF-API-24 | PUT | `/notification-preferences` | self | Bulk upsert own preferences | NotificationPreference |
| NTF-API-25 | POST | `/device-tokens` | self | Register or refresh a push token | DeviceToken |
| NTF-API-26 | DELETE | `/device-tokens/:id` | self | Unregister token on logout | DeviceToken |
| NTF-API-27 | GET | `/message-logs` | notifications.view | Delivery log, all channels (status, event, student) | MessageLog |
| NTF-API-28 | GET | `/message-logs/:id` | notifications.view | Message detail: body, variables, error, cost | MessageLog |
| NTF-API-29 | POST | `/message-logs/:id/resend` | notifications.send | Resend a FAILED message as a new log row | MessageLog, CreditTransaction |
| NTF-API-30 | POST | `/message-logs/export` | notifications.export | Export delivery log (job) | ExportJob |
| NTF-API-31 | GET | `/notification-reports/summary` | notifications.view | Sent, delivered, read, failed and cost by channel | MessageLog |

Events emitted: notification.created, announcement.scheduled, announcement.sent, announcement.cancelled, announcement.acknowledged, message.queued, message.sent, message.delivered, message.read, message.failed, message.fallback_triggered

## WA: WhatsApp

Resource base path(s): `/whatsapp-accounts`, `/whatsapp-templates`, `/whatsapp-messages`, `/whatsapp-inbound-messages`, `/whatsapp-opt-ins`, `/whatsapp-wallet`, `/webhooks/whatsapp`, `/whatsapp-reports`

| ID | Method | Path | Permission | Purpose | Main models |
|---|---|---|---|---|---|
| WA-API-01 | GET | `/whatsapp-accounts` | whatsapp.view | List connected numbers | WhatsAppAccount |
| WA-API-02 | POST | `/whatsapp-accounts` | whatsapp.manage | Connect a WABA number (embedded signup code exchange) | WhatsAppAccount |
| WA-API-03 | GET | `/whatsapp-accounts/:id` | whatsapp.view | Account health: quality rating, messaging tier | WhatsAppAccount |
| WA-API-04 | PATCH | `/whatsapp-accounts/:id` | whatsapp.manage | Update campus, default flag, status | WhatsAppAccount |
| WA-API-05 | DELETE | `/whatsapp-accounts/:id` | whatsapp.manage | Disconnect number | WhatsAppAccount |
| WA-API-06 | POST | `/whatsapp-accounts/:id/sync` | whatsapp.manage | Refresh verified name, quality, tier from Meta | WhatsAppAccount |
| WA-API-07 | GET | `/whatsapp-templates` | whatsapp.view | List templates (status, category, language) | WhatsAppTemplate |
| WA-API-08 | POST | `/whatsapp-templates` | whatsapp.manage | Create template and submit to Meta | WhatsAppTemplate |
| WA-API-09 | PATCH | `/whatsapp-templates/:id` | whatsapp.manage | Edit DRAFT or REJECTED template and resubmit | WhatsAppTemplate |
| WA-API-10 | DELETE | `/whatsapp-templates/:id` | whatsapp.manage | Delete template (also at Meta) | WhatsAppTemplate |
| WA-API-11 | POST | `/whatsapp-templates/sync` | whatsapp.manage | Pull templates and approval status from Meta (job) | WhatsAppTemplate |
| WA-API-12 | GET | `/whatsapp-messages` | whatsapp.view | Outbound WhatsApp log (status, category, cost) | MessageLog |
| WA-API-13 | POST | `/whatsapp-messages` | whatsapp.send | Send template message to recipients; PDF or pay-link header; credit check (job) | MessageLog, WhatsAppTemplate, MessageCreditWallet |
| WA-API-14 | GET | `/whatsapp-inbound-messages` | whatsapp.view | Front-desk inbox (unread, phone, guardian) | WhatsAppInboundMessage |
| WA-API-15 | POST | `/whatsapp-inbound-messages/:id/read` | whatsapp.send | Mark message read and handled | WhatsAppInboundMessage |
| WA-API-16 | POST | `/whatsapp-inbound-messages/:id/reply` | whatsapp.send | Free-form reply inside the 24-hour window | WhatsAppInboundMessage, MessageLog |
| WA-API-17 | GET | `/whatsapp-opt-ins` | whatsapp.view | Guardians with WhatsApp consent status and proof | ConsentRecord, Guardian |
| WA-API-18 | POST | `/whatsapp-opt-ins` | whatsapp.manage | Record opt-in or opt-out with proof (form, in person) | ConsentRecord |
| WA-API-19 | GET | `/whatsapp-wallet` | whatsapp.view | Balance, reserved, available, packs on offer | MessageCreditWallet |
| WA-API-20 | PATCH | `/whatsapp-wallet` | whatsapp.manage | Set low-balance threshold | MessageCreditWallet |
| WA-API-21 | GET | `/whatsapp-wallet/transactions` | whatsapp.view | Wallet ledger (type, date) | CreditTransaction |
| WA-API-22 | POST | `/whatsapp-wallet/top-ups` | whatsapp.manage | Buy a credit pack; returns checkout (IK) | AddOnPurchase, CreditTransaction |
| WA-API-23 | GET | `/webhooks/whatsapp` | public | Meta webhook verification handshake | — |
| WA-API-24 | POST | `/webhooks/whatsapp` | public | Inbound messages, delivery/read statuses, template and quality updates | WebhookEvent, WhatsAppInboundMessage, MessageLog, WhatsAppTemplate |
| WA-API-25 | GET | `/whatsapp-reports/summary` | whatsapp.view | Sent, delivered, read, failed and cost by category | MessageLog, CreditTransaction |
| WA-API-26 | POST | `/whatsapp-messages/export` | whatsapp.export | Export WhatsApp log (job) | ExportJob |

Events emitted: whatsapp.account.connected, whatsapp.account.disconnected, whatsapp.account.quality_changed, whatsapp.template.approved, whatsapp.template.rejected, whatsapp.template.paused, whatsapp.message.received, whatsapp.opt_in.recorded, whatsapp.opt_out.recorded, whatsapp.wallet.topped_up, whatsapp.wallet.low_balance, whatsapp.wallet.exhausted

## EML: Email

Resource base path(s): `/email-sender-identities`, `/email-messages`, `/email-suppressions`, `/webhooks/ses`, `/email-reports`

| ID | Method | Path | Permission | Purpose | Main models |
|---|---|---|---|---|---|
| EML-API-01 | GET | `/email-sender-identities` | email.view | List sender identities with DKIM/SPF records and status | EmailSenderIdentity |
| EML-API-02 | POST | `/email-sender-identities` | email.manage | Add custom domain sender; returns DNS records | EmailSenderIdentity |
| EML-API-03 | PATCH | `/email-sender-identities/:id` | email.manage | Update from name, reply-to, default flag | EmailSenderIdentity |
| EML-API-04 | DELETE | `/email-sender-identities/:id` | email.manage | Remove identity (falls back to shared domain) | EmailSenderIdentity |
| EML-API-05 | POST | `/email-sender-identities/:id/verify` | email.manage | Re-check DKIM and SPF in SES | EmailSenderIdentity |
| EML-API-06 | GET | `/email-messages` | email.view | Email log (status, event, recipient) | MessageLog |
| EML-API-07 | POST | `/email-messages` | email.send | Send ad-hoc email to recipients with secure file links (job) | MessageLog, NotificationTemplate, EmailSuppression |
| EML-API-08 | GET | `/email-messages/:id` | email.view | Email detail with bounce diagnostics | MessageLog, EmailSuppression |
| EML-API-09 | POST | `/email-messages/:id/resend` | email.send | Resend a FAILED email | MessageLog |
| EML-API-10 | GET | `/email-suppressions` | email.view | Suppression list (reason, email) | EmailSuppression |
| EML-API-11 | POST | `/email-suppressions` | email.manage | Add an address manually | EmailSuppression |
| EML-API-12 | DELETE | `/email-suppressions/:id` | email.manage | Clear a suppression (sets removedAt) | EmailSuppression |
| EML-API-13 | POST | `/email-suppressions/unsubscribe` | public | One-click unsubscribe from the email footer (signed token) | EmailSuppression, NotificationPreference |
| EML-API-14 | POST | `/webhooks/ses` | public | SES/SNS delivery, bounce and complaint receiver | WebhookEvent, MessageLog, EmailSuppression |
| EML-API-15 | GET | `/email-reports/summary` | email.view | Sent, delivered, bounce rate, complaint rate | MessageLog, EmailSuppression |
| EML-API-16 | POST | `/email-messages/export` | email.export | Export email log (job) | ExportJob |

Events emitted: email.identity.verified, email.identity.failed, email.bounced, email.complained, email.unsubscribed, email.suppression.added, email.suppression.removed

## SMS: SMS

Resource base path(s): `/sms-sender-ids`, `/sms-dlt-templates`, `/sms-messages`, `/sms-wallet`, `/webhooks/msg91`, `/webhooks/twilio`, `/sms-reports`

| ID | Method | Path | Permission | Purpose | Main models |
|---|---|---|---|---|---|
| SMS-API-01 | GET | `/sms-sender-ids` | sms.view | List headers / sender numbers (dropdown) | SmsSenderId |
| SMS-API-02 | POST | `/sms-sender-ids` | sms.manage | Add header with DLT entity and telemarketer ids | SmsSenderId |
| SMS-API-03 | PATCH | `/sms-sender-ids/:id` | sms.manage | Update header, default flag, status | SmsSenderId |
| SMS-API-04 | DELETE | `/sms-sender-ids/:id` | sms.manage | Remove header | SmsSenderId |
| SMS-API-05 | POST | `/sms-sender-ids/:id/verify` | sms.manage | Test send and set verification status | SmsSenderId, MessageLog |
| SMS-API-06 | GET | `/sms-dlt-templates` | sms.view | List DLT content templates (header, status, language) | SmsDltTemplate |
| SMS-API-07 | POST | `/sms-dlt-templates` | sms.manage | Register a DLT template id with exact text | SmsDltTemplate |
| SMS-API-08 | PATCH | `/sms-dlt-templates/:id` | sms.manage | Update text, category, approval status | SmsDltTemplate |
| SMS-API-09 | DELETE | `/sms-dlt-templates/:id` | sms.manage | Remove DLT template | SmsDltTemplate |
| SMS-API-10 | POST | `/sms-dlt-templates/import` | sms.import | Import templates from the DLT portal Excel (job) | ImportJob, SmsDltTemplate |
| SMS-API-11 | GET | `/sms-messages` | sms.view | SMS log with delivery reports | MessageLog |
| SMS-API-12 | POST | `/sms-messages` | sms.send | Send SMS by DLT template to recipients; credit check (job) | MessageLog, SmsDltTemplate, MessageCreditWallet |
| SMS-API-13 | POST | `/sms-messages/preview` | sms.view | DLT text match, Unicode check, segments, cost | SmsDltTemplate |
| SMS-API-14 | GET | `/sms-wallet` | sms.view | Balance, reserved, available, packs on offer | MessageCreditWallet |
| SMS-API-15 | PATCH | `/sms-wallet` | sms.manage | Set low-balance threshold | MessageCreditWallet |
| SMS-API-16 | GET | `/sms-wallet/transactions` | sms.view | Wallet ledger (type, date) | CreditTransaction |
| SMS-API-17 | POST | `/sms-wallet/top-ups` | sms.manage | Buy an SMS pack; returns checkout (IK) | AddOnPurchase, CreditTransaction |
| SMS-API-18 | POST | `/webhooks/msg91` | public | MSG91 delivery report receiver | WebhookEvent, MessageLog |
| SMS-API-19 | POST | `/webhooks/twilio` | public | Twilio status callback and STOP replies | WebhookEvent, MessageLog, NotificationPreference |
| SMS-API-20 | GET | `/sms-reports/summary` | sms.view | Sent, delivered, failed, segments and cost | MessageLog, CreditTransaction |
| SMS-API-21 | POST | `/sms-messages/export` | sms.export | Export SMS log (job) | ExportJob |

Events emitted: sms.sender.verified, sms.sender.failed, sms.dlt_template.approved, sms.dlt_template.rejected, sms.opted_out, sms.wallet.topped_up, sms.wallet.low_balance, sms.wallet.exhausted

## LIB: Library

Resource base path(s): `/books`, `/library-categories`, `/book-copies`, `/book-issues`, `/book-reservations`, `/portal/student/books`, `/portal/student/library-account`, `/portal/student/book-reservations`, `/portal/parent/library-account`

| ID | Method | Path | Permission | Purpose | Main models |
|---|---|---|---|---|---|
| LIB-API-01 | GET | /books | library.view | List / search titles (q, category, subject, ISBN, language, availability) | Book |
| LIB-API-02 | POST | /books | library.create | Add title, optionally with first copies | Book, BookCopy |
| LIB-API-03 | GET | /books/:id | library.view | Title with copies and hold queue | Book, BookCopy, BookReservation |
| LIB-API-04 | PATCH | /books/:id | library.update | Update title details, cover, replacement price, status | Book, FileAsset |
| LIB-API-05 | DELETE | /books/:id | library.delete | Archive (soft delete); blocked with open loans | Book, BookIssue |
| LIB-API-06 | GET | /books/lookup | library.view | Issue-desk lookup by title, ISBN, barcode or accessionNo | Book, BookCopy |
| LIB-API-07 | GET | /books/summary | library.view | Dashboard: titles, copies, issued, overdue, fines due, waiting holds | Book, BookCopy, BookIssue |
| LIB-API-08 | POST | /books/import | library.import | Excel import of titles and copies (ImportType LIBRARY_BOOKS) | ImportJob, Book, BookCopy |
| LIB-API-09 | POST | /books/export | library.export | Export catalogue or accession register (XLSX / PDF) | ExportJob |
| LIB-API-10 | GET | /library-categories | library.view | Category tree (also dropdown) | LibraryCategory |
| LIB-API-11 | POST | /library-categories | library.manage | Create category or sub-category | LibraryCategory |
| LIB-API-12 | PATCH | /library-categories/:id | library.manage | Rename, move or change status | LibraryCategory |
| LIB-API-13 | DELETE | /library-categories/:id | library.manage | Archive; blocked while books or children use it | LibraryCategory |
| LIB-API-14 | GET | /book-copies | library.view | List copies (book, campus, status, shelf, barcode) | BookCopy |
| LIB-API-15 | POST | /book-copies | library.create | Add N copies; accessionNo from LIBRARY_ACCESSION_NO sequence | BookCopy, NumberSequence |
| LIB-API-16 | PATCH | /book-copies/:id | library.update | Update barcode, shelf, condition, price | BookCopy |
| LIB-API-17 | POST | /book-copies/:id/change-status | library.update | Set AVAILABLE, DAMAGED, UNDER_REPAIR, LOST or WITHDRAWN (withdrawReason) | BookCopy, Book |
| LIB-API-18 | POST | /book-copies/print-labels | library.view | Barcode / spine label sheet for selected copies (PDF) | ExportJob, BookCopy |
| LIB-API-19 | GET | /book-issues | library.view | List loans (status, member, campus, due date, unpaid fine) | BookIssue |
| LIB-API-20 | POST | /book-issues | library.issue | Issue a copy to a student or staff; checks quota, unpaid fines, holds | BookIssue, BookCopy, BookReservation |
| LIB-API-21 | GET | /book-issues/:id | library.view | Loan with renewals and fine breakdown | BookIssue |
| LIB-API-22 | POST | /book-issues/:id/renew | library.issue | Extend dueDate; blocked at renewal limit or with a waiting hold | BookIssue, BookReservation |
| LIB-API-23 | POST | /book-issues/:id/return | library.issue | Return copy; compute overdue / damage fine; next hold becomes READY_FOR_PICKUP | BookIssue, BookCopy, BookReservation |
| LIB-API-24 | POST | /book-issues/:id/mark-lost | library.issue | Status LOST; fine = replacement price; copy LOST | BookIssue, BookCopy |
| LIB-API-25 | POST | /book-issues/:id/charge-fine | library.collect_fine | Bill fine: fee invoice (student) or counter payment with purpose LIBRARY_FINE | BookIssue, FeeInvoice, Payment |
| LIB-API-26 | POST | /book-issues/:id/waive-fine | library.approve | Waive fine with reason (audited) | BookIssue, AuditLog |
| LIB-API-27 | GET | /book-issues/member-summary | library.issue | Member's open loans, fines due, holds and remaining quota | BookIssue, BookReservation, OrganizationSetting |
| LIB-API-28 | POST | /book-issues/send-reminders | library.manage | Queue due-soon / overdue reminders for selected or all members | BookIssue |
| LIB-API-29 | POST | /book-issues/export | library.export | Export loan, overdue or fine register (XLSX / PDF) | ExportJob |
| LIB-API-30 | GET | /book-reservations | library.view | List holds (title, member, status) in queue order | BookReservation |
| LIB-API-31 | POST | /book-reservations | library.issue | Place a hold for a member | BookReservation |
| LIB-API-32 | POST | /book-reservations/:id/cancel | library.issue | Cancel hold; release the RESERVED copy to the next member | BookReservation, BookCopy |
| LIB-API-33 | GET | /portal/student/books | studentportal.access | Search catalogue with availability | Book |
| LIB-API-34 | GET | /portal/student/library-account | studentportal.access | Own loans, due dates, fines and holds | BookIssue, BookReservation |
| LIB-API-35 | POST | /portal/student/book-reservations | studentportal.access | Reserve a title | BookReservation |
| LIB-API-36 | POST | /portal/student/book-reservations/:id/cancel | studentportal.access | Cancel own hold | BookReservation |
| LIB-API-37 | GET | /portal/parent/library-account | parentportal.access | Child's loans, due dates and fines | BookIssue |

Events emitted: library.book.issued, library.book.renewed, library.book.returned, library.book.due_soon, library.book.overdue, library.book.lost, library.fine.charged, library.fine.waived, library.reservation.placed, library.reservation.ready, library.reservation.expired, library.reservation.cancelled, library.import.completed

## INV: Inventory

Resource base path(s): `/inventory-items`, `/inventory-categories`, `/vendors`, `/purchase-orders`, `/stock-transactions`, `/asset-assignments`, `/inventory-reports`

| ID | Method | Path | Permission | Purpose | Main models |
|---|---|---|---|---|---|
| INV-API-01 | GET | /inventory-items | inventory.view | List / search items (campus, category, itemType, status, lowStock) | InventoryItem |
| INV-API-02 | POST | /inventory-items | inventory.create | Create item (SKU unique per campus store) | InventoryItem |
| INV-API-03 | GET | /inventory-items/:id | inventory.view | Item with stock, reorder level and recent ledger rows | InventoryItem, StockTransaction |
| INV-API-04 | PATCH | /inventory-items/:id | inventory.update | Update item, prices, reorder level, fee head, status | InventoryItem |
| INV-API-05 | DELETE | /inventory-items/:id | inventory.delete | Archive; blocked with stock on hand or open asset assignments | InventoryItem |
| INV-API-06 | GET | /inventory-items/lookup | inventory.view | Light dropdown list by name / SKU with currentStock | InventoryItem |
| INV-API-07 | GET | /inventory-items/summary | inventory.view | Dashboard: stock value, low-stock items, pending POs, assets out | InventoryItem, PurchaseOrder, AssetAssignment |
| INV-API-08 | POST | /inventory-items/import | inventory.import | Excel import of items with opening stock (ImportType INVENTORY_ITEMS) | ImportJob, InventoryItem, StockTransaction |
| INV-API-09 | POST | /inventory-items/export | inventory.export | Export item and stock list (XLSX) | ExportJob |
| INV-API-10 | GET | /inventory-categories | inventory.view | List categories (also dropdown) | InventoryCategory |
| INV-API-11 | POST | /inventory-categories | inventory.manage | Create category | InventoryCategory |
| INV-API-12 | PATCH | /inventory-categories/:id | inventory.manage | Update category or status | InventoryCategory |
| INV-API-13 | DELETE | /inventory-categories/:id | inventory.manage | Archive; blocked while items use it | InventoryCategory |
| INV-API-14 | GET | /vendors | inventory.view | List / search vendors (also dropdown) | Vendor |
| INV-API-15 | POST | /vendors | inventory.manage | Create vendor; PAN and bank details stored encrypted | Vendor |
| INV-API-16 | GET | /vendors/:id | inventory.view | Vendor (bank masked to last 4) with order history | Vendor, PurchaseOrder |
| INV-API-17 | PATCH | /vendors/:id | inventory.manage | Update vendor or status | Vendor |
| INV-API-18 | DELETE | /vendors/:id | inventory.manage | Archive; blocked with open purchase orders | Vendor |
| INV-API-19 | GET | /purchase-orders | inventory.view | List POs (campus, vendor, status, date range) | PurchaseOrder |
| INV-API-20 | POST | /purchase-orders | inventory.create | Create DRAFT PO with lines; poNumber from PURCHASE_ORDER_NO sequence | PurchaseOrder, PurchaseOrderItem, NumberSequence |
| INV-API-21 | GET | /purchase-orders/:id | inventory.view | PO with lines, tax breakdown and receipts | PurchaseOrder, PurchaseOrderItem, StockTransaction |
| INV-API-22 | PATCH | /purchase-orders/:id | inventory.update | Edit header and lines of a DRAFT PO; recompute totals | PurchaseOrder, PurchaseOrderItem |
| INV-API-23 | DELETE | /purchase-orders/:id | inventory.delete | Delete (soft) a DRAFT PO | PurchaseOrder |
| INV-API-24 | POST | /purchase-orders/:id/submit | inventory.create | DRAFT to PENDING_APPROVAL | PurchaseOrder |
| INV-API-25 | POST | /purchase-orders/:id/approve | inventory.approve | PENDING_APPROVAL to APPROVED (approvedById, approvedAt) | PurchaseOrder |
| INV-API-26 | POST | /purchase-orders/:id/reject | inventory.approve | Send back to DRAFT with notes | PurchaseOrder |
| INV-API-27 | POST | /purchase-orders/:id/mark-ordered | inventory.update | APPROVED to ORDERED (sent to vendor) | PurchaseOrder |
| INV-API-28 | POST | /purchase-orders/:id/receive | inventory.receive | Receive full or part; IN ledger rows; PARTIALLY_RECEIVED or RECEIVED; vendorInvoiceNo | PurchaseOrder, PurchaseOrderItem, StockTransaction, InventoryItem |
| INV-API-29 | POST | /purchase-orders/:id/cancel | inventory.update | Cancel a PO with nothing received | PurchaseOrder |
| INV-API-30 | GET | /purchase-orders/:id/pdf | inventory.view | PO document PDF | PurchaseOrder, FileAsset |
| INV-API-31 | GET | /stock-transactions | inventory.view | Stock ledger (item, type, date range, staff, student, reference) | StockTransaction |
| INV-API-32 | POST | /stock-transactions | inventory.update | Direct IN or OUT without a PO (opening stock, cash purchase) | StockTransaction, InventoryItem |
| INV-API-33 | POST | /stock-transactions/issue | inventory.issue | Issue slip to staff or student (multi-line; ISSUE_TO_STAFF / ISSUE_TO_STUDENT) | StockTransaction, InventoryItem |
| INV-API-34 | POST | /stock-transactions/return | inventory.issue | Take issued stock back (RETURN) | StockTransaction, InventoryItem |
| INV-API-35 | POST | /stock-transactions/sale | inventory.sell | Sell items to a student: SALE rows + fee invoice under the item's fee head | StockTransaction, FeeInvoice, FeeInvoiceItem |
| INV-API-36 | POST | /stock-transactions/transfer | inventory.transfer | Move stock to another campus store (paired TRANSFER_OUT / TRANSFER_IN, transferRef) | StockTransaction, InventoryItem |
| INV-API-37 | POST | /stock-transactions/adjust | inventory.adjust | Stock-count correction (ADJUST) or WRITE_OFF with reason (audited) | StockTransaction, InventoryItem, AuditLog |
| INV-API-38 | POST | /stock-transactions/export | inventory.export | Export stock ledger (XLSX) | ExportJob |
| INV-API-39 | GET | /asset-assignments | inventory.view | List asset assignments (item, holder, room, status, overdue) | AssetAssignment |
| INV-API-40 | POST | /asset-assignments | inventory.issue | Hand an ASSET item to staff, student or room | AssetAssignment, InventoryItem |
| INV-API-41 | PATCH | /asset-assignments/:id | inventory.issue | Update assetTag, expectedReturnDate, notes | AssetAssignment |
| INV-API-42 | POST | /asset-assignments/:id/return | inventory.issue | Close as RETURNED, LOST or DAMAGED with conditionOnReturn | AssetAssignment |
| INV-API-43 | POST | /asset-assignments/export | inventory.export | Export asset register (XLSX / PDF) | ExportJob |
| INV-API-44 | GET | /inventory-reports/stock-valuation | inventory.view | Quantity and value by campus and category | InventoryItem |
| INV-API-45 | GET | /inventory-reports/consumption | inventory.view | Issues, sales and write-offs by item, holder and period | StockTransaction |
| INV-API-46 | GET | /inventory-reports/purchases | inventory.view | Purchases and input tax by vendor and period | PurchaseOrder, PurchaseOrderItem |

Events emitted: inventory.stock.low, inventory.stock.received, inventory.stock.issued, inventory.stock.returned, inventory.stock.sold, inventory.stock.transferred, inventory.stock.adjusted, inventory.purchase_order.submitted, inventory.purchase_order.approved, inventory.purchase_order.rejected, inventory.purchase_order.ordered, inventory.purchase_order.cancelled, inventory.asset.assigned, inventory.asset.returned, inventory.asset.overdue, inventory.import.completed

## TRN: Transport

Resource base path(s): `/vehicles`, `/driver-profiles`, `/transport-routes`, `/route-stops`, `/transport-assignments`, `/vehicle-trips`, `/vehicle-maintenances`, `/portal/parent/transport`, `/portal/student/transport`

| ID | Method | Path | Permission | Purpose | Main models |
|---|---|---|---|---|---|
| TRN-API-01 | GET | /vehicles | transport.view | List vehicles (campus, type, status, documents expiring) | Vehicle |
| TRN-API-02 | POST | /vehicles | transport.create | Create vehicle with compliance dates, GPS device, default driver and attendant | Vehicle |
| TRN-API-03 | GET | /vehicles/:id | transport.view | Vehicle with routes, compliance dates and maintenance history | Vehicle, TransportRoute, VehicleMaintenance |
| TRN-API-04 | PATCH | /vehicles/:id | transport.update | Update vehicle, crew or status (ACTIVE, UNDER_MAINTENANCE, RETIRED) | Vehicle |
| TRN-API-05 | DELETE | /vehicles/:id | transport.delete | Archive; blocked while linked to an ACTIVE route | Vehicle |
| TRN-API-06 | GET | /vehicles/lookup | transport.view | Light dropdown list with capacity and status | Vehicle |
| TRN-API-07 | GET | /vehicles/compliance-alerts | transport.view | Insurance, fitness, PUC, permit, licence and maintenance due within N days | Vehicle, DriverProfile, VehicleMaintenance |
| TRN-API-08 | GET | /driver-profiles | transport.view | Drivers with licence expiry and checks (licence masked to last 4) | DriverProfile, Staff |
| TRN-API-09 | POST | /driver-profiles | transport.manage | Add driver profile to a staff member; licence stored encrypted | DriverProfile, Staff |
| TRN-API-10 | PATCH | /driver-profiles/:id | transport.manage | Update licence, badge, police verification, medical check | DriverProfile |
| TRN-API-11 | DELETE | /driver-profiles/:id | transport.manage | Remove profile; blocked while default driver of a vehicle | DriverProfile, Vehicle |
| TRN-API-12 | GET | /transport-routes | transport.view | List routes (campus, shift, vehicle, status) with stop and student counts | TransportRoute |
| TRN-API-13 | POST | /transport-routes | transport.create | Create route, optionally with stops | TransportRoute, RouteStop |
| TRN-API-14 | GET | /transport-routes/:id | transport.view | Route with ordered stops, vehicle and seat use | TransportRoute, RouteStop, TransportAssignment |
| TRN-API-15 | PATCH | /transport-routes/:id | transport.update | Update route, vehicle or status | TransportRoute |
| TRN-API-16 | DELETE | /transport-routes/:id | transport.delete | Archive; blocked with ACTIVE assignments | TransportRoute |
| TRN-API-17 | GET | /transport-routes/lookup | transport.view | Routes with stops and stop fee for dropdowns | TransportRoute, RouteStop |
| TRN-API-18 | GET | /transport-routes/summary | transport.view | Dashboard: vehicles, routes, students, seat use, today's trips, alerts | TransportRoute, TransportAssignment, VehicleTrip |
| TRN-API-19 | POST | /transport-routes/:id/stops | transport.update | Add stop (sequence, pickupTime, dropTime, geo, fee) | RouteStop |
| TRN-API-20 | POST | /transport-routes/:id/reorder-stops | transport.update | Re-sequence the stops of a route | RouteStop |
| TRN-API-21 | GET | /transport-routes/:id/roster | transport.view | Student roster by stop with guardian phones | TransportAssignment, RouteStop, Student |
| TRN-API-22 | PATCH | /route-stops/:id | transport.update | Update stop name, timings, geo, fee, status | RouteStop |
| TRN-API-23 | DELETE | /route-stops/:id | transport.update | Archive stop; blocked while assigned | RouteStop, TransportAssignment |
| TRN-API-24 | GET | /transport-assignments | transport.view | List assignments (year, route, stop, batch, status) | TransportAssignment |
| TRN-API-25 | POST | /transport-assignments | transport.assign | Assign student to route and stops; copy stop fee; check capacity; one ACTIVE per year | TransportAssignment, RouteStop, FeeHead |
| TRN-API-26 | GET | /transport-assignments/:id | transport.view | Assignment with billing state (billedUpTo) | TransportAssignment, FeeInvoiceItem |
| TRN-API-27 | PATCH | /transport-assignments/:id | transport.assign | Change stops, serviceType, monthlyFee, billingFrequency (no double billing) | TransportAssignment |
| TRN-API-28 | POST | /transport-assignments/:id/suspend | transport.assign | ACTIVE to SUSPENDED (for example fee hold) | TransportAssignment |
| TRN-API-29 | POST | /transport-assignments/:id/resume | transport.assign | SUSPENDED to ACTIVE | TransportAssignment |
| TRN-API-30 | POST | /transport-assignments/:id/end | transport.assign | Status ENDED with endDate; stops future billing | TransportAssignment |
| TRN-API-31 | POST | /transport-assignments/bulk | transport.assign | Assign many students (batch or list) to one route and stop | TransportAssignment |
| TRN-API-32 | POST | /transport-assignments/import | transport.import | Excel import of assignments (ImportType OTHER) | ImportJob, TransportAssignment |
| TRN-API-33 | POST | /transport-assignments/export | transport.export | Export assignments or route rosters (XLSX / PDF) | ExportJob |
| TRN-API-34 | GET | /vehicle-trips | transport.view | List trips (date, route, vehicle, driver, type, status) | VehicleTrip |
| TRN-API-35 | POST | /vehicle-trips | transport.update | Schedule an ad hoc or SPECIAL trip (daily trips are generated by a worker) | VehicleTrip |
| TRN-API-36 | GET | /vehicle-trips/:id | transport.view | Trip with crew, odometer and boarding counts | VehicleTrip, TransportAttendance |
| TRN-API-37 | PATCH | /vehicle-trips/:id | transport.update | Change vehicle, driver or attendant of a SCHEDULED trip | VehicleTrip |
| TRN-API-38 | GET | /vehicle-trips/my | transport.mark | Today's trips of the logged-in driver or attendant | VehicleTrip |
| TRN-API-39 | POST | /vehicle-trips/:id/start | transport.mark | SCHEDULED to IN_PROGRESS (startedAt, startOdometerKm) | VehicleTrip |
| TRN-API-40 | GET | /vehicle-trips/:id/attendance | transport.mark | Boarding sheet: expected students by stop with status | TransportAssignment, TransportAttendance |
| TRN-API-41 | PUT | /vehicle-trips/:id/attendance | transport.mark | Mark BOARDED, NOT_BOARDED, DROPPED or ABSENT for one or many students; parent alert | TransportAttendance |
| TRN-API-42 | POST | /vehicle-trips/:id/complete | transport.mark | Status COMPLETED with endOdometerKm, fuelLitres, incidentNotes, studentsBoarded | VehicleTrip, Vehicle |
| TRN-API-43 | POST | /vehicle-trips/:id/cancel | transport.update | Cancel a SCHEDULED trip; optional notice to parents | VehicleTrip |
| TRN-API-44 | POST | /vehicle-trips/export | transport.export | Export trip log, fuel and boarding register (XLSX) | ExportJob |
| TRN-API-45 | GET | /vehicle-maintenances | transport.view | List service, repair and renewal records (vehicle, type, due date) | VehicleMaintenance |
| TRN-API-46 | POST | /vehicle-maintenances | transport.manage | Record maintenance with bill; renewals update the vehicle expiry date | VehicleMaintenance, Vehicle, FileAsset |
| TRN-API-47 | PATCH | /vehicle-maintenances/:id | transport.manage | Update record | VehicleMaintenance |
| TRN-API-48 | DELETE | /vehicle-maintenances/:id | transport.manage | Delete (soft) record | VehicleMaintenance |
| TRN-API-49 | GET | /portal/parent/transport | parentportal.access | Child's route, stops, timings, vehicle, crew contact and today's boarding status | TransportAssignment, VehicleTrip, TransportAttendance |
| TRN-API-50 | GET | /portal/student/transport | studentportal.access | Own route, stops, timings and vehicle | TransportAssignment, RouteStop, Vehicle |

Events emitted: transport.assignment.created, transport.assignment.changed, transport.assignment.suspended, transport.assignment.resumed, transport.assignment.ended, transport.trip.started, transport.trip.completed, transport.trip.cancelled, transport.student.boarded, transport.student.not_boarded, transport.student.dropped, transport.vehicle.document_expiring, transport.driver.licence_expiring, transport.maintenance.due

## HST: Hostel

Resource base path(s): `/hostels`, `/hostel-rooms`, `/hostel-beds`, `/hostel-allocations`, `/hostel-attendance`, `/hostel-visitor-logs`, `/hostel-leave-requests`, `/portal/parent/hostel`, `/portal/parent/hostel-leave-requests`, `/portal/student/hostel`

| ID | Method | Path | Permission | Purpose | Main models |
|---|---|---|---|---|---|
| HST-API-01 | GET | /hostels | hostel.view | List hostels (campus, type, status) with capacity and occupancy | Hostel |
| HST-API-02 | POST | /hostels | hostel.create | Create hostel with type and warden | Hostel |
| HST-API-03 | GET | /hostels/:id | hostel.view | Hostel with rooms, occupancy and warden | Hostel, HostelRoom |
| HST-API-04 | PATCH | /hostels/:id | hostel.update | Update hostel, warden or status | Hostel |
| HST-API-05 | DELETE | /hostels/:id | hostel.delete | Archive; blocked with RESERVED or ACTIVE allocations | Hostel |
| HST-API-06 | GET | /hostels/lookup | hostel.view | Light dropdown list with vacant-bed count | Hostel, HostelBed |
| HST-API-07 | GET | /hostels/summary | hostel.view | Dashboard: occupancy, vacancies, tonight's roll call, residents on leave, visitors inside | Hostel, HostelBed, HostelAttendance, HostelLeaveRequest |
| HST-API-08 | GET | /hostels/:id/occupancy | hostel.view | Room-and-bed map with resident per bed | HostelRoom, HostelBed, HostelAllocation |
| HST-API-09 | GET | /hostel-rooms | hostel.view | List rooms (hostel, floor, roomType, vacancy) | HostelRoom |
| HST-API-10 | POST | /hostel-rooms | hostel.create | Create room; beds are created from capacity | HostelRoom, HostelBed |
| HST-API-11 | PATCH | /hostel-rooms/:id | hostel.update | Update type, rent, amenities, status | HostelRoom |
| HST-API-12 | DELETE | /hostel-rooms/:id | hostel.delete | Archive room and beds; blocked while a bed is OCCUPIED or RESERVED | HostelRoom, HostelBed |
| HST-API-13 | POST | /hostel-rooms/bulk | hostel.create | Create many rooms and beds (floor, number range, type, rent) | HostelRoom, HostelBed |
| HST-API-14 | GET | /hostel-beds | hostel.view | List beds; `status=AVAILABLE` gives the vacant-bed dropdown | HostelBed |
| HST-API-15 | POST | /hostel-beds | hostel.update | Add a bed to a room; recount capacity | HostelBed, HostelRoom, Hostel |
| HST-API-16 | PATCH | /hostel-beds/:id | hostel.update | Rename bed; set MAINTENANCE or AVAILABLE | HostelBed |
| HST-API-17 | DELETE | /hostel-beds/:id | hostel.update | Remove a free bed; recount capacity | HostelBed, HostelRoom, Hostel |
| HST-API-18 | GET | /hostel-allocations | hostel.view | List allocations (hostel, year, status, student, batch) | HostelAllocation |
| HST-API-19 | POST | /hostel-allocations | hostel.allocate | Reserve or allocate a bed; copy room rent; deposit; one ACTIVE per bed | HostelAllocation, HostelBed, FeeHead |
| HST-API-20 | GET | /hostel-allocations/:id | hostel.view | Allocation with billing state (billedUpTo) and out-pass history | HostelAllocation, HostelLeaveRequest |
| HST-API-21 | PATCH | /hostel-allocations/:id | hostel.allocate | Update monthlyRent, billingFrequency, toDate, notes | HostelAllocation |
| HST-API-22 | POST | /hostel-allocations/:id/check-in | hostel.allocate | RESERVED to ACTIVE; bed OCCUPIED | HostelAllocation, HostelBed |
| HST-API-23 | POST | /hostel-allocations/:id/transfer | hostel.allocate | Move resident to another bed (vacate + new allocation, billing continues) | HostelAllocation, HostelBed |
| HST-API-24 | POST | /hostel-allocations/:id/vacate | hostel.allocate | Status VACATED with vacatedOn and vacateReason; bed AVAILABLE | HostelAllocation, HostelBed |
| HST-API-25 | POST | /hostel-allocations/:id/cancel | hostel.allocate | Cancel a RESERVED allocation; free the bed | HostelAllocation, HostelBed |
| HST-API-26 | POST | /hostel-allocations/export | hostel.export | Export resident register or vacancy list (XLSX / PDF) | ExportJob |
| HST-API-27 | GET | /hostel-attendance | hostel.view | List roll-call rows (hostel, date range, student, status) | HostelAttendance |
| HST-API-28 | GET | /hostel-attendance/roster | hostel.mark | Roll-call sheet for hostel + date; approved out-pass pre-fills ON_LEAVE | HostelAllocation, HostelLeaveRequest, HostelAttendance |
| HST-API-29 | PUT | /hostel-attendance | hostel.mark | Save night roll call for hostel + date (bulk upsert); absence alert to parents | HostelAttendance |
| HST-API-30 | POST | /hostel-attendance/export | hostel.export | Export roll-call register (XLSX / PDF) | ExportJob |
| HST-API-31 | GET | /hostel-visitor-logs | hostel.view | List visitor entries (hostel, student, date range, still inside) | HostelVisitorLog |
| HST-API-32 | POST | /hostel-visitor-logs | hostel.mark | Check in a visitor (guardian link, ID proof last 4 only) | HostelVisitorLog, Guardian |
| HST-API-33 | POST | /hostel-visitor-logs/:id/check-out | hostel.mark | Set checkOutAt | HostelVisitorLog |
| HST-API-34 | GET | /hostel-leave-requests | hostel.view | List out-pass requests (hostel, status, leaveType, date range, not returned) | HostelLeaveRequest |
| HST-API-35 | POST | /hostel-leave-requests | hostel.mark | Staff raises an out-pass for a resident | HostelLeaveRequest |
| HST-API-36 | GET | /hostel-leave-requests/:id | hostel.view | Request with escort and gate timestamps | HostelLeaveRequest |
| HST-API-37 | POST | /hostel-leave-requests/:id/approve | hostel.approve | PENDING to APPROVED (approvedById, approvedAt) | HostelLeaveRequest |
| HST-API-38 | POST | /hostel-leave-requests/:id/reject | hostel.approve | PENDING to REJECTED with remarks | HostelLeaveRequest |
| HST-API-39 | POST | /hostel-leave-requests/:id/cancel | hostel.mark | Cancel a request not yet checked out | HostelLeaveRequest |
| HST-API-40 | POST | /hostel-leave-requests/:id/check-out | hostel.mark | Gate out: checkedOutAt, escort verified | HostelLeaveRequest |
| HST-API-41 | POST | /hostel-leave-requests/:id/check-in | hostel.mark | Return: checkedInAt; late return flagged | HostelLeaveRequest |
| HST-API-42 | GET | /hostel-leave-requests/:id/pdf | hostel.view | Out-pass / gate-pass PDF | HostelLeaveRequest, FileAsset |
| HST-API-43 | GET | /portal/parent/hostel | parentportal.access | Child's hostel, room, bed, warden contact and recent roll call | HostelAllocation, HostelAttendance |
| HST-API-44 | GET | /portal/parent/hostel-leave-requests | parentportal.access | Child's out-pass requests and status | HostelLeaveRequest |
| HST-API-45 | POST | /portal/parent/hostel-leave-requests | parentportal.access | Parent requests an out-pass (leaveType, dates, escort) | HostelLeaveRequest |
| HST-API-46 | POST | /portal/parent/hostel-leave-requests/:id/cancel | parentportal.access | Parent cancels a PENDING or not-started request | HostelLeaveRequest |
| HST-API-47 | GET | /portal/student/hostel | studentportal.access | Own hostel, room, bed and out-pass history | HostelAllocation, HostelLeaveRequest |

Events emitted: hostel.allocation.reserved, hostel.allocation.checked_in, hostel.allocation.transferred, hostel.allocation.vacated, hostel.allocation.cancelled, hostel.attendance.marked, hostel.student.absent, hostel.student.late_entry, hostel.leave.requested, hostel.leave.approved, hostel.leave.rejected, hostel.leave.cancelled, hostel.leave.checked_out, hostel.leave.returned, hostel.leave.overdue, hostel.visitor.checked_in, hostel.visitor.checked_out

## PRL: Payroll

Resource base path(s): `/salary-components`, `/salary-structures`, `/staff-salaries`, `/payroll-runs`, `/payslips`, `/payroll-adjustments`, `/staff-loan-advances`, `/staff-tax-declarations`, `/payroll-statutory-settings`, `/my-payslips`, `/my-tax-declarations`, `/my-loan-advances`

| ID | Method | Path | Permission | Purpose | Main models |
|---|---|---|---|---|---|
| PRL-API-01 | GET | /salary-components | payroll.view | List pay heads (componentType, statutoryType, status); also dropdown | SalaryComponent |
| PRL-API-02 | POST | /salary-components | payroll.manage | Create pay head (FIXED, PERCENT_OF_BASIC, PERCENT_OF_GROSS, FORMULA); formula validated | SalaryComponent |
| PRL-API-03 | PATCH | /salary-components/:id | payroll.manage | Update pay head or status | SalaryComponent |
| PRL-API-04 | DELETE | /salary-components/:id | payroll.manage | Archive; blocked while used by a structure | SalaryComponent, SalaryStructureItem |
| PRL-API-05 | GET | /salary-structures | payroll.view | List structures (staffType, status); also dropdown | SalaryStructure |
| PRL-API-06 | POST | /salary-structures | payroll.manage | Create structure with component items | SalaryStructure, SalaryStructureItem |
| PRL-API-07 | GET | /salary-structures/:id | payroll.view | Structure with items | SalaryStructure, SalaryStructureItem |
| PRL-API-08 | PATCH | /salary-structures/:id | payroll.manage | Update structure and replace items | SalaryStructure, SalaryStructureItem |
| PRL-API-09 | DELETE | /salary-structures/:id | payroll.manage | Archive; blocked while assigned to staff | SalaryStructure, StaffSalary |
| PRL-API-10 | POST | /salary-structures/:id/preview | payroll.view | Compute the breakup for a CTC or gross amount (formula check) | SalaryStructure, SalaryStructureItem |
| PRL-API-11 | GET | /staff-salaries | payroll.view | Current salary per staff; `staffId` returns the revision history | StaffSalary |
| PRL-API-12 | POST | /staff-salaries | payroll.manage | Assign salary or revision from effectiveFrom; closes the previous row | StaffSalary |
| PRL-API-13 | GET | /staff-salaries/:id | payroll.view | Revision with computed component breakup | StaffSalary, SalaryStructureItem |
| PRL-API-14 | PATCH | /staff-salaries/:id | payroll.manage | Correct a revision not yet used by a payslip | StaffSalary |
| PRL-API-15 | POST | /staff-salaries/bulk-revise | payroll.manage | Percent or fixed increment for many staff from a date (new rows) | StaffSalary |
| PRL-API-16 | GET | /payroll-runs | payroll.view | List runs (campus, year, month, runType, status) | PayrollRun |
| PRL-API-17 | POST | /payroll-runs | payroll.process | Create DRAFT run (campus, month, year, runType, runNo) | PayrollRun |
| PRL-API-18 | GET | /payroll-runs/:id | payroll.view | Run with totals, payslips and exceptions (no salary, no bank account) | PayrollRun, Payslip |
| PRL-API-19 | DELETE | /payroll-runs/:id | payroll.process | Delete a DRAFT run with its DRAFT payslips | PayrollRun, Payslip |
| PRL-API-20 | GET | /payroll-runs/summary | payroll.view | Dashboard: month cost, net pay, headcount, pending approvals, loans outstanding | PayrollRun, StaffLoanAdvance, PayrollAdjustment |
| PRL-API-21 | POST | /payroll-runs/:id/process | payroll.process | Calculate payslips (salary, paid / LOP days, lecture units, adjustments, EMIs, statutory); DRAFT to PROCESSED (worker) | PayrollRun, Payslip, PayslipItem, StaffAttendance |
| PRL-API-22 | POST | /payroll-runs/:id/approve | payroll.approve | PROCESSED to APPROVED; payslips FINALIZED | PayrollRun, Payslip |
| PRL-API-23 | POST | /payroll-runs/:id/reopen | payroll.approve | PROCESSED or APPROVED back to DRAFT for recalculation | PayrollRun, Payslip |
| PRL-API-24 | POST | /payroll-runs/:id/mark-paid | payroll.process | APPROVED to PAID; paymentDate and references; payslips PAID; loan balances updated | PayrollRun, Payslip, StaffLoanAdvance |
| PRL-API-25 | POST | /payroll-runs/:id/lock | payroll.approve | PAID to LOCKED (final, lockedAt) | PayrollRun |
| PRL-API-26 | POST | /payroll-runs/:id/send-payslips | payroll.process | Generate payslip PDFs and send them to staff (sentAt) | Payslip, FileAsset |
| PRL-API-27 | POST | /payroll-runs/:id/bank-file | payroll.export | Bank transfer sheet of the run (XLSX / CSV) | ExportJob, Payslip |
| PRL-API-28 | POST | /payroll-runs/:id/statutory-reports | payroll.export | PF ECR, ESI, PT, TDS or LWF file by `type` | ExportJob, Payslip, PayrollStatutorySetting |
| PRL-API-29 | GET | /payslips | payroll.view | List payslips (run, staff, year, month, status) | Payslip |
| PRL-API-30 | GET | /payslips/:id | payroll.view | Payslip with earning and deduction lines | Payslip, PayslipItem |
| PRL-API-31 | PATCH | /payslips/:id | payroll.process | Edit a DRAFT payslip (paidDays, lopDays, unitsWorked, paymentMode); recalculate | Payslip, PayslipItem |
| PRL-API-32 | POST | /payslips/:id/hold | payroll.process | Status ON_HOLD with holdReason | Payslip |
| PRL-API-33 | POST | /payslips/:id/release | payroll.process | ON_HOLD to FINALIZED | Payslip |
| PRL-API-34 | POST | /payslips/:id/cancel | payroll.approve | Status CANCELLED with cancelReason (audited) | Payslip, AuditLog |
| PRL-API-35 | GET | /payslips/:id/pdf | payroll.view | Payslip PDF | Payslip, FileAsset |
| PRL-API-36 | POST | /payslips/export | payroll.export | Salary register or payslip ZIP (XLSX / PDF / ZIP) | ExportJob |
| PRL-API-37 | GET | /payroll-adjustments | payroll.view | List one-off earnings and deductions (staff, year, month, type, status) | PayrollAdjustment |
| PRL-API-38 | POST | /payroll-adjustments | payroll.manage | Create adjustment (bonus, arrears, overtime, fine ...) as PENDING | PayrollAdjustment |
| PRL-API-39 | PATCH | /payroll-adjustments/:id | payroll.manage | Update a PENDING adjustment | PayrollAdjustment |
| PRL-API-40 | DELETE | /payroll-adjustments/:id | payroll.manage | Delete (soft) an adjustment not yet applied to a payslip | PayrollAdjustment |
| PRL-API-41 | POST | /payroll-adjustments/:id/approve | payroll.approve | PENDING to APPROVED; picked up by the next run | PayrollAdjustment |
| PRL-API-42 | POST | /payroll-adjustments/:id/reject | payroll.approve | PENDING to REJECTED | PayrollAdjustment |
| PRL-API-43 | POST | /payroll-adjustments/import | payroll.import | Excel import of adjustments for a month (ImportType OTHER) | ImportJob, PayrollAdjustment |
| PRL-API-44 | GET | /staff-loan-advances | payroll.view | List loans and advances (staff, loanType, status) with balance | StaffLoanAdvance |
| PRL-API-45 | POST | /staff-loan-advances | payroll.manage | Create loan or salary advance with EMI plan (PENDING) | StaffLoanAdvance |
| PRL-API-46 | GET | /staff-loan-advances/:id | payroll.view | Loan with recovery history from payslip lines | StaffLoanAdvance, PayslipItem |
| PRL-API-47 | PATCH | /staff-loan-advances/:id | payroll.manage | Update a PENDING loan; reschedule EMI of an ACTIVE loan | StaffLoanAdvance |
| PRL-API-48 | POST | /staff-loan-advances/:id/approve | payroll.approve | PENDING to APPROVED | StaffLoanAdvance |
| PRL-API-49 | POST | /staff-loan-advances/:id/reject | payroll.approve | PENDING to REJECTED | StaffLoanAdvance |
| PRL-API-50 | POST | /staff-loan-advances/:id/disburse | payroll.process | APPROVED to ACTIVE (disbursedOn, recoveryStartDate) | StaffLoanAdvance |
| PRL-API-51 | POST | /staff-loan-advances/:id/close | payroll.process | ACTIVE to CLOSED (settled early) or CANCELLED before disbursal | StaffLoanAdvance |
| PRL-API-52 | GET | /staff-tax-declarations | payroll.view | List declarations (financialYear, status, regime) | StaffTaxDeclaration |
| PRL-API-53 | GET | /staff-tax-declarations/:id | payroll.view | Declaration with sections and proof files | StaffTaxDeclaration, FileAsset |
| PRL-API-54 | POST | /staff-tax-declarations/:id/verify | payroll.approve | Verify proofs per section; APPROVED or REJECTED (verifiedAt) | StaffTaxDeclaration |
| PRL-API-55 | GET | /payroll-statutory-settings | payroll.view | Employer registrations for the organization and campuses | PayrollStatutorySetting |
| PRL-API-56 | PUT | /payroll-statutory-settings/:campusKey | payroll.manage | Upsert registrations and wage ceilings for `ALL` or one campus | PayrollStatutorySetting |
| PRL-API-57 | GET | /my-payslips | self | Own FINALIZED and PAID payslips | Payslip |
| PRL-API-58 | GET | /my-payslips/:id/pdf | self | Own payslip PDF | Payslip, FileAsset |
| PRL-API-59 | GET | /my-tax-declarations | self | Own declarations by financial year | StaffTaxDeclaration |
| PRL-API-60 | PUT | /my-tax-declarations/:financialYear | self | Submit or update own declaration and proofs (PENDING until verified) | StaffTaxDeclaration, FileAsset |
| PRL-API-61 | GET | /my-loan-advances | self | Own loans and advances with balance | StaffLoanAdvance |
| PRL-API-62 | POST | /my-loan-advances | self | Request a loan or salary advance (PENDING) | StaffLoanAdvance |

Events emitted: payroll.salary.revised, payroll.run.processed, payroll.run.process_failed, payroll.run.approved, payroll.run.reopened, payroll.run.paid, payroll.run.locked, payroll.payslip.published, payroll.payslip.held, payroll.payslip.cancelled, payroll.adjustment.approved, payroll.adjustment.rejected, payroll.loan.requested, payroll.loan.approved, payroll.loan.rejected, payroll.loan.disbursed, payroll.loan.closed, payroll.tax_declaration.submitted, payroll.tax_declaration.verified

## CRT: Certificates

Resource base path(s): `/certificate-templates`, `/certificate-requests`, `/issued-certificates`, `/public/certificates`, `/portal/parent/certificate-requests`, `/portal/parent/certificates`, `/portal/student/certificate-requests`, `/portal/student/certificates`

| ID | Method | Path | Permission | Purpose | Main models |
|---|---|---|---|---|---|
| CRT-API-01 | GET | /certificate-templates | certificates.view | List templates (certificateType, status, isDefault); also dropdown | CertificateTemplate |
| CRT-API-02 | POST | /certificate-templates | certificates.manage | Create template (body, variables, layout, signatories, fee, requiresApproval) | CertificateTemplate, FileAsset |
| CRT-API-03 | GET | /certificate-templates/:id | certificates.view | Template detail | CertificateTemplate |
| CRT-API-04 | PATCH | /certificate-templates/:id | certificates.manage | Update template or status | CertificateTemplate |
| CRT-API-05 | DELETE | /certificate-templates/:id | certificates.manage | Archive (soft delete); issued certificates keep their snapshot | CertificateTemplate |
| CRT-API-06 | GET | /certificate-templates/variables | certificates.view | Merge variables available per CertificateType | CertificateTemplate |
| CRT-API-07 | POST | /certificate-templates/:id/duplicate | certificates.manage | Copy a template | CertificateTemplate |
| CRT-API-08 | POST | /certificate-templates/:id/set-default | certificates.manage | Make it the default of its certificateType | CertificateTemplate |
| CRT-API-09 | POST | /certificate-templates/:id/preview | certificates.view | Sample PDF with a chosen student's data or dummy values | CertificateTemplate, Student |
| CRT-API-10 | GET | /certificate-requests | certificates.view | List requests (campus, status, type, student, date range) | CertificateRequest |
| CRT-API-11 | POST | /certificate-requests | certificates.create | Staff raises a request for a student | CertificateRequest |
| CRT-API-12 | GET | /certificate-requests/:id | certificates.view | Request with review remarks, fee invoice and issued certificate | CertificateRequest, FeeInvoice, IssuedCertificate |
| CRT-API-13 | POST | /certificate-requests/:id/approve | certificates.approve | PENDING to APPROVED; raises the fee invoice when the template has feeAmount | CertificateRequest, FeeInvoice |
| CRT-API-14 | POST | /certificate-requests/:id/reject | certificates.approve | PENDING to REJECTED with reviewRemarks | CertificateRequest |
| CRT-API-15 | POST | /certificate-requests/:id/cancel | certificates.create | Cancel a PENDING or APPROVED request | CertificateRequest |
| CRT-API-16 | POST | /certificate-requests/:id/issue | certificates.issue | Issue from an APPROVED request (fee paid or waived); request ISSUED | CertificateRequest, IssuedCertificate |
| CRT-API-17 | GET | /certificate-requests/summary | certificates.view | Dashboard: pending requests, issued this month by type, verifications | CertificateRequest, IssuedCertificate |
| CRT-API-18 | GET | /issued-certificates | certificates.view | List issued certificates (campus, type, student, serialNo, revoked) | IssuedCertificate |
| CRT-API-19 | POST | /issued-certificates | certificates.issue | Direct issue: serialNo from CERTIFICATE_NO, data snapshot, QR verificationCode, PDF job | IssuedCertificate, NumberSequence, FileAsset |
| CRT-API-20 | GET | /issued-certificates/:id | certificates.view | Certificate with snapshot and verification count | IssuedCertificate |
| CRT-API-21 | GET | /issued-certificates/:id/pdf | certificates.view | Certificate PDF | IssuedCertificate, FileAsset |
| CRT-API-22 | POST | /issued-certificates/:id/revoke | certificates.revoke | Revoke with revokeReason (audited); public page shows REVOKED | IssuedCertificate, AuditLog |
| CRT-API-23 | POST | /issued-certificates/:id/reissue | certificates.issue | Revoke and issue a corrected certificate with a new serialNo | IssuedCertificate |
| CRT-API-24 | POST | /issued-certificates/:id/send | certificates.issue | Send the PDF link to the parent or student (WhatsApp / email) | IssuedCertificate |
| CRT-API-25 | POST | /issued-certificates/bulk | certificates.issue | Issue one type for a batch or student list (worker; ZIP of PDFs) | IssuedCertificate, ExportJob |
| CRT-API-26 | POST | /issued-certificates/export | certificates.export | Export the issue register (XLSX / PDF) | ExportJob |
| CRT-API-27 | GET | /public/certificates/:verificationCode | public | Verify a certificate: VALID or REVOKED, institute, masked student name, type, serialNo, issueDate; counts the check | IssuedCertificate, Organization |
| CRT-API-28 | POST | /portal/parent/certificate-requests/:id/cancel | parentportal.access | Parent cancels a PENDING request | CertificateRequest |
| CRT-API-29 | GET | /portal/parent/certificates | parentportal.access | Child's issued certificates with PDF links | IssuedCertificate, FileAsset |
| CRT-API-30 | POST | /portal/student/certificate-requests/:id/cancel | studentportal.access | Student cancels a PENDING request | CertificateRequest |
| CRT-API-31 | GET | /portal/student/certificates | studentportal.access | Own issued certificates with PDF links | IssuedCertificate, FileAsset |

Events emitted: certificate.request.submitted, certificate.request.approved, certificate.request.rejected, certificate.request.cancelled, certificate.issued, certificate.reissued, certificate.revoked, certificate.sent, certificate.bulk_issue.completed, certificate.verified

## ANL: Analytics

Resource base path(s): `/report-library`, `/report-datasets`, `/saved-reports`, `/report-schedules`, `/analytics`, `/daily-metric-snapshots`

| ID | Method | Path | Permission | Purpose | Main models |
|---|---|---|---|---|---|
| ANL-API-01 | GET | /report-library | analytics.view | Catalogue of standard (code-defined) reports by ReportCategory, limited to the caller's module permissions | — |
| ANL-API-02 | GET | /report-library/:reportKey | analytics.view | Report metadata: parameters, columns, default chart | — |
| ANL-API-03 | POST | /report-library/:reportKey/run | analytics.view | Run a standard report with filters; paged rows, totals, chart series | source models of the report, DailyMetricSnapshot |
| ANL-API-04 | POST | /report-library/:reportKey/export | analytics.export | Export a standard report (XLSX / CSV / PDF) | ExportJob |
| ANL-API-05 | GET | /report-datasets | analytics.build | Report-builder datasets (code-defined) with fields, filter operators and allowed groupings | — |
| ANL-API-06 | GET | /saved-reports | analytics.view | Own and shared reports (category, owner, q) | SavedReport |
| ANL-API-07 | POST | /saved-reports | analytics.build | Save a definition (dataset, columns, filters, groupBy, sort, chart) | SavedReport |
| ANL-API-08 | GET | /saved-reports/:id | analytics.view | Report definition with schedules | SavedReport, ReportSchedule |
| ANL-API-09 | PATCH | /saved-reports/:id | analytics.build | Update own report | SavedReport |
| ANL-API-10 | DELETE | /saved-reports/:id | analytics.build | Delete (soft) own report; its schedules stop | SavedReport, ReportSchedule |
| ANL-API-11 | POST | /saved-reports/preview | analytics.build | Run an unsaved definition (first 100 rows) | source models of the dataset |
| ANL-API-12 | POST | /saved-reports/:id/run | analytics.view | Run the report; paged rows and chart series; sets lastRunAt | SavedReport |
| ANL-API-13 | POST | /saved-reports/:id/duplicate | analytics.build | Copy a report to the caller | SavedReport |
| ANL-API-14 | POST | /saved-reports/:id/share | analytics.build | Set isShared and sharedRoleKeys | SavedReport |
| ANL-API-15 | POST | /saved-reports/:id/export | analytics.export | Export the report (XLSX / CSV / PDF) | ExportJob |
| ANL-API-16 | GET | /report-schedules | analytics.view | List schedules (report, frequency, isActive, lastRunStatus) | ReportSchedule |
| ANL-API-17 | POST | /report-schedules | analytics.schedule | Schedule email delivery of a saved report (frequency, time, format, recipients) | ReportSchedule |
| ANL-API-18 | PATCH | /report-schedules/:id | analytics.schedule | Update schedule; recompute nextRunAt | ReportSchedule |
| ANL-API-19 | DELETE | /report-schedules/:id | analytics.schedule | Delete schedule | ReportSchedule |
| ANL-API-20 | POST | /report-schedules/:id/pause | analytics.schedule | isActive false | ReportSchedule |
| ANL-API-21 | POST | /report-schedules/:id/resume | analytics.schedule | isActive true; recompute nextRunAt | ReportSchedule |
| ANL-API-22 | POST | /report-schedules/:id/run-now | analytics.schedule | Deliver once immediately | ReportSchedule, ExportJob |
| ANL-API-23 | GET | /analytics/kpis | analytics.view | Headline KPIs for a period and campus with previous-period change | DailyMetricSnapshot |
| ANL-API-24 | GET | /analytics/trends | analytics.view | Time series of chosen metrics (day / week / month) | DailyMetricSnapshot |
| ANL-API-25 | GET | /analytics/campus-comparison | analytics.view | Campus-by-campus KPI table | DailyMetricSnapshot, Campus |
| ANL-API-26 | GET | /analytics/admissions | analytics.view | Funnel inquiry to enrolled by source, course and counsellor | AdmissionInquiry, AdmissionApplication |
| ANL-API-27 | GET | /analytics/attendance | analytics.view | Attendance by course, batch and weekday; chronic absentees | AttendanceRecord, DailyMetricSnapshot |
| ANL-API-28 | GET | /analytics/fees | analytics.view | Invoiced vs collected, dues ageing, method mix, online share | FeeInvoice, Payment, DailyMetricSnapshot |
| ANL-API-29 | GET | /analytics/academics | analytics.view | Exam results by batch and subject; pass percent; grade distribution | ExamMark, ReportCard |
| ANL-API-30 | GET | /analytics/communication | analytics.view | Messages by channel, delivery rate and cost | MessageLog |
| ANL-API-31 | GET | /daily-metric-snapshots | analytics.view | Raw daily snapshot rows (campusKey, date range) | DailyMetricSnapshot |
| ANL-API-32 | POST | /daily-metric-snapshots/rebuild | analytics.manage | Recompute snapshots for a date range (worker) | DailyMetricSnapshot |

Events emitted: analytics.report.saved, analytics.report.shared, analytics.schedule.created, analytics.schedule.delivered, analytics.schedule.failed, analytics.snapshot.computed, analytics.snapshot.rebuilt

## AI: AI Insights

Resource base path(s): `/ai-insights`, `/student-risk-scores`, `/students/:id/risk-scores`, `/ai-queries`, `/ai-usage-quotas`

| ID | Method | Path | Permission | Purpose | Main models |
|---|---|---|---|---|---|
| AI-API-01 | GET | /ai-insights | ai.view | Insight feed (campus, insightType, severity, status, entity); stale rows hidden after validUntil | AiInsight |
| AI-API-02 | GET | /ai-insights/:id | ai.view | Insight with explanation, evidence and suggested action | AiInsight |
| AI-API-03 | GET | /ai-insights/summary | ai.view | Dashboard widget: counts by severity, type and status | AiInsight |
| AI-API-04 | POST | /ai-insights/:id/mark-seen | ai.view | NEW to SEEN (seenAt) | AiInsight |
| AI-API-05 | POST | /ai-insights/:id/act | ai.update | Status ACTED with actionTaken | AiInsight |
| AI-API-06 | POST | /ai-insights/:id/dismiss | ai.update | Status DISMISSED with dismissReason | AiInsight |
| AI-API-07 | POST | /ai-insights/:id/feedback | ai.view | Save wasHelpful | AiInsight |
| AI-API-08 | POST | /ai-insights/bulk-mark-seen | ai.view | Mark many insights SEEN | AiInsight |
| AI-API-09 | POST | /ai-insights/generate | ai.manage | Run the insight engine now for a campus (worker; counts insightRunsUsed) | AiInsight, AiUsageQuota |
| AI-API-10 | GET | /student-risk-scores | ai.view | Latest scores (campus, batch, riskLevel, risk kind) with top factors | StudentRiskScore, Student |
| AI-API-11 | GET | /students/:id/risk-scores | ai.view | Score history and factors of one student | StudentRiskScore |
| AI-API-12 | POST | /student-risk-scores/recompute | ai.manage | Recompute scores for a campus or batch (worker) | StudentRiskScore |
| AI-API-13 | POST | /student-risk-scores/export | ai.export | Export the at-risk list (XLSX) | ExportJob |
| AI-API-14 | GET | /ai-queries | ai.query | Own question history; `scope=all` needs ai.manage | AiQueryLog |
| AI-API-15 | POST | /ai-queries | ai.query | Ask a question in plain language; permission-checked query plan, summary and rows; quota enforced | AiQueryLog, AiUsageQuota |
| AI-API-16 | GET | /ai-queries/:id | ai.query | One question with summary and result | AiQueryLog |
| AI-API-17 | GET | /ai-queries/suggestions | ai.query | Suggested questions for the caller's role | AiQueryLog |
| AI-API-18 | POST | /ai-queries/:id/feedback | ai.query | Save feedbackRating 1-5 | AiQueryLog |
| AI-API-19 | GET | /ai-usage-quotas | ai.manage | Monthly usage history (queries, tokens, cost) | AiUsageQuota |
| AI-API-20 | GET | /ai-usage-quotas/current | ai.view | This month's limits and usage | AiUsageQuota |

Events emitted: ai.insight.generated, ai.insight.critical, ai.insight.acted, ai.insight.dismissed, ai.student.risk_level_changed, ai.risk_scores.computed, ai.quota.threshold_reached, ai.quota.exhausted

## SET: Settings

Resource base path(s): `/settings`, `/number-sequences`, `/custom-fields`, `/payment-gateway-accounts`, `/policy-documents`, `/consent-records`, `/data-subject-requests`, `/data-breach-incidents`, `/api-keys`, `/public/policy-documents`, `/my-consents`, `/my-data-subject-requests`

Setting groups (`:group`): `general` (Organization columns timezone, locale, financialYearStartMonth, weekStartsOn), `academic` (working days, attendance mode, default grade scale, promotion and roll-number rules), `attendance`, `fees`, `payments`, `communication`, `portal`, `library`, `inventory`, `transport`, `hostel`, `payroll`, `certificates`, `ai`, `privacy`, `security`. All groups except `general` are `OrganizationSetting` rows with keys named `<group>.<key>`. `effective` and `branding` are reserved words, not groups.

| ID | Method | Path | Permission | Purpose | Main models |
|---|---|---|---|---|---|
| SET-API-01 | GET | /settings | settings.view | All groups with effective values (organization default + campus override) | OrganizationSetting, Organization |
| SET-API-02 | GET | /settings/:group | settings.view | One group (organization settings, academic settings, module rules) with defaults and overrides | OrganizationSetting, Organization |
| SET-API-03 | PUT | /settings/:group | settings.update | Upsert the keys of a group (Zod schema per group); `campusId` writes a campus override | OrganizationSetting, Organization, AuditLog |
| SET-API-04 | POST | /settings/:group/reset | settings.update | Reset a group, or one campus override, to defaults | OrganizationSetting |
| SET-API-05 | GET | /settings/effective | self | Effective non-secret values of requested keys for the caller's campus (UI bootstrap) | OrganizationSetting |
| SET-API-06 | GET | /settings/branding | settings.view | Logo, colours, favicon, receipt footer, custom domain | Organization |
| SET-API-07 | PUT | /settings/branding | settings.update | Update logoUrl and branding JSON; hideEduflowBranding and customDomain are plan-gated | Organization, FileAsset |
| SET-API-08 | POST | /settings/branding/verify-domain | settings.update | Check DNS of the custom domain before it goes live (Enterprise) | Organization |
| SET-API-09 | GET | /number-sequences | settings.view | List series (sequenceType, campus, periodKey) with nextValue | NumberSequence |
| SET-API-10 | POST | /number-sequences | settings.manage | Create a series for a type, optionally per campus | NumberSequence |
| SET-API-11 | PATCH | /number-sequences/:id | settings.manage | Update prefix, suffix, format, padLength, resetPolicy; nextValue may only go up | NumberSequence, AuditLog |
| SET-API-12 | POST | /number-sequences/preview | settings.view | Preview the next numbers for a format; checks maxLength | NumberSequence |
| SET-API-13 | GET | /custom-fields | settings.view | List definitions by entityType and status | CustomFieldDefinition |
| SET-API-14 | POST | /custom-fields | settings.manage | Create definition (fieldType, options, validation, visibility flags) | CustomFieldDefinition |
| SET-API-15 | PATCH | /custom-fields/:id | settings.manage | Update label, options, validation, flags; key and fieldType are fixed once values exist | CustomFieldDefinition, CustomFieldValue |
| SET-API-16 | DELETE | /custom-fields/:id | settings.manage | Archive definition (soft delete); values are kept | CustomFieldDefinition |
| SET-API-17 | POST | /custom-fields/reorder | settings.manage | Save sortOrder within an entityType | CustomFieldDefinition |
| SET-API-18 | GET | /custom-fields/form-schema | self | ACTIVE definitions of an entityType for rendering forms and lists | CustomFieldDefinition |
| SET-API-19 | GET | /payment-gateway-accounts/:id | settings.view | Account with the webhook URL to configure at the provider | PaymentGatewayAccount |
| SET-API-20 | POST | /payment-gateway-accounts/:id/set-default | settings.manage_gateways | Make it the default account of the organization | PaymentGatewayAccount |
| SET-API-21 | GET | /policy-documents | settings.view | List notice versions (consentType, language, effective / retired), own and platform | PolicyDocument |
| SET-API-22 | POST | /policy-documents | settings.manage_privacy | Publish a new version (body, contentHash, effectiveFrom) | PolicyDocument |
| SET-API-23 | GET | /policy-documents/:id | settings.view | Full text of one version | PolicyDocument |
| SET-API-24 | POST | /policy-documents/:id/retire | settings.manage_privacy | Set retiredAt | PolicyDocument |
| SET-API-25 | GET | /consent-records | settings.manage_privacy | Consent register (consentType, status, student, guardian, method) | ConsentRecord |
| SET-API-26 | POST | /consent-records | settings.manage_privacy | Record offline consent (SIGNED_FORM / IN_PERSON) with evidence file | ConsentRecord, FileAsset |
| SET-API-27 | GET | /consent-records/coverage | settings.manage_privacy | Students with and without valid CHILD_DATA_PROCESSING consent, by batch | ConsentRecord, Student |
| SET-API-28 | POST | /consent-records/:id/withdraw | settings.manage_privacy | Withdraw on the person's behalf (withdrawalReason) | ConsentRecord |
| SET-API-29 | POST | /consent-records/send-requests | settings.manage_privacy | Send OTP-verified consent requests to selected guardians | ConsentRecord, OtpCode |
| SET-API-30 | POST | /consent-records/export | settings.export | Export the consent register (XLSX) | ExportJob |
| SET-API-31 | GET | /data-subject-requests | settings.manage_privacy | List privacy requests (status, requestType, dueDate, overdue) | DataSubjectRequest |
| SET-API-32 | POST | /data-subject-requests | settings.manage_privacy | Log a request received by email, letter or phone; requestNo from DSR_REQUEST_NO; dueDate by regulation | DataSubjectRequest, NumberSequence |
| SET-API-33 | GET | /data-subject-requests/:id | settings.manage_privacy | Request with timeline and actions taken | DataSubjectRequest |
| SET-API-34 | PATCH | /data-subject-requests/:id | settings.manage_privacy | Assign handler, notes, extendedDueDate with extensionReason | DataSubjectRequest |
| SET-API-35 | POST | /data-subject-requests/:id/acknowledge | settings.manage_privacy | RECEIVED to IDENTITY_VERIFICATION (acknowledgedAt) | DataSubjectRequest |
| SET-API-36 | POST | /data-subject-requests/:id/verify-identity | settings.manage_privacy | Record method; status IN_PROGRESS (identityVerifiedAt) | DataSubjectRequest |
| SET-API-37 | POST | /data-subject-requests/:id/complete | settings.manage_privacy | Status COMPLETED with actionsTaken; ACCESS / EXPORT builds the data package (worker) | DataSubjectRequest, FileAsset |
| SET-API-38 | POST | /data-subject-requests/:id/reject | settings.manage_privacy | Status REJECTED with rejectionReason | DataSubjectRequest |
| SET-API-39 | GET | /data-subject-requests/:id/download-url | settings.manage_privacy | Pre-signed URL of the data package (audited sensitive read) | DataSubjectRequest, FileAsset, AuditLog |
| SET-API-40 | GET | /data-breach-incidents | settings.manage_privacy | Breach register (severity, status, notification due) | DataBreachIncident |
| SET-API-41 | POST | /data-breach-incidents | settings.manage_privacy | Report an incident; regulatorNotifyDueAt computed (72 h rule) | DataBreachIncident |
| SET-API-42 | PATCH | /data-breach-incidents/:id | settings.manage_privacy | Update scope, root cause, remediation and notification times | DataBreachIncident |
| SET-API-43 | POST | /data-breach-incidents/:id/change-status | settings.manage_privacy | Move to INVESTIGATING, CONTAINED, NOTIFIED or CLOSED | DataBreachIncident |
| SET-API-44 | GET | /api-keys | settings.manage_api_keys | List keys (keyPrefix, scopes, status, lastUsedAt, expiresAt) | ApiKey |
| SET-API-45 | POST | /api-keys | settings.manage_api_keys | Create key with scopes, allowedIps, rate limit, expiry; full key shown once (Enterprise) | ApiKey |
| SET-API-46 | PATCH | /api-keys/:id | settings.manage_api_keys | Update name, scopes, allowedIps, rateLimitPerMin, expiresAt | ApiKey |
| SET-API-47 | POST | /api-keys/:id/rotate | settings.manage_api_keys | Issue a new secret and revoke the old one | ApiKey |
| SET-API-48 | POST | /api-keys/:id/revoke | settings.manage_api_keys | Set revokedAt; status INACTIVE | ApiKey, AuditLog |
| SET-API-49 | GET | /public/policy-documents | public | Current notices of an organization (`slug`, consentType, language) for signup and online forms | PolicyDocument |
| SET-API-50 | GET | /my-consents | self | Own consents (and for own children) plus notices awaiting consent | ConsentRecord, PolicyDocument |
| SET-API-51 | POST | /my-consents | self | Grant consent; child data needs OTP verification | ConsentRecord, OtpCode |
| SET-API-52 | POST | /my-consents/:id/withdraw | self | Withdraw own consent | ConsentRecord |
| SET-API-53 | GET | /my-data-subject-requests | self | Own privacy requests and status | DataSubjectRequest |
| SET-API-54 | POST | /my-data-subject-requests | self | Raise an access, export, correction or deletion request | DataSubjectRequest, NumberSequence |
| SET-API-55 | POST | /my-data-subject-requests/:id/cancel | self | Cancel own request before completion | DataSubjectRequest |

Events emitted: settings.updated, settings.branding.updated, settings.number_sequence.updated, settings.custom_field.created, settings.custom_field.archived, payment_gateway.connected, payment_gateway.verification_failed, payment_gateway.disconnected, api_key.created, api_key.rotated, api_key.revoked, api_key.expiring, policy.published, consent.requested, consent.granted, consent.withdrawn, dsr.received, dsr.due_soon, dsr.completed, dsr.rejected, data_breach.reported, data_breach.notification_due, data_breach.closed

## CMN: Common cross-cutting endpoints

Resource base path(s): `/files`, `/import-templates`, `/import-jobs`, `/export-jobs`, `/audit-logs`, `/search`, `/health`, `/countries`, `/currencies`, `/exchange-rates`, `/reference-data`

| ID | Method | Path | Permission | Purpose | Main models |
|---|---|---|---|---|---|
| CMN-API-01 | GET | /files | files.view | List files by ownerType + ownerId or category | FileAsset |
| CMN-API-02 | POST | /files/presign-upload | files.create | Create a PENDING_UPLOAD row and a pre-signed S3 PUT URL; MIME type and size checked | FileAsset |
| CMN-API-03 | GET | /files/:id | files.view | File metadata | FileAsset |
| CMN-API-04 | DELETE | /files/:id | files.delete | Status DELETED + deletedAt; the S3 object is purged by a worker | FileAsset |
| CMN-API-05 | POST | /files/:id/confirm | files.create | Confirm the upload: size, checksum, virus scan; ACTIVE or QUARANTINED | FileAsset |
| CMN-API-06 | GET | /files/:id/download-url | files.view | Short-lived pre-signed GET URL; access to the owning record is checked | FileAsset, AuditLog |
| CMN-API-07 | POST | /files/bulk-download | files.view | ZIP of selected files | ExportJob, FileAsset |
| CMN-API-08 | GET | /import-templates | imports.view | Import types with required and optional columns | ImportJob |
| CMN-API-09 | GET | /import-templates/:importType | imports.view | Download the XLSX template with a sample row and custom-field columns | CustomFieldDefinition |
| CMN-API-10 | GET | /import-jobs | imports.view | List import jobs (importType, status, createdBy, date range) | ImportJob |
| CMN-API-11 | POST | /import-jobs | imports.create | Start an import of any ImportType (migration wizard); the module's `.import` key is also checked | ImportJob, FileAsset |
| CMN-API-12 | GET | /import-jobs/:id | imports.view | Status and row counters (total, processed, success, failed) | ImportJob |
| CMN-API-13 | POST | /import-jobs/detect-columns | imports.create | Read the header row of an uploaded file and suggest the columnMapping | FileAsset |
| CMN-API-14 | GET | /import-jobs/:id/errors | imports.view | Paged rejected rows with errorCode and message | ImportJobRowError |
| CMN-API-15 | GET | /import-jobs/:id/error-file | imports.view | Pre-signed URL of the error workbook | ImportJob, FileAsset |
| CMN-API-16 | POST | /import-jobs/:id/commit | imports.create | Run a COMPLETED dry run for real (new job, same file and mapping) | ImportJob |
| CMN-API-17 | POST | /import-jobs/:id/cancel | imports.create | QUEUED or PROCESSING to CANCELLED | ImportJob |
| CMN-API-18 | GET | /export-jobs | self | Own export jobs (exportType, status) | ExportJob |
| CMN-API-19 | GET | /export-jobs/:id | self | Status, rowCount, expiresAt | ExportJob |
| CMN-API-20 | GET | /export-jobs/:id/download-url | self | Pre-signed URL of the finished file until expiresAt | ExportJob, FileAsset |
| CMN-API-21 | POST | /export-jobs/:id/cancel | self | QUEUED or PROCESSING to CANCELLED | ExportJob |
| CMN-API-22 | GET | /audit-logs | audit.view | Search the trail (actor, action, entityType, entityId, campus, outcome, date range, requestId) | AuditLog |
| CMN-API-23 | GET | /audit-logs/:id | audit.view | One entry with before / after diff (sensitive fields masked) | AuditLog |
| CMN-API-24 | GET | /audit-logs/filters | audit.view | Distinct actions, entity types and actors for filter dropdowns | AuditLog |
| CMN-API-25 | POST | /audit-logs/export | audit.export | Export filtered entries (XLSX / CSV) | ExportJob |
| CMN-API-26 | POST | /audit-logs/verify-chain | audit.manage | Verify the prevHash / rowHash chain for a period | AuditLog |
| CMN-API-27 | GET | /search | self | Global search (students, guardians, staff, inquiries, invoices, receipts); results limited by the caller's permissions and campuses | Student, Guardian, Staff, AdmissionInquiry, FeeInvoice, Receipt |
| CMN-API-28 | GET | /health | public | Liveness: process up, version, uptime | — |
| CMN-API-29 | GET | /health/ready | public | Readiness: PostgreSQL, Redis, S3 and queue checks; 503 when one fails | — |
| CMN-API-30 | GET | /countries | public | Countries with dial code, default currency, timezone, locale, tax labels (`isSupported` filter) | Country |
| CMN-API-31 | GET | /currencies | public | Active ISO 4217 currencies with symbol and decimal digits | Currency |
| CMN-API-32 | GET | /exchange-rates | self | Latest or dated rates for a currency pair | ExchangeRate |
| CMN-API-33 | GET | /reference-data/enums | self | Enum values with localized labels for dropdowns | — |
| CMN-API-34 | PATCH | /countries/:code | platform.manage | Update country defaults, tax data, isSupported | Country |
| CMN-API-35 | PATCH | /currencies/:code | platform.manage | Update symbol, decimal digits, isActive | Currency |
| CMN-API-36 | POST | /exchange-rates | platform.manage | Upsert daily rates (manual or feed) | ExchangeRate |

Events emitted: file.uploaded, file.quarantined, file.deleted, import.started, import.completed, import.completed_with_errors, import.failed, export.completed, export.failed, audit.chain.mismatch
