import { Router } from 'express';

import * as accountController from '../controllers/accountController';

const router = Router();

// Routes
router.get('/user-info/:email', accountController.getUserByEmail);

export default router;
