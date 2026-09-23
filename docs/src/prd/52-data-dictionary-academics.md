# Data Dictionary: Academics

**In simple words:** This chapter lists every table and column for academic years, courses, batches and subjects, attendance and leave, timetable and homework, and exams and report cards. It is generated directly from the validated Prisma schema, so it always matches the database exactly. Use it when you write a query, build a report, answer a support question or review a migration.

How to read each table entry:

- **Column** is the real PostgreSQL column name (snake_case). The Prisma field name is the camelCase version of it.
- **Type** is the PostgreSQL type. `numeric(12,2)` is money, always stored together with a `currency` column. `timestamptz` values are stored in UTC.
- **Null** says whether the column may be empty. **Default** is the value the database or Prisma fills in.
- **Notes** marks keys (PK primary key, UK unique, FK foreign key with its delete rule) and repeats the comment from the schema.

> **Rule:** Every tenant table has `organization_id`. Every query must filter by it; the Prisma tenant extension does this for you (see *Multi-Tenancy and Data Isolation*).

## Tables in This Chapter

| Schema file | Domain | Tables | Enums |
|---|---|---|---|
| `03-academics.prisma` | Academic structure | 11 | 7 |
| `05-attendance-leave.prisma` | Attendance and leave | 9 | 5 |
| `06-timetable-homework.prisma` | Timetable and homework | 9 | 8 |
| `07-exams.prisma` | Exams and report cards | 11 | 10 |

## Academic structure

Schema file `server/prisma/schema/03-academics.prisma` — 11 tables and 7 enums.

### academic_years

Prisma model `AcademicYear`. Tenant table (filtered by `organization_id`). Academic year / session, e.g. 2027-28. Organization-wide; exactly one row is current. Enforced by a partial unique index in the SQL migration: UNIQUE (organization_id) WHERE is_current AND deleted_at IS NULL

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `name` | varchar(30) | not null |  | e.g. 2027-28 |
| `start_date` | date | not null |  |  |
| `end_date` | date | not null |  |  |
| `is_current` | boolean | not null | false | single current year: service layer + partial unique index |
| `status` | enum `AcademicYearStatus` | not null | PLANNED |  |
| `closed_at` | timestamptz | nullable |  |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Unique (organization_id, name); Index (organization_id, is_current); Index (organization_id, start_date).

**Relations:** belongs to `organizations`; has many `terms`, `batches`, `enrollments`, `holidays`, `calendar_events`, `admission_inquiries`, `admission_applications`, `attendance_sessions`, `leave_balances`, `leave_requests`, `timetable_entries`, `homework`, `exams`, `report_cards`, `fee_structures`, `student_fee_assignments`, `fee_invoices`, `student_discounts`, `scholarships`, `scholarship_applications`, `scholarship_awards`, `transport_assignments`, `hostel_allocations`, `student_risk_scores`, `class_sessions`, `study_materials`.

### terms

Prisma model `Term`. Tenant table (filtered by `organization_id`). Term / semester / quarter inside an academic year (used by exams, fees and report cards).

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (cascade on delete) |
| `academic_year_id` | uuid | not null |  | FK to `academic_years` (restrict on delete) |
| `name` | varchar(60) | not null |  | Term 1, Semester 2 |
| `sort_order` | integer | not null | 0 |  |
| `start_date` | date | not null |  |  |
| `end_date` | date | not null |  |  |
| `status` | enum `RecordStatus` | not null | ACTIVE |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Unique (organization_id, academic_year_id, name); Index (organization_id, academic_year_id, sort_order).

**Relations:** belongs to `organizations`, `academic_years`; has many `exams`, `report_cards`.

### courses

Prisma model `Course`. Tenant table (filtered by `organization_id`). Grade or program: "Class 10" in a school, "JEE Main 2028" in a coaching institute.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `campus_id` | uuid | nullable |  | FK to `campuses` (restrict on delete). null = offered at every campus |
| `name` | varchar(120) | not null |  |  |
| `code` | varchar(30) | not null |  |  |
| `description` | text | nullable |  |  |
| `level` | smallint | nullable |  | ordering of grades (Class 1 = 1 ... Class 12 = 12); drives promotion to the next course |
| `stream` | varchar(60) | nullable |  | Science, Commerce, Arts, JEE, NEET |
| `board` | varchar(60) | nullable |  | CBSE, ICSE, State Board, IB |
| `duration_months` | smallint | nullable |  | coaching programs |
| `sort_order` | integer | not null | 0 |  |
| `status` | enum `RecordStatus` | not null | ACTIVE |  |
| `custom_fields` | jsonb | nullable |  | cached CustomFieldValue rows |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Unique (organization_id, code); Index (organization_id, campus_id, status); Index (organization_id, sort_order).

**Relations:** belongs to `organizations`, `campuses`; has many `course_subjects`, `batches`, `enrollments`, `admission_inquiries`, `admission_applications`, `fee_structures`, `students`, `study_materials`.

### batches

Prisma model `Batch`. Tenant table (filtered by `organization_id`). Teaching group of a course in one academic year: "Section 10-A" or "Morning Batch M1".

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `campus_id` | uuid | not null |  | FK to `campuses` (restrict on delete) |
| `academic_year_id` | uuid | not null |  | FK to `academic_years` (restrict on delete) |
| `course_id` | uuid | not null |  | FK to `courses` (restrict on delete) |
| `name` | varchar(80) | not null |  | 10-A, Morning Batch M1 |
| `code` | varchar(30) | not null |  |  |
| `capacity` | integer | nullable |  | max active enrollments; null = no cap |
| `class_teacher_id` | uuid | nullable |  | FK to `staff` (setnull on delete). Staff id of the class teacher / batch in-charge |
| `room_id` | uuid | nullable |  | FK to `rooms` (setnull on delete). home room |
| `shift` | enum `Shift` | not null | FULL_DAY |  |
| `start_time` | varchar(5) | nullable |  | HH:mm in the campus timezone |
| `end_time` | varchar(5) | nullable |  | HH:mm in the campus timezone |
| `days_of_week` | enum `WeekDay`[] | not null |  | days the batch meets (coaching: MON/WED/FRI) |
| `start_date` | date | nullable |  | coaching batches may not follow the academic year dates |
| `end_date` | date | nullable |  |  |
| `medium` | varchar(30) | nullable |  | language of instruction |
| `status` | enum `BatchStatus` | not null | ACTIVE |  |
| `custom_fields` | jsonb | nullable |  | cached CustomFieldValue rows |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Unique (id, organization_id); Unique (organization_id, campus_id, academic_year_id, code); Index (organization_id, campus_id, academic_year_id, status); Index (organization_id, course_id, academic_year_id); Index (organization_id, class_teacher_id).

**Relations:** belongs to `organizations`, `campuses`, `academic_years`, `courses`, `staff`, `rooms`; has many `batch_subject_teachers`, `enrollments`, `students`, `admission_applications`, `attendance_sessions`, `attendance_records`, `student_leave_requests`, `timetable_entries`, `homework`, `exam_schedules`, `report_cards`, `fee_structures`, `student_transfers`, `admission_inquiries`, `class_sessions`, `exam_marks`.

### subjects

Prisma model `Subject`. Tenant table (filtered by `organization_id`). Subject master, e.g. Mathematics, Physics. Shared by all campuses of the organization.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `name` | varchar(100) | not null |  |  |
| `code` | varchar(30) | not null |  |  |
| `subject_type` | enum `SubjectType` | not null | THEORY |  |
| `description` | varchar(500) | nullable |  |  |
| `color` | varchar(7) | nullable |  | hex colour for the timetable grid |
| `status` | enum `RecordStatus` | not null | ACTIVE |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Unique (organization_id, code); Index (organization_id, status, name).

