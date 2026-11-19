import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReportItemPage } from '../../pages/ReportItemPage';
import { SearchItemsPage } from '../../pages/SearchItemsPage';
import { SubmitClaimPage } from '../../pages/SubmitClaimPage';
import type { ItemReport, UserProfile } from '../../types/campus';
import { validateImageFile, validateRegistrationInput } from '../../utils/validation';

const mockStudent: UserProfile = {
  uid: 'stu_val_1',
  fullName: 'Nadia Khan',
  email: 'nadia@university.edu',
  role: 'student',
  department: 'Physics',
  campusId: 'STU-900',
  status: 'active',
  createdAt: '2026-11-10T09:00:00Z',
  updatedAt: '2026-11-10T09:00:00Z',
};

const registerWithEmailMock = vi.fn();
const loginWithEmailMock = vi.fn();
const loginWithGoogleMock = vi.fn();
const createItemReportMock = vi.fn();
const submitOwnershipClaimMock = vi.fn();
const showToastMock = vi.fn();

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    profile: mockStudent,
    firebaseUser: { uid: mockStudent.uid, email: mockStudent.email, emailVerified: true },
    isAdmin: false,
    isFaculty: false,
    isStudent: true,
    isVerified: true,
    loading: false,
    registerWithEmail: (...args: unknown[]) => registerWithEmailMock(...args),
    loginWithEmail: (...args: unknown[]) => loginWithEmailMock(...args),
    loginWithGoogle: (...args: unknown[]) => loginWithGoogleMock(...args),
    sendResetPassword: vi.fn(),
  }),
}));

vi.mock('../../context/ToastContext', () => ({
  useToast: () => ({ showToast: showToastMock }),
}));

vi.mock('../../services/itemsService', () => ({
  createItemReport: (...args: unknown[]) => createItemReportMock(...args),
  uploadItemImage: vi.fn(),
}));

vi.mock('../../services/claimsService', () => ({
  submitOwnershipClaim: (...args: unknown[]) => submitOwnershipClaimMock(...args),
}));

import { LoginPage } from '../../pages/LoginPage';
import { RegisterPage } from '../../pages/RegisterPage';

const foundItem: ItemReport = {
  id: 'found_val_1',
  title: 'Sony WH-1000XM5 Headphones',
  type: 'found',
  category: 'Electronics',
  description: 'Matte black wireless headphones found in auditorium seat G12.',
  location: 'Main Auditorium',
  dateReported: '2026-11-18',
  status: 'Found',
  visibility: 'campus',
  imageUrl: '',
  contactSummary: 'Student Services Room 102',
  reporterId: 'fac_1',
  reporterName: 'Prof. Rao',
  reporterRole: 'faculty',
  keywords: ['sony', 'headphones'],
  createdAt: '2026-11-18T10:00:00Z',
  updatedAt: '2026-11-18T10:00:00Z',
};

