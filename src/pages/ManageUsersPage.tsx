import { useMemo, useState } from 'react';
import { Search, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { adminUpdateUserRoleAndStatus } from '../services/usersService';
import type { AppRoute, UserProfile, UserRole, UserStatus } from '../types/campus';

interface ManageUsersPageProps {
  users: UserProfile[];
  onNavigate: (route: AppRoute) => void;
}

export function ManageUsersPage({ users, onNavigate }: ManageUsersPageProps) {
  const { profile, isAdmin } = useAuth();
  const { showToast } = useToast();

  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [updatingUid, setUpdatingUid] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (q) {
        const text = `${u.fullName} ${u.email} ${u.department} ${u.campusId}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [users, query, roleFilter]);

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

  const handleUpdate = async (target: UserProfile, nextRole: UserRole, nextStatus: UserStatus) => {
    if (target.uid === profile.uid && (nextRole !== 'admin' || nextStatus !== 'active')) {
      showToast('You cannot demote or suspend your own active admin session.', 'error');
      return;
    }
    setUpdatingUid(target.uid);
    try {
      await adminUpdateUserRoleAndStatus(profile.uid, target, nextRole, nextStatus);
      showToast(`Updated ${target.fullName} (${nextRole}, ${nextStatus}).`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to update user.', 'error');
    } finally {
      setUpdatingUid(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Manage Campus Users</h1>
        <p className="mt-1 text-sm text-slate-600">
          Assign Student, Faculty, or Administrator roles and manage account access.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, department, or campus ID..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as 'all' | UserRole)}
          className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
        >
          <option value="all">All Roles</option>
          <option value="student">Students</option>
          <option value="faculty">Faculty</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Campus ID &amp; Department</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Account Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500">
                    No matching user accounts found.
                  </td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr key={user.uid} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900">{user.fullName}</div>
                      <div className="text-xs text-slate-500">{user.email}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      <span className="font-mono">{user.campusId}</span> · {user.department}
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        aria-label={`Role for ${user.fullName}`}
                        disabled={updatingUid === user.uid}
                        value={user.role}
                        onChange={(e) => handleUpdate(user, e.target.value as UserRole, user.status)}
                        className="px-2.5 py-1 text-xs border border-slate-300 rounded-md bg-white capitalize"
                      >
                        <option value="student">Student</option>
                        <option value="faculty">Faculty</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        aria-label={`Status for ${user.fullName}`}
                        disabled={updatingUid === user.uid}
                        value={user.status}
                        onChange={(e) => handleUpdate(user, user.role, e.target.value as UserStatus)}
                        className={`px-2.5 py-1 text-xs border rounded-md bg-white capitalize ${
                          user.status === 'active' ? 'border-slate-300 text-emerald-700' : 'border-red-300 text-red-700'
                        }`}
                      >
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
