# Project Analysis Tracker

## Scope and rules

- Workspace: `E:\web_project`
- Analysis mode: read-only
- Allowed workspace change: this tracker only
- Started: 2026-09-07 (Asia/Dhaka)
- Completed: 2026-09-07 (Asia/Dhaka)
- Structure refreshed: 2026-09-07 (Asia/Dhaka)
- Status: complete for all project-owned source, configuration, documentation, and media files

## Current organized structure

```text
E:\web_project
├── Backend
│   ├── Final-Project-Details-Backend 1.docx
│   ├── Tech_Trolley_API_Final_Testing_Report.docx
│   ├── tech-trolley-Folder_and_File_structure (1).txt
│   └── tech-trolley-backend
│           ├── src
│           ├── test
│           ├── dist
│           ├── node_modules
│           └── project configuration files
├── Frontend Design
│   ├── Tech Trolley UI Design.svg
│   ├── 04-manager-dashboard.png
│   └── 05-salesperson-dashboard.png
├── Lacture_Code
│   ├── react Tutorial
│   │   ├── my-first-app
│   │   └── second-app
│   └── NextJs Tutorial
│       ├── our-first-app
│       └── our-second-app
├── Slide
│   ├── 1.0 Introduction Frontend.pptx … 9.0 Authentication.pptx
│   └── react_lab_task.pdf
├── Lacture Slide
│   └── currently empty
└── PROJECT_ANALYSIS_TRACKER.md
```

### Old-to-current path map

| Previous location | Current location |
| --- | --- |
| `Tech_Trolley_Final\Tech_Trolley_Final` | `Backend\Tech_Trolley_Final\Tech_Trolley_Final` |
| Root backend DOCX/TXT files | `Backend` |
| Root `Tech Trolley UI Design.svg` | `Frontend Design\Tech Trolley UI Design.svg` |
| `react Tutorial` | `Lacture_Code\react Tutorial` |
| `NextJs Tutorial` | `Lacture_Code\NextJs Tutorial` |
| `Slide` | `Slide` (unchanged) |

- This refresh records a folder-only reorganization. The earlier content, architecture, business-logic, and file-level analysis remains authoritative.
- `Frontend Design` now also contains standalone manager and salesperson dashboard PNG references.
- Preserve the on-disk spellings `Lacture_Code` and `Lacture Slide` when resolving paths.

## Progress summary

| Area | Status | Notes |
| --- | --- | --- |
| Complete workspace inventory | Complete | Current layout: 38,439 files and 4,026 directories; 217 project-owned files excluding this tracker and dependency/build trees |
| Repository instructions | Complete | No `AGENTS.md` file found in the workspace |
| Primary NestJS backend | Complete | Now located at `Backend\Tech_Trolley_Final\Tech_Trolley_Final`; prior source analysis unchanged |
| React tutorial applications | Complete | Both Vite applications now under `Lacture_Code\react Tutorial` |
| Next.js tutorial applications | Complete | Both App Router applications now under `Lacture_Code\NextJs Tutorial` |
| Specifications and reports | Complete | Both DOCX files and the text structure plan now under `Backend` |
| Design artifact | Complete | SVG and dashboard PNG references now under `Frontend Design` |
| Course/reference slides | Complete | Text and structure extracted from all 133 PPTX slides; four-page PDF extracted and visually inspected |
| Cross-module architecture and flows | Complete | Runtime, API, database, auth, inventory, purchasing, sales, payment, expense, and reporting flows mapped below |

## Reviewed folders and files

### Workspace root and organized artifact folders

- [x] Root directory listing reviewed
- [x] Repository-level instruction-file search completed
- [x] `Backend\tech-trolley-Folder_and_File_structure (1).txt` — planned team ownership and proposed module tree
- [x] `Backend\Final-Project-Details-Backend 1.docx` — 771-paragraph requirements/team plan
- [x] `Backend\Tech_Trolley_API_Final_Testing_Report.docx` — 1,078 paragraphs, 141 tables, 65-endpoint/167-check report
- [x] `Frontend Design\Tech Trolley UI Design.svg` — 2,017 × 18,784 Figma-style export containing login, registration, role dashboards, and all major management screens
- [x] `Frontend Design\04-manager-dashboard.png` and `Frontend Design\05-salesperson-dashboard.png` — standalone role-dashboard visual references
- [x] `.DS_Store` files under the relocated React and Next.js parent folders — Finder metadata only, no application logic
- [x] `Lacture Slide` — intentionally recorded as an empty top-level folder in the current snapshot

