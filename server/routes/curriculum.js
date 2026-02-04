import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
    getAllCPL,
    getAllCPMK,
    getAllSubCPMK,
    createCPL,
    bulkImportCPL,
    updateCPL,
    deleteCPL,
    createCPMK,
    updateCPMK,
    deleteCPMK,
    createSubCPMK,
    updateSubCPMK,
    deleteSubCPMK
} from '../controllers/curriculumController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// CPL routes
router.get('/cpl', getAllCPL);
router.post('/cpl', authorize('kaprodi'), createCPL);
router.post('/cpl/bulk', authorize('kaprodi'), bulkImportCPL);
router.put('/cpl/:id', authorize('kaprodi'), updateCPL);
router.delete('/cpl/:id', authorize('kaprodi'), deleteCPL);

// CPMK routes
router.get('/cpmk', getAllCPMK);
router.post('/cpmk', authorize('kaprodi'), createCPMK);
router.put('/cpmk/:id', authorize('kaprodi'), updateCPMK);
router.delete('/cpmk/:id', authorize('kaprodi'), deleteCPMK);

// Sub-CPMK routes
router.get('/sub-cpmk', getAllSubCPMK);
router.post('/sub-cpmk', authorize('kaprodi'), createSubCPMK);
router.put('/sub-cpmk/:id', authorize('kaprodi'), updateSubCPMK);
router.delete('/sub-cpmk/:id', authorize('kaprodi'), deleteSubCPMK);

export default router;
