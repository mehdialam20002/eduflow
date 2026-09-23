# Data Dictionary: Operations, HR and Intelligence

**In simple words:** This chapter lists every table and column for library, inventory, transport and hostel, payroll, certificates, analytics snapshots and AI insights. It is generated directly from the validated Prisma schema, so it always matches the database exactly. Use it when you write a query, build a report, answer a support question or review a migration.

How to read each table entry:

- **Column** is the real PostgreSQL column name (snake_case). The Prisma field name is the camelCase version of it.
- **Type** is the PostgreSQL type. `numeric(12,2)` is money, always stored together with a `currency` column. `timestamptz` values are stored in UTC.
- **Null** says whether the column may be empty. **Default** is the value the database or Prisma fills in.
- **Notes** marks keys (PK primary key, UK unique, FK foreign key with its delete rule) and repeats the comment from the schema.

> **Rule:** Every tenant table has `organization_id`. Every query must filter by it; the Prisma tenant extension does this for you (see *Multi-Tenancy and Data Isolation*).

## Tables in This Chapter

| Schema file | Domain | Tables | Enums |
|---|---|---|---|
| `11-operations.prisma` | Library, inventory, transport and hostel | 27 | 22 |
| `12-payroll.prisma` | Payroll | 11 | 12 |
| `13-certificates-analytics-ai.prisma` | Certificates, analytics and AI | 11 | 9 |

## Library, inventory, transport and hostel

Schema file `server/prisma/schema/11-operations.prisma` — 27 tables and 22 enums.

### library_categories

Prisma model `LibraryCategory`. Tenant table (filtered by `organization_id`). Library catalogue category (may be nested): Fiction > Hindi Fiction.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (cascade on delete) |
| `parent_id` | uuid | nullable |  | FK to `library_categories` (setnull on delete) |
| `name` | varchar(100) | not null |  |  |
| `code` | varchar(30) | nullable |  | e.g. a Dewey class |
| `status` | enum `RecordStatus` | not null | ACTIVE |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Unique (organization_id, name); Index (organization_id, parent_id).

**Relations:** belongs to `organizations`, `library_categories`; has many `library_categories`, `books`.

### books

Prisma model `Book`. Tenant table (filtered by `organization_id`). A title in the library catalogue; physical copies are BookCopy rows.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `category_id` | uuid | nullable |  | FK to `library_categories` (setnull on delete) |
| `subject_id` | uuid | nullable |  | FK to `subjects` (setnull on delete). links textbooks and reference books to a subject |
| `title` | varchar(300) | not null |  |  |
| `subtitle` | varchar(300) | nullable |  |  |
| `authors` | varchar(500) | not null |  | comma-separated |
| `isbn` | varchar(20) | nullable |  |  |
| `publisher` | varchar(150) | nullable |  |  |
| `edition` | varchar(50) | nullable |  |  |
| `publication_year` | smallint | nullable |  |  |
| `language` | varchar(30) | nullable |  |  |
| `pages` | integer | nullable |  |  |
| `description` | text | nullable |  |  |
| `tags` | text[] | not null |  |  |
| `cover_file_id` | uuid | nullable |  | FK to `file_assets` (setnull on delete) |
| `price` | decimal(12,2) | nullable |  | replacement price charged when a copy is lost |
| `currency` | char(3) | nullable |  |  |
| `total_copies` | integer | not null | 0 | cached |
| `available_copies` | integer | not null | 0 | cached |
| `status` | enum `RecordStatus` | not null | ACTIVE |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Index (organization_id, title); Index (organization_id, isbn); Index (organization_id, category_id, status).

**Relations:** belongs to `organizations`, `library_categories`, `subjects`, `file_assets`; has many `book_copies`, `book_issues`, `book_reservations`.

### book_copies

Prisma model `BookCopy`. Tenant table (filtered by `organization_id`). One physical copy of a book with its accession number and barcode.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `campus_id` | uuid | not null |  | FK to `campuses` (restrict on delete). library that holds the copy |
| `book_id` | uuid | not null |  | FK to `books` (restrict on delete) |
| `accession_no` | varchar(30) | not null |  | from NumberSequence LIBRARY_ACCESSION_NO |
| `barcode` | varchar(50) | nullable |  |  |
| `status` | enum `BookCopyStatus` | not null | AVAILABLE |  |
| `condition` | varchar(30) | nullable |  | New, Good, Worn |
| `shelf_location` | varchar(50) | nullable |  | rack / shelf |
| `purchase_date` | date | nullable |  |  |
| `price` | decimal(12,2) | nullable |  |  |
| `currency` | char(3) | nullable |  |  |
| `withdrawn_at` | timestamptz | nullable |  |  |
| `withdraw_reason` | varchar(255) | nullable |  |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Unique (organization_id, accession_no); Unique (organization_id, barcode); Index (organization_id, campus_id, status); Index (organization_id, book_id, status).

**Relations:** belongs to `organizations`, `campuses`, `books`; has many `book_issues`, `book_reservations`.

### book_issues

Prisma model `BookIssue`. Tenant table (filtered by `organization_id`). Loan of a book copy to a student or staff member, with renewals and overdue fine. One open loan per copy is enforced by a partial unique index in the SQL migration: uq_book_issue_open (organization_id, book_copy_id) WHERE status IN ('ISSUED','OVERDUE')

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `campus_id` | uuid | not null |  | FK to `campuses` (restrict on delete) |
| `book_copy_id` | uuid | not null |  | FK to `book_copies` (restrict on delete) |
| `book_id` | uuid | not null |  | FK to `books` (restrict on delete). denormalised from the copy for title-level reports |
| `member_type` | enum `LibraryMemberType` | not null |  |  |
| `student_id` | uuid | nullable |  | FK to `students` (restrict on delete). set when memberType is STUDENT |
| `staff_id` | uuid | nullable |  | FK to `staff` (restrict on delete). set when memberType is STAFF |
| `issue_date` | date | not null |  |  |
| `due_date` | date | not null |  |  |
| `return_date` | date | nullable |  |  |
| `renewal_count` | smallint | not null | 0 |  |
| `last_renewed_on` | date | nullable |  |  |
| `status` | enum `BookIssueStatus` | not null | ISSUED |  |
| `fine_amount` | decimal(12,2) | not null | 0 | overdue / damage / lost-book charge |
| `fine_paid` | decimal(12,2) | not null | 0 |  |
| `fine_waived` | boolean | not null | false |  |
| `currency` | char(3) | not null |  |  |
| `fine_invoice_id` | uuid | nullable |  | FK to `fee_invoices` (setnull on delete). fee invoice that carries the fine for a student |
| `fine_payment_id` | uuid | nullable |  | FK to `payments` (setnull on delete). Payment (purpose LIBRARY_FINE) when the fine is paid at the counter, e.g. by staff |
| `remarks` | varchar(255) | nullable |  |  |
| `issued_by_id` | uuid | nullable |  | User id (audit only, no FK) |
| `returned_to_id` | uuid | nullable |  | User id (audit only, no FK) |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Index (organization_id, book_copy_id, status); Index (organization_id, student_id, status); Index (organization_id, staff_id, status); Index (organization_id, campus_id, status, due_date).

**Relations:** belongs to `organizations`, `campuses`, `book_copies`, `books`, `students`, `staff`, `fee_invoices`, `payments`, `book_reservations`.

### book_reservations

Prisma model `BookReservation`. Tenant table (filtered by `organization_id`). Hold placed on a title by a member (Student Portal / librarian); served in queue order by reservedAt.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `campus_id` | uuid | not null |  | FK to `campuses` (restrict on delete) |
| `book_id` | uuid | not null |  | FK to `books` (restrict on delete) |
| `book_copy_id` | uuid | nullable |  | FK to `book_copies` (setnull on delete). copy set aside when READY_FOR_PICKUP (BookCopy.status = RESERVED) |
| `member_type` | enum `LibraryMemberType` | not null |  |  |
| `student_id` | uuid | nullable |  | FK to `students` (restrict on delete) |
| `staff_id` | uuid | nullable |  | FK to `staff` (restrict on delete) |
| `status` | enum `BookReservationStatus` | not null | WAITING |  |
| `reserved_at` | timestamptz | not null | now() |  |
| `ready_at` | timestamptz | nullable |  |  |
| `expires_at` | timestamptz | nullable |  | pickup deadline |
| `book_issue_id` | uuid | nullable |  | UK. FK to `book_issues` (setnull on delete). loan that fulfilled the hold |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Index (organization_id, book_id, status, reserved_at); Index (organization_id, student_id, status); Index (organization_id, staff_id, status); Index (organization_id, campus_id, status, expires_at).

**Relations:** belongs to `organizations`, `campuses`, `books`, `book_copies`, `students`, `staff`, `book_issues`.

### inventory_categories

Prisma model `InventoryCategory`. Tenant table (filtered by `organization_id`). Group of inventory items: Stationery, IT Equipment, Furniture, Sports.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (cascade on delete) |
| `name` | varchar(100) | not null |  |  |
| `code` | varchar(30) | nullable |  |  |
| `description` | varchar(255) | nullable |  |  |
| `status` | enum `RecordStatus` | not null | ACTIVE |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Unique (organization_id, name); Index (organization_id, status).

**Relations:** belongs to `organizations`; has many `inventory_items`.

### inventory_items

