# Notification Template Catalog

**In simple words:** This appendix collects, in one place, every message EduFlow can send — which event triggers it, on which channel, to whom, and the template text. The Notifications module delivers all of them.

The catalog has **319 notification rules**. Template variables are written like `{{student_name}}`. WhatsApp and SMS templates must be approved by Meta and registered on DLT before use; see the *WhatsApp Module* and *SMS Module* chapters.

## Dashboard Module

| Event | Trigger | Channel | Recipient | Template text |
|---|---|---|---|---|
| `metrics.snapshot.computed` | The 15-minute job, the nightly close job or `DASH-API-16` | None (internal) | - | No message. The event clears the Redis keys of that campus and lets an open dashboard refetch |

## Organizations Module

| Event | Trigger | Channel | Recipient | Template text |
|---|---|---|---|---|
| `organization.created` | ORG-API-03 or 32 | SMS | Owner | "Your EduFlow code is 482913. It is valid for 10 minutes." |
| `organization.verified` | ORG-API-04 | WhatsApp, Email | Owner | "Welcome to EduFlow, Rajesh. Three steps to start: set up your session, import students, collect your first fee." |
| `organization.onboarding.completed` | ORG-API-07 | In-app | Owner | "Setup done. Next: import your students from Excel." |
| `organization.activated` | First attendance or receipt | In-app | Owner; founder dashboard | "Your first receipt is out. Parents can now get it on WhatsApp." |
| `organization.limit.near` | 80% of a limit | In-app | Organization Admins | "You have used 240 of 300 students on Growth." |
| `organization.limit.reached` | 100% of a limit | In-app, WhatsApp, Email | Organization Admins | "You have crossed 300 students. You can add 30 more. Pro costs Rs 5,999 a month." |
| `subscription.trial.ending` | Day 10, 12 and 14 of the trial | In-app, WhatsApp, Email | Owner | "2 days left in your trial. Pay by UPI to keep all Pro features." |
| `subscription.trial.expired` | Lifecycle job | In-app, WhatsApp, Email | Owner | "Your trial has ended. Your data is safe. Choose a plan to continue." |
| `subscription.activated`, `subscription.renewed` | Webhook | Email, In-app | Owner, Accountants | "Payment received. Tax invoice EF/26-27/000042 is attached." |
| `subscription.plan_changed` | Upgrade applied or downgrade at period end | In-app, Email | Organization Admins | "Your plan is now Pro. New limits apply from today." |
| `subscription.payment_failed` | Dunning day 0, 3, 7 | In-app, WhatsApp, Email | Owner | "Your payment of Rs 7,078.82 did not go through. Pay here by UPI." |
| `subscription.past_due` | Dunning day 10 and 15 | In-app banner for all staff, WhatsApp, Email | Owner | "Restricted mode is on. Fee collection still works. Pay to restore everything." |
| `subscription.cancelled`, `organization.cancelled` | Day 30, ORG-API-14 | Email, WhatsApp | Owner | "Your plan has ended. Your data is safe for 90 days. Export or pay to restore." |
| `subscription.invoice.issued` | Renewal or manual invoice | Email | Owner, Accountants | "Invoice EF/26-27/000118 for Rs 17,698.82 is due on 15 Mar 2027." |
| `subscription.invoice.refunded` | ORG-API-46 | Email | Owner, Accountants | "Refund of Rs 2,358.82 started. Credit note EF/CN/26-27/0007 is attached." |
| `addon.purchased`, `addon.activated` | ORG-API-28, webhook | In-app, Email | Organization Admins | "Rs 1,999 added to your WhatsApp wallet." |
| `addon.expired`, `addon.cancelled` | Expiry job, ORG-API-29 | In-app, Email | Organization Admins | "Your extra campus add-on ends on 30 Jun 2027." |
| `organization.suspended`, `organization.reactivated` | ORG-API-35, 36 | Email | Owner | "Your EduFlow account is suspended. Reason: ... Reply to this email to talk to us." |
| `organization.ownership.transferred` | ORG-API-13 | Email, In-app | Old and new owner | "Dr. Anita Verma is now the owner of this EduFlow account." |
| `organization.updated` | ORG-API-09, 10, 34 | none | Cache and audit only | - |
| `platform.impersonation.started` | ORG-API-39 | In-app | Owner | "EduFlow support opened a 30-minute support session. Reason: Ticket 4821." |

## Multi Campus Module

| Event | Trigger | Channel | Recipient | Template text |
|---|---|---|---|---|
| `campus.created` | `CAMP-API-02`, signup | In-app, Email | All Organization Admins | New campus {campusName} ({campusCode}) was added by {actorName}. Next steps: copy setup and assign users. |
| `campus.deactivated` | `CAMP-API-06`, or the limit job | In-app, Email | Organization Admins and users assigned to the campus | {campusName} is now inactive. You can no longer select it. Reason: {reason}. |
| `campus.activated` | `CAMP-API-07` | In-app | Organization Admins and users assigned to the campus | {campusName} is active again. |
| `campus.archived` | `CAMP-API-08` | In-app, Email | All Organization Admins | {campusName} was archived by {actorName}. Its data stays available as read only. |
| `campus.deleted` | `CAMP-API-05` | In-app | All Organization Admins | The empty campus {campusName} was deleted by {actorName}. |
| `campus.main_changed` | `CAMP-API-09` | In-app, Email | All Organization Admins | {campusName} is now the main campus of {orgName}. Before: {previousCampusName}. |
| `campus.users.changed` | `CAMP-API-11`, `USR-API-12`, staff transfer | In-app; Email for added users | Each added or removed user | You now have access to {campusName}. Use the campus switcher at the top of the screen. / Your access to {campusName} was removed. |
| `campus.setup.copied` | `CAMP-API-12` | In-app | The user who ran the copy | Setup copied from {sourceName} to {targetName}: {coursesCopied} courses, {feeStructuresCopied} fee structures. Review the fee structures and activate them. |
| `campus.updated` | `CAMP-API-04` | None | - | No message. The event clears caches and feeds the audit trail and customer webhooks. |

## Student Admission Module

| Event | Trigger | Channel | Recipient | Template text |
|---|---|---|---|---|
| `admission.inquiry.created` | Lead saved (not by import) | WhatsApp, Email; In-app | Parent; owner of a website lead | Thank you for your interest in {orgName}. Your inquiry number is {inquiryNo}. {counsellorName} will call you soon. |
| `admission.inquiry.assigned` | Owner changed, by hand or automatically | In-app | New owner | {count} lead(s) assigned to you by {actorName}. |
| `admission.followup.due` | Reminder job, 15 minutes before `scheduledAt` | In-app | Owner of the follow-up | Follow-up at {time}: {followUpType} with {guardianName} for {studentName} ({inquiryNo}). |
| `admission.demo.scheduled` | `ADM-API-07` | WhatsApp, In-app | Parent; class teacher of the demo batch | Your free demo class at {orgName} is booked: {batchName}, {demoDate} at {demoTime}. Address: {campusAddress}. |
| `admission.application.submitted` | `ADM-API-18`, `ADM-API-40` | WhatsApp, Email; In-app | Guardian; lead owner | We received application {applicationNo} for {studentName}, {courseName}. Track it here: {trackingUrl} |
| `admission.application.documents_requested` | `ADM-API-19` with `DOCUMENTS_PENDING` | WhatsApp, Email | Guardian | Please submit these documents for application {applicationNo}: {documentList}. Upload here: {trackingUrl} |
| `admission.application.test_scheduled` | `ADM-API-20` | WhatsApp, Email | Guardian | Entrance test for {studentName}: {testDate} at {testTime}, {venue}. Please bring application number {applicationNo}. |
| `admission.application.interview_scheduled` | `ADM-API-21` | WhatsApp, Email | Guardian | Interview for the admission of {studentName}: {interviewDate} at {interviewTime}, {campusName}. |
| `admission.application.approved` | `ADM-API-22` | WhatsApp, Email; In-app | Guardian; lead owner | Good news. {studentName} is selected for {courseName} at {orgName}. Please complete the admission by {seatHeldUntil} to keep the seat. |
| `admission.application.waitlisted` | `ADM-API-23` | WhatsApp, Email | Guardian | Application {applicationNo} of {studentName} is on the waiting list. We will inform you when a seat is free. |
| `admission.application.rejected` | `ADM-API-24` | WhatsApp, Email | Guardian | Thank you for applying to {orgName}. We are unable to offer {studentName} a seat in {courseName} this session. |
| `admission.application.withdrawn` | `ADM-API-25` | WhatsApp; In-app | Guardian; approvers of the campus | Application {applicationNo} has been withdrawn as you requested. |
| `admission.application.fee_paid` | Payment completed in *Payments Module* | In-app | Lead owner | Application fee received for {applicationNo} ({studentName}). |
| `admission.application.enrolled` | `ADM-API-27` | In-app | Lead owner, Principal | {studentName} is admitted: {admissionNo}, {batchName}. |

