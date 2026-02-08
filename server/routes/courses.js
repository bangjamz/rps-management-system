import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { scopeData } from '../middleware/scopeFilter.js';
import {
    getAllCourses,
    getCourseById,
    createCourse,
    updateCourse,
    deleteCourse
} from '../controllers/coursesController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);
router.use(scopeData);

// Course routes
router.get('/', getAllCourses);
router.get('/:id', getCourseById);
router.post('/', authorize('kaprodi'), createCourse);
router.put('/:id', authorize('kaprodi'), updateCourse);
router.delete('/:id', authorize('kaprodi'), deleteCourse);

export default router;
