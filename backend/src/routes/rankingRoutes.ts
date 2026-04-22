import { Router } from 'express';
import { getPlayerRankController } from '../controllers/rankingController';

const router = Router();

router.post('/rank', getPlayerRankController);

export default router;
