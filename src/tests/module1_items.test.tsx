import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MyReportsPage } from '../pages/MyReportsPage';
import { ReportItemPage } from '../pages/ReportItemPage';
import type { ItemReport, UserProfile } from '../types/campus';
import { validateImageFile } from '../utils/validation';

const mockStudent: UserProfile = {
  uid: 'student_101',
  fullName: 'Aarav Patel',
  email: 'aarav.patel@university.edu',
  role: 'student',
  department: 'Computer Science',
  campusId: 'STU-2026-101',
  status: 'active',
  createdAt: '2026-11-10T09:00:00Z',
  updatedAt: '2026-11-10T09:00:00Z',
};

const sampleLostItem: ItemReport = {
  id: 'item_lost_1',
  title: 'Dell XPS 13 Laptop',
  type: 'lost',
  category: 'Electronics',
  description: 'Silver Dell XPS laptop inside a dark grey neoprene sleeve.',
  location: 'Central Library',
  dateReported: '2026-11-18',
  status: 'Lost',
  visibility: 'campus',
  imageUrl: '',
  contactSummary: 'Campus Email / Helpdesk Relay',
  reporterId: 'student_101',
  reporterName: 'Aarav Patel',
  reporterRole: 'student',
  keywords: ['dell', 'xps', 'laptop'],
  createdAt: '2026-11-18T10:00:00Z',
  updatedAt: '2026-11-18T10:00:00Z',
};

const showToastMock = vi.fn();
const createItemReportMock = vi.fn();
const updateItemReportMock = vi.fn();
const updateItemStatusMock = vi.fn();
const deleteItemReportMock = vi.fn();
const uploadItemImageMock = vi.fn();

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    profile: mockStudent,
    firebaseUser: { uid: mockStudent.uid, email: mockStudent.email, emailVerified: true },
    loading: false,
    isVerified: true,
    isAdmin: false,
    isFaculty: false,
    isStudent: true,
  }),
}));

vi.mock('../context/ToastContext', () => ({
  useToast: () => ({ showToast: showToastMock }),
}));

vi.mock('../services/itemsService', () => ({
  createItemReport: (...args: unknown[]) => createItemReportMock(...args),
  updateItemReport: (...args: unknown[]) => updateItemReportMock(...args),
  updateItemStatus: (...args: unknown[]) => updateItemStatusMock(...args),
  deleteItemReport: (...args: unknown[]) => deleteItemReportMock(...args),
  uploadItemImage: (...args: unknown[]) => uploadItemImageMock(...args),
}));

