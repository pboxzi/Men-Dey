import {useState, useEffect} from 'react';
import {Link, NavLink, Outlet, useMatch} from 'react-router-dom';
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
  Menu,
  X
} from 'lucide-react';

import {MobileBottomNav} from './MobileBottomNav';
import {ProfileMenu} from '../ProfileMenu';
import {useAuth} from '../../auth/AuthContext';
import {useUnreadCounts} from '../../hooks/useUnreadCounts';
import {readIsDesktop} from '../../lib/isDesktop';
import {supabase} from '../../lib/supabase';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: number;
  end?: boolean;
}

export function DashboardLayout() {
  const {session} = useAuth();
  const {messages, notifications} = useUnreadCounts();
  const [openRequestsCount, setOpenRequestsCount] = useState<number>(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => readIsDesktop());
  const inConversation = Boolean(useMatch('/dashboard/messages/:conversationId'));

  const me = session?.user.id;

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = (event: MediaQueryListEvent) => setIsDesktop(event.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

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
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
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

  const renderLink = (link: NavItem) => {
    const Icon = link.icon;
    return (
      <NavLink
        key={link.to}
        to={link.to}
        end={link.end}
        onClick={() => setMobileOpen(false)}
        className={({isActive}) =>
          `flex min-h-11 items-center justify-between px-3.5 py-3 rounded-lg text-xs font-medium transition-all ${
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
        aria-hidden={!isDesktop && !mobileOpen ? true : undefined}
        inert={!isDesktop && !mobileOpen ? true : undefined}
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#14171A] text-stone-300 flex flex-col justify-between shrink-0 transform transition-transform duration-300 ease-in-out lg:sticky lg:bottom-auto lg:z-auto lg:h-dvh lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          aria-label="Close sidebar menu"
          className="absolute top-3 right-3 flex h-11 w-11 items-center justify-center text-stone-400 hover:text-white rounded-md hover:bg-white/10 lg:hidden"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Top Brand Monogram & Lockup */}
          <div className="pt-7 pb-5 px-6 border-b border-white/5">
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
      </aside>

      {/* =========================================================================
          MAIN RIGHT AREA
      ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#FAF8F5]">
        {/* Top Navbar */}
        <header className="h-14 px-4 sm:h-16 sm:px-6 lg:px-10 flex items-center justify-between lg:justify-end sticky top-0 z-30 bg-[#FAF8F5]/90 backdrop-blur-sm border-b border-[#EAE4DA]/60">
          {/* Mobile hamburger */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="-ml-2.5 flex h-11 w-11 items-center justify-center text-stone-700 hover:text-stone-900 rounded-md hover:bg-stone-200/50"
              aria-label="Open sidebar menu"
              aria-expanded={mobileOpen}
              aria-controls="dashboard-sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-serif text-lg font-semibold text-[#1E1E1E]">GA</span>
          </div>

          {/* Right Bell + Profile Lockup */}
          <div className="flex items-center gap-1 sm:gap-3">
            <Link
              to="/dashboard/notifications"
              className="relative flex h-11 w-11 items-center justify-center text-stone-700 hover:text-[#1E1E1E] transition-colors rounded-full hover:bg-stone-200/50"
              aria-label="View notifications"
            >
              <Bell className="w-5 h-5 stroke-[1.8]" />
              {notifications > 0 && (
                <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#C89B3C] px-1 text-[10px] font-semibold text-white shadow-xs">
                  {notifications}
                </span>
              )}
            </Link>

            <ProfileMenu />
          </div>
        </header>

        {/* Main Routed Content */}
        <main
          className={
            inConversation
              ? 'flex-1 w-full max-w-7xl mx-auto lg:px-10 lg:py-10'
              : 'flex-1 w-full max-w-7xl mx-auto px-4 py-5 sm:px-6 sm:py-8 lg:px-10 lg:py-10 pb-[calc(4.75rem+env(safe-area-inset-bottom))] lg:pb-10'
          }
        >
          <Outlet />
        </main>
      </div>

      {!inConversation ? <MobileBottomNav messagesBadge={messages} /> : null}
    </div>
  );
}
