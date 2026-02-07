import express from 'express';
import { authenticate, canAssignLecturers } from '../middleware/auth.js';
import {
    getAllAssignments,
    getAvailableLecturers,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    updateDosen,
    createDosen,
    deleteDosen
} from '../controllers/lecturerAssignmentController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all assignments (role-filtered)
router.get('/', getAllAssignments);

// Get available lecturers for assignment
router.get('/available-lecturers', canAssignLecturers, getAvailableLecturers);

// Create, update, delete assignments (kaprodi/dekan only)
router.post('/', canAssignLecturers, createAssignment);
router.put('/:id', canAssignLecturers, updateAssignment);
router.delete('/:id', canAssignLecturers, deleteAssignment);

// Dosen CRUD operations (kaprodi/dekan/admin only)
router.post('/dosen', canAssignLecturers, createDosen);
router.put('/dosen/:id', canAssignLecturers, updateDosen);
router.delete('/dosen/:id', canAssignLecturers, deleteDosen);

export default router;