## Student Profile Module

| Event | Trigger | Channel | Recipient | Template text |
|---|---|---|---|---|
| `student.admitted` | Student created by any of the three paths (not sent for imports) | WhatsApp, In-app, Email | Primary guardian | Welcome to {orgName}. {studentName} is admitted to {batchName}. Admission no: {admissionNo}. |
| `student.enrolled` | New enrollment | In-app | Class teacher | {studentName} ({admissionNo}) has joined {batchName}. |
| `student.status_changed` | `STU-API-07` | In-app | Principal, Accountant of the campus | {studentName} is now {status} from {effectiveDate}. Reason: {reason}. |
| `student.withdrawn` | Leaving status saved | WhatsApp, Email | Primary guardian | {studentName} has been marked as {status} at {orgName} from {effectiveDate}. Old receipts and report cards stay in your parent app. |
| `student.promoted` | Promotion run | WhatsApp, In-app | Primary guardian, student | Congratulations. {studentName} is promoted to {batchName} for {academicYear}. |
| `student.detained` | Promotion run | In-app | Principal | {studentName} is marked as detained in {courseName}. Please speak to the family. |
| `student.document.verified` | `STU-API-27` | In-app | Primary guardian | The {documentTitle} of {studentName} has been verified by the school. |
| `student.note.shared` | Note saved with `isSharedWithParent` | WhatsApp, In-app | Guardians with `receivesCommunication` | A note from {teacherName} about {studentName}: "{noteTitle}". Open the app to read it. |
| `student.transfer.requested` | `STU-API-33` | In-app | Users with `students.approve` for the campus | Transfer request: {studentName} from {fromBatch} to {toBatch} on {effectiveDate}. |
| `student.transfer.approved` | `STU-API-35` | In-app, WhatsApp | Requester, both class teachers (in-app); primary guardian (WhatsApp) | {studentName} moves to {toBatch} from {effectiveDate}. |
| `student.transfer.rejected` | `STU-API-36` | In-app | Requester | Transfer of {studentName} was rejected: {reason}. |
| `student.import.completed` | Import job ends | In-app, Email | User who started the job | Student import finished: {successRows} created, {failedRows} failed. Download the error file to fix them. |
| `student.birthday` | Daily job at 08:00 in the organization's timezone | WhatsApp, In-app | Primary guardian, student; class teacher (in-app) | Happy birthday, {studentName}! Best wishes from everyone at {orgName}. |

## Teachers Module

| Event | Trigger | Channel | Recipient | Template text |
|---|---|---|---|---|
| `teacher.created` | `TCH-API-02` or import, with invitation | Email, WhatsApp | New teacher | "Hi Kavita, Bright Future Public School added you to EduFlow. Set your password: {link}" |
| `teacher.batch.assigned` | `TCH-API-10` or a handover | In-app, WhatsApp | The teacher | "From 1 Jul 2027 you teach Mathematics in 8-C." |
| `teacher.batch.unassigned` | Row closed or exit handover | In-app | Old and new teacher | "From 1 Dec 2027 Rahul Verma teaches 10-A Mathematics." |
| `teacher.status_changed` | `TCH-API-06` | In-app, Email | Principal, Organization Admin | "Priya Nair (BF-EMP-0031) resigned. Last day 30 Nov 2027." |
| `teacher.subjects.changed` | `TCH-API-08` | In-app | The teacher | "Your subjects: Mathematics (main), Physics, Chemistry." |
| `teacher.document.uploaded` | `TCH-API-12` | In-app | Principal | "New police verification for Priya Nair. Please verify." |
| `teacher.import.completed` | Import job ends | In-app, Email | User who started it | "Teacher import done: 22 added, 0 failed." |
| `staff.document.expiring` | Daily job, 30 days ahead | In-app, Email | Organization Admin | "Police verification of Priya Nair expires on 4 Nov 2027." |
| `teacher.updated`, `teacher.deleted` | `TCH-API-04`, `TCH-API-05` | None | Webhooks and audit only | - |

## Staff Module

| Event | Trigger | Channel | Recipient | Template text |
|---|---|---|---|---|
| `staff.created` | `STF-API-02` or import, with invitation | Email, WhatsApp | New employee | "Hi Neha, Bright Future Public School added you to EduFlow: {link}" |
| `staff.updated` | Bank details changed (`STF-API-12`) | Email, In-app | The employee | "Your salary bank account was changed on 14 Oct 2027. Not you? Call the office." |
| `staff.status_changed` | `STF-API-06` | In-app | Org Admin, the manager | "Mohd. Imran is on leave from 1 Dec 2027." |
| `staff.position_changed` | `STF-API-07` | In-app, Email | The employee | "From 1 Apr 2028 your designation is Senior Front Desk Executive." |
| `staff.transferred` | `STF-API-08` | In-app, Email | Employee, both campus heads | "Neha Kapoor moves to City Campus from 16 Aug 2027." |
| `staff.exit.recorded` | `STF-API-09` | In-app, Email | Org Admin, HR, Payroll users | "Ramesh Yadav resigned. Last day 20 Nov 2027. Full and final pending." |
| `staff.exited` | Exit job | In-app | Org Admin | "Ramesh Yadav's login was switched off at 23:59." |
| `staff.document.uploaded`, `staff.document.verified` | `STF-API-14`, `STF-API-16` | In-app | HR; the employee | "Your police verification was verified." |
| `staff.document.expiring` | Daily job (`STF-BR-14`) | In-app, Email | Org Admin, HR, the employee | "Police verification of Neha Kapoor expires on 12 Dec 2027." |
| `staff.import.completed` | Import job ends | In-app, Email | User who started it | "Staff import done: 78 added, 4 failed." |
| `staff.birthday`, `staff.work_anniversary` | 07:00 job (`STF-BR-20`) | In-app, WhatsApp | The employee | "Happy 3rd work anniversary, Priya!" |
| `staff.deleted` | `STF-API-05` | None | Webhooks and audit only | - |

## Attendance Module

