import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Impersonate a user (Super Admin only)
export const impersonateUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const adminUser = req.user;

        // Only superadmin can impersonate
        if (adminUser.role !== 'superadmin') {
            return res.status(403).json({ message: 'Only superadmin can impersonate users' });
        }

        // Find target user
        const targetUser = await User.findByPk(userId, {
            attributes: { exclude: ['password_hash', 'verification_token'] }
        });

        if (!targetUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Cannot impersonate another superadmin
        if (targetUser.role === 'superadmin' && targetUser.id !== adminUser.id) {
            return res.status(403).json({ message: 'Cannot impersonate another superadmin' });
        }

        // Generate impersonation token
        const impersonationToken = jwt.sign(
            {
                id: targetUser.id,
                role: targetUser.role,
                prodi_id: targetUser.prodi_id,
                fakultas_id: targetUser.fakultas_id,
                isImpersonated: true,
                originalAdminId: adminUser.id,
                originalAdminName: adminUser.nama_lengkap
            },
            JWT_SECRET,
            { expiresIn: '2h' } // Shorter expiry for impersonation
        );

        // Generate admin restore token (to return to admin session)
        const adminRestoreToken = jwt.sign(
            {
                id: adminUser.id,
                role: adminUser.role,
                prodi_id: adminUser.prodi_id,
                fakultas_id: adminUser.fakultas_id
            },
            JWT_SECRET,
            { expiresIn: '4h' }
        );

        res.json({
            message: `Now impersonating ${targetUser.nama_lengkap}`,
            token: impersonationToken,
            adminRestoreToken,
            user: {
                id: targetUser.id,
                username: targetUser.username,
                email: targetUser.email,
                nama_lengkap: targetUser.nama_lengkap,
                role: targetUser.role,
                prodi_id: targetUser.prodi_id,
                fakultas_id: targetUser.fakultas_id,
                available_roles: targetUser.available_roles,
                isImpersonated: true,
                originalAdminId: adminUser.id,
                originalAdminName: adminUser.nama_lengkap
            }
        });
    } catch (error) {
        console.error('Impersonation error:', error);
        res.status(500).json({ message: 'Failed to impersonate user' });
    }
};

// End impersonation session
export const endImpersonation = async (req, res) => {
    try {
        const { adminRestoreToken } = req.body;

        if (!adminRestoreToken) {
            return res.status(400).json({ message: 'Admin restore token required' });
        }

        // Verify the restore token
        const decoded = jwt.verify(adminRestoreToken, JWT_SECRET);

        // Fetch the admin user
        const adminUser = await User.findByPk(decoded.id, {
            attributes: { exclude: ['password_hash', 'verification_token'] }
        });

        if (!adminUser) {
            return res.status(404).json({ message: 'Admin user not found' });
        }

        // Generate new admin token
        const newToken = jwt.sign(
            {
                id: adminUser.id,
                role: adminUser.role,
                prodi_id: adminUser.prodi_id,
                fakultas_id: adminUser.fakultas_id
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Returned to admin session',
            token: newToken,
            user: {
                id: adminUser.id,
                username: adminUser.username,
                email: adminUser.email,
                nama_lengkap: adminUser.nama_lengkap,
                role: adminUser.role,
                prodi_id: adminUser.prodi_id,
                fakultas_id: adminUser.fakultas_id,
                available_roles: adminUser.available_roles
            }
        });
    } catch (error) {
        console.error('End impersonation error:', error);
        res.status(500).json({ message: 'Failed to end impersonation' });
    }
};

// Switch active role (for users with multiple roles)
export const switchRole = async (req, res) => {
    try {
        const { newRole } = req.body;
        const currentUser = req.user;

        // Fetch user with available_roles
        const user = await User.findByPk(currentUser.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if user has this role available
        const availableRoles = user.available_roles || [user.role];

        if (!availableRoles.includes(newRole)) {
            return res.status(403).json({
                message: 'You do not have access to this role',
                availableRoles
            });
        }

        // Generate new token with switched role
        const newToken = jwt.sign(
            {
                id: user.id,
                role: newRole, // Use the new active role
                primaryRole: user.role, // Keep track of primary role
                prodi_id: user.prodi_id,
                fakultas_id: user.fakultas_id,
                isImpersonated: currentUser.isImpersonated || false,
                originalAdminId: currentUser.originalAdminId || null
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: `Switched to ${newRole} role`,
            token: newToken,
            activeRole: newRole,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                nama_lengkap: user.nama_lengkap,
                role: user.role, // Primary role
                activeRole: newRole, // Currently active role
                prodi_id: user.prodi_id,
                fakultas_id: user.fakultas_id,
                available_roles: availableRoles
            }
        });
    } catch (error) {
        console.error('Switch role error:', error);
        res.status(500).json({ message: 'Failed to switch role' });
    }
};
