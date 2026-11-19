# CampusTrace: Complete Project & Software Testing Documentation

## 1. Project Overview
**CampusTrace** is a centralized, web-based Lost and Found Management System engineered for educational campuses. It replaces ad-hoc notice boards and manual logbooks with a structured, role-governed digital platform where **Students**, **Faculty Members**, and **Campus Administrators** can report lost or found belongings, search and match items, submit verified ownership claims, and track recovery through final handover.

---

## 2. System Architecture
CampusTrace follows a layered, client-driven Single-Page Application (SPA) architecture backed by Google Cloud / Firebase managed services:

```text
+-------------------------------------------------------------------------+
|                    React 19 + TypeScript + Tailwind CSS                 |
|  Pages (15 Views) · Contexts (AuthContext, ToastContext) · ErrorBoundary |
+------------------------------------+------------------------------------+
                                     |
+------------------------------------v------------------------------------+
|                      Domain Services & Pure Logic                       |
|  itemsService.ts · claimsService.ts · usersService.ts                   |
|  validation.ts (Synchronized Blueprint Guards) · matching.ts            |
+------------------------------------+------------------------------------+
                                     |
+------------------------------------v------------------------------------+
|                         Firebase Backend Platform                       |
|  - Firebase Auth (Google Sign-In + Email/Password w/ Verification)      |
|  - Cloud Firestore (Enterprise DB, Real-time onSnapshot, Atomic Batch)  |
|  - Firebase Storage (Item & Supporting Proof Photographs)               |
|  - Hardened Security Rules (firestore.rules, RBAC + PII Isolation)      |
+-------------------------------------------------------------------------+
```

---

## 3. Module Descriptions

### Module 1 — Lost and Found Item Management
- **Purpose:** Enables authenticated campus users to report missing (`Lost`) or recovered (`Found`) belongings and manage their lifecycle.
- **Capabilities:** Form validation synchronized with `firebase-blueprint.json`, image upload validation (`JPEG`/`PNG`/`WebP`, max 5 MB) to Firebase Storage with automatic compressed fallback, atomic creation of public item catalog document + PII-isolated contact subcollection, editing, status updates (`Lost`, `Found`, `Claimed`, `Returned`), and confirmation-guarded deletion.

### Module 2 — Item Search and Matching
- **Purpose:** Helps users quickly locate belongings across the campus database.
- **Capabilities:** Real-time keyword and item-name search, multi-filter controls (type, category, location, status, date range), zero-result empty states with filter reset, and a ranked **Smart Matching Engine** (`getSuggestedMatches`) pairing Lost and Found items by category, campus location, and overlapping description tokens.

### Module 3 — Claim Verification and Administration
- **Purpose:** Ensures found items are returned strictly to verified owners with a complete audit trail.
- **Capabilities:** Ownership claim submission (`ownershipProof`, `identifyingFeatures`, optional receipt/photo), Faculty pre-verification queue (`Pending` → `Faculty Verified`), Admin approval/rejection decisions with atomic item status updates (`Claimed` / `Returned` / `Found`), append-only claim history logs, real-time notifications, and full Admin oversight (`Admin Dashboard`, `Manage Items`, `Manage Claims`, `Manage Users`).

---

## 4. Database Structure (Cloud Firestore)

