import express from 'express';
import multer from 'multer';
import {
    getPendingUsers,
    approveUser,
    rejectUser,
    getAllUsers,
    changeUserRole,
    createUser,
    updateUser,
    resetPassword,
    importUsers
} from '../controllers/userManagementController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for CSV uploads
const upload = multer({ dest: 'uploads/' });

// All routes require authentication
router.use(authenticate);

// List pending users (Superadmin & Admin)
router.get('/pending', authorize(['superadmin', 'admin_institusi', 'admin']), getPendingUsers);

// Approve/Reject users (Superadmin & Admin)
router.post('/:userId/approve', authorize(['superadmin', 'admin_institusi', 'admin']), approveUser);
router.post('/:userId/reject', authorize(['superadmin', 'admin_institusi', 'admin']), rejectUser);

// List all users
router.get('/', authorize(['superadmin', 'admin_institusi', 'admin']), getAllUsers);

// Promote/Demote (Superadmin only)
router.post('/:userId/role', authorize(['superadmin', 'admin_institusi']), changeUserRole);

// Create new user
router.post('/', authorize(['superadmin', 'admin_institusi', 'admin']), createUser);

// Import users from CSV (Superadmin & Admin)
router.post('/import', authorize(['superadmin', 'admin_institusi', 'admin']), upload.single('file'), importUsers);

// Update user (Superadmin & Admin)
router.put('/:userId', authorize(['superadmin', 'admin_institusi', 'admin']), updateUser);

// Reset password (Superadmin only)
router.post('/:userId/reset-password', authorize(['superadmin']), resetPassword);

export default router;
