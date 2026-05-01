import { Router } from 'express';
import { getPlayerRankController, getDynamicPlayerRankController} from '../controllers/rankingController';

const router = Router();

router.post('/rank', getPlayerRankController);
router.post('/ranks/dynamic', getDynamicPlayerRankController);

export default router;
