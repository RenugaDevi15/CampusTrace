import { useState } from 'react';
import { Pencil, PlusCircle, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { StatusIndicator } from '../components/ItemCard';
import { useToast } from '../context/ToastContext';
import { deleteItemReport, updateItemReport, updateItemStatus } from '../services/itemsService';
import {
  ITEM_CATEGORIES,
  ITEM_STATUSES,
  type AppRoute,
  type ItemCategory,
  type ItemReport,
  type ItemStatus,
} from '../types/campus';

interface MyReportsPageProps {
  myItems: ItemReport[];
  loading: boolean;
  onNavigate: (route: AppRoute, itemId?: string) => void;
}

export function MyReportsPage({ myItems, loading, onNavigate }: MyReportsPageProps) {
  const { showToast } = useToast();

  const [editingItem, setEditingItem] = useState<ItemReport | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState<ItemCategory>('Electronics');
  const [editLocation, setEditLocation] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState<ItemStatus>('Lost');
  const [deletingItem, setDeletingItem] = useState<ItemReport | null>(null);
  const [busy, setBusy] = useState(false);

  const openEdit = (item: ItemReport) => {
    setEditingItem(item);
    setEditTitle(item.title);
    setEditCategory(item.category);
    setEditLocation(item.location);
    setEditDescription(item.description);
    setEditStatus(item.status);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setBusy(true);
    try {
      await updateItemReport(editingItem.id, editingItem, {
        title: editTitle,
        category: editCategory,
        location: editLocation,
        description: editDescription,
        status: editStatus,
      });
      showToast('Report updated successfully.', 'success');
      setEditingItem(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to update report.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleQuickStatus = async (item: ItemReport, status: ItemStatus) => {
    try {
      await updateItemStatus(item.id, status);
      showToast(`Status updated to ${status}.`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update status.', 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    setBusy(true);
    try {
      await deleteItemReport(deletingItem.id);
      showToast('Report deleted.', 'success');
      setDeletingItem(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to delete report.', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Submitted Reports</h1>
          <p className="mt-1 text-sm text-slate-600">
            Edit details, update recovery statuses, or remove eligible reports you created.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onNavigate('report-lost')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg whitespace-nowrap"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Report Lost
          </button>
          <button
            type="button"
            onClick={() => onNavigate('report-found')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg whitespace-nowrap"
          >
            Report Found
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-xl h-48 animate-pulse" />
      ) : myItems.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
          <p className="text-sm font-medium text-slate-900">You have not submitted any reports yet.</p>
          <p className="mt-1 text-xs text-slate-500">Report a lost or found item to track it here.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">Item</th>
                  <th className="py-3 px-4">Category &amp; Location</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {myItems.map((item) => {
                  const locked = item.status === 'Returned';
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => onNavigate('item-details', item.id)}
                          className="font-medium text-slate-900 hover:text-blue-700 text-left"
                        >
                          {item.title}
                        </button>
                        <div className="text-xs text-slate-500 capitalize">{item.type} report</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        {item.category} · {item.location}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono tabular-nums text-slate-600">
                        {item.dateReported}
                      </td>
                      <td className="py-3.5 px-4">
                        {locked ? (
                          <StatusIndicator status={item.status} />
                        ) : (
                          <select
                            aria-label={`Status for ${item.title}`}
                            value={item.status}
                            onChange={(e) => handleQuickStatus(item, e.target.value as ItemStatus)}
                            className="px-2.5 py-1 text-xs border border-slate-300 rounded-md bg-white"
                          >
                            {ITEM_STATUSES.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {locked ? (
                          <span className="text-xs text-slate-400">Closed</span>
                        ) : (
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEdit(item)}
                              aria-label={`Edit ${item.title}`}
                              className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-md"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingItem(item)}
                              aria-label={`Delete ${item.title}`}
                              className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-md"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleSaveEdit}
            className="w-full max-w-lg bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-lg"
          >
            <h2 className="text-lg font-semibold text-slate-900">Edit Item Report</h2>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Item Name</label>
              <input
                type="text"
                required
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as ItemCategory)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  {ITEM_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as ItemStatus)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  {ITEM_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Location</label>
              <input
                type="text"
                required
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
              <textarea
                rows={3}
                required
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 text-xs font-medium text-slate-700 border border-slate-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="px-4 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg disabled:opacity-50"
              >
                {busy ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deletingItem)}
        title="Delete Report"
        description={`Remove "${deletingItem?.title}" from CampusTrace? This action cannot be undone.`}
        confirmLabel="Delete"
        busy={busy}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingItem(null)}
      />
    </div>
  );
}
