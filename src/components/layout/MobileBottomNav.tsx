import {CreditCard, FileText, House, LayoutDashboard, MessageSquare} from 'lucide-react';
import {NavLink} from 'react-router-dom';

interface MobileBottomNavProps {
  messagesBadge?: number;
}

const ITEMS = [
  {to: '/home', label: 'Home', icon: House, end: true},
  {to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true},
  {to: '/dashboard/messages', label: 'Messages', icon: MessageSquare},
  {to: '/dashboard/requests', label: 'Requests', icon: FileText},
  {to: '/dashboard/membership', label: 'Membership', icon: CreditCard},
];

export function MobileBottomNav({messagesBadge = 0}: MobileBottomNavProps) {
  return (
    <nav
      aria-label="Primary mobile"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-[#EAE4DA] bg-[#FCFAF7]/97 backdrop-blur-md shadow-[0_-6px_20px_-12px_rgba(30,30,30,0.25)] lg:hidden"
      style={{paddingBottom: 'env(safe-area-inset-bottom)'}}
    >
      <ul className="mx-auto flex h-16 w-full max-w-md items-stretch justify-between px-1">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.to} className="flex-1">
              <NavLink
                to={item.to}
                end={item.end}
                className={({isActive}) =>
                  `relative flex h-full min-h-11 w-full flex-col items-center justify-center gap-1 px-0.5 pt-1 transition-colors ${
                    isActive ? 'text-[#C89B3C]' : 'text-[#6E6A63] hover:text-[#1E1E1E]'
                  }`
                }
              >
                {({isActive}) => (
                  <>
                    <span
                      aria-hidden="true"
                      className={`absolute top-0 h-0.5 w-7 rounded-b-full transition-colors ${
                        isActive ? 'bg-[#C89B3C]' : 'bg-transparent'
                      }`}
                    />
                    <span className="relative">
                      <Icon className="h-[21px] w-[21px] stroke-[1.7]" aria-hidden="true" />
                      {item.label === 'Messages' && messagesBadge > 0 ? (
                        <span className="absolute -top-1 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#C89B3C] px-1 text-[9px] font-semibold leading-none text-white">
                          {messagesBadge}
                        </span>
                      ) : null}
                    </span>
                    <span className="text-[9.5px] font-medium uppercase tracking-[0.08em] leading-none">
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
