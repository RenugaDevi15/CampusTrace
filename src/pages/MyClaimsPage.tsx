import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import type { AppRoute, ClaimRequest, ClaimStatus } from '../types/campus';

interface MyClaimsPageProps {
  myClaims: ClaimRequest[];
  loading: boolean;
  onNavigate: (route: AppRoute, itemId?: string) => void;
}

export function ClaimStatusLabel({ status }: { status: ClaimStatus }) {
  if (status === 'Approved') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Approved
      </span>
    );
  }
  if (status === 'Rejected') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700">
        <XCircle className="w-3.5 h-3.5" />
        Rejected
      </span>
    );
  }
  if (status === 'Faculty Verified') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Faculty Verified
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700">
      <Clock className="w-3.5 h-3.5" />
      Pending Review
    </span>
  );
}

export function MyClaimsPage({ myClaims, loading, onNavigate }: MyClaimsPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Ownership Claims</h1>
        <p className="mt-1 text-sm text-slate-600">
          Track verification progress, reviewer notes, and claim audit history.
        </p>
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-xl h-48 animate-pulse" />
      ) : myClaims.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
          <p className="text-sm font-medium text-slate-900">No ownership claims submitted yet.</p>
          <p className="mt-1 text-xs text-slate-500">
            Search the Found Items catalog to locate missing property and file a claim.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('search')}
            className="mt-4 px-4 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg"
          >
            Search Found Items
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {myClaims.map((claim) => (
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
                    {claim.itemCategory} · Claim ID {claim.id.slice(0, 8)}
                  </div>
                </div>
                <ClaimStatusLabel status={claim.status} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 pt-3 border-t border-slate-100">
                <div>
                  <span className="font-semibold text-slate-800">Ownership Proof:</span> {claim.ownershipProof}
                </div>
                <div>
                  <span className="font-semibold text-slate-800">Identifying Features:</span> {claim.identifyingFeatures}
                </div>
              </div>

              {claim.reviewNotes && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-xs text-slate-700">
                  <span className="font-semibold">Reviewer Note ({claim.reviewerName || 'Staff'}):</span>{' '}
                  {claim.reviewNotes}
                </div>
              )}

              <div className="pt-3 border-t border-slate-100">
                <div className="text-xs font-semibold text-slate-700 mb-2">Claim Audit History</div>
                <ul className="space-y-1 text-xs text-slate-600 font-mono">
                  {claim.history.map((entry, idx) => (
                    <li key={idx}>{entry}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
