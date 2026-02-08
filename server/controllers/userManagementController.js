import { User, UserProfile } from '../models/index.js';
import { Op } from 'sequelize';

// Get list of pending users for approval
export const getPendingUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            where: { status: 'pending' },
            attributes: { exclude: ['password_hash', 'verification_token'] }
        });
        res.json(users);
    } catch (error) {
        console.error('Error fetching pending users:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Approve user
export const approveUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const adminId = req.user.id;

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.status = 'approved';
        user.approved_by = adminId;
        user.approved_at = new Date();
        await user.save();

        // Optional: Send approval email here

        res.json({ message: 'User approved successfully', user });
    } catch (error) {
        console.error('Error approving user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Reject user
export const rejectUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.status = 'rejected';
        await user.save();

        res.json({ message: 'User rejected successfully' });
    } catch (error) {
        console.error('Error rejecting user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get all users (with filters)
export const getAllUsers = async (req, res) => {
    try {
        const { role, status } = req.query;
        const where = {};

        if (role) where.role = role;
        if (status) where.status = status;

        const users = await User.findAll({
            where,
            attributes: { exclude: ['password_hash', 'verification_token'] }
        });
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Promote/Demote User Role
export const changeUserRole = async (req, res) => {
    try {
        const { userId } = req.params;
        const { newRole } = req.body;

        if (!['user', 'mahasiswa', 'dosen', 'kaprodi', 'dekan', 'admin', 'superadmin', 'admin_institusi'].includes(newRole)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.role = newRole;
        await user.save();

        res.json({ message: `User role changed to ${newRole}`, user });
    } catch (error) {
        console.error('Error changing user role:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Update user details
export const updateUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { nama_lengkap, email, username, role, angkatan, prodi_id } = req.body;

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check unique constraints if changing email/username
        if ((email && email !== user.email) || (username && username !== user.username)) {
            const existing = await User.findOne({
                where: {
                    [Op.or]: [
                        email ? { email } : null,
                        username ? { username } : null
                    ].filter(Boolean),
                    id: { [Op.ne]: userId }
                }
            });
            if (existing) {
                return res.status(400).json({ message: 'Email or username already taken' });
            }
        }

        if (nama_lengkap) user.nama_lengkap = nama_lengkap;
        if (email) user.email = email;
        if (username) user.username = username;
        if (role) user.role = role;
        // Allow setting angkatan/prodi_id to null explicitly if needed, or update if provided
        if (angkatan !== undefined) user.angkatan = angkatan;
        if (prodi_id !== undefined) user.prodi_id = prodi_id;

        await user.save();

        res.json({ message: 'User updated successfully', user });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Create new user
export const createUser = async (req, res) => {
    try {
        const { username, password, email, role, nama_lengkap, angkatan, prodi_id } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({
            where: {
                [Op.or]: [{ username }, { email }]
            }
        });

        if (existingUser) {
            return res.status(400).json({ message: 'Username or email already exists' });
        }

        const newUser = await User.create({
            username,
            email,
            password_hash: password, // Will be hashed by model hook
            role,
            nama_lengkap,
            angkatan: angkatan || null,
            prodi_id: prodi_id || null,
            status: 'approved', // Auto-approve users created by admin
            is_active: true
        });

        // Create empty profile
        const profileType = role === 'mahasiswa' ? 'mahasiswa' : 'dosen';
        await UserProfile.create({
            user_id: newUser.id,
            profile_type: profileType
        });

        res.status(201).json({ message: 'User created successfully', user: newUser });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Reset user password (Super Admin action)
export const resetPassword = async (req, res) => {
    try {
        const { userId } = req.params;
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.password_hash = newPassword; // Hook handles hashing
        await user.save();

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Import users from CSV
export const importUsers = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No CSV file uploaded' });
        }

        const csv = require('csv-parse/sync');
        const fs = require('fs');
        const crypto = require('crypto');

        const fileContent = fs.readFileSync(req.file.path, 'utf-8');
        const records = csv.parse(fileContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true
        });

        let successCount = 0;
        const errors = [];

        for (const row of records) {
            try {
                const { nama_lengkap, email, username, role } = row;

                if (!nama_lengkap || !email) {
                    errors.push({ row, error: 'Missing required fields (nama_lengkap, email)' });
                    continue;
                }

                // Check if user already exists
                const existing = await User.findOne({ where: { email } });
                if (existing) {
                    errors.push({ email, error: 'User already exists' });
                    continue;
                }

                // Generate temporary password
                const tempPassword = crypto.randomBytes(8).toString('hex');

                await User.create({
                    username: username || email.split('@')[0],
                    email,
                    password_hash: tempPassword, // Will be hashed by model hook
                    nama_lengkap,
                    role: role || 'mahasiswa',
                    status: 'approved',
                    is_active: true
                });

                successCount++;
            } catch (rowError) {
                errors.push({ row, error: rowError.message });
            }
        }

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        res.json({
            message: `Imported ${successCount} users successfully`,
            count: successCount,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (error) {
        console.error('Error importing users:', error);
        res.status(500).json({ message: 'Failed to import users: ' + error.message });
    }
};
