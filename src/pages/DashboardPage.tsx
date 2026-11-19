import { useState } from 'react';
import { ArrowRight, CheckCircle2, ClipboardCheck, FileText, PackageSearch, PlusCircle, Search } from 'lucide-react';
import { ItemCard } from '../components/ItemCard';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { facultyVerifyClaim } from '../services/claimsService';
import type { AppRoute, ClaimRequest, ItemReport, NotificationItem } from '../types/campus';

interface DashboardPageProps {
  items: ItemReport[];
  myItems: ItemReport[];
  myClaims: ClaimRequest[];
  allClaims: ClaimRequest[];
  notifications: NotificationItem[];
  onNavigate: (route: AppRoute, itemId?: string) => void;
}

export function DashboardPage({
  items,
  myItems,
  myClaims,
  allClaims,
  notifications,
  onNavigate,
}: DashboardPageProps) {
  const { profile, isFaculty } = useAuth();
  const { showToast } = useToast();
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verifyNotes, setVerifyNotes] = useState<Record<string, string>>({});

  if (!profile) return null;

  const pendingFacultyClaims = isFaculty ? allClaims.filter((c) => c.status === 'Pending') : [];
  const activeFoundItems = items.filter((i) => i.status === 'Found').slice(0, 3);
  const unreadNotifs = notifications.filter((n) => !n.read);

  const handleFacultyVerify = async (claim: ClaimRequest) => {
    setVerifyingId(claim.id);
    try {
      await facultyVerifyClaim(profile, claim, verifyNotes[claim.id] || 'Verified by faculty member.');
      showToast(`Claim for "${claim.itemTitle}" marked as Faculty Verified.`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to verify claim.', 'error');
    } finally {
      setVerifyingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome, {profile.fullName}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            <span className="capitalize">{profile.role}</span> Workspace · {profile.department} · ID {profile.campusId}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('report-lost')}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4" />
            Report Lost Item
          </button>
          <button
            type="button"
            onClick={() => onNavigate('report-found')}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap"
          >
            <PackageSearch className="w-4 h-4" />
            Report Found Item
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>My Submitted Reports</span>
            <FileText className="w-4 h-4 text-blue-700" />
          </div>
          <div className="mt-2 text-3xl font-bold text-slate-900 font-mono tabular-nums">{myItems.length}</div>
          <button
            type="button"
            onClick={() => onNavigate('my-reports')}
            className="mt-3 text-xs font-medium text-blue-700 hover:text-blue-800 inline-flex items-center gap-1"
          >
            Manage reports <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>My Ownership Claims</span>
            <ClipboardCheck className="w-4 h-4 text-blue-700" />
          </div>
          <div className="mt-2 text-3xl font-bold text-slate-900 font-mono tabular-nums">{myClaims.length}</div>
          <button
            type="button"
            onClick={() => onNavigate('my-claims')}
            className="mt-3 text-xs font-medium text-blue-700 hover:text-blue-800 inline-flex items-center gap-1"
          >
            Track claims <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Available Found Items</span>
            <Search className="w-4 h-4 text-blue-700" />
          </div>
          <div className="mt-2 text-3xl font-bold text-slate-900 font-mono tabular-nums">
            {items.filter((i) => i.status === 'Found').length}
          </div>
          <button
            type="button"
            onClick={() => onNavigate('search')}
            className="mt-3 text-xs font-medium text-blue-700 hover:text-blue-800 inline-flex items-center gap-1"
          >
            Search catalog <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Unread Notifications</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-3xl font-bold text-slate-900 font-mono tabular-nums">{unreadNotifs.length}</div>
          <span className="mt-3 block text-xs text-slate-500">
            {notifications.length} total alerts logged
          </span>
        </div>
      </div>

      {/* Faculty Claim Verification Queue */}
      {isFaculty && (
        <section className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Faculty Claim Verification Queue</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Review student claim details and pre-verify ownership before final administrative approval.
              </p>
            </div>
            <span className="text-xs font-mono tabular-nums text-blue-700 font-semibold">
              {pendingFacultyClaims.length} Pending
            </span>
          </div>

          {pendingFacultyClaims.length === 0 ? (
            <p className="text-sm text-slate-500 py-4">No pending claims require faculty verification right now.</p>
          ) : (
            <div className="divide-y divide-slate-200">
              {pendingFacultyClaims.map((claim) => (
                <div key={claim.id} className="py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1 max-w-2xl">
                    <div className="text-sm font-semibold text-slate-900">
                      {claim.itemTitle} <span className="text-slate-400 font-normal">·</span>{' '}
                      <span className="text-xs font-normal text-slate-600">Claimed by {claim.claimantName}</span>
                    </div>
                    <p className="text-xs text-slate-600">Proof: {claim.ownershipProof}</p>
                    <p className="text-xs text-slate-500">Identifying Features: {claim.identifyingFeatures}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                    <input
                      type="text"
                      value={verifyNotes[claim.id] || ''}
                      onChange={(e) => setVerifyNotes((prev) => ({ ...prev, [claim.id]: e.target.value }))}
                      placeholder="Verification remark..."
                      className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                    <button
                      type="button"
                      disabled={verifyingId === claim.id || claim.claimantId === profile.uid}
                      onClick={() => handleFacultyVerify(claim)}
                      className="px-3.5 py-1.5 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg disabled:opacity-50 whitespace-nowrap"
                    >
                      {verifyingId === claim.id ? 'Verifying...' : 'Verify Claim'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Latest Found Items */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Recently Found on Campus</h2>
          <button
            type="button"
            onClick={() => onNavigate('search')}
            className="text-xs font-medium text-blue-700 hover:text-blue-800"
          >
            View all found items
          </button>
        </div>

        {activeFoundItems.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-500">
            No active found items listed at the moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {activeFoundItems.map((item) => (
              <ItemCard key={item.id} item={item} onSelect={(id) => onNavigate('item-details', id)} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
