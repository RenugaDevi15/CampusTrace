import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();
const TEMP_RESULTS_FILE = path.join(ROOT_DIR, '.vitest-results.json');
const OUTPUT_DIR = path.join(ROOT_DIR, 'public', 'test-reports');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'latest-report.json');

const TEST_METADATA = {
  // Unit Testing
  'TC-UNIT-01': {
    testingType: 'Unit',
    module: 'Authentication',
    testInput: 'Valid Student payload & malformed empty/mismatch payload',
    expectedOutput: 'Valid returns valid=true; invalid flags field errors',
  },
  'TC-UNIT-02': {
    testingType: 'Unit',
    module: 'Authentication',
    testInput: 'Email/password pairs (valid vs empty)',
    expectedOutput: 'Valid accepted; missing fields rejected',
  },
  'TC-UNIT-03': {
    testingType: 'Unit',
    module: 'Item Management',
    testInput: 'Lost item: Graphing Calculator TI-84, Electronics, Central Library',
    expectedOutput: 'createItemReport invoked with type="lost" payload',
  },
  'TC-UNIT-04': {
    testingType: 'Unit',
    module: 'Item Management',
    testInput: 'Found item: Campus Hostel Keychain, ID Cards & Keys, Cafeteria',
    expectedOutput: 'createItemReport invoked with type="found" payload',
  },
  'TC-UNIT-05': {
    testingType: 'Unit',
    module: 'Search & Matching',
    testInput: 'Keywords "MacBook" and "strang" against catalog items',
    expectedOutput: 'Returns exact matching item record(s)',
  },
  'TC-UNIT-06': {
    testingType: 'Unit',
    module: 'Search & Matching',
    testInput: 'Category="Books & Notes" and Status="Lost"',
    expectedOutput: 'Isolates records matching category and status filters',
  },
  'TC-UNIT-07': {
    testingType: 'Unit',
    module: 'Claim Verification',
    testInput: 'Ownership proof + identifying features for item_u2',
    expectedOutput: 'submitOwnershipClaim invoked with claimant and proof',
  },
  'TC-UNIT-08': {
    testingType: 'Unit',
    module: 'Administration',
    testInput: 'Admin Approve & Reject actions with review notes',
    expectedOutput: 'adminResolveClaim dispatched for Approved and Rejected',
  },
  'TC-UNIT-09': {
    testingType: 'Unit',
    module: 'Item Management',
    testInput: 'Status transitions to "Claimed" and "Returned"',
    expectedOutput: 'updateItemStatus invoked with target ID and new status',
  },

  // Integration Testing
  'TC-INT-01': {
    testingType: 'Integration',
    module: 'Auth + Firestore',
    testInput: 'Registration form -> Firebase Auth + Firestore users/{uid}',
    expectedOutput: 'Auth user created, Firestore profile saved without password, redirected to dashboard',
  },
  'TC-INT-02': {
    testingType: 'Integration',
    module: 'Auth + Navigation',
    testInput: 'Admin email/password sign-in',
    expectedOutput: 'Firebase Auth verified, profile loaded, navigated to admin-dashboard',
  },
  'TC-INT-03': {
    testingType: 'Integration',
    module: 'Items + Firestore',
    testInput: 'createItemReport with public + private contact details',
    expectedOutput: 'Atomic writeBatch commits items/{id} and private/contact docs',
  },
  'TC-INT-04': {
    testingType: 'Integration',
    module: 'Items + Storage',
    testInput: 'JPEG file upload via uploadItemImage',
    expectedOutput: 'Firebase Storage uploadBytes + getDownloadURL returns cloud URL',
  },
  'TC-INT-05': {
    testingType: 'Integration',
    module: 'Search + Database',
    testInput: 'Category filter "Electronics" on database item feed',
    expectedOutput: 'SearchItemsPage renders matching DB records and excludes others',
  },
  'TC-INT-06': {
    testingType: 'Integration',
    module: 'Claims + Notifications',
    testInput: 'submitOwnershipClaim on found_item_9',
    expectedOutput: 'Atomic batch creates claim doc and reporter notification',
  },
  'TC-INT-07': {
    testingType: 'Integration',
    module: 'Claims + Items + Alerts',
    testInput: 'adminResolveClaim(Approved, markItemReturned=true)',
    expectedOutput: 'Claim marked Approved, item marked Returned, claimant notified',
  },
  'TC-INT-08': {
    testingType: 'Integration',
    module: 'RBAC + Dashboard',
    testInput: 'Authenticated Student accessing Dashboard + AdminDashboard',
    expectedOutput: 'Student dashboard visible; Admin controls & QA link blocked',
  },

  // Validation Testing
  'TC-VAL-01': {
    testingType: 'Validation',
    module: 'Auth Forms',
    testInput: 'Blank Register and Login form submissions',
    expectedOutput: 'Inline validation errors displayed; Auth requests blocked',
  },
  'TC-VAL-02': {
    testingType: 'Validation',
    module: 'Auth Forms',
    testInput: 'Email = "invalid-email-format"',
    expectedOutput: 'Email format error shown; submission prevented',
  },
  'TC-VAL-03': {
    testingType: 'Validation',
    module: 'Auth Forms',
    testInput: 'Passwords "ab1" (<6 chars) and "onlyletters" (no digits)',
    expectedOutput: 'Password strength error returned',
  },
  'TC-VAL-04': {
    testingType: 'Validation',
    module: 'Registration',
    testInput: 'Password="Campus2026", Confirm="Campus9999"',
    expectedOutput: 'Displays "Passwords do not match."',
  },
  'TC-VAL-05': {
    testingType: 'Validation',
    module: 'Registration',
    testInput: 'Email="existing@university.edu" (already registered)',
    expectedOutput: 'Displays duplicate email alert without creating account',
  },
  'TC-VAL-06': {
    testingType: 'Validation',
    module: 'Item Reporting',
    testInput: 'Title="A", Description="short"',
    expectedOutput: 'Shows title & description length validation errors',
  },
  'TC-VAL-07': {
    testingType: 'Validation',
    module: 'Item Reporting',
    testInput: 'Dates "19-11-2026" and "2026-02-30"',
    expectedOutput: 'Rejects invalid date format and impossible calendar date',
  },
  'TC-VAL-08': {
    testingType: 'Validation',
    module: 'Item Reporting',
    testInput: 'Location="__other__" with blank custom location',
    expectedOutput: 'Shows location length error and blocks submission',
  },
  'TC-VAL-09': {
    testingType: 'Validation',
    module: 'Image Upload',
    testInput: 'Files doc.pdf (application/pdf) and vector.svg (image/svg+xml)',
    expectedOutput: 'Rejected with supported format message',
  },
  'TC-VAL-10': {
    testingType: 'Validation',
    module: 'Image Upload',
    testInput: '6 MB PNG file and 0-byte JPEG file',
    expectedOutput: 'Rejected with 5 MB limit and non-empty errors',
  },
  'TC-VAL-11': {
    testingType: 'Validation',
    module: 'Claim Submission',
    testInput: 'Empty ownership proof and identifying features',
    expectedOutput: 'Shows minimum length errors; claim submission blocked',
  },
  'TC-VAL-12': {
    testingType: 'Validation',
    module: 'Search Input',
    testInput: 'Search query "<script>alert(1)</script>"',
    expectedOutput: 'Inline warning displayed for unsupported characters',
  },

  // Functional Testing
  'TC-FUNC-01': {
    testingType: 'Functional',
    module: 'User Registration',
    testInput: 'Faculty role selection + full registration details',
    expectedOutput: 'Account created with faculty role and redirected to dashboard',
  },
  'TC-FUNC-02': {
    testingType: 'Functional',
    module: 'Email/Password Login',
    testInput: 'Wrong password followed by valid password',
    expectedOutput: 'Shows credential error first; signs in and navigates on retry',
  },
  'TC-FUNC-03': {
    testingType: 'Functional',
    module: 'Google OAuth',
    testInput: 'Click "Continue with Google"',
    expectedOutput: 'Invokes loginWithGoogle and navigates to dashboard',
  },
  'TC-FUNC-04': {
    testingType: 'Functional',
    module: 'Session & Logout',
    testInput: 'Click "Sign Out" in top bar',
    expectedOutput: 'Calls logout() and navigates to public home portal',
  },
  'TC-FUNC-05': {
    testingType: 'Functional',
    module: 'Dashboard Navigation',
    testInput: 'Click Report Lost, Manage reports, Track claims',
    expectedOutput: 'Navigates to report-lost, my-reports, and my-claims',
  },
  'TC-FUNC-06': {
    testingType: 'Functional',
    module: 'Report Lost Item',
    testInput: 'Fill lost form (Black JBL Earbuds) and submit',
    expectedOutput: 'Publishes report and opens item-details page',
  },
  'TC-FUNC-07': {
    testingType: 'Functional',
    module: 'Report Found Item',
    testInput: 'Fill found form (Silver Casio Watch) with pickup desk',
    expectedOutput: 'Submits found item with pickupLocation="Athletics Front Desk"',
  },
  'TC-FUNC-08': {
    testingType: 'Functional',
    module: 'Search & Filtering',
    testInput: 'Toggle "Found Items" then click "Reset filters"',
    expectedOutput: 'Filters to Found items then restores full list',
  },
  'TC-FUNC-09': {
    testingType: 'Functional',
    module: 'Item Details',
    testInput: 'View Found item while authenticated and click "Claim This Item"',
    expectedOutput: 'Shows verified contact info and navigates to submit-claim',
  },
  'TC-FUNC-10': {
    testingType: 'Functional',
    module: 'Claim Submission',
    testInput: 'Submit proof & identifying details for MacBook Charger',
    expectedOutput: 'Saves claim and navigates to my-claims',
  },
  'TC-FUNC-11': {
    testingType: 'Functional',
    module: 'Admin Claims',
    testInput: 'Enter verification notes and click "Approve & Mark Returned"',
    expectedOutput: 'Resolves claim as Approved with markItemReturned=true',
  },
  'TC-FUNC-12': {
    testingType: 'Functional',
    module: 'Admin Users & Items',
    testInput: 'Change user role to faculty; update item status to Returned',
    expectedOutput: 'Calls adminUpdateUserRoleAndStatus and updateItemStatus',
  },
  'TC-FUNC-13': {
    testingType: 'Functional',
    module: 'Responsive Navigation',
    testInput: 'Open mobile navigation menu drawer',
    expectedOutput: 'Displays mobile workspace items (My Reports, My Claims)',
  },

  // System Testing
  'TC-SYS-01': {
    testingType: 'System',
    module: 'Auth Lifecycle',
    testInput: 'Full Create Account -> Dashboard redirect -> Email Sign In',
    expectedOutput: 'Account persisted and authenticated cleanly across flows',
  },
  'TC-SYS-02': {
    testingType: 'System',
    module: 'Lost-to-Search Flow',
    testInput: 'Report Lost laptop -> Search "robotics" -> Smart Match scoring',
    expectedOutput: 'Item appears in search and ranks matching Found laptop top',
  },
  'TC-SYS-03': {
    testingType: 'System',
    module: 'Found-to-Claim Flow',
    testInput: 'Faculty reports Found TI-84 -> Student submits ownership claim',
    expectedOutput: 'Both item and claim batches commit atomically',
  },
  'TC-SYS-04': {
    testingType: 'System',
    module: 'Verification-to-Return',
    testInput: 'Faculty pre-verifies -> Admin approves & marks Returned',
    expectedOutput: 'Claim status reaches Approved and item transitions to Returned',
  },
  'TC-SYS-05': {
    testingType: 'System',
    module: 'RBAC & Security Rules',
    testInput: 'Audit firestore.rules invariants and default-deny rules',
    expectedOutput: 'Default deny, non-escalation, and admin guards verified',
  },
  'TC-SYS-06': {
    testingType: 'System',
    module: 'Database Connectivity',
    testInput: 'testConnection() with reachable Firestore vs offline error',
    expectedOutput: 'Returns true when online and false when client is offline',
  },
  'TC-SYS-07': {
    testingType: 'System',
    module: 'Route Protection',
    testInput: 'Navigate unauthenticated to #/testing-qa',
    expectedOutput: 'Automatically redirects to Sign in to CampusTrace',
  },
  'TC-SYS-08': {
    testingType: 'System',
    module: 'Error Handling',
    testInput: 'Firestore PERMISSION_DENIED + thrown component Error',
    expectedOutput: 'Structured JSON error thrown; ErrorBoundary shows recovery UI',
  },
  'TC-SYS-09': {
    testingType: 'System',
    module: 'Testing & QA Dashboard',
    testInput: 'Admin loads QA report, filters Unit tests, exports CSV',
    expectedOutput: 'Displays real metrics, filters rows, and generates CSV Blob',
  },
};

