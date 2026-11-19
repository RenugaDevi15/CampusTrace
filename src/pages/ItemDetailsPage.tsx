import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Calendar, CheckCircle2, MapPin, ShieldCheck, Tag, UserCheck } from 'lucide-react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ItemCard, StatusIndicator } from '../components/ItemCard';
import { ItemImage } from '../components/ItemImage';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { deleteItemReport, getItemContact, updateItemStatus } from '../services/itemsService';
import { ITEM_STATUSES, type AppRoute, type ItemContact, type ItemReport, type ItemStatus } from '../types/campus';
import { getSuggestedMatches } from '../utils/matching';

interface ItemDetailsPageProps {
  itemId: string;
  items: ItemReport[];
  onNavigate: (route: AppRoute, itemId?: string) => void;
}

export function ItemDetailsPage({ itemId, items, onNavigate }: ItemDetailsPageProps) {
  const { profile, isAdmin, isVerified } = useAuth();
  const { showToast } = useToast();

  const item = items.find((i) => i.id === itemId);
  const [contact, setContact] = useState<ItemContact | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (item && isVerified) {
      getItemContact(item.id).then((res) => {
        if (!cancelled) setContact(res);
      });
    } else {
      setContact(null);
    }
    return () => {
      cancelled = true;
    };
  }, [item, isVerified]);

  const suggestedMatches = useMemo(() => {
    if (!item) return [];
    return getSuggestedMatches(item, items, 3);
  }, [item, items]);

  if (!item) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-white border border-slate-200 rounded-xl p-8 text-center">
        <h1 className="text-xl font-bold text-slate-900">Item Report Not Found</h1>
        <p className="mt-2 text-sm text-slate-600">
          This report may have been removed or the item identifier is invalid.
        </p>
        <button
          type="button"
          onClick={() => onNavigate('search')}
          className="mt-5 px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg"
        >
          Back to Search
        </button>
      </div>
    );
  }

  const isOwner = Boolean(profile && profile.uid === item.reporterId);
  const canManage = isAdmin || (isOwner && item.status !== 'Returned');
  const canClaim = item.type === 'found' && item.status === 'Found' && (!profile || profile.uid !== item.reporterId);

  const handleStatusChange = async (nextStatus: ItemStatus) => {
    setBusy(true);
    try {
      await updateItemStatus(item.id, nextStatus);
      showToast(`Item status updated to ${nextStatus}.`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to update item status.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    try {
      await deleteItemReport(item.id);
      showToast('Item report deleted.', 'success');
      setConfirmDeleteOpen(false);
      onNavigate('my-reports');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to delete item report.', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <button
        type="button"
        onClick={() => onNavigate('search')}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Search Results
      </button>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-5 bg-slate-100 border-b lg:border-b-0 lg:border-r border-slate-200">
            <ItemImage
              src={item.imageUrl}
              alt={item.title}
              category={item.category}
              className="w-full h-72 lg:h-full min-h-[300px]"
            />
          </div>

          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between gap-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <StatusIndicator status={item.status} />
                <span className="text-xs font-mono text-slate-500">Report ID: {item.id.slice(0, 10)}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{item.title}</h1>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-sm text-slate-700">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-blue-700 shrink-0" />
                  <span>{item.category}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-700 shrink-0" />
                  <span>{item.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-700 shrink-0" />
                  <span className="font-mono tabular-nums">{item.dateReported}</span>
                </div>
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-blue-700 shrink-0" />
                  <span>
                    Reported by {item.reporterName} ({item.reporterRole})
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Description</h2>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{item.description}</p>
              </div>

              <div className="pt-4 border-t border-slate-200 space-y-2">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Custody &amp; Contact Information
                </h2>
                <p className="text-sm text-slate-700">{item.contactSummary}</p>
                {isVerified && contact ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-xs text-slate-700 space-y-1">
                    <div>
                      <span className="font-semibold">Direct Contact:</span> {contact.contactDetails}
                    </div>
                    {contact.pickupLocation && (
                      <div>
                        <span className="font-semibold">Pickup / Custody Desk:</span> {contact.pickupLocation}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    Sign in with a verified campus account to view direct reporter contact details.
                  </p>
                )}
              </div>
            </div>

            <div className="pt-5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              {canClaim && (
                <button
                  type="button"
                  onClick={() => {
                    if (!profile) {
                      onNavigate('login');
                    } else {
                      onNavigate('submit-claim', item.id);
                    }
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {profile ? 'Claim This Item' : 'Sign In to Claim Item'}
                </button>
              )}

              {item.status === 'Returned' && (
                <div className="inline-flex items-center gap-2 text-xs font-medium text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" />
                  This item has been verified and returned to its owner.
                </div>
              )}

              {canManage && (
                <div className="flex flex-wrap items-center gap-2 ml-auto">
                  <select
                    aria-label="Update item status"
                    disabled={busy}
                    value={item.status}
                    onChange={(e) => handleStatusChange(e.target.value as ItemStatus)}
                    className="px-3 py-2 text-xs font-medium border border-slate-300 rounded-lg bg-white"
                  >
                    {ITEM_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        Status: {st}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setConfirmDeleteOpen(true)}
                    className="px-3.5 py-2 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg"
                  >
                    Delete Report
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Smart Suggestions */}
      {suggestedMatches.length > 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Potential Campus Matches</h2>
            <p className="text-xs text-slate-500">
              Automatically matched based on category, campus location, and description keywords.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {suggestedMatches.map(({ item: match, reasons }) => (
              <div key={match.id} className="space-y-1.5">
                <ItemCard item={match} onSelect={(id) => onNavigate('item-details', id)} />
                <p className="text-xs text-blue-700 px-1">{reasons.slice(0, 2).join(' · ')}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete Item Report"
        description={`Are you sure you want to permanently remove "${item.title}" from CampusTrace?`}
        confirmLabel="Delete Report"
        busy={busy}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </div>
  );
}
