import { Router, Request, Response } from 'express';
import { getTransactionHistory, broadcast } from '../services/transactionPoller';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json({ transactions: getTransactionHistory() });
});

// TEST ONLY — remove before submitting
router.post('/test-broadcast', (_req: Request, res: Response) => {
    const fakeTransaction = {
        id: Date.now(),
        typeCode: 'TR',
        description: 'New York Yankees traded SS Derek Jeter to Boston Red Sox.',
        player: { fullName: 'Derek Jeter', id: 99999 },
        fromTeam: { name: 'New York Yankees' },
        toTeam: { name: 'Boston Red Sox' },
        date: new Date().toISOString().split('T')[0]
    };
    broadcast({ type: 'NEW_TRANSACTION', transaction: fakeTransaction });
    res.json({ ok: true });
});


export default router;