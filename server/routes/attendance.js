import express from 'express';
import { authenticate, authorize, ROLES } from '../middleware/auth.js';
import {
    getPertemuanAttendance,
    markAttendance,
    bulkMarkAttendance,
    getStudentReport,
    getCourseReport
} from '../controllers/attendanceController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET attendance for a specific pertemuan
router.get('/pertemuan/:pertemuanId', getPertemuanAttendance);

// MARK single attendance (Dosen only)
router.post('/mark', authorize(ROLES.DOSEN, ROLES.KAPRODI), markAttendance);

// BULK mark attendance (Dosen only)
router.post('/bulk-mark', authorize(ROLES.DOSEN, ROLES.KAPRODI), bulkMarkAttendance);

// GET student attendance report
router.get('/report/student/:mahasiswaId', getStudentReport);

// GET course attendance report (Dosen/Kaprodi)
router.get('/report/course/:courseId', authorize(ROLES.DOSEN, ROLES.KAPRODI), getCourseReport);

export default router;
