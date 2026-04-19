import { Router } from 'express';

import * as teamController from '../controllers/teamController';

const router = Router();

// Routes
router.post('/create', teamController.createTeam);
router.get('/league/:league_id', teamController.getLeagueTeams);
router.get('/:id', teamController.getTeam);
router.put('/:id', teamController.updateTeam);
router.delete('/:id', teamController.deleteTeam);

export default router;