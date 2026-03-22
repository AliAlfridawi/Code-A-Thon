import { Bell } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { UserButton, useUser } from '@clerk/clerk-react';
import {
  ADMIN_PAIRING_ROUTE,
  getDefaultSignedInRoute,
  HELP_ROUTE,
  isAdminEmail,
  MESSAGES_ROUTE,
  PAIRING_ROUTE,
} from '../constants/routes';

export default function Header() {
  const { user } = useUser();
  const linkClass = (isActive: boolean) =>
    `transition-colors duration-200 px-3 py-1 rounded-lg ${
      isActive
        ? 'text-primary font-semibold'
        : 'text-on-surface-variant hover:bg-surface-container-low'
    }`;
  const isAdmin = isAdminEmail(user?.primaryEmailAddress?.emailAddress);
  const dashboardRoute = getDefaultSignedInRoute(user?.primaryEmailAddress?.emailAddress);
  const pairingRoute = isAdmin ? ADMIN_PAIRING_ROUTE : PAIRING_ROUTE;

  return (
    <header className="sticky top-0 z-40 flex h-[var(--app-header-height)] w-full items-center justify-between border-b border-outline-variant/10 bg-surface-container-lowest/80 px-[var(--app-header-px)] font-headline tracking-tight shadow-[0_20px_40px_rgba(0,0,0,0.04)] backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <span className="text-xl font-bold text-primary">Scholarly Editorial</span>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center gap-8">
          <NavLink to={dashboardRoute} end className={({ isActive }) => linkClass(isActive)}>
            {isAdmin ? 'Dashboard' : 'My Dashboard'}
          </NavLink>
          <NavLink to={MESSAGES_ROUTE} className={({ isActive }) => linkClass(isActive)}>Messages</NavLink>
          <NavLink to={pairingRoute} className={({ isActive }) => linkClass(isActive)}>
            {isAdmin ? 'Admin Pairing' : 'Pairing'}
          </NavLink>
          <NavLink to={HELP_ROUTE} className={({ isActive }) => linkClass(isActive)}>Help</NavLink>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-full hover:bg-surface-container-low transition-colors duration-200 active:scale-95">
            <Bell size={20} className="text-on-surface-variant" />
          </button>
          <UserButton
            appearance={{
              elements: {
                avatarBox: 'w-9 h-9 rounded-full',
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}