### Primary application (`Backend\Tech_Trolley_Final\Tech_Trolley_Final`)

- [x] Root/config: `.env` (variable names reviewed; values intentionally not copied), `.prettierrc`, `eslint.config.mjs`, `nest-cli.json`, `package.json`, `package-lock.json`, `README.md`, `tsconfig.json`, `tsconfig.build.json`
- [x] Core: `src/main.ts`, `src/app.module.ts`, `src/app.controller.ts`, `src/app.service.ts`, `src/app.controller.spec.ts`
- [x] Auth: `auth.module.ts`, `auth.controller.ts`, `auth.service.ts`, `jwtGuard.ts`, `jwtStrategy.ts`, `roles.decorator.ts`, `roles/roles.guard.ts`, `user-role.enum.ts`, `dtos/login.dto.ts`
- [x] Users: `users.module.ts`, `users.controller.ts`, `users.service.ts`, `entities/users.entity.ts`, all three DTOs
- [x] Shop: `shop.module.ts`, `shop.controller.ts`, `shop.service.ts`, `entities/shop.entity.ts`, `dtos/update-shop.dto.ts`
- [x] Brands: module, controller, service, entity, create/update DTOs
- [x] Categories: module, controller, service, entity, create/update DTOs
- [x] Products: module, controller, service, product and variant entities, all four DTOs
- [x] Inventory: module, controller, service, inventory-unit entity
- [x] Suppliers: module, controller, service, entity, create/update DTOs
- [x] Purchases: module, controller, service, purchase/item/payment entities, create/payment DTOs
- [x] Customers: module, controller, service, entity, create/update DTOs
- [x] Sales: module, controller, service, sale/item/payment entities, create/payment DTOs
- [x] Accounts: module, controller, service, entity, create/update DTOs
- [x] Expenses: module, controller, service, entity, create/update DTOs
- [x] Reports: module, controller, service
- [x] Tests: `test/app.e2e-spec.ts`, `test/jest-e2e.json`
- [x] Generated output: 93 JavaScript files, 93 declaration files, and 93 source maps in `dist`; every non-test source has a corresponding current artifact and no orphan compiled modules exist
- [x] Dependencies: lockfile v3 contains 876 package entries; direct runtime/dev dependencies and resolved versions reviewed; installed `node_modules` classified as third-party source

### Tutorial/reference applications

- [x] `Lacture_Code\react Tutorial\my-first-app`: `.gitignore`, ESLint/Vite/TypeScript configs, HTML entry, package files, README, `main.tsx`, `App.tsx`, both CSS files, four components, and all seven image/SVG assets
- [x] `Lacture_Code\react Tutorial\second-app`: `.gitignore`, ESLint/Vite/TypeScript configs, HTML entry, package files, README, `main.tsx`, `App.tsx`, `userDetails.tsx`, both CSS files, `customComponents.tsx`, and all seven image/SVG assets
- [x] `Lacture_Code\NextJs Tutorial\our-first-app`: `.gitignore`, ESLint/Next/PostCSS/TypeScript configs, package files, README, root layout/styles, global and route-level error/not-found pages, home/contact/personal/registration/users/dynamic-user pages, `weclome.tsx`, five public SVGs, and favicon
- [x] `Lacture_Code\NextJs Tutorial\our-second-app`: `.gitignore`, ESLint/Next/PostCSS/TypeScript configs, package files, README, root layout/styles, home/login/registration/admin/student/todos/dynamic-todo pages, five public SVGs, Apple WebP, and favicon

### Course material

