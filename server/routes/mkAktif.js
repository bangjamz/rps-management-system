import express from 'express';
import {
    getMKAktif,
    getMyMKAktif,
    upsertMKAktif,
    bulkAssignAngkatan,
    deleteMKAktif
} from '../controllers/mkAktifController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { scopeData } from '../middleware/scopeFilter.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Mahasiswa: Get their courses based on prodi + angkatan
router.get('/my', scopeData, getMyMKAktif);

// Kaprodi/Admin: Get all active courses (filtered by query params)
router.get('/', scopeData, getMKAktif);

// Kaprodi/Admin: Create or update active course
router.post('/', authorize(['kaprodi', 'dekan', 'admin', 'superadmin']), upsertMKAktif);

// Kaprodi/Admin: Bulk assign angkatan to courses
router.post('/bulk-assign', authorize(['kaprodi', 'dekan', 'admin', 'superadmin']), bulkAssignAngkatan);

// Kaprodi/Admin: Delete active course
router.delete('/:id', authorize(['kaprodi', 'dekan', 'admin', 'superadmin']), deleteMKAktif);

export default router;