**Relations:** belongs to `organizations`; has many `course_subjects`, `batch_subject_teachers`, `teacher_subjects`, `attendance_sessions`, `timetable_entries`, `homework`, `exam_schedules`, `report_card_remarks`, `books`, `class_sessions`, `study_materials`, `exam_marks`.

### course_subjects

Prisma model `CourseSubject`. Tenant table (filtered by `organization_id`). Subject taught in a course (curriculum), with elective flag and weekly period count.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (cascade on delete) |
| `course_id` | uuid | not null |  | FK to `courses` (cascade on delete) |
| `subject_id` | uuid | not null |  | FK to `subjects` (restrict on delete) |
| `is_elective` | boolean | not null | false | students choose electives at enrollment |
| `elective_group` | varchar(40) | nullable |  | subjects sharing a group are alternatives, e.g. LANG2 |
| `elective_group_min_choices` | smallint | nullable |  | same value on every row of the group |
| `elective_group_max_choices` | smallint | nullable |  |  |
| `include_in_total` | boolean | not null | true | false = graded only, left out of percentage and rank |
| `is_additional` | boolean | not null | false | optional 6th subject (best-of-five rules) |
| `default_max_marks` | decimal(6,2) | nullable |  |  |
| `default_pass_marks` | decimal(6,2) | nullable |  |  |
| `weekly_periods` | smallint | nullable |  | target periods per week for the timetable |
| `credit_hours` | decimal(4,1) | nullable |  | colleges |
| `sort_order` | integer | not null | 0 | order on report cards |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Unique (organization_id, course_id, subject_id); Index (organization_id, subject_id).

**Relations:** belongs to `organizations`, `courses`, `subjects`.

### batch_subject_teachers

Prisma model `BatchSubjectTeacher`. Tenant table (filtered by `organization_id`). Which teacher teaches which subject in which batch; drives the TEACHER "own batches" data scope.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (cascade on delete) |
| `campus_id` | uuid | not null |  | FK to `campuses` (restrict on delete) |
| `batch_id` | uuid | not null |  | FK to `batches` (cascade on delete) |
| `subject_id` | uuid | not null |  | FK to `subjects` (restrict on delete) |
| `staff_id` | uuid | not null |  | FK to `staff` (restrict on delete) |
| `is_primary` | boolean | not null | true | false = co-teacher / assistant |
| `effective_from` | date | nullable |  |  |
| `effective_to` | date | nullable |  |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Unique (organization_id, batch_id, subject_id, staff_id); Index (organization_id, staff_id); Index (organization_id, campus_id, batch_id).

**Relations:** belongs to `organizations`, `campuses`, `batches`, `subjects`, `staff`.

### rooms

Prisma model `Room`. Tenant table (filtered by `organization_id`). Physical room of a campus (classroom, lab, hall) used by batches and the timetable.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (cascade on delete) |
| `campus_id` | uuid | not null |  | FK to `campuses` (restrict on delete) |
| `name` | varchar(80) | not null |  |  |
| `building` | varchar(80) | nullable |  |  |
| `floor` | varchar(20) | nullable |  |  |
| `room_type` | enum `RoomType` | not null | CLASSROOM |  |
| `capacity` | integer | nullable |  |  |
| `status` | enum `RecordStatus` | not null | ACTIVE |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Unique (organization_id, campus_id, name); Index (organization_id, campus_id, room_type, status).

**Relations:** belongs to `organizations`, `campuses`; has many `batches`, `timetable_entries`, `substitutions`, `exam_schedules`, `asset_assignments`, `class_sessions`.

### holidays

Prisma model `Holiday`. Tenant table (filtered by `organization_id`). Holiday or vacation (one day or a date range); attendance is not expected on these dates.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (cascade on delete) |
| `campus_id` | uuid | nullable |  | FK to `campuses` (cascade on delete). null = all campuses |
| `academic_year_id` | uuid | nullable |  | FK to `academic_years` (setnull on delete) |
| `name` | varchar(120) | not null |  |  |
| `holiday_type` | enum `HolidayType` | not null | PUBLIC |  |
| `start_date` | date | not null |  |  |
| `end_date` | date | not null |  | same as startDate for a single day |
| `applies_to` | enum `Audience` | not null | ALL | ALL, STAFF or STUDENTS |
| `description` | varchar(500) | nullable |  |  |
| `created_by_id` | uuid | nullable |  | User id (audit only, no FK) |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Index (organization_id, campus_id, start_date); Index (organization_id, start_date, end_date).

**Relations:** belongs to `organizations`, `campuses`, `academic_years`.

### calendar_events

Prisma model `CalendarEvent`. Tenant table (filtered by `organization_id`). Institute calendar entry: PTM, exam window, sports day, staff meeting.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (cascade on delete) |
| `campus_id` | uuid | nullable |  | FK to `campuses` (cascade on delete). null = all campuses |
| `academic_year_id` | uuid | nullable |  | FK to `academic_years` (setnull on delete) |
| `title` | varchar(150) | not null |  |  |
| `description` | text | nullable |  |  |
| `event_type` | enum `CalendarEventType` | not null | OTHER |  |
| `start_at` | timestamptz | not null |  |  |
| `end_at` | timestamptz | not null |  |  |
| `is_all_day` | boolean | not null | false |  |
| `location` | varchar(150) | nullable |  |  |
| `audience` | enum `Audience` | not null | ALL |  |
| `batch_ids` | uuid[] | not null |  | empty = every batch in scope; otherwise only these batches |
| `color` | varchar(7) | nullable |  |  |
| `is_published` | boolean | not null | true | drafts are visible to staff with calendar.manage only |
| `created_by_id` | uuid | nullable |  | User id (audit only, no FK) |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Index (organization_id, campus_id, start_at); Index (organization_id, event_type, start_at).

**Relations:** belongs to `organizations`, `campuses`, `academic_years`; has many `ptm_bookings`.

### ptm_bookings

Prisma model `PtmBooking`. Tenant table (filtered by `organization_id`). A parent's slot with one teacher in a PTM calendar event, with attendance and notes.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `campus_id` | uuid | not null |  | FK to `campuses` (restrict on delete) |
| `calendar_event_id` | uuid | not null |  | FK to `calendar_events` (cascade on delete) |
| `student_id` | uuid | not null |  | FK to `students` (restrict on delete) |
| `guardian_id` | uuid | nullable |  | FK to `guardians` (setnull on delete) |
| `staff_id` | uuid | not null |  | FK to `staff` (restrict on delete) |
| `slot_start` | timestamptz | not null |  |  |
| `slot_end` | timestamptz | not null |  |  |
| `status` | enum `PtmBookingStatus` | not null | BOOKED |  |
| `teacher_notes` | text | nullable |  |  |
| `parent_feedback` | varchar(1000) | nullable |  |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Unique (organization_id, calendar_event_id, staff_id, slot_start); Index (organization_id, student_id); Index (organization_id, calendar_event_id, status); Index (organization_id, campus_id, slot_start).

**Relations:** belongs to `organizations`, `campuses`, `calendar_events`, `students`, `guardians`, `staff`.

### Enums in 03-academics.prisma

| Enum | Values | Meaning |
|---|---|---|
| `AcademicYearStatus` | PLANNED, ACTIVE, CLOSED |  |
| `BatchStatus` | PLANNED, ACTIVE, COMPLETED, CANCELLED |  |
| `SubjectType` | THEORY, PRACTICAL, LANGUAGE, CO_CURRICULAR, TEST_SERIES |  |
| `RoomType` | CLASSROOM, LAB, LIBRARY, HALL, OFFICE, STAFF_ROOM, OTHER |  |
| `HolidayType` | PUBLIC, FESTIVAL, VACATION, WEEKLY_OFF, EMERGENCY, OTHER |  |
| `CalendarEventType` | ACADEMIC, EXAM, PTM, CULTURAL, SPORTS, MEETING, ADMISSION, OTHER |  |
| `PtmBookingStatus` | BOOKED, ATTENDED, NO_SHOW, CANCELLED |  |