describe('Validation Testing Suite', () => {
  beforeEach(() => {
    registerWithEmailMock.mockReset();
    loginWithEmailMock.mockReset();
    createItemReportMock.mockReset();
    submitOwnershipClaimMock.mockReset();
  });

  it('TC-VAL-01: Blocks empty registration and login form submissions with field errors', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<RegisterPage onNavigate={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /Create Account/i }));
    expect(registerWithEmailMock).not.toHaveBeenCalled();
    expect(screen.getByText(/Full name must be between 2 and 100 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/Please confirm your password/i)).toBeInTheDocument();
    unmount();

    render(<LoginPage onNavigate={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: /^Sign In$/i }));
    expect(loginWithEmailMock).not.toHaveBeenCalled();
    expect(screen.getByText(/Email address is required/i)).toBeInTheDocument();
    expect(screen.getByText(/Password is required/i)).toBeInTheDocument();
  });

  it('TC-VAL-02: Rejects invalid email formats across registration and login', async () => {
    const user = userEvent.setup();
    render(<LoginPage onNavigate={vi.fn()} />);

    await user.type(screen.getByLabelText(/University Email/i), 'invalid-email-format');
    await user.type(screen.getByLabelText(/Password/i), 'Campus123');
    await user.click(screen.getByRole('button', { name: /^Sign In$/i }));

    expect(loginWithEmailMock).not.toHaveBeenCalled();
    expect(screen.getByText(/Please enter a valid university email address/i)).toBeInTheDocument();
  });

  it('TC-VAL-03: Rejects weak passwords lacking length or alphanumeric mix', () => {
    const shortPwd = validateRegistrationInput({
      fullName: 'Priya Sharma',
      email: 'priya@university.edu',
      password: 'ab1',
      confirmPassword: 'ab1',
      role: 'student',
      department: 'CS',
      campusId: 'STU-10',
    });
    expect(shortPwd.valid).toBe(false);
    expect(shortPwd.errors.password).toMatch(/at least 6 characters/i);

    const alphaOnlyPwd = validateRegistrationInput({
      fullName: 'Priya Sharma',
      email: 'priya@university.edu',
      password: 'onlyletters',
      confirmPassword: 'onlyletters',
      role: 'student',
      department: 'CS',
      campusId: 'STU-10',
    });
    expect(alphaOnlyPwd.valid).toBe(false);
    expect(alphaOnlyPwd.errors.password).toMatch(/letters and at least one number/i);
  });

  it('TC-VAL-04: Rejects mismatched password and confirm password entries', async () => {
    const user = userEvent.setup();
    render(<RegisterPage onNavigate={vi.fn()} />);

    await user.type(screen.getByLabelText(/Full Name/i), 'Priya Sharma');
    await user.type(screen.getByLabelText(/Student ID/i), 'STU-2026-041');
    await user.type(screen.getByLabelText(/Department/i), 'Computer Science');
    await user.type(screen.getByLabelText(/University Email/i), 'priya@university.edu');
    await user.type(screen.getByLabelText(/^Password \*/i), 'Campus2026');
    await user.type(screen.getByLabelText(/Confirm Password/i), 'Campus9999');
    await user.click(screen.getByRole('button', { name: /Create Account/i }));

    expect(registerWithEmailMock).not.toHaveBeenCalled();
    expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument();
  });

  it('TC-VAL-05: Displays clear error when registering with an already registered email', async () => {
    registerWithEmailMock.mockRejectedValue(
      new Error('This email address is already registered. Please sign in or use a different email.')
    );
    const user = userEvent.setup();
    render(<RegisterPage onNavigate={vi.fn()} />);

    await user.type(screen.getByLabelText(/Full Name/i), 'Priya Sharma');
    await user.type(screen.getByLabelText(/Student ID/i), 'STU-2026-041');
    await user.type(screen.getByLabelText(/Department/i), 'Computer Science');
    await user.type(screen.getByLabelText(/University Email/i), 'existing@university.edu');
    await user.type(screen.getByLabelText(/^Password \*/i), 'Campus2026');
    await user.type(screen.getByLabelText(/Confirm Password/i), 'Campus2026');
    await user.click(screen.getByRole('button', { name: /Create Account/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/already registered/i);
    });
  });

  it('TC-VAL-06: Rejects missing item name and short description on item reporting', async () => {
    const user = userEvent.setup();
    render(<ReportItemPage mode="lost" onNavigate={vi.fn()} />);

    await user.type(screen.getByLabelText(/Item Name/i), 'A');
    await user.type(screen.getByLabelText(/Detailed Description/i), 'short');
    await user.click(screen.getByRole('button', { name: /Submit Lost Report/i }));

    expect(createItemReportMock).not.toHaveBeenCalled();
    expect(screen.getByText(/Item name must be between 2 and 120 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/Description must be between 10 and 2000 characters/i)).toBeInTheDocument();
  });

  it('TC-VAL-07: Rejects invalid calendar dates during item validation', async () => {
    const { validateItemInput } = await import('../../utils/validation');
    const badFormat = validateItemInput({
      title: 'Black Umbrella',
      type: 'lost',
      category: 'Other',
      description: 'Foldable black umbrella lost near cafeteria.',
      location: 'Campus Cafeteria',
      dateReported: '19-11-2026',
      contactSummary: 'Desk 1',
      contactDetails: 'student@university.edu',
    });
    expect(badFormat.valid).toBe(false);
    expect(badFormat.errors.dateReported).toMatch(/YYYY-MM-DD/i);

    const impossibleDate = validateItemInput({
      title: 'Black Umbrella',
      type: 'lost',
      category: 'Other',
      description: 'Foldable black umbrella lost near cafeteria.',
      location: 'Campus Cafeteria',
      dateReported: '2026-02-30',
      contactSummary: 'Desk 1',
      contactDetails: 'student@university.edu',
    });
    expect(impossibleDate.valid).toBe(false);
    expect(impossibleDate.errors.dateReported).toMatch(/valid calendar date/i);
  });

  it('TC-VAL-08: Rejects missing custom campus location when Other is selected', async () => {
    const user = userEvent.setup();
    render(<ReportItemPage mode="found" onNavigate={vi.fn()} />);

    await user.type(screen.getByLabelText(/Item Name/i), 'Black Leather Wallet');
    await user.selectOptions(screen.getByLabelText(/Found Location/i), '__other__');
    await user.type(
      screen.getByLabelText(/Detailed Description/i),
      'Black leather bifold wallet found near campus shuttle stop.'
    );
    await user.click(screen.getByRole('button', { name: /Submit Found Report/i }));

    expect(createItemReportMock).not.toHaveBeenCalled();
    expect(screen.getByText(/Location must be between 2 and 150 characters/i)).toBeInTheDocument();
  });

  it('TC-VAL-09: Rejects unsupported non-raster image formats (PDF, SVG)', () => {
    const pdfResult = validateImageFile({ type: 'application/pdf', size: 12000, name: 'doc.pdf' });
    expect(pdfResult.valid).toBe(false);
    expect(pdfResult.error).toMatch(/Only JPEG, PNG, and WebP/i);

    const svgResult = validateImageFile({ type: 'image/svg+xml', size: 2048, name: 'vector.svg' });
    expect(svgResult.valid).toBe(false);
    expect(svgResult.error).toMatch(/Only JPEG, PNG, and WebP/i);
  });

  it('TC-VAL-10: Rejects oversized image files exceeding 5 MB limit', () => {
    const largeFile = validateImageFile({ type: 'image/png', size: 6 * 1024 * 1024, name: 'large.png' });
    expect(largeFile.valid).toBe(false);
    expect(largeFile.error).toMatch(/must not exceed 5 MB/i);

    const emptyFile = validateImageFile({ type: 'image/jpeg', size: 0, name: 'empty.jpg' });
    expect(emptyFile.valid).toBe(false);
    expect(emptyFile.error).toMatch(/empty/i);
  });

  it('TC-VAL-11: Rejects empty or insufficient ownership claim details', async () => {
    const user = userEvent.setup();
    render(
      <SubmitClaimPage
        itemId="found_val_1"
        items={[foundItem]}
        myClaims={[]}
        onNavigate={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: /Submit Claim/i }));
    expect(submitOwnershipClaimMock).not.toHaveBeenCalled();
    expect(screen.getByText(/Ownership proof must be at least 15 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/Identifying features must be at least 5 characters/i)).toBeInTheDocument();
  });

  it('TC-VAL-12: Flags invalid search input containing HTML/script angle brackets', async () => {
    const user = userEvent.setup();
    render(<SearchItemsPage items={[foundItem]} loading={false} onNavigate={vi.fn()} />);

    const searchInput = screen.getByLabelText(/Search by item name or keywords/i);
    await user.type(searchInput, '<script>alert(1)</script>');

    expect(screen.getByRole('alert')).toHaveTextContent(/unsupported characters/i);
  });
});
