# CampusTrace — System Testing Documentation

- **Test Runner:** Vitest v5 + React Testing Library
- **Command Executed:** `npm run test:report`
- **Execution Timestamp:** 2026-11-19T17:29:45.382Z
- **Total Test Cases:** 9
- **Passed:** 9
- **Failed:** 0
- **Pending:** 0
- **Pass Percentage:** 100%

## Test Case Matrix

| Test Case ID | Testing Type | Module | Test Scenario | Test Input | Expected Output | Actual Output | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| TC-SYS-01 | System | Auth Lifecycle | Executes complete user registration-to-login-to-session system workflow | Full Create Account -> Dashboard redirect -> Email Sign In | Account persisted and authenticated cleanly across flows | All assertions passed (917 ms) | **Passed** |
| TC-SYS-02 | System | Lost-to-Search Flow | Executes complete lost-item-reporting-to-search and smart matching workflow | Report Lost laptop -> Search "robotics" -> Smart Match scoring | Item appears in search and ranks matching Found laptop top | All assertions passed (135 ms) | **Passed** |
| TC-SYS-03 | System | Found-to-Claim Flow | Executes complete found-item-reporting-to-claim submission workflow | Faculty reports Found TI-84 -> Student submits ownership claim | Both item and claim batches commit atomically | All assertions passed (2 ms) | **Passed** |
| TC-SYS-04 | System | Verification-to-Return | Executes complete faculty verification and admin approval-to-returned workflow | Faculty pre-verifies -> Admin approves & marks Returned | Claim status reaches Approved and item transitions to Returned | All assertions passed (3 ms) | **Passed** |
| TC-SYS-05 | System | RBAC & Security Rules | Enforces role-based access control and Firestore security rule invariants | Audit firestore.rules invariants and default-deny rules | Default deny, non-escalation, and admin guards verified | All assertions passed (1 ms) | **Passed** |
| TC-SYS-06 | System | Database Connectivity | Verifies database connectivity check for online and offline states | testConnection() with reachable Firestore vs offline error | Returns true when online and false when client is offline | All assertions passed (1 ms) | **Passed** |
| TC-SYS-07 | System | Route Protection | Enforces application route protection for unauthenticated hash navigation | Navigate unauthenticated to #/testing-qa | Automatically redirects to Sign in to CampusTrace | All assertions passed (24 ms) | **Passed** |
| TC-SYS-08 | System | Error Handling | Captures runtime failures via ErrorBoundary and structured Firestore error logger | Firestore PERMISSION_DENIED + thrown component Error | Structured JSON error thrown; ErrorBoundary shows recovery UI | All assertions passed (15 ms) | **Passed** |
| TC-SYS-09 | System | Testing & QA Dashboard | Verifies Admin Testing & QA Dashboard renders execution report, filters, and exports CSV | Admin loads QA report, filters Unit tests, exports CSV | Displays real metrics, filters rows, and generates CSV Blob | All assertions passed (139 ms) | **Passed** |
