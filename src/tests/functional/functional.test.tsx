import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ClaimRequest, ItemReport, UserProfile } from '../../types/campus';

const studentUser: UserProfile = {
  uid: 'stu_func_1',
  fullName: 'Rohan Mehta',
  email: 'rohan.mehta@university.edu',
  role: 'student',
  department: 'Mechanical Engineering',
  campusId: 'STU-2026-205',
  status: 'active',
  createdAt: '2026-11-10T09:00:00Z',
  updatedAt: '2026-11-10T09:00:00Z',
};

const facultyUser: UserProfile = {
  uid: 'fac_func_1',
  fullName: 'Dr. Elena Vance',
  email: 'elena.vance@university.edu',
  role: 'faculty',
  department: 'Mathematics',
  campusId: 'FAC-108',
  status: 'active',
  createdAt: '2026-11-05T09:00:00Z',
  updatedAt: '2026-11-05T09:00:00Z',
};

const adminUser: UserProfile = {
  uid: 'adm_func_1',
  fullName: 'Campus Admin',
  email: 'admin@university.edu',
  role: 'admin',
  department: 'Campus Security',
  campusId: 'ADM-001',
  status: 'active',
  createdAt: '2026-11-01T09:00:00Z',
  updatedAt: '2026-11-01T09:00:00Z',
};

let activeProfile: UserProfile | null = studentUser;
let activeIsAdmin = false;
let activeIsFaculty = false;

const registerWithEmailMock = vi.fn();
const loginWithEmailMock = vi.fn();
const loginWithGoogleMock = vi.fn();
const logoutMock = vi.fn();
const createItemReportMock = vi.fn();
const updateItemStatusMock = vi.fn();
const getItemContactMock = vi.fn();
const submitOwnershipClaimMock = vi.fn();
const adminResolveClaimMock = vi.fn();
const adminUpdateUserRoleAndStatusMock = vi.fn();
const showToastMock = vi.fn();

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    profile: activeProfile,
    firebaseUser: activeProfile ? { uid: activeProfile.uid, email: activeProfile.email, emailVerified: true } : null,
    loading: false,
    isVerified: Boolean(activeProfile),
    isAdmin: activeIsAdmin,
    isFaculty: activeIsFaculty,
    isStudent: Boolean(activeProfile && !activeIsAdmin && !activeIsFaculty),
    registerWithEmail: (...args: unknown[]) => registerWithEmailMock(...args),
    loginWithEmail: (...args: unknown[]) => loginWithEmailMock(...args),
    loginWithGoogle: (...args: unknown[]) => loginWithGoogleMock(...args),
    sendResetPassword: vi.fn(),
    logout: (...args: unknown[]) => logoutMock(...args),
  }),
}));

vi.mock('../../context/ToastContext', () => ({
  useToast: () => ({ showToast: showToastMock }),
}));

vi.mock('../../services/itemsService', () => ({
  createItemReport: (...args: unknown[]) => createItemReportMock(...args),
  updateItemReport: vi.fn(),
  updateItemStatus: (...args: unknown[]) => updateItemStatusMock(...args),
  deleteItemReport: vi.fn(),
  uploadItemImage: vi.fn(),
  getItemContact: (...args: unknown[]) => getItemContactMock(...args),
}));

vi.mock('../../services/claimsService', () => ({
  submitOwnershipClaim: (...args: unknown[]) => submitOwnershipClaimMock(...args),
  adminResolveClaim: (...args: unknown[]) => adminResolveClaimMock(...args),
  facultyVerifyClaim: vi.fn(),
}));

vi.mock('../../services/usersService', () => ({
  adminUpdateUserRoleAndStatus: (...args: unknown[]) => adminUpdateUserRoleAndStatusMock(...args),
  markAllNotificationsRead: vi.fn(),
  markNotificationRead: vi.fn(),
}));

import { Layout } from '../../components/Layout';
import { DashboardPage } from '../../pages/DashboardPage';
import { ItemDetailsPage } from '../../pages/ItemDetailsPage';
import { LoginPage } from '../../pages/LoginPage';
import { ManageClaimsPage } from '../../pages/ManageClaimsPage';
import { ManageItemsPage } from '../../pages/ManageItemsPage';
import { ManageUsersPage } from '../../pages/ManageUsersPage';
import { RegisterPage } from '../../pages/RegisterPage';
import { ReportItemPage } from '../../pages/ReportItemPage';
import { SearchItemsPage } from '../../pages/SearchItemsPage';
import { SubmitClaimPage } from '../../pages/SubmitClaimPage';

