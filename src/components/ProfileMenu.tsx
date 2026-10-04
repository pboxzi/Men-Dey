import {LogOut, Settings, UserRound} from 'lucide-react';
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

  const label = profile?.full_name || profile?.email || 'Account';

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="btn btn-ghost"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <UserRound className="size-4" aria-hidden />
        <span className="max-w-36 truncate">{label}</span>
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-56 surface p-2 shadow-lg"
        >
          <p className="border-b border-stone px-3 pb-2 pt-1 text-xs text-muted">
            {role === 'user' ? 'Private account' : role === 'admin' ? 'Administrator' : 'Management'} ·{' '}
            {profile?.email}
          </p>
          <Link
            to="/dashboard/profile"
            role="menuitem"
            className="flex items-center gap-2 rounded-sm px-3 py-2 text-sm text-ink hover:bg-stone/70"
            onClick={() => setOpen(false)}
          >
            <UserRound className="size-4" aria-hidden />
            Profile
          </Link>
          <Link
            to="/dashboard/settings"
            role="menuitem"
            className="flex items-center gap-2 rounded-sm px-3 py-2 text-sm text-ink hover:bg-stone/70"
            onClick={() => setOpen(false)}
          >
            <Settings className="size-4" aria-hidden />
            Settings
          </Link>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-sm text-danger hover:bg-stone/70"
            onClick={() => {
              setOpen(false);
              void signOut().then(() => navigate('/sign-in', {replace: true}));
            }}
          >
            <LogOut className="size-4" aria-hidden />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
