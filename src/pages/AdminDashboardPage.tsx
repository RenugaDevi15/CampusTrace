import { ArrowRight, CheckCircle2, ClipboardCheck, FlaskConical, PackageSearch, ShieldAlert, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ClaimStatusLabel } from './MyClaimsPage';
import { ITEM_CATEGORIES, type AppRoute, type ClaimRequest, type ItemReport, type UserProfile } from '../types/campus';

interface AdminDashboardPageProps {
  items: ItemReport[];
  claims: ClaimRequest[];
  users: UserProfile[];
  onNavigate: (route: AppRoute, itemId?: string) => void;
}

export function AdminDashboardPage({ items, claims, users, onNavigate }: AdminDashboardPageProps) {
  const { profile, isAdmin } = useAuth();

  if (!profile || !isAdmin) {
    return (
      <div className="max-w-lg mx-auto my-12 bg-white border border-slate-200 rounded-xl p-8 text-center">
        <ShieldAlert className="w-8 h-8 text-red-600 mx-auto mb-3" />
        <h1 className="text-xl font-bold text-slate-900">Administrator Access Required</h1>
        <p className="mt-2 text-sm text-slate-600">
          You do not have permission to view campus administration controls.
        </p>
        <button
          type="button"
          onClick={() => onNavigate('dashboard')}
          className="mt-5 px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const totalLost = items.filter((i) => i.status === 'Lost').length;
  const totalFound = items.filter((i) => i.status === 'Found').length;
  const pendingClaims = claims.filter((c) => c.status === 'Pending' || c.status === 'Faculty Verified').length;
  const approvedClaims = claims.filter((c) => c.status === 'Approved').length;
  const returnedItems = items.filter((i) => i.status === 'Returned').length;

  const categoryStats = ITEM_CATEGORIES.map((category) => ({
    category,
    count: items.filter((i) => i.category === category).length,
  }));
  const maxCategoryCount = Math.max(1, ...categoryStats.map((c) => c.count));

  const recentClaims = claims.slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Campus Administration Overview</h1>
          <p className="mt-1 text-sm text-slate-600">
            Centralized oversight of lost reports, found inventory, claim verification, and user roles.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onNavigate('manage-claims')}
            className="px-4 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg whitespace-nowrap"
          >
            Review Claims ({pendingClaims})
          </button>
          <button
            type="button"
            onClick={() => onNavigate('manage-items')}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg whitespace-nowrap"
          >
            Manage Items
          </button>
          <button
            type="button"
            onClick={() => onNavigate('testing-qa')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg whitespace-nowrap"
          >
            <FlaskConical className="w-3.5 h-3.5" />
            Testing &amp; QA
          </button>
        </div>
      </div>

      {/* 5 Core Admin Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500">Total Lost Items</div>
          <div className="mt-2 text-3xl font-bold text-slate-900 font-mono tabular-nums">{totalLost}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500">Total Found Items</div>
          <div className="mt-2 text-3xl font-bold text-blue-700 font-mono tabular-nums">{totalFound}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500">Pending Claims</div>
          <div className="mt-2 text-3xl font-bold text-amber-700 font-mono tabular-nums">{pendingClaims}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500">Approved Claims</div>
          <div className="mt-2 text-3xl font-bold text-emerald-700 font-mono tabular-nums">{approvedClaims}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500">Returned Items</div>
          <div className="mt-2 text-3xl font-bold text-slate-900 font-mono tabular-nums">{returnedItems}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Breakdown */}
        <section className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Reports by Category</h2>
          <div className="space-y-3.5">
            {categoryStats.map((row) => (
              <div key={row.category} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 font-medium">{row.category}</span>
                  <span className="font-mono tabular-nums text-slate-500">{row.count}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-700 rounded-full"
                    style={{ width: `${Math.round((row.count / maxCategoryCount) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Claims Queue */}
        <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-900">Recent Ownership Claims</h2>
              <button
                type="button"
                onClick={() => onNavigate('manage-claims')}
                className="text-xs font-medium text-blue-700 hover:text-blue-800 inline-flex items-center gap-1"
              >
                Open queue <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            {recentClaims.length === 0 ? (
              <p className="text-sm text-slate-500 py-8 text-center">No claims submitted yet.</p>
            ) : (
              <div className="divide-y divide-slate-200">
                {recentClaims.map((claim) => (
                  <div key={claim.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-900 truncate">{claim.itemTitle}</div>
                      <div className="text-xs text-slate-500 truncate">
                        Claimant: {claim.claimantName} ({claim.claimantRole})
                      </div>
                    </div>
                    <ClaimStatusLabel status={claim.status} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200 grid grid-cols-3 gap-3 text-xs">
            <button
              type="button"
              onClick={() => onNavigate('manage-items')}
              className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium"
            >
              <PackageSearch className="w-4 h-4 text-blue-700 shrink-0" />
              <span className="truncate">{items.length} Items</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('manage-claims')}
              className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium"
            >
              <ClipboardCheck className="w-4 h-4 text-blue-700 shrink-0" />
              <span className="truncate">{claims.length} Claims</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('manage-users')}
              className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium"
            >
              <Users className="w-4 h-4 text-blue-700 shrink-0" />
              <span className="truncate">{users.length} Users</span>
            </button>
          </div>
        </section>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-sm text-slate-700">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>
            Active Campus Accounts: <strong className="font-mono tabular-nums">{users.filter((u) => u.status === 'active').length}</strong> · Faculty Verifiers:{' '}
            <strong className="font-mono tabular-nums">{users.filter((u) => u.role === 'faculty').length}</strong>
          </span>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('manage-users')}
          className="text-xs font-medium text-blue-700 hover:text-blue-800 whitespace-nowrap"
        >
          Manage Accounts
        </button>
      </div>
    </div>
  );
}
