import { useState } from 'react';
import { Check, ShieldAlert, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { adminResolveClaim } from '../services/claimsService';
import type { AppRoute, ClaimRequest, ClaimStatus } from '../types/campus';
import { ClaimStatusLabel } from './MyClaimsPage';

interface ManageClaimsPageProps {
  claims: ClaimRequest[];
  onNavigate: (route: AppRoute, itemId?: string) => void;
}

export function ManageClaimsPage({ claims, onNavigate }: ManageClaimsPageProps) {
  const { profile, isAdmin } = useAuth();
  const { showToast } = useToast();

  const [statusFilter, setStatusFilter] = useState<'All' | ClaimStatus>('All');
  const [notesById, setNotesById] = useState<Record<string, string>>({});
  const [markReturnedById, setMarkReturnedById] = useState<Record<string, boolean>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  if (!profile || !isAdmin) {
    return (
      <div className="max-w-lg mx-auto my-12 bg-white border border-slate-200 rounded-xl p-8 text-center">
        <ShieldAlert className="w-8 h-8 text-red-600 mx-auto mb-3" />
        <h1 className="text-xl font-bold text-slate-900">Administrator Access Required</h1>
        <button
          type="button"
          onClick={() => onNavigate('dashboard')}
          className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-lg"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const filtered = statusFilter === 'All' ? claims : claims.filter((c) => c.status === statusFilter);

  const handleDecision = async (claim: ClaimRequest, decision: 'Approved' | 'Rejected') => {
    setBusyId(claim.id);
    try {
      const notes = notesById[claim.id] || '';
      const markReturned = decision === 'Approved' ? Boolean(markReturnedById[claim.id]) : false;
      await adminResolveClaim(profile, claim, decision, notes, markReturned);
      showToast(
        decision === 'Approved'
          ? `Claim approved${markReturned ? ' and item marked Returned' : ''}.`
          : 'Claim rejected and item reopened as Found.',
        'success'
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to process claim.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manage Ownership Claims</h1>
          <p className="mt-1 text-sm text-slate-600">
            Verify ownership evidence, approve or reject claims, and maintain audit history.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg w-fit">
          {(['All', 'Pending', 'Faculty Verified', 'Approved', 'Rejected'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                statusFilter === st ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-sm text-slate-500">
          No claims match the selected filter.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((claim) => {
            const isResolved = claim.status === 'Approved' || claim.status === 'Rejected';
            return (
              <div key={claim.id} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <button
                      type="button"
                      onClick={() => onNavigate('item-details', claim.itemId)}
                      className="text-base font-semibold text-slate-900 hover:text-blue-700 text-left"
                    >
                      {claim.itemTitle}
                    </button>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Claimant: <span className="font-medium text-slate-700">{claim.claimantName}</span> (
                      {claim.claimantEmail} · {claim.claimantRole})
                    </div>
                  </div>
                  <ClaimStatusLabel status={claim.status} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <div>
                    <div className="font-semibold text-slate-900 mb-1">Ownership Proof</div>
                    <p className="leading-relaxed">{claim.ownershipProof}</p>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 mb-1">Identifying Features</div>
                    <p className="leading-relaxed">{claim.identifyingFeatures}</p>
                  </div>
                </div>

                {claim.supportingImageUrl && (
                  <div>
                    <div className="text-xs font-medium text-slate-600 mb-1.5">Supporting Proof Photograph</div>
                    <img
                      src={claim.supportingImageUrl}
                      alt="Supporting claim proof"
                      className="w-44 h-32 object-cover rounded-lg border border-slate-200"
                    />
                  </div>
                )}

                {!isResolved && (
                  <div className="pt-3 border-t border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={notesById[claim.id] || ''}
                        onChange={(e) => setNotesById((prev) => ({ ...prev, [claim.id]: e.target.value }))}
                        placeholder="Enter administrative verification notes or rejection reason..."
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                      <label className="inline-flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(markReturnedById[claim.id])}
                          onChange={(e) =>
                            setMarkReturnedById((prev) => ({ ...prev, [claim.id]: e.target.checked }))
                          }
                          className="rounded border-slate-300 text-blue-700 focus:ring-blue-600"
                        />
                        <span>Immediately mark item as Returned upon approval</span>
                      </label>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={busyId === claim.id}
                        onClick={() => handleDecision(claim, 'Rejected')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5" />
                        Reject Claim
                      </button>
                      <button
                        type="button"
                        disabled={busyId === claim.id}
                        onClick={() => handleDecision(claim, 'Approved')}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Approve Claim
                      </button>
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100">
                  <div className="text-xs font-semibold text-slate-600 mb-1">Audit History</div>
                  <ul className="space-y-0.5 text-xs font-mono text-slate-500">
                    {claim.history.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