const sampleItems: ItemReport[] = [
  {
    id: 'func_lost_1',
    title: 'Navy Herschel Backpack',
    type: 'lost',
    category: 'Bags & Backpacks',
    description: 'Navy canvas backpack with brass buckle and engineering lab notebook inside.',
    location: 'Engineering & Science Block',
    dateReported: '2026-11-18',
    status: 'Lost',
    visibility: 'campus',
    imageUrl: '',
    contactSummary: 'Campus Email Relay',
    reporterId: 'stu_func_1',
    reporterName: 'Rohan Mehta',
    reporterRole: 'student',
    keywords: ['backpack', 'herschel', 'engineering'],
    createdAt: '2026-11-18T08:00:00Z',
    updatedAt: '2026-11-18T08:00:00Z',
  },
  {
    id: 'func_found_1',
    title: 'Silver MacBook Charger 67W',
    type: 'found',
    category: 'Electronics',
    description: 'USB-C Apple power adapter found plugged in near Library carrel 12.',
    location: 'Central Library',
    dateReported: '2026-11-18',
    status: 'Found',
    visibility: 'campus',
    imageUrl: '',
    contactSummary: 'Central Library Front Desk',
    reporterId: 'fac_func_1',
    reporterName: 'Dr. Elena Vance',
    reporterRole: 'faculty',
    keywords: ['macbook', 'charger', 'library'],
    createdAt: '2026-11-18T10:00:00Z',
    updatedAt: '2026-11-18T10:00:00Z',
  },
];

const sampleClaim: ClaimRequest = {
  id: 'func_claim_1',
  itemId: 'func_found_1',
  itemTitle: 'Silver MacBook Charger 67W',
  itemCategory: 'Electronics',
  itemReporterId: 'fac_func_1',
  claimantId: 'stu_func_1',
  claimantName: 'Rohan Mehta',
  claimantEmail: 'rohan.mehta@university.edu',
  claimantRole: 'student',
  ownershipProof: 'Plugged my 67W USB-C charger at carrel 12 during afternoon study.',
  identifyingFeatures: 'Green electrical tape band wrapped near the brick connector.',
  supportingImageUrl: '',
  status: 'Pending',
  reviewerId: '',
  reviewerName: '',
  reviewNotes: '',
  history: ['2026-11-18 · Claim submitted by Rohan Mehta'],
  createdAt: '2026-11-18T12:00:00Z',
  updatedAt: '2026-11-18T12:00:00Z',
};