## Attendance and leave

Schema file `server/prisma/schema/05-attendance-leave.prisma` — 9 tables and 5 enums.

### attendance_sessions

Prisma model `AttendanceSession`. Tenant table (filtered by `organization_id`). One attendance-taking event for a batch: the whole day, or one period of the day.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `campus_id` | uuid | not null |  | FK to `campuses` (restrict on delete) |
| `academic_year_id` | uuid | not null |  | FK to `academic_years` (restrict on delete) |
| `batch_id` | uuid | not null |  | FK to `batches` (restrict on delete) |
| `date` | date | not null |  |  |
| `period_slot_id` | uuid | nullable |  | FK to `period_slots` (restrict on delete). null = daily attendance |
| `slot_key` | varchar(36) | not null | "DAY" | "DAY", the periodSlotId or the classSessionId; makes the unique key work without NULLs |
| `class_session_id` | uuid | nullable |  | FK to `class_sessions` (setnull on delete). coaching: the dated lecture this attendance belongs to |
| `subject_id` | uuid | nullable |  | FK to `subjects` (setnull on delete). period-wise attendance only |
| `taken_by_id` | uuid | nullable |  | FK to `users` (setnull on delete). User who marked the attendance |
| `taken_at` | timestamptz | nullable |  |  |
| `is_locked` | boolean | not null | false | locked sessions need attendance.unlock to edit |
| `locked_at` | timestamptz | nullable |  |  |
| `total_count` | integer | not null | 0 | cached counters for dashboards |
| `present_count` | integer | not null | 0 |  |
| `absent_count` | integer | not null | 0 |  |
| `late_count` | integer | not null | 0 |  |
| `leave_count` | integer | not null | 0 |  |
| `parents_notified_at` | timestamptz | nullable |  | absence alerts queued |
| `notes` | varchar(500) | nullable |  |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Unique (id, organization_id); Unique (organization_id, batch_id, date, slot_key); Index (organization_id, class_session_id); Index (organization_id, campus_id, date); Index (organization_id, academic_year_id, batch_id, date); Index (organization_id, taken_by_id, date).

**Relations:** belongs to `organizations`, `campuses`, `academic_years`, `batches`, `period_slots`, `subjects`, `users`, `class_sessions`; has many `attendance_records`.

### attendance_records

Prisma model `AttendanceRecord`. Tenant table (filtered by `organization_id`). Attendance of one student in one session.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `campus_id` | uuid | not null |  | FK to `campuses` (restrict on delete) |
| `session_id` | uuid | not null |  | FK to `attendance_sessions` (restrict on delete) |
| `student_id` | uuid | not null |  | FK to `students` (restrict on delete) |
| `batch_id` | uuid | not null |  | FK to `batches` (restrict on delete). denormalised from the session for reports |
| `date` | date | not null |  | denormalised from the session for reports |
| `status` | enum `AttendanceStatus` | not null |  |  |
| `late_minutes` | smallint | nullable |  |  |
| `half_day_session` | enum `HalfDaySession` | nullable |  | which half was attended when HALF_DAY |
| `source` | enum `AttendanceSource` | not null | MANUAL |  |
| `check_in_at` | timestamptz | nullable |  | device punch (RFID / QR / face) |
| `check_out_at` | timestamptz | nullable |  |  |
| `device_ref` | varchar(100) | nullable |  |  |
| `remark` | varchar(255) | nullable |  |  |
| `leave_request_id` | uuid | nullable |  | FK to `student_leave_requests` (setnull on delete). approved student leave that produced status LEAVE |
| `marked_by_id` | uuid | nullable |  | User id (audit only, no FK) |
| `notified_at` | timestamptz | nullable |  | absence alert sent to the parent |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Unique (organization_id, session_id, student_id); Index (organization_id, student_id, date); Index (organization_id, batch_id, date, status); Index (organization_id, campus_id, date, status).

**Relations:** belongs to `organizations`, `campuses`, `attendance_sessions`, `students`, `batches`, `student_leave_requests`.

### staff_attendance

Prisma model `StaffAttendance`. Tenant table (filtered by `organization_id`). Daily attendance of a staff member with check-in / check-out.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `campus_id` | uuid | not null |  | FK to `campuses` (restrict on delete) |
| `staff_id` | uuid | not null |  | FK to `staff` (restrict on delete) |
| `date` | date | not null |  |  |
| `status` | enum `StaffAttendanceStatus` | not null |  |  |
| `check_in_at` | timestamptz | nullable |  |  |
| `check_out_at` | timestamptz | nullable |  |  |
| `worked_minutes` | integer | nullable |  |  |
| `late_minutes` | smallint | nullable |  |  |
| `source` | enum `AttendanceSource` | not null | MANUAL |  |
| `check_in_lat` | decimal(9,6) | nullable |  | GEO source only |
| `check_in_lng` | decimal(9,6) | nullable |  |  |
| `check_out_lat` | decimal(9,6) | nullable |  |  |
| `check_out_lng` | decimal(9,6) | nullable |  |  |
| `device_ref` | varchar(100) | nullable |  | biometric device id or mobile device id |
| `leave_request_id` | uuid | nullable |  | FK to `leave_requests` (setnull on delete). approved leave that produced status ON_LEAVE |
| `remark` | varchar(255) | nullable |  |  |
| `marked_by_id` | uuid | nullable |  | User id (audit only, no FK); null for device punches |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Unique (organization_id, staff_id, date); Index (organization_id, campus_id, date, status).

**Relations:** belongs to `organizations`, `campuses`, `staff`, `leave_requests`.

### leave_types

Prisma model `LeaveType`. Tenant table (filtered by `organization_id`). Kind of staff leave: Casual, Sick, Earned, Maternity, Loss of Pay.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (cascade on delete) |
| `name` | varchar(80) | not null |  |  |
| `code` | varchar(10) | not null |  | CL, SL, EL, LOP |
| `is_paid` | boolean | not null | true | unpaid leave reduces salary in Payroll |
| `allow_half_day` | boolean | not null | true |  |
| `is_comp_off` | boolean | not null | false | compensatory off earned by working on a holiday / exam duty |
| `requires_document_days` | smallint | nullable |  | attachment needed when the leave is longer than this many days |
| `color` | varchar(7) | nullable |  |  |
| `status` | enum `RecordStatus` | not null | ACTIVE |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Unique (organization_id, code); Index (organization_id, status).

**Relations:** belongs to `organizations`; has many `leave_policies`, `leave_balances`, `leave_requests`.

### leave_policies

Prisma model `LeavePolicy`. Tenant table (filtered by `organization_id`). Entitlement rule for a leave type: quota, accrual, carry-forward, who it applies to.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (cascade on delete) |
| `leave_type_id` | uuid | not null |  | FK to `leave_types` (cascade on delete) |
| `name` | varchar(120) | not null |  |  |
| `staff_type` | enum `StaffType` | nullable |  | null = all staff |
| `employment_type` | enum `EmploymentType` | nullable |  | null = all employment types |
| `gender_restriction` | enum `Gender` | nullable |  | e.g. FEMALE for maternity leave |
| `annual_quota` | decimal(5,1) | not null |  | days per academic year |
| `accrual` | enum `LeaveAccrual` | not null | YEARLY_UPFRONT |  |
| `carry_forward_allowed` | boolean | not null | false |  |
| `max_carry_forward` | decimal(5,1) | nullable |  |  |
| `is_encashable` | boolean | not null | false |  |
| `max_consecutive_days` | smallint | nullable |  |  |
| `min_notice_days` | smallint | not null | 0 |  |
| `applies_in_probation` | boolean | not null | true |  |
| `approval_levels` | smallint | not null | 1 | 1 = manager only, 2 = manager then principal ... |
| `effective_from` | date | not null |  |  |
| `effective_to` | date | nullable |  |  |
| `status` | enum `RecordStatus` | not null | ACTIVE |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Index (organization_id, leave_type_id, status); Index (organization_id, staff_type, status).