| Event | Trigger | Channel | Recipient | Template text |
|---|---|---|---|---|
| `student.absent` | Delayed job or ATT-API-07 finds an `ABSENT` record with `notifiedAt` empty | In-app, WhatsApp, SMS, Email | Guardians of the student | "Dear Parent, {{studentName}} ({{batchName}}) is marked absent today, {{date}}. If this is a mistake, please contact the class teacher." |
| `student.late` | Same job, only when `attendance.notify_late` is on | In-app, WhatsApp | Guardians | "{{studentName}} ({{batchName}}) reached {{lateMinutes}} minutes late today, {{date}}." |
| `attendance.updated` | A record with `notifiedAt` set is corrected to `PRESENT` or `LATE` | In-app, WhatsApp, SMS | Guardians | "Correction: {{studentName}} ({{batchName}}) was present on {{date}}. Please ignore the earlier absent message." |
| `student.attendance.low` | Weekly job, rule ATT-BR-18 | In-app, WhatsApp, Email | Guardians; in-app copy to the class teacher | "{{studentName}}'s attendance is {{percent}}% ({{attended}} of {{working}} days). The minimum is {{minPercent}}%. Please meet the class teacher." |
| `attendance.marked` | A session is submitted | None | Dashboard and Analytics listeners | No message. The first one sets `Organization.activatedAt`. |
| `attendance.session.locked` | Auto-lock, manual lock or month close | None | Audit and Dashboard listeners | No message. |
| `attendance.session.unlocked` | ATT-API-06 | In-app | Teacher who took the session | "{{batchName}}, {{date}} was reopened by {{actorName}}. You can correct it until it locks again." |
| `staff.checked_in`, `staff.checked_out` | ATT-API-22, ATT-API-23 | None | Dashboard listener | No message. The screen shows the result. |
| `staff.absent` | A staff row is saved as `ABSENT` | In-app | The staff member and the reporting manager | "You are marked absent on {{date}}. Apply for leave if this was a planned day off." |
| `attendance.import.completed` | Import job ends | In-app, Email | User who started the import | "Attendance import finished: {{successRows}} rows saved, {{failedRows}} failed. Download the error file." |

## Leave Module

| Event | Trigger | Channel | Recipient | Template text |
|---|---|---|---|---|
| `leave.request.submitted` | LEV-API-14 | In-app | Requester | "Your CL for 7-11 Aug (3.0 days) went to Dr. Anita Verma." |
| `leave.approval.pending` | LEV-API-14, next level, reminder job | In-app, Email | Current approver | "Priya Nair asks for CL, 7-11 Aug 2027 (3.0 days). Please decide." |
| `leave.request.approved` | LEV-API-16, last level | In-app, Email | Requester; Timetable listener | "Your CL for 7-11 Aug is approved by Dr. Anita Verma." |
| `leave.request.rejected` | LEV-API-17 | In-app, Email | Requester | "Your EL for 9-13 Aug was not approved: {{remarks}}" |
| `leave.request.cancelled` | LEV-API-18 | In-app | Approvers | "Priya Nair cancelled CL for 7-11 Aug." |
| `leave.balance.allocated`, `leave.balance.adjusted` | LEV-API-10, 11, 12 | In-app | Staff concerned | "Your EL balance changed by +1.0 day: {{reason}}" |
| `student.leave.requested` | PP-API-21, LEV-API-23 | In-app | Class teacher | "Sunita Devi asked leave for Aarav Sharma (10-A): 27 Jul, 1 day." |
| `student.leave.approved`, `student.leave.rejected` | LEV-API-25, 26 | In-app, WhatsApp | Guardians | "Leave for Aarav on 27 Jul is approved by Priya Nair." |
| `student.leave.cancelled` | PP-API-22 | In-app | Class teacher | "Sunita Devi cancelled the leave request for Aarav (30 Jul)." |

## Batch Module

| Event | Trigger | Channel | Recipient | Template text |
|---|---|---|---|---|
| `academic_year.activated` | BAT-API-05 | In-app | All staff of the organization | "Session {{yearName}} is now the current session. All screens open in it from today." |
| `academic_year.closed` | BAT-API-06 | In-app, Email | `ORG_ADMIN`, Principals | "Session {{yearName}} is closed. Attendance, marks and enrollments of that session are now read only." |
| `batch.created` | BAT-API-17, BAT-API-25 | None | Dashboard, Timetable, Fees listeners | No message. |
| `batch.status_changed` | BAT-API-21, the daily job, BAT-API-06 | In-app | Class teacher of the batch | "Batch {{batchName}} is now {{status}}." |
| `enrollment.created` | BAT-API-29, 32, 33, 35, transfers | In-app, WhatsApp, Email | Guardians of the student; in-app to the class teacher | "{{studentName}} is enrolled in {{batchName}} ({{courseName}}) from {{enrollmentDate}}." |
| `enrollment.withdrawn` | BAT-API-31 | In-app, Email | Guardians; class teacher; Accountant | "{{studentName}} has left {{batchName}} on {{endDate}}. Reason: {{endReason}}." |
| `enrollment.promoted` | BAT-API-35 | In-app, WhatsApp | Guardians | "Good news. {{studentName}} is promoted to {{targetCourseName}}, batch {{targetBatchName}}, for session {{targetYearName}}." |
| `enrollment.detained` | BAT-API-35 | In-app only | Class teacher and Principal | No parent message. The school talks to the family first; the Principal sends a personal message from *Notifications Module*. |
| `holiday.declared` | BAT-API-41, BAT-API-44 | In-app, WhatsApp | Guardians and staff of the campus | "{{holidayName}}: the institute is closed from {{startDate}} to {{endDate}}." |
| `calendar.event.published` | BAT-API-46 or BAT-API-47 sets `isPublished` true | In-app, WhatsApp, Email | Audience of the event | "{{eventTitle}} on {{startDate}} at {{location}}, {{startTime}} to {{endTime}}." |
| `calendar.event.updated` | `startAt`, `endAt` or `location` of a published event changes | In-app, WhatsApp | Audience of the event | "Change: {{eventTitle}} is now on {{startDate}}, {{startTime}} at {{location}}." |
| `ptm.booking.created` | BAT-API-51, BAT-API-57 | In-app, WhatsApp | The guardian; in-app to the teacher | "Your meeting with {{teacherName}} for {{studentName}} is booked on {{date}} at {{slotTime}}." |
| `ptm.booking.cancelled` | BAT-API-53, BAT-API-58 | In-app, WhatsApp | The guardian; in-app to the teacher | "Your PTM slot on {{date}} at {{slotTime}} is cancelled. You can book a new slot in the app." |

## Timetable Module

| Event | Trigger | Channel | Recipient | Template text |
|---|---|---|---|---|
| `substitution.assigned` | TT-API-16, TT-API-17 | In-app, push, WhatsApp | Substitute | "{{date}}: please take {{batch}} {{subject}}, {{slot}} ({{time}}), {{room}}, for {{absentTeacher}}." |
| `substitution.cancelled` | TT-API-18, leave cancelled, holiday | In-app, push | Substitute | "Cover for {{batch}}, {{slot}} on {{date}} is cancelled." |
| `class.session.scheduled` | TT-API-21 | In-app, push, WhatsApp | Students, guardians | "Extra {{subject}} class for {{batch}} on {{date}}, {{start}}-{{end}}, {{roomOrLink}}." |
| `class.session.cancelled` | TT-API-24 with `notify` | In-app, push, WhatsApp | Students, guardians, teacher | "{{subject}} class of {{batch}} on {{date}} at {{start}} is cancelled: {{reason}}." |
| `class.session.rescheduled` | TT-API-25 | In-app, push, WhatsApp | Students, guardians, teacher | "{{subject}} class moved from {{oldDate}} {{oldStart}} to {{newDate}} {{newStart}}." |
| `class.session.completed` | TT-API-26 | None | Dashboard, Payroll listeners | No message. |
| `timetable.updated` | TT-API-06 to 09 | In-app (one per batch after 15 quiet minutes) | Teachers, students, guardians of the batch | "The timetable of {{batch}} has changed. Tap to see the new week." |

## Subjects Module

| Event | Trigger | Channel | Recipient | Template text |
|---|---|---|---|---|
| `subject.created` | SUB-API-02, SUB-API-06 | None | Listeners only | No message; clears lookup and dashboard caches |
| `subject.archived` | SUB-API-05 | In-app | Org Admins, Principals | "Sanskrit was archived by Rajesh Sharma. It is hidden from new timetables and exams." |
| `curriculum.updated` | SUB-API-11 to SUB-API-15 | In-app | Principals of campuses running the course | "Class 10 curriculum changed by Dr. Anita Verma: French added to LANG2." |
| `subject.teacher.assigned` | SUB-API-17, SUB-API-20, TCH-API-10 | In-app, email | The teacher | "You teach Mathematics in 10-A from 1 Apr 2027." |
| `subject.teacher.assigned` (new primary after the batch started) | Same | In-app, WhatsApp | Parents of the batch | "Aarav's Hindi teacher is A. Pandey from 11 Aug 2027." |
| `subject.teacher.unassigned` | SUB-API-19, SUB-API-20 | In-app | The teacher | "Your Hindi class in 10-A ends on 10 Aug 2027." |

## Homework Module

| Event | Trigger | Channel | Recipient | Template text |
|---|---|---|---|---|
| `homework.published` | HW-API-02 with publish, HW-API-06 | In-app, Push | Students; guardians | "New {{subject}} homework for {{studentName}}: {{title}}. Due {{dueDate}}." |
| `homework.updated` | Due date changed or file added | In-app, Push | Students; guardians | "{{subject}} homework {{title}} changed. Due {{dueDate}}." |
| `homework.reminder.sent` | 17:00 job, HW-API-09 | Push; WhatsApp to guardians | `PENDING` students and their guardians | "Reminder: {{studentName}}'s {{subject}} homework {{title}} is due {{dueDate}}." |
| `homework.cancelled` | HW-API-08 | In-app, Push | Students; guardians | "{{subject}} homework {{title}} is cancelled: {{reason}}." |
| `homework.closed` | Close job, HW-API-07 | In-app | Author teacher | "{{title}} ({{batchName}}) closed: {{missing}} missing, {{toCheck}} to check." |
| `homework.submitted` | HW-API-25, HW-API-27 | In-app digest (`LOW`) | Author teacher | "{{studentName}} handed in {{title}} ({{status}})." |
| `homework.graded` | HW-API-15; HW-API-13 with `GRADED` | In-app, Push | Student; guardians in-app | "{{title}} checked: {{marks}}/{{maxMarks}} {{grade}}. {{feedback}}" |
| `homework.resubmit_requested` | HW-API-16 | In-app, Push | Student; guardians in-app | "Please redo {{title}}: {{feedback}}" |
| `study_material.published` | HW-API-20, HW-API-21 | In-app, Push | Students; guardians if `visibleToParents` | "New {{materialType}} in {{subject}}: {{title}}." |

## Exams Module

| Event | Trigger | Channel | Recipient | Template text |
|---|---|---|---|---|
| `exam.schedule.published` | EXM-API-11, or a paper change after it | In-app, WhatsApp, SMS | Guardians and students of the batches | "{{examName}} date sheet for {{studentName}} ({{batchName}}) is out. First paper: {{subject}}, {{date}}." |
| `exam.marks_entry.opened` | EXM-API-12 | In-app, Email | Subject and class teachers | "Marks entry is open for {{examName}}. Deadline {{deadline}}." |
| `exam.marks.submitted` | EXM-API-30 | In-app | Users with `exams.verify_marks` | "{{teacherName}} submitted {{batchName}} {{subject}}. Please verify." |
| `exam.marks.reopened` | EXM-API-32 | In-app, Email | Teacher who entered | "{{batchName}} {{subject}} was sent back: {{reason}}" |
| `exam.results.published` | EXM-API-13 | In-app, WhatsApp, SMS, Email | Guardians and students | "{{examName}} results for {{studentName}}: {{total}}/{{max}} ({{percent}}%), Grade {{grade}}." |
| `exam.cancelled` | EXM-API-15 after the date sheet was sent | In-app, WhatsApp, SMS | Guardians and students | "{{examName}} is cancelled. New dates will follow." |
| `exam.reevaluation.fee_pending` | EXM-API-39 with a fee | In-app, WhatsApp | Requesting guardian | "Re-checking of {{subject}} accepted. Pay ₹{{fee}} by {{dueDate}} in the app." |
| `exam.reevaluation.resolved`, `.rejected` | EXM-API-40, EXM-API-41 | In-app, WhatsApp | Requesting guardian | "{{subject}} re-checked: {{outcomeText}}." |

## Report Cards Module

| Event | Trigger | Channel | Recipient | Template text |
|---|---|---|---|---|
| `reportcard.generated` | Job finished | In-app | Requester | "Report cards for {{batchName}} {{scopeName}} are ready: {{generatedCount}} built, {{failedCount}} failed." |
| `reportcard.generation.failed` | One student failed | In-app, Email | Requester | "The report card of {{studentName}} ({{batchName}}) could not be built: {{reason}}." |
| `reportcard.published` (version 1) | RPT-API-13, RPT-API-21 | In-app, WhatsApp, Email | Guardians; student in-app | "The {{scopeName}} report card of {{studentName}} ({{batchName}}) is ready. Open the EduFlow app to view and download it." |
| `reportcard.published` (version 2 or later) | Publish after a reissue | In-app, WhatsApp | Guardians | "An updated {{scopeName}} report card (version {{version}}) of {{studentName}} is available. Please use this copy." |
| `reportcard.regenerated` | Worker after RPT-API-12 | In-app | Principal, class teacher | "{{studentName}}'s card is rebuilt as version {{version}}. Ranks changed for {{rankChangedCount}} students." |
| `reportcard.withheld` | RPT-API-14, RPT-API-21 | In-app | Class teacher; Accountant for "Fee dues" | "{{studentName}}'s {{scopeName}} card is withheld: {{reason}}." No parent message. |

## Fees Module

| Event | Trigger | Channel | Recipient | Template text |
|---|---|---|---|---|
| `fee.structure.assigned` | Bulk or single assignment finished | In-app | Requester | "Class 10 Fees 2027-28 assigned to 38 students. 2 skipped." |
| `fee.invoices.generated` | Generate, bulk-issue or carry-forward job finished | In-app | Requester; Organization Admin for scheduled runs | "184 invoices created for Quarter 2. 6 skipped. 0 failed." |
| `fee.invoice.issued` | Invoice issued | WhatsApp, SMS, Email, In-app | Fee payer | "Dear Parent, the fee of Rs 10,800 for Aarav Sharma (10-A) is due on 10 Jul 2027. Pay here: {link}" |
| `fee.invoice.due_soon` | 7 and 3 days before the due date | WhatsApp, SMS, Email, In-app | Fee payer | "Reminder: Rs 10,800 for Aarav Sharma is due on 10 Jul 2027. Pay here: {link}" |
| `fee.invoice.due_today` | On the due date | WhatsApp, SMS, Email, In-app | Fee payer | "The fee of Rs 10,800 for Aarav Sharma is due today. Pay here: {link}" |
| `fee.invoice.overdue` | 3, 7, 15 and 30 days after the due date | WhatsApp, SMS, Email, In-app | Fee payer | "Rs 6,050 for Aarav Sharma is overdue since 10 Jul 2027. A late fee may apply. Pay here: {link}" |
| `fee.late_fee.applied` | First time the late fee job charges an invoice | WhatsApp, In-app | Fee payer | "A late fee has been added to invoice INV-2027-0912. New balance: Rs 5,850." |
| `fee.invoice.paid` | Balance reaches zero | In-app | Accountant feed, Dashboard | "INV-2027-0912 of Aarav Sharma is fully paid." The parent gets the receipt from the *Payments Module* |
| `fee.invoice.cancelled` | Issued invoice cancelled | WhatsApp, Email, In-app | Fee payer | "Invoice INV-2027-0912 has been cancelled. Please ignore it. A corrected invoice will follow." |
| `fee.invoice.written_off` | Full write-off | In-app | Organization Admin | "Rs 5,800 written off on INV-2027-0912 by Rajesh Sharma." |
| `fee.invoice.carried_forward` | Carry-forward created the ARREARS invoice | Email, In-app | Fee payer | "Your balance of Rs 5,800 from 2027-28 has moved to invoice INV-2028-0003, due on 15 Apr 2028." |
| `fee.adjustment.requested` | Adjustment created | In-app, Email | Users with `fees.approve` in the campus | "Suresh Gupta requests a late fee waiver of Rs 250 on INV-2027-0912." |
| `fee.adjustment.approved` | Adjustment approved | In-app; WhatsApp to the payer | Requester; fee payer | "Your invoice INV-2027-0912 was reduced by Rs 250. New balance: Rs 5,800." |
| `fee.adjustment.rejected` | Adjustment rejected | In-app | Requester | "Waiver of Rs 250 on INV-2027-0912 was rejected: {reason}" |
| `fee.reminder.sent` | Manual or bulk reminder by a user | WhatsApp, SMS, Email, In-app | Fee payer | Same text as the overdue reminder, plus the optional note of the sender |

## Payments Module

| Event | Trigger | Channel | Recipient | Template text |
|---|---|---|---|---|
| `receipt.issued` | Payment saved at the counter or captured online | WhatsApp with PDF, Email, In-app | Payer guardian | "Dear {{guardianName}}, we received Rs {{amount}} for {{studentName}} ({{className}}) on {{date}}. Receipt {{receiptNo}} is attached. Balance due: Rs {{balance}}. {{schoolName}}" |
| `payment.link.sent` | PAY-API-16 | WhatsApp, SMS | Fee-payer guardian | "Fee of Rs {{amount}} for {{studentName}} is due on {{dueDate}}. Pay safely here: {{payLink}} (valid till {{expiry}}). {{schoolName}}" |
| `payment.captured` | Online capture | In-app | Accountants of the campus | "Online payment of Rs {{amount}} received from {{payerName}} for {{studentName}}." |
| `payment.failed` | Gateway failure event | In-app, WhatsApp | Payer | "Your payment of Rs {{amount}} did not go through. If money left your account, the bank returns it in 5 to 7 working days. Try again: {{payLink}}" |
| `payment.cheque.bounced` | PAY-API-07 | WhatsApp, SMS, In-app | Guardian, Principal | "Cheque {{chequeNo}} of Rs {{amount}} for {{studentName}} was returned by the bank. A charge of Rs {{penalty}} is added. Please pay by {{dueDate}}." |
| `payment.cancelled`, `receipt.cancelled` | PAY-API-04, PAY-API-11 | WhatsApp, In-app | Guardian, Organization Admin | "Receipt {{receiptNo}} of Rs {{amount}} has been cancelled. Reason: {{reason}}. Please contact the accounts office." |
| `refund.requested` | PAY-API-19 | In-app, Email | Users with `payments.approve` | "Refund {{refundNo}} of Rs {{amount}} for {{studentName}} needs your approval." |
| `refund.approved`, `refund.rejected` | PAY-API-21, PAY-API-22 | In-app | Requester | "Refund {{refundNo}} was {{decision}} by {{approverName}}." |
| `refund.processed` | PAY-API-23 or gateway event | WhatsApp, Email | Guardian | "Refund of Rs {{amount}} for {{studentName}} was sent by {{method}}, reference {{reference}}. It can take 5 to 7 working days to reach your account." |
| `refund.failed` | Gateway event | In-app, Email | Accountant | "Refund {{refundNo}} failed at the gateway: {{failureReason}}. Retry or pay it offline." |
| `payment.disputed` | Gateway dispute event | In-app, Email | Organization Admin, Accountant | "A card dispute of Rs {{amount}} was opened on receipt {{receiptNo}}. Reply in your Razorpay dashboard before {{respondBy}}." |
| `settlement.mismatch` | Reconciliation job | In-app, Email | Accountant, Organization Admin | "Payout {{settlementId}} of {{date}} differs by Rs {{mismatchAmount}}. Please review." |
| `dayclose.submitted`, `dayclose.discrepancy` | PAY-API-36, PAY-API-37 | In-app, Email | Users with `payments.approve`; Organization Admin | "Day close of {{date}} by {{accountantName}}: variance Rs {{variance}}." |

## Discounts Module

| Event | Trigger | Channel | Recipient | Template text |
|---|---|---|---|---|
| `discount.requested` | DSC-API-07; one per DSC-API-12 job | In-app, Email | Approvers of the campus | "{{requesterName}} asks for {{schemeName}} ({{value}}) for {{studentName}}. Yearly estimate Rs {{estimate}}." |
| `discount.approved` | DSC-API-09 or auto-approval | In-app; WhatsApp, Email | Requester; fee-payer guardian | "Dear {{guardianName}}, {{schemeName}} of {{value}} is approved for {{studentName}} for {{year}}. It shows on your next invoice. {{schoolName}}" |
| `discount.rejected` | DSC-API-10 | In-app | Requester | "{{schemeName}} for {{studentName}} was rejected by {{approverName}}: {{reason}}" |
| `discount.revoked` | DSC-API-11, sibling job | In-app; WhatsApp, Email | Requester; fee-payer guardian | "Dear {{guardianName}}, {{schemeName}} for {{studentName}} ends on {{validTo}}. Later invoices show the full fee. {{schoolName}}" |

## Scholarships Module

| Event | Trigger | Channel | Recipient | Template text |
|---|---|---|---|---|
| `scholarship.opened` | SCH-API-06 | In-app, WhatsApp | Guardians in scheme courses | "{{schemeName}} is open till {{endDate}}. Apply under Requests." |
| `scholarship.closed` | SCH-API-07, window job | In-app | Reviewers | "{{schemeName}} closed with {{count}} applications." |
| `scholarship.application.submitted` | SCH-API-12, PP-API-32 | In-app; WhatsApp | Campus reviewers; guardian | "Application {{applicationNo}} for {{studentName}} received." |
| `scholarship.application.shortlisted` | SCH-API-14 | In-app, WhatsApp | Guardian | "{{studentName}} is shortlisted for {{schemeName}}." |
| `scholarship.application.approved` | SCH-API-15 | In-app | Awarding staff | "{{applicationNo}} approved. Create the award." |
| `scholarship.application.rejected` | SCH-API-16 | In-app, WhatsApp | Guardian | "{{studentName}} was not selected for {{schemeName}}: {{remarks}}" |
| `scholarship.awarded` | SCH-API-19 | In-app, WhatsApp, Email | Guardian; Accountant | "{{studentName}} is awarded {{schemeName}}: Rs {{amount}} for {{year}}." |
| `scholarship.disbursed` | Builder credit, SCH-API-25 | In-app; WhatsApp if manual | Guardian | "Rs {{amount}} credited to {{invoiceNo}}. Balance Rs {{balance}}." |
| `scholarship.disbursement.reversed` | SCH-API-26, FEE-API-29, revoke | In-app, WhatsApp | Guardian; Accountant | "Rs {{amount}} credit on {{invoiceNo}} reversed: {{reason}}." |
| `scholarship.award.suspended` | SCH-API-21 | In-app, WhatsApp, Email | Guardian | "{{schemeName}} for {{studentName}} is on hold: {{reason}}." |
| `scholarship.award.reinstated` | SCH-API-22 | In-app, WhatsApp | Guardian | "{{schemeName}} for {{studentName}} is active again." |
| `scholarship.award.revoked` | SCH-API-23 | In-app, WhatsApp, Email | Guardian; ORG_ADMIN | "{{schemeName}} for {{studentName}} is cancelled: {{reason}}." |
| `scholarship.award.renewed` | SCH-API-24 | In-app, WhatsApp, Email | Guardian | "{{schemeName}} renewed for {{year}}: Rs {{amount}}." |

