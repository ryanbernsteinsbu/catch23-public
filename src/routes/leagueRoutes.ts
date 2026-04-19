import { Router } from 'express';

import * as leagueController from '../controllers/leagueController';

const router = Router();

// Routes
router.post('/create', leagueController.createLeague);
router.get('/user/:user_id', leagueController.getUserLeagues);
router.get('/:id', leagueController.getLeague);
router.put('/:id', leagueController.updateLeague);
router.delete('/:id', leagueController.deleteLeague);

export default router;