**Relations:** belongs to `organizations`, `leave_types`.

### leave_balances

Prisma model `LeaveBalance`. Tenant table (filtered by `organization_id`). Leave balance of one staff member for one leave type in one academic year. Available = opening + carriedForward + accrued + adjusted - used - pending - encashed - lapsed.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (cascade on delete) |
| `staff_id` | uuid | not null |  | FK to `staff` (cascade on delete) |
| `leave_type_id` | uuid | not null |  | FK to `leave_types` (restrict on delete) |
| `academic_year_id` | uuid | not null |  | FK to `academic_years` (restrict on delete) |
| `opening` | decimal(5,1) | not null | 0 |  |
| `carried_forward` | decimal(5,1) | not null | 0 |  |
| `accrued` | decimal(5,1) | not null | 0 |  |
| `adjusted` | decimal(5,1) | not null | 0 | manual corrections (+/-), always audited |
| `used` | decimal(5,1) | not null | 0 | approved leave days |
| `pending` | decimal(5,1) | not null | 0 | days in requests awaiting approval |
| `encashed` | decimal(5,1) | not null | 0 | days paid out through payroll (LEAVE_ENCASHMENT adjustment) |
| `lapsed` | decimal(5,1) | not null | 0 | days lost at year end |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Unique (organization_id, staff_id, leave_type_id, academic_year_id); Index (organization_id, academic_year_id, leave_type_id).

**Relations:** belongs to `organizations`, `staff`, `leave_types`, `academic_years`.

### leave_requests

Prisma model `LeaveRequest`. Tenant table (filtered by `organization_id`). Staff leave application; approvals are tracked level by level in LeaveApprovalStep.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `campus_id` | uuid | not null |  | FK to `campuses` (restrict on delete) |
| `staff_id` | uuid | not null |  | FK to `staff` (restrict on delete) |
| `leave_type_id` | uuid | not null |  | FK to `leave_types` (restrict on delete) |
| `academic_year_id` | uuid | not null |  | FK to `academic_years` (restrict on delete) |
| `start_date` | date | not null |  |  |
| `end_date` | date | not null |  |  |
| `start_half` | enum `HalfDaySession` | nullable |  | set when the first day is a half day |
| `end_half` | enum `HalfDaySession` | nullable |  | set when the last day is a half day |
| `total_days` | decimal(4,1) | not null |  | working days, excluding holidays and weekly offs |
| `reason` | varchar(1000) | not null |  |  |
| `worked_on_date` | date | nullable |  | comp-off: the holiday / Sunday that was worked |
| `attachment_file_id` | uuid | nullable |  | FK to `file_assets` (setnull on delete). medical certificate etc. |
| `contact_during_leave` | varchar(20) | nullable |  |  |
| `substitute_staff_id` | uuid | nullable |  | FK to `staff` (setnull on delete). suggested substitute teacher |
| `status` | enum `ApprovalStatus` | not null | PENDING |  |
| `current_approval_level` | smallint | not null | 1 | level waiting for action |
| `decided_by_id` | uuid | nullable |  | FK to `users` (setnull on delete). User who gave the final decision |
| `decided_at` | timestamptz | nullable |  |  |
| `cancelled_at` | timestamptz | nullable |  |  |
| `cancel_reason` | varchar(255) | nullable |  |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Index (organization_id, staff_id, start_date); Index (organization_id, campus_id, status, start_date); Index (organization_id, academic_year_id, leave_type_id).

**Relations:** belongs to `organizations`, `campuses`, `staff`, `leave_types`, `academic_years`, `file_assets`, `users`; has many `leave_approval_steps`, `staff_attendance`, `substitutions`.

### leave_approval_steps

Prisma model `LeaveApprovalStep`. Tenant table (filtered by `organization_id`). One level of the approval chain of a staff leave request.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (cascade on delete) |
| `leave_request_id` | uuid | not null |  | FK to `leave_requests` (cascade on delete) |
| `level` | smallint | not null |  | 1 = first approver |
| `approver_id` | uuid | not null |  | FK to `users` (restrict on delete). User expected to act at this level |
| `status` | enum `ApprovalStatus` | not null | PENDING |  |
| `remarks` | varchar(500) | nullable |  |  |
| `acted_at` | timestamptz | nullable |  |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Unique (organization_id, leave_request_id, level); Index (organization_id, approver_id, status).

**Relations:** belongs to `organizations`, `leave_requests`, `users`.

### student_leave_requests

Prisma model `StudentLeaveRequest`. Tenant table (filtered by `organization_id`). Leave application for a student, raised by a parent in the Parent Portal (or by staff on their behalf).

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `campus_id` | uuid | not null |  | FK to `campuses` (restrict on delete) |
| `student_id` | uuid | not null |  | FK to `students` (restrict on delete) |
| `batch_id` | uuid | nullable |  | FK to `batches` (setnull on delete). batch at the time of the request; routes it to the class teacher |
| `requested_by_guardian_id` | uuid | nullable |  | FK to `guardians` (setnull on delete) |
| `requested_by_user_id` | uuid | nullable |  | FK to `users` (setnull on delete). login that submitted the request |
| `category` | enum `StudentLeaveCategory` | not null | OTHER |  |
| `start_date` | date | not null |  |  |
| `end_date` | date | not null |  |  |
| `start_half` | enum `HalfDaySession` | nullable |  | set when the first day is a half day |
| `end_half` | enum `HalfDaySession` | nullable |  |  |
| `total_days` | decimal(4,1) | nullable |  |  |
| `pickup_guardian_id` | uuid | nullable |  | FK to `guardians` (setnull on delete). who collects the child for an early-leave request |
| `reason` | varchar(1000) | not null |  |  |
| `attachment_file_id` | uuid | nullable |  | FK to `file_assets` (setnull on delete) |
| `status` | enum `ApprovalStatus` | not null | PENDING |  |
| `reviewed_by_id` | uuid | nullable |  | FK to `users` (setnull on delete) |
| `reviewed_at` | timestamptz | nullable |  |  |
| `review_remarks` | varchar(500) | nullable |  |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Index (organization_id, student_id, start_date); Index (organization_id, campus_id, status, start_date); Index (organization_id, batch_id, status).

**Relations:** belongs to `organizations`, `campuses`, `students`, `batches`, `guardians`, `users`, `file_assets`; has many `attendance_records`.

### Enums in 05-attendance-leave.prisma

| Enum | Values | Meaning |
|---|---|---|
| `AttendanceStatus` | PRESENT, ABSENT, LATE, HALF_DAY, LEAVE, HOLIDAY |  |
| `StaffAttendanceStatus` | PRESENT, ABSENT, LATE, HALF_DAY, ON_LEAVE, HOLIDAY, WEEK_OFF |  |
| `AttendanceSource` | MANUAL, BIOMETRIC, GEO, RFID, QR_CODE, FACE, PARENT_APP |  |
| `LeaveAccrual` | YEARLY_UPFRONT, MONTHLY, QUARTERLY, NONE |  |
| `StudentLeaveCategory` | SICK, FAMILY, TRAVEL, EXAM_OR_EVENT, OTHER |  |

## Timetable and homework

Schema file `server/prisma/schema/06-timetable-homework.prisma` — 9 tables and 8 enums.

### period_slots

