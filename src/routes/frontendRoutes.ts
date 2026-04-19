import { Router } from 'express';

import * as frontendController from '../controllers/frontendController';

const router = Router();

// Routes
router.get('', frontendController.showHTML);

export default router;