| Collection Path | Purpose | Key Fields | Access Control |
| :--- | :--- | :--- | :--- |
| `/users/{userId}` | Campus user accounts & roles | `uid`, `fullName`, `email`, `role`, `department`, `campusId`, `phone`, `status`, `createdAt`, `updatedAt` | Read: Owner or Admin. Create: Verified owner (`student`/`faculty` only). Update: Owner (profile fields) or Admin. |
| `/admins/{userId}` | Trusted admin role markers | `uid`, `email`, `grantedBy`, `createdAt` | Read: Owner or Admin. Write: Admin or Bootstrap Admin. |
| `/items/{itemId}` | Campus Lost & Found catalog | `id`, `title`, `type`, `category`, `description`, `location`, `dateReported`, `status`, `visibility`, `imageUrl`, `contactSummary`, `reporterId`, `reporterName`, `reporterRole`, `keywords`, `createdAt`, `updatedAt` | Read: Campus board (`visibility == 'campus'`). Create: Verified user (`reporterId == auth.uid`). Update/Delete: Reporter (until `Returned`) or Admin. |
| `/items/{itemId}/private/contact` | PII-isolated direct contact details | `itemId`, `reporterId`, `contactDetails`, `pickupLocation`, `updatedAt` | Read: Verified signed-in campus users only. Write: Atomic batch with item by reporter or Admin. |
| `/claims/{claimId}` | Ownership claims & audit history | `id`, `itemId`, `itemTitle`, `itemCategory`, `itemReporterId`, `claimantId`, `claimantName`, `claimantEmail`, `claimantRole`, `ownershipProof`, `identifyingFeatures`, `supportingImageUrl`, `status`, `reviewerId`, `reviewerName`, `reviewNotes`, `history[]`, `createdAt`, `updatedAt` | Read: Claimant, Item Reporter, Faculty, or Admin. Create: Verified claimant on `Found` items. Update: Faculty (`Faculty Verified`) or Admin (`Approved`/`Rejected`). |
| `/notifications/{notificationId}` | User-scoped alerts | `id`, `userId`, `title`, `message`, `type`, `relatedItemId`, `relatedClaimId`, `read`, `createdAt` | Read/Update(`read`)/Delete: Recipient `userId` or Admin. |

---

## 5. Test Case Documentation

### Module 1 — Item Management (`src/tests/module1_items.test.tsx`)

| Test Case ID | Module Name | Test Scenario | Test Input | Expected Output | Actual Output | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| TC-M1-01 | Item Management | Successfully reporting a lost item | Title: `"Blue Sony Headphones"`, Type: `lost`, Category: `Electronics`, Location: `Central Library`, Valid description & contact | `createItemReport` invoked with `type: 'lost'` and navigates to `item-details` | `createItemReport` called once with exact payload; navigated to `item-details` | **PASS** |
| TC-M1-02 | Item Management | Successfully reporting a found item | Title: `"University Keycard Lanyard"`, Type: `found`, Category: `ID Cards & Keys`, Location: `Student Union Commons` | `createItemReport` invoked with `type: 'found'` | `createItemReport` called once with `type: 'found'` payload | **PASS** |
| TC-M1-03 | Item Management | Validation when required fields are empty | Empty `title` and empty `description` submitted | Submission blocked; inline field validation errors displayed | Errors rendered for item name & description; `createItemReport` not called | **PASS** |
| TC-M1-04 | Item Management | Image upload validation | PDF file (`application/pdf`), 6 MB JPEG, valid 400 KB PNG | PDF & >5 MB rejected with error; valid PNG accepted | Invalid MIME & oversized files rejected; valid PNG returned `{ valid: true }` | **PASS** |
| TC-M1-05 | Item Management | Editing an item | Edit `"Dell XPS 13 Laptop"` → `"Dell XPS 13 Laptop (Silver)"` in My Reports modal | `updateItemReport` called with updated title | `updateItemReport` invoked with `'item_lost_1'` and updated title | **PASS** |
| TC-M1-06 | Item Management | Deleting an item | Click Delete on item and confirm in dialog | `deleteItemReport` called with item ID | Confirmation dialog opened; `deleteItemReport('item_lost_1')` called | **PASS** |
| TC-M1-07 | Item Management | Correct status updates | Change status dropdown from `Lost` to `Returned` | `updateItemStatus` called with `('item_lost_1', 'Returned')` | `updateItemStatus` called with `'item_lost_1'` and `'Returned'` | **PASS** |

### Module 2 — Search and Matching (`src/tests/module2_search.test.tsx`)