Prisma model `PeriodSlot`. Tenant table (filtered by `organization_id`). A row of the campus bell schedule: Period 1 08:00-08:40, Lunch 11:20-11:50.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (cascade on delete) |
| `campus_id` | uuid | not null |  | FK to `campuses` (restrict on delete) |
| `shift` | enum `Shift` | not null | FULL_DAY | each shift has its own bell schedule |
| `name` | varchar(40) | not null |  |  |
| `slot_type` | enum `PeriodSlotType` | not null | PERIOD |  |
| `start_time` | varchar(5) | not null |  | HH:mm in the campus timezone |
| `end_time` | varchar(5) | not null |  | HH:mm in the campus timezone |
| `sort_order` | integer | not null | 0 |  |
| `status` | enum `RecordStatus` | not null | ACTIVE |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Unique (organization_id, campus_id, shift, name); Index (organization_id, campus_id, shift, sort_order).

**Relations:** belongs to `organizations`, `campuses`; has many `timetable_entries`, `substitutions`, `attendance_sessions`.

### timetable_entries

Prisma model `TimetableEntry`. Tenant table (filtered by `organization_id`). One cell of a batch's weekly timetable. Rows are replaced (hard delete) when the timetable changes, so the three unique keys below guarantee: no double booking of a batch, a teacher or a room. Elective split: one row per elective group (groupLabel) in the same slot. Combined class (11-A + 11-B together): one owner row holds staffId / roomId; follower rows keep them NULL and point to the owner with combinedWithEntryId.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (cascade on delete) |
| `campus_id` | uuid | not null |  | FK to `campuses` (restrict on delete) |
| `academic_year_id` | uuid | not null |  | FK to `academic_years` (restrict on delete) |
| `batch_id` | uuid | not null |  | FK to `batches` (cascade on delete) |
| `week_day` | enum `WeekDay` | not null |  |  |
| `period_slot_id` | uuid | not null |  | FK to `period_slots` (restrict on delete) |
| `subject_id` | uuid | nullable |  | FK to `subjects` (restrict on delete). null for non-subject periods (assembly, library, sports) |
| `staff_id` | uuid | nullable |  | FK to `staff` (setnull on delete). teacher; NULLs never clash in the unique key |
| `room_id` | uuid | nullable |  | FK to `rooms` (setnull on delete). NULLs never clash in the unique key |
| `group_label` | varchar(30) | not null | "" | "" = whole batch; otherwise the elective group, e.g. SANSKRIT |
| `combined_with_entry_id` | uuid | nullable |  | FK to `timetable_entries` (cascade on delete). follower row of a combined class: points to the owner row |
| `label` | varchar(80) | nullable |  | shown when subjectId is null, e.g. "Library" |
| `effective_from` | date | nullable |  | informational; one timetable version is live per academic year |
| `notes` | varchar(255) | nullable |  |  |
| `created_by_id` | uuid | nullable |  | User id (audit only, no FK) |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Unique (organization_id, academic_year_id, batch_id, week_day, period_slot_id, group_label) `uq_timetable_batch_slot`; Unique (organization_id, academic_year_id, staff_id, week_day, period_slot_id) `uq_timetable_teacher_slot`; Unique (organization_id, academic_year_id, room_id, week_day, period_slot_id) `uq_timetable_room_slot`; Index (organization_id, campus_id, academic_year_id, week_day); Index (organization_id, staff_id, week_day).

**Relations:** belongs to `organizations`, `campuses`, `academic_years`, `batches`, `period_slots`, `subjects`, `staff`, `rooms`, `timetable_entries`; has many `timetable_entries`, `substitutions`, `class_sessions`.

### substitutions

Prisma model `Substitution`. Tenant table (filtered by `organization_id`). Replacement teacher for one timetable entry on one date (absent teacher, leave).

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (cascade on delete) |
| `campus_id` | uuid | not null |  | FK to `campuses` (restrict on delete) |
| `timetable_entry_id` | uuid | not null |  | FK to `timetable_entries` (cascade on delete) |
| `date` | date | not null |  |  |
| `period_slot_id` | uuid | not null |  | FK to `period_slots` (restrict on delete). denormalised from the entry for the clash key |
| `original_staff_id` | uuid | not null |  | FK to `staff` (restrict on delete) |
| `substitute_staff_id` | uuid | nullable |  | FK to `staff` (setnull on delete). null = free / self-study period |
| `room_id` | uuid | nullable |  | FK to `rooms` (setnull on delete). room override for the day |
| `leave_request_id` | uuid | nullable |  | FK to `leave_requests` (setnull on delete). leave that caused the substitution |
| `reason` | varchar(255) | nullable |  |  |
| `status` | enum `SubstitutionStatus` | not null | ASSIGNED |  |
| `notified_at` | timestamptz | nullable |  |  |
| `assigned_by_id` | uuid | nullable |  | User id (audit only, no FK) |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Unique (organization_id, timetable_entry_id, date); Unique (organization_id, substitute_staff_id, date, period_slot_id) `uq_substitution_teacher_slot`; Index (organization_id, campus_id, date); Index (organization_id, original_staff_id, date).

**Relations:** belongs to `organizations`, `campuses`, `timetable_entries`, `period_slots`, `staff`, `rooms`, `leave_requests`.

### homework

Prisma model `Homework`. Tenant table (filtered by `organization_id`). Homework / assignment given to a batch for a subject.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `campus_id` | uuid | not null |  | FK to `campuses` (restrict on delete) |
| `academic_year_id` | uuid | not null |  | FK to `academic_years` (restrict on delete) |
| `batch_id` | uuid | not null |  | FK to `batches` (restrict on delete) |
| `subject_id` | uuid | not null |  | FK to `subjects` (restrict on delete) |
| `assigned_by_id` | uuid | not null |  | FK to `staff` (restrict on delete). teacher (Staff) who set the homework |
| `title` | varchar(200) | not null |  |  |
| `description` | text | nullable |  |  |
| `assigned_date` | date | not null |  |  |
| `due_date` | date | not null |  |  |
| `submission_mode` | enum `HomeworkSubmissionMode` | not null | OFFLINE |  |
| `allow_late_submission` | boolean | not null | true |  |
| `max_marks` | decimal(6,2) | nullable |  | null = not graded |
| `status` | enum `HomeworkStatus` | not null | DRAFT |  |
| `published_at` | timestamptz | nullable |  |  |
| `notify_parents` | boolean | not null | true |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Index (organization_id, batch_id, due_date); Index (organization_id, campus_id, status, due_date); Index (organization_id, assigned_by_id, status); Index (organization_id, batch_id, subject_id, assigned_date).

**Relations:** belongs to `organizations`, `campuses`, `academic_years`, `batches`, `subjects`, `staff`; has many `homework_attachments`, `homework_submissions`.

### homework_attachments

Prisma model `HomeworkAttachment`. Tenant table (filtered by `organization_id`). File or link attached to a homework by the teacher.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (cascade on delete) |
| `homework_id` | uuid | not null |  | FK to `homework` (cascade on delete) |
| `file_id` | uuid | nullable |  | FK to `file_assets` (restrict on delete). either a file ... |
| `external_url` | varchar(1000) | nullable |  | ... or a link (video, Google Drive) |
| `title` | varchar(150) | nullable |  |  |
| `sort_order` | integer | not null | 0 |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Index (organization_id, homework_id, sort_order).

**Relations:** belongs to `organizations`, `homework`, `file_assets`.

### homework_submissions

Prisma model `HomeworkSubmission`. Tenant table (filtered by `organization_id`). A student's work for a homework: status, files, marks and teacher feedback.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `homework_id` | uuid | not null |  | FK to `homework` (restrict on delete) |
| `student_id` | uuid | not null |  | FK to `students` (restrict on delete) |
| `status` | enum `HomeworkSubmissionStatus` | not null | PENDING |  |
| `answer_text` | text | nullable |  |  |
| `submitted_at` | timestamptz | nullable |  |  |
| `submitted_by_id` | uuid | nullable |  | User id of the student or parent (audit only, no FK) |
| `attempt_no` | smallint | not null | 1 | increases after RESUBMIT_REQUESTED |
| `marks_obtained` | decimal(6,2) | nullable |  |  |
| `grade` | varchar(10) | nullable |  |  |
| `feedback` | text | nullable |  |  |
| `graded_by_id` | uuid | nullable |  | FK to `staff` (setnull on delete). teacher (Staff) |
| `graded_at` | timestamptz | nullable |  |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Unique (organization_id, homework_id, student_id); Index (organization_id, student_id, status); Index (organization_id, homework_id, status).

