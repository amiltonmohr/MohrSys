import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';

export default function Layout() {
  const { user, tenant, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await authService.logout();
    clearAuth();
    navigate('/login');
  };

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all font-display ${
      isActive ? 'bg-white text-accent-600' : 'text-white/75 hover:text-white hover:bg-white/20'
    }`;

  return (
    <div className="min-h-screen bg-[#f0eef5]">
      {/* Header */}
      <header className="bg-accent-600 sticky top-0 z-50 shadow-lg shadow-accent-600/25">
        <div className="max-w-7xl mx-auto px-8 h-14 flex items-center gap-8">
          {/* Logo */}
          <div className="font-display font-black text-white text-lg shrink-0">
            Offset<span className="text-teal-500">Calc</span>
          </div>

          {/* Nav */}
          <nav className="flex gap-1 flex-1">
            <NavLink to="/dashboard" className={navClass}>Dashboard</NavLink>
            <NavLink to="/quotes" className={navClass}>Orçamentos</NavLink>
            <NavLink to="/quotes/new" className={navClass}>Novo Cálculo</NavLink>
            <NavLink to="/clients" className={navClass}>Clientes</NavLink>
            <NavLink to="/config" className={navClass}>Configurações</NavLink>
          </nav>

          {/* User */}
          <div className="flex items-center gap-4 shrink-0">
            <span className="text-white/70 text-xs font-mono">{tenant?.name}</span>
            <span className="text-white text-xs font-mono">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="text-white/70 hover:text-white text-xs font-bold uppercase tracking-wider"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-8 py-6">
        <Outlet />
      </main>

      <footer className="text-center py-4 text-xs text-gray-400 font-mono border-t border-gray-200 mt-8">
        OffsetCalc SaaS v1.0 · MOHR/SYS · Brasil
      </footer>
    </div>
  );
}
