
import express from 'express';
import multer from 'multer';
import {
    getCPLs, importCPL, createCPL, updateCPL, deleteCPL,
    getBahanKajian, importBahanKajian, createBahanKajian, updateBahanKajian, deleteBahanKajian,
    getCPMKs, createCPMK, updateCPMK, deleteCPMK, importCPMK, importSubCPMK, importMataKuliah,
    getSubCPMKs, createSubCPMK, updateSubCPMK, deleteSubCPMK,
    deleteBatchCPMK, deleteBatchSubCPMK
} from '../controllers/curriculumController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Configure Multer
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel') {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed'), false);
        }
    }
});

// Routes
router.use(authenticate);

// CPL
router.get('/cpl', getCPLs);
router.post('/cpl', authorize(['kaprodi', 'admin_institusi']), createCPL);
router.put('/cpl/:id', authorize(['kaprodi', 'admin_institusi']), updateCPL);
router.delete('/cpl/:id', authorize(['kaprodi', 'admin_institusi']), deleteCPL);
router.post('/cpl/import', authorize(['kaprodi', 'admin_institusi']), upload.single('file'), importCPL);

// Bahan Kajian
router.get('/bahan-kajian', getBahanKajian);
router.post('/bahan-kajian', authorize(['kaprodi', 'admin_institusi']), createBahanKajian);
router.put('/bahan-kajian/:id', authorize(['kaprodi', 'admin_institusi']), updateBahanKajian);
router.delete('/bahan-kajian/:id', authorize(['kaprodi', 'admin_institusi']), deleteBahanKajian);
router.post('/bahan-kajian/import', authorize(['kaprodi', 'admin_institusi']), upload.single('file'), importBahanKajian);

// CPMK
router.get('/cpmk', getCPMKs);
router.post('/cpmk', authorize(['kaprodi', 'admin_institusi']), createCPMK);
router.put('/cpmk/:id', authorize(['kaprodi', 'admin_institusi']), updateCPMK);
router.delete('/cpmk/:id', authorize(['kaprodi', 'admin_institusi']), deleteCPMK);
router.post('/cpmk/import', authorize(['kaprodi', 'admin_institusi']), upload.single('file'), importCPMK);

// Sub-CPMK
router.get('/sub-cpmk', getSubCPMKs);
router.post('/sub-cpmk', authorize(['kaprodi', 'admin_institusi']), createSubCPMK);
router.put('/sub-cpmk/:id', authorize(['kaprodi', 'admin_institusi']), updateSubCPMK);
router.delete('/sub-cpmk/:id', authorize(['kaprodi', 'admin_institusi']), deleteSubCPMK);
router.post('/sub-cpmk/import', authorize(['kaprodi', 'admin_institusi']), upload.single('file'), importSubCPMK);

// Mata Kuliah
router.post('/mata-kuliah/import', authorize(['kaprodi', 'admin_institusi']), upload.single('file'), importMataKuliah);

// Batch Delete
router.post('/cpmk/batch-delete', authorize(['kaprodi', 'admin_institusi']), deleteBatchCPMK);
router.post('/sub-cpmk/batch-delete', authorize(['kaprodi', 'admin_institusi']), deleteBatchSubCPMK);

export default router;
