import express from 'express';
import * as profileController from '../controllers/profileController.js';
import { authenticate as authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', profileController.getProfileDetails);
router.post('/', profileController.upsertProfile);

export default router;
