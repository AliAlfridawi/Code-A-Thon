import { Bell } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { UserButton } from '@clerk/clerk-react';

export default function Header() {
  const linkClass = (isActive: boolean) =>
    `transition-colors duration-200 px-3 py-1 rounded-lg ${
      isActive
        ? 'text-primary font-semibold'
        : 'text-on-surface-variant hover:bg-surface-container-low'
    }`;

  return (
    <header className="sticky top-0 w-full flex justify-between items-center px-8 h-16 bg-white/80 backdrop-blur-xl z-40 shadow-[0_20px_40px_rgba(0,0,0,0.04)] font-headline antialiased tracking-tight">
      <div className="flex items-center gap-2">
        <span className="text-xl font-bold text-primary">Scholarly Editorial</span>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center gap-8">
          <NavLink to="/" end className={({ isActive }) => linkClass(isActive)}>Dashboard</NavLink>
          <NavLink to="/messages" className={({ isActive }) => linkClass(isActive)}>Messages</NavLink>
          <NavLink to="/pairing" className={({ isActive }) => linkClass(isActive)}>Pairing</NavLink>
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
