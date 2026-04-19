import { Router } from 'express';

import * as draftPickController from '../controllers/draftPickController';

const router = Router();

// Routes
//router.post('/create', draftPickController.createDraftPick);
router.post('/bulk', draftPickController.saveDraftPicks);
router.get('/team/:id', draftPickController.getTeamDraftPicks);

export default router;