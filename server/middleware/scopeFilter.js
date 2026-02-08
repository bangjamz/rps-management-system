import { ROLES } from './auth.js';

/**
 * Role Hierarchy (higher can access lower's scope):
 * superadmin > admin > dekan > kaprodi > dosen > mahasiswa
 * 
 * Scope Rules:
 * - superadmin: No filter (sees everything)
 * - admin: No filter (sees everything)
 * - dekan: Filtered by fakultas_id
 * - kaprodi: Filtered by prodi_id
 * - dosen: Filtered by prodi_id
 * - mahasiswa: Filtered by prodi_id + angkatan
 */

export const ROLE_HIERARCHY = {
    superadmin: 6,
    admin: 5,
    dekan: 4,
    kaprodi: 3,
    dosen: 2,
    mahasiswa: 1,
    user: 0
};

/**
 * Middleware to attach data scoping filters to the request object based on user's active role.
 * Uses activeRole from JWT if available, otherwise falls back to primary role.
 * 
 * Usage in controller:
 * const { prodi_id, fakultas_id } = req.dataScope;
 * const where = { ...req.dataScope };
 */
export const scopeData = (req, res, next) => {
    const user = req.user;
    const scope = {};

    if (!user) {
        return res.status(401).json({ message: 'User not authenticated' });
    }

    // Use activeRole if present in token, otherwise use primary role
    const activeRole = user.activeRole || user.role;

    // Superadmin and Admin see everything
    if (activeRole === 'superadmin' || activeRole === 'admin' || activeRole === ROLES.ADMIN_INSTITUSI) {
        req.dataScope = {}; // No filter
        req.activeRole = activeRole;
        return next();
    }

    // Dekan sees everything in their Fakultas
    if (activeRole === 'dekan' || activeRole === ROLES.DEKAN) {
        if (user.fakultas_id) {
            scope.fakultas_id = user.fakultas_id;
        } else {
            scope.fakultas_id = -1; // Block if no fakultas assigned
        }
    }

    // Kaprodi sees everything in their Prodi
    if (activeRole === 'kaprodi' || activeRole === ROLES.KAPRODI) {
        if (user.prodi_id) {
            scope.prodi_id = user.prodi_id;
        } else {
            scope.prodi_id = -1;
        }
    }

    // Dosen sees everything in their Prodi
    if (activeRole === 'dosen' || activeRole === ROLES.DOSEN) {
        if (user.prodi_id) {
            scope.prodi_id = user.prodi_id;
        } else {
            scope.prodi_id = -1;
        }
    }

    // Mahasiswa sees only their Prodi + Angkatan filtered courses
    if (activeRole === 'mahasiswa' || activeRole === ROLES.MAHASISWA) {
        if (user.prodi_id) {
            scope.prodi_id = user.prodi_id;
        } else {
            scope.prodi_id = -1;
        }
        // Angkatan filter will be applied separately in MKAktif queries
        scope.angkatan = user.angkatan;
    }

    req.dataScope = scope;
    req.activeRole = activeRole;
    next();
};

/**
 * Helper to merge scope with existing where clause
 */
export const applyScope = (whereClause, req) => {
    return { ...whereClause, ...req.dataScope };
};

/**
 * Check if user's active role has access to a specific role level
 */
export const hasRoleAccess = (userRole, requiredRole) => {
    return (ROLE_HIERARCHY[userRole] || 0) >= (ROLE_HIERARCHY[requiredRole] || 0);
};

