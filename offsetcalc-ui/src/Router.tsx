import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import QuoteCalculatorPage from './pages/QuoteCalculatorPage';
import QuotesListPage from './pages/QuotesListPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="quotes" element={<QuotesListPage />} />
          <Route path="quotes/new" element={<QuoteCalculatorPage />} />
          <Route path="clients" element={<div className="text-center text-gray-400 py-20 font-mono">Em desenvolvimento</div>} />
          <Route path="config" element={<div className="text-center text-gray-400 py-20 font-mono">Em desenvolvimento</div>} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
