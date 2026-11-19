import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SearchItemsPage } from '../pages/SearchItemsPage';
import type { ItemReport } from '../types/campus';
import { getSuggestedMatches } from '../utils/matching';

const catalogItems: ItemReport[] = [
  {
    id: 'item_1',
    title: 'Apple MacBook Pro 14',
    type: 'lost',
    category: 'Electronics',
    description: 'Space black laptop with university robotics sticker on the lid.',
    location: 'Engineering & Science Block',
    dateReported: '2026-11-17',
    status: 'Lost',
    visibility: 'campus',
    imageUrl: '',
    contactSummary: 'Engineering Desk',
    reporterId: 'u1',
    reporterName: 'Liam Chen',
    reporterRole: 'student',
    keywords: ['apple', 'macbook', 'laptop', 'robotics'],
    createdAt: '2026-11-17T10:00:00Z',
    updatedAt: '2026-11-17T10:00:00Z',
  },
  {
    id: 'item_2',
    title: 'Silver Aluminum Laptop',
    type: 'found',
    category: 'Electronics',
    description: 'Found near Engineering lecture hall 2B with robotics sticker.',
    location: 'Engineering & Science Block',
    dateReported: '2026-11-18',
    status: 'Found',
    visibility: 'campus',
    imageUrl: '',
    contactSummary: 'Student Union Helpdesk',
    reporterId: 'u2',
    reporterName: 'Prof. Elena Vance',
    reporterRole: 'faculty',
    keywords: ['laptop', 'robotics', 'engineering'],
    createdAt: '2026-11-18T11:00:00Z',
    updatedAt: '2026-11-18T11:00:00Z',
  },
  {
    id: 'item_3',
    title: 'Calculus III Textbook',
    type: 'found',
    category: 'Books & Notes',
    description: 'Hardcover Stewart Calculus textbook left on second floor quiet desk.',
    location: 'Central Library',
    dateReported: '2026-11-16',
    status: 'Found',
    visibility: 'campus',
    imageUrl: '',
    contactSummary: 'Library Front Desk',
    reporterId: 'u3',
    reporterName: 'Maya Lin',
    reporterRole: 'student',
    keywords: ['calculus', 'textbook', 'stewart'],
    createdAt: '2026-11-16T08:00:00Z',
    updatedAt: '2026-11-16T08:00:00Z',
  },
];

describe('Module 2: Item Search and Matching', () => {
  it('TC-M2-01: Searches items by item name', async () => {
    const user = userEvent.setup();
    render(<SearchItemsPage items={catalogItems} loading={false} onNavigate={vi.fn()} />);

    const searchInput = screen.getByLabelText(/Search by item name or keywords/i);
    await user.type(searchInput, 'Calculus');

    expect(screen.getByText('Calculus III Textbook')).toBeInTheDocument();
    expect(screen.queryByText('Apple MacBook Pro 14')).not.toBeInTheDocument();
  });

  it('TC-M2-02: Searches items using description keywords', async () => {
    const user = userEvent.setup();
    render(<SearchItemsPage items={catalogItems} loading={false} onNavigate={vi.fn()} />);

    const searchInput = screen.getByLabelText(/Search by item name or keywords/i);
    await user.type(searchInput, 'robotics');

    expect(screen.getByText('Apple MacBook Pro 14')).toBeInTheDocument();
    expect(screen.getByText('Silver Aluminum Laptop')).toBeInTheDocument();
    expect(screen.queryByText('Calculus III Textbook')).not.toBeInTheDocument();
  });

  it('TC-M2-03: Filters items by category', async () => {
    const user = userEvent.setup();
    render(<SearchItemsPage items={catalogItems} loading={false} onNavigate={vi.fn()} />);

    await user.selectOptions(screen.getByLabelText(/Filter by category/i), 'Books & Notes');

    expect(screen.getByText('Calculus III Textbook')).toBeInTheDocument();
    expect(screen.queryByText('Apple MacBook Pro 14')).not.toBeInTheDocument();
  });

  it('TC-M2-04: Filters items by campus location', async () => {
    const user = userEvent.setup();
    render(<SearchItemsPage items={catalogItems} loading={false} onNavigate={vi.fn()} />);

    await user.selectOptions(screen.getByLabelText(/Filter by location/i), 'Central Library');

    expect(screen.getByText('Calculus III Textbook')).toBeInTheDocument();
    expect(screen.queryByText('Silver Aluminum Laptop')).not.toBeInTheDocument();
  });

  it('TC-M2-05: Displays matching items and ranks relevant smart suggestions', () => {
    const matches = getSuggestedMatches(catalogItems[0], catalogItems, 3);
    expect(matches.length).toBeGreaterThanOrEqual(1);
    expect(matches[0].item.id).toBe('item_2');
    expect(matches[0].reasons.some((r) => r.includes('Same category'))).toBe(true);
  });

  it('TC-M2-06: Displays clear empty state when no matching item is available', async () => {
    const user = userEvent.setup();
    render(<SearchItemsPage items={catalogItems} loading={false} onNavigate={vi.fn()} />);

    await user.type(screen.getByLabelText(/Search by item name or keywords/i), 'NonExistentItemXYZ');

    expect(screen.getByText(/No matching items found/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Clear All Filters/i })).toBeInTheDocument();
  });

  it('TC-M2-07: Handles empty search input by showing all catalog items', async () => {
    const user = userEvent.setup();
    render(<SearchItemsPage items={catalogItems} loading={false} onNavigate={vi.fn()} />);

    const searchInput = screen.getByLabelText(/Search by item name or keywords/i);
    await user.type(searchInput, 'Calculus');
    expect(screen.queryByText('Apple MacBook Pro 14')).not.toBeInTheDocument();

    await user.clear(searchInput);
    expect(screen.getByText('Apple MacBook Pro 14')).toBeInTheDocument();
    expect(screen.getByText('Silver Aluminum Laptop')).toBeInTheDocument();
    expect(screen.getByText('Calculus III Textbook')).toBeInTheDocument();
  });
});
