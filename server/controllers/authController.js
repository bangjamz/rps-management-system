import { User, Institusi, Fakultas, Prodi } from '../models/index.js';
import { generateToken } from '../utils/jwt.js';

// Login
export const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }

        // Find user with organizational context
        const user = await User.findOne({
            where: { username },
            include: [
                {
                    model: Institusi,
                    as: 'institusi',
                    attributes: ['id', 'nama', 'singkatan', 'logo_url']
                },
                {
                    model: Fakultas,
                    as: 'fakultas',
                    attributes: ['id', 'kode', 'nama']
                },
                {
                    model: Prodi,
                    as: 'prodi',
                    attributes: ['id', 'kode', 'nama', 'jenjang'],
                    include: [{
                        model: Fakultas,
                        as: 'fakultas',
                        attributes: ['id', 'kode', 'nama']
                    }]
                }
            ]
        });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check if user is active
        if (!user.is_active) {
            return res.status(403).json({ message: 'Account is inactive' });
        }

        // Verify password
        const isValidPassword = await user.comparePassword(password);

        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate token
        const token = generateToken(user.id, user.role);

        // Return user data with organizational context (without password)
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                nama_lengkap: user.nama_lengkap,
                nidn: user.nidn,
                telepon: user.telepon,
                prodi_id: user.prodi_id,
                fakultas_id: user.fakultas_id,
                institusi_id: user.institusi_id,
                // Organizational context
                institusi: user.institusi,
                fakultas: user.fakultas,
                prodi: user.prodi
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get current user profile
export const getProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password_hash'] },
            include: [
                {
                    model: Institusi,
                    as: 'institusi',
                    attributes: ['id', 'nama', 'singkatan', 'logo_url']
                },
                {
                    model: Fakultas,
                    as: 'fakultas',
                    attributes: ['id', 'kode', 'nama']
                },
                {
                    model: Prodi,
                    as: 'prodi',
                    attributes: ['id', 'kode', 'nama', 'jenjang'],
                    include: [{
                        model: Fakultas,
                        as: 'fakultas',
                        attributes: ['id', 'kode', 'nama']
                    }]
                }
            ]
        });

        res.json({ user });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Update profile
export const updateProfile = async (req, res) => {
    try {
        const { nama_lengkap, email } = req.body;
        const user = await User.findByPk(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update allowed fields
        if (nama_lengkap) user.nama_lengkap = nama_lengkap;
        if (email) user.email = email;

        await user.save();

        res.json({
            message: 'Profile updated successfully',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                nama_lengkap: user.nama_lengkap
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Change password
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters' });
        }

        const user = await User.findByPk(req.user.id);

        // Verify current password
        const isValidPassword = await user.comparePassword(currentPassword);

        if (!isValidPassword) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        // Update password
        user.password_hash = newPassword; // Will be hashed by beforeUpdate hook
        await user.save();

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
// Upload profile picture
export const uploadProfilePicture = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Save file path to database (relative path)
        // Note: We use forward slashes for URL compatibility
        const profilePicturePath = req.file.path.replace(/\\/g, '/');

        // Add slash at the beginning if not present so it works with the static mount
        user.foto_profil = '/' + profilePicturePath;
        await user.save();

        res.json({
            message: 'Profile picture updated successfully',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                nama_lengkap: user.nama_lengkap,
                foto_profil: user.foto_profil
            }
        });
    } catch (error) {
        console.error('Upload profile picture error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
