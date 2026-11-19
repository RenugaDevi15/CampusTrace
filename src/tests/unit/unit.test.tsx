import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ManageClaimsPage } from '../../pages/ManageClaimsPage';
import { ManageItemsPage } from '../../pages/ManageItemsPage';
import { MyReportsPage } from '../../pages/MyReportsPage';
import { ReportItemPage } from '../../pages/ReportItemPage';
import { SubmitClaimPage } from '../../pages/SubmitClaimPage';
import type { ClaimRequest, ItemReport, UserProfile } from '../../types/campus';
import { searchAndFilterItems } from '../../utils/matching';
import { validateLoginInput, validateRegistrationInput } from '../../utils/validation';

const mockStudent: UserProfile = {
  uid: 'stu_unit_1',
  fullName: 'Aarav Patel',
  email: 'aarav.patel@university.edu',
  role: 'student',
  department: 'Computer Science',
  campusId: 'STU-2026-101',
  status: 'active',
  createdAt: '2026-11-10T09:00:00Z',
  updatedAt: '2026-11-10T09:00:00Z',
};

const mockAdmin: UserProfile = {
  uid: 'adm_unit_1',
  fullName: 'Campus Admin',
  email: 'admin@university.edu',
  role: 'admin',
  department: 'Campus Security',
  campusId: 'ADM-001',
  status: 'active',
  createdAt: '2026-11-01T09:00:00Z',
  updatedAt: '2026-11-01T09:00:00Z',
};

let activeUser: UserProfile = mockStudent;
let activeIsAdmin = false;

const createItemReportMock = vi.fn();
const updateItemStatusMock = vi.fn();
const submitOwnershipClaimMock = vi.fn();
const adminResolveClaimMock = vi.fn();
const showToastMock = vi.fn();

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    profile: activeUser,
    firebaseUser: { uid: activeUser.uid, email: activeUser.email, emailVerified: true },
    isAdmin: activeIsAdmin,
    isFaculty: false,
    isStudent: !activeIsAdmin,
    isVerified: true,
    loading: false,
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
}));

vi.mock('../../services/claimsService', () => ({
  submitOwnershipClaim: (...args: unknown[]) => submitOwnershipClaimMock(...args),
  adminResolveClaim: (...args: unknown[]) => adminResolveClaimMock(...args),
}));

const sampleCatalog: ItemReport[] = [
  {
    id: 'item_u1',
    title: 'Silver MacBook Air M2',
    type: 'lost',
    category: 'Electronics',
    description: '13-inch silver laptop with IEEE sticker on corner.',
    location: 'Central Library',
    dateReported: '2026-11-18',
    status: 'Lost',
    visibility: 'campus',
    imageUrl: '',
    contactSummary: 'Campus Email Relay',
    reporterId: 'stu_unit_1',
    reporterName: 'Aarav Patel',
    reporterRole: 'student',
    keywords: ['macbook', 'laptop', 'ieee'],
    createdAt: '2026-11-18T10:00:00Z',
    updatedAt: '2026-11-18T10:00:00Z',
  },
  {
    id: 'item_u2',
    title: 'Linear Algebra Textbook',
    type: 'found',
    category: 'Books & Notes',
    description: 'Gilbert Strang hardcover textbook found on Room 204 desk.',
    location: 'Engineering & Science Block',
    dateReported: '2026-11-17',
    status: 'Found',
    visibility: 'campus',
    imageUrl: '',
    contactSummary: 'Student Union Helpdesk',
    reporterId: 'fac_99',
    reporterName: 'Prof. Menon',
    reporterRole: 'faculty',
    keywords: ['algebra', 'textbook', 'strang'],
    createdAt: '2026-11-17T10:00:00Z',
    updatedAt: '2026-11-17T10:00:00Z',
  },
];