Prisma model `InventoryItem`. Tenant table (filtered by `organization_id`). Stock-keeping item of one campus store with current stock and reorder level.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `campus_id` | uuid | not null |  | FK to `campuses` (restrict on delete). stock is kept per campus store |
| `category_id` | uuid | nullable |  | FK to `inventory_categories` (setnull on delete) |
| `name` | varchar(150) | not null |  |  |
| `sku` | varchar(40) | not null |  |  |
| `item_type` | enum `InventoryItemType` | not null | CONSUMABLE |  |
| `unit` | varchar(20) | not null |  | pcs, box, kg, litre |
| `description` | varchar(500) | nullable |  |  |
| `current_stock` | decimal(12,3) | not null | 0 | equals balanceAfter of the latest StockTransaction |
| `reorder_level` | decimal(12,3) | nullable |  | low-stock alert when currentStock falls to this level |
| `unit_cost` | decimal(12,2) | nullable |  | latest purchase cost |
| `selling_price` | decimal(12,2) | nullable |  | price charged to students for SALE rows |
| `currency` | char(3) | nullable |  |  |
| `fee_head_id` | uuid | nullable |  | FK to `fee_heads` (setnull on delete). fee head (UNIFORM / BOOKS) used when a sale is invoiced |
| `location` | varchar(100) | nullable |  | store room / rack |
| `status` | enum `RecordStatus` | not null | ACTIVE |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Unique (organization_id, campus_id, sku); Index (organization_id, campus_id, category_id, status); Index (organization_id, name).

**Relations:** belongs to `organizations`, `campuses`, `inventory_categories`, `fee_heads`; has many `purchase_order_items`, `stock_transactions`, `asset_assignments`.

### vendors

Prisma model `Vendor`. Tenant table (filtered by `organization_id`). Supplier of goods and services (inventory, books, vehicle maintenance).

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `name` | varchar(150) | not null |  |  |
| `code` | varchar(30) | not null |  |  |
| `contact_person` | varchar(120) | nullable |  |  |
| `phone` | varchar(20) | nullable |  |  |
| `email` | varchar(255) | nullable |  |  |
| `address_line1` | varchar(200) | nullable |  |  |
| `city` | varchar(100) | nullable |  |  |
| `state` | varchar(100) | nullable |  |  |
| `postal_code` | varchar(20) | nullable |  |  |
| `country_code` | char(2) | nullable |  |  |
| `state_code` | varchar(10) | nullable |  | GST state code; decides CGST+SGST vs IGST on purchases |
| `tax_id` | varchar(30) | nullable |  | GSTIN / ABN / TRN |
| `tax_id_type` | varchar(10) | nullable |  | GSTIN \| ABN \| TRN \| EIN |
| `pan_encrypted` | text | nullable |  | AES-256-GCM; needed for TDS u/s 194C / 194J |
| `bank_details_encrypted` | text | nullable |  | AES-256-GCM ciphertext of { accountName, accountNo, ifsc, bankName } |
| `bank_account_last4` | varchar(4) | nullable |  | safe to display |
| `payment_terms` | varchar(100) | nullable |  | e.g. Net 30 |
| `notes` | varchar(500) | nullable |  |  |
| `status` | enum `RecordStatus` | not null | ACTIVE |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Unique (organization_id, code); Index (organization_id, status, name).

**Relations:** belongs to `organizations`; has many `purchase_orders`, `vehicle_maintenances`.

### purchase_orders

Prisma model `PurchaseOrder`. Tenant table (filtered by `organization_id`). Order placed with a vendor; receiving goods creates StockTransaction IN rows.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `campus_id` | uuid | not null |  | FK to `campuses` (restrict on delete) |
| `vendor_id` | uuid | not null |  | FK to `vendors` (restrict on delete) |
| `po_number` | varchar(40) | not null |  | from NumberSequence PURCHASE_ORDER_NO |
| `status` | enum `PurchaseOrderStatus` | not null | DRAFT |  |
| `order_date` | date | not null |  |  |
| `expected_date` | date | nullable |  |  |
| `received_date` | date | nullable |  | when fully received |
| `currency` | char(3) | not null |  |  |
| `subtotal` | decimal(12,2) | not null | 0 |  |
| `tax_total` | decimal(12,2) | not null | 0 |  |
| `tax_breakdown` | jsonb | nullable |  | [{ code: CGST\|SGST\|IGST\|GST\|VAT, percent, amount }] for input-tax records |
| `total` | decimal(12,2) | not null | 0 |  |
| `vendor_tax_id` | varchar(30) | nullable |  | vendor GSTIN frozen at order time |
| `vendor_invoice_no` | varchar(60) | nullable |  |  |
| `notes` | varchar(500) | nullable |  |  |
| `requested_by_id` | uuid | nullable |  | User id (audit only, no FK) |
| `approved_by_id` | uuid | nullable |  | FK to `users` (setnull on delete) |
| `approved_at` | timestamptz | nullable |  |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Unique (organization_id, po_number); Index (organization_id, campus_id, status, order_date); Index (organization_id, vendor_id).

**Relations:** belongs to `organizations`, `campuses`, `vendors`, `users`; has many `purchase_order_items`.

### purchase_order_items

Prisma model `PurchaseOrderItem`. Tenant table (filtered by `organization_id`). One line of a purchase order.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `purchase_order_id` | uuid | not null |  | FK to `purchase_orders` (restrict on delete) |
| `item_id` | uuid | not null |  | FK to `inventory_items` (restrict on delete) |
| `description` | varchar(255) | nullable |  |  |
| `quantity_ordered` | decimal(12,3) | not null |  |  |
| `quantity_received` | decimal(12,3) | not null | 0 |  |
| `unit_price` | decimal(12,2) | not null |  |  |
| `tax_code` | varchar(20) | nullable |  | HSN |
| `tax_rate` | decimal(5,2) | not null | 0 |  |
| `tax_amount` | decimal(12,2) | not null | 0 |  |
| `line_total` | decimal(12,2) | not null |  |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Index (organization_id, purchase_order_id); Index (organization_id, item_id).

**Relations:** belongs to `organizations`, `purchase_orders`, `inventory_items`; has many `stock_transactions`.

### stock_transactions

Prisma model `StockTransaction`. Tenant table (filtered by `organization_id`). Stock ledger row of an item. Append-only: no updatedAt / deletedAt; corrections are new ADJUST rows.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `campus_id` | uuid | not null |  | FK to `campuses` (restrict on delete) |
| `item_id` | uuid | not null |  | FK to `inventory_items` (restrict on delete) |
| `transaction_type` | enum `StockTransactionType` | not null |  |  |
| `quantity` | decimal(12,3) | not null |  | always positive, except ADJUST which may be negative |
| `balance_after` | decimal(12,3) | not null |  | item stock after this row |
| `unit_cost` | decimal(12,2) | nullable |  |  |
| `unit_price` | decimal(12,2) | nullable |  | selling price for SALE rows |
| `currency` | char(3) | nullable |  |  |
| `fee_invoice_id` | uuid | nullable |  | FK to `fee_invoices` (setnull on delete). SALE rows: invoice that charges the student |
| `counter_campus_id` | uuid | nullable |  | FK to `campuses` (restrict on delete). other side of a TRANSFER_OUT / TRANSFER_IN |
| `transfer_ref` | uuid | nullable |  | pairs the OUT and IN rows of one transfer |
| `transaction_date` | date | not null |  |  |
| `purchase_order_item_id` | uuid | nullable |  | FK to `purchase_order_items` (restrict on delete). IN rows from a purchase order |
| `staff_id` | uuid | nullable |  | FK to `staff` (setnull on delete). ISSUE_TO_STAFF / RETURN |
| `student_id` | uuid | nullable |  | FK to `students` (setnull on delete). ISSUE_TO_STUDENT / RETURN |
| `reference` | varchar(100) | nullable |  | bill number, issue slip number |
| `reason` | varchar(255) | nullable |  |  |
| `created_by_id` | uuid | nullable |  | User id (audit only, no FK) |
| `created_at` | timestamptz | not null | now() |  |

**Indexes and constraints:** Index (organization_id, fee_invoice_id); Index (organization_id, transfer_ref); Index (organization_id, item_id, created_at); Index (organization_id, campus_id, transaction_type, transaction_date); Index (organization_id, staff_id); Index (organization_id, student_id).

**Relations:** belongs to `organizations`, `campuses`, `inventory_items`, `purchase_order_items`, `fee_invoices`, `staff`, `students`.

### asset_assignments

Prisma model `AssetAssignment`. Tenant table (filtered by `organization_id`). A returnable asset (laptop, projector, lab kit) handed to a staff member, student or room.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `campus_id` | uuid | not null |  | FK to `campuses` (restrict on delete) |
| `item_id` | uuid | not null |  | FK to `inventory_items` (restrict on delete) |
| `asset_tag` | varchar(50) | nullable |  | serial number / asset sticker |
| `staff_id` | uuid | nullable |  | FK to `staff` (restrict on delete) |
| `student_id` | uuid | nullable |  | FK to `students` (restrict on delete) |
| `room_id` | uuid | nullable |  | FK to `rooms` (setnull on delete). asset installed in a room |
| `quantity` | integer | not null | 1 |  |
| `assigned_date` | date | not null |  |  |
| `expected_return_date` | date | nullable |  |  |
| `returned_date` | date | nullable |  |  |
| `status` | enum `AssetAssignmentStatus` | not null | ASSIGNED |  |
| `condition_on_issue` | varchar(100) | nullable |  |  |
| `condition_on_return` | varchar(100) | nullable |  |  |
| `notes` | varchar(500) | nullable |  |  |
| `assigned_by_id` | uuid | nullable |  | User id (audit only, no FK) |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Index (organization_id, item_id, status); Index (organization_id, staff_id, status); Index (organization_id, student_id, status); Index (organization_id, campus_id, status).

**Relations:** belongs to `organizations`, `campuses`, `inventory_items`, `staff`, `students`, `rooms`.

### vehicles

