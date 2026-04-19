import { Router } from 'express';
import * as playerController from '../controllers/playerController';

const router = Router();

/* 
create player, find all, find by id, find by mlb id, find by position, 
find by status, update a player, delete a player
*/
// Routes
router.post('/create', playerController.create);
router.get('/all', playerController.getAllPlayers);
router.get('/mlbId/:mlbPlayerId', playerController.getPlayerByMlbId);
router.get('/position/:position', playerController.getPlayerByPosition);
router.get('/status/:status', playerController.getPlayerByStatus);

router.get('/:id', playerController.getPlayer);
router.put('/:id', playerController.updatePlayer);
router.delete('/:id', playerController.deletePlayer);

export default router;