import { useCallback, useEffect, useState } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/Layout';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { DashboardPage } from './pages/DashboardPage';
import { HomePage } from './pages/HomePage';
import { ItemDetailsPage } from './pages/ItemDetailsPage';
import { LoginPage } from './pages/LoginPage';
import { ManageClaimsPage } from './pages/ManageClaimsPage';
import { ManageItemsPage } from './pages/ManageItemsPage';
import { ManageUsersPage } from './pages/ManageUsersPage';
import { MyClaimsPage } from './pages/MyClaimsPage';
import { MyReportsPage } from './pages/MyReportsPage';
import { RegisterPage } from './pages/RegisterPage';
import { ReportItemPage } from './pages/ReportItemPage';
import { SearchItemsPage } from './pages/SearchItemsPage';
import { SubmitClaimPage } from './pages/SubmitClaimPage';
import { TestingQAPage } from './pages/TestingQAPage';
import { subscribeToAllClaims, subscribeToUserClaims } from './services/claimsService';
import { subscribeToCampusItems, subscribeToUserItems } from './services/itemsService';
import { subscribeToAllUsers, subscribeToUserNotifications } from './services/usersService';
import type { AppRoute, ClaimRequest, ItemReport, NotificationItem, UserProfile } from './types/campus';

const PROTECTED_ROUTES: Set<AppRoute> = new Set([
  'dashboard',
  'report-lost',
  'report-found',
  'submit-claim',
  'my-reports',
  'my-claims',
  'admin-dashboard',
  'manage-items',
  'manage-claims',
  'manage-users',
  'testing-qa',
]);