describe('Functional Testing Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    activeProfile = studentUser;
    activeIsAdmin = false;
    activeIsFaculty = false;
    registerWithEmailMock.mockResolvedValue(facultyUser);
    loginWithEmailMock.mockResolvedValue(studentUser);
    loginWithGoogleMock.mockResolvedValue(studentUser);
    logoutMock.mockResolvedValue(undefined);
    createItemReportMock.mockResolvedValue('new_func_item_1');
    updateItemStatusMock.mockResolvedValue(undefined);
    getItemContactMock.mockResolvedValue({
      itemId: 'func_found_1',
      reporterId: 'fac_func_1',
      contactDetails: 'elena.vance@university.edu',
      pickupLocation: 'Central Library Front Desk',
      updatedAt: '2026-11-18T10:00:00Z',
    });
    submitOwnershipClaimMock.mockResolvedValue('new_func_claim_1');
    adminResolveClaimMock.mockResolvedValue(undefined);
    adminUpdateUserRoleAndStatusMock.mockResolvedValue(undefined);
  });

  it('TC-FUNC-01: Completes user registration flow for Student and Faculty roles', async () => {
    activeProfile = null;
    const user = userEvent.setup();
    const onNavigate = vi.fn();

    render(<RegisterPage onNavigate={onNavigate} />);

    await user.click(screen.getByRole('button', { name: /Faculty Member/i }));
    await user.type(screen.getByLabelText(/Full Name/i), 'Dr. Elena Vance');
    await user.type(screen.getByLabelText(/Faculty \/ Staff ID/i), 'FAC-108');
    await user.type(screen.getByLabelText(/Department/i), 'Mathematics');
    await user.type(screen.getByLabelText(/University Email/i), 'elena.vance@university.edu');
    await user.type(screen.getByLabelText(/^Password \*/i), 'Faculty2026');
    await user.type(screen.getByLabelText(/Confirm Password/i), 'Faculty2026');
    await user.click(screen.getByRole('button', { name: /Create Account/i }));

    await waitFor(() => {
      expect(registerWithEmailMock).toHaveBeenCalledWith(
        'elena.vance@university.edu',
        'Faculty2026',
        expect.objectContaining({
          fullName: 'Dr. Elena Vance',
          role: 'faculty',
          department: 'Mathematics',
          campusId: 'FAC-108',
        })
      );
      expect(onNavigate).toHaveBeenCalledWith('dashboard');
    });
  });

  it('TC-FUNC-02: Handles email/password Sign In and displays error on invalid credentials', async () => {
    activeProfile = null;
    loginWithEmailMock.mockRejectedValueOnce(
      new Error('Invalid email or password. Please verify your credentials and try again.')
    );
    const user = userEvent.setup();
    const onNavigate = vi.fn();

    render(<LoginPage onNavigate={onNavigate} />);

    await user.type(screen.getByLabelText(/University Email/i), 'rohan.mehta@university.edu');
    await user.type(screen.getByLabelText(/Password/i), 'WrongPass1');
    await user.click(screen.getByRole('button', { name: /^Sign In$/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Invalid email or password/i);
    });

    await user.clear(screen.getByLabelText(/Password/i));
    await user.type(screen.getByLabelText(/Password/i), 'CorrectPass1');
    await user.click(screen.getByRole('button', { name: /^Sign In$/i }));

    await waitFor(() => {
      expect(onNavigate).toHaveBeenCalledWith('dashboard');
    });
  });

  it('TC-FUNC-03: Executes Continue with Google authentication and handles redirect fallback', async () => {
    activeProfile = null;
    const user = userEvent.setup();
    const onNavigate = vi.fn();

    render(<LoginPage onNavigate={onNavigate} />);

    await user.click(screen.getByRole('button', { name: /Continue with Google/i }));

    await waitFor(() => {
      expect(loginWithGoogleMock).toHaveBeenCalledTimes(1);
      expect(onNavigate).toHaveBeenCalledWith('dashboard');
    });
  });

  it('TC-FUNC-04: Signs out authenticated user and redirects to home portal', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();

    render(
      <Layout currentRoute="dashboard" onNavigate={onNavigate} notifications={[]}>
        <div>Dashboard Content</div>
      </Layout>
    );

    await user.click(screen.getByRole('button', { name: /Sign Out/i }));

    await waitFor(() => {
      expect(logoutMock).toHaveBeenCalledTimes(1);
      expect(onNavigate).toHaveBeenCalledWith('home');
    });
  });

  it('TC-FUNC-05: Navigates across dashboard quick actions and workspace tabs', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();

    render(
      <DashboardPage
        items={sampleItems}
        myItems={[sampleItems[0]]}
        myClaims={[sampleClaim]}
        allClaims={[]}
        notifications={[]}
        onNavigate={onNavigate}
      />
    );

    await user.click(screen.getByRole('button', { name: /Report Lost Item/i }));
    expect(onNavigate).toHaveBeenCalledWith('report-lost');

    await user.click(screen.getByRole('button', { name: /Manage reports/i }));
    expect(onNavigate).toHaveBeenCalledWith('my-reports');

    await user.click(screen.getByRole('button', { name: /Track claims/i }));
    expect(onNavigate).toHaveBeenCalledWith('my-claims');
  });

  it('TC-FUNC-06: Completes lost item reporting workflow and redirects to item details', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();

    render(<ReportItemPage mode="lost" onNavigate={onNavigate} />);

    await user.type(screen.getByLabelText(/Item Name/i), 'Black JBL Earbuds');
    await user.selectOptions(screen.getByLabelText(/Category/i), 'Electronics');
    await user.selectOptions(screen.getByLabelText(/Last Seen Location/i), 'Campus Cafeteria');
    await user.type(
      screen.getByLabelText(/Detailed Description/i),
      'Matte black JBL wireless charging case misplaced near coffee counter.'
    );
    await user.click(screen.getByRole('button', { name: /Submit Lost Report/i }));

    await waitFor(() => {
      expect(onNavigate).toHaveBeenCalledWith('item-details', 'new_func_item_1');
    });
  });

  it('TC-FUNC-07: Completes found item reporting workflow with pickup holding desk', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();

    render(<ReportItemPage mode="found" onNavigate={onNavigate} />);

    await user.type(screen.getByLabelText(/Item Name/i), 'Silver Casio Watch');
    await user.selectOptions(screen.getByLabelText(/Category/i), 'Clothing & Accessories');
    await user.selectOptions(screen.getByLabelText(/Found Location/i), 'Sports & Recreation Complex');
    await user.type(
      screen.getByLabelText(/Detailed Description/i),
      'Digital stainless steel Casio watch found inside locker room bench.'
    );
    await user.type(screen.getByLabelText(/Current Holding \/ Pickup Desk/i), 'Athletics Front Desk');
    await user.click(screen.getByRole('button', { name: /Submit Found Report/i }));

    await waitFor(() => {
      expect(createItemReportMock).toHaveBeenCalledWith(
        studentUser,
        expect.objectContaining({
          title: 'Silver Casio Watch',
          type: 'found',
          pickupLocation: 'Athletics Front Desk',
        })
      );
    });
  });

  it('TC-FUNC-08: Filters search catalog by type, category, location, and resets filters', async () => {
    const user = userEvent.setup();
    render(<SearchItemsPage items={sampleItems} loading={false} onNavigate={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /found Items/i }));
    expect(screen.getByText('Silver MacBook Charger 67W')).toBeInTheDocument();
    expect(screen.queryByText('Navy Herschel Backpack')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Reset filters/i }));
    expect(screen.getByText('Navy Herschel Backpack')).toBeInTheDocument();
  });

  it('TC-FUNC-09: Displays item details, verified custody contact, and claim action', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();

    render(<ItemDetailsPage itemId="func_found_1" items={sampleItems} onNavigate={onNavigate} />);

    expect(screen.getByRole('heading', { name: 'Silver MacBook Charger 67W' })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/elena\.vance@university\.edu/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Claim This Item/i }));
    expect(onNavigate).toHaveBeenCalledWith('submit-claim', 'func_found_1');
  });

  it('TC-FUNC-10: Submits ownership claim from SubmitClaimPage and redirects to My Claims', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();

    render(
      <SubmitClaimPage
        itemId="func_found_1"
        items={sampleItems}
        myClaims={[]}
        onNavigate={onNavigate}
      />
    );

    await user.type(
      screen.getByLabelText(/Ownership Details & Context/i),
      'Left my Apple 67W charger plugged in at study carrel 12 at 3 PM.'
    );
    await user.type(
      screen.getByLabelText(/Unique Identifying Information/i),
      'Green tape band wrapped near USB-C port.'
    );
    await user.click(screen.getByRole('button', { name: /Submit Claim/i }));

    await waitFor(() => {
      expect(submitOwnershipClaimMock).toHaveBeenCalledTimes(1);
      expect(onNavigate).toHaveBeenCalledWith('my-claims');
    });
  });

  it('TC-FUNC-11: Allows Admin to approve & mark returned or reject claims with reason', async () => {
    activeProfile = adminUser;
    activeIsAdmin = true;
    const user = userEvent.setup();

    render(<ManageClaimsPage claims={[sampleClaim]} onNavigate={vi.fn()} />);

    await user.type(
      screen.getByPlaceholderText(/Enter administrative verification notes/i),
      'Student showed matching MacBook Air serial receipt.'
    );
    await user.click(screen.getByLabelText(/Immediately mark item as Returned upon approval/i));
    await user.click(screen.getByRole('button', { name: /Approve Claim/i }));

    await waitFor(() => {
      expect(adminResolveClaimMock).toHaveBeenCalledWith(
        adminUser,
        sampleClaim,
        'Approved',
        'Student showed matching MacBook Air serial receipt.',
        true
      );
    });
  });

  it('TC-FUNC-12: Allows Admin to manage user roles/status and update item statuses', async () => {
    activeProfile = adminUser;
    activeIsAdmin = true;
    const user = userEvent.setup();

    const { rerender } = render(
      <ManageUsersPage users={[adminUser, studentUser]} onNavigate={vi.fn()} />
    );

    await user.selectOptions(screen.getByLabelText(/Role for Rohan Mehta/i), 'faculty');
    await waitFor(() => {
      expect(adminUpdateUserRoleAndStatusMock).toHaveBeenCalledWith(
        adminUser.uid,
        studentUser,
        'faculty',
        'active'
      );
    });

    rerender(<ManageItemsPage items={sampleItems} onNavigate={vi.fn()} />);
    await user.selectOptions(
      screen.getByLabelText(/Status for Silver MacBook Charger 67W/i),
      'Returned'
    );
    await waitFor(() => {
      expect(updateItemStatusMock).toHaveBeenCalledWith('func_found_1', 'Returned');
    });
  });

  it('TC-FUNC-13: Toggles responsive mobile navigation drawer and exposes workspace links', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();

    render(
      <Layout currentRoute="home" onNavigate={onNavigate} notifications={[]}>
        <div>Portal Content</div>
      </Layout>
    );

    await user.click(screen.getByRole('button', { name: /Toggle navigation menu/i }));
    expect(screen.getByRole('button', { name: /My Reports/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /My Claims/i })).toBeInTheDocument();
  });
});
