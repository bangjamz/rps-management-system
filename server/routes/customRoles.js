import express from 'express';
import {
    getCustomRoles,
    createCustomRole,
    updateCustomRole,
    deleteCustomRole
} from '../controllers/customRolesController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Protected routes (Superadmin & Admin only)
router.use(authenticate);
router.use(authorize(['superadmin', 'admin']));

router.get('/', getCustomRoles);
router.post('/', createCustomRole);
router.put('/:id', updateCustomRole);
router.delete('/:id', deleteCustomRole);

export default router;
