import { Router } from 'express';

import * as accountController from '../controllers/accountController';

const router = Router();

// Routes
router.get('/user-info/:email', accountController.getUserByEmail);
router.get('/user/logged-in', accountController.getLoggedInInfo);
router.delete('/delete', accountController.deleteAccount);

export default router;