- [x] `1.0 Introduction Frontend.pptx` — 12 slides
- [x] `2.0 Introduction ReactJS.pptx` — 8 slides
- [x] `3.0 ReactJS Core Concepts.pptx` — 18 slides
- [x] `4.0 Introduction to NextJS.pptx` — 20 slides
- [x] `5.0 NextJS Installation.pptx` — 15 slides
- [x] `6.0 Form and Event Handling.pptx` — 12 slides
- [x] `7.0 Axios.pptx` — 20 slides
- [x] `8.0 Tailwind CSS.pptx` — 12 slides
- [x] `9.0 Authentication.pptx` — 16 slides
- [x] `react_lab_task.pdf` — all four pages extracted and visually inspected; progressive React labs cover components/props/styling, state/effects, then context/forms/local persistence

## Architecture and application-flow findings

- The deliverable application is a NestJS 11 modular monolith. `AppModule` composes 14 domain modules plus the root app endpoint; TypeORM supplies repositories and a shared PostgreSQL connection.
- Startup order: `main.ts` creates `AppModule`, applies CORS, installs one global `ValidationPipe` (`whitelist` and `transform`), publishes Swagger at `/api`, then listens on the environment port or 3000.
- `ConfigModule` is global. TypeORM loads PostgreSQL connection settings from the environment, auto-loads entities, and uses `synchronize: true`; there are no checked-in migrations.
- Controllers define HTTP transport, UUID parsing, Swagger metadata, JWT guards, and role metadata. Services own business logic and persistence. DTOs own request validation. Entities own table/relationship mappings.
- Inter-module collaboration follows the supplied requirements: `PurchasesService` and `SalesService` call exported `InventoryService`; purchase payments, sale payments, and expenses call exported `AccountsService` rather than changing inventory/account tables directly.
- The React and Next.js directories are classroom/tutorial projects. They neither import the backend nor share request/response types with it. No production Tech Trolley frontend source is present.
- The SVG is the intended product UI reference, not executable frontend code. It shows login/registration, owner/manager/salesperson dashboards, sales, purchases, inventory, products, brands, categories, customers, suppliers, accounts, expenses, reports, and shop settings.

## Business logic findings

- Product catalog: brands and categories are unique by name; products reference both and declare `SERIALIZED` or `QUANTITY` tracking; variants carry color, RAM, storage, purchase price, and selling price.
- Purchase creation: the service computes `sum(quantity × unitPrice)`, saves a `CONFIRMED` purchase and its items, and receives stock in one QueryRunner transaction.
- Stock receipt: an item with IMEIs creates one inventory row per IMEI with quantity 1; an item without IMEIs creates one quantity row.
- Sale creation: the authenticated user's ID becomes `salespersonId`; the service computes subtotal and `subtotal - discount + vat`, saves a `COMPLETED` sale/items, and issues inventory in the same transaction.
- Stock issue: serialized stock is found by IMEI and marked `SOLD`; quantity stock consumes available rows and splits the final row when only part is needed. Failure rolls back the complete sale transaction.
- Purchase payment: saves the payment and decreases the selected active account in one transaction.
- Sale payment: saves the payment and increases the selected active account in one transaction.
- Expense create/update/delete: respectively debit, re-balance, or refund the selected account atomically with the expense mutation.
- Customer due = non-returned sale totals minus all related sale payments. Supplier due = confirmed purchase totals minus all related purchase payments.
- Reports expose five aggregate dashboard totals and sales grouped by date. The current `ORDER BY date ASC LIMIT 30` returns the earliest 30 grouped dates, although the UI/report wording describes the last/up-to-30 dates.
- Shop settings are a singleton-by-convention: reads return the first `Shop` row; no create/seed implementation is present, so a row must be inserted separately before GET/PUT works.

## Important relationships

- `User 1 → many Sale` through `salespersonId`.
- `Brand 1 → many Product`; `Category 1 → many Product`.
- `Product 1 → many ProductVariant`.
- `ProductVariant 1 → many PurchaseItem`, `SaleItem`, and `InventoryUnit`.
- `Supplier 1 → many Purchase`; `Purchase 1 → many PurchaseItem`, `PurchasePayment`, and `InventoryUnit`.
- `Customer 1 → many Sale`; `Sale 1 → many SaleItem`, `SalePayment`, and `InventoryUnit`.
- `Account 1 → many Expense`, `PurchasePayment`, and `SalePayment`.
- Scalar UUID foreign-key columns are stored alongside TypeORM relation decorators. Most write services validate UUID shape but do not explicitly load/check referenced brand, category, supplier, customer, or variant before save; resulting enforcement depends on the generated database constraints.
- Module dependency direction: Auth → Users; Purchases → Inventory + Accounts; Sales → Inventory + Accounts; Expenses → Accounts; all modules → shared TypeORM connection; Reports and due calculations use raw SQL through `DataSource`.

