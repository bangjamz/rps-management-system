
import express from 'express';
import {
    getAcademicYears,
    createAcademicYear,
    updateAcademicYear,
    setActiveAcademicYear,
    getAllCourses
} from '../controllers/academicYearController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, getAcademicYears);
router.get('/courses/all', authenticate, getAllCourses);
router.post('/', authenticate, authorize(['superadmin', 'admin', 'kaprodi', 'admin_institusi']), createAcademicYear);
router.put('/:id', authenticate, authorize(['superadmin', 'admin', 'kaprodi', 'admin_institusi']), updateAcademicYear);
router.put('/:id/activate', authenticate, authorize(['superadmin', 'admin']), setActiveAcademicYear);

export default router;
