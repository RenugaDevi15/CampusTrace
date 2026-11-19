import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminDashboardPage } from '../pages/AdminDashboardPage';
import { ManageClaimsPage } from '../pages/ManageClaimsPage';
import { ManageItemsPage } from '../pages/ManageItemsPage';
import { ManageUsersPage } from '../pages/ManageUsersPage';
import { MyClaimsPage } from '../pages/MyClaimsPage';
import { SubmitClaimPage } from '../pages/SubmitClaimPage';
import type { ClaimRequest, ItemReport, UserProfile } from '../types/campus';

const studentUser: UserProfile = {
  uid: 'stu_1',
  fullName: 'Nadia Khan',
  email: 'nadia@university.edu',
  role: 'student',
  department: 'Physics',
  campusId: 'STU-900',
  status: 'active',
  createdAt: '2026-11-10T09:00:00Z',
  updatedAt: '2026-11-10T09:00:00Z',
};

const adminUser: UserProfile = {
  uid: 'adm_1',
  fullName: 'Campus Admin',
  email: 'admin@university.edu',
  role: 'admin',
  department: 'Campus Security',
  campusId: 'ADM-001',
  status: 'active',
  createdAt: '2026-11-01T09:00:00Z',
  updatedAt: '2026-11-01T09:00:00Z',
};

let activeProfile: UserProfile = studentUser;
let activeIsAdmin = false;

const submitOwnershipClaimMock = vi.fn();
const adminResolveClaimMock = vi.fn();
const updateItemStatusMock = vi.fn();
const showToastMock = vi.fn();

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    profile: activeProfile,
    isAdmin: activeIsAdmin,
    isFaculty: false,
    isStudent: !activeIsAdmin,
    isVerified: true,
    loading: false,
  }),
}));

vi.mock('../context/ToastContext', () => ({
  useToast: () => ({ showToast: showToastMock }),
}));

vi.mock('../services/claimsService', () => ({
  submitOwnershipClaim: (...args: unknown[]) => submitOwnershipClaimMock(...args),
  adminResolveClaim: (...args: unknown[]) => adminResolveClaimMock(...args),
}));

vi.mock('../services/itemsService', () => ({
  updateItemStatus: (...args: unknown[]) => updateItemStatusMock(...args),
  updateItemReport: vi.fn(),
  deleteItemReport: vi.fn(),
  uploadItemImage: vi.fn(),
}));

const foundItem: ItemReport = {
  id: 'found_1',
  title: 'Black Graphing Calculator TI-84',
  type: 'found',
  category: 'Electronics',
  description: 'Found after calculus quiz in Room 302.',
  location: 'Engineering & Science Block',
  dateReported: '2026-11-17',
  status: 'Found',
  visibility: 'campus',
  imageUrl: '',
  contactSummary: 'Helpdesk Room 102',
  reporterId: 'faculty_99',
  reporterName: 'Dr. Roy',
  reporterRole: 'faculty',
  keywords: ['calculator', 'ti-84'],
  createdAt: '2026-11-17T12:00:00Z',
  updatedAt: '2026-11-17T12:00:00Z',
};

const pendingClaim: ClaimRequest = {
  id: 'claim_1',
  itemId: 'found_1',
  itemTitle: 'Black Graphing Calculator TI-84',
  itemCategory: 'Electronics',
  itemReporterId: 'faculty_99',
  claimantId: 'stu_1',
  claimantName: 'Nadia Khan',
  claimantEmail: 'nadia@university.edu',
  claimantRole: 'student',
  ownershipProof: 'Left it on the front row desk during Wednesday morning Physics quiz.',
  identifyingFeatures: 'Blue label on back cover reading N.KHAN and battery cover scratch.',
  supportingImageUrl: '',
  status: 'Pending',
  reviewerId: '',
  reviewerName: '',
  reviewNotes: '',
  history: ['2026-11-18 · Claim submitted by Nadia Khan'],
  createdAt: '2026-11-18T09:00:00Z',
  updatedAt: '2026-11-18T09:00:00Z',
};

