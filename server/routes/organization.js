import express from 'express';
import {
    getInstitusi,
    getAllFakultas,
    getFakultasById,
    createFakultas,
    updateFakultas,
    deleteFakultas,
    getAllProdi,
    getProdiById,
    createProdi,
    updateProdi,
    deleteProdi
} from '../controllers/organizationController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public read access for some info could be allowed, but for now strict
router.use(authenticate);

router.get('/institusi', getInstitusi);

// Fakultas
router.get('/fakultas', getAllFakultas);
router.get('/fakultas/:id', getFakultasById);
// Secure modification routes
router.post('/fakultas', authorize(['superadmin', 'admin']), createFakultas);
router.put('/fakultas/:id', authorize(['superadmin', 'admin']), updateFakultas);
router.delete('/fakultas/:id', authorize(['superadmin', 'admin']), deleteFakultas);

// Prodi
router.get('/prodi', getAllProdi);
router.get('/prodi/:id', getProdiById);
// Secure modification routes
router.post('/prodi', authorize(['superadmin', 'admin']), createProdi);
router.put('/prodi/:id', authorize(['superadmin', 'admin']), updateProdi);
router.delete('/prodi/:id', authorize(['superadmin', 'admin']), deleteProdi);

export default router;
