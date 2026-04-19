import { Router } from 'express';

import * as publicController from '../controllers/publicController';

const router = Router();

// Routes
router.get('/player/:id', publicController.getPlayer);
// router.get('/test', (req, res, next) => {
//   console.log('Time:', Date.now())
//   next()
// })
router.get('/test', publicController.test);

export default router;