## Parent Portal Module

| Event | Trigger | Channel | Recipient | Template text |
|---|---|---|---|---|
| `portal.parent.first_login` | First OTP login | In-app | Parent | "Welcome to the Bright Future Parent Portal." |
| `student.leave.requested` | PP-API-21 | In-app | Class teacher | "Sunita Devi asked leave for Aarav Sharma (10-A): 27 Jul, 1 day." |
| `student.leave.approved` (LEV) | LEV-API-25 | In-app, WhatsApp | Parent | "Leave for Aarav on 27 Jul is approved by Priya Nair." |
| `student.leave.cancelled` | PP-API-22 | In-app | Class teacher | "Sunita Devi cancelled the leave request for Aarav (30 Jul)." |
| `receipt.issued` (PAY) | Capture of PP-API-16 order | WhatsApp, In-app | Fee payer | "Received ₹14,800 for Aarav and Ananya. Receipt RCT-2027-28-01873." |
| `consent.withdrawn` | PP-API-28 | In-app, Email | Organization Admin | "Sunita Devi withdrew WhatsApp consent for Aarav Sharma." |

## Student Portal Module

| Event | Trigger | Channel | Recipient | Template text |
|---|---|---|---|---|
| `portal.student.first_login` | AUTH-API-10 | In-app; WhatsApp | Student; guardian | "Aarav has started using the Student Portal. You can stop it in Privacy and consents." |
| `homework.submitted` | SP-API-08 | In-app (digest) | Teacher | "12 new submissions for Maths Ex 4.2 (10-A)." |
| `homework.resubmitted` | SP-API-08 after a redo | In-app | Teacher | "Aarav Sharma resubmitted Maths Ex 4.2 (attempt 2)." |
| `certificate.requested` | SP-API-18 | In-app, Email; WhatsApp | Approvers; guardian of a minor | "Aarav Sharma (10-A) asked for a Bonafide certificate, 1 copy." |
| `homework.graded` (HW) | HW-API-15 | Push, In-app | Student | "Maths Ex 4.2 is checked: 8.50 / 10." |
| `exam.results.published` (EXM) | Exam published | Push, In-app | Student | "Unit Test 1 results are out." |

## Notifications Module

| Event | Trigger | Channel | Recipient | Template text |
|---|---|---|---|---|
| `announcement.scheduled` | NTF-API-14 with a time | In-app | Author | "Your notice {{title}} will go at {{time}} to {{count}} people." |
| `announcement.sent` | Send job finished | In-app | Author | "{{title}} went to {{count}} people: {{whatsapp}} WhatsApp, {{sms}} SMS." |
| `message.failed` | Over 10% of messages fail in one hour | In-app, Email | Organization Admin | "{{failed}} of {{total}} messages failed in the last hour. Main reason: {{reason}}." |

## WhatsApp Module

| Event | Trigger | Channel | Recipient | Template text |
|---|---|---|---|---|
| `whatsapp.account.connected` | WA-API-02 | In-app, Email | Organization Admins | "+91 522 400 1200 is connected. 9 templates are with Meta." |
| `whatsapp.account.disconnected` | WA-API-05 or token revoked | In-app, Email | Organization Admins | "+91 522 400 1200 is disconnected. Messages now go from EduFlow Alerts." |
| `whatsapp.account.quality_changed` | Sync or webhook | In-app, Email | Organization Admins | "+91 522 400 1300 is now YELLOW. Marketing is paused on it." |
| `whatsapp.template.approved` | Webhook or sync | In-app | Template creator | "ptm_invite_oct (English) is approved." |
| `whatsapp.template.rejected` | Webhook or sync | In-app, Email | Template creator | "Meta rejected ptm_invite_oct: {{reason}}. Edit and resubmit." |
| `whatsapp.template.paused` | Webhook | In-app | Organization Admins | "Meta paused fee_due_reminder. Reminders go by SMS for now." |
| `whatsapp.message.received` | Inbound webhook | In-app | Users with `whatsapp.send` on that campus | "New WhatsApp from Sunita Devi (Aarav, 10-A): Is school open on Saturday?" |
| `whatsapp.opt_in.recorded` | WA-API-18, START, portal | None (audit) | — | — |
| `whatsapp.opt_out.recorded` | WA-API-18, STOP, portal | WhatsApp (free) | The parent | "You will not get WhatsApp messages from {{schoolName}}. Reply START to join again." |
| `whatsapp.wallet.topped_up` | `PURCHASE` row | In-app, Email | Organization Admins | "Rs 1,999 added to your WhatsApp wallet. New balance: Rs 3,411.50." |
| `whatsapp.wallet.low_balance` | WA-BR-13 | In-app, WhatsApp, Email | Organization Admins | "WhatsApp wallet low: Rs 186.40 left (about 1,400 messages)." |
| `whatsapp.wallet.exhausted` | WA-BR-13 | In-app, Email, SMS | Organization Admins | "WhatsApp wallet is empty. Messages go by SMS or email." |

## Email Module

| Event | Trigger | Channel | Recipient | Template text |
|---|---|---|---|---|
| `email.identity.verified` | EML-BR-03 | In-app, Email | Organization Admins | "accounts@brightfuture.edu.in is verified. Warm-up runs for 14 days." |
| `email.identity.failed` | EML-BR-03 | In-app, Email | Organization Admins | "DKIM records of brightfuture.edu.in are missing. Emails use the EduFlow sender until DNS is fixed." |
| `email.bounced` | Hard bounce; alert only when the guard trips | In-app, Email | Organization Admins | "Bulk email is paused: hard-bounce rate {{bounceRate}} in 7 days (limit 4%)." |
| `email.complained` | Complaint; alert only when the guard trips | In-app, Email | Organization Admins | "Bulk email is paused: complaint rate {{complaintRate}} in 7 days (limit 0.08%)." |
| `email.unsubscribed` | EML-API-13 | None (audit) | - | - |
| `email.suppression.added` | Bounce, complaint, unsubscribe, EML-API-11 | None; shown on the guardian's timeline | - | - |
| `email.suppression.removed` | EML-API-12 | None (audit) | - | - |

## SMS Module

| Event | Trigger | Channel | Recipient | Template text |
|---|---|---|---|---|
| `sms.sender.verified` | Test delivered | In-app | Organization Admins | "SMS header BFPSCH is verified." |
| `sms.sender.failed` | Test failed or silent for 5 minutes | In-app, Email | Organization Admins | "BFPSCH test failed: {{reason}}." |
| `sms.dlt_template.approved` | Status `APPROVED` (edit or import) | In-app | Organization Admins | "DLT template School closed (en) is approved." |
| `sms.dlt_template.rejected` | Status `REJECTED` | In-app, Email | Organization Admins | "DLT template Exam date sheet was rejected." |
| `sms.opted_out` | Preference off, consent withdrawn, STOP | None (audit) | — | — |
| `sms.wallet.topped_up` | `PURCHASE` row | In-app, Email | Organization Admins | "5,000 SMS credits added. Balance: 8,092." |
| `sms.wallet.low_balance` | SMS-BR-10 | In-app, Email, WhatsApp | Organization Admins | "SMS credits low: 480 left." |
| `sms.wallet.exhausted` | SMS-BR-10 | In-app, Email | Organization Admins | "SMS credits are over. Alerts go by WhatsApp or email." |