**Relations:** belongs to `organizations`, `homework`, `students`, `staff`; has many `homework_submission_files`.

### homework_submission_files

Prisma model `HomeworkSubmissionFile`. Tenant table (filtered by `organization_id`). File uploaded by the student / parent as part of a homework submission.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (cascade on delete) |
| `submission_id` | uuid | not null |  | FK to `homework_submissions` (cascade on delete) |
| `file_id` | uuid | not null |  | FK to `file_assets` (restrict on delete) |
| `sort_order` | integer | not null | 0 |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Index (organization_id, submission_id).

**Relations:** belongs to `organizations`, `homework_submissions`, `file_assets`.

### class_sessions

Prisma model `ClassSession`. Tenant table (filtered by `organization_id`). One dated lecture of a batch (generated from the weekly timetable or created ad hoc): extra class, doubt session, cancelled / rescheduled lecture, online class. Coaching attendance and per-lecture faculty pay attach to it.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `campus_id` | uuid | not null |  | FK to `campuses` (restrict on delete) |
| `academic_year_id` | uuid | not null |  | FK to `academic_years` (restrict on delete) |
| `batch_id` | uuid | not null |  | FK to `batches` (restrict on delete) |
| `subject_id` | uuid | nullable |  | FK to `subjects` (setnull on delete) |
| `staff_id` | uuid | nullable |  | FK to `staff` (setnull on delete). faculty who takes the lecture |
| `room_id` | uuid | nullable |  | FK to `rooms` (setnull on delete) |
| `timetable_entry_id` | uuid | nullable |  | FK to `timetable_entries` (setnull on delete). weekly cell this session was generated from |
| `date` | date | not null |  |  |
| `start_time` | varchar(5) | not null |  | HH:mm in the campus timezone |
| `end_time` | varchar(5) | not null |  |  |
| `session_type` | enum `ClassSessionType` | not null | REGULAR |  |
| `status` | enum `ClassSessionStatus` | not null | SCHEDULED |  |
| `topic` | varchar(255) | nullable |  | syllabus covered |
| `meeting_url` | varchar(500) | nullable |  | online class link |
| `cancel_reason` | varchar(255) | nullable |  |  |
| `rescheduled_from_id` | uuid | nullable |  | FK to `class_sessions` (setnull on delete). the session this one replaces |
| `parents_notified_at` | timestamptz | nullable |  | cancel / reschedule alert queued |
| `created_by_id` | uuid | nullable |  | User id (audit only, no FK) |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Index (organization_id, batch_id, date); Index (organization_id, staff_id, date); Index (organization_id, campus_id, date, status).

**Relations:** belongs to `organizations`, `campuses`, `academic_years`, `batches`, `subjects`, `staff`, `rooms`, `timetable_entries`, `class_sessions`; has many `class_sessions`, `attendance_sessions`.

### study_materials

Prisma model `StudyMaterial`. Tenant table (filtered by `organization_id`). Learning resource (notes, DPP sheet, recorded-lecture link) shared with one or more batches; no due date or submission.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `campus_id` | uuid | not null |  | FK to `campuses` (restrict on delete) |
| `academic_year_id` | uuid | not null |  | FK to `academic_years` (restrict on delete) |
| `course_id` | uuid | nullable |  | FK to `courses` (setnull on delete) |
| `subject_id` | uuid | nullable |  | FK to `subjects` (setnull on delete) |
| `batch_ids` | uuid[] | not null |  | empty = every batch of the course |
| `title` | varchar(200) | not null |  |  |
| `description` | text | nullable |  |  |
| `material_type` | enum `StudyMaterialType` | not null | NOTES |  |
| `file_id` | uuid | nullable |  | FK to `file_assets` (restrict on delete). either a file ... |
| `external_url` | varchar(1000) | nullable |  | ... or a link |
| `topic` | varchar(150) | nullable |  |  |
| `is_published` | boolean | not null | true |  |
| `visible_to_parents` | boolean | not null | true |  |
| `uploaded_by_id` | uuid | nullable |  | FK to `staff` (setnull on delete). Staff |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Index (organization_id, campus_id, subject_id, created_at); Index (organization_id, course_id, is_published).

**Relations:** belongs to `organizations`, `campuses`, `academic_years`, `courses`, `subjects`, `file_assets`, `staff`.

### Enums in 06-timetable-homework.prisma

| Enum | Values | Meaning |
|---|---|---|
| `PeriodSlotType` | PERIOD, BREAK, LUNCH, ASSEMBLY, ACTIVITY |  |
| `SubstitutionStatus` | ASSIGNED, COMPLETED, CANCELLED |  |
| `HomeworkStatus` | DRAFT, PUBLISHED, CLOSED, CANCELLED |  |
| `HomeworkSubmissionMode` | ONLINE, OFFLINE, NOT_REQUIRED |  |
| `HomeworkSubmissionStatus` | PENDING, SUBMITTED, LATE, RESUBMIT_REQUESTED, GRADED, MISSING, EXCUSED |  |
| `ClassSessionType` | REGULAR, EXTRA, DOUBT_CLEARING, REVISION, TEST_DISCUSSION, ONLINE |  |
| `ClassSessionStatus` | SCHEDULED, COMPLETED, CANCELLED, RESCHEDULED |  |
| `StudyMaterialType` | NOTES, WORKSHEET, VIDEO_LINK, QUESTION_PAPER, SOLUTION, SYLLABUS, OTHER |  |

## Exams and report cards

Schema file `server/prisma/schema/07-exams.prisma` — 11 tables and 10 enums.

### grade_scales

Prisma model `GradeScale`. Tenant table (filtered by `organization_id`). Grading scheme of the organization, e.g. "CBSE 9-point" or "GPA 4.0".

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (cascade on delete) |
| `name` | varchar(80) | not null |  |  |
| `scale_type` | enum `GradeScaleType` | not null | PERCENTAGE_BANDS |  |
| `description` | varchar(255) | nullable |  |  |
| `is_default` | boolean | not null | false | single default: service layer + partial unique index in the SQL migration, UNIQUE (organization_id) WHERE is_default AND deleted_at IS NULL |
| `status` | enum `RecordStatus` | not null | ACTIVE |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Unique (organization_id, name); Index (organization_id, status).

**Relations:** belongs to `organizations`; has many `grade_bands`, `exams`, `report_card_templates`.

### grade_bands

Prisma model `GradeBand`. Tenant table (filtered by `organization_id`). One band of a grade scale: grade A1 = 91-100 %, grade point 10.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (cascade on delete) |
| `grade_scale_id` | uuid | not null |  | FK to `grade_scales` (cascade on delete) |
| `grade` | varchar(10) | not null |  | A1, B+, Distinction |
| `min_percent` | decimal(5,2) | not null |  | inclusive |
| `max_percent` | decimal(5,2) | not null |  | inclusive |
| `grade_point` | decimal(4,2) | nullable |  |  |
| `description` | varchar(120) | nullable |  | Outstanding, Needs improvement |
| `is_pass` | boolean | not null | true |  |
| `sort_order` | integer | not null | 0 |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Unique (organization_id, grade_scale_id, grade); Index (organization_id, grade_scale_id, sort_order).

**Relations:** belongs to `organizations`, `grade_scales`.

### exams