## Authentication and authorization

- Public auth routes: register, login, and stateless logout. Registration accepts the caller-supplied role, including `OWNER`.
- Login loads by email, rejects missing/inactive users, verifies bcrypt, signs `{email, sub, role}`, and returns `{token, user}` without the password.
- Bearer authentication uses Passport JWT. Token expiry is enforced; strategy validation reloads the user by `sub`, rejects deleted/inactive users, strips the password, and assigns the entity to `request.user`.
- `Roles` attaches allowed `UserRole` metadata; `RolesGuard` compares it with `request.user.role` after JWT authentication.
- Owner only: create/update/status/delete users; update/delete accounts; update shop.
- Owner or manager: catalog writes, supplier writes, purchases and purchase payments, account create/read, expenses, reports, and sale payments.
- All three roles: create/read sales. Any active JWT: customer CRUD/dues and inventory reads.
- Public reads: brands, categories, products/variants, suppliers/dues, and shop settings.
- Logout does not revoke tokens; the client must discard its token. There is no refresh-token flow or server-side denylist.

## Database and data flow

- PostgreSQL + TypeORM entities use UUID primary keys, enum columns for roles/status/tracking, `decimal` for money, `date` for business dates, `jsonb` for item IMEI arrays, and create timestamps on users, transactions, expenses, purchases, and sales.
- The core transactional paths use one `QueryRunner` and pass its `EntityManager` into inventory/account services so related rows commit or roll back together.
- Account mutation is a read/modify/save operation inside the caller transaction. No explicit row lock is requested, so concurrent balance changes are not serialized at the application level.
- Raw SQL is limited to customer dues, supplier dues, and reports. Parameters are used for customer/supplier IDs.
- PostgreSQL decimal values are normalized with `Number(...)` in arithmetic/aggregate code where needed.
- There are no repositories beyond TypeORM's generic `Repository<T>` injection; there is no separate repository abstraction layer.
- There are no migrations, seeds, pagination helpers, cache, queues, event bus, file storage, or external-service integrations in the backend source.

## API surface summary

- 65 HTTP endpoints across App, Auth, Users, Brands, Categories, Products, Customers, Suppliers, Accounts, Expenses, Purchases, Sales, Inventory, Reports, and Shop.
- Standard CRUD services use `findOne` + `Object.assign` + `save`, raise `NotFoundException`, and add conflict checks only where a unique business key is intended.
- UUID route parameters use `ParseUUIDPipe`; the IMEI route intentionally accepts a normal string.
- The supplied final testing report states 167/167 checks passed after six documented fixes: supplier-dues enum query, password-hash response leak, malformed UUID handling, expense atomicity, empty sale/purchase items, and positive expense amount.
- Checked-in automated tests are minimal: one root unit test and one root e2e test. The comprehensive `apitest.mjs` named in the report is not present in this workspace.

## Existing conventions and patterns

- Feature folders contain module, controller, service, `dtos`, and `entities` subfolders.
- Services are exported only when another module consumes them.
- Class-validator DTOs and Swagger decorators describe request shapes; global whitelisting drops undeclared fields.
- Access checks are declarative controller decorators rather than service-layer policies.
- Transaction errors in purchase/sale/payment/expense paths are generally caught and rethrown as `BadRequestException` with the original message.
- Formatting uses single quotes and trailing commas; TypeScript is strict with NodeNext modules and decorators enabled.

## Requirements and implementation differences to remember

