import { LayoutDashboard, MessageSquare, UserPlus, Users, Settings, HelpCircle, LogOut, CalendarDays, Sparkles } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { motion } from 'motion/react';
import { useClerk, useUser } from '@clerk/clerk-react';
import { clearOnboardingStatusCache } from '../hooks/useOnboardingStatus';
import { HELP_ROUTE, isAdminEmail, SIGN_IN_ROUTE } from '../constants/routes';

// Admin-only nav items
const adminNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/' },
  { icon: Users, label: 'Members', to: '/members' },
  { icon: UserPlus, label: 'Pairing (Admin)', to: '/admin-pairing' },
  { icon: MessageSquare, label: 'Messages', to: '/messages' },
  { icon: CalendarDays, label: 'Calendar', to: '/calendar' },
  { icon: Settings, label: 'Settings', to: '/settings' },
];

// Regular user nav items
const userNavItems = [
  { icon: LayoutDashboard, label: 'My Dashboard', to: '/my-dashboard' },
  { icon: Sparkles, label: 'Matching', to: '/pairing' },
  { icon: MessageSquare, label: 'Messages', to: '/messages' },
  { icon: CalendarDays, label: 'Calendar', to: '/calendar' },
  { icon: Settings, label: 'Settings', to: '/settings' },
];

export default function Sidebar() {
  const { signOut } = useClerk();
  const { user } = useUser();

  const isAdmin = isAdminEmail(user?.primaryEmailAddress?.emailAddress);
  const navItems = isAdmin ? adminNavItems : userNavItems;

  return (
    <aside className="sticky top-0 flex h-screen w-[var(--app-sidebar-width)] flex-col bg-surface-container-low py-[var(--app-sidebar-py)] font-headline text-sm font-medium">
      <div className="px-6 mb-8">
        <h2 className="text-lg font-extrabold tracking-tighter text-primary uppercase">Editorial Hub</h2>
        <p className="text-xs text-primary/70">Academic Excellence</p>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.to === '/' || item.to === '/my-dashboard'}
          >
            {({ isActive }) => (
              <motion.div
                whileHover={{ x: 4 }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'text-primary/70 hover:bg-surface-container-lowest/70'
                }`}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </motion.div>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 mt-auto border-t border-outline-variant/20 space-y-1">
        <NavLink to={HELP_ROUTE}>
          {({ isActive }) => (
            <div
              className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-300 ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-primary/70 hover:bg-surface-container-lowest/70'
              }`}
            >
              <HelpCircle size={20} />
              <span>Help</span>
            </div>
          )}
        </NavLink>
        <button
          onClick={() => {
            clearOnboardingStatusCache();
            void signOut({ redirectUrl: SIGN_IN_ROUTE });
          }}
          className="w-full flex items-center gap-3 px-4 py-2 text-error hover:bg-error-container/20 rounded-xl transition-all duration-300"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
