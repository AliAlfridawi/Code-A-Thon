import { Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

export default function App() {
  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Header />

        <main className="flex-1 p-8 lg:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