function parseHashRoute(): { route: AppRoute; itemId: string } {
  const raw = window.location.hash.replace(/^#\/?/, '');
  if (!raw) return { route: 'home', itemId: '' };

  const [segment, param] = raw.split('/');
  const validRoutes: AppRoute[] = [
    'home',
    'login',
    'register',
    'dashboard',
    'report-lost',
    'report-found',
    'search',
    'item-details',
    'submit-claim',
    'my-reports',
    'my-claims',
    'admin-dashboard',
    'manage-items',
    'manage-claims',
    'manage-users',
    'testing-qa',
  ];

  if (validRoutes.includes(segment as AppRoute)) {
    return { route: segment as AppRoute, itemId: param || '' };
  }
  return { route: 'home', itemId: '' };
}

function CampusTraceApp() {
  const { profile, loading: authLoading, isAdmin, isFaculty } = useAuth();

  const initial = parseHashRoute();
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(initial.route);
  const [selectedItemId, setSelectedItemId] = useState<string>(initial.itemId);
  const [searchSeed, setSearchSeed] = useState('');

  const [items, setItems] = useState<ItemReport[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [myItems, setMyItems] = useState<ItemReport[]>([]);
  const [myClaims, setMyClaims] = useState<ClaimRequest[]>([]);
  const [allClaims, setAllClaims] = useState<ClaimRequest[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const navigate = useCallback((route: AppRoute, itemId?: string) => {
    setCurrentRoute(route);
    setSelectedItemId(itemId || '');
    const nextHash = itemId ? `#/${route}/${itemId}` : route === 'home' ? '#/' : `#/${route}`;
    if (window.location.hash !== nextHash) {
      window.location.hash = nextHash;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      const parsed = parseHashRoute();
      setCurrentRoute(parsed.route);
      setSelectedItemId(parsed.itemId);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Campus Lost & Found items live feed
  useEffect(() => {
    const unsubscribe = subscribeToCampusItems(
      (list) => {
        setItems(list);
        setLoadingItems(false);
      },
      (err) => {
        console.error('Items feed error:', err);
        setLoadingItems(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Authenticated user-scoped feeds
  useEffect(() => {
    if (!profile) {
      setMyItems([]);
      setMyClaims([]);
      setNotifications([]);
      return;
    }

    const unsubItems = subscribeToUserItems(profile.uid, setMyItems);
    const unsubClaims = subscribeToUserClaims(profile.uid, setMyClaims);
    const unsubNotifs = subscribeToUserNotifications(profile.uid, setNotifications);

    return () => {
      unsubItems();
      unsubClaims();
      unsubNotifs();
    };
  }, [profile]);

  // Faculty & Admin privileged feeds
  useEffect(() => {
    if (!profile || (!isAdmin && !isFaculty)) {
      setAllClaims([]);
      return;
    }
    const unsubClaims = subscribeToAllClaims(setAllClaims);
    return () => unsubClaims();
  }, [profile, isAdmin, isFaculty]);

  useEffect(() => {
    if (!profile || !isAdmin) {
      setAllUsers([]);
      return;
    }
    const unsubUsers = subscribeToAllUsers(setAllUsers);
    return () => unsubUsers();
  }, [profile, isAdmin]);

  // Protected route redirect if signed out
  useEffect(() => {
    if (!authLoading && !profile && PROTECTED_ROUTES.has(currentRoute)) {
      navigate('login');
    }
  }, [authLoading, profile, currentRoute, navigate]);

  const handleQuickSearch = (query: string) => {
    setSearchSeed(query);
    navigate('search');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-sm font-medium text-slate-600">Loading CampusTrace...</div>
      </div>
    );
  }

  const renderPage = () => {
    switch (currentRoute) {
      case 'home':
        return (
          <HomePage
            items={items}
            loadingItems={loadingItems}
            onNavigate={navigate}
            onQuickSearch={handleQuickSearch}
          />
        );
      case 'login':
        return <LoginPage onNavigate={navigate} />;
      case 'register':
        return <RegisterPage onNavigate={navigate} />;
      case 'dashboard':
        return (
          <DashboardPage
            items={items}
            myItems={myItems}
            myClaims={myClaims}
            allClaims={allClaims}
            notifications={notifications}
            onNavigate={navigate}
          />
        );
      case 'report-lost':
        return <ReportItemPage mode="lost" onNavigate={navigate} />;
      case 'report-found':
        return <ReportItemPage mode="found" onNavigate={navigate} />;
      case 'search':
        return (
          <SearchItemsPage
            items={items}
            loading={loadingItems}
            initialQuery={searchSeed}
            onNavigate={navigate}
          />
        );
      case 'item-details':
        return <ItemDetailsPage itemId={selectedItemId} items={items} onNavigate={navigate} />;
      case 'submit-claim':
        return (
          <SubmitClaimPage
            itemId={selectedItemId}
            items={items}
            myClaims={myClaims}
            onNavigate={navigate}
          />
        );
      case 'my-reports':
        return <MyReportsPage myItems={myItems} loading={loadingItems} onNavigate={navigate} />;
      case 'my-claims':
        return <MyClaimsPage myClaims={myClaims} loading={false} onNavigate={navigate} />;
      case 'admin-dashboard':
        return (
          <AdminDashboardPage
            items={items}
            claims={allClaims}
            users={allUsers}
            onNavigate={navigate}
          />
        );
      case 'manage-items':
        return <ManageItemsPage items={items} onNavigate={navigate} />;
      case 'manage-claims':
        return <ManageClaimsPage claims={allClaims} onNavigate={navigate} />;
      case 'manage-users':
        return <ManageUsersPage users={allUsers} onNavigate={navigate} />;
      case 'testing-qa':
        return <TestingQAPage onNavigate={navigate} />;
      default:
        return (
          <HomePage
            items={items}
            loadingItems={loadingItems}
            onNavigate={navigate}
            onQuickSearch={handleQuickSearch}
          />
        );
    }
  };

  return (
    <Layout currentRoute={currentRoute} onNavigate={navigate} notifications={notifications}>
      {renderPage()}
    </Layout>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <CampusTraceApp />
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
