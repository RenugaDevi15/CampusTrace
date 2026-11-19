import { useMemo, useState } from 'react';
import { FilterX, Search } from 'lucide-react';
import { ItemCard } from '../components/ItemCard';
import {
  CAMPUS_LOCATIONS,
  ITEM_CATEGORIES,
  ITEM_STATUSES,
  type AppRoute,
  type ItemReport,
  type ItemType,
} from '../types/campus';
import { searchAndFilterItems } from '../utils/matching';
import { validateSearchQuery } from '../utils/validation';

interface SearchItemsPageProps {
  items: ItemReport[];
  loading: boolean;
  initialQuery?: string;
  onNavigate: (route: AppRoute, itemId?: string) => void;
}

export function SearchItemsPage({ items, loading, initialQuery = '', onNavigate }: SearchItemsPageProps) {
  const [query, setQuery] = useState(initialQuery);
  const [typeFilter, setTypeFilter] = useState<'all' | ItemType>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [locationFilter, setLocationFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const availableLocations = useMemo(() => {
    const set = new Set<string>(CAMPUS_LOCATIONS);
    items.forEach((i) => {
      if (i.location) set.add(i.location);
    });
    return Array.from(set).sort();
  }, [items]);

  const queryValidation = useMemo(() => validateSearchQuery(query), [query]);

  const filteredItems = useMemo(
    () =>
      searchAndFilterItems(items, {
        query: queryValidation.sanitized,
        type: typeFilter,
        category: categoryFilter,
        location: locationFilter,
        status: statusFilter,
        dateFrom,
        dateTo,
      }),
    [items, queryValidation.sanitized, typeFilter, categoryFilter, locationFilter, statusFilter, dateFrom, dateTo]
  );

  const hasActiveFilters =
    Boolean(query.trim()) ||
    typeFilter !== 'all' ||
    categoryFilter !== 'All' ||
    locationFilter !== 'All' ||
    statusFilter !== 'All' ||
    Boolean(dateFrom) ||
    Boolean(dateTo);

  const resetFilters = () => {
    setQuery('');
    setTypeFilter('all');
    setCategoryFilter('All');
    setLocationFilter('All');
    setStatusFilter('All');
    setDateFrom('');
    setDateTo('');
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Search Campus Lost &amp; Found</h1>
          <p className="mt-1 text-sm text-slate-600">
            Filter reported items by keyword, category, campus building, date, and current status.
          </p>
        </div>

        {/* Type Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg w-fit">
          {(['all', 'lost', 'found'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap capitalize ${
                typeFilter === t ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t === 'all' ? 'All Reports' : `${t} Items`}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Panel */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by item name, brand, or keywords..."
              aria-label="Search by item name or keywords"
              className="w-full pl-10 pr-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            {!queryValidation.valid && queryValidation.error && (
              <p role="alert" className="mt-1 text-xs text-red-600">
                {queryValidation.error}
              </p>
            )}
          </div>

          <div className="md:col-span-3">
            <select
              aria-label="Filter by category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="All">All Categories</option>
              {ITEM_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              aria-label="Filter by location"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="All">All Locations</option>
              {availableLocations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="All">All Statuses</option>
              {ITEM_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
            <label className="flex items-center gap-2">
              <span>From</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-2.5 py-1 border border-slate-300 rounded-md font-mono text-xs"
              />
            </label>
            <label className="flex items-center gap-2">
              <span>To</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-2.5 py-1 border border-slate-300 rounded-md font-mono text-xs"
              />
            </label>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-500 font-mono tabular-nums">
              {filteredItems.length} matching item{filteredItems.length === 1 ? '' : 's'}
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 hover:text-blue-800"
              >
                <FilterX className="w-3.5 h-3.5" />
                Reset filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="bg-white border border-slate-200 rounded-xl h-80 animate-pulse" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <h2 className="text-base font-semibold text-slate-900">No matching items found</h2>
          <p className="mt-1.5 text-sm text-slate-600 max-w-md mx-auto">
            Try broadening your keywords or clearing active filters. If your item has not been reported yet, submit a lost item report so others can reach you.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="px-4 py-2 text-xs font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Clear All Filters
              </button>
            )}
            <button
              type="button"
              onClick={() => onNavigate('report-lost')}
              className="px-4 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg"
            >
              Report Lost Item
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <ItemCard key={item.id} item={item} onSelect={(id) => onNavigate('item-details', id)} />
          ))}
        </div>
      )}
    </div>
  );
}
