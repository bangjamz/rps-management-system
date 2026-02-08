import express from 'express';
import {
    login,
    register,
    verifyEmail,
    getProfile,
    updateProfile,
    changePassword,
    uploadProfilePicture,
    uploadCoverImage,
    uploadSignature,
    getPublicSignatures
} from '../controllers/authController.js';
import {
    impersonateUser,
    endImpersonation,
    switchRole
} from '../controllers/impersonationController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Public routes
router.post('/login', login);
router.post('/register', register);
router.get('/verify-email', verifyEmail);

// Protected routes
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.post('/change-password', authenticate, changePassword);

// Role Switching (for users with multiple roles)
router.post('/switch-role', authenticate, switchRole);

// Impersonation (Super Admin only)
// IMPORTANT: Static routes must come before parameterized routes
router.post('/impersonate/end', authenticate, endImpersonation);
router.post('/impersonate/:userId', authenticate, authorize(['superadmin']), impersonateUser);

// Profile Picture Upload
const uploadDir = 'uploads/profiles';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only image files are allowed!'));
    }
});

router.post('/profile-picture', authenticate, upload.single('photo'), uploadProfilePicture);
router.post('/cover-image', authenticate, upload.single('cover'), uploadCoverImage);
router.post('/signature', authenticate, upload.single('signature'), uploadSignature);
router.get('/signatures', authenticate, getPublicSignatures);

export default router;

