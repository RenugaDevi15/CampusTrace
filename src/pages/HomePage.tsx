import { useState } from 'react';
import { ArrowRight, CheckCircle2, ClipboardList, Search, ShieldCheck } from 'lucide-react';
import { ItemCard } from '../components/ItemCard';
import { useAuth } from '../context/AuthContext';
import type { AppRoute, ItemReport } from '../types/campus';

interface HomePageProps {
  items: ItemReport[];
  loadingItems: boolean;
  onNavigate: (route: AppRoute, itemId?: string) => void;
  onQuickSearch: (query: string) => void;
}

export function HomePage({ items, loadingItems, onNavigate, onQuickSearch }: HomePageProps) {
  const { profile } = useAuth();
  const [heroQuery, setHeroQuery] = useState('');

  const totalLost = items.filter((i) => i.status === 'Lost').length;
  const totalFound = items.filter((i) => i.status === 'Found').length;
  const totalClaimed = items.filter((i) => i.status === 'Claimed').length;
  const totalReturned = items.filter((i) => i.status === 'Returned').length;
  const recentItems = items.slice(0, 6);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onQuickSearch(heroQuery);
  };

  return (
    <div className="bg-slate-50">
      {/* Hero Section */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            <div className="lg:col-span-7 flex flex-col justify-center">
              <p className="text-xs font-semibold text-blue-700 tracking-wide mb-3">
                Centralized Campus Recovery Portal
              </p>
              <h1
                className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight leading-[1.12]"
                style={{ textWrap: 'balance' }}
              >
                Recover lost campus belongings with verified ownership tracking.
              </h1>
              <p className="mt-4 text-base text-slate-600 leading-relaxed max-w-2xl">
                CampusTrace connects students, faculty, and campus administrators on one transparent platform to report missing items, match found property, and verify rightful returns.
              </p>

              {/* Quick Search Bar */}
              <form onSubmit={handleSearchSubmit} className="mt-7 flex flex-col sm:flex-row gap-3 max-w-xl">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="search"
                    value={heroQuery}
                    onChange={(e) => setHeroQuery(e.target.value)}
                    placeholder="Search laptop, ID card, library, backpack..."
                    aria-label="Search lost and found items"
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  Search Items
                </button>
              </form>

              {/* Primary Role Actions */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => onNavigate('report-lost')}
                  className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors whitespace-nowrap"
                >
                  Report a Lost Item
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('report-found')}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap"
                >
                  Report a Found Item
                </button>
                {!profile && (
                  <button
                    type="button"
                    onClick={() => onNavigate('register')}
                    className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-blue-700 transition-colors whitespace-nowrap"
                  >
                    Create Campus Account
                  </button>
                )}
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="h-full min-h-[260px] lg:min-h-[360px] rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                <img
                  src="/src/assets/images/hero_campus_commons_1795105968647.jpg"
                  alt="Modern university campus commons atrium"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Live 4-Column Campus KPI Strip */}
          <div className="mt-10 pt-8 border-t border-slate-200 grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <div className="text-xs font-medium text-slate-500">Active Lost Reports</div>
              <div className="mt-1 text-2xl font-bold text-slate-900 font-mono tabular-nums">{totalLost}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500">Found &amp; Available</div>
              <div className="mt-1 text-2xl font-bold text-blue-700 font-mono tabular-nums">{totalFound}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500">Claims in Verification</div>
              <div className="mt-1 text-2xl font-bold text-amber-700 font-mono tabular-nums">{totalClaimed}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500">Returned to Owners</div>
              <div className="mt-1 text-2xl font-bold text-emerald-700 font-mono tabular-nums">{totalReturned}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Three-Step Workflow Section */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-5">
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-white">
              <img
                src="/src/assets/images/campus_items_collection_1795105968589.jpg"
                alt="Everyday campus belongings cataloged for lost and found tracking"
                referrerPolicy="no-referrer"
                className="w-full h-72 object-cover"
              />
            </div>
          </div>
          <div className="lg:col-span-7 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Structured Campus Recovery Workflow</h2>
              <p className="mt-2 text-sm text-slate-600 max-w-2xl">
                Every report follows a transparent, role-governed lifecycle from initial submission to verified handover.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <ClipboardList className="w-5 h-5 text-blue-700 mb-3" />
                <h3 className="text-sm font-semibold text-slate-900">01. Log Item Details</h3>
                <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                  Students and faculty submit photos, location, date, and descriptions for lost or found belongings.
                </p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <Search className="w-5 h-5 text-blue-700 mb-3" />
                <h3 className="text-sm font-semibold text-slate-900">02. Match &amp; Claim</h3>
                <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                  Smart suggestions pair lost reports with found items. Owners submit identifying proof to claim.
                </p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <ShieldCheck className="w-5 h-5 text-blue-700 mb-3" />
                <h3 className="text-sm font-semibold text-slate-900">03. Verify &amp; Return</h3>
                <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                  Faculty and administrators audit claims, maintain history logs, and mark items as returned.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Campus Reports */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pb-14">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Recent Lost &amp; Found Reports</h2>
            <p className="mt-1 text-sm text-slate-600">Live updates from the campus database.</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('search')}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:text-blue-800 whitespace-nowrap"
          >
            Browse All Items
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {loadingItems ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white border border-slate-200 rounded-xl h-80 animate-pulse" />
            ))}
          </div>
        ) : recentItems.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
            <p className="text-sm font-medium text-slate-900">No items reported on the campus board yet.</p>
            <p className="mt-1 text-xs text-slate-500">
              Be the first to report a lost or found belonging so campus members can locate it.
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate('report-lost')}
                className="px-4 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg"
              >
                Report Lost Item
              </button>
              <button
                type="button"
                onClick={() => onNavigate('report-found')}
                className="px-4 py-2 text-xs font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Report Found Item
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentItems.map((item) => (
              <ItemCard key={item.id} item={item} onSelect={(id) => onNavigate('item-details', id)} />
            ))}
          </div>
        )}
      </section>

      {/* Helpdesk Accountability Section */}
      <section className="bg-white border-t border-slate-200">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 space-y-4">
              <h2 className="text-2xl font-bold text-slate-900">Accountable Campus Handover</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Every approved ownership claim records reviewer verification notes, timestamped audit history, and updated custody status so Student Services and Campus Security maintain a complete chain of custody.
              </p>
              <ul className="space-y-2.5 text-sm text-slate-700">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0" />
                  <span>Protected reporter contact details visible only to verified campus users</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0" />
                  <span>Role-based access control for Students, Faculty, and Administrators</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0" />
                  <span>Instant in-app notifications when claims are submitted or reviewed</span>
                </li>
              </ul>
            </div>
            <div className="lg:col-span-6">
              <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                <img
                  src="/src/assets/images/campus_helpdesk_return_1795105968663.jpg"
                  alt="University student services helpdesk returning a recovered backpack"
                  referrerPolicy="no-referrer"
                  className="w-full h-72 object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
