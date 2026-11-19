# CampusTrace — Web-Based Lost and Found Management System

CampusTrace is a centralized, database-connected Lost and Found management web application designed for educational campuses. It enables **Students**, **Faculty Members**, and **Campus Administrators** to report lost and found belongings, search and match items, submit ownership claims with verification evidence, and manage recovery workflows with role-based access control.

---

## 1. Key Features

### Module 1 — Lost and Found Item Management
- Firebase Authentication (Google Sign-In and Email/Password with email verification).
- Dedicated workflows for **Report Lost Item** and **Report Found Item**.
- Image upload via Firebase Storage with automatic file type (`JPEG`, `PNG`, `WebP`) and size (`<= 5 MB`) validation plus compressed fallback.
- Item status lifecycle tracking: `Lost`, `Found`, `Claimed`, `Returned`.
- User report management (`My Reports`) supporting edits, status updates, and confirmation-guarded deletion.

### Module 2 — Item Search and Matching
- Real-time search by item title, description, reporter, and extracted keywords.
- Multi-facet filtering by type (`All`, `Lost`, `Found`), category, campus location, date range, and status.
- Smart item matching engine ranking potential cross-type matches (`Lost` ↔ `Found`) based on category, location, and keyword overlap.
- Clear empty states and reset filters.

### Module 3 — Claim Verification and Administration
- Ownership claim submission with detailed proof, identifying features, and optional supporting evidence photo.
- Faculty pre-verification queue (`Pending` → `Faculty Verified`).
- Administrator approval/rejection workflow updating both claim status, claim audit history, item status (`Claimed` / `Returned` / `Found`), and dispatching in-app notifications.
- Admin Console (`Admin Dashboard`, `Manage Items`, `Manage Claims`, `Manage Users`) with live statistics and role/status management.

---

## 2. Technology Stack
- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide Icons
- **Backend & Database:** Firebase Authentication, Cloud Firestore (Enterprise), Firebase Storage
- **Security:** Hardened Firestore Security Rules (`firestore.rules`) validated with `@firebase/eslint-plugin-security-rules`
- **Testing:** Vitest, React Testing Library, Playwright E2E (`e2e/functional.spec.ts`), Admin Testing & QA Dashboard (`/testing-qa`)

---

## 3. Project Structure
```text
├── firebase-applet-config.json   # Provisioned Firebase client configuration
├── firebase-blueprint.json       # Entity schemas and Firestore collection map
├── firestore.rules               # Production Firestore security rules
├── playwright.config.ts          # Playwright E2E test runner configuration
├── vitest.config.ts              # Vitest + jsdom test runner configuration
├── e2e/                          # End-to-end Playwright functional specs
├── public/test-reports/          # Real Vitest execution JSON report (latest-report.json)
├── scripts/generate-test-report.mjs  # Generates QA report & 5 test case docs
├── docs/
│   ├── PROJECT_DOCUMENTATION.md  # Full academic project & QA overview
│   └── test-cases/               # Separate test case docs for all 5 testing types
└── src/
    ├── components/               # Layout, ItemCard, ItemImage, ConfirmDialog, ErrorBoundary
    ├── context/                  # AuthContext, ToastContext
    ├── lib/                      # Firebase SDK init, connection test, error handler
    ├── pages/                    # All 16 application pages (including Testing & QA)
    ├── services/                 # Firestore & Storage CRUD services
    ├── tests/                    # Unit, Integration, Validation, Functional, System & Rules suites
    ├── types/                    # TypeScript interfaces & campus constants
    └── utils/                    # Synchronized validation & matching algorithms
```

---

## 4. Local Setup & Commands

```bash
# Install dependencies
npm install

# Start development server on port 3000
npm run dev

# Type-check TypeScript
npm run lint

# Lint Firestore security rules
npm run lint:rules

# Execute all Vitest suites
npm run test:run

# Run all 5 QA testing suites & regenerate latest-report.json + docs/test-cases/*
npm run test:report

# Run Playwright E2E functional tests (requires Playwright browsers installed)
npm run test:e2e

# Build production bundle
npm run build
```

---

## 5. Firebase & Deployment Configuration
1. **Firestore Database & Authentication:** Provisioned via `firebase-applet-config.json` with Google Sign-In enabled by default.
2. **Email/Password Auth Setup:** In Firebase Console → **Authentication → Sign-in method**, enable **Email/Password** so Create Account & Email Sign In work seamlessly alongside Continue with Google.
3. **Authorized Domains:** Under Firebase Console → **Authentication → Settings → Authorized domains**, ensure your preview/Cloud Run/Firebase Hosting domains are listed for Google OAuth popups and redirects.
4. **Optional Firebase Storage:** In Firebase Console → **Storage**, click **Get Started** to enable cloud bucket uploads (until enabled, CampusTrace automatically compresses uploaded photos cleanly so reports always succeed).
5. **Deploy Security Rules:** Deployed via `DeployRules` or `firebase deploy --only firestore:rules`.
6. **Hosting:** Build with `npm run build` and deploy `dist/` to Firebase Hosting or serve via Google Cloud Run.