Prisma model `Vehicle`. Tenant table (filtered by `organization_id`). School bus / van with compliance expiry dates and GPS device.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `campus_id` | uuid | not null |  | FK to `campuses` (restrict on delete) |
| `registration_no` | varchar(20) | not null |  | e.g. UP32 AB 1234 |
| `vehicle_type` | enum `VehicleType` | not null | BUS |  |
| `make` | varchar(60) | nullable |  |  |
| `model` | varchar(60) | nullable |  |  |
| `manufacture_year` | smallint | nullable |  |  |
| `capacity` | smallint | not null |  | seats for students |
| `fuel_type` | varchar(20) | nullable |  |  |
| `is_contracted` | boolean | not null | false | hired from a transport contractor |
| `contractor_name` | varchar(150) | nullable |  |  |
| `insurance_expiry` | date | nullable |  |  |
| `fitness_expiry` | date | nullable |  |  |
| `puc_expiry` | date | nullable |  | pollution-under-control certificate |
| `permit_expiry` | date | nullable |  |  |
| `gps_device_id` | varchar(60) | nullable |  |  |
| `gps_provider` | varchar(60) | nullable |  |  |
| `driver_id` | uuid | nullable |  | FK to `staff` (setnull on delete). default driver (Staff) |
| `attendant_id` | uuid | nullable |  | FK to `staff` (setnull on delete). default attendant / conductor (Staff) |
| `odometer_km` | integer | nullable |  |  |
| `status` | enum `VehicleStatus` | not null | ACTIVE |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Unique (organization_id, registration_no); Index (organization_id, campus_id, status); Index (organization_id, insurance_expiry).

**Relations:** belongs to `organizations`, `campuses`, `staff`; has many `transport_routes`, `vehicle_trips`, `vehicle_maintenances`.

### driver_profiles

Prisma model `DriverProfile`. Tenant table (filtered by `organization_id`). Driving licence and verification details of a staff member who drives (driver = Staff + this profile).

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (cascade on delete) |
| `staff_id` | uuid | not null |  | UK. FK to `staff` (cascade on delete) |
| `license_no_encrypted` | text | not null |  | AES-256-GCM ciphertext |
| `license_last4` | varchar(4) | nullable |  | safe to display |
| `license_type` | varchar(30) | nullable |  | e.g. HMV, LMV, transport endorsement |
| `license_expiry` | date | not null |  |  |
| `badge_no` | varchar(30) | nullable |  |  |
| `police_verified_on` | date | nullable |  |  |
| `medical_check_on` | date | nullable |  |  |
| `experience_years` | smallint | nullable |  |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Index (organization_id, license_expiry).

**Relations:** belongs to `organizations`, `staff`.

### transport_routes

Prisma model `TransportRoute`. Tenant table (filtered by `organization_id`). Bus route of a campus with its usual vehicle.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `campus_id` | uuid | not null |  | FK to `campuses` (restrict on delete) |
| `vehicle_id` | uuid | nullable |  | FK to `vehicles` (setnull on delete) |
| `name` | varchar(100) | not null |  | Route 3 - Gomti Nagar |
| `code` | varchar(20) | not null |  |  |
| `shift` | enum `Shift` | not null | FULL_DAY |  |
| `start_point` | varchar(150) | nullable |  |  |
| `end_point` | varchar(150) | nullable |  |  |
| `distance_km` | decimal(6,2) | nullable |  |  |
| `status` | enum `RecordStatus` | not null | ACTIVE |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Unique (organization_id, campus_id, code); Index (organization_id, campus_id, status); Index (organization_id, vehicle_id).

**Relations:** belongs to `organizations`, `campuses`, `vehicles`; has many `route_stops`, `transport_assignments`, `vehicle_trips`.

### route_stops

Prisma model `RouteStop`. Tenant table (filtered by `organization_id`). Stop on a route with its order, timings and monthly transport fee.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (cascade on delete) |
| `route_id` | uuid | not null |  | FK to `transport_routes` (cascade on delete) |
| `name` | varchar(120) | not null |  |  |
| `sequence` | smallint | not null |  | order from the first pickup |
| `pickup_time` | varchar(5) | nullable |  | HH:mm in the campus timezone |
| `drop_time` | varchar(5) | nullable |  | HH:mm in the campus timezone |
| `landmark` | varchar(200) | nullable |  |  |
| `latitude` | decimal(9,6) | nullable |  |  |
| `longitude` | decimal(9,6) | nullable |  |  |
| `fee` | decimal(12,2) | not null | 0 | monthly transport fee from this stop |
| `currency` | char(3) | not null |  |  |
| `status` | enum `RecordStatus` | not null | ACTIVE |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Unique (organization_id, route_id, sequence); Index (organization_id, route_id, status).

**Relations:** belongs to `organizations`, `transport_routes`; has many `transport_assignments`, `transport_attendance`.

### transport_assignments

Prisma model `TransportAssignment`. Tenant table (filtered by `organization_id`). A student's use of a route and stop(s) for an academic year. The invoice worker bills monthlyFee under feeHeadId per billingFrequency, writes FeeInvoiceItem.transportAssignmentId + period, and advances billedUpTo (no double billing after a stop change). One ACTIVE assignment per student per year is enforced by a partial unique index in the SQL migration: uq_transport_assignment_active (organization_id, student_id, academic_year_id) WHERE status = 'ACTIVE' AND deleted_at IS NULL

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `campus_id` | uuid | not null |  | FK to `campuses` (restrict on delete) |
| `student_id` | uuid | not null |  | FK to `students` (restrict on delete) |
| `academic_year_id` | uuid | not null |  | FK to `academic_years` (restrict on delete) |
| `route_id` | uuid | not null |  | FK to `transport_routes` (restrict on delete) |
| `pickup_stop_id` | uuid | nullable |  | FK to `route_stops` (restrict on delete). null when serviceType is DROP_ONLY |
| `drop_stop_id` | uuid | nullable |  | FK to `route_stops` (restrict on delete). null when serviceType is PICKUP_ONLY |
| `service_type` | enum `TransportServiceType` | not null | BOTH |  |
| `start_date` | date | not null |  |  |
| `end_date` | date | nullable |  |  |
| `monthly_fee` | decimal(12,2) | not null |  | copied from the stop; may be overridden |
| `currency` | char(3) | not null |  |  |
| `fee_head_id` | uuid | nullable |  | FK to `fee_heads` (restrict on delete). TRANSPORT fee head used on invoices |
| `billing_frequency` | enum `FeeFrequency` | not null | MONTHLY |  |
| `billed_up_to` | date | nullable |  | last period already invoiced |
| `status` | enum `TransportAssignmentStatus` | not null | ACTIVE |  |
| `notes` | varchar(255) | nullable |  |  |
| `created_by_id` | uuid | nullable |  | User id (audit only, no FK) |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Index (organization_id, student_id, academic_year_id, status); Index (organization_id, route_id, status); Index (organization_id, campus_id, academic_year_id, status).

**Relations:** belongs to `organizations`, `campuses`, `students`, `academic_years`, `transport_routes`, `route_stops`, `fee_heads`; has many `fee_invoice_items`.

### vehicle_trips

Prisma model `VehicleTrip`. Tenant table (filtered by `organization_id`). Daily trip log of a vehicle on a route (morning pickup, afternoon drop).

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `campus_id` | uuid | not null |  | FK to `campuses` (restrict on delete) |
| `vehicle_id` | uuid | not null |  | FK to `vehicles` (restrict on delete) |
| `route_id` | uuid | nullable |  | FK to `transport_routes` (setnull on delete). null for SPECIAL trips |
| `driver_id` | uuid | nullable |  | FK to `staff` (setnull on delete). Staff who drove |
| `attendant_id` | uuid | nullable |  | FK to `staff` (setnull on delete). Staff attendant on board |
| `trip_date` | date | not null |  |  |
| `trip_type` | enum `TripType` | not null |  |  |
| `status` | enum `TripStatus` | not null | SCHEDULED |  |
| `started_at` | timestamptz | nullable |  |  |
| `ended_at` | timestamptz | nullable |  |  |
| `start_odometer_km` | integer | nullable |  |  |
| `end_odometer_km` | integer | nullable |  |  |
| `students_boarded` | integer | nullable |  |  |
| `fuel_litres` | decimal(6,2) | nullable |  |  |
| `incident_notes` | text | nullable |  | delays, breakdowns, incidents |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Unique (organization_id, vehicle_id, route_id, trip_date, trip_type); Index (organization_id, campus_id, trip_date); Index (organization_id, driver_id, trip_date).

**Relations:** belongs to `organizations`, `campuses`, `vehicles`, `transport_routes`, `staff`; has many `transport_attendance`.

### transport_attendance

Prisma model `TransportAttendance`. Tenant table (filtered by `organization_id`). Boarding / drop record of one student on one trip: parent alert ("Aarav boarded the bus at 7:12") and safety register.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `campus_id` | uuid | not null |  | FK to `campuses` (restrict on delete) |
| `trip_id` | uuid | not null |  | FK to `vehicle_trips` (restrict on delete) |
| `student_id` | uuid | not null |  | FK to `students` (restrict on delete) |
| `stop_id` | uuid | nullable |  | FK to `route_stops` (setnull on delete) |
| `status` | enum `TransportBoardingStatus` | not null |  |  |
| `boarded_at` | timestamptz | nullable |  |  |
| `dropped_at` | timestamptz | nullable |  |  |
| `marked_by_id` | uuid | nullable |  | User id of the attendant / driver (audit only, no FK) |
| `notified_at` | timestamptz | nullable |  | alert sent to the parent |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Unique (organization_id, trip_id, student_id); Index (organization_id, student_id, created_at); Index (organization_id, campus_id, created_at).

**Relations:** belongs to `organizations`, `campuses`, `vehicle_trips`, `students`, `route_stops`.

### vehicle_maintenances

Prisma model `VehicleMaintenance`. Tenant table (filtered by `organization_id`). Service, repair or compliance renewal of a vehicle with cost and next due date.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `campus_id` | uuid | not null |  | FK to `campuses` (restrict on delete) |
| `vehicle_id` | uuid | not null |  | FK to `vehicles` (restrict on delete) |
| `vendor_id` | uuid | nullable |  | FK to `vendors` (setnull on delete). workshop / insurer |
| `maintenance_type` | enum `MaintenanceType` | not null |  |  |
| `description` | varchar(500) | nullable |  |  |
| `service_date` | date | not null |  |  |
| `next_due_date` | date | nullable |  |  |
| `odometer_km` | integer | nullable |  |  |
| `cost` | decimal(12,2) | not null | 0 |  |
| `currency` | char(3) | not null |  |  |
| `bill_no` | varchar(60) | nullable |  |  |
| `bill_file_id` | uuid | nullable |  | FK to `file_assets` (setnull on delete) |
| `created_by_id` | uuid | nullable |  | User id (audit only, no FK) |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Index (organization_id, vehicle_id, service_date); Index (organization_id, campus_id, next_due_date).

**Relations:** belongs to `organizations`, `campuses`, `vehicles`, `vendors`, `file_assets`.

### hostels

Prisma model `Hostel`. Tenant table (filtered by `organization_id`). Hostel building of a campus with its warden.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `campus_id` | uuid | not null |  | FK to `campuses` (restrict on delete) |
| `name` | varchar(100) | not null |  |  |
| `code` | varchar(20) | not null |  |  |
| `hostel_type` | enum `HostelType` | not null |  |  |
| `warden_id` | uuid | nullable |  | FK to `staff` (setnull on delete). Staff |
| `phone` | varchar(20) | nullable |  |  |
| `address` | varchar(300) | nullable |  |  |
| `capacity` | integer | not null | 0 | cached number of beds |
| `status` | enum `RecordStatus` | not null | ACTIVE |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Unique (organization_id, campus_id, code); Index (organization_id, campus_id, status).

**Relations:** belongs to `organizations`, `campuses`, `staff`; has many `hostel_rooms`, `hostel_beds`, `hostel_allocations`, `hostel_attendance`, `hostel_visitor_logs`, `hostel_leave_requests`.

### hostel_rooms

Prisma model `HostelRoom`. Tenant table (filtered by `organization_id`). Room of a hostel with floor, type, bed capacity and monthly rent per bed.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (cascade on delete) |
| `hostel_id` | uuid | not null |  | FK to `hostels` (restrict on delete) |
| `room_no` | varchar(20) | not null |  |  |
| `floor` | varchar(20) | nullable |  |  |
| `room_type` | enum `HostelRoomType` | not null | DOUBLE |  |
| `capacity` | smallint | not null |  | number of beds |
| `rent` | decimal(12,2) | not null | 0 | monthly rent per bed |
| `currency` | char(3) | not null |  |  |
| `amenities` | text[] | not null |  | AC, attached bath, balcony |
| `status` | enum `RecordStatus` | not null | ACTIVE |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Unique (organization_id, hostel_id, room_no); Index (organization_id, hostel_id, status).

**Relations:** belongs to `organizations`, `hostels`; has many `hostel_beds`.

### hostel_beds

Prisma model `HostelBed`. Tenant table (filtered by `organization_id`). One bed in a hostel room; the unit that is allocated to a student.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (cascade on delete) |
| `hostel_id` | uuid | not null |  | FK to `hostels` (restrict on delete). denormalised from the room for vacancy counts |
| `room_id` | uuid | not null |  | FK to `hostel_rooms` (restrict on delete) |
| `bed_no` | varchar(10) | not null |  |  |
| `status` | enum `HostelBedStatus` | not null | AVAILABLE |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Unique (organization_id, room_id, bed_no); Index (organization_id, hostel_id, status).

**Relations:** belongs to `organizations`, `hostels`, `hostel_rooms`; has many `hostel_allocations`.

### hostel_allocations

Prisma model `HostelAllocation`. Tenant table (filtered by `organization_id`). A student's stay in a hostel bed from a date to a date. One ACTIVE allocation per bed (service-layer rule + partial unique index). The invoice worker bills monthlyRent under feeHeadId per billingFrequency, writes FeeInvoiceItem.hostelAllocationId + period, and advances billedUpTo.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `campus_id` | uuid | not null |  | FK to `campuses` (restrict on delete) |
| `hostel_id` | uuid | not null |  | FK to `hostels` (restrict on delete) |
| `bed_id` | uuid | not null |  | FK to `hostel_beds` (restrict on delete) |
| `student_id` | uuid | not null |  | FK to `students` (restrict on delete) |
| `academic_year_id` | uuid | not null |  | FK to `academic_years` (restrict on delete) |
| `from_date` | date | not null |  |  |
| `to_date` | date | nullable |  | planned or actual end of stay |
| `status` | enum `HostelAllocationStatus` | not null | ACTIVE |  |
| `monthly_rent` | decimal(12,2) | not null |  | copied from the room; may be overridden |
| `deposit_amount` | decimal(12,2) | not null | 0 |  |
| `currency` | char(3) | not null |  |  |
| `fee_head_id` | uuid | nullable |  | FK to `fee_heads` (restrict on delete). HOSTEL fee head used on invoices |
| `billing_frequency` | enum `FeeFrequency` | not null | MONTHLY |  |
| `billed_up_to` | date | nullable |  | last period already invoiced |
| `vacated_on` | date | nullable |  |  |
| `vacate_reason` | varchar(255) | nullable |  |  |
| `notes` | varchar(500) | nullable |  |  |
| `allocated_by_id` | uuid | nullable |  | User id (audit only, no FK) |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Index (organization_id, bed_id, status); Index (organization_id, student_id, status); Index (organization_id, hostel_id, academic_year_id, status).

**Relations:** belongs to `organizations`, `campuses`, `hostels`, `hostel_beds`, `students`, `academic_years`, `fee_heads`; has many `fee_invoice_items`, `hostel_leave_requests`.

### hostel_attendance

Prisma model `HostelAttendance`. Tenant table (filtered by `organization_id`). Night roll call of one hostel resident on one date.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `campus_id` | uuid | not null |  | FK to `campuses` (restrict on delete) |
| `hostel_id` | uuid | not null |  | FK to `hostels` (restrict on delete) |
| `student_id` | uuid | not null |  | FK to `students` (restrict on delete) |
| `date` | date | not null |  |  |
| `status` | enum `HostelAttendanceStatus` | not null |  |  |
| `leave_request_id` | uuid | nullable |  | FK to `hostel_leave_requests` (setnull on delete). approved out-pass that produced status ON_LEAVE |
| `marked_at` | timestamptz | nullable |  |  |
| `remark` | varchar(255) | nullable |  |  |
| `marked_by_id` | uuid | nullable |  | User id (audit only, no FK) |
| `notified_at` | timestamptz | nullable |  | absence alert sent to the parent |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Unique (organization_id, hostel_id, student_id, date); Index (organization_id, campus_id, date, status); Index (organization_id, hostel_id, date, status); Index (organization_id, student_id, date).

**Relations:** belongs to `organizations`, `campuses`, `hostels`, `students`, `hostel_leave_requests`.

### hostel_visitor_logs

Prisma model `HostelVisitorLog`. Tenant table (filtered by `organization_id`). Visitor entry at the hostel gate: who met which resident, when they came and left.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `campus_id` | uuid | not null |  | FK to `campuses` (restrict on delete) |
| `hostel_id` | uuid | not null |  | FK to `hostels` (restrict on delete) |
| `student_id` | uuid | not null |  | FK to `students` (restrict on delete). resident visited |
| `guardian_id` | uuid | nullable |  | FK to `guardians` (setnull on delete). set when the visitor is a registered guardian |
| `visitor_name` | varchar(160) | not null |  |  |
| `relation` | varchar(40) | nullable |  | relation to the student as stated at the gate |
| `phone` | varchar(20) | nullable |  |  |
| `id_proof_type` | varchar(40) | nullable |  |  |
| `id_proof_last4` | varchar(4) | nullable |  | only the last 4 characters are kept |
| `purpose` | varchar(255) | nullable |  |  |
| `check_in_at` | timestamptz | not null |  |  |
| `check_out_at` | timestamptz | nullable |  |  |
| `approved_by_id` | uuid | nullable |  | User id of the warden (audit only, no FK) |
| `notes` | varchar(500) | nullable |  |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Index (organization_id, campus_id, check_in_at); Index (organization_id, hostel_id, check_in_at); Index (organization_id, student_id, check_in_at).

**Relations:** belongs to `organizations`, `hostels`, `students`, `guardians`, `campuses`.

### hostel_leave_requests

Prisma model `HostelLeaveRequest`. Tenant table (filtered by `organization_id`). Out-pass / leave of a hostel resident: parent request, warden approval, escort and gate timestamps.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `campus_id` | uuid | not null |  | FK to `campuses` (restrict on delete) |
| `hostel_id` | uuid | not null |  | FK to `hostels` (restrict on delete) |
| `student_id` | uuid | not null |  | FK to `students` (restrict on delete) |
| `allocation_id` | uuid | nullable |  | FK to `hostel_allocations` (setnull on delete) |
| `leave_type` | enum `HostelLeaveType` | not null |  |  |
| `from_at` | timestamptz | not null |  |  |
| `expected_return_at` | timestamptz | not null |  |  |
| `reason` | varchar(500) | not null |  |  |
| `requested_by_guardian_id` | uuid | nullable |  | FK to `guardians` (setnull on delete) |
| `escort_name` | varchar(160) | nullable |  | who collects the student |
| `escort_phone` | varchar(20) | nullable |  |  |
| `status` | enum `ApprovalStatus` | not null | PENDING |  |
| `approved_by_id` | uuid | nullable |  | User id of the warden (audit only, no FK) |
| `approved_at` | timestamptz | nullable |  |  |
| `checked_out_at` | timestamptz | nullable |  | actual time out at the gate |
| `checked_in_at` | timestamptz | nullable |  | actual return |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Index (organization_id, hostel_id, status, from_at); Index (organization_id, student_id, from_at); Index (organization_id, campus_id, status).

**Relations:** belongs to `organizations`, `campuses`, `hostels`, `students`, `hostel_allocations`, `guardians`; has many `hostel_attendance`.

### Enums in 11-operations.prisma

