import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import Auth from './pages/Auth';
import Catalog from './pages/Catalog';
import BookingsList from './pages/BookingsList';
import AdminDashboard from './pages/AdminDashboard';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import { Bell, LogOut, Shield, User as UserIcon, Calendar, BarChart3, Database, Boxes, Sparkles } from 'lucide-react';

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode; onReset: () => void },
  { error: Error | null }
> {
  state = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('App render failed', error);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-dark-950 text-dark-50 flex items-center justify-center px-4">
          <div className="glass-panel max-w-md rounded-2xl border border-red-500/20 p-6 text-center">
            <h1 className="text-lg font-bold text-white">Something went wrong after sign in.</h1>
            <p className="mt-2 text-sm text-dark-300">
              Your session was cleared so you can try again. If this repeats, check the browser console for the exact API response.
            </p>
            <button
              onClick={this.props.onReset}
              className="btn-primary mt-5 rounded-lg px-4 py-2 text-sm font-semibold text-white"
            >
              Return to sign in
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const App: React.FC = () => {
  const { user, loading, logout, apiFetch } = useAuth();
  const [activeTab, setActiveTab] = useState<'catalog' | 'bookings' | 'admin' | 'analytics'>('catalog');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const data = await apiFetch('/api/v1/notifications');
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load notifications', err);
      setNotifications([]);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Poll notifications every 15 seconds for real-time reactivity
      const interval = setInterval(fetchNotifications, 15000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [user]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await apiFetch(`/api/v1/notifications/${id}/read`, { method: 'PUT' });
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-t-2 border-brand-500 animate-spin"></div>
          <div className="absolute inset-2 rounded-full border-r-2 border-teal-300 animate-spin"></div>
        </div>
        <p className="mt-4 text-dark-300 font-sans tracking-wide">Syncing session...</p>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  const safeUserRole = user.role || 'USER';
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <AppErrorBoundary onReset={logout}>
    <div className="min-h-screen bg-dark-950 text-dark-50 flex flex-col">
      {/* Dynamic Background Mesh */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:42px_42px] opacity-35"></div>
        <div className="absolute left-0 right-0 top-0 h-56 bg-gradient-to-b from-teal-500/10 to-transparent"></div>
      </div>

      {/* Main Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-dark-950/78 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-16 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('catalog')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-400 via-brand-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Boxes className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white via-dark-100 to-brand-400 bg-clip-text text-transparent font-sans">
                CultTrack <span className="text-brand-400">AI</span>
              </span>
              <span className="block text-[9px] uppercase tracking-widest text-dark-400 font-medium font-sans">
                IIT Roorkee Council
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="order-3 w-full md:order-none md:w-auto flex items-center gap-1.5 overflow-x-auto rounded-xl border border-white/10 bg-white/[0.035] p-1">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 flex items-center gap-2 shrink-0 ${
                activeTab === 'catalog'
                  ? 'bg-white/10 text-white border border-white/10 shadow-sm'
                  : 'text-dark-300 hover:text-dark-50 hover:bg-white/[0.055] border border-transparent'
              }`}
            >
              <Database className="w-4 h-4" />
              Inventory
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 flex items-center gap-2 shrink-0 ${
                activeTab === 'bookings'
                  ? 'bg-white/10 text-white border border-white/10 shadow-sm'
                  : 'text-dark-300 hover:text-dark-50 hover:bg-white/[0.055] border border-transparent'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Bookings & Loans
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 flex items-center gap-2 shrink-0 ${
                activeTab === 'analytics'
                  ? 'bg-white/10 text-white border border-white/10 shadow-sm'
                  : 'text-dark-300 hover:text-dark-50 hover:bg-white/[0.055] border border-transparent'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Analytics & AI
            </button>
            {safeUserRole === 'ADMIN' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 flex items-center gap-2 shrink-0 ${
                  activeTab === 'admin'
                    ? 'bg-white/10 text-white border border-white/10 shadow-sm'
                    : 'text-dark-300 hover:text-dark-50 hover:bg-white/[0.055] border border-transparent'
                }`}
              >
                <Shield className="w-4 h-4" />
                Admin Desk
              </button>
            )}
          </nav>

          {/* User Profile, Notifications & Logout */}
          <div className="flex items-center gap-4 relative">
            {/* Notification Trigger */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-lg text-dark-300 hover:text-white hover:bg-white/[0.06] border border-white/10 transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Panel */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-[calc(100vw-2rem)] sm:w-80 glass-panel border border-dark-800 rounded-xl shadow-2xl overflow-hidden z-50 animate-slide-up">
                  <div className="px-4 py-3 border-b border-dark-800 flex justify-between items-center bg-dark-900/60">
                    <h4 className="font-semibold text-sm">Notifications</h4>
                    <span className="text-xs text-brand-400 font-medium">{unreadCount} unread</span>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-dark-800/60">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-xs text-dark-400">
                        No notifications to display.
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          className={`p-3 text-xs transition-colors ${
                            !n.isRead ? 'bg-brand-500/5 hover:bg-brand-500/10' : 'hover:bg-dark-900/40'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className={`font-semibold ${!n.isRead ? 'text-brand-300' : 'text-dark-200'}`}>
                              {n.title}
                            </span>
                            {!n.isRead && (
                              <button
                                onClick={() => handleMarkAsRead(n.id)}
                                className="text-[10px] text-brand-400 hover:underline"
                              >
                                Mark Read
                              </button>
                            )}
                          </div>
                          <p className="text-dark-300 leading-relaxed">{n.message}</p>
                          <span className="text-[9px] text-dark-400 block mt-1.5">
                            {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Tag */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-dark-800 bg-dark-900/30">
              <UserIcon className="w-4 h-4 text-brand-400" />
              <div className="text-left">
                <span className="block text-xs font-semibold">{user.fullName}</span>
                <span className="block text-[9px] text-dark-400 capitalize">{safeUserRole.toLowerCase()}</span>
              </div>
            </div>

            {/* Logout Trigger */}
            <button
              onClick={logout}
              className="p-2 rounded-lg text-dark-300 hover:text-red-300 hover:bg-red-500/10 border border-white/10 transition-colors flex items-center gap-2"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Pane */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 z-10">
        <div className="mb-6 rounded-2xl border border-white/10 bg-gradient-to-r from-white/[0.075] via-white/[0.04] to-teal-500/[0.06] px-4 py-3 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex h-9 w-9 rounded-lg bg-teal-400/10 border border-teal-300/20 items-center justify-center">
              <Sparkles className="h-4 w-4 text-teal-300" />
            </div>
            <div>
              <p className="page-kicker">Live council workspace</p>
              <p className="text-sm text-dark-300">Inventory, requests, analytics, and handovers in one control surface.</p>
            </div>
          </div>
          <div className="flex gap-2 text-[11px]">
            <span className="metric-pill px-3 py-1">Role: {safeUserRole.toLowerCase()}</span>
            <span className="metric-pill px-3 py-1">{unreadCount} unread</span>
          </div>
        </div>
        {activeTab === 'catalog' && <Catalog />}
        {activeTab === 'bookings' && <BookingsList />}
        {activeTab === 'admin' && safeUserRole === 'ADMIN' && <AdminDashboard />}
        {activeTab === 'analytics' && <AnalyticsDashboard />}
      </main>

      {/* Footer */}
      <footer className="mt-auto py-6 border-t border-white/10 bg-dark-950/70 backdrop-blur-xl z-10 text-center text-xs text-dark-400">
        <p>© 2026 Cultural Council, Indian Institute of Technology Roorkee. All rights reserved.</p>
        <p className="mt-1 text-[10px] text-dark-500">CultTrack Asset Allocator • Embedded AI forecasting engine</p>
      </footer>
    </div>
    </AppErrorBoundary>
  );
};

export default App;
