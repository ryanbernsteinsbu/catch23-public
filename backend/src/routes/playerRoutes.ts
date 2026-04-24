// routes/playerRoutes.ts
import { Router } from 'express';
import * as playerController from '../controllers/playerController';

const router = Router();

router.post('/create', playerController.create);
router.get('/all', playerController.getAllPlayers);
router.get('/id/:id', playerController.getPlayer);
router.get('/mlb/:mlbPlayerId', playerController.getPlayerByMlbId);
router.get('/position/:position', playerController.getPlayerByPosition);
router.get('/status/:status', playerController.getPlayerByStatus);
router.put('/:id', playerController.updatePlayer);
router.delete('/:id', playerController.deletePlayer);

export default router;