# EduFlow API Registry — 02-academics

Modules in this file: ATT, LEV, BAT, TT, SUB, HW, EXM, RPT. Paths are relative to `/api/v1`. Envelopes, pagination, filters and error codes follow the canon.

Conventions used in this file:

- Tenant comes from the JWT; campus scope from `X-Campus-Id`. `TEACHER` scope `Own` = batches where the user is `Batch.classTeacherId` or has a `BatchSubjectTeacher` row. `Own` on staff keys = the user's own `Staff` row.
- Import endpoints take an uploaded `FileAsset` id, create an `ImportJob` and return `202` with the job id. Export / PDF endpoints create an `ExportJob` (`XLSX`, `CSV`, `PDF`, `ZIP`) and return `202` with the job id.
- Parent Portal endpoints take `?studentId=` and verify the child through `StudentGuardian`; Student Portal endpoints resolve the student from the login. Portals return published / visible data only.
- `self` = any authenticated staff user acting on the own record.
- Writes are rejected with `BUSINESS_RULE_VIOLATION` when the `AcademicYear` is `CLOSED`.

## ATT — Attendance

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

## LEV — Leave

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

## BAT — Batch

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

## TT — Timetable

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

## SUB — Subjects

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

## HW — Homework

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

## EXM — Exams

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

## RPT — Report Cards

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

## Permission keys used in this file

| Permission | Meaning |
|---|---|
| self | Any authenticated staff user acting on the own record (no permission key) |
| attendance.view | View student attendance sessions, records and reports |
| attendance.mark | Take student attendance, send absence alerts, push device punches |
| attendance.update | Correct a saved student attendance record |
| attendance.manage | Lock sessions (single and bulk) |
| attendance.unlock | Reopen a locked attendance session |
| attendance.import | Import student or staff attendance from Excel |
| attendance.export | Export student or staff attendance |
| attendance.view_staff | View staff attendance and the staff monthly register |
| attendance.mark_staff | Mark and correct staff attendance |
| leave.view | View leave types, policies, balances and staff leave requests |
| leave.create | Apply for staff leave and cancel it |
| leave.approve | Approve or reject staff leave at the assigned level |
| leave.manage | Configure leave types and policies; allocate, adjust and carry forward balances |
| leave.export | Export leave register and balances |
| leave.view_student | View student leave requests |
| leave.create_student | Record a student leave request on behalf of a parent |
| leave.approve_student | Approve or reject student leave requests |
| batches.view | View academic years, terms, courses, batches, enrollments, rooms, holidays, calendar, PTM bookings |
| batches.create | Create batches and clone them from a previous year |
| batches.update | Update batches and change batch status |
| batches.delete | Delete (soft) batches |
| batches.manage | Configure academic years, terms, courses, rooms, holidays and calendar events |
| batches.enroll | Enroll, update, withdraw students and assign roll numbers |
| batches.promote | Preview and run year-end promotion |
| batches.manage_ptm | Book, update and cancel PTM slots as staff |
| batches.import | Import enrollments from Excel |
| batches.export | Export batch lists and rosters |
| timetable.view | View bell schedule, timetables, substitutions, class sessions, availability and workload |
| timetable.create | Create timetable cells, copy timetables, create class sessions |
| timetable.update | Update timetable cells and class sessions (cancel, reschedule, complete) |
| timetable.delete | Delete timetable cells |
| timetable.manage | Configure period slots; generate class sessions |
| timetable.substitute | Assign, change and cancel substitutions; see uncovered periods |
| timetable.export | Export timetables (PDF / XLSX) |
| subjects.view | View subjects, curriculum and teacher allocation |
| subjects.create | Create subjects (single and bulk) |
| subjects.update | Update subjects |
| subjects.delete | Archive subjects |
| subjects.manage | Maintain course curriculum (CourseSubject) |
| subjects.assign_teachers | Assign teachers to batch subjects |
| subjects.export | Export curriculum and allocation matrix |
| homework.view | View homework, submissions and study materials |
| homework.create | Create homework and study materials |
| homework.update | Update, publish, close, cancel, remind; manage attachments and materials |
| homework.delete | Delete (soft) homework and study materials |
| homework.grade | Mark submissions, grade and request resubmission |
| homework.export | Export homework reports |
| exams.view | View grade scales, exams, papers, marks, results, analysis, re-evaluation requests |
| exams.create | Create exams and exam papers |
| exams.update | Update exams and papers; publish date sheet, open marks entry, cancel |
| exams.delete | Delete (soft) exams and papers without marks |
| exams.manage | Configure grade scales |
| exams.enter_marks | Enter and submit marks; download the marks template |
| exams.verify_marks | Verify or reopen submitted marks |
| exams.publish | Publish and unpublish results |
| exams.reevaluate | Record, accept, resolve and reject re-evaluation requests |
| exams.import | Import marks from Excel |
| exams.export | Export date sheets, marks and result sheets; generate admit cards |
| reportcards.view | View templates, report cards and PDFs |
| reportcards.manage | Configure report card templates |
| reportcards.generate | Generate and regenerate report cards |
| reportcards.update | Edit overall remarks, result override and template of a card |
| reportcards.delete | Delete (soft) unpublished report cards |
| reportcards.remark | Write, edit and delete report card remarks |
| reportcards.publish | Publish (single and bulk) and withhold report cards |
| reportcards.export | Bulk download PDFs and export the result register |
| parentportal.access | Parent Portal access; ownership of the child is checked in code |
| studentportal.access | Student Portal access; ownership of the record is checked in code |