| Test Case ID | Module Name | Test Scenario | Test Input | Expected Output | Actual Output | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| TC-M2-01 | Search & Matching | Searching using an item name | Query: `"Calculus"` | `"Calculus III Textbook"` shown; non-matching items hidden | Only `"Calculus III Textbook"` rendered | **PASS** |
| TC-M2-02 | Search & Matching | Searching using keywords | Query: `"robotics"` | Items containing `"robotics"` in description/keywords shown | `"Apple MacBook Pro 14"` & `"Silver Aluminum Laptop"` rendered | **PASS** |
| TC-M2-03 | Search & Matching | Filtering by category | Category select: `"Books & Notes"` | Only `"Books & Notes"` items displayed | `"Calculus III Textbook"` shown; Electronics hidden | **PASS** |
| TC-M2-04 | Search & Matching | Filtering by location | Location select: `"Central Library"` | Only Central Library items displayed | `"Calculus III Textbook"` shown; Engineering items hidden | **PASS** |
| TC-M2-05 | Search & Matching | Displaying matching items & suggestions | Target lost item (`item_1`) against catalog | `getSuggestedMatches` ranks found item `item_2` first with category reason | `item_2` returned first with `"Same category (Electronics)"` reason | **PASS** |
| TC-M2-06 | Search & Matching | Handling unavailable search results | Query: `"NonExistentItemXYZ"` | Empty state `"No matching items found"` & Clear All Filters button rendered | Empty state message & Clear All Filters button displayed | **PASS** |
| TC-M2-07 | Search & Matching | Handling empty search input | Clear search input after filtering | All 3 catalog items restored | All 3 catalog items rendered in DOM | **PASS** |

### Module 3 — Claim Verification and Administration (`src/tests/module3_claims_admin.test.tsx`)

| Test Case ID | Module Name | Test Scenario | Test Input | Expected Output | Actual Output | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| TC-M3-01 | Claims & Admin | Submitting a claim | Valid `ownershipProof` (>= 15 chars) & `identifyingFeatures` | `submitOwnershipClaim` called and navigates to `my-claims` | `submitOwnershipClaim` called once; navigated to `my-claims` | **PASS** |
| TC-M3-02 | Claims & Admin | Rejecting incomplete claim information | Short proof `"Mine"` (< 15 chars) | Validation error rendered; submission blocked | Validation error shown; `submitOwnershipClaim` not called | **PASS** |
| TC-M3-03 | Claims & Admin | Admin approval of a claim | Admin clicks Approve with verification note | `adminResolveClaim` called with `'Approved'` & notes | `adminResolveClaim` invoked with `'Approved'` and audit note | **PASS** |
| TC-M3-04 | Claims & Admin | Admin rejection of a claim | Admin clicks Reject with rejection reason | `adminResolveClaim` called with `'Rejected'` & reason | `adminResolveClaim` invoked with `'Rejected'` and rejection reason | **PASS** |
| TC-M3-05 | Claims & Admin | Updating the item status | Admin sets status dropdown to `'Returned'` | `updateItemStatus` called with `('found_1', 'Returned')` | `updateItemStatus` called with `'found_1'` and `'Returned'` | **PASS** |
| TC-M3-06 | Claims & Admin | Preventing unauthorized admin access | Student renders AdminDashboard, ManageClaims, ManageUsers | `"Administrator Access Required"` shown; admin actions hidden | All 3 admin screens blocked with access message; Approve button absent | **PASS** |
| TC-M3-07 | Claims & Admin | Updating claim history | Approved claim with 2-entry `history[]` rendered on MyClaims | Both submission & admin approval entries rendered in timeline | Both history log entries displayed cleanly | **PASS** |

### Security Rules & Schema Synchronization (`src/tests/firestore.rules.test.ts`)

