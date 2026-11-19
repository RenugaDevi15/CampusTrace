# CampusTrace — Functional Testing Documentation

- **Test Runner:** Vitest v5 + React Testing Library
- **Command Executed:** `npm run test:report`
- **Execution Timestamp:** 2026-11-19T17:29:45.382Z
- **Total Test Cases:** 13
- **Passed:** 13
- **Failed:** 0
- **Pending:** 0
- **Pass Percentage:** 100%

## Test Case Matrix

| Test Case ID | Testing Type | Module | Test Scenario | Test Input | Expected Output | Actual Output | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| TC-FUNC-01 | Functional | User Registration | Completes user registration flow for Student and Faculty roles | Faculty role selection + full registration details | Account created with faculty role and redirected to dashboard | All assertions passed (794 ms) | **Passed** |
| TC-FUNC-02 | Functional | Email/Password Login | Handles email/password Sign In and displays error on invalid credentials | Wrong password followed by valid password | Shows credential error first; signs in and navigates on retry | All assertions passed (316 ms) | **Passed** |
| TC-FUNC-03 | Functional | Google OAuth | Executes Continue with Google authentication and handles redirect fallback | Click "Continue with Google" | Invokes loginWithGoogle and navigates to dashboard | All assertions passed (25 ms) | **Passed** |
| TC-FUNC-04 | Functional | Session & Logout | Signs out authenticated user and redirects to home portal | Click "Sign Out" in top bar | Calls logout() and navigates to public home portal | All assertions passed (34 ms) | **Passed** |
| TC-FUNC-05 | Functional | Dashboard Navigation | Navigates across dashboard quick actions and workspace tabs | Click Report Lost, Manage reports, Track claims | Navigates to report-lost, my-reports, and my-claims | All assertions passed (81 ms) | **Passed** |
| TC-FUNC-06 | Functional | Report Lost Item | Completes lost item reporting workflow and redirects to item details | Fill lost form (Black JBL Earbuds) and submit | Publishes report and opens item-details page | All assertions passed (616 ms) | **Passed** |
| TC-FUNC-07 | Functional | Report Found Item | Completes found item reporting workflow with pickup holding desk | Fill found form (Silver Casio Watch) with pickup desk | Submits found item with pickupLocation="Athletics Front Desk" | All assertions passed (678 ms) | **Passed** |
| TC-FUNC-08 | Functional | Search & Filtering | Filters search catalog by type, category, location, and resets filters | Toggle "Found Items" then click "Reset filters" | Filters to Found items then restores full list | All assertions passed (76 ms) | **Passed** |
| TC-FUNC-09 | Functional | Item Details | Displays item details, verified custody contact, and claim action | View Found item while authenticated and click "Claim This Item" | Shows verified contact info and navigates to submit-claim | All assertions passed (45 ms) | **Passed** |
| TC-FUNC-10 | Functional | Claim Submission | Submits ownership claim from SubmitClaimPage and redirects to My Claims | Submit proof & identifying details for MacBook Charger | Saves claim and navigates to my-claims | All assertions passed (523 ms) | **Passed** |
| TC-FUNC-11 | Functional | Admin Claims | Allows Admin to approve & mark returned or reject claims with reason | Enter verification notes and click "Approve & Mark Returned" | Resolves claim as Approved with markItemReturned=true | All assertions passed (285 ms) | **Passed** |
| TC-FUNC-12 | Functional | Admin Users & Items | Allows Admin to manage user roles/status and update item statuses | Change user role to faculty; update item status to Returned | Calls adminUpdateUserRoleAndStatus and updateItemStatus | All assertions passed (63 ms) | **Passed** |
| TC-FUNC-13 | Functional | Responsive Navigation | Toggles responsive mobile navigation drawer and exposes workspace links | Open mobile navigation menu drawer | Displays mobile workspace items (My Reports, My Claims) | All assertions passed (29 ms) | **Passed** |
