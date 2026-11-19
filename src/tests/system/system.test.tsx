import fs from 'fs';
import path from 'path';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { ToastProvider } from '../../context/ToastContext';
import type { ClaimRequest, ItemReport, QATestExecutionReport, UserProfile } from '../../types/campus';

const {
  getDocFromServerMock,
  onSnapshotMock,
  onAuthStateChangedMock,
  onIdTokenChangedMock,
  getRedirectResultMock,
  getDocMock,
  batchCommitMock,
  batchSetMock,
  batchUpdateMock,
  createUserWithEmailAndPasswordMock,
  signInWithEmailAndPasswordMock,
  signOutMock,
} = vi.hoisted(() => ({
  getDocFromServerMock: vi.fn(),
  onSnapshotMock: vi.fn(),
  onAuthStateChangedMock: vi.fn(),
  onIdTokenChangedMock: vi.fn(),
  getRedirectResultMock: vi.fn(),
  getDocMock: vi.fn(),
  batchCommitMock: vi.fn(),
  batchSetMock: vi.fn(),
  batchUpdateMock: vi.fn(),
  createUserWithEmailAndPasswordMock: vi.fn(),
  signInWithEmailAndPasswordMock: vi.fn(),
  signOutMock: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  browserLocalPersistence: {},
  GoogleAuthProvider: class {
    addScope() {}
    setCustomParameters() {}
  },
  getAuth: () => ({ currentUser: null }),
  setPersistence: vi.fn().mockResolvedValue(undefined),
  createUserWithEmailAndPassword: (...args: unknown[]) => createUserWithEmailAndPasswordMock(...args),
  signInWithEmailAndPassword: (...args: unknown[]) => signInWithEmailAndPasswordMock(...args),
  signInWithPopup: vi.fn(),
  signInWithRedirect: vi.fn(),
  getRedirectResult: (...args: unknown[]) => getRedirectResultMock(...args),
  fetchSignInMethodsForEmail: vi.fn().mockResolvedValue([]),
  updateProfile: vi.fn().mockResolvedValue(undefined),
  sendEmailVerification: vi.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
  signOut: (...args: unknown[]) => signOutMock(...args),
  onAuthStateChanged: (...args: unknown[]) => onAuthStateChangedMock(...args),
  onIdTokenChanged: (...args: unknown[]) => onIdTokenChangedMock(...args),
}));

vi.mock('firebase/firestore', () => {
  let idCounter = 0;
  return {
    getFirestore: () => ({}),
    collection: (_db: unknown, name: string) => ({ __collection: name }),
    doc: (_dbOrCol: unknown, ...segments: string[]) => {
      if (segments.length === 0) {
        idCounter += 1;
        return { id: `sys_doc_${idCounter}`, path: `sys/sys_doc_${idCounter}` };
      }
      return { id: segments[segments.length - 1], path: segments.join('/') };
    },
    getDoc: (...args: unknown[]) => getDocMock(...args),
    getDocFromServer: (...args: unknown[]) => getDocFromServerMock(...args),
    setDoc: vi.fn().mockResolvedValue(undefined),
    updateDoc: vi.fn().mockResolvedValue(undefined),
    writeBatch: () => ({
      set: (...args: unknown[]) => batchSetMock(...args),
      update: (...args: unknown[]) => batchUpdateMock(...args),
      delete: vi.fn(),
      commit: (...args: unknown[]) => batchCommitMock(...args),
    }),
    serverTimestamp: () => 'SERVER_TS',
    query: vi.fn(),
    where: vi.fn(),
    onSnapshot: (...args: unknown[]) => onSnapshotMock(...args),
  };
});

vi.mock('firebase/storage', () => ({
  getStorage: () => ({}),
  ref: vi.fn(),
  uploadBytes: vi.fn(),
  getDownloadURL: vi.fn(),
}));

import App from '../../App';
import { AuthProvider } from '../../context/AuthContext';
import { handleFirestoreError, OperationType, testConnection } from '../../lib/firebase';
import { LoginPage } from '../../pages/LoginPage';
import { RegisterPage } from '../../pages/RegisterPage';
import { SearchItemsPage } from '../../pages/SearchItemsPage';
import { TestingQAPage } from '../../pages/TestingQAPage';
import { adminResolveClaim, facultyVerifyClaim, submitOwnershipClaim } from '../../services/claimsService';
import { createItemReport } from '../../services/itemsService';
import { getSuggestedMatches } from '../../utils/matching';

const sysStudent: UserProfile = {
  uid: 'sys_stu_1',
  fullName: 'Aarav Patel',
  email: 'aarav@university.edu',
  role: 'student',
  department: 'Computer Science',
  campusId: 'STU-2026-001',
  status: 'active',
  createdAt: '2026-11-10T09:00:00Z',
  updatedAt: '2026-11-10T09:00:00Z',
};

