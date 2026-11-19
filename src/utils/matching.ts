import type { ItemCategory, ItemReport, ItemStatus, ItemType } from '../types/campus';

export interface ItemSearchFilters {
  query?: string;
  type?: 'all' | ItemType;
  category?: 'All' | ItemCategory | string;
  location?: 'All' | string;
  status?: 'All' | ItemStatus | string;
  dateFrom?: string;
  dateTo?: string;
}

export interface SuggestedMatch {
  item: ItemReport;
  score: number;
  reasons: string[];
}

export function normalizeTimestampToMs(value: unknown): number {
  if (!value) return 0;
  if (typeof value === 'object' && value !== null && 'toMillis' in value && typeof (value as { toMillis: () => number }).toMillis === 'function') {
    return (value as { toMillis: () => number }).toMillis();
  }
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

export function sortItemsByNewest(items: ItemReport[]): ItemReport[] {
  return [...items].sort((a, b) => {
    const diff = normalizeTimestampToMs(b.createdAt) - normalizeTimestampToMs(a.createdAt);
    if (diff !== 0) return diff;
    return b.dateReported.localeCompare(a.dateReported);
  });
}

export function searchAndFilterItems(items: ItemReport[], filters: ItemSearchFilters): ItemReport[] {
  const rawQuery = (filters.query || '').trim().toLowerCase();
  const tokens = rawQuery.split(/\s+/).filter(Boolean);

  const filtered = items.filter((item) => {
    if (filters.type && filters.type !== 'all' && item.type !== filters.type) {
      return false;
    }

    if (filters.category && filters.category !== 'All' && item.category !== filters.category) {
      return false;
    }

    if (
      filters.location &&
      filters.location !== 'All' &&
      !item.location.toLowerCase().includes(filters.location.toLowerCase())
    ) {
      return false;
    }

    if (filters.status && filters.status !== 'All' && item.status !== filters.status) {
      return false;
    }

    if (filters.dateFrom && item.dateReported < filters.dateFrom) {
      return false;
    }

    if (filters.dateTo && item.dateReported > filters.dateTo) {
      return false;
    }

    if (tokens.length > 0) {
      const searchable = [
        item.title,
        item.description,
        item.category,
        item.location,
        item.reporterName,
        ...(item.keywords || []),
      ]
        .join(' ')
        .toLowerCase();

      const allTokensMatch = tokens.every((token) => searchable.includes(token));
      if (!allTokensMatch) {
        return false;
      }
    }

    return true;
  });

  return sortItemsByNewest(filtered);
}

export function getSuggestedMatches(
  target: ItemReport,
  candidates: ItemReport[],
  limit = 4
): SuggestedMatch[] {
  const targetTokens = new Set(
    `${target.title} ${target.description}`
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 3)
  );

  const scored: SuggestedMatch[] = [];

  for (const candidate of candidates) {
    if (candidate.id === target.id) continue;
    if (candidate.status === 'Returned') continue;

    let score = 0;
    const reasons: string[] = [];

    // Opposite type (lost <-> found) gets priority
    if (candidate.type !== target.type) {
      score += 30;
      reasons.push(candidate.type === 'found' ? 'Reported found item' : 'Reported lost item');
    }

    if (candidate.category === target.category) {
      score += 35;
      reasons.push(`Same category (${candidate.category})`);
    }

    if (
      candidate.location.toLowerCase() === target.location.toLowerCase() ||
      candidate.location.toLowerCase().includes(target.location.toLowerCase()) ||
      target.location.toLowerCase().includes(candidate.location.toLowerCase())
    ) {
      score += 20;
      reasons.push(`Matching location (${candidate.location})`);
    }

    const candidateWords = new Set(
      `${candidate.title} ${candidate.description} ${(candidate.keywords || []).join(' ')}`
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length >= 3)
    );

    let overlapCount = 0;
    for (const token of targetTokens) {
      if (candidateWords.has(token)) {
        overlapCount += 1;
      }
    }

    if (overlapCount > 0) {
      score += Math.min(overlapCount * 10, 30);
      reasons.push(`${overlapCount} matching keyword${overlapCount > 1 ? 's' : ''}`);
    }

    if (score >= 35 && reasons.length > 0) {
      scored.push({ item: candidate, score, reasons });
    }
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
