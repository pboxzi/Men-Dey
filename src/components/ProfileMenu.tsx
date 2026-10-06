import {ChevronDown, LogOut, Settings, UserRound} from 'lucide-react';
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

  const displayName = profile?.full_name || 'Alex Morgan';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'AM';

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2 hover:bg-stone-200/50 transition-colors focus:outline-hidden cursor-pointer"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={displayName}
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#1E1E1E] text-[#FAF8F5] text-xs font-semibold tracking-wider shadow-xs shrink-0">
          {initials}
        </div>
        <span className="text-xs sm:text-[13px] font-medium text-[#1E1E1E] max-w-36 truncate tracking-tight">
          {displayName}
        </span>
        <ChevronDown
          className="w-3.5 h-3.5 text-stone-500 stroke-[2] transition-transform duration-200"
          style={{transform: open ? 'rotate(180deg)' : 'none'}}
          aria-hidden
        />
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