## Library Module

| Event | Trigger | Channel | Recipient | Template text |
|---|---|---|---|---|
| `library.book.issued` | LIB-API-20 | In-app | Student, Parent | "{book} issued. Return by {dueDate}." |
| `library.book.due_soon` | Job, 2 days before | WhatsApp, In-app | Parent, Student | "{book} is due on {dueDate}. Please return it." |
| `library.book.overdue` | Job on days 1, 7, 14 | WhatsApp, In-app | Parent, Student | "{book} was due on {dueDate}. Fine so far Rs {fine}." |
| `library.book.lost` | LIB-API-24 | WhatsApp, In-app | Parent | "{book} is marked lost. Charge Rs {amount} raised." |
| `library.fine.charged` | LIB-API-25 | WhatsApp, In-app | Parent, Student | "Library fine Rs {amount} added to invoice {invoiceNo}, due {dueDate}." |
| `library.fine.waived` | LIB-API-26 | In-app | Parent, Librarian | "Library fine of Rs {amount} was waived by {approver}." |
| `library.reservation.ready` | Hold allocation | WhatsApp, In-app | Student | "{book} is ready at the desk. Collect it by {expiresAt}." |
| `library.reservation.expired` | Nightly job | In-app | Student | "Your hold on {book} expired. Reserve it again if needed." |
| `library.reservation.cancelled` | LIB-API-32, archive | In-app | Student | "Your hold on {book} was cancelled. Reason: {reason}." |
| `library.import.completed` | Import worker | In-app, Email | Librarian | "Import finished: {ok} rows added, {failed} failed." |

## Inventory Module

| Event | Trigger | Channel | Recipient | Template text |
|---|---|---|---|---|
| `inventory.stock.low` | Balance crosses `reorderLevel` | In-app | Store keeper, Org Admin | "{{itemName}} is down to {{qty}} {{unit}} at {{campus}}. Level {{level}}." |
| `inventory.purchase_order.submitted` | INV-API-24 | In-app, Email | Campus approvers | "{{poNumber}} for {{vendor}}, {{amount}}, is waiting for your approval." |
| `inventory.purchase_order.approved` | INV-API-25 | In-app | PO creator | "{{poNumber}} was approved by {{approver}}. You can send it to the vendor." |
| `inventory.stock.sold` | INV-API-35 | In-app, WhatsApp | Parent | "Dear {{guardianName}}, bill {{invoiceNo}} of {{amount}} for {{items}} is ready." |
| `inventory.stock.adjusted` | INV-API-37 | In-app, Email | Org Admin | "{{rows}} corrections posted on {{date}}. Loss value {{lossValue}}." |
| `inventory.asset.overdue` | Daily job past `expectedReturnDate` | In-app | Holder, Store keeper | "{{itemName}} ({{assetTag}}) was due back on {{dueDate}}." |

## Transport Module

| Event | Trigger | Channel | Recipient | Template text |
|---|---|---|---|---|
| `transport.student.boarded` | TRN-API-41 | In-app, WhatsApp | Parent | "Aarav boarded bus UP32 AB 4521 at 07:12." |
| `transport.student.dropped` | TRN-API-41 | In-app, WhatsApp | Parent | "Aarav got off the bus at 14:38 at Patrakarpuram." |
| `transport.student.not_boarded` | Mark or watcher job | In-app, WhatsApp, SMS | Parent, Transport Manager | "Aarav did not board the bus today at 07:12. Call 0522-4001." |
| `transport.trip.completed` | TRN-API-42 | In-app | Transport Manager | "R3 PICKUP completed 07:45. 36 of 38 boarded." |
| `transport.trip.cancelled` | TRN-API-43 | In-app, WhatsApp | Parents of the route | "Today's R3 bus is cancelled. Please arrange other transport." |
| `transport.assignment.created` | TRN-API-25, 31, 32 | In-app, WhatsApp | Parent | "Aarav's bus R3, stop Patrakarpuram, pickup 07:12, Rs 1,800 a month." |
| `transport.assignment.changed` | TRN-API-27 | In-app, WhatsApp | Parent | "From 12 Nov the stop is Vikas Khand Gate, 06:55, Rs 2,000." |
| `transport.vehicle.document_expiring` | TRN-BR-03 | In-app, WhatsApp, Email | Manager, Principal | "PUC of UP32 AB 4521 expires 24 Aug 2027 (8 days)." |
| `transport.driver.licence_expiring` | TRN-BR-03 | In-app, Email | Transport Manager | "Licence of Sanjay Kumar expires 05 Sep 2027." |
| `transport.maintenance.due` | TRN-BR-03 | In-app | Transport Manager | "Service of UP32 CD 1189 is due 28 Aug 2027." |
| `transport.trip.started`, `.assignment.suspended`, `.resumed`, `.ended` | TRN-API-39, 28, 29, 30 | In-app only | Manager, Parent | Short status line; no WhatsApp cost |

## Hostel Module

| Event | Trigger | Channel | Recipient | Template text |
|---|---|---|---|---|
| `hostel.allocation.reserved` | HST-API-19 | In-app, WhatsApp | Parent | "Bed 101-B in Tagore Boys Hostel is held for Aarav from 12 Oct 2027." |
| `hostel.allocation.checked_in` | HST-API-22 | In-app, WhatsApp | Parent | "Aarav moved into room 101, bed B. Warden Ramesh Yadav, 0522-4001." |
| `hostel.allocation.transferred` | HST-API-23 | In-app, WhatsApp | Parent | "From 15 Nov Aarav is in room 214, bed A. Rent Rs 6,000 a month." |
| `hostel.allocation.vacated` | HST-API-24 | In-app, WhatsApp | Parent | "Aarav vacated on 20 Mar 2028. Deposit refund Rs 8,800 by 04 Apr." |
| `hostel.allocation.cancelled` | HST-API-25 | In-app | Parent | "The hostel bed held for Aarav has been released." |
| `hostel.attendance.marked` | HST-API-29 | In-app | Principal | "BH1 roll call done 21:38: 88 present, 2 absent, 1 on leave." |
| `hostel.student.absent` | HST-BR-15 | In-app, WhatsApp, SMS | Parent, Principal | "Aarav was not in the hostel at the 21:30 roll call on 09 Nov. Call 0522-4001." |
| `hostel.student.late_entry` | HST-API-29 | In-app, WhatsApp | Parent | "Aarav returned to the hostel at 22:10, after the 21:30 roll call." |
| `hostel.leave.requested` | HST-API-35, 45 | In-app | Warden, Principal | "Out-pass request: Aarav, home visit, 12-14 Nov." |
| `hostel.leave.approved` | HST-API-37 | In-app, WhatsApp | Parent, Student | "Out-pass approved for 12 to 14 Nov. Show the gate pass at the gate." |
| `hostel.leave.rejected` | HST-API-38 | In-app, WhatsApp | Parent | "Out-pass for 12 to 14 Nov was not approved. Reason: exams week." |
| `hostel.leave.cancelled` | HST-API-39, 46 | In-app | Warden, Parent | "The out-pass for 12 to 14 Nov has been cancelled." |
| `hostel.leave.checked_out` | HST-API-40 | In-app, WhatsApp | Parent | "Aarav left the hostel at 19:04 with Sunita Devi." |
| `hostel.leave.returned` | HST-API-41 | In-app, WhatsApp | Parent | "Aarav returned to the hostel at 20:12 on 14 Nov." |
| `hostel.leave.overdue` | HST-BR-20 | In-app, WhatsApp, SMS | Parent, Warden, Principal | "Aarav has not returned. Expected 14 Nov 20:00. Please call 0522-4001." |
| `hostel.visitor.checked_in` | HST-API-32 | In-app | Parent | "Sunita Devi met Aarav in the hostel at 18:32." |
| `hostel.visitor.checked_out` | HST-API-33 | In-app | Warden | "Visitor Sunita Devi left at 19:40." |