Prisma model `Exam`. Tenant table (filtered by `organization_id`). An examination of a campus in an academic year / term: "Unit Test 1", "Half Yearly", "JEE Mock 7".

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `campus_id` | uuid | not null |  | FK to `campuses` (restrict on delete) |
| `academic_year_id` | uuid | not null |  | FK to `academic_years` (restrict on delete) |
| `term_id` | uuid | nullable |  | FK to `terms` (setnull on delete) |
| `grade_scale_id` | uuid | nullable |  | FK to `grade_scales` (setnull on delete). null = organization default scale |
| `parent_exam_id` | uuid | nullable |  | FK to `exams` (setnull on delete). original exam that this supplementary / re-test replaces |
| `name` | varchar(120) | not null |  |  |
| `code` | varchar(30) | nullable |  |  |
| `exam_type` | enum `ExamType` | not null |  |  |
| `status` | enum `ExamStatus` | not null | DRAFT |  |
| `start_date` | date | not null |  |  |
| `end_date` | date | not null |  |  |
| `weightage` | decimal(5,2) | nullable |  | % contribution to the term / annual result |
| `marks_entry_deadline` | date | nullable |  |  |
| `instructions` | text | nullable |  |  |
| `show_rank` | boolean | not null | false | coaching tests usually show ranks; many schools do not |
| `published_at` | timestamptz | nullable |  |  |
| `published_by_id` | uuid | nullable |  | User id (audit only, no FK) |
| `created_by_id` | uuid | nullable |  | User id (audit only, no FK) |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Unique (organization_id, campus_id, academic_year_id, name); Index (organization_id, parent_exam_id); Index (organization_id, campus_id, academic_year_id, status); Index (organization_id, term_id); Index (organization_id, exam_type, start_date).

**Relations:** belongs to `organizations`, `campuses`, `academic_years`, `terms`, `grade_scales`, `exams`; has many `exams`, `exam_schedules`, `exam_marks`, `report_cards`.

### exam_schedules

Prisma model `ExamSchedule`. Tenant table (filtered by `organization_id`). One paper of an exam: exam + batch + subject with date, time, room and marks limits (the date sheet).

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `campus_id` | uuid | not null |  | FK to `campuses` (restrict on delete) |
| `exam_id` | uuid | not null |  | FK to `exams` (restrict on delete) |
| `batch_id` | uuid | not null |  | FK to `batches` (restrict on delete) |
| `subject_id` | uuid | not null |  | FK to `subjects` (restrict on delete) |
| `exam_date` | date | not null |  |  |
| `start_time` | varchar(5) | nullable |  | HH:mm in the campus timezone |
| `end_time` | varchar(5) | nullable |  | HH:mm in the campus timezone |
| `duration_minutes` | smallint | nullable |  |  |
| `room_id` | uuid | nullable |  | FK to `rooms` (setnull on delete) |
| `invigilator_id` | uuid | nullable |  | FK to `staff` (setnull on delete). Staff on duty |
| `max_marks` | decimal(6,2) | not null |  |  |
| `pass_marks` | decimal(6,2) | not null |  |  |
| `negative_mark_per_wrong` | decimal(4,2) | nullable |  | JEE / NEET style mock tests |
| `total_questions` | smallint | nullable |  |  |
| `syllabus` | text | nullable |  |  |
| `marks_entry_status` | enum `MarksEntryStatus` | not null | PENDING |  |
| `marks_submitted_at` | timestamptz | nullable |  |  |
| `marks_verified_at` | timestamptz | nullable |  |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Unique (id, organization_id); Unique (organization_id, exam_id, batch_id, subject_id); Index (organization_id, campus_id, exam_date); Index (organization_id, batch_id, exam_date); Index (organization_id, invigilator_id, exam_date); Index (organization_id, exam_id, marks_entry_status).

**Relations:** belongs to `organizations`, `campuses`, `exams`, `batches`, `subjects`, `rooms`, `staff`; has many `exam_marks`, `exam_schedule_components`.

### exam_marks

Prisma model `ExamMark`. Tenant table (filtered by `organization_id`). Marks of one student in one exam paper.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `campus_id` | uuid | not null |  | FK to `campuses` (restrict on delete). denormalised from the schedule for campus scoping |
| `exam_schedule_id` | uuid | not null |  | FK to `exam_schedules` (restrict on delete) |
| `exam_id` | uuid | not null |  | FK to `exams` (restrict on delete). denormalised from the schedule for result queries |
| `batch_id` | uuid | not null |  | FK to `batches` (restrict on delete). denormalised from the schedule |
| `subject_id` | uuid | not null |  | FK to `subjects` (restrict on delete). denormalised from the schedule |
| `student_id` | uuid | not null |  | FK to `students` (restrict on delete) |
| `marks_obtained` | decimal(6,2) | nullable |  | null when absent or exempt; cached total when the paper has components |
| `correct_count` | smallint | nullable |  | objective tests |
| `incorrect_count` | smallint | nullable |  |  |
| `unattempted_count` | smallint | nullable |  |  |
| `negative_marks` | decimal(6,2) | nullable |  |  |
| `subject_rank` | integer | nullable |  | rank in this paper across all batches that took it |
| `is_supplementary` | boolean | not null | false | mark earned in a SUPPLEMENTARY / RETEST exam |
| `revision_count` | smallint | not null | 0 | times changed after re-evaluation |
| `grade` | varchar(10) | nullable |  | from the grade scale at save time |
| `grade_point` | decimal(4,2) | nullable |  |  |
| `is_absent` | boolean | not null | false |  |
| `is_exempt` | boolean | not null | false | medical or other exemption; left out of totals |
| `remarks` | varchar(255) | nullable |  |  |
| `entered_by_id` | uuid | nullable |  | FK to `users` (setnull on delete) |
| `entered_at` | timestamptz | nullable |  |  |
| `verified_by_id` | uuid | nullable |  | FK to `users` (setnull on delete) |
| `verified_at` | timestamptz | nullable |  |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Unique (organization_id, exam_schedule_id, student_id); Index (organization_id, campus_id, exam_id); Index (organization_id, student_id, exam_id); Index (organization_id, exam_id, subject_id); Index (organization_id, exam_id, batch_id).

**Relations:** belongs to `organizations`, `campuses`, `exam_schedules`, `exams`, `batches`, `subjects`, `students`, `users`; has many `exam_mark_components`, `exam_re_evaluation_requests`.

### exam_schedule_components

Prisma model `ExamScheduleComponent`. Tenant table (filtered by `organization_id`). Marks component of an exam paper: Theory 80 + Internal 20, or Theory 70 + Practical 30.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `exam_schedule_id` | uuid | not null |  | FK to `exam_schedules` (cascade on delete) |
| `name` | varchar(60) | not null |  | Theory, Practical, Internal Assessment |
| `code` | varchar(20) | not null |  | TH, PR, IA |
| `max_marks` | decimal(6,2) | not null |  |  |
| `pass_marks` | decimal(6,2) | nullable |  | set when the component has its own pass rule |
| `sort_order` | integer | not null | 0 |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Unique (organization_id, exam_schedule_id, code).

**Relations:** belongs to `organizations`, `exam_schedules`; has many `exam_mark_components`.

### exam_mark_components

Prisma model `ExamMarkComponent`. Tenant table (filtered by `organization_id`). Marks of one student in one component of a paper; ExamMark.marksObtained holds the cached total.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `exam_mark_id` | uuid | not null |  | FK to `exam_marks` (cascade on delete) |
| `component_id` | uuid | not null |  | FK to `exam_schedule_components` (restrict on delete) |
| `marks_obtained` | decimal(6,2) | nullable |  |  |
| `is_absent` | boolean | not null | false |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Unique (organization_id, exam_mark_id, component_id); Index (organization_id, component_id).

**Relations:** belongs to `organizations`, `exam_marks`, `exam_schedule_components`.

### exam_re_evaluation_requests

