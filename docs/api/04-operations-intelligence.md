# EduFlow API Registry — 04-operations-intelligence

Modules in this file: LIB, INV, TRN, HST, PRL, CRT, ANL, AI, SET, CMN. Paths are relative to `/api/v1`. Envelopes, pagination, filters and error codes follow the canon.

Conventions used in this file:

- Tenant comes from the JWT; campus scope from `X-Campus-Id`. Plan gating (`PlanFeature.featureKey` such as `module.LIB`, `api_access`) answers `PLAN_LIMIT_REACHED`.
- Import endpoints take an uploaded `FileAsset` id, create an `ImportJob` and return `202` with the job id (track with CMN-API-12). Export endpoints create an `ExportJob` (`XLSX`, `CSV`, `PDF`, `ZIP`) and return `202` with the job id (track with CMN-API-19, download with CMN-API-20).
- `GET .../pdf` endpoints return a short-lived pre-signed URL of a private `FileAsset`.
- Parent Portal endpoints take `?studentId=` and verify the child through `StudentGuardian`; Student Portal endpoints resolve the student from the login.
- `self` = any authenticated user acting on the own record (`/my-...` resources). `public` = no login; rate limited by IP.
- Module rules kept in `OrganizationSetting` (loan days, fine per day, roll-call time, payroll cut-off, AI thresholds) are read and written with SET-API-02 / SET-API-03.

## LIB — Library

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

## INV — Inventory

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

## TRN — Transport

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

## HST — Hostel

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

## PRL — Payroll

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

## CRT — Certificates

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

## ANL — Analytics

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

## AI — AI Insights

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

## SET — Settings

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

## CMN — Common cross-cutting endpoints

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

## Permission keys used in this file

| Permission | Meaning |
|---|---|
| public | No login; rate limited by IP |
| self | Any authenticated user acting on the own record or own jobs (no permission key) |
| library.view | View catalogue, categories, copies, loans, holds and library dashboard; print labels |
| library.create | Add titles and copies |
| library.update | Update titles and copies; change copy status |
| library.delete | Archive titles |
| library.manage | Configure categories; send due and overdue reminders |
| library.issue | Circulation desk: issue, renew, return, mark lost, holds, member summary |
| library.collect_fine | Bill a library fine to a fee invoice or counter payment |
| library.approve | Waive a library fine |
| library.import | Import catalogue from Excel |
| library.export | Export catalogue, loan, overdue and fine registers |
| inventory.view | View items, categories, vendors, purchase orders, ledger, assets, reports |
| inventory.create | Create items and purchase orders; submit a PO for approval |
| inventory.update | Update items and DRAFT POs; mark ordered, cancel; direct IN / OUT entries |
| inventory.delete | Archive items; delete DRAFT POs |
| inventory.manage | Configure categories and vendors |
| inventory.approve | Approve or send back purchase orders |
| inventory.receive | Receive goods against a purchase order |
| inventory.issue | Issue and take back stock; assign and close asset assignments |
| inventory.sell | Sell items to students with a fee invoice |
| inventory.transfer | Transfer stock between campus stores |
| inventory.adjust | Stock-count adjustments and write-offs |
| inventory.import | Import items and opening stock from Excel |
| inventory.export | Export items, ledger and asset register |
| transport.view | View vehicles, drivers, routes, stops, assignments, trips, maintenance, alerts |
| transport.create | Create vehicles and routes |
| transport.update | Update vehicles, routes and stops; schedule, change and cancel trips |
| transport.delete | Archive vehicles and routes |
| transport.manage | Maintain driver profiles and vehicle maintenance records |
| transport.assign | Assign students to routes; change, suspend, resume, end; bulk assign |
| transport.mark | Driver / attendant: own trips, start, boarding marks, complete |
| transport.import | Import transport assignments from Excel |
| transport.export | Export assignments, rosters and trip logs |
| hostel.view | View hostels, rooms, beds, allocations, roll call, visitors, out-passes |
| hostel.create | Create hostels and rooms (single and bulk) |
| hostel.update | Update hostels, rooms and beds |
| hostel.delete | Archive hostels and rooms |
| hostel.allocate | Reserve, allocate, check in, transfer, vacate and cancel beds |
| hostel.mark | Warden desk: roll call, visitor register, raise / cancel out-pass, gate check-out and check-in |
| hostel.approve | Approve or reject out-pass requests |
| hostel.export | Export resident and roll-call registers |
| payroll.view | View pay heads, structures, salaries, runs, payslips, adjustments, loans, declarations, statutory settings |
| payroll.manage | Configure pay heads, structures, staff salaries, statutory settings; create adjustments and loans |
| payroll.process | Create, process and delete DRAFT runs; edit, hold, release payslips; mark paid; send payslips; disburse and close loans |
| payroll.approve | Approve, reopen and lock runs; cancel payslips; approve adjustments and loans; verify tax declarations |
| payroll.import | Import payroll adjustments from Excel |
| payroll.export | Bank file, statutory files, salary register and payslip export |
| certificates.view | View templates, requests, issued certificates and PDFs; preview templates |
| certificates.manage | Configure certificate templates |
| certificates.create | Raise and cancel certificate requests as staff |
| certificates.approve | Approve or reject certificate requests |
| certificates.issue | Issue (single, bulk, from request), reissue and send certificates |
| certificates.revoke | Revoke an issued certificate |
| certificates.export | Export the issue register |
| analytics.view | Open the report library, saved and shared reports, schedules list, KPI and analysis endpoints |
| analytics.build | Use the report builder: datasets, preview, save, update, delete, duplicate, share |
| analytics.schedule | Create, update, pause, resume, delete and run report schedules |
| analytics.export | Export standard and saved reports |
| analytics.manage | Rebuild daily metric snapshots |
| ai.view | View insights, risk scores and current quota; mark seen; give feedback |
| ai.update | Mark an insight acted or dismissed |
| ai.query | Ask the AI assistant and see own question history |
| ai.manage | Trigger insight and risk runs; see all questions and usage history |
| ai.export | Export the at-risk student list |
| settings.view | View settings, branding, number sequences, custom fields, gateway accounts, policy documents |
| settings.update | Update setting groups and branding; verify custom domain |
| settings.manage | Configure number sequences and custom fields |
| settings.manage_gateways | Connect, update, verify, default and disconnect payment gateway accounts |
| settings.manage_privacy | Policy documents, consent register, data-subject requests, breach register |
| settings.manage_api_keys | Create, update, rotate and revoke API keys |
| settings.export | Export the consent register |
| files.view | List files, read metadata, get download URLs, bulk download |
| files.create | Request a pre-signed upload and confirm it |
| files.delete | Delete (soft) a file |
| imports.view | View import templates, jobs, row errors and error files |
| imports.create | Start, detect columns, commit and cancel import jobs |
| audit.view | Search and read audit logs |
| audit.export | Export audit logs |
| audit.manage | Verify the audit hash chain |
| platform.manage | SUPER_ADMIN: maintain countries, currencies and exchange rates |
| parentportal.access | Parent Portal access; ownership of the child is checked in code |
| studentportal.access | Student Portal access; ownership of the record is checked in code |
