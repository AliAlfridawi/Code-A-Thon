import { Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

export default function App() {
  return (
    <div className="flex min-h-screen bg-surface text-on-surface">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header />

        <main className="flex-1 px-[var(--app-main-px)] py-[var(--app-main-py)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
