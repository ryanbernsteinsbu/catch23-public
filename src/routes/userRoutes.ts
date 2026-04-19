// Used AI for syntax help
import { Router } from 'express';

import * as userController from '../controllers/userController';

const router = Router();

// Routes
router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/:id', userController.getUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

export default router;