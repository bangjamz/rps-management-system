import express from 'express';
import { authenticate, authorize, ROLES } from '../middleware/auth.js';
import {
    getAllRPS,
    getRPSById,
    getRPSByCourse,
    getVersionsByCourse,
    createRPS,
    updateRPS as updateRPSController,
    submitRPS,
    approveRPS,
    rejectRPS,
    deleteRPS
} from '../controllers/rpsController.js';
// Import createRevision
import {
    getCurriculumTree,
    createRPS as createRPSDosen,
    createRevision,
    updateRPS as updateRPSDosen,
    bulkUpsertPertemuan,
    getDosenCourses,
    createCPMK,
    createSubCPMK
} from '../controllers/rpsDosenController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// ========== DOSEN RPS CREATION & EDITING ==========
router.get('/curriculum/tree/:prodiId', getCurriculumTree);
router.get('/dosen/my-courses', authorize(ROLES.DOSEN, ROLES.KAPRODI), getDosenCourses);
router.post('/dosen/create', authorize(ROLES.DOSEN, ROLES.KAPRODI), createRPSDosen);
router.post('/dosen/:rpsId/revise', authorize(ROLES.DOSEN, ROLES.KAPRODI), createRevision);
router.put('/dosen/:rpsId/update', authorize(ROLES.DOSEN, ROLES.KAPRODI, ROLES.DEKAN), updateRPSDosen);
router.post('/dosen/:rpsId/pertemuan/bulk', authorize(ROLES.DOSEN, ROLES.KAPRODI, ROLES.DEKAN), bulkUpsertPertemuan);

// Curriculum Data Creation (for RPS context)
router.post('/curriculum/cpmk', authorize(ROLES.DOSEN, ROLES.KAPRODI), createCPMK);
router.post('/curriculum/sub-cpmk', authorize(ROLES.DOSEN, ROLES.KAPRODI), createSubCPMK);

// ========== GENERAL RPS ROUTES ==========
// Get all RPS (role-filtered)
router.get('/', getAllRPS);

// Get RPS by Course ID (for checking if RPS exists)
router.get('/by-course/:courseId', getRPSByCourse);

// Get all RPS versions for a course
router.get('/versions/:courseId', getVersionsByCourse);

// Get RPS by ID
router.get('/:id', getRPSById);

// Create RPS (dosen for instances, kaprodi for templates)
router.post('/', authorize(ROLES.DOSEN, ROLES.KAPRODI), createRPS);

// Update RPS (draft only, owner only)
router.put('/:id', authorize(ROLES.DOSEN, ROLES.KAPRODI), updateRPSController);

// Submit RPS for approval (dosen only)
router.put('/:id/submit', authorize(ROLES.DOSEN, ROLES.KAPRODI), submitRPS);

// Approve/reject RPS (kaprodi only)
router.put('/:id/approve', authorize(ROLES.KAPRODI, ROLES.DEKAN), approveRPS);
router.put('/:id/reject', authorize(ROLES.KAPRODI, ROLES.DEKAN), rejectRPS);

// Delete RPS (draft only, owner only)
router.delete('/:id', authorize(ROLES.DOSEN, ROLES.KAPRODI), deleteRPS);

export default router;
