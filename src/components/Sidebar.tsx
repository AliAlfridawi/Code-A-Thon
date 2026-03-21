import { LayoutDashboard, MessageSquare, UserPlus, Users, Settings, HelpCircle, LogOut } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { motion } from 'motion/react';
import { useClerk } from '@clerk/clerk-react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/' },
  { icon: MessageSquare, label: 'Messages', to: '/messages' },
  { icon: UserPlus, label: 'Pairing', to: '/pairing' },
  { icon: Users, label: 'Members', to: '/members' },
  { icon: Settings, label: 'Settings', to: '/settings' },
];

export default function Sidebar() {
  const { signOut } = useClerk();

  return (
    <aside className="h-screen w-64 sticky top-0 bg-surface-container-low flex flex-col py-6 font-headline text-sm font-medium">
      <div className="px-6 mb-8">
        <h2 className="text-lg font-extrabold tracking-tighter text-primary uppercase">Editorial Hub</h2>
        <p className="text-xs text-primary/70">Academic Excellence</p>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.to === '/'}
          >
            {({ isActive }) => (
              <motion.div
                whileHover={{ x: 4 }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'text-primary/70 hover:bg-white/50'
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
        <a className="flex items-center gap-3 px-4 py-2 text-primary/70 hover:bg-white/50 rounded-xl transition-all duration-300" href="#">
          <HelpCircle size={20} />
          <span>Help</span>
        </a>
        <button
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 px-4 py-2 text-error hover:bg-error-container/20 rounded-xl transition-all duration-300"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

