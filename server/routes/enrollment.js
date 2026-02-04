import express from 'express';
import { authenticate, authorize, ROLES } from '../middleware/auth.js';
import {
    getCourseEnrollments,
    getStudentEnrollments,
    enrollStudents,
    unenrollStudent,
    bulkEnrollFromCSV,
    getEnrollmentStats
} from '../controllers/enrollmentController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET enrollments for a course
router.get('/course/:courseId', getCourseEnrollments);

// GET enrollments for a student
router.get('/student/:studentId', getStudentEnrollments);

// GET enrollment statistics
router.get('/course/:courseId/stats', getEnrollmentStats);

// ENROLL students to a course (Admin/Kaprodi only)
router.post('/enroll', authorize(ROLES.ADMIN, ROLES.KAPRODI), enrollStudents);

// UNENROLL (drop) student from course (Admin/Kaprodi only)
router.delete('/:enrollmentId', authorize(ROLES.ADMIN, ROLES.KAPRODI), unenrollStudent);

// BULK enroll from CSV (Admin/Kaprodi only)
router.post('/bulk-enroll', authorize(ROLES.ADMIN, ROLES.KAPRODI), bulkEnrollFromCSV);

export default router;