| Test Case ID | Scope | Test Scenario | Expected Output | Actual Output | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| TC-SEC-01 | Firestore Rules | Rules version 2 & default-deny safety net | Present in `firestore.rules` | Verified | **PASS** |
| TC-SEC-02 | Firestore Rules | Anti-privilege-escalation on `/users` | `role in ['student', 'faculty']` & immutable role on user update | Verified | **PASS** |
| TC-SEC-03 | Firestore Rules | Verified email & schema blueprint calls | `email_verified == true` and `isValid*()` helpers enforced | Verified | **PASS** |
| TC-SEC-04 | Firestore Rules | ID poisoning regex, server timestamps, terminal state lock | Regex, `request.time`, and `existing().status != 'Returned'` enforced | Verified | **PASS** |
| TC-SEC-05 | Synchronized Validation | Client validation guards match rules constraints | Invalid IDs, short descriptions, incomplete claims, SVG files rejected | Verified | **PASS** |

---

## 6. Five-Tier Software Testing & Quality Assurance Execution Report
- **Test Runner:** Vitest v5.1.1 + React Testing Library + Playwright E2E (`e2e/functional.spec.ts`)
- **Report Generator Command:** `npm run test:report`
- **Admin Testing & QA Dashboard:** Available under `/#/testing-qa` (Admin-only) displaying real executed results from `/public/test-reports/latest-report.json`, graphical coverage bars, status/type filters, and CSV / PDF exports.
- **Total Suites Executed:** 5 (`Unit`, `Integration`, `Validation`, `Functional`, `System`) + Firestore Security Rules Audit
- **Total QA Cases:** 51 (Unit: 9, Integration: 8, Validation: 12, Functional: 13, System: 9) — **51/51 Passed (100%)**
- **Separate Test Case Documentation Files:**
  - `docs/test-cases/01_unit_testing.md`
  - `docs/test-cases/02_integration_testing.md`
  - `docs/test-cases/03_validation_testing.md`
  - `docs/test-cases/04_functional_testing.md`
  - `docs/test-cases/05_system_testing.md`

---

## 7. Deployment Instructions
1. **Verify Firebase Configuration:** Ensure `firebase-applet-config.json` points to your provisioned Firebase project (`gen-lang-client-0864856435`) and Enterprise Firestore database (`ai-studio-0a01e6c6-0723-4547-8f1f-273e1162ec37`).
2. **Deploy Security Rules:** Run `npm run lint:rules` to verify zero ESLint security warnings, then deploy `firestore.rules` via Firebase CLI (`firebase deploy --only firestore:rules`) or the AI Studio `DeployRules` action.
3. **Optional Firebase Auth & Storage Console Setup:**
   - Enable **Email/Password** under Firebase Console → *Authentication → Sign-in method* if password login is desired alongside Google Sign-In.
   - Click **Get Started** under Firebase Console → *Storage* to enable cloud image bucket storage.
4. **Build Production Bundle:**
   ```bash
   npm run lint
   npm run build
   ```
5. **Deploy to Google Cloud Run / Firebase Hosting:**
   - **AI Studio / Cloud Run:** Serve the compiled Vite bundle on port `3000` (or `PORT` env var) via Cloud Run (`gcloud run deploy`).
   - **Firebase Hosting:** Run `firebase init hosting` (pointing `public` to `dist` with SPA rewrite enabled) and `firebase deploy --only hosting`.

---

## 8. Future Enhancement Suggestions
1. **QR Code Luggage & Asset Tags:** Generate printable student asset QR tags linking directly to secure CampusTrace contact relay pages.
2. **Automated Email & Push Notifications:** Trigger Firebase Cloud Functions on new matches or claim approvals to send instant university email alerts.
3. **Scheduled Retention Archival:** Automatically archive unclaimed found items after 90 days into campus surplus inventory logs.
4. **Gemini Multimodal Auto-Tagging:** Optional server-side image labeling to pre-fill item category, brand, and color from uploaded photographs.
