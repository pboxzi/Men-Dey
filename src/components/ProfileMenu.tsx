import {ChevronDown, FileText, FolderClosed, LogOut, Settings, UserRound} from 'lucide-react';
import {useEffect, useRef, useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';

import {useAuth} from '../auth/AuthContext';

export function ProfileMenu() {
  const {profile, role, signOut} = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const onDocClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const displayName = profile?.full_name || profile?.email || 'Account';
  const initials =
    (profile?.full_name || profile?.email || '')
      .split(/[\s@.]+/)
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || '';

  const itemClass =
    'flex min-h-11 w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-ink transition-colors hover:bg-stone/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold';

  const close = () => setOpen(false);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="group flex h-11 w-11 items-center justify-center rounded-full transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#C89B3C]/60 cursor-pointer hover:bg-stone-200/50"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${displayName}`}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#2A2724] to-[#14171A] font-serif text-[13px] font-medium tracking-[0.08em] text-[#E6C27A] ring-1 ring-[#C89B3C]/70 shadow-sm">
          {initials || <UserRound className="size-4" aria-hidden />}
        </span>
        <ChevronDown
          className="hidden h-3.5 w-3.5 text-stone-500 transition-transform duration-200 group-hover:text-[#1E1E1E] sm:block"
          style={{transform: open ? 'rotate(180deg)' : 'none'}}
          aria-hidden
        />
      </button>

      {open ? (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] lg:hidden"
            onClick={close}
            aria-hidden="true"
          />
          <div
            role="menu"
            aria-label="Account"
            className="fixed inset-x-0 bottom-0 z-50 border-t border-[#EAE4DA] bg-[#FCFAF7] p-2 shadow-[0_-16px_40px_-20px_rgba(30,30,30,0.35)] lg:absolute lg:inset-x-auto lg:right-0 lg:bottom-auto lg:top-full lg:mt-2 lg:w-60 lg:rounded-lg lg:border lg:shadow-lg"
            style={{paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))'}}
          >
            <div className="border-b border-stone px-3 pb-2.5 pt-2 lg:pb-2">
              <p className="truncate text-xs font-medium text-ink">{displayName}</p>
              <p className="truncate text-[11px] text-muted">
                {role === 'user' ? 'Private account' : role === 'admin' ? 'Administrator' : 'Management'} ·{' '}
                {profile?.email}
              </p>
            </div>

            <div className="mt-1.5 flex flex-col">
              <Link
                to="/dashboard/profile"
                role="menuitem"
                className={itemClass}
                onClick={close}
              >
                <UserRound className="size-4 shrink-0 text-muted" aria-hidden />
                Profile
              </Link>
              <Link
                to="/dashboard/documents"
                role="menuitem"
                className={itemClass}
                onClick={close}
              >
                <FolderClosed className="size-4 shrink-0 text-muted" aria-hidden />
                Documents
              </Link>
              <Link
                to="/dashboard/notifications"
                role="menuitem"
                className={itemClass}
                onClick={close}
              >
                <FileText className="size-4 shrink-0 text-muted" aria-hidden />
                Notifications
              </Link>
              <Link
                to="/dashboard/settings"
                role="menuitem"
                className={itemClass}
                onClick={close}
              >
                <Settings className="size-4 shrink-0 text-muted" aria-hidden />
                Settings
              </Link>
              <button
                type="button"
                role="menuitem"
                className={`${itemClass} text-danger hover:bg-danger/10`}
                onClick={() => {
                  close();
                  void signOut().then(() => navigate('/sign-in', {replace: true}));
                }}
              >
                <LogOut className="size-4 shrink-0" aria-hidden />
                Sign out
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
