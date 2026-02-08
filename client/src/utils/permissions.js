import useAuthStore from '../store/useAuthStore';

/**
 * Permission helper for role-based access control
 */

export const ROLES = {
    KAPRODI: 'kaprodi',
    DOSEN: 'dosen',
    MAHASISWA: 'mahasiswa',
    DEKAN: 'dekan',
    QA: 'penjaminan_mutu' // Quality Assurance
};

export const PERMISSIONS = {
    // CPL Permissions
    CPL_CREATE: 'cpl:create',
    CPL_READ: 'cpl:read',
    CPL_UPDATE: 'cpl:update',
    CPL_DELETE: 'cpl:delete',
    CPL_BULK_IMPORT: 'cpl:bulk_import',

    // CPMK Permissions
    CPMK_CREATE: 'cpmk:create',
    CPMK_READ: 'cpmk:read',
    CPMK_UPDATE: 'cpmk:update',
    CPMK_DELETE: 'cpmk:delete',
    CPMK_BULK_IMPORT: 'cpmk:bulk_import',

    // Sub-CPMK Permissions
    SUB_CPMK_CREATE: 'sub_cpmk:create',
    SUB_CPMK_READ: 'sub_cpmk:read',
    SUB_CPMK_UPDATE: 'sub_cpmk:update',
    SUB_CPMK_DELETE: 'sub_cpmk:delete',

    // RPS Permissions
    RPS_CREATE: 'rps:create',
    RPS_READ: 'rps:read',
    RPS_UPDATE: 'rps:update',
    RPS_DELETE: 'rps:delete',
    RPS_APPROVE: 'rps:approve',
    RPS_EXPORT_PDF: 'rps:export_pdf',

    // Grade Permissions
    GRADE_INPUT: 'grade:input',
    GRADE_VIEW: 'grade:view',
    GRADE_EXPORT: 'grade:export',

    // System Permissions
    MANAGE_USERS: 'system:manage_users',
    MANAGE_PRODI: 'system:manage_prodi',
};

// Permission mapping by role
const rolePermissions = {
    [ROLES.KAPRODI]: [
        // Full CRUD for CPL
        PERMISSIONS.CPL_CREATE,
        PERMISSIONS.CPL_READ,
        PERMISSIONS.CPL_UPDATE,
        PERMISSIONS.CPL_DELETE,
        PERMISSIONS.CPL_BULK_IMPORT,

        // Full CRUD for CPMK
        PERMISSIONS.CPMK_CREATE,
        PERMISSIONS.CPMK_READ,
        PERMISSIONS.CPMK_UPDATE,
        PERMISSIONS.CPMK_DELETE,
        PERMISSIONS.CPMK_BULK_IMPORT,

        // Full CRUD for Sub-CPMK
        PERMISSIONS.SUB_CPMK_CREATE,
        PERMISSIONS.SUB_CPMK_READ,
        PERMISSIONS.SUB_CPMK_UPDATE,
        PERMISSIONS.SUB_CPMK_DELETE,

        // RPS management
        PERMISSIONS.RPS_READ,
        PERMISSIONS.RPS_APPROVE,
        PERMISSIONS.RPS_EXPORT_PDF,

        // Grade management
        PERMISSIONS.GRADE_VIEW,
        PERMISSIONS.GRADE_EXPORT,

        // System management
        PERMISSIONS.MANAGE_USERS,
        PERMISSIONS.MANAGE_PRODI,
    ],

    [ROLES.DEKAN]: [
        // Read-only curriculum
        PERMISSIONS.CPL_READ,
        PERMISSIONS.CPMK_READ,
        PERMISSIONS.SUB_CPMK_READ,

        // RPS: Read & Approve
        PERMISSIONS.RPS_READ,
        PERMISSIONS.RPS_APPROVE,
        PERMISSIONS.RPS_EXPORT_PDF,

        // Grade: View & Export
        PERMISSIONS.GRADE_VIEW,
        PERMISSIONS.GRADE_EXPORT,
    ],

    [ROLES.QA]: [
        // Read-only curriculum
        PERMISSIONS.CPL_READ,
        PERMISSIONS.CPMK_READ,
        PERMISSIONS.SUB_CPMK_READ,

        // RPS: Read & Approve
        PERMISSIONS.RPS_READ,
        PERMISSIONS.RPS_APPROVE,
        PERMISSIONS.RPS_EXPORT_PDF,
    ],

    [ROLES.DOSEN]: [
        // CPL: Read-only
        PERMISSIONS.CPL_READ,

        // CPMK: CRU (no Delete for master templates)
        PERMISSIONS.CPMK_CREATE,
        PERMISSIONS.CPMK_READ,
        PERMISSIONS.CPMK_UPDATE,

        // Sub-CPMK: CRU
        PERMISSIONS.SUB_CPMK_CREATE,
        PERMISSIONS.SUB_CPMK_READ,
        PERMISSIONS.SUB_CPMK_UPDATE,

        // RPS: Full CRUD for own RPS
        PERMISSIONS.RPS_CREATE,
        PERMISSIONS.RPS_READ,
        PERMISSIONS.RPS_UPDATE,
        PERMISSIONS.RPS_DELETE,
        PERMISSIONS.RPS_EXPORT_PDF,

        // Grade: Input and view for own courses
        PERMISSIONS.GRADE_INPUT,
        PERMISSIONS.GRADE_VIEW,
        PERMISSIONS.GRADE_EXPORT,
    ],

    [ROLES.MAHASISWA]: [
        // Limited read permissions
        PERMISSIONS.RPS_READ,
        PERMISSIONS.GRADE_VIEW,
    ]
};

