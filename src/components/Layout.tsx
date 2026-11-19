import React, { useState } from 'react';
import {
  Bell,
  ClipboardCheck,
  FileText,
  FlaskConical,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  PackageSearch,
  PlusCircle,
  Search,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { markAllNotificationsRead, markNotificationRead } from '../services/usersService';
import type { AppRoute, NotificationItem } from '../types/campus';

interface LayoutProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute, itemId?: string) => void;
  notifications: NotificationItem[];
  children: React.ReactNode;
}

const WORKSPACE_ROUTES: Set<AppRoute> = new Set([
  'dashboard',
  'report-lost',
  'report-found',
  'my-reports',
  'my-claims',
  'submit-claim',
  'admin-dashboard',
  'manage-items',
  'manage-claims',
  'manage-users',
  'testing-qa',
]);

export function Layout({ currentRoute, onNavigate, notifications, children }: LayoutProps) {
  const { profile, isAdmin, logout } = useAuth();
  const { showToast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const isWorkspace = Boolean(profile) && WORKSPACE_ROUTES.has(currentRoute);

  const handleSignOut = async () => {
    try {
      await logout();
      setMobileMenuOpen(false);
      showToast('Signed out successfully.', 'success');
      onNavigate('home');
    } catch {
      showToast('Failed to sign out. Please try again.', 'error');
    }
  };

  const navLinks: { label: string; route: AppRoute }[] = [
    { label: 'Home', route: 'home' },
    { label: 'Search Items', route: 'search' },
    { label: 'Report Lost', route: 'report-lost' },
    { label: 'Report Found', route: 'report-found' },
    ...(profile
      ? [{ label: isAdmin ? 'Admin Console' : 'Dashboard', route: (isAdmin ? 'admin-dashboard' : 'dashboard') as AppRoute }]
      : []),
  ];

  const workspaceItems: { label: string; route: AppRoute; icon: React.ComponentType<{ className?: string }>; adminOnly?: boolean }[] = [
    { label: 'Overview', route: 'dashboard', icon: LayoutDashboard },
    { label: 'Search Items', route: 'search', icon: Search },
    { label: 'Report Lost Item', route: 'report-lost', icon: PlusCircle },
    { label: 'Report Found Item', route: 'report-found', icon: PackageSearch },
    { label: 'My Reports', route: 'my-reports', icon: FileText },
    { label: 'My Claims', route: 'my-claims', icon: ClipboardCheck },
    ...(isAdmin
      ? [
          { label: 'Admin Dashboard', route: 'admin-dashboard' as AppRoute, icon: ShieldCheck, adminOnly: true },
          { label: 'Manage Items', route: 'manage-items' as AppRoute, icon: PackageSearch, adminOnly: true },
          { label: 'Manage Claims', route: 'manage-claims' as AppRoute, icon: ClipboardCheck, adminOnly: true },
          { label: 'Manage Users', route: 'manage-users' as AppRoute, icon: Users, adminOnly: true },
          { label: 'Testing & QA', route: 'testing-qa' as AppRoute, icon: FlaskConical, adminOnly: true },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Bar strictly following the 3-Zone Contract */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 print:hidden">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-element Wordmark */}
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="text-lg font-bold tracking-tight text-blue-800 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
          >
            CampusTrace
          </button>

          {/* Zone 2: 4-5 concise single-line text links */}
          <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            {navLinks.map((item) => {
              const active = currentRoute === item.route;
              return (
                <button
                  key={item.route}
                  type="button"
                  onClick={() => onNavigate(item.route)}
                  className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
                    active
                      ? 'text-blue-700 border-blue-700'
                      : 'border-transparent hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 Primary Action + Mobile Menu Trigger */}
          <div className="flex items-center gap-3 shrink-0">
            {profile ? (
              <div className="hidden md:flex items-center gap-3">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setNotifOpen((prev) => !prev)}
                    aria-label="Toggle notifications"
                    className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-blue-700 text-white text-[10px] font-semibold rounded-full flex items-center justify-center tabular-nums">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  {notifOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-40 overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-900">Notifications</span>
                        {unreadCount > 0 && (
                          <button
                            type="button"
                            onClick={() => markAllNotificationsRead(notifications)}
                            className="text-xs font-medium text-blue-700 hover:text-blue-800"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                        {notifications.length === 0 ? (
                          <p className="p-4 text-xs text-slate-500 text-center">No notifications yet.</p>
                        ) : (
                          notifications.slice(0, 8).map((n) => (
                            <button
                              key={n.id}
                              type="button"
                              onClick={() => {
                                if (!n.read) markNotificationRead(n.id);
                                setNotifOpen(false);
                                if (n.relatedItemId) onNavigate('item-details', n.relatedItemId);
                              }}
                              className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${
                                n.read ? 'bg-white' : 'bg-blue-50/50'
                              }`}
                            >
                              <div className="text-xs font-semibold text-slate-900">{n.title}</div>
                              <div className="mt-0.5 text-xs text-slate-600 line-clamp-2">{n.message}</div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="hidden md:inline-flex items-center px-4 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Sign In
              </button>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
              className="md:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-2">
            {navLinks.map((item) => (
              <button
                key={item.route}
                type="button"
                onClick={() => {
                  onNavigate(item.route);
                  setMobileMenuOpen(false);
                }}
                className={`block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium ${
                  currentRoute === item.route ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            ))}
            {profile ? (
              <>
                <div className="pt-2 border-t border-slate-200 space-y-1">
                  {workspaceItems.map((w) => (
                    <button
                      key={w.route}
                      type="button"
                      onClick={() => {
                        onNavigate(w.route);
                        setMobileMenuOpen(false);
                      }}
                      className={`block w-full text-left px-3 py-2 rounded-lg text-sm ${
                        currentRoute === w.route ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full mt-2 px-3 py-2.5 text-sm font-medium text-red-700 bg-red-50 rounded-lg text-left"
                >
                  Sign Out ({profile.fullName})
                </button>
              </>
            ) : (
              <div className="pt-2 border-t border-slate-200 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('login');
                    setMobileMenuOpen(false);
                  }}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-700 rounded-lg"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('register');
                    setMobileMenuOpen(false);
                  }}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Suspended Account Guard */}
      {profile?.status === 'suspended' ? (
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl p-8 text-center">
            <h1 className="text-xl font-semibold text-slate-900">Account Suspended</h1>
            <p className="mt-2 text-sm text-slate-600">
              Your CampusTrace access has been temporarily suspended by an administrator. Please contact Campus Security or Student Services.
            </p>
            <button
              type="button"
              onClick={handleSignOut}
              className="mt-6 px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg"
            >
              Sign Out
            </button>
          </div>
        </main>
      ) : isWorkspace && profile ? (
        <div className="flex-1 max-w-[1440px] w-full mx-auto flex">
          <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-white border-r border-slate-200 p-5 justify-between print:hidden">
            <div className="space-y-6">
              <div className="pb-4 border-b border-slate-200">
                <div className="text-sm font-semibold text-slate-900 truncate">{profile.fullName}</div>
                <div className="mt-0.5 text-xs text-slate-500 flex items-center gap-1.5">
                  <span className="capitalize font-medium text-blue-700">{profile.role}</span>
                  <span aria-hidden="true">·</span>
                  <span className="truncate">{profile.department}</span>
                </div>
              </div>

              <nav aria-label="Workspace navigation" className="space-y-1">
                {workspaceItems
                  .filter((w) => !w.adminOnly)
                  .map((item) => {
                    const Icon = item.icon;
                    const active = currentRoute === item.route;
                    return (
                      <button
                        key={item.route}
                        type="button"
                        onClick={() => onNavigate(item.route)}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors whitespace-nowrap ${
                          active
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}

                {isAdmin && (
                  <div className="pt-4 mt-4 border-t border-slate-200 space-y-1">
                    <div className="px-3 pb-1 text-xs font-semibold text-slate-400">Administration</div>
                    {workspaceItems
                      .filter((w) => w.adminOnly)
                      .map((item) => {
                        const Icon = item.icon;
                        const active = currentRoute === item.route;
                        return (
                          <button
                            key={item.route}
                            type="button"
                            onClick={() => onNavigate(item.route)}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors whitespace-nowrap ${
                              active
                                ? 'bg-blue-50 text-blue-700 font-medium'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                          >
                            <Icon className="w-4 h-4 shrink-0" />
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                  </div>
                )}
              </nav>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => onNavigate('home')}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg"
              >
                <Home className="w-4 h-4" />
                Back to Public Portal
              </button>
            </div>
          </aside>

          <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      ) : (
        <main className="flex-1">{children}</main>
      )}

      {/* Clean Footer */}
      <footer className="bg-white border-t border-slate-200 print:hidden">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>CampusTrace · University Lost and Found Management System</div>
          <div className="flex items-center gap-5">
            <button type="button" onClick={() => onNavigate('search')} className="hover:text-slate-800">
              Search Registry
            </button>
            <button type="button" onClick={() => onNavigate('report-lost')} className="hover:text-slate-800">
              Report Lost
            </button>
            <button type="button" onClick={() => onNavigate('report-found')} className="hover:text-slate-800">
              Report Found
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
