import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { ROLES } from '../utils/permissions';

/**
 * Protected Route wrapper
 * Redirects to login if not authenticated
 * Redirects to unauthorized if role doesn't match
 */
export default function ProtectedRoute({ children, allowedRoles = [] }) {
    const { isAuthenticated, user, isImpersonating, _hasHydrated } = useAuthStore();

    if (!_hasHydrated) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Check for profile completion (Skip for admins and impersonated sessions)
    const isAdmin = ['superadmin', 'admin', 'admin_institusi', 'dekan'].includes(user?.role);
    const hasProfile = user?.profile; // Assumes backend returns user.profile object
    const isSetupPage = window.location.pathname === '/profile-setup';

    // Skip profile check when impersonating - admin wants to see user's view, not force profile setup
    if (!isAdmin && !hasProfile && !isSetupPage && !isImpersonating) {
        return <Navigate to="/profile-setup" replace />;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
}

/**
 * Redirect authenticated users from login page
 */
export function PublicRoute({ children }) {
    const { isAuthenticated, user, _hasHydrated } = useAuthStore();

    if (!_hasHydrated) {
        return null; // Or a spinner, but null is fine for public route to prevent flash
    }

    if (isAuthenticated && user) {
        // Redirect based on role
        if (user.role === ROLES.KAPRODI) {
            return <Navigate to="/kaprodi/dashboard" replace />;
        } else if (user.role === ROLES.DOSEN) {
            return <Navigate to="/dosen/dashboard" replace />;
        } else if (user.role === ROLES.MAHASISWA) {
            return <Navigate to="/mahasiswa/dashboard" replace />;
        } else if (user.role === 'superadmin' || user.role === 'admin') {
            return <Navigate to="/super-admin" replace />;
        } else {
            return <Navigate to="/dashboard" replace />;
        }
    }

    return children;
}
