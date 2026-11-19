# CampusTrace — Validation Testing Documentation

- **Test Runner:** Vitest v5 + React Testing Library
- **Command Executed:** `npm run test:report`
- **Execution Timestamp:** 2026-11-19T17:29:45.382Z
- **Total Test Cases:** 12
- **Passed:** 12
- **Failed:** 0
- **Pending:** 0
- **Pass Percentage:** 100%

## Test Case Matrix

| Test Case ID | Testing Type | Module | Test Scenario | Test Input | Expected Output | Actual Output | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| TC-VAL-01 | Validation | Auth Forms | Blocks empty registration and login form submissions with field errors | Blank Register and Login form submissions | Inline validation errors displayed; Auth requests blocked | All assertions passed (247 ms) | **Passed** |
| TC-VAL-02 | Validation | Auth Forms | Rejects invalid email formats across registration and login | Email = "invalid-email-format" | Email format error shown; submission prevented | All assertions passed (222 ms) | **Passed** |
| TC-VAL-03 | Validation | Auth Forms | Rejects weak passwords lacking length or alphanumeric mix | Passwords "ab1" (<6 chars) and "onlyletters" (no digits) | Password strength error returned | All assertions passed (1 ms) | **Passed** |
| TC-VAL-04 | Validation | Registration | Rejects mismatched password and confirm password entries | Password="Campus2026", Confirm="Campus9999" | Displays "Passwords do not match." | All assertions passed (535 ms) | **Passed** |
| TC-VAL-05 | Validation | Registration | Displays clear error when registering with an already registered email | Email="existing@university.edu" (already registered) | Displays duplicate email alert without creating account | All assertions passed (490 ms) | **Passed** |
| TC-VAL-06 | Validation | Item Reporting | Rejects missing item name and short description on item reporting | Title="A", Description="short" | Shows title & description length validation errors | All assertions passed (96 ms) | **Passed** |
| TC-VAL-07 | Validation | Item Reporting | Rejects invalid calendar dates during item validation | Dates "19-11-2026" and "2026-02-30" | Rejects invalid date format and impossible calendar date | All assertions passed (1 ms) | **Passed** |
| TC-VAL-08 | Validation | Item Reporting | Rejects missing custom campus location when Other is selected | Location="__other__" with blank custom location | Shows location length error and blocks submission | All assertions passed (562 ms) | **Passed** |
| TC-VAL-09 | Validation | Image Upload | Rejects unsupported non-raster image formats (PDF, SVG) | Files doc.pdf (application/pdf) and vector.svg (image/svg+xml) | Rejected with supported format message | All assertions passed (1 ms) | **Passed** |
| TC-VAL-10 | Validation | Image Upload | Rejects oversized image files exceeding 5 MB limit | 6 MB PNG file and 0-byte JPEG file | Rejected with 5 MB limit and non-empty errors | All assertions passed (1 ms) | **Passed** |
| TC-VAL-11 | Validation | Claim Submission | Rejects empty or insufficient ownership claim details | Empty ownership proof and identifying features | Shows minimum length errors; claim submission blocked | All assertions passed (29 ms) | **Passed** |
| TC-VAL-12 | Validation | Search Input | Flags invalid search input containing HTML/script angle brackets | Search query "<script>alert(1)</script>" | Inline warning displayed for unsupported characters | All assertions passed (158 ms) | **Passed** |
