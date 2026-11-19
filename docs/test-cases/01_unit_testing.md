# CampusTrace — Unit Testing Documentation

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
| TC-UNIT-01 | Unit | Authentication | Validates registration input fields and password confirmation | Valid Student payload & malformed empty/mismatch payload | Valid returns valid=true; invalid flags field errors | All assertions passed (4 ms) | **Passed** |
| TC-UNIT-02 | Unit | Authentication | Validates login input credentials independently | Email/password pairs (valid vs empty) | Valid accepted; missing fields rejected | All assertions passed (1 ms) | **Passed** |
| TC-UNIT-03 | Unit | Item Management | Submits lost item report with structured payload | Lost item: Graphing Calculator TI-84, Electronics, Central Library | createItemReport invoked with type="lost" payload | All assertions passed (886 ms) | **Passed** |
| TC-UNIT-04 | Unit | Item Management | Submits found item report with structured payload | Found item: Campus Hostel Keychain, ID Cards & Keys, Cafeteria | createItemReport invoked with type="found" payload | All assertions passed (643 ms) | **Passed** |
| TC-UNIT-05 | Unit | Search & Matching | Searches catalog items by title and keyword tokens | Keywords "MacBook" and "strang" against catalog items | Returns exact matching item record(s) | All assertions passed (2 ms) | **Passed** |
| TC-UNIT-06 | Unit | Search & Matching | Filters catalog items accurately by category and status | Category="Books & Notes" and Status="Lost" | Isolates records matching category and status filters | All assertions passed (1 ms) | **Passed** |
| TC-UNIT-07 | Unit | Claim Verification | Submits ownership claim unit payload from SubmitClaimPage | Ownership proof + identifying features for item_u2 | submitOwnershipClaim invoked with claimant and proof | All assertions passed (607 ms) | **Passed** |
| TC-UNIT-08 | Unit | Administration | Approves and rejects claims with review notes in ManageClaimsPage | Admin Approve & Reject actions with review notes | adminResolveClaim dispatched for Approved and Rejected | All assertions passed (223 ms) | **Passed** |
| TC-UNIT-09 | Unit | Item Management | Updates item status in MyReportsPage and ManageItemsPage | Status transitions to "Claimed" and "Returned" | updateItemStatus invoked with target ID and new status | All assertions passed (58 ms) | **Passed** |