describe('Module 1: Lost and Found Item Management', () => {
  beforeEach(() => {
    createItemReportMock.mockResolvedValue('new_item_id_123');
    updateItemReportMock.mockResolvedValue(undefined);
    updateItemStatusMock.mockResolvedValue(undefined);
    deleteItemReportMock.mockResolvedValue(undefined);
    uploadItemImageMock.mockResolvedValue({ url: 'https://storage.example.com/photo.jpg', usedFallback: false });
  });

  it('TC-M1-01: Successfully reports a lost item with valid fields', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();

    render(<ReportItemPage mode="lost" onNavigate={onNavigate} />);

    await user.type(screen.getByLabelText(/Item Name/i), 'Blue Sony Headphones');
    await user.selectOptions(screen.getByLabelText(/Category/i), 'Electronics');
    await user.selectOptions(screen.getByLabelText(/Last Seen Location/i), 'Central Library');
    await user.type(
      screen.getByLabelText(/Detailed Description/i),
      'Navy over-ear noise cancelling headphones left near study carrel 4B.'
    );
    await user.click(screen.getByRole('button', { name: /Submit Lost Report/i }));

    await waitFor(() => {
      expect(createItemReportMock).toHaveBeenCalledTimes(1);
    });
    expect(createItemReportMock).toHaveBeenCalledWith(
      mockStudent,
      expect.objectContaining({
        title: 'Blue Sony Headphones',
        type: 'lost',
        category: 'Electronics',
        location: 'Central Library',
      })
    );
    expect(onNavigate).toHaveBeenCalledWith('item-details', 'new_item_id_123');
  });

  it('TC-M1-02: Successfully reports a found item with valid fields', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();

    render(<ReportItemPage mode="found" onNavigate={onNavigate} />);

    await user.type(screen.getByLabelText(/Item Name/i), 'University Keycard Lanyard');
    await user.selectOptions(screen.getByLabelText(/Category/i), 'ID Cards & Keys');
    await user.selectOptions(screen.getByLabelText(/Found Location/i), 'Student Union Commons');
    await user.type(
      screen.getByLabelText(/Detailed Description/i),
      'Found on cafeteria table near the east entrance with two brass keys.'
    );
    await user.click(screen.getByRole('button', { name: /Submit Found Report/i }));

    await waitFor(() => {
      expect(createItemReportMock).toHaveBeenCalledTimes(1);
    });
    expect(createItemReportMock).toHaveBeenCalledWith(
      mockStudent,
      expect.objectContaining({
        title: 'University Keycard Lanyard',
        type: 'found',
        category: 'ID Cards & Keys',
        location: 'Student Union Commons',
      })
    );
  });

  it('TC-M1-03: Validates required fields and blocks submission when empty', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();

    render(<ReportItemPage mode="lost" onNavigate={onNavigate} />);
    await user.click(screen.getByRole('button', { name: /Submit Lost Report/i }));

    expect(createItemReportMock).not.toHaveBeenCalled();
    expect(screen.getByText(/Item name must be between 2 and 120 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/Description must be between 10 and 2000 characters/i)).toBeInTheDocument();
  });

  it('TC-M1-04: Enforces image file type and size validation', () => {
    const invalidType = validateImageFile({ type: 'application/pdf', size: 1024, name: 'doc.pdf' });
    expect(invalidType.valid).toBe(false);
    expect(invalidType.error).toMatch(/Only JPEG, PNG, and WebP/i);

    const oversized = validateImageFile({ type: 'image/jpeg', size: 6 * 1024 * 1024, name: 'huge.jpg' });
    expect(oversized.valid).toBe(false);
    expect(oversized.error).toMatch(/5 MB/i);

    const validImage = validateImageFile({ type: 'image/png', size: 400_000, name: 'bag.png' });
    expect(validImage.valid).toBe(true);
  });

  it('TC-M1-05: Edits an existing item report from My Reports', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();

    render(<MyReportsPage myItems={[sampleLostItem]} loading={false} onNavigate={onNavigate} />);

    await user.click(screen.getByRole('button', { name: /Edit Dell XPS 13 Laptop/i }));
    const inputs = screen.getAllByRole('textbox');
    await user.clear(inputs[0]);
    await user.type(inputs[0], 'Dell XPS 13 Laptop (Silver)');
    await user.click(screen.getByRole('button', { name: /Save Changes/i }));

    await waitFor(() => {
      expect(updateItemReportMock).toHaveBeenCalledWith(
        'item_lost_1',
        sampleLostItem,
        expect.objectContaining({ title: 'Dell XPS 13 Laptop (Silver)' })
      );
    });
  });

  it('TC-M1-06: Deletes an item report after confirmation dialog', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();

    render(<MyReportsPage myItems={[sampleLostItem]} loading={false} onNavigate={onNavigate} />);

    await user.click(screen.getByRole('button', { name: /Delete Dell XPS 13 Laptop/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^Delete$/i }));

    await waitFor(() => {
      expect(deleteItemReportMock).toHaveBeenCalledWith('item_lost_1');
    });
  });

  it('TC-M1-07: Updates item status cleanly', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();

    render(<MyReportsPage myItems={[sampleLostItem]} loading={false} onNavigate={onNavigate} />);

    await user.selectOptions(screen.getByLabelText(/Status for Dell XPS 13 Laptop/i), 'Returned');

    await waitFor(() => {
      expect(updateItemStatusMock).toHaveBeenCalledWith('item_lost_1', 'Returned');
    });
  });
});
