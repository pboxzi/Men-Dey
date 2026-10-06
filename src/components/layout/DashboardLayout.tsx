import {useState, useEffect} from 'react';
import {Link, NavLink, Outlet, useNavigate} from 'react-router-dom';
import {
  LayoutDashboard,
  Mail,
  FileText,
  Calendar,
  CreditCard,
  Bell,
  UserRound,
  FolderClosed,
  Settings,
  LogOut,
  ChevronDown,
  Menu,
  X
} from 'lucide-react';

import {ProfileMenu} from '../ProfileMenu';
import {useAuth} from '../../auth/AuthContext';
import {useUnreadCounts} from '../../hooks/useUnreadCounts';
import {supabase} from '../../lib/supabase';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: number;
  end?: boolean;
}

export function DashboardLayout() {
  const {profile, session, signOut} = useAuth();
  const {messages, notifications} = useUnreadCounts();
  const [openRequestsCount, setOpenRequestsCount] = useState<number>(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const me = session?.user.id;

  useEffect(() => {
    if (!me) return;
    const fetchRequestsCount = async () => {
      try {
        const {count} = await supabase
          .from('requests')
          .select('id', {count: 'exact', head: true})
          .eq('user_id', me)
          .not('status', 'in', '("completed","declined","cancelled")');
        setOpenRequestsCount(count ?? 0);
      } catch {
        // non-critical
      }
    };
    void fetchRequestsCount();
  }, [me]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen]);

  const mainLinks: NavItem[] = [
    {to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true},
    {to: '/dashboard/messages', label: 'Messages', icon: Mail, badge: messages || undefined},
    {to: '/dashboard/requests', label: 'Requests', icon: FileText, badge: openRequestsCount || undefined},
    {to: '/dashboard/experiences', label: 'Experiences', icon: Calendar},
    {to: '/dashboard/membership', label: 'Membership', icon: CreditCard},
    {to: '/dashboard/notifications', label: 'Notifications', icon: Bell, badge: notifications || undefined},
  ];

  const personalLinks: NavItem[] = [
    {to: '/dashboard/profile', label: 'Profile', icon: UserRound},
    {to: '/dashboard/documents', label: 'Documents', icon: FolderClosed},
    {to: '/dashboard/settings', label: 'Settings', icon: Settings},
  ];

  const userName =
    profile?.full_name || profile?.email?.split('@')[0] || 'Member';
  const userInitials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const renderLink = (link: NavItem) => {
    const Icon = link.icon;
    return (
      <NavLink
        key={link.to}
        to={link.to}
        end={link.end}
        onClick={() => setMobileOpen(false)}
        className={({isActive}) =>
          `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
            isActive
              ? 'bg-[#2A2318] text-[#C89B3C] border border-[#4A3B24]'
              : 'text-stone-400 hover:text-white hover:bg-white/5'
          }`
        }
      >
        <div className="flex items-center gap-3">
          <Icon className="w-4 h-4 opacity-90 shrink-0" />
          <span>{link.label}</span>
        </div>
        {link.badge ? (
          <span className="inline-flex min-w-4.5 justify-center items-center rounded-full bg-[#C89B3C] px-1.5 py-0.2 text-[10px] font-semibold text-[#14171A]">
            {link.badge}
          </span>
        ) : null}
      </NavLink>
    );
  };

  return (
    <div className="flex min-h-screen bg-[#FAF8F5] text-[#1E1E1E] antialiased">
      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* =========================================================================
          DARK OBSIDIAN SIDEBAR (Matches uploaded reference image exactly)
      ========================================================================= */}
      <aside
        id="dashboard-sidebar"
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#14171A] text-stone-300 flex flex-col justify-between shrink-0 transform transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          aria-label="Close sidebar menu"
          className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-white rounded-md hover:bg-white/10 lg:hidden"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Top Brand Monogram & Lockup */}
          <div className="pt-7 pb-6 px-6 border-b border-white/5">
            <Link
              to="/home"
              aria-label="Gillian Anderson Management home"
              className="group flex flex-col items-start gap-1 text-left"
            >
              <img
                src="/assets/images/ga-monogram-brushed-gold.png"
                alt="GA Monogram"
                className="h-10 w-auto object-contain mb-1"
                loading="eager"
              />
              <span className="text-[10px] font-semibold tracking-[0.22em] text-white uppercase leading-tight">
                GILLIAN ANDERSON
              </span>
              <span className="text-[8px] font-semibold tracking-[0.28em] text-[#C89B3C] uppercase">
                MANAGEMENT
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-6 flex-1" aria-label="Dashboard">
            <div>
              <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500 mb-2">
                <span className="sr-only">Overview</span>
                <span aria-hidden="true">MAIN</span>
              </p>
              <div className="space-y-1">{mainLinks.map(renderLink)}</div>
            </div>

            <div className="pt-2 border-t border-white/5">
              <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500 mb-2">
                <span className="sr-only">Personal</span>
                <span aria-hidden="true">PERSONAL</span>
              </p>
              <div className="space-y-1">{personalLinks.map(renderLink)}</div>
            </div>
          </nav>
        </div>

        {/* Bottom Profile Lockup in Sidebar */}
        <div className="p-4 border-t border-white/10 bg-[#0F1214]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-stone-700/80 border border-stone-600 flex items-center justify-center text-xs font-semibold text-white overflow-hidden shrink-0">
              <span>{userInitials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-white truncate flex items-center gap-1">
                <span>{userName}</span>
                <ChevronDown className="w-3 h-3 text-stone-400 shrink-0" />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-1 pl-11 mt-1 text-[11px] text-stone-400">
            <Link
              to="/dashboard/profile"
              onClick={() => setMobileOpen(false)}
              className="hover:text-white transition-colors"
            >
              View Profile
            </Link>
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                void signOut().then(() => navigate('/sign-in', {replace: true}));
              }}
              className="flex items-center gap-1.5 text-stone-400 hover:text-rose-400 transition-colors text-left"
            >
              <LogOut className="w-3 h-3" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* =========================================================================
          MAIN RIGHT AREA
      ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#FAF8F5]">
        {/* Top Navbar */}
        <header className="h-14 px-4 sm:h-16 sm:px-6 lg:px-10 flex items-center justify-between lg:justify-end sticky top-0 z-30 bg-[#FAF8F5]/90 backdrop-blur-sm border-b border-[#EAE4DA]/60">
          {/* Mobile hamburger */}
          <div className="flex items-center gap-3 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="p-1.5 text-stone-700 hover:text-stone-900 rounded-md hover:bg-stone-200/50"
              aria-label="Open sidebar menu"
              aria-expanded={mobileOpen}
              aria-controls="dashboard-sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-serif text-lg font-semibold text-[#1E1E1E]">GA</span>
          </div>

          {/* Right Bell + Profile Lockup */}
          <div className="flex items-center gap-4">
            <Link
              to="/dashboard/notifications"
              className="relative p-2 text-stone-600 hover:text-[#1E1E1E] transition-colors rounded-full hover:bg-stone-200/40"
              aria-label="View notifications"
            >
              <Bell className="w-4 h-4" />
              {notifications > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#C89B3C]" />
              )}
            </Link>

            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-[#EAE4DA] text-stone-800 flex items-center justify-center text-xs font-semibold overflow-hidden">
                <span>{userInitials}</span>
              </div>
              <ProfileMenu />
            </div>
          </div>
        </header>

        {/* Main Routed Content */}
        <main className="flex-1 p-6 sm:p-10 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