/**
 * Check if current user has permission
 * @param {string} permission - Permission to check
 * @returns {boolean}
 */
export const hasPermission = (permission) => {
    const user = useAuthStore.getState().user;
    if (!user) return false;

    const userPermissions = rolePermissions[user.role] || [];
    return userPermissions.includes(permission);
};

/**
 * Check if current user can edit/delete specific CPMK/Sub-CPMK
 * Dosen can only edit their own (is_template=false and created_by=user.id)
 * Kaprodi can edit all
 * @param {Object} item - CPMK or Sub-CPMK object
 * @param {string} action - 'update' or 'delete'
 * @returns {boolean}
 */
export const canEditCPMK = (item, action = 'update') => {
    const user = useAuthStore.getState().user;
    if (!user) return false;

    // Kaprodi can do anything
    if (user.role === ROLES.KAPRODI) {
        return true;
    }

    // Dosen can only update their own non-template CPMK
    if (user.role === ROLES.DOSEN) {
        // Cannot delete master templates
        if (action === 'delete' && item.is_template) {
            return false;
        }

        // Can only edit own items
        return !item.is_template && item.created_by === user.id;
    }

    return false;
};

/**
 * Get allowed actions for current user and resource
 * @param {string} resource - 'cpl', 'cpmk', 'sub-cpmk', 'rps', 'grade'
 * @param {Object} item - Resource item (optional, for ownership check)
 * @returns {Object} { canCreate, canRead, canUpdate, canDelete }
 */
export const getAllowedActions = (resource, item = null) => {
    const user = useAuthStore.getState().user;
    if (!user) return { canCreate: false, canRead: false, canUpdate: false, canDelete: false };

    const actions = {
        canCreate: false,
        canRead: false,
        canUpdate: false,
        canDelete: false,
    };

    switch (resource) {
        case 'cpl':
            actions.canRead = hasPermission(PERMISSIONS.CPL_READ);
            actions.canCreate = hasPermission(PERMISSIONS.CPL_CREATE);
            actions.canUpdate = hasPermission(PERMISSIONS.CPL_UPDATE);
            actions.canDelete = hasPermission(PERMISSIONS.CPL_DELETE);
            break;

        case 'cpmk':
            actions.canRead = hasPermission(PERMISSIONS.CPMK_READ);
            actions.canCreate = hasPermission(PERMISSIONS.CPMK_CREATE);

            if (item) {
                actions.canUpdate = canEditCPMK(item, 'update');
                actions.canDelete = canEditCPMK(item, 'delete');
            } else {
                actions.canUpdate = hasPermission(PERMISSIONS.CPMK_UPDATE);
                actions.canDelete = hasPermission(PERMISSIONS.CPMK_DELETE);
            }
            break;

        case 'sub-cpmk':
            actions.canRead = hasPermission(PERMISSIONS.SUB_CPMK_READ);
            actions.canCreate = hasPermission(PERMISSIONS.SUB_CPMK_CREATE);

            if (item) {
                actions.canUpdate = canEditCPMK(item, 'update');
                actions.canDelete = canEditCPMK(item, 'delete');
            } else {
                actions.canUpdate = hasPermission(PERMISSIONS.SUB_CPMK_UPDATE);
                actions.canDelete = hasPermission(PERMISSIONS.SUB_CPMK_DELETE);
            }
            break;

        case 'rps':
            actions.canRead = hasPermission(PERMISSIONS.RPS_READ);
            actions.canCreate = hasPermission(PERMISSIONS.RPS_CREATE);

            if (item && user.role === ROLES.DOSEN) {
                // Dosen can only edit own RPS
                actions.canUpdate = item.dosen_id === user.id;
                actions.canDelete = item.dosen_id === user.id;
            } else {
                actions.canUpdate = hasPermission(PERMISSIONS.RPS_UPDATE);
                actions.canDelete = hasPermission(PERMISSIONS.RPS_DELETE);
            }
            break;
    }

    return actions;
};

/**
 * Check if user is admin/kaprodi
 * @returns {boolean}
 */
export const isAdmin = () => {
    const user = useAuthStore.getState().user;
    return user?.role === ROLES.KAPRODI;
};

/**
 * Check if user is dosen
 * @returns {boolean}
 */
export const isDosen = () => {
    const user = useAuthStore.getState().user;
    return user?.role === ROLES.DOSEN;
};

/**
 * Check if user is mahasiswa
 * @returns {boolean}
 */
export const isMahasiswa = () => {
    const user = useAuthStore.getState().user;
    return user?.role === ROLES.MAHASISWA;
};

export default {
    ROLES,
    PERMISSIONS,
    hasPermission,
    canEditCPMK,
    getAllowedActions,
    isAdmin,
    isDosen,
    isMahasiswa,
};