| Enum | Values | Meaning |
|---|---|---|
| `BookCopyStatus` | AVAILABLE, ISSUED, RESERVED, LOST, DAMAGED, UNDER_REPAIR, WITHDRAWN |  |
| `BookIssueStatus` | ISSUED, RETURNED, OVERDUE, LOST |  |
| `LibraryMemberType` | STUDENT, STAFF |  |
| `InventoryItemType` | CONSUMABLE, ASSET |  |
| `PurchaseOrderStatus` | DRAFT, PENDING_APPROVAL, APPROVED, ORDERED, PARTIALLY_RECEIVED, RECEIVED, CANCELLED |  |
| `StockTransactionType` | IN, OUT, ADJUST, ISSUE_TO_STAFF, ISSUE_TO_STUDENT, RETURN, SALE, TRANSFER_OUT, TRANSFER_IN, WRITE_OFF |  |
| `BookReservationStatus` | WAITING, READY_FOR_PICKUP, FULFILLED, EXPIRED, CANCELLED |  |
| `TransportBoardingStatus` | BOARDED, NOT_BOARDED, DROPPED, ABSENT |  |
| `HostelLeaveType` | HOME_VISIT, DAY_OUT, MEDICAL, EMERGENCY |  |
| `AssetAssignmentStatus` | ASSIGNED, RETURNED, LOST, DAMAGED |  |
| `VehicleType` | BUS, MINI_BUS, VAN, CAR, AUTO, OTHER |  |
| `VehicleStatus` | ACTIVE, UNDER_MAINTENANCE, RETIRED |  |
| `TransportServiceType` | BOTH, PICKUP_ONLY, DROP_ONLY |  |
| `TransportAssignmentStatus` | ACTIVE, SUSPENDED, ENDED |  |
| `TripType` | PICKUP, DROP, SPECIAL |  |
| `TripStatus` | SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED |  |
| `MaintenanceType` | SERVICE, REPAIR, TYRE, INSURANCE_RENEWAL, FITNESS_RENEWAL, PUC_RENEWAL, ACCIDENT, OTHER |  |
| `HostelType` | BOYS, GIRLS, MIXED |  |
| `HostelRoomType` | SINGLE, DOUBLE, TRIPLE, DORMITORY |  |
| `HostelBedStatus` | AVAILABLE, OCCUPIED, RESERVED, MAINTENANCE |  |
| `HostelAllocationStatus` | RESERVED, ACTIVE, VACATED, CANCELLED |  |
| `HostelAttendanceStatus` | PRESENT, ABSENT, ON_LEAVE, LATE_ENTRY |  |

## Payroll

Schema file `server/prisma/schema/12-payroll.prisma` — 11 tables and 12 enums.

### salary_components

Prisma model `SalaryComponent`. Tenant table (filtered by `organization_id`). Pay head: Basic, HRA, Conveyance, PF, Professional Tax, TDS ...

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `name` | varchar(100) | not null |  |  |
| `code` | varchar(20) | not null |  | BASIC, HRA, PF_EE ... also used as the variable name in formulas |
| `component_type` | enum `SalaryComponentType` | not null |  |  |
| `calculation_type` | enum `SalaryCalculationType` | not null | FIXED |  |
| `default_amount` | decimal(12,2) | nullable |  | FIXED |
| `currency` | char(3) | nullable |  | currency of defaultAmount; required when calculationType is FIXED |
| `country_code` | char(2) | nullable |  | null = usable in every country; else limits the component to one payroll country |
| `default_percent` | decimal(5,2) | nullable |  | PERCENT_OF_BASIC / PERCENT_OF_GROSS |
| `formula` | varchar(500) | nullable |  | FORMULA, e.g. "min(BASIC, 15000) * 0.12"; evaluated by a safe expression parser |
| `statutory_type` | enum `StatutoryType` | not null | NONE |  |
| `is_taxable` | boolean | not null | true |  |
| `is_prorated` | boolean | not null | true | reduced for loss-of-pay days |
| `show_on_payslip` | boolean | not null | true |  |
| `sort_order` | integer | not null | 0 |  |
| `status` | enum `RecordStatus` | not null | ACTIVE |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Unique (organization_id, code); Index (organization_id, component_type, status).

**Relations:** belongs to `organizations`; has many `salary_structure_items`, `payslip_items`.

### salary_structures

Prisma model `SalaryStructure`. Tenant table (filtered by `organization_id`). Reusable salary template, e.g. "Teaching staff - Grade A".

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `name` | varchar(120) | not null |  |  |
| `code` | varchar(30) | not null |  |  |
| `description` | varchar(500) | nullable |  |  |
| `staff_type` | enum `StaffType` | nullable |  | null = usable for all staff |
| `currency` | char(3) | not null |  |  |
| `status` | enum `RecordStatus` | not null | ACTIVE |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Unique (organization_id, code); Index (organization_id, status).

**Relations:** belongs to `organizations`; has many `salary_structure_items`, `staff_salaries`.

### salary_structure_items

Prisma model `SalaryStructureItem`. Tenant table (filtered by `organization_id`). A component inside a salary structure with its rule for this structure.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (cascade on delete) |
| `salary_structure_id` | uuid | not null |  | FK to `salary_structures` (cascade on delete) |
| `component_id` | uuid | not null |  | FK to `salary_components` (restrict on delete) |
| `calculation_type` | enum `SalaryCalculationType` | not null |  |  |
| `amount` | decimal(12,2) | nullable |  |  |
| `percent` | decimal(5,2) | nullable |  |  |
| `formula` | varchar(500) | nullable |  |  |
| `sort_order` | integer | not null | 0 |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Unique (organization_id, salary_structure_id, component_id); Index (organization_id, component_id).

**Relations:** belongs to `organizations`, `salary_structures`, `salary_components`.

### staff_salaries

Prisma model `StaffSalary`. Tenant table (filtered by `organization_id`). Salary of a staff member for a date range (a new row for every revision).

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `campus_id` | uuid | not null |  | FK to `campuses` (restrict on delete). staff campus when the revision was made; history survives a later transfer |
| `staff_id` | uuid | not null |  | FK to `staff` (restrict on delete) |
| `salary_structure_id` | uuid | not null |  | FK to `salary_structures` (restrict on delete) |
| `pay_basis` | enum `PayBasis` | not null | MONTHLY |  |
| `rate_per_unit` | decimal(12,2) | nullable |  | per lecture / hour / day when payBasis is not MONTHLY |
| `effective_from` | date | not null |  |  |
| `effective_to` | date | nullable |  | null = current |
| `ctc_annual` | decimal(12,2) | not null |  | cost to company per year |
| `gross_monthly` | decimal(12,2) | not null |  |  |
| `basic_monthly` | decimal(12,2) | not null |  |  |
| `currency` | char(3) | not null |  |  |
| `component_overrides` | jsonb | nullable |  | [{ componentId, amount \| percent }] values that differ from the structure |
| `payment_mode` | enum `SalaryPaymentMode` | not null | BANK_TRANSFER |  |
| `pf_applicable` | boolean | not null | false |  |
| `esi_applicable` | boolean | not null | false |  |
| `pt_applicable` | boolean | not null | false |  |
| `tds_applicable` | boolean | not null | false |  |
| `tax_regime` | enum `TaxRegime` | nullable |  | India |
| `revision_reason` | varchar(255) | nullable |  | joining, increment, promotion |
| `approved_by_id` | uuid | nullable |  | User id (audit only, no FK) |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Unique (organization_id, staff_id, effective_from); Index (organization_id, campus_id, effective_to); Index (organization_id, staff_id, effective_to); Index (organization_id, salary_structure_id).

**Relations:** belongs to `organizations`, `campuses`, `staff`, `salary_structures`; has many `payslips`.

### payroll_runs

Prisma model `PayrollRun`. Tenant table (filtered by `organization_id`). Monthly payroll of a campus. LOCKED runs can never be changed; off-cycle runs (full-and-final, bonus, arrears) get their own row.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `campus_id` | uuid | not null |  | FK to `campuses` (restrict on delete) |
| `run_type` | enum `PayrollRunType` | not null | REGULAR |  |
| `run_no` | smallint | not null | 1 | 1 for the regular run; counts up for off-cycle runs of the same type and month |
| `month` | smallint | not null |  | 1-12 |
| `year` | smallint | not null |  |  |
| `period_start` | date | not null |  |  |
| `period_end` | date | not null |  |  |
| `status` | enum `PayrollRunStatus` | not null | DRAFT |  |
| `currency` | char(3) | not null |  |  |
| `staff_count` | integer | not null | 0 |  |
| `total_gross` | decimal(12,2) | not null | 0 |  |
| `total_deductions` | decimal(12,2) | not null | 0 |  |
| `total_net` | decimal(12,2) | not null | 0 |  |
| `total_employer_cost` | decimal(12,2) | not null | 0 | employer PF / ESI contributions |
| `payment_date` | date | nullable |  |  |
| `processed_at` | timestamptz | nullable |  |  |
| `processed_by_id` | uuid | nullable |  | User id (audit only, no FK) |
| `approved_by_id` | uuid | nullable |  | FK to `users` (setnull on delete) |
| `approved_at` | timestamptz | nullable |  |  |
| `paid_at` | timestamptz | nullable |  |  |
| `locked_at` | timestamptz | nullable |  |  |
| `notes` | varchar(500) | nullable |  |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Unique (organization_id, campus_id, year, month, run_type, run_no); Index (organization_id, status, year, month).

**Relations:** belongs to `organizations`, `campuses`, `users`; has many `payslips`, `payroll_adjustments`.

### payslips

