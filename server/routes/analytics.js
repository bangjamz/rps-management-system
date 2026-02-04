import express from 'express';
import { authenticate, authorize, ROLES } from '../middleware/auth.js';
import {
    getGradeDistribution,
    getAttendanceTrends,
    getCPLAttainment,
    getDashboardStats,
    getCoursesForAnalytics
} from '../controllers/analyticsController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Dashboard stats
router.get('/dashboard/stats', authorize(ROLES.KAPRODI, ROLES.DOSEN), getDashboardStats);

// Course list for dropdowns
router.get('/courses', authorize(ROLES.KAPRODI, ROLES.DOSEN), getCoursesForAnalytics);

// Grade distribution
router.get('/grade-distribution', authorize(ROLES.KAPRODI, ROLES.DOSEN), getGradeDistribution);

// Attendance trends
router.get('/attendance-trends', authorize(ROLES.KAPRODI, ROLES.DOSEN), getAttendanceTrends);

// CPL attainment
router.get('/cpl-attainment', authorize(ROLES.KAPRODI, ROLES.DOSEN), getCPLAttainment);

export default router;
