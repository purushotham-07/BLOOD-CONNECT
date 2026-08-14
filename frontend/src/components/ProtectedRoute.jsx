import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loading from './Loading';

/**
 * Restricts a route to authenticated users. Optionally restrict to a role:
 *   <ProtectedRoute role="ADMIN"><AdminDashboard /></ProtectedRoute>
 */
export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loading />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role && user.role !== role) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="rounded-xl bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-semibold text-gray-800">403 — Access denied</p>
          <p className="mt-1 text-sm text-gray-500">
            You need the <span className="font-medium text-gray-700">{role}</span> role to view this page.
          </p>
        </div>
      </div>
    );
  }

  return children;
}