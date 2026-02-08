import { verifyToken } from '../utils/jwt.js';
import { User, Institusi, Fakultas, Prodi, Dosen, UserProfile } from '../models/index.js';

// ========== PERMISSION CONSTANTS ==========
export const ROLES = {
    SUPERADMIN: 'superadmin',
    ADMIN: 'admin',
    ADMIN_INSTITUSI: 'admin_institusi',
    DEKAN: 'dekan',
    KAPRODI: 'kaprodi',
    DOSEN: 'dosen',
    MAHASISWA: 'mahasiswa'
};

export const ORG_LEVELS = {
    INSTITUSI: 'institusi',
    FAKULTAS: 'fakultas',
    PRODI: 'prodi'
};

// ========== AUTHENTICATION MIDDLEWARE ==========
export const authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const decoded = verifyToken(token);

        if (!decoded) {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }

        // Get user with organizational context
        const user = await User.findByPk(decoded.id, {
            attributes: { exclude: ['password_hash'] },
            include: [
                { model: Institusi, as: 'institusi', attributes: ['id', 'nama'] },
                { model: Fakultas, as: 'fakultas', attributes: ['id', 'kode', 'nama'] },
                { model: Prodi, as: 'prodi', attributes: ['id', 'kode', 'nama', 'jenjang', 'fakultas_id'] },
                { model: Dosen, as: 'dosen', attributes: ['id', 'nama_lengkap', 'nidn', 'prodi_id'] },
                { model: UserProfile, as: 'profile' }
            ]
        });

        if (!user || !user.is_active) {
            return res.status(401).json({ message: 'User not found or inactive' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(401).json({ message: 'Authentication failed' });
    }
};

// ========== BASIC ROLE AUTHORIZATION ==========
export const authorize = (...roles) => {
    // Flatten roles in case caller passes an array: authorize(['kaprodi', 'admin'])
    const allowedRoles = roles.flat();

    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: 'Insufficient permissions',
                required: allowedRoles,
                current: req.user.role
            });
        }

        next();
    };
};

// ========== ORGANIZATIONAL ACCESS CONTROL ==========
/**
 * Check if user has access to a specific organizational unit
 * @param {string} level - Organization level: 'institusi', 'fakultas', 'prodi'
 * @param {string} idParam - Request parameter name containing the resource ID
 */
export const checkOrganizationAccess = (level, idParam = 'id') => {
    return async (req, res, next) => {
        try {
            const resourceId = parseInt(req.params[idParam] || req.query[idParam] || req.body[idParam]);

            if (!resourceId) {
                return res.status(400).json({ message: `Missing ${level} ID` });
            }

            const user = req.user;
            const hasAccess = await userHasAccessToResource(user, level, resourceId);

            if (!hasAccess) {
                return res.status(403).json({
                    message: `Access denied to this ${level}`,
                    level,
                    resourceId
                });
            }

            // Attach verified resource ID to request
            req.verifiedResourceId = resourceId;
            req.resourceLevel = level;
            next();
        } catch (error) {
            console.error('Organization access check error:', error);
            return res.status(500).json({ message: 'Access verification failed' });
        }
    };
};

/**
 * Helper function to check if user has access to a resource
 */
async function userHasAccessToResource(user, level, resourceId) {
    const role = user.role;

    // Superadmin and Admin have access to everything
    if (role === ROLES.SUPERADMIN || role === ROLES.ADMIN || role === ROLES.ADMIN_INSTITUSI) {
        return true;
    }

    switch (level) {
        case ORG_LEVELS.INSTITUSI:
            // All users belong to an institusi
            return true;

        case ORG_LEVELS.FAKULTAS:
            if (role === ROLES.DEKAN) {
                // Dekan can only access their own fakultas
                return user.fakultas_id === resourceId;
            }
            if (role === ROLES.KAPRODI || role === ROLES.DOSEN || role === ROLES.MAHASISWA) {
                // Check if user's prodi belongs to this fakultas
                if (user.prodi_id) {
                    const prodi = await Prodi.findByPk(user.prodi_id);
                    return prodi && prodi.fakultas_id === resourceId;
                }
            }
            return false;

        case ORG_LEVELS.PRODI:
            if (role === ROLES.DEKAN) {
                // Dekan can access all prodi in their fakultas
                const prodi = await Prodi.findByPk(resourceId);
                return prodi && user.fakultas_id === prodi.fakultas_id;
            }
            if (role === ROLES.KAPRODI || role === ROLES.DOSEN || role === ROLES.MAHASISWA) {
                // Can only access own prodi
                return user.prodi_id === resourceId;
            }
            return false;

        default:
            return false;
    }
}

/**
 * Check if user can modify CPL at a specific level
 * @param {string} cplLevel - CPL level: 'institusi', 'fakultas', 'prodi'
 */
export const canManageCPLLevel = (cplLevel) => {
    return (req, res, next) => {
        const role = req.user.role;

        const permissions = {
            [ORG_LEVELS.INSTITUSI]: [ROLES.ADMIN_INSTITUSI],
            [ORG_LEVELS.FAKULTAS]: [ROLES.ADMIN_INSTITUSI, ROLES.DEKAN],
            [ORG_LEVELS.PRODI]: [ROLES.ADMIN_INSTITUSI, ROLES.DEKAN, ROLES.KAPRODI]
        };

        if (!permissions[cplLevel] || !permissions[cplLevel].includes(role)) {
            return res.status(403).json({
                message: `Insufficient permissions to manage ${cplLevel}-level CPL`,
                requiredRoles: permissions[cplLevel],
                currentRole: role
            });
        }

        req.cplLevel = cplLevel;
        next();
    };
};

/**
 * Check if user can assign lecturers (cross-faculty support)
 */
export const canAssignLecturers = async (req, res, next) => {
    const role = req.user.role;

    // Only kaprodi and dekan can assign lecturers
    if (![ROLES.KAPRODI, ROLES.DEKAN].includes(role)) {
        return res.status(403).json({
            message: 'Only Kaprodi or Dekan can assign lecturers',
            currentRole: role
        });
    }

    next();
};

/**
 * Check if user owns the resource (e.g., RPS created by dosen)
 * @param {string} ownerField - Field name in resource that contains owner ID (default: 'dosen_id')
 * @param {Function} resourceFetcher - Function to fetch resource by ID
 */
export const isResourceOwner = (resourceFetcher, ownerField = 'dosen_id') => {
    return async (req, res, next) => {
        try {
            const resourceId = parseInt(req.params.id);
            const resource = await resourceFetcher(resourceId);

            if (!resource) {
                return res.status(404).json({ message: 'Resource not found' });
            }

            if (resource[ownerField] !== req.user.id) {
                return res.status(403).json({
                    message: 'You can only modify your own resources'
                });
            }

            req.resource = resource;
            next();
        } catch (error) {
            console.error('Resource ownership check error:', error);
            return res.status(500).json({ message: 'Ownership verification failed' });
        }
    };
};