describe('Module 3: Claim Verification and Administration', () => {
  beforeEach(() => {
    activeProfile = studentUser;
    activeIsAdmin = false;
    submitOwnershipClaimMock.mockResolvedValue('claim_new_1');
    adminResolveClaimMock.mockResolvedValue(undefined);
    updateItemStatusMock.mockResolvedValue(undefined);
  });

  it('TC-M3-01: Submits a valid ownership claim for a found item', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();

    render(
      <SubmitClaimPage itemId="found_1" items={[foundItem]} myClaims={[]} onNavigate={onNavigate} />
    );

    await user.type(
      screen.getByLabelText(/Ownership Details & Context/i),
      'I left my TI-84 graphing calculator on desk 3 after Wednesday lecture.'
    );
    await user.type(
      screen.getByLabelText(/Unique Identifying Information/i),
      'Initials NK etched near the serial number.'
    );
    await user.click(screen.getByRole('button', { name: /Submit Claim/i }));

    await waitFor(() => {
      expect(submitOwnershipClaimMock).toHaveBeenCalledTimes(1);
    });
    expect(onNavigate).toHaveBeenCalledWith('my-claims');
  });

  it('TC-M3-02: Rejects incomplete claim information via validation', async () => {
    const user = userEvent.setup();
    render(
      <SubmitClaimPage itemId="found_1" items={[foundItem]} myClaims={[]} onNavigate={vi.fn()} />
    );

    await user.type(screen.getByLabelText(/Ownership Details & Context/i), 'Mine');
    await user.click(screen.getByRole('button', { name: /Submit Claim/i }));

    expect(submitOwnershipClaimMock).not.toHaveBeenCalled();
    expect(screen.getByText(/Ownership proof must be at least 15 characters/i)).toBeInTheDocument();
  });

  it('TC-M3-03: Allows Admin to approve a claim', async () => {
    activeProfile = adminUser;
    activeIsAdmin = true;
    const user = userEvent.setup();

    render(<ManageClaimsPage claims={[pendingClaim]} onNavigate={vi.fn()} />);

    await user.type(
      screen.getByPlaceholderText(/Enter administrative verification notes/i),
      'Matched student initials on back plate.'
    );
    await user.click(screen.getByRole('button', { name: /Approve Claim/i }));

    await waitFor(() => {
      expect(adminResolveClaimMock).toHaveBeenCalledWith(
        adminUser,
        pendingClaim,
        'Approved',
        'Matched student initials on back plate.',
        false
      );
    });
  });

  it('TC-M3-04: Allows Admin to reject a claim with reason', async () => {
    activeProfile = adminUser;
    activeIsAdmin = true;
    const user = userEvent.setup();

    render(<ManageClaimsPage claims={[pendingClaim]} onNavigate={vi.fn()} />);

    await user.type(
      screen.getByPlaceholderText(/Enter administrative verification notes/i),
      'Serial number did not match physical device.'
    );
    await user.click(screen.getByRole('button', { name: /Reject Claim/i }));

    await waitFor(() => {
      expect(adminResolveClaimMock).toHaveBeenCalledWith(
        adminUser,
        pendingClaim,
        'Rejected',
        'Serial number did not match physical device.',
        false
      );
    });
  });

  it('TC-M3-05: Updates item status cleanly in Manage Items and on claim approval', async () => {
    activeProfile = adminUser;
    activeIsAdmin = true;
    const user = userEvent.setup();

    render(<ManageItemsPage items={[foundItem]} onNavigate={vi.fn()} />);

    await user.selectOptions(screen.getByLabelText(/Status for Black Graphing Calculator TI-84/i), 'Returned');

    await waitFor(() => {
      expect(updateItemStatusMock).toHaveBeenCalledWith('found_1', 'Returned');
    });
  });

  it('TC-M3-06: Prevents unauthorized non-admin users from accessing admin features', () => {
    activeProfile = studentUser;
    activeIsAdmin = false;

    render(
      <>
        <AdminDashboardPage items={[foundItem]} claims={[pendingClaim]} users={[studentUser]} onNavigate={vi.fn()} />
        <ManageClaimsPage claims={[pendingClaim]} onNavigate={vi.fn()} />
        <ManageUsersPage users={[studentUser]} onNavigate={vi.fn()} />
      </>
    );

    const restrictedMessages = screen.getAllByText(/Administrator Access Required/i);
    expect(restrictedMessages).toHaveLength(3);
    expect(screen.queryByRole('button', { name: /Approve Claim/i })).not.toBeInTheDocument();
  });

  it('TC-M3-07: Displays and preserves updated claim audit history', () => {
    const resolvedClaim: ClaimRequest = {
      ...pendingClaim,
      status: 'Approved',
      reviewerId: 'adm_1',
      reviewerName: 'Campus Admin',
      reviewNotes: 'Verified with student ID.',
      history: [
        '2026-11-18 · Claim submitted by Nadia Khan',
        '2026-11-19 · Approved by Admin (Campus Admin): Verified with student ID.',
      ],
    };

    render(<MyClaimsPage myClaims={[resolvedClaim]} loading={false} onNavigate={vi.fn()} />);

    expect(screen.getByText(/Approved by Admin \(Campus Admin\): Verified with student ID\./i)).toBeInTheDocument();
    expect(screen.getByText(/Claim submitted by Nadia Khan/i)).toBeInTheDocument();
  });
});