## Payroll Module

| Event | Trigger | Channel | Recipient | Template text |
|---|---|---|---|---|
| `payroll.run.process_failed` | Job throws | In-app, Email | Accountant | "September 2027 payroll could not be calculated. Reason: {reason}." |
| `payroll.run.approved` | PRL-API-22 | In-app | Accountant | "{approver} approved the September 2027 payroll." |
| `payroll.run.paid` | PRL-API-24 | In-app | ORG_ADMIN | "September 2027 salary of Rs 16,22,500 marked paid on 30 Sep." |
| `payroll.payslip.published` | PRL-API-26 | In-app, Email | The staff member | "Your September 2027 payslip is ready. Net pay Rs 45,000. Open the app to download it." |
| `payroll.salary.revised` | PRL-API-12 | In-app | The staff member | "Your salary has been revised with effect from 1 April 2027." |
| `payroll.loan.approved` | PRL-API-48 | In-app, WhatsApp | The staff member | "Your advance of Rs 18,000 is approved. Six EMIs of Rs 3,000 start from September." |
| `payroll.tax_declaration.verified` | PRL-API-54 | In-app, Email | The staff member | "Your FY 2027-28 declaration is verified. Your monthly TDS is now Rs {tds}." |

## Certificates Module

| Event | Trigger | Channel | Recipient | Template text |
|---|---|---|---|---|
| `certificate.requested` | PP-API-30, SP-API-18 | In-app, Email | Campus approvers | "Sunita Devi asked for a Bonafide certificate for Aarav Sharma (10-A), 2 copies." |
| `certificate.request.submitted` | CRT-API-11 | In-app | Campus approvers | "{{staffName}} asked for a {{type}} certificate for {{studentName}}." |
| `certificate.request.approved` | CRT-API-13 | In-app, WhatsApp | Requester | "Your {{type}} request for {{studentName}} is approved. Fee Rs {{amount}}: pay in the app." |
| `certificate.request.rejected` | CRT-API-14 | In-app, WhatsApp | Requester | "Your {{type}} request for {{studentName}} was not approved: {{remarks}}" |
| `certificate.request.cancelled` | CRT-API-15, CRT-API-28, CRT-API-30 | In-app | The other side | "The {{type}} request for {{studentName}} was cancelled." |
| `certificate.issued` | CRT-API-16, CRT-API-19, CRT-API-25 | In-app; WhatsApp for portal requests | Primary guardian; student 18+ | "{{type}} certificate {{serialNo}} for {{studentName}} is ready. Download it in the app." |
| `certificate.reissued` | CRT-API-23 | In-app, WhatsApp | Primary guardian | "Certificate {{oldSerialNo}} is replaced by {{serialNo}}. Please use the new one." |
| `certificate.revoked` | CRT-API-22 | In-app, Email | Primary guardian; ORG_ADMIN | "Certificate {{serialNo}} of {{studentName}} was cancelled by the school on {{date}}." |
| `certificate.bulk_issue.completed` | Bulk worker | In-app | User who started it | "{{issued}} certificates issued, {{skipped}} skipped. Download the ZIP." |

## Analytics Module

| Event | Trigger | Channel | Recipient | Template text |
|---|---|---|---|---|
| `analytics.report.saved` | ANL-API-07, 09 | None | - | Audit and cache only |
| `analytics.report.shared` | ANL-API-14 | In-app | Shared roles | "{owner} shared {name} with you." |
| `analytics.schedule.created` | ANL-API-17 | In-app | Internal recipients | "You will get {name} every {frequency} at {time}." |
| `analytics.schedule.delivered` | Run finished | Email; WhatsApp by preference | Recipients | "Your report {name} for {period} is ready: {link}" |
| `analytics.schedule.failed` | Failed run or auto-pause | Email, In-app | Creator, owner | "{name} could not be sent: {reason}." |
| `analytics.snapshot.computed` | Rebuild job wrote rows | None | - | Clears the analytics cache |
| `analytics.snapshot.rebuilt` | Rebuild finished | In-app | Requester | "Numbers from {from} to {to} were recomputed." |

## AI Insights Module

| Event | Trigger | Channel | Recipient | Template text |
|---|---|---|---|---|
| `ai.insight.generated` | Row written | None | - | Feed and cache only |
| `ai.insight.critical` | Severity CRITICAL | In-app, WhatsApp | `ai.manage` holders | "Urgent: {title}. Open EduFlow to see why." |
| `ai.insight.acted` | AI-API-05 | In-app | Org Admin | "{user} acted on {title}." |
| `ai.insight.dismissed` | AI-API-06 | None | - | Audit and accuracy job |
| `ai.student.risk_level_changed` | Band moved | In-app | Class teacher, Principal | "{student} moved from {old} to {new} risk." |
| `ai.risk_scores.computed` | Recompute done | In-app | Requester | "Risk scores for {scope} are updated." |
| `ai.quota.threshold_reached` | 80% of a limit | Email, In-app | Org Admin | "You have used 80% of this month's AI allowance." |
| `ai.quota.exhausted` | 100% of a limit | Email, In-app | Org Admin | "AI questions are paused until {resetDate}." |

## Settings Module

| Event | Trigger | Channel | Recipient | Template text |
|---|---|---|---|---|
| `consent.requested` | `SET-API-29` | WhatsApp, SMS | Guardian | "{school} needs your consent to use {student}'s data. Open {link} and confirm with OTP." |
| `consent.withdrawn` | `SET-API-28`, `SET-API-52` | In-app | Org Admin | "{guardian} withdrew {consentType} for {student}. A task was created." |
| `dsr.received` | `SET-API-32`, `SET-API-54` | In-app, Email | Org Admin, requester | "Request {requestNo} received. Reply due by {dueDate}." |
| `dsr.due_soon` | 7 and 2 days before due | In-app, Email | Handler, Org Admin | "{requestNo} is due on {dueDate}." |
| `dsr.completed` | `SET-API-37` | In-app, Email | Requester | "Request {requestNo} is complete. The file goes to your verified email today." |
| `dsr.rejected` | `SET-API-38` | In-app, Email | Requester | "Request {requestNo} was declined: {reason}. Grievance contact: {contact}." |
| `data_breach.reported` | `SET-API-41` | In-app, Email | Org Admin | "Breach {incidentNo} recorded. Regulator notice due {dueAt}." |
| `data_breach.notification_due` | 48 and 66 hours after detection | In-app, Email, SMS | Org Admin | "{incidentNo}: regulator notice due at {dueAt}." |
| `api_key.created` | `SET-API-45` | Email | All Org Admins | "API key {name} was created by {actor}. Not you? Revoke it now." |
| `api_key.expiring` | 14 and 3 days before expiry | In-app, Email | Key creator | "API key {name} expires on {date}. Rotate it now." |
