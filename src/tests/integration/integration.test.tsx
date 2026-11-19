import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ClaimRequest, ItemReport, UserProfile } from '../../types/campus';

const {
  createUserWithEmailAndPasswordMock,
  signInWithEmailAndPasswordMock,
  signInWithPopupMock,
  signInWithRedirectMock,
  getRedirectResultMock,
  fetchSignInMethodsForEmailMock,
  updateProfileMock,
  sendEmailVerificationMock,
  signOutMock,
  onAuthStateChangedMock,
  onIdTokenChangedMock,
  getDocMock,
  setDocMock,
  updateDocMock,
  batchSetMock,
  batchUpdateMock,
  batchCommitMock,
  uploadBytesMock,
  getDownloadURLMock,
} = vi.hoisted(() => ({
  createUserWithEmailAndPasswordMock: vi.fn(),
  signInWithEmailAndPasswordMock: vi.fn(),
  signInWithPopupMock: vi.fn(),
  signInWithRedirectMock: vi.fn(),
  getRedirectResultMock: vi.fn(),
  fetchSignInMethodsForEmailMock: vi.fn(),
  updateProfileMock: vi.fn(),
  sendEmailVerificationMock: vi.fn(),
  signOutMock: vi.fn(),
  onAuthStateChangedMock: vi.fn(),
  onIdTokenChangedMock: vi.fn(),
  getDocMock: vi.fn(),
  setDocMock: vi.fn(),
  updateDocMock: vi.fn(),
  batchSetMock: vi.fn(),
  batchUpdateMock: vi.fn(),
  batchCommitMock: vi.fn(),
  uploadBytesMock: vi.fn(),
  getDownloadURLMock: vi.fn(),
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
  signInWithPopup: (...args: unknown[]) => signInWithPopupMock(...args),
  signInWithRedirect: (...args: unknown[]) => signInWithRedirectMock(...args),
  getRedirectResult: (...args: unknown[]) => getRedirectResultMock(...args),
  fetchSignInMethodsForEmail: (...args: unknown[]) => fetchSignInMethodsForEmailMock(...args),
  updateProfile: (...args: unknown[]) => updateProfileMock(...args),
  sendEmailVerification: (...args: unknown[]) => sendEmailVerificationMock(...args),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
  signOut: (...args: unknown[]) => signOutMock(...args),
  onAuthStateChanged: (...args: unknown[]) => onAuthStateChangedMock(...args),
  onIdTokenChanged: (...args: unknown[]) => onIdTokenChangedMock(...args),
}));

vi.mock('firebase/firestore', () => {
  let docCounter = 0;
  return {
    getFirestore: () => ({}),
    collection: (_db: unknown, name: string) => ({ __collection: name }),
    doc: (_dbOrCol: unknown, ...segments: string[]) => {
      if (segments.length === 0) {
        docCounter += 1;
        return { id: `auto_doc_${docCounter}`, path: `auto/auto_doc_${docCounter}` };
      }
      return { id: segments[segments.length - 1], path: segments.join('/') };
    },
    getDoc: (...args: unknown[]) => getDocMock(...args),
    getDocFromServer: vi.fn().mockResolvedValue({ exists: () => false }),
    setDoc: (...args: unknown[]) => setDocMock(...args),
    updateDoc: (...args: unknown[]) => updateDocMock(...args),
    writeBatch: () => ({
      set: (...args: unknown[]) => batchSetMock(...args),
      update: (...args: unknown[]) => batchUpdateMock(...args),
      delete: vi.fn(),
      commit: (...args: unknown[]) => batchCommitMock(...args),
    }),
    serverTimestamp: () => 'SERVER_TS',
    query: vi.fn(),
    where: vi.fn(),
    onSnapshot: vi.fn(() => vi.fn()),
  };
});

vi.mock('firebase/storage', () => ({
  getStorage: () => ({}),
  ref: (_storage: unknown, path: string) => ({ fullPath: path }),
  uploadBytes: (...args: unknown[]) => uploadBytesMock(...args),
  getDownloadURL: (...args: unknown[]) => getDownloadURLMock(...args),
}));

import { AuthProvider, useAuth } from '../../context/AuthContext';
import { ToastProvider } from '../../context/ToastContext';
import { Layout } from '../../components/Layout';
import { AdminDashboardPage } from '../../pages/AdminDashboardPage';
import { DashboardPage } from '../../pages/DashboardPage';
import { LoginPage } from '../../pages/LoginPage';
import { RegisterPage } from '../../pages/RegisterPage';
import { SearchItemsPage } from '../../pages/SearchItemsPage';
import { adminResolveClaim, submitOwnershipClaim } from '../../services/claimsService';
import { createItemReport, uploadItemImage } from '../../services/itemsService';

const studentProfile: UserProfile = {
  uid: 'uid_int_stu_1',
  fullName: 'Priya Sharma',
  email: 'priya.sharma@university.edu',
  role: 'student',
  department: 'Computer Science',
  campusId: 'STU-2026-041',
  status: 'active',
  createdAt: '2026-11-18T09:00:00Z',
  updatedAt: '2026-11-18T09:00:00Z',
};

const adminProfile: UserProfile = {
  uid: 'uid_int_adm_1',
  fullName: 'Campus Security Admin',
  email: 'admin@university.edu',
  role: 'admin',
  department: 'Campus Security',
  campusId: 'ADM-001',
  status: 'active',
  createdAt: '2026-11-01T09:00:00Z',
  updatedAt: '2026-11-01T09:00:00Z',
};

describe('Integration Testing Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getRedirectResultMock.mockResolvedValue(null);
    onAuthStateChangedMock.mockImplementation((_auth: unknown, cb: (u: null) => void) => {
      cb(null);
      return vi.fn();
    });
    onIdTokenChangedMock.mockImplementation(() => vi.fn());
    batchCommitMock.mockResolvedValue(undefined);
    sendEmailVerificationMock.mockResolvedValue(undefined);
    updateProfileMock.mockResolvedValue(undefined);
    fetchSignInMethodsForEmailMock.mockResolvedValue([]);
    signOutMock.mockResolvedValue(undefined);
  });

  it('TC-INT-01: Integrates user registration with Firebase Auth and Firestore profile creation', async () => {
    const fakeFirebaseUser = {
      uid: studentProfile.uid,
      email: studentProfile.email,
      emailVerified: false,
      displayName: 'Priya Sharma',
    };
    createUserWithEmailAndPasswordMock.mockResolvedValue({ user: fakeFirebaseUser });
    // First getDoc: no existing profile; second getDoc: newly created profile
    getDocMock
      .mockResolvedValueOnce({ exists: () => false })
      .mockResolvedValueOnce({ exists: () => true, data: () => studentProfile });

    const user = userEvent.setup();
    const onNavigate = vi.fn();

    render(
      <ToastProvider>
        <AuthProvider>
          <RegisterPage onNavigate={onNavigate} />
        </AuthProvider>
      </ToastProvider>
    );

    await user.type(screen.getByLabelText(/Full Name/i), 'Priya Sharma');
    await user.type(screen.getByLabelText(/Student ID/i), 'STU-2026-041');
    await user.type(screen.getByLabelText(/Department/i), 'Computer Science');
    await user.type(screen.getByLabelText(/University Email/i), 'priya.sharma@university.edu');
    await user.type(screen.getByLabelText(/^Password \*/i), 'Campus2026');
    await user.type(screen.getByLabelText(/Confirm Password/i), 'Campus2026');
    await user.click(screen.getByRole('button', { name: /Create Account/i }));

    await waitFor(() => {
      expect(createUserWithEmailAndPasswordMock).toHaveBeenCalledTimes(1);
    });
    expect(batchSetMock).toHaveBeenCalledWith(
      expect.objectContaining({ path: `users/${studentProfile.uid}` }),
      expect.objectContaining({
        uid: studentProfile.uid,
        email: studentProfile.email,
        role: 'student',
      })
    );
    // Security invariant: never store passwords in Firestore
    const writtenPayload = batchSetMock.mock.calls[0][1] as Record<string, unknown>;
    expect(writtenPayload.password).toBeUndefined();
    expect(onNavigate).toHaveBeenCalledWith('dashboard');
  });

  it('TC-INT-02: Integrates Email & Google login with role-based dashboard navigation', async () => {
    const fakeAdminUser = {
      uid: adminProfile.uid,
      email: adminProfile.email,
      emailVerified: true,
      displayName: adminProfile.fullName,
    };
    signInWithEmailAndPasswordMock.mockResolvedValue({ user: fakeAdminUser });
    getDocMock.mockResolvedValue({ exists: () => true, data: () => adminProfile });

    const user = userEvent.setup();
    const onNavigate = vi.fn();

    render(
      <ToastProvider>
        <AuthProvider>
          <LoginPage onNavigate={onNavigate} />
        </AuthProvider>
      </ToastProvider>
    );

    await user.type(screen.getByLabelText(/University Email/i), adminProfile.email);
    await user.type(screen.getByLabelText(/Password/i), 'AdminPass99');
    await user.click(screen.getByRole('button', { name: /^Sign In$/i }));

    await waitFor(() => {
      expect(signInWithEmailAndPasswordMock).toHaveBeenCalledWith(
        expect.anything(),
        adminProfile.email,
        'AdminPass99'
      );
      expect(onNavigate).toHaveBeenCalledWith('admin-dashboard');
    });
  });

  it('TC-INT-03: Integrates item report submission with atomic Firestore public & private contact batch', async () => {
    const createdId = await createItemReport(studentProfile, {
      title: 'Apple AirPods Pro Case',
      type: 'lost',
      category: 'Electronics',
      description: 'White charging case with blue silicone protective cover.',
      location: 'Student Union Commons',
      dateReported: '2026-11-18',
      contactSummary: 'Student Union Desk',
      contactDetails: 'priya.sharma@university.edu',
      pickupLocation: 'Student Union Commons',
    });

    expect(createdId).toMatch(/^auto_doc_/);
    expect(batchSetMock).toHaveBeenCalledTimes(2);
    expect(batchSetMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: createdId }),
      expect.objectContaining({
        title: 'Apple AirPods Pro Case',
        status: 'Lost',
        visibility: 'campus',
        reporterId: studentProfile.uid,
      })
    );
    expect(batchSetMock).toHaveBeenCalledWith(
      expect.objectContaining({ path: `items/${createdId}/private/contact` }),
      expect.objectContaining({
        itemId: createdId,
        contactDetails: 'priya.sharma@university.edu',
      })
    );
    expect(batchCommitMock).toHaveBeenCalledTimes(1);
  });

  it('TC-INT-04: Integrates item image upload with Firebase Storage URL retrieval', async () => {
    uploadBytesMock.mockResolvedValue({ ref: { fullPath: 'items/uid_int_stu_1/photo.jpg' } });
    getDownloadURLMock.mockResolvedValue('https://firebasestorage.googleapis.com/v0/b/campustrace/photo.jpg');

    const file = new File(['binary-image-bytes'], 'backpack.jpg', { type: 'image/jpeg' });
    const result = await uploadItemImage(file, studentProfile.uid);

    expect(uploadBytesMock).toHaveBeenCalledTimes(1);
    expect(getDownloadURLMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      url: 'https://firebasestorage.googleapis.com/v0/b/campustrace/photo.jpg',
      usedFallback: false,
    });
  });

  it('TC-INT-05: Integrates search filtering UI directly with catalog database records', async () => {
    const dbRecords: ItemReport[] = [
      {
        id: 'db_1',
        title: 'Canon EOS Camera Lens',
        type: 'found',
        category: 'Electronics',
        description: 'Found inside Photography Studio B locker.',
        location: 'Main Auditorium',
        dateReported: '2026-11-18',
        status: 'Found',
        visibility: 'campus',
        imageUrl: '',
        contactSummary: 'Security Desk',
        reporterId: 'fac_1',
        reporterName: 'Prof. Roy',
        reporterRole: 'faculty',
        keywords: ['canon', 'camera', 'lens'],
        createdAt: '2026-11-18T08:00:00Z',
        updatedAt: '2026-11-18T08:00:00Z',
      },
      {
        id: 'db_2',
        title: 'University Student ID Card',
        type: 'lost',
        category: 'ID Cards & Keys',
        description: 'Lost near North Residence Hall main gate.',
        location: 'North Residence Hall',
        dateReported: '2026-11-18',
        status: 'Lost',
        visibility: 'campus',
        imageUrl: '',
        contactSummary: 'Email Relay',
        reporterId: 'stu_2',
        reporterName: 'Rohan Mehta',
        reporterRole: 'student',
        keywords: ['student', 'card', 'residence'],
        createdAt: '2026-11-18T09:00:00Z',
        updatedAt: '2026-11-18T09:00:00Z',
      },
    ];

    const user = userEvent.setup();
    render(<SearchItemsPage items={dbRecords} loading={false} onNavigate={vi.fn()} />);

    await user.selectOptions(screen.getByLabelText(/Filter by category/i), 'Electronics');
    expect(screen.getByText('Canon EOS Camera Lens')).toBeInTheDocument();
    expect(screen.queryByText('University Student ID Card')).not.toBeInTheDocument();
  });

  it('TC-INT-06: Integrates claim submission with target item record and reporter notification', async () => {
    const targetItem: ItemReport = {
      id: 'found_item_9',
      title: 'Blue Leather Notebook',
      type: 'found',
      category: 'Books & Notes',
      description: 'Spiral notebook with organic chemistry diagrams.',
      location: 'Engineering & Science Block',
      dateReported: '2026-11-18',
      status: 'Found',
      visibility: 'campus',
      imageUrl: '',
      contactSummary: 'Science Office',
      reporterId: 'fac_9',
      reporterName: 'Dr. Nair',
      reporterRole: 'faculty',
      keywords: ['notebook', 'chemistry'],
      createdAt: '2026-11-18T09:00:00Z',
      updatedAt: '2026-11-18T09:00:00Z',
    };

    const claimId = await submitOwnershipClaim(studentProfile, targetItem, {
      itemId: targetItem.id,
      ownershipProof: 'Left this chemistry notebook on lab bench 4 after practical exam.',
      identifyingFeatures: 'Page 14 has highlighted titration calculations and initials PS.',
    });

    expect(claimId).toMatch(/^auto_doc_/);
    expect(batchSetMock).toHaveBeenCalledTimes(2);
    expect(batchSetMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        itemId: 'found_item_9',
        claimantId: studentProfile.uid,
        status: 'Pending',
      })
    );
    expect(batchSetMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        userId: 'fac_9',
        type: 'claim_submitted',
        relatedItemId: 'found_item_9',
      })
    );
  });

  it('TC-INT-07: Integrates admin claim approval with item status update and claimant notification', async () => {
    const pendingClaim: ClaimRequest = {
      id: 'claim_int_7',
      itemId: 'found_item_9',
      itemTitle: 'Blue Leather Notebook',
      itemCategory: 'Books & Notes',
      itemReporterId: 'fac_9',
      claimantId: studentProfile.uid,
      claimantName: studentProfile.fullName,
      claimantEmail: studentProfile.email,
      claimantRole: 'student',
      ownershipProof: 'Left in Chemistry lab bench 4.',
      identifyingFeatures: 'Initials PS inside front flap.',
      supportingImageUrl: '',
      status: 'Pending',
      reviewerId: '',
      reviewerName: '',
      reviewNotes: '',
      history: ['2026-11-18 · Claim submitted by Priya Sharma'],
      createdAt: '2026-11-18T10:00:00Z',
      updatedAt: '2026-11-18T10:00:00Z',
    };

    await adminResolveClaim(adminProfile, pendingClaim, 'Approved', 'Matched lab roster.', true);

    expect(batchUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'claims/claim_int_7' }),
      expect.objectContaining({
        status: 'Approved',
        reviewerId: adminProfile.uid,
      })
    );
    expect(batchUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'items/found_item_9' }),
      expect.objectContaining({ status: 'Returned' })
    );
    expect(batchSetMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        userId: studentProfile.uid,
        type: 'claim_approved',
        relatedClaimId: 'claim_int_7',
      })
    );
  });

  it('TC-INT-08: Integrates user role state with Layout navigation and dashboard access control', async () => {
    // Authenticated as Student first via onAuthStateChanged
    onAuthStateChangedMock.mockImplementation((_auth: unknown, cb: (u: unknown) => void) => {
      cb({ uid: studentProfile.uid, email: studentProfile.email, emailVerified: true });
      return vi.fn();
    });
    getDocMock.mockResolvedValue({ exists: () => true, data: () => studentProfile });

    function RoleHarness() {
      const { profile, loading } = useAuth();
      if (loading || !profile) return <div>Loading...</div>;
      return (
        <Layout currentRoute="dashboard" onNavigate={vi.fn()} notifications={[]}>
          <DashboardPage
            items={[]}
            myItems={[]}
            myClaims={[]}
            allClaims={[]}
            notifications={[]}
            onNavigate={vi.fn()}
          />
          <AdminDashboardPage items={[]} claims={[]} users={[]} onNavigate={vi.fn()} />
        </Layout>
      );
    }

    render(
      <ToastProvider>
        <AuthProvider>
          <RoleHarness />
        </AuthProvider>
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Welcome, Priya Sharma/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Administrator Access Required/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Testing & QA/i })).not.toBeInTheDocument();
  });
});