function inferCategoryFromFile(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  if (normalized.includes('/unit/')) return 'Unit';
  if (normalized.includes('/integration/')) return 'Integration';
  if (normalized.includes('/validation/')) return 'Validation';
  if (normalized.includes('/functional/')) return 'Functional';
  return 'System';
}

function mapStatus(rawStatus) {
  if (rawStatus === 'passed') return 'Passed';
  if (rawStatus === 'failed') return 'Failed';
  return 'Pending';
}

function run() {
  if (fs.existsSync(TEMP_RESULTS_FILE)) {
    fs.unlinkSync(TEMP_RESULTS_FILE);
  }

  let vitestExitCode = 0;
  try {
    execSync(
      'npx vitest run src/tests/unit src/tests/integration src/tests/validation src/tests/functional src/tests/system --reporter=json --outputFile=.vitest-results.json',
      { stdio: 'inherit', cwd: ROOT_DIR }
    );
  } catch (err) {
    vitestExitCode = typeof err.status === 'number' ? err.status : 1;
  }

  if (!fs.existsSync(TEMP_RESULTS_FILE)) {
    console.error('Vitest did not produce .vitest-results.json.');
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(TEMP_RESULTS_FILE, 'utf-8'));
  fs.unlinkSync(TEMP_RESULTS_FILE);

  const results = [];
  for (const suite of raw.testResults || []) {
    const sourceFile = path.relative(ROOT_DIR, suite.name || '').replace(/\\/g, '/');
    const fallbackType = inferCategoryFromFile(sourceFile);

    for (const assertion of suite.assertionResults || []) {
      const fullTitle = assertion.title || assertion.fullName || '';
      const idMatch = fullTitle.match(/^(TC-[A-Z]+-\d+):\s*(.+)$/);
      const testCaseId = idMatch ? idMatch[1] : `TC-AUTO-${results.length + 1}`;
      const testScenario = idMatch ? idMatch[2] : fullTitle;
      const meta = TEST_METADATA[testCaseId] || {
        testingType: fallbackType,
        module: 'CampusTrace',
        testInput: 'Automated Vitest suite input',
        expectedOutput: 'All assertions succeed',
      };

      const status = mapStatus(assertion.status);
      const durationMs = Math.max(1, Math.round(assertion.duration || 0));
      let actualOutput = `Verified (${durationMs} ms)`;
      if (status === 'Failed') {
        const failureText = (assertion.failureMessages || []).join(' ').replace(/\s+/g, ' ').trim();
        actualOutput = failureText ? failureText.slice(0, 240) : 'Assertion failed during test execution.';
      } else if (status === 'Pending') {
        actualOutput = 'Test skipped or pending execution.';
      } else {
        actualOutput = `All assertions passed (${durationMs} ms)`;
      }

      results.push({
        testCaseId,
        testingType: meta.testingType,
        module: meta.module,
        testScenario,
        testInput: meta.testInput,
        expectedOutput: meta.expectedOutput,
        actualOutput,
        status,
        durationMs,
        sourceFile,
      });
    }
  }

  const categoryOrder = ['Unit', 'Integration', 'Validation', 'Functional', 'System'];
  const categories = categoryOrder.map((testingType) => {
    const subset = results.filter((r) => r.testingType === testingType);
    const total = subset.length;
    const passed = subset.filter((r) => r.status === 'Passed').length;
    const failed = subset.filter((r) => r.status === 'Failed').length;
    const pending = subset.filter((r) => r.status === 'Pending').length;
    const passRate = total > 0 ? Math.round((passed / total) * 1000) / 10 : 0;
    return { testingType, total, passed, failed, pending, passRate };
  });

  const totalCases = results.length;
  const passedCases = results.filter((r) => r.status === 'Passed').length;
  const failedCases = results.filter((r) => r.status === 'Failed').length;
  const pendingCases = results.filter((r) => r.status === 'Pending').length;
  const passPercentage = totalCases > 0 ? Math.round((passedCases / totalCases) * 1000) / 10 : 0;

  const report = {
    generatedAt: new Date().toISOString(),
    runner: 'Vitest v5 + React Testing Library',
    command: 'npm run test:report',
    totalCases,
    passedCases,
    failedCases,
    pendingCases,
    passPercentage,
    categories,
    results,
  };

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(report, null, 2), 'utf-8');

  const docsDir = path.join(ROOT_DIR, 'docs', 'test-cases');
  fs.mkdirSync(docsDir, { recursive: true });
  const docFiles = [
    { category: 'Unit', filename: '01_unit_testing.md', title: 'Unit Testing Documentation' },
    { category: 'Integration', filename: '02_integration_testing.md', title: 'Integration Testing Documentation' },
    { category: 'Validation', filename: '03_validation_testing.md', title: 'Validation Testing Documentation' },
    { category: 'Functional', filename: '04_functional_testing.md', title: 'Functional Testing Documentation' },
    { category: 'System', filename: '05_system_testing.md', title: 'System Testing Documentation' },
  ];

  for (const docSpec of docFiles) {
    const subset = results.filter((r) => r.testingType === docSpec.category);
    const catSummary = categories.find((c) => c.testingType === docSpec.category);
    const rows = subset
      .map(
        (r) =>
          `| ${r.testCaseId} | ${r.testingType} | ${r.module} | ${r.testScenario.replace(/\|/g, '\\|')} | ${r.testInput.replace(/\|/g, '\\|')} | ${r.expectedOutput.replace(/\|/g, '\\|')} | ${r.actualOutput.replace(/\|/g, '\\|')} | **${r.status}** |`
      )
      .join('\n');

    const md = `# CampusTrace — ${docSpec.title}

- **Test Runner:** ${report.runner}
- **Command Executed:** \`${report.command}\`
- **Execution Timestamp:** ${report.generatedAt}
- **Total Test Cases:** ${catSummary?.total ?? subset.length}
- **Passed:** ${catSummary?.passed ?? 0}
- **Failed:** ${catSummary?.failed ?? 0}
- **Pending:** ${catSummary?.pending ?? 0}
- **Pass Percentage:** ${catSummary?.passRate ?? 0}%

## Test Case Matrix

| Test Case ID | Testing Type | Module | Test Scenario | Test Input | Expected Output | Actual Output | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
${rows}
`;
    fs.writeFileSync(path.join(docsDir, docSpec.filename), md, 'utf-8');
  }

  console.log(
    `Generated QA execution report at ${path.relative(ROOT_DIR, OUTPUT_FILE)}: ${passedCases}/${totalCases} passed (${passPercentage}%).`
  );

  if (vitestExitCode !== 0 || failedCases > 0) {
    process.exit(1);
  }
}

run();