const sysFaculty: UserProfile = {
  uid: 'sys_fac_1',
  fullName: 'Dr. Elena Vance',
  email: 'vance@university.edu',
  role: 'faculty',
  department: 'Engineering',
  campusId: 'FAC-201',
  status: 'active',
  createdAt: '2026-11-05T09:00:00Z',
  updatedAt: '2026-11-05T09:00:00Z',
};

const sysAdmin: UserProfile = {
  uid: 'sys_adm_1',
  fullName: 'Campus Admin',
  email: 'renugadevib15@gmail.com',
  role: 'admin',
  department: 'Campus Security',
  campusId: 'ADM-001',
  status: 'active',
  createdAt: '2026-11-01T09:00:00Z',
  updatedAt: '2026-11-01T09:00:00Z',
};

describe('System Testing Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.location.hash = '#/';
    getRedirectResultMock.mockResolvedValue(null);
    onAuthStateChangedMock.mockImplementation((_auth: unknown, cb: (u: null) => void) => {
      cb(null);
      return vi.fn();
    });
    onIdTokenChangedMock.mockImplementation(() => vi.fn());
    onSnapshotMock.mockImplementation((_q: unknown, cb: (snap: { docs: [] }) => void) => {
      cb({ docs: [] });
      return vi.fn();
    });
    batchCommitMock.mockResolvedValue(undefined);
    getDocFromServerMock.mockResolvedValue({ exists: () => false });
  });

  it('TC-SYS-01: Executes complete user registration-to-login-to-session system workflow', async () => {
    const firebaseStu = {
      uid: sysStudent.uid,
      email: sysStudent.email,
      emailVerified: false,
      displayName: sysStudent.fullName,
    };
    createUserWithEmailAndPasswordMock.mockResolvedValue({ user: firebaseStu });
    signInWithEmailAndPasswordMock.mockResolvedValue({ user: firebaseStu });
    getDocMock
      .mockResolvedValueOnce({ exists: () => false })
      .mockResolvedValue({ exists: () => true, data: () => sysStudent });

    const user = userEvent.setup();
    const navCalls: string[] = [];

    const { rerender } = render(
      <ToastProvider>
        <AuthProvider>
          <RegisterPage onNavigate={(r) => navCalls.push(r)} />
        </AuthProvider>
      </ToastProvider>
    );

    await user.type(screen.getByLabelText(/Full Name/i), sysStudent.fullName);
    await user.type(screen.getByLabelText(/Student ID/i), sysStudent.campusId);
    await user.type(screen.getByLabelText(/Department/i), sysStudent.department);
    await user.type(screen.getByLabelText(/University Email/i), sysStudent.email);
    await user.type(screen.getByLabelText(/^Password \*/i), 'Campus2026');
    await user.type(screen.getByLabelText(/Confirm Password/i), 'Campus2026');
    await user.click(screen.getByRole('button', { name: /Create Account/i }));

    await waitFor(() => {
      expect(navCalls).toContain('dashboard');
    });

    rerender(
      <ToastProvider>
        <AuthProvider>
          <LoginPage onNavigate={(r) => navCalls.push(r)} />
        </AuthProvider>
      </ToastProvider>
    );

    await user.type(screen.getByLabelText(/University Email/i), sysStudent.email);
    await user.type(screen.getByLabelText(/Password/i), 'Campus2026');
    await user.click(screen.getByRole('button', { name: /^Sign In$/i }));

    await waitFor(() => {
      expect(signInWithEmailAndPasswordMock).toHaveBeenCalledTimes(1);
    });
  });

  it('TC-SYS-02: Executes complete lost-item-reporting-to-search and smart matching workflow', async () => {
    const lostId = await createItemReport(sysStudent, {
      title: 'Dell Precision Laptop',
      type: 'lost',
      category: 'Electronics',
      description: 'Silver Dell workstation laptop with campus robotics decal.',
      location: 'Engineering & Science Block',
      dateReported: '2026-11-18',
      contactSummary: 'Email Relay',
      contactDetails: sysStudent.email,
    });

    const catalog: ItemReport[] = [
      {
        id: lostId,
        title: 'Dell Precision Laptop',
        type: 'lost',
        category: 'Electronics',
        description: 'Silver Dell workstation laptop with campus robotics decal.',
        location: 'Engineering & Science Block',
        dateReported: '2026-11-18',
        status: 'Lost',
        visibility: 'campus',
        imageUrl: '',
        contactSummary: 'Email Relay',
        reporterId: sysStudent.uid,
        reporterName: sysStudent.fullName,
        reporterRole: 'student',
        keywords: ['dell', 'precision', 'laptop', 'robotics'],
        createdAt: '2026-11-18T09:00:00Z',
        updatedAt: '2026-11-18T09:00:00Z',
      },
      {
        id: 'found_match_1',
        title: 'Silver Dell Laptop',
        type: 'found',
        category: 'Electronics',
        description: 'Found Dell workstation with robotics sticker in Engineering Hall.',
        location: 'Engineering & Science Block',
        dateReported: '2026-11-18',
        status: 'Found',
        visibility: 'campus',
        imageUrl: '',
        contactSummary: 'Engineering Helpdesk',
        reporterId: sysFaculty.uid,
        reporterName: sysFaculty.fullName,
        reporterRole: 'faculty',
        keywords: ['dell', 'laptop', 'robotics', 'engineering'],
        createdAt: '2026-11-18T11:00:00Z',
        updatedAt: '2026-11-18T11:00:00Z',
      },
    ];

    const user = userEvent.setup();
    render(<SearchItemsPage items={catalog} loading={false} onNavigate={vi.fn()} />);

    await user.type(screen.getByLabelText(/Search by item name or keywords/i), 'robotics');
    expect(screen.getByText('Dell Precision Laptop')).toBeInTheDocument();
    expect(screen.getByText('Silver Dell Laptop')).toBeInTheDocument();

    const suggestions = getSuggestedMatches(catalog[0], catalog, 3);
    expect(suggestions[0].item.id).toBe('found_match_1');
  });

  it('TC-SYS-03: Executes complete found-item-reporting-to-claim submission workflow', async () => {
    const foundId = await createItemReport(sysFaculty, {
      title: 'TI-84 Plus Calculator',
      type: 'found',
      category: 'Electronics',
      description: 'Black graphing calculator left in auditorium front desk.',
      location: 'Main Auditorium',
      dateReported: '2026-11-18',
      contactSummary: 'Auditorium Security Desk',
      contactDetails: sysFaculty.email,
      pickupLocation: 'Main Auditorium Room 101',
    });

    const foundRecord: ItemReport = {
      id: foundId,
      title: 'TI-84 Plus Calculator',
      type: 'found',
      category: 'Electronics',
      description: 'Black graphing calculator left in auditorium front desk.',
      location: 'Main Auditorium',
      dateReported: '2026-11-18',
      status: 'Found',
      visibility: 'campus',
      imageUrl: '',
      contactSummary: 'Auditorium Security Desk',
      reporterId: sysFaculty.uid,
      reporterName: sysFaculty.fullName,
      reporterRole: 'faculty',
      keywords: ['ti-84', 'calculator'],
      createdAt: '2026-11-18T10:00:00Z',
      updatedAt: '2026-11-18T10:00:00Z',
    };

    const claimId = await submitOwnershipClaim(sysStudent, foundRecord, {
      itemId: foundRecord.id,
      ownershipProof: 'Used this calculator during morning mathematics midterm exam.',
      identifyingFeatures: 'Name AP written inside sliding hard cover.',
    });

    expect(claimId).toMatch(/^sys_doc_/);
    expect(batchCommitMock).toHaveBeenCalledTimes(2);
  });

  it('TC-SYS-04: Executes complete faculty verification and admin approval-to-returned workflow', async () => {
    const claimRecord: ClaimRequest = {
      id: 'sys_claim_1',
      itemId: 'sys_found_item_1',
      itemTitle: 'TI-84 Plus Calculator',
      itemCategory: 'Electronics',
      itemReporterId: sysFaculty.uid,
      claimantId: sysStudent.uid,
      claimantName: sysStudent.fullName,
      claimantEmail: sysStudent.email,
      claimantRole: 'student',
      ownershipProof: 'Used during morning mathematics midterm exam.',
      identifyingFeatures: 'Initials AP inside hard cover.',
      supportingImageUrl: '',
      status: 'Pending',
      reviewerId: '',
      reviewerName: '',
      reviewNotes: '',
      history: ['2026-11-18 · Claim submitted by Aarav Patel'],
      createdAt: '2026-11-18T11:00:00Z',
      updatedAt: '2026-11-18T11:00:00Z',
    };

    await facultyVerifyClaim(sysFaculty, claimRecord, 'Student confirmed exam seating.');
    expect(batchUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'claims/sys_claim_1' }),
      expect.objectContaining({ status: 'Faculty Verified' })
    );

    const verifiedClaim: ClaimRequest = { ...claimRecord, status: 'Faculty Verified' };
    await adminResolveClaim(sysAdmin, verifiedClaim, 'Approved', 'Handed over with ID check.', true);

    expect(batchUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'claims/sys_claim_1' }),
      expect.objectContaining({ status: 'Approved' })
    );
    expect(batchUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'items/sys_found_item_1' }),
      expect.objectContaining({ status: 'Returned' })
    );
  });

  it('TC-SYS-05: Enforces role-based access control and Firestore security rule invariants', () => {
    const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
    const rules = fs.readFileSync(rulesPath, 'utf-8');

    expect(rules).toContain("rules_version = '2';");
    expect(rules).toContain('allow read, write: if false;');
    expect(rules).toContain("incoming().role in ['student', 'faculty'] || isBootstrapAdmin()");
    expect(rules).toContain('isAdmin()');
  });

  it('TC-SYS-06: Verifies database connectivity check for online and offline states', async () => {
    getDocFromServerMock.mockResolvedValueOnce({ exists: () => false });
    const online = await testConnection();
    expect(online).toBe(true);

    getDocFromServerMock.mockRejectedValueOnce(new Error('Failed to get document because the client is offline.'));
    const offline = await testConnection();
    expect(offline).toBe(false);
  });

  it('TC-SYS-07: Enforces application route protection for unauthenticated hash navigation', async () => {
    window.location.hash = '#/testing-qa';
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Sign in to CampusTrace/i })).toBeInTheDocument();
    });
  });

  it('TC-SYS-08: Captures runtime failures via ErrorBoundary and structured Firestore error logger', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() =>
      handleFirestoreError(new Error('PERMISSION_DENIED'), OperationType.WRITE, 'items/bad_id')
    ).toThrow(/PERMISSION_DENIED/);

    function BrokenWidget(): never {
      throw new Error('Simulated UI Crash');
    }

    render(
      <ErrorBoundary>
        <BrokenWidget />
      </ErrorBoundary>
    );

    expect(screen.getByRole('heading', { name: /Something went wrong/i })).toBeInTheDocument();
    expect(screen.getByText(/Simulated UI Crash/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Return to Home/i })).toBeInTheDocument();
    consoleSpy.mockRestore();
  });

  it('TC-SYS-09: Verifies Admin Testing & QA Dashboard renders execution report, filters, and exports CSV', async () => {
    onAuthStateChangedMock.mockImplementation((_auth: unknown, cb: (u: unknown) => void) => {
      cb({ uid: sysAdmin.uid, email: sysAdmin.email, emailVerified: true });
      return vi.fn();
    });
    getDocMock.mockResolvedValue({ exists: () => true, data: () => sysAdmin });

    const sampleReport: QATestExecutionReport = {
      generatedAt: '2026-11-19T10:00:00Z',
      runner: 'Vitest + React Testing Library',
      command: 'npm run test:report',
      totalCases: 2,
      passedCases: 2,
      failedCases: 0,
      pendingCases: 0,
      passPercentage: 100,
      categories: [
        { testingType: 'Unit', total: 1, passed: 1, failed: 0, pending: 0, passRate: 100 },
        { testingType: 'System', total: 1, passed: 1, failed: 0, pending: 0, passRate: 100 },
      ],
      results: [
        {
          testCaseId: 'TC-UNIT-01',
          testingType: 'Unit',
          module: 'Authentication',
          testScenario: 'Validates registration input fields',
          testInput: 'Priya Sharma registration payload',
          expectedOutput: 'Validation returns valid=true',
          actualOutput: 'Passed in 12 ms',
          status: 'Passed',
          durationMs: 12,
          sourceFile: 'src/tests/unit/unit.test.tsx',
        },
        {
          testCaseId: 'TC-SYS-01',
          testingType: 'System',
          module: 'End-to-End Auth',
          testScenario: 'Registration to Login workflow',
          testInput: 'Student email/password lifecycle',
          expectedOutput: 'Profile created and authenticated',
          actualOutput: 'Passed in 45 ms',
          status: 'Passed',
          durationMs: 45,
          sourceFile: 'src/tests/system/system.test.tsx',
        },
      ],
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => sampleReport,
    });
    vi.stubGlobal('fetch', fetchMock);
    if (!URL.createObjectURL) {
      URL.createObjectURL = vi.fn(() => 'blob:mock');
    } else {
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
    }
    if (!URL.revokeObjectURL) {
      URL.revokeObjectURL = vi.fn();
    }

    const user = userEvent.setup();
    render(
      <ToastProvider>
        <AuthProvider>
          <TestingQAPage onNavigate={vi.fn()} />
        </AuthProvider>
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('TC-UNIT-01')).toBeInTheDocument();
      expect(screen.getByText('TC-SYS-01')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Run Unit Tests/i }));
    expect(screen.getByText('TC-UNIT-01')).toBeInTheDocument();
    expect(screen.queryByText('TC-SYS-01')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Export CSV/i }));
    expect(URL.createObjectURL).toHaveBeenCalled();

    vi.unstubAllGlobals();
  });
});