Prisma model `Payslip`. Tenant table (filtered by `organization_id`). Salary slip of one staff member in one payroll run. A staff member transferred mid-month must not get two regular payslips: partial unique index in the SQL migration, uq_payslip_staff_month (organization_id, staff_id, year, month) WHERE run_type = 'REGULAR' AND status <> 'CANCELLED'

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `campus_id` | uuid | not null |  | FK to `campuses` (restrict on delete) |
| `payroll_run_id` | uuid | not null |  | FK to `payroll_runs` (restrict on delete) |
| `staff_id` | uuid | not null |  | FK to `staff` (restrict on delete) |
| `staff_salary_id` | uuid | nullable |  | FK to `staff_salaries` (setnull on delete). salary revision used for the calculation |
| `payslip_no` | varchar(40) | not null |  | from NumberSequence PAYSLIP_NO |
| `run_type` | enum `PayrollRunType` | not null | REGULAR | denormalised from the run for the partial unique index |
| `month` | smallint | not null |  |  |
| `year` | smallint | not null |  |  |
| `financial_year` | varchar(9) | nullable |  | 2027-28 |
| `working_days` | decimal(4,1) | not null |  |  |
| `paid_days` | decimal(4,1) | not null |  |  |
| `lop_days` | decimal(4,1) | not null | 0 | loss-of-pay days from unpaid leave and absence |
| `units_worked` | decimal(6,2) | nullable |  | lectures / hours / days counted from COMPLETED ClassSession rows when payBasis is not MONTHLY |
| `rate_per_unit` | decimal(12,2) | nullable |  | frozen from StaffSalary |
| `pf_wages` | decimal(12,2) | nullable |  | statutory wage bases frozen for ECR / returns |
| `eps_wages` | decimal(12,2) | nullable |  |  |
| `esi_wages` | decimal(12,2) | nullable |  |  |
| `pt_wages` | decimal(12,2) | nullable |  |  |
| `taxable_income` | decimal(12,2) | nullable |  |  |
| `tds_ytd` | decimal(12,2) | nullable |  | TDS deducted so far in the financial year (Form 16 / 24Q) |
| `statutory_summary` | jsonb | nullable |  | { pfEmployee, pfEmployer, eps, esiEmployee, esiEmployer, pt, tds, lwf } |
| `gross_earnings` | decimal(12,2) | not null |  |  |
| `total_deductions` | decimal(12,2) | not null |  |  |
| `net_pay` | decimal(12,2) | not null |  | grossEarnings - totalDeductions |
| `employer_contribution` | decimal(12,2) | not null | 0 |  |
| `currency` | char(3) | not null |  |  |
| `status` | enum `PayslipStatus` | not null | DRAFT |  |
| `payment_mode` | enum `SalaryPaymentMode` | not null | BANK_TRANSFER |  |
| `payment_reference` | varchar(100) | nullable |  | UTR / cheque number |
| `paid_at` | timestamptz | nullable |  |  |
| `bank_account_last4` | varchar(4) | nullable |  |  |
| `snapshot` | jsonb | nullable |  | frozen staff name, code, designation, department and attendance summary for the PDF |
| `hold_reason` | varchar(255) | nullable |  |  |
| `cancelled_at` | timestamptz | nullable |  |  |
| `cancelled_by_id` | uuid | nullable |  | User id (audit only, no FK) |
| `cancel_reason` | varchar(255) | nullable |  |  |
| `pdf_file_id` | uuid | nullable |  | FK to `file_assets` (setnull on delete) |
| `sent_at` | timestamptz | nullable |  | emailed / shared with the staff member |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Unique (organization_id, payroll_run_id, staff_id); Unique (organization_id, payslip_no); Index (organization_id, staff_id, year, month); Index (organization_id, campus_id, status).

**Relations:** belongs to `organizations`, `campuses`, `payroll_runs`, `staff`, `staff_salaries`, `file_assets`; has many `payslip_items`, `payroll_adjustments`.

### payslip_items

Prisma model `PayslipItem`. Tenant table (filtered by `organization_id`). One earning or deduction line of a payslip (values are frozen at processing time).

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (cascade on delete) |
| `payslip_id` | uuid | not null |  | FK to `payslips` (cascade on delete) |
| `component_id` | uuid | nullable |  | FK to `salary_components` (restrict on delete). null for loan recovery and ad-hoc adjustment lines |
| `loan_advance_id` | uuid | nullable |  | FK to `staff_loan_advances` (restrict on delete). EMI recovery line |
| `name` | varchar(100) | not null |  |  |
| `code` | varchar(20) | nullable |  |  |
| `component_type` | enum `SalaryComponentType` | not null |  |  |
| `statutory_type` | enum `StatutoryType` | not null | NONE |  |
| `amount` | decimal(12,2) | not null |  |  |
| `sort_order` | integer | not null | 0 |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Index (organization_id, payslip_id, sort_order); Index (organization_id, component_id); Index (organization_id, loan_advance_id).

**Relations:** belongs to `organizations`, `payslips`, `salary_components`, `staff_loan_advances`.

### staff_loan_advances

Prisma model `StaffLoanAdvance`. Tenant table (filtered by `organization_id`). Loan or salary advance given to a staff member and recovered through payslip deductions.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `campus_id` | uuid | not null |  | FK to `campuses` (restrict on delete). staff campus when the loan was given |
| `staff_id` | uuid | not null |  | FK to `staff` (restrict on delete) |
| `loan_type` | enum `LoanAdvanceType` | not null |  |  |
| `principal_amount` | decimal(12,2) | not null |  |  |
| `interest_rate` | decimal(5,2) | not null | 0 | % per year; 0 for advances |
| `total_payable` | decimal(12,2) | not null |  |  |
| `emi_amount` | decimal(12,2) | not null |  | monthly deduction |
| `installments` | smallint | not null |  |  |
| `installments_paid` | smallint | not null | 0 |  |
| `amount_recovered` | decimal(12,2) | not null | 0 |  |
| `balance` | decimal(12,2) | not null |  | totalPayable - amountRecovered |
| `currency` | char(3) | not null |  |  |
| `status` | enum `LoanAdvanceStatus` | not null | PENDING |  |
| `reason` | varchar(500) | nullable |  |  |
| `disbursed_on` | date | nullable |  |  |
| `recovery_start_date` | date | nullable |  | first payroll month that deducts the EMI |
| `approved_by_id` | uuid | nullable |  | FK to `users` (setnull on delete) |
| `approved_at` | timestamptz | nullable |  |  |
| `closed_at` | timestamptz | nullable |  |  |
| `created_by_id` | uuid | nullable |  | User id (audit only, no FK) |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Index (organization_id, campus_id, status); Index (organization_id, staff_id, status); Index (organization_id, status).

**Relations:** belongs to `organizations`, `campuses`, `staff`, `users`; has many `payslip_items`.

### payroll_adjustments

Prisma model `PayrollAdjustment`. Tenant table (filtered by `organization_id`). One-off earning or deduction for a staff member in a payroll month (bonus, arrears, fine).

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `campus_id` | uuid | not null |  | FK to `campuses` (restrict on delete) |
| `staff_id` | uuid | not null |  | FK to `staff` (restrict on delete) |
| `month` | smallint | not null |  | payroll month the adjustment belongs to |
| `year` | smallint | not null |  |  |
| `adjustment_type` | enum `PayrollAdjustmentType` | not null |  |  |
| `component_type` | enum `SalaryComponentType` | not null |  | EARNING or DEDUCTION |
| `amount` | decimal(12,2) | not null |  |  |
| `currency` | char(3) | not null |  |  |
| `is_taxable` | boolean | not null | true |  |
| `reason` | varchar(500) | not null |  |  |
| `status` | enum `ApprovalStatus` | not null | PENDING |  |
| `payroll_run_id` | uuid | nullable |  | FK to `payroll_runs` (setnull on delete). run that picked the adjustment up |
| `payslip_id` | uuid | nullable |  | FK to `payslips` (setnull on delete). payslip it was applied to |
| `approved_by_id` | uuid | nullable |  | FK to `users` (setnull on delete) |
| `approved_at` | timestamptz | nullable |  |  |
| `created_by_id` | uuid | nullable |  | User id (audit only, no FK) |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Index (organization_id, staff_id, year, month); Index (organization_id, campus_id, status, year, month); Index (organization_id, payroll_run_id).

**Relations:** belongs to `organizations`, `campuses`, `staff`, `payroll_runs`, `payslips`, `users`.

### payroll_statutory_settings

Prisma model `PayrollStatutorySetting`. Tenant table (filtered by `organization_id`). Employer statutory registrations per organization or campus: PF establishment, ESI, TAN, PT, LWF (India) and ids for other countries.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `campus_id` | uuid | nullable |  | FK to `campuses` (restrict on delete). null = whole organization |
| `campus_key` | varchar(36) | not null | "ALL" | "ALL" or the campusId; makes the unique key work without NULLs |
| `country_code` | char(2) | not null |  |  |
| `pf_establishment_code` | varchar(30) | nullable |  |  |
| `esi_employer_code` | varchar(30) | nullable |  |  |
| `tan` | varchar(15) | nullable |  | needed for TDS 24Q and Form 16 |
| `pt_registration_no` | varchar(30) | nullable |  |  |
| `pt_state_code` | varchar(10) | nullable |  |  |
| `lwf_registration_no` | varchar(30) | nullable |  |  |
| `pf_wage_ceiling` | decimal(12,2) | nullable |  | e.g. 15000.00 |
| `esi_wage_ceiling` | decimal(12,2) | nullable |  |  |
| `currency` | char(3) | not null |  |  |
| `other_registrations` | jsonb | nullable |  | { abn, paygWithholdingNo, wpsEstablishmentId, ein, stateUnemploymentId } |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Unique (organization_id, campus_key); Index (organization_id, country_code).

**Relations:** belongs to `organizations`, `campuses`.

### staff_tax_declarations

