import { User, Institusi, Fakultas, Prodi, UserProfile } from '../models/index.js';
import { generateToken } from '../utils/jwt.js';
import { sendVerificationEmail } from '../utils/emailService.js';
import crypto from 'crypto';
import { Op } from 'sequelize';

// Register with email verification
export const register = async (req, res) => {
    try {
        const { username, email, password, nama_lengkap, role, prodi_id } = req.body;

        // Basic validation
        if (!username || !email || !password || !nama_lengkap) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check existing user
        const existingUser = await User.findOne({
            where: {
                [Op.or]: [{ email }, { username }]
            }
        });

        if (existingUser) {
            return res.status(400).json({ message: 'Username or email already exists' });
        }

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const tokenExpires = new Date();
        tokenExpires.setHours(tokenExpires.getHours() + 24); // 24 hours expiry

        // Set initial status based on role
        // Students & Users: pending email verification -> approved automatically (unless config says otherwise)
        // Dosen: pending verification -> pending approval
        let initialStatus = 'pending';

        const newUser = await User.create({
            username,
            email,
            password_hash: password, // Will be hashed by hook
            nama_lengkap,
            role: role || 'user',
            prodi_id: prodi_id || null,
            status: 'pending',
            email_verified: false,
            verification_token: verificationToken,
            verification_token_expires: tokenExpires
        });

        // Send verification email
        try {
            await sendVerificationEmail(newUser, verificationToken);
        } catch (emailError) {
            console.error('Failed to send email:', emailError);
            // Don't block registration, but warn client
        }

        res.status(201).json({
            message: 'Registration successful. Please check your email to verify your account.',
            userId: newUser.id
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Verify Email
export const verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;

        const user = await User.findOne({
            where: {
                verification_token: token,
                verification_token_expires: { [Op.gt]: new Date() }
            }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired verification token' });
        }

        user.email_verified = true;
        user.verification_token = null;
        user.verification_token_expires = null;

        // Auto-approve 'user' and 'mahasiswa' roles after email verify (can be changed later)
        if (['user', 'mahasiswa'].includes(user.role)) {
            user.status = 'approved'; // Active immediately
            user.approved_at = new Date();
        } else {
            // Dosen & others need admin approval
            user.status = 'pending';
        }

        await user.save();

        res.json({ message: 'Email verified successfully. You can now login.' });

    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Login with Status Check
export const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }

        const user = await User.findOne({
            where: { username },
            include: [
                { model: Institusi, as: 'institusi' },
                { model: Fakultas, as: 'fakultas' },
                { model: Prodi, as: 'prodi' },
                { model: UserProfile, as: 'profile' }
            ]
        });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // ...

        const token = generateToken(user.id, user.role);

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                activeRole: user.role, // Initially same as primary role
                available_roles: user.available_roles || [user.role],
                status: user.status,
                nama_lengkap: user.nama_lengkap,
                prodi_id: user.prodi_id,
                fakultas_id: user.fakultas_id,
                angkatan: user.angkatan,
                institusi: user.institusi,
                fakultas: user.fakultas,
                prodi: user.prodi,
                profile: user.profile
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// ... existing profile methods ...
export const getProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password_hash', 'verification_token'] },
            include: [
                { model: Institusi, as: 'institusi' },
                { model: Fakultas, as: 'fakultas' },
                { model: Prodi, as: 'prodi' }
            ]
        });
        res.json({ user });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// ... keep updateProfile, changePassword, uploadProfilePicture as they are ...
export const updateProfile = async (req, res) => {
    try {
        const { nama_lengkap, email, cover_image } = req.body;
        const user = await User.findByPk(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (nama_lengkap) user.nama_lengkap = nama_lengkap;
        if (email) user.email = email;
        if (cover_image !== undefined) user.cover_image = cover_image;

        await user.save();

        res.json({
            message: 'Profile updated successfully',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                nama_lengkap: user.nama_lengkap,
                cover_image: user.cover_image,
                foto_profil: user.foto_profil
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Required fields missing' });
        if (newPassword.length < 6) return res.status(400).json({ message: 'Password too short' });

        const user = await User.findByPk(req.user.id);
        const isValid = await user.comparePassword(currentPassword);
        if (!isValid) return res.status(401).json({ message: 'Incorrect password' });

        user.password_hash = newPassword;
        await user.save();

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const uploadProfilePicture = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
        const user = await User.findByPk(req.user.id);
        const p = req.file.path.replace(/\\/g, '/');
        // If getting relative path, ensure it starts with /
        user.foto_profil = p.startsWith('/') ? p : '/' + p;
        await user.save();
        res.json({ message: 'Uploaded', user: { foto_profil: user.foto_profil } });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const uploadCoverImage = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
        const user = await User.findByPk(req.user.id);
        const p = req.file.path.replace(/\\/g, '/');
        user.cover_image = p.startsWith('/') ? p : '/' + p;
        await user.save();
        res.json({ message: 'Cover uploaded', user: { cover_image: user.cover_image } });
    } catch (error) {
        console.error('Cover upload error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const uploadSignature = async (req, res) => {
    try {
        const { signature } = req.body; // Expecting base64 string or file path if handled by multer
        const user = await User.findByPk(req.user.id);

        // If it's a file upload via multer
        if (req.file) {
            const p = req.file.path.replace(/\\/g, '/');
            user.signature = p.startsWith('/') ? p : '/' + p;
        }
        // If it's a base64 string (from canvas draw)
        else if (signature && signature.startsWith('data:image')) {
            // Save base64 as file
            const fs = await import('fs');
            const path = await import('path');
            const base64Data = signature.replace(/^data:image\/\w+;base64,/, "");
            const buffer = Buffer.from(base64Data, 'base64');

            const uploadDir = 'uploads/signatures';
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const filename = `signature-${user.id}-${Date.now()}.png`;
            const filepath = path.join(uploadDir, filename);

            fs.writeFileSync(filepath, buffer);
            user.signature = '/' + filepath; // key change: ensure valid web path
        }
        // If null passed (delete)
        else if (signature === null) {
            // Optional: delete old file
            user.signature = null;
        }

        await user.save();
        res.json({ message: 'Signature updated', user: { signature: user.signature } });
    } catch (error) {
        console.error('Signature upload error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getPublicSignatures = async (req, res) => {
    try {
        const users = await User.findAll({
            where: {
                signature: { [Op.not]: null }
            },
            attributes: ['nama_lengkap', 'signature']
        });
        res.json(users);
    } catch (error) {
        console.error('Get signatures error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