- The requirements describe roles endpoints, current-user decorator, profile management, shop timezone, common error format, seed data, stock movement/history, low-stock, stock restoration, returns, purchase/sale drafts and lifecycle endpoints, payment history endpoints, investments, account transactions, richer reports, and pagination. These are not implemented in the checked-in backend.
- The actual folder tree uses `accounts` rather than the planned `financial-accounts`, and has no `seeds` folder.
- Purchases are created immediately as `CONFIRMED`; sales immediately as `COMPLETED`. There are no update/cancel/return routes.
- The entity statuses are narrower than the planning document: purchases use DRAFT/CONFIRMED/CANCELLED and sales use COMPLETED/RETURNED.
- Inventory has no unique IMEI decorator and no explicit check that IMEI count matches quantity or that the product tracking type matches the request style.
- Sale/purchase DTOs require numeric quantity and unit price but do not require them to be positive; sale discount/VAT are numeric but not range constrained. Prices sent on transactions are not checked against variant reference prices.
- Due endpoints do not cap overpayment; account outflows do not prevent a negative balance.
- `checkAvailability` exists as an exported inventory service contract but sale creation relies directly on `issueStock`; `updateBalance` exists but transactional flows use `applyBalanceChange`.

## Tutorial application findings

- `my-first-app` is a static React component/props example with header, footer, a simple component, and two typed student cards.
- `second-app` demonstrates conditional rendering, arrays, state updates, effects, Tailwind, and an Axios call to JSONPlaceholder. Its `userDetails.tsx` declares `User` but types state as undefined lowercase `user`.
- `our-first-app` demonstrates Next.js App Router layouts, nested/dynamic routes, route-level not-found/error files, and an uncontrolled registration form. It is not connected to a backend.
- `our-second-app` demonstrates images, JSONPlaceholder todos, forms, and a separate login/post API exercise. Its login expects `userId`, `access_token`, lowercase `admin/student` roles, and `/posts/getAllPosts`; these do not match Tech Trolley's email login, `{token,user}` response, uppercase roles, or route set.
- Several tutorial files are intentionally/incompletely typed classroom exercises (for example hooks in a server component, unbound form handlers, array state typed as one object, and implicit event/error types). No fixes were made.

## Areas still to review

- None for the current repository snapshot's project-owned files.
- Revisit this tracker when files are added or changed.
- Third-party package implementation files under `node_modules` are intentionally treated as external dependencies rather than application source; their installed package set is fully represented by the lockfile and dependency inventory.

## Analysis notes

- The primary application is the NestJS backend. The React/Next.js folders and slides are course work/reference material; the UI SVG is the clearest frontend product specification.
- `Backend\Tech_Trolley_Final\Tech_Trolley_Final\node_modules` accounts for the large majority of the current 38,439 workspace files. Third-party contents remain represented through lockfile/package metadata and application imports.
- Both DOCX files were structurally and textually inspected, including all endpoint/report tables and embedded dashboard images. The packaged DOCX renderer could not render them because bundled LibreOffice is unavailable on this host; this does not block source/business-logic understanding.
- All nine PowerPoint decks were inspected slide-by-slide through their native text and shape structure (133 slides total). They are course instruction material, not runtime dependencies.
- The PDF was rendered with bundled Poppler and every page was visually inspected.
- The complete UI SVG was parsed (4,720 elements, seven embedded images) and rendered to a temporary PNG for full visual review. No derived media was added to the project.
- Package-lock files were parsed rather than reproduced in this tracker. The backend lockfile has 876 entries; the tutorial locks have 190, 241, 440, and 452 entries respectively.
- The backend `dist` directory is a current, one-to-one compiled mirror for all 93 non-test source modules; there are no missing or orphan compiled modules.
- Secret values from `.env` were not copied into the tracker. The application expects `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_NAME`, `DATABASE_USER`, `DATABASE_PASSWORD`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `PORT`, and `CORS_ORIGIN`.
- No repository-owned `AGENTS.md` instructions were found.

## Overall completion

- Current project-owned path inventory: 217 / 217 files accounted for, excluding this tracker and vendor/build trees
- Backend source review: 94 / 94 source files reviewed
- Backend tests: 2 / 2 reviewed
- Backend compiled modules: 93 / 93 mapped to source
- Tutorial apps: 4 / 4 reviewed
- Course decks: 9 / 9 and 133 / 133 slides reviewed
- PDF pages: 4 / 4 reviewed
- Requirements/report/tree artifacts under `Backend`: 3 / 3 reviewed
- Design artifacts under `Frontend Design`: 3 / 3 accounted for
- Overall analysis status: complete