Prisma model `StaffTaxDeclaration`. Tenant table (filtered by `organization_id`). A staff member's annual investment / HRA declaration and previous-employer income; drives monthly TDS and Form 12BB.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `staff_id` | uuid | not null |  | FK to `staff` (restrict on delete) |
| `financial_year` | varchar(9) | not null |  | 2027-28 |
| `regime` | enum `TaxRegime` | not null |  |  |
| `declarations` | jsonb | not null |  | [{ section: "80C", declared, verified, proofFileId }] |
| `hra_rent_annual` | decimal(12,2) | nullable |  |  |
| `previous_employer_income` | decimal(12,2) | nullable |  |  |
| `previous_employer_tds` | decimal(12,2) | nullable |  |  |
| `currency` | char(3) | not null |  |  |
| `status` | enum `ApprovalStatus` | not null | PENDING |  |
| `verified_by_id` | uuid | nullable |  | User id (audit only, no FK) |
| `verified_at` | timestamptz | nullable |  |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Unique (organization_id, staff_id, financial_year); Index (organization_id, financial_year, status).

**Relations:** belongs to `organizations`, `staff`.

### Enums in 12-payroll.prisma

| Enum | Values | Meaning |
|---|---|---|
| `SalaryComponentType` | EARNING, DEDUCTION, EMPLOYER_CONTRIBUTION |  |
| `SalaryCalculationType` | FIXED, PERCENT_OF_BASIC, PERCENT_OF_GROSS, FORMULA |  |
| `StatutoryType` | NONE, PF, ESI, PT, TDS, LWF, SUPERANNUATION, PAYG_WITHHOLDING, FEDERAL_INCOME_TAX, STATE_INCOME_TAX, SOCIAL_SECURITY, MEDICARE, GRATUITY, PENSION_GPSSA, OTHER_STATUTORY | Statutory scheme a component belongs to (India first, then the Phase 2 markets). |
| `PayBasis` | MONTHLY, PER_LECTURE, PER_HOUR, PER_DAY | How a staff member is paid. Visiting / part-time faculty are paid per lecture or hour. |
| `TaxRegime` | OLD, NEW, NOT_APPLICABLE | India income-tax regime of the employee. |
| `PayrollRunType` | REGULAR, OFF_CYCLE, FULL_AND_FINAL, BONUS, ARREARS |  |
| `PayrollRunStatus` | DRAFT, PROCESSED, APPROVED, PAID, LOCKED |  |
| `PayslipStatus` | DRAFT, FINALIZED, PAID, ON_HOLD, CANCELLED |  |
| `SalaryPaymentMode` | BANK_TRANSFER, CASH, CHEQUE, UPI |  |
| `LoanAdvanceType` | LOAN, SALARY_ADVANCE |  |
| `LoanAdvanceStatus` | PENDING, APPROVED, REJECTED, ACTIVE, CLOSED, CANCELLED |  |
| `PayrollAdjustmentType` | BONUS, INCENTIVE, ARREARS, REIMBURSEMENT, OVERTIME, SUBSTITUTION_PAY, LEAVE_ENCASHMENT, OTHER_EARNING, FINE, RECOVERY, OTHER_DEDUCTION |  |

## Certificates, analytics and AI

Schema file `server/prisma/schema/13-certificates-analytics-ai.prisma` — 11 tables and 9 enums.

### certificate_templates

Prisma model `CertificateTemplate`. Tenant table (filtered by `organization_id`). Certificate design: body text with merge variables, layout and signatories.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `name` | varchar(120) | not null |  |  |
| `certificate_type` | enum `CertificateType` | not null |  |  |
| `body` | text | not null |  | text with {{variables}}, e.g. "This is to certify that {{studentName}} ..." |
| `variables` | text[] | not null |  | merge variables used in the body |
| `layout` | jsonb | not null |  | page size, orientation, margins, fonts, logo / seal / QR positions |
| `signatories` | jsonb | nullable |  | [{ name, designation, signatureFileId }] |
| `background_file_id` | uuid | nullable |  | FK to `file_assets` (setnull on delete). letterhead / border image |
| `requires_approval` | boolean | not null | true | requests need approval before issue |
| `fee_amount` | decimal(12,2) | nullable |  | charge for issuing; null = free |
| `currency` | char(3) | nullable |  |  |
| `is_default` | boolean | not null | false | default template of its certificateType |
| `status` | enum `RecordStatus` | not null | ACTIVE |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Unique (organization_id, name); Index (organization_id, certificate_type, status).

**Relations:** belongs to `organizations`, `file_assets`; has many `issued_certificates`, `certificate_requests`.

### issued_certificates

Prisma model `IssuedCertificate`. Tenant table (filtered by `organization_id`). Certificate issued to a student. The data snapshot and PDF never change; a wrong certificate is revoked and re-issued.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `campus_id` | uuid | not null |  | FK to `campuses` (restrict on delete) |
| `template_id` | uuid | not null |  | FK to `certificate_templates` (restrict on delete) |
| `request_id` | uuid | nullable |  | UK. FK to `certificate_requests` (setnull on delete). request that led to this certificate |
| `student_id` | uuid | not null |  | FK to `students` (restrict on delete) |
| `certificate_type` | enum `CertificateType` | not null |  | denormalised from the template |
| `serial_no` | varchar(40) | not null |  | from NumberSequence CERTIFICATE_NO |
| `issue_date` | date | not null |  |  |
| `purpose` | varchar(255) | nullable |  |  |
| `data_snapshot` | jsonb | not null |  | merge values frozen at issue time |
| `pdf_file_id` | uuid | nullable |  | FK to `file_assets` (setnull on delete) |
| `verification_code` | varchar(32) | not null |  | UK. random code in the QR; public page /verify/{code} works without login |
| `verification_count` | integer | not null | 0 |  |
| `last_verified_at` | timestamptz | nullable |  |  |
| `issued_by_id` | uuid | nullable |  | FK to `users` (setnull on delete) |
| `revoked_at` | timestamptz | nullable |  |  |
| `revoked_by_id` | uuid | nullable |  | User id (audit only, no FK) |
| `revoke_reason` | varchar(255) | nullable |  |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Unique (organization_id, serial_no); Index (organization_id, student_id, certificate_type); Index (organization_id, campus_id, issue_date).

**Relations:** belongs to `organizations`, `campuses`, `certificate_templates`, `certificate_requests`, `students`, `file_assets`, `users`.

### certificate_requests

Prisma model `CertificateRequest`. Tenant table (filtered by `organization_id`). Request for a certificate raised by a parent or student in the portal (or by staff), with approval.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (restrict on delete) |
| `campus_id` | uuid | not null |  | FK to `campuses` (restrict on delete) |
| `student_id` | uuid | not null |  | FK to `students` (restrict on delete) |
| `certificate_type` | enum `CertificateType` | not null |  |  |
| `template_id` | uuid | nullable |  | FK to `certificate_templates` (setnull on delete) |
| `purpose` | varchar(500) | not null |  |  |
| `copies` | smallint | not null | 1 |  |
| `status` | enum `CertificateRequestStatus` | not null | PENDING |  |
| `requested_by_user_id` | uuid | nullable |  | FK to `users` (setnull on delete). parent, student or staff login |
| `reviewed_by_id` | uuid | nullable |  | FK to `users` (setnull on delete) |
| `reviewed_at` | timestamptz | nullable |  |  |
| `review_remarks` | varchar(500) | nullable |  |  |
| `fee_invoice_id` | uuid | nullable |  | FK to `fee_invoices` (setnull on delete). invoice for the certificate fee, when charged |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Index (organization_id, campus_id, status, created_at); Index (organization_id, student_id, created_at).

**Relations:** belongs to `organizations`, `campuses`, `students`, `certificate_templates`, `users`, `fee_invoices`, `issued_certificates`.

### saved_reports

Prisma model `SavedReport`. Tenant table (filtered by `organization_id`). Report built in the report builder and saved for reuse; may be shared and scheduled.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (cascade on delete) |
| `campus_id` | uuid | nullable |  | FK to `campuses` (cascade on delete). null = all campuses the viewer may see |
| `name` | varchar(150) | not null |  |  |
| `description` | varchar(500) | nullable |  |  |
| `category` | enum `ReportCategory` | not null |  |  |
| `definition` | jsonb | not null |  | { dataset, columns, filters, groupBy, sort, chart } |
| `is_shared` | boolean | not null | false | false = visible to the owner only |
| `shared_role_keys` | text[] | not null |  | role keys that may open a shared report; empty = every role with analytics.view |
| `owner_id` | uuid | nullable |  | FK to `users` (setnull on delete) |
| `last_run_at` | timestamptz | nullable |  |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |
| `deleted_at` | timestamptz | nullable |  |  |

**Indexes and constraints:** Index (organization_id, category, is_shared); Index (organization_id, owner_id).

**Relations:** belongs to `organizations`, `campuses`, `users`; has many `report_schedules`.

### report_schedules

Prisma model `ReportSchedule`. Tenant table (filtered by `organization_id`). Automatic delivery of a saved report by email (daily, weekly, monthly).

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (cascade on delete) |
| `saved_report_id` | uuid | not null |  | FK to `saved_reports` (cascade on delete) |
| `frequency` | enum `ScheduleFrequency` | not null |  |  |
| `day_of_week` | enum `WeekDay` | nullable |  | WEEKLY |
| `day_of_month` | smallint | nullable |  | MONTHLY / QUARTERLY; 1-28 |
| `time_of_day` | varchar(5) | not null |  | HH:mm in the organization timezone |
| `format` | enum `FileFormat` | not null | PDF |  |
| `recipient_user_ids` | uuid[] | not null |  |  |
| `recipient_emails` | text[] | not null |  | extra addresses, e.g. a trustee |
| `is_active` | boolean | not null | true |  |
| `next_run_at` | timestamptz | nullable |  |  |
| `last_run_at` | timestamptz | nullable |  |  |
| `last_run_status` | enum `JobStatus` | nullable |  |  |
| `last_error` | varchar(500) | nullable |  |  |
| `created_by_id` | uuid | nullable |  | User id (audit only, no FK) |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Index (organization_id, saved_report_id); Index (is_active, next_run_at).

**Relations:** belongs to `organizations`, `saved_reports`.

