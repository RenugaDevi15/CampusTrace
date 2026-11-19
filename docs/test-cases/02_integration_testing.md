# CampusTrace — Integration Testing Documentation

- **Test Runner:** Vitest v5 + React Testing Library
- **Command Executed:** `npm run test:report`
- **Execution Timestamp:** 2026-11-19T17:29:45.382Z
- **Total Test Cases:** 8
- **Passed:** 8
- **Failed:** 0
- **Pending:** 0
- **Pass Percentage:** 100%

## Test Case Matrix

| Test Case ID | Testing Type | Module | Test Scenario | Test Input | Expected Output | Actual Output | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| TC-INT-01 | Integration | Auth + Firestore | Integrates user registration with Firebase Auth and Firestore profile creation | Registration form -> Firebase Auth + Firestore users/{uid} | Auth user created, Firestore profile saved without password, redirected to dashboard | All assertions passed (816 ms) | **Passed** |
| TC-INT-02 | Integration | Auth + Navigation | Integrates Email & Google login with role-based dashboard navigation | Admin email/password sign-in | Firebase Auth verified, profile loaded, navigated to admin-dashboard | All assertions passed (229 ms) | **Passed** |
| TC-INT-03 | Integration | Items + Firestore | Integrates item report submission with atomic Firestore public & private contact batch | createItemReport with public + private contact details | Atomic writeBatch commits items/{id} and private/contact docs | All assertions passed (2 ms) | **Passed** |
| TC-INT-04 | Integration | Items + Storage | Integrates item image upload with Firebase Storage URL retrieval | JPEG file upload via uploadItemImage | Firebase Storage uploadBytes + getDownloadURL returns cloud URL | All assertions passed (2 ms) | **Passed** |
| TC-INT-05 | Integration | Search + Database | Integrates search filtering UI directly with catalog database records | Category filter "Electronics" on database item feed | SearchItemsPage renders matching DB records and excludes others | All assertions passed (52 ms) | **Passed** |
| TC-INT-06 | Integration | Claims + Notifications | Integrates claim submission with target item record and reporter notification | submitOwnershipClaim on found_item_9 | Atomic batch creates claim doc and reporter notification | All assertions passed (2 ms) | **Passed** |
| TC-INT-07 | Integration | Claims + Items + Alerts | Integrates admin claim approval with item status update and claimant notification | adminResolveClaim(Approved, markItemReturned=true) | Claim marked Approved, item marked Returned, claimant notified | All assertions passed (1 ms) | **Passed** |
| TC-INT-08 | Integration | RBAC + Dashboard | Integrates user role state with Layout navigation and dashboard access control | Authenticated Student accessing Dashboard + AdminDashboard | Student dashboard visible; Admin controls & QA link blocked | All assertions passed (82 ms) | **Passed** |