const sampleClaim: ClaimRequest = {
  id: 'claim_u1',
  itemId: 'item_u2',
  itemTitle: 'Linear Algebra Textbook',
  itemCategory: 'Books & Notes',
  itemReporterId: 'fac_99',
  claimantId: 'stu_unit_1',
  claimantName: 'Aarav Patel',
  claimantEmail: 'aarav.patel@university.edu',
  claimantRole: 'student',
  ownershipProof: 'Left my textbook in Room 204 immediately after 10 AM lecture.',
  identifyingFeatures: 'Handwritten name Aarav P. on inside cover page.',
  supportingImageUrl: '',
  status: 'Pending',
  reviewerId: '',
  reviewerName: '',
  reviewNotes: '',
  history: ['2026-11-18 · Claim submitted by Aarav Patel'],
  createdAt: '2026-11-18T11:00:00Z',
  updatedAt: '2026-11-18T11:00:00Z',
};

describe('Unit Testing Suite', () => {
  beforeEach(() => {
    activeUser = mockStudent;
    activeIsAdmin = false;
    createItemReportMock.mockResolvedValue('item_created_1');
    updateItemStatusMock.mockResolvedValue(undefined);
    submitOwnershipClaimMock.mockResolvedValue('claim_created_1');
    adminResolveClaimMock.mockResolvedValue(undefined);
  });

  it('TC-UNIT-01: Validates registration input fields and password confirmation', () => {
    const valid = validateRegistrationInput({
      fullName: 'Priya Sharma',
      email: 'priya.sharma@university.edu',
      password: 'Campus2026',
      confirmPassword: 'Campus2026',
      role: 'student',
      department: 'Computer Science',
      campusId: 'STU-2026-041',
    });
    expect(valid.valid).toBe(true);
    expect(valid.errors).toEqual({});

    const invalid = validateRegistrationInput({
      fullName: 'P',
      email: 'bad-email',
      password: '123',
      confirmPassword: '456',
      role: 'student',
      department: '',
      campusId: '',
    });
    expect(invalid.valid).toBe(false);
    expect(invalid.errors.fullName).toBeDefined();
    expect(invalid.errors.email).toBeDefined();
    expect(invalid.errors.password).toBeDefined();
    expect(invalid.errors.confirmPassword).toBeDefined();
  });

  it('TC-UNIT-02: Validates login input credentials independently', () => {
    const ok = validateLoginInput({ email: 'student@university.edu', password: 'Password1' });
    expect(ok.valid).toBe(true);

    const missing = validateLoginInput({ email: '', password: '' });
    expect(missing.valid).toBe(false);
    expect(missing.errors.email).toMatch(/required/i);
    expect(missing.errors.password).toMatch(/required/i);
  });

  it('TC-UNIT-03: Submits lost item report with structured payload', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();

    render(<ReportItemPage mode="lost" onNavigate={onNavigate} />);

    await user.type(screen.getByLabelText(/Item Name/i), 'Graphing Calculator TI-84');
    await user.selectOptions(screen.getByLabelText(/Category/i), 'Electronics');
    await user.selectOptions(screen.getByLabelText(/Last Seen Location/i), 'Central Library');
    await user.type(
      screen.getByLabelText(/Detailed Description/i),
      'Black TI-84 Plus CE calculator left in study room 2C.'
    );
    await user.click(screen.getByRole('button', { name: /Submit Lost Report/i }));

    await waitFor(() => {
      expect(createItemReportMock).toHaveBeenCalledWith(
        mockStudent,
        expect.objectContaining({
          title: 'Graphing Calculator TI-84',
          type: 'lost',
          category: 'Electronics',
        })
      );
    });
  });

  it('TC-UNIT-04: Submits found item report with structured payload', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();

    render(<ReportItemPage mode="found" onNavigate={onNavigate} />);

    await user.type(screen.getByLabelText(/Item Name/i), 'Campus Hostel Keychain');
    await user.selectOptions(screen.getByLabelText(/Category/i), 'ID Cards & Keys');
    await user.selectOptions(screen.getByLabelText(/Found Location/i), 'Campus Cafeteria');
    await user.type(
      screen.getByLabelText(/Detailed Description/i),
      'Blue lanyard with two silver room keys found near counter.'
    );
    await user.click(screen.getByRole('button', { name: /Submit Found Report/i }));

    await waitFor(() => {
      expect(createItemReportMock).toHaveBeenCalledWith(
        mockStudent,
        expect.objectContaining({
          title: 'Campus Hostel Keychain',
          type: 'found',
          category: 'ID Cards & Keys',
          location: 'Campus Cafeteria',
        })
      );
    });
  });

  it('TC-UNIT-05: Searches catalog items by title and keyword tokens', () => {
    const byTitle = searchAndFilterItems(sampleCatalog, { query: 'MacBook' });
    expect(byTitle).toHaveLength(1);
    expect(byTitle[0].id).toBe('item_u1');

    const byKeyword = searchAndFilterItems(sampleCatalog, { query: 'strang' });
    expect(byKeyword).toHaveLength(1);
    expect(byKeyword[0].id).toBe('item_u2');
  });

  it('TC-UNIT-06: Filters catalog items accurately by category and status', () => {
    const booksOnly = searchAndFilterItems(sampleCatalog, { category: 'Books & Notes' });
    expect(booksOnly).toHaveLength(1);
    expect(booksOnly[0].title).toBe('Linear Algebra Textbook');

    const lostOnly = searchAndFilterItems(sampleCatalog, { status: 'Lost' });
    expect(lostOnly).toHaveLength(1);
    expect(lostOnly[0].title).toBe('Silver MacBook Air M2');
  });

  it('TC-UNIT-07: Submits ownership claim unit payload from SubmitClaimPage', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();

    render(
      <SubmitClaimPage
        itemId="item_u2"
        items={sampleCatalog}
        myClaims={[]}
        onNavigate={onNavigate}
      />
    );

    await user.type(
      screen.getByLabelText(/Ownership Details & Context/i),
      'I left my Linear Algebra textbook in Room 204 right after Tuesday morning lecture.'
    );
    await user.type(
      screen.getByLabelText(/Unique Identifying Information/i),
      'Handwritten name Aarav P. on inside cover.'
    );
    await user.click(screen.getByRole('button', { name: /Submit Claim/i }));

    await waitFor(() => {
      expect(submitOwnershipClaimMock).toHaveBeenCalledWith(
        mockStudent,
        sampleCatalog[1],
        expect.objectContaining({
          itemId: 'item_u2',
        })
      );
    });
  });

  it('TC-UNIT-08: Approves and rejects claims with review notes in ManageClaimsPage', async () => {
    activeUser = mockAdmin;
    activeIsAdmin = true;
    const user = userEvent.setup();

    const { rerender } = render(<ManageClaimsPage claims={[sampleClaim]} onNavigate={vi.fn()} />);

    await user.type(
      screen.getByPlaceholderText(/Enter administrative verification notes/i),
      'Verified inside cover signature.'
    );
    await user.click(screen.getByRole('button', { name: /Approve Claim/i }));

    await waitFor(() => {
      expect(adminResolveClaimMock).toHaveBeenCalledWith(
        mockAdmin,
        sampleClaim,
        'Approved',
        'Verified inside cover signature.',
        false
      );
    });

    rerender(<ManageClaimsPage claims={[{ ...sampleClaim, id: 'claim_u2' }]} onNavigate={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: /Reject Claim/i }));

    await waitFor(() => {
      expect(adminResolveClaimMock).toHaveBeenCalledWith(
        mockAdmin,
        expect.objectContaining({ id: 'claim_u2' }),
        'Rejected',
        expect.any(String),
        false
      );
    });
  });

  it('TC-UNIT-09: Updates item status in MyReportsPage and ManageItemsPage', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <MyReportsPage myItems={[sampleCatalog[0]]} loading={false} onNavigate={vi.fn()} />
    );

    await user.selectOptions(screen.getByLabelText(/Status for Silver MacBook Air M2/i), 'Claimed');
    await waitFor(() => {
      expect(updateItemStatusMock).toHaveBeenCalledWith('item_u1', 'Claimed');
    });

    activeUser = mockAdmin;
    activeIsAdmin = true;
    rerender(<ManageItemsPage items={sampleCatalog} onNavigate={vi.fn()} />);

    await user.selectOptions(screen.getByLabelText(/Status for Linear Algebra Textbook/i), 'Returned');
    await waitFor(() => {
      expect(updateItemStatusMock).toHaveBeenCalledWith('item_u2', 'Returned');
    });
  });
});