### daily_metric_snapshots

Prisma model `DailyMetricSnapshot`. Tenant table (filtered by `organization_id`). Pre-computed daily numbers per organization and campus; dashboards read this table instead of scanning raw data.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (cascade on delete) |
| `campus_id` | uuid | nullable |  | FK to `campuses` (cascade on delete). null = roll-up of the whole organization |
| `campus_key` | varchar(36) | not null | "ALL" | "ALL" or the campusId; makes the unique key work without NULLs |
| `date` | date | not null |  |  |
| `active_students` | integer | not null | 0 |  |
| `new_admissions` | integer | not null | 0 |  |
| `new_inquiries` | integer | not null | 0 |  |
| `withdrawals` | integer | not null | 0 |  |
| `students_marked` | integer | not null | 0 | students with attendance marked on the date |
| `students_present` | integer | not null | 0 |  |
| `attendance_percent` | decimal(5,2) | nullable |  | null on holidays |
| `staff_total` | integer | not null | 0 |  |
| `staff_present` | integer | not null | 0 |  |
| `currency` | char(3) | not null |  |  |
| `fee_invoiced` | decimal(14,2) | not null | 0 | invoices issued on the date |
| `fee_collected` | decimal(14,2) | not null | 0 | successful payments on the date |
| `fee_collected_online` | decimal(14,2) | not null | 0 |  |
| `fee_dues` | decimal(14,2) | not null | 0 | total outstanding balance at the end of the day |
| `fee_overdue` | decimal(14,2) | not null | 0 | part of feeDues past the due date |
| `messages_sent` | integer | not null | 0 |  |
| `extra` | jsonb | nullable |  | module-specific counters (library issues, transport trips ...) |
| `computed_at` | timestamptz | not null | now() |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Unique (organization_id, campus_key, date); Index (organization_id, date).

**Relations:** belongs to `organizations`, `campuses`.

### dashboard_preferences

Prisma model `DashboardPreference`. Tenant table (filtered by `organization_id`). A user's dashboard layout: widget order, hidden widgets and default filters.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (cascade on delete) |
| `user_id` | uuid | not null |  | FK to `users` (cascade on delete) |
| `dashboard_key` | varchar(40) | not null | "home" | home, fees, attendance, admissions |
| `layout` | jsonb | not null |  | [{ widgetKey, x, y, w, h }] |
| `hidden_widgets` | text[] | not null |  |  |
| `default_campus_id` | uuid | nullable |  | Campus id (no FK); null = all assigned campuses |
| `default_range` | varchar(20) | nullable |  | today, this_week, this_month, this_year |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Unique (organization_id, user_id, dashboard_key); Index (organization_id, dashboard_key).

**Relations:** belongs to `organizations`, `users`.

### ai_insights

Prisma model `AiInsight`. Tenant table (filtered by `organization_id`). Finding produced by the AI engine with a plain-language explanation and a suggested action.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (cascade on delete) |
| `campus_id` | uuid | nullable |  | FK to `campuses` (cascade on delete). null = organization-level insight |
| `insight_type` | enum `AiInsightType` | not null |  |  |
| `severity` | enum `AiInsightSeverity` | not null | INFO |  |
| `title` | varchar(200) | not null |  |  |
| `explanation` | text | not null |  | why the engine raised it, in simple words |
| `suggested_action` | text | nullable |  |  |
| `entity_type` | varchar(60) | nullable |  | model name the insight is about: Student, Batch, Campus ... |
| `entity_id` | uuid | nullable |  |  |
| `evidence` | jsonb | nullable |  | numbers and trends behind the insight |
| `confidence` | decimal(4,3) | nullable |  | 0.000 - 1.000 |
| `status` | enum `AiInsightStatus` | not null | NEW |  |
| `model_version` | varchar(60) | not null |  |  |
| `generated_at` | timestamptz | not null | now() |  |
| `valid_until` | timestamptz | nullable |  | stale insights are hidden after this time |
| `seen_at` | timestamptz | nullable |  |  |
| `acted_at` | timestamptz | nullable |  |  |
| `action_taken` | varchar(500) | nullable |  |  |
| `dismissed_at` | timestamptz | nullable |  |  |
| `dismiss_reason` | varchar(255) | nullable |  |  |
| `handled_by_id` | uuid | nullable |  | User id (audit only, no FK) |
| `was_helpful` | boolean | nullable |  | user feedback, used to tune the engine |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Index (organization_id, campus_id, status, severity); Index (organization_id, insight_type, generated_at); Index (organization_id, entity_type, entity_id).

**Relations:** belongs to `organizations`, `campuses`.

### student_risk_scores

Prisma model `StudentRiskScore`. Tenant table (filtered by `organization_id`). Risk scores of a student (0-100) with the contributing factors; history is kept, isLatest marks the current row.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (cascade on delete) |
| `campus_id` | uuid | not null |  | FK to `campuses` (cascade on delete) |
| `student_id` | uuid | not null |  | FK to `students` (cascade on delete) |
| `academic_year_id` | uuid | nullable |  | FK to `academic_years` (setnull on delete) |
| `dropout_risk` | decimal(5,2) | not null |  |  |
| `fee_default_risk` | decimal(5,2) | not null |  |  |
| `academic_risk` | decimal(5,2) | not null |  |  |
| `overall_risk` | decimal(5,2) | not null |  |  |
| `risk_level` | enum `RiskLevel` | not null |  | band of overallRisk |
| `factors` | jsonb | not null |  | [{ factor, weight, value, direction }] e.g. attendance down 18% in 30 days |
| `model_version` | varchar(60) | not null |  |  |
| `is_latest` | boolean | not null | true |  |
| `computed_at` | timestamptz | not null | now() |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Index (organization_id, student_id, computed_at); Index (organization_id, campus_id, is_latest, risk_level).

**Relations:** belongs to `organizations`, `campuses`, `students`, `academic_years`.

### ai_query_logs

Prisma model `AiQueryLog`. Tenant table (filtered by `organization_id`). One natural-language question asked to the AI assistant. Append-only: no updatedAt / deletedAt.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (cascade on delete) |
| `campus_id` | uuid | nullable |  | Campus id of the active campus filter (no FK) |
| `user_id` | uuid | nullable |  | FK to `users` (setnull on delete) |
| `question` | text | not null |  |  |
| `query_plan` | jsonb | nullable |  | structured, permission-checked query the model produced (never raw SQL) |
| `summary` | text | nullable |  | generated answer shown to the user |
| `result_row_count` | integer | nullable |  |  |
| `status` | enum `AiQueryStatus` | not null | SUCCESS |  |
| `model_version` | varchar(60) | not null |  |  |
| `prompt_tokens` | integer | not null | 0 |  |
| `completion_tokens` | integer | not null | 0 |  |
| `total_tokens` | integer | not null | 0 |  |
| `cost` | decimal(12,4) | not null | 0 | 4 decimals: a single query costs a fraction of a currency unit |
| `currency` | char(3) | not null | "USD" |  |
| `latency_ms` | integer | nullable |  |  |
| `feedback_rating` | smallint | nullable |  | 1 = not helpful, 5 = very helpful |
| `error_message` | varchar(500) | nullable |  |  |
| `created_at` | timestamptz | not null | now() |  |

**Indexes and constraints:** Index (organization_id, created_at); Index (organization_id, user_id, created_at).

**Relations:** belongs to `organizations`, `users`.

### ai_usage_quotas

Prisma model `AiUsageQuota`. Tenant table (filtered by `organization_id`). AI allowance of an organization for one calendar month (queries and tokens) with usage counters.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | not null | gen uuid | PK |
| `organization_id` | uuid | not null |  | FK to `organizations` (cascade on delete) |
| `period_key` | varchar(7) | not null |  | "2027-04" |
| `period_start` | date | not null |  |  |
| `period_end` | date | not null |  |  |
| `query_limit` | integer | nullable |  | null = unlimited (Enterprise) |
| `queries_used` | integer | not null | 0 |  |
| `token_limit` | integer | nullable |  |  |
| `tokens_used` | integer | not null | 0 |  |
| `insight_runs_used` | integer | not null | 0 |  |
| `cost_accrued` | decimal(12,4) | not null | 0 |  |
| `currency` | char(3) | not null | "USD" |  |
| `limit_reached_at` | timestamptz | nullable |  |  |
| `created_at` | timestamptz | not null | now() |  |
| `updated_at` | timestamptz | not null | auto on update |  |

**Indexes and constraints:** Unique (organization_id, period_key); Index (organization_id, period_start).

**Relations:** belongs to `organizations`.

### Enums in 13-certificates-analytics-ai.prisma

| Enum | Values | Meaning |
|---|---|---|
| `CertificateType` | BONAFIDE, TRANSFER, CHARACTER, COURSE_COMPLETION, MERIT, FEE, CUSTOM |  |
| `CertificateRequestStatus` | PENDING, APPROVED, REJECTED, ISSUED, CANCELLED |  |
| `ReportCategory` | STUDENTS, ADMISSIONS, ATTENDANCE, FEES, EXAMS, STAFF, PAYROLL, COMMUNICATION, OPERATIONS, CUSTOM |  |
| `ScheduleFrequency` | DAILY, WEEKLY, MONTHLY, QUARTERLY |  |
| `AiInsightType` | ATTENDANCE_DROP, DROPOUT_RISK, FEE_DEFAULT_RISK, ACADEMIC_DECLINE, ADMISSION_TREND, COLLECTION_FORECAST, STAFF_WORKLOAD, ANOMALY, OTHER |  |
| `AiInsightSeverity` | INFO, LOW, MEDIUM, HIGH, CRITICAL |  |
| `AiInsightStatus` | NEW, SEEN, ACTED, DISMISSED |  |
| `RiskLevel` | LOW, MEDIUM, HIGH, CRITICAL |  |
| `AiQueryStatus` | SUCCESS, FAILED, BLOCKED, QUOTA_EXCEEDED |  |
