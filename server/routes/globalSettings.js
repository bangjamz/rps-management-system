import express from 'express';
import * as globalSettingsController from '../controllers/globalSettingsController.js';
import upload from '../middleware/upload.js';
import { authenticate as authenticateToken, authorize as authorizeRole } from '../middleware/auth.js';

const router = express.Router();

// Public route to get settings (for login page etc)
router.get('/', globalSettingsController.getSettings);

// Protected route to update settings (Super Admin only)
router.put('/',
    authenticateToken,
    authorizeRole(['superadmin', 'admin']),
    upload.fields([
        { name: 'logo', maxCount: 1 },
        { name: 'favicon', maxCount: 1 },
        { name: 'kop_surat', maxCount: 1 }
    ]),
    globalSettingsController.updateSettings
);

export default router;
