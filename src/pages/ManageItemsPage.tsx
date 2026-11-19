import { useMemo, useState } from 'react';
import { Pencil, Search, ShieldAlert, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useAuth } from '../context/AuthContext';
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
import { searchAndFilterItems } from '../utils/matching';

interface ManageItemsPageProps {
  items: ItemReport[];
  onNavigate: (route: AppRoute, itemId?: string) => void;
}

export function ManageItemsPage({ items, onNavigate }: ManageItemsPageProps) {
  const { isAdmin } = useAuth();
  const { showToast } = useToast();

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [editingItem, setEditingItem] = useState<ItemReport | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState<ItemCategory>('Electronics');
  const [editLocation, setEditLocation] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState<ItemStatus>('Lost');
  const [deletingItem, setDeletingItem] = useState<ItemReport | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(
    () => searchAndFilterItems(items, { query, status: statusFilter }),
    [items, query, statusFilter]
  );

  if (!isAdmin) {
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
      showToast('Item updated successfully.', 'success');
      setEditingItem(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update item.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleStatusChange = async (itemId: string, status: ItemStatus) => {
    try {
      await updateItemStatus(itemId, status);
      showToast(`Item marked as ${status}.`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Status update failed.', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    setBusy(true);
    try {
      await deleteItemReport(deletingItem.id);
      showToast('Item removed from registry.', 'success');
      setDeletingItem(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Delete failed.', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Manage Campus Items</h1>
        <p className="mt-1 text-sm text-slate-600">
          Review, update, or remove any lost and found item across the university registry.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by item name, reporter, or location..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
        >
          <option value="All">All Statuses</option>
          {ITEM_STATUSES.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                <th className="py-3 px-4">Item</th>
                <th className="py-3 px-4">Reporter</th>
                <th className="py-3 px-4">Category &amp; Location</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No matching items found.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => onNavigate('item-details', item.id)}
                        className="font-medium text-slate-900 hover:text-blue-700 text-left"
                      >
                        {item.title}
                      </button>
                      <div className="text-xs text-slate-500 capitalize">{item.type}</div>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      <div>{item.reporterName}</div>
                      <div className="capitalize text-slate-400">{item.reporterRole}</div>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      {item.category} · {item.location}
                    </td>
                    <td className="py-3 px-4 text-xs font-mono tabular-nums text-slate-600">
                      {item.dateReported}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        aria-label={`Status for ${item.title}`}
                        value={item.status}
                        onChange={(e) => handleStatusChange(item.id, e.target.value as ItemStatus)}
                        className="px-2.5 py-1 text-xs border border-slate-300 rounded-md bg-white"
                      >
                        {ITEM_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4 text-right">
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" role="dialog" aria-modal="true">
          <form onSubmit={handleSaveEdit} className="w-full max-w-lg bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-lg">
            <h2 className="text-lg font-semibold text-slate-900">Edit Item (Admin)</h2>
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
            <div className="grid grid-cols-2 gap-3">
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
            <div className="flex justify-end gap-2">
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
        title="Delete Campus Item Report"
        description={`Permanently delete "${deletingItem?.title}"?`}
        confirmLabel="Delete Item"
        busy={busy}
        onConfirm={handleDelete}
        onCancel={() => setDeletingItem(null)}
      />
    </div>
  );
}