Prisma model `ExamReEvaluationRequest`. Tenant table (filtered by `organization_id`). Re-checking / re-totalling request for one exam paper of a student, raised after results are published.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `campus_id` | uuid | not null |  | FK to `campuses` (restrict on delete) |
| `exam_mark_id` | uuid | not null |  | FK to `exam_marks` (restrict on delete) |
| `student_id` | uuid | not null |  | FK to `students` (restrict on delete) |
| `requested_by_user_id` | uuid | nullable |  | FK to `users` (setnull on delete). parent / student login |
| `reason` | varchar(500) | not null |  |  |
| `status` | enum `ReEvaluationStatus` | not null | REQUESTED |  |
| `fee_invoice_id` | uuid | nullable |  | FK to `fee_invoices` (setnull on delete). ad-hoc invoice for the re-checking fee |
| `original_marks` | decimal(6,2) | nullable |  |  |
| `revised_marks` | decimal(6,2) | nullable |  |  |
| `reviewed_by_id` | uuid | nullable |  | FK to `users` (setnull on delete) |
| `reviewed_at` | timestamptz | nullable |  |  |
| `review_remarks` | varchar(500) | nullable |  |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Index (organization_id, campus_id, status, created_at); Index (organization_id, student_id); Index (organization_id, exam_mark_id).

**Relations:** belongs to `organizations`, `campuses`, `exam_marks`, `students`, `fee_invoices`, `users`.

### report_card_templates

Prisma model `ReportCardTemplate`. Tenant table (filtered by `organization_id`). Report card design: board style, layout blocks and display options.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (cascade on delete) |
| `name` | varchar(100) | not null |  |  |
| `board_style` | enum `ReportCardBoardStyle` | not null |  |  |
| `grade_scale_id` | uuid | nullable |  | FK to `grade_scales` (setnull on delete) |
| `layout` | jsonb | not null |  | blocks, columns, fonts, logo position, signature slots |
| `settings` | jsonb | nullable |  | { showRank, showAttendance, showCoScholastic, showGradeOnly, showPercentage } |
| `course_ids` | uuid[] | not null |  | empty = usable for every course |
| `is_default` | boolean | not null | false |  |
| `status` | enum `RecordStatus` | not null | ACTIVE |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Unique (organization_id, name); Index (organization_id, board_style, status).

**Relations:** belongs to `organizations`, `grade_scales`; has many `report_cards`.

### report_cards

Prisma model `ReportCard`. Tenant table (filtered by `organization_id`). Generated result of one student for an exam, a term or the whole year, with the PDF.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `campus_id` | uuid | not null |  | FK to `campuses` (restrict on delete) |
| `academic_year_id` | uuid | not null |  | FK to `academic_years` (restrict on delete) |
| `student_id` | uuid | not null |  | FK to `students` (restrict on delete) |
| `batch_id` | uuid | not null |  | FK to `batches` (restrict on delete). batch at the time of the result |
| `scope` | enum `ReportCardScope` | not null |  |  |
| `exam_id` | uuid | nullable |  | FK to `exams` (restrict on delete). set when scope is EXAM |
| `term_id` | uuid | nullable |  | FK to `terms` (restrict on delete). set when scope is TERM |
| `scope_key` | varchar(45) | not null |  | "EXAM:{examId}", "TERM:{termId}" or "ANNUAL"; makes the unique key work without NULLs |
| `template_id` | uuid | nullable |  | FK to `report_card_templates` (setnull on delete) |
| `total_marks` | decimal(8,2) | nullable |  | marks obtained |
| `max_marks` | decimal(8,2) | nullable |  |  |
| `percentage` | decimal(5,2) | nullable |  |  |
| `grade` | varchar(10) | nullable |  |  |
| `grade_point` | decimal(4,2) | nullable |  | GPA / CGPA |
| `rank` | integer | nullable |  | rank in the batch; null when ranks are switched off |
| `rank_out_of` | integer | nullable |  |  |
| `overall_rank` | integer | nullable |  | rank across all batches that took the exam ("AIR-style") |
| `overall_rank_out_of` | integer | nullable |  |  |
| `percentile` | decimal(5,2) | nullable |  |  |
| `result` | enum `ReportCardResult` | not null | NOT_APPLICABLE |  |
| `remarks` | text | nullable |  | overall remark printed on the card |
| `attendance_summary` | jsonb | nullable |  | { workingDays, presentDays, percent } |
| `subject_results` | jsonb | nullable |  | frozen per-subject rows used to render the PDF |
| `status` | enum `ReportCardStatus` | not null | DRAFT |  |
| `pdf_file_id` | uuid | nullable |  | FK to `file_assets` (setnull on delete) |
| `generated_at` | timestamptz | nullable |  |  |
| `published_at` | timestamptz | nullable |  |  |
| `published_by_id` | uuid | nullable |  | User id (audit only, no FK) |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Unique (organization_id, student_id, academic_year_id, scope_key); Index (organization_id, batch_id, scope_key, status); Index (organization_id, campus_id, academic_year_id, status); Index (organization_id, exam_id).

**Relations:** belongs to `organizations`, `campuses`, `academic_years`, `students`, `batches`, `exams`, `terms`, `report_card_templates`, `file_assets`; has many `report_card_remarks`.

### report_card_remarks

Prisma model `ReportCardRemark`. Tenant table (filtered by `organization_id`). Remark written on a report card by the class teacher, principal or a subject teacher.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (cascade on delete) |
| `report_card_id` | uuid | not null |  | FK to `report_cards` (cascade on delete) |
| `remark_type` | enum `ReportCardRemarkType` | not null |  |  |
| `subject_id` | uuid | nullable |  | FK to `subjects` (setnull on delete). SUBJECT_TEACHER remarks only |
| `area` | varchar(80) | nullable |  | CO_SCHOLASTIC area, e.g. Discipline, Art |
| `grade` | varchar(10) | nullable |  | optional grade for co-scholastic areas |
| `body` | text | not null |  |  |
| `author_id` | uuid | nullable |  | FK to `users` (setnull on delete) |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Index (organization_id, report_card_id, remark_type).

**Relations:** belongs to `organizations`, `report_cards`, `subjects`, `users`.

### Enums in 07-exams.prisma

| Enum | Values | Meaning |
|---|---|---|
| `GradeScaleType` | PERCENTAGE_BANDS, GRADE_POINT, PASS_FAIL |  |
| `ExamType` | UNIT_TEST, MID_TERM, FINAL, MOCK, WEEKLY_TEST, PRE_BOARD, PRACTICAL, SUPPLEMENTARY, RETEST, ENTRANCE |  |
| `ReEvaluationStatus` | REQUESTED, FEE_PENDING, UNDER_REVIEW, NO_CHANGE, MARKS_REVISED, REJECTED |  |
| `ExamStatus` | DRAFT, SCHEDULED, ONGOING, MARKS_ENTRY, PUBLISHED, CANCELLED | Lifecycle: DRAFT -> SCHEDULED -> ONGOING -> MARKS_ENTRY -> PUBLISHED. CANCELLED is a terminal side exit. |
| `MarksEntryStatus` | PENDING, IN_PROGRESS, SUBMITTED, VERIFIED, LOCKED | Marks-entry progress of one exam paper (ExamSchedule). |
| `ReportCardBoardStyle` | CBSE, ICSE, STATE, COACHING, GPA |  |
| `ReportCardScope` | EXAM, TERM, ANNUAL |  |
| `ReportCardStatus` | DRAFT, GENERATED, PUBLISHED, WITHHELD |  |
| `ReportCardResult` | PASS, FAIL, COMPARTMENT, PROMOTED, DETAINED, ABSENT, NOT_APPLICABLE |  |
| `ReportCardRemarkType` | CLASS_TEACHER, PRINCIPAL, SUBJECT_TEACHER, CO_SCHOLASTIC |  |
