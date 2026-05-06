jest.mock('../config/database', () => ({
    default: { define: jest.fn(), authenticate: jest.fn(), sync: jest.fn(), query: jest.fn() }
}));

jest.mock('../models/apiUser',         () => ({ default: { init: jest.fn() } }));
jest.mock('../models/player',          () => ({ default: { init: jest.fn() }, Position: {}, Status: {} }));
jest.mock('../models/draftPick',       () => ({ RosterPosition: {} }));
jest.mock('../models/playerSettings',  () => ({ default: { init: jest.fn() }, Division: {} }));
jest.mock('../models/scoringSettings', () => ({ default: { init: jest.fn() } }));
jest.mock('../models/rosterSettings',  () => ({ default: { init: jest.fn() } }));
jest.mock('../models/draftSettings',   () => ({ default: { init: jest.fn() } }));
jest.mock('../models/draftPrep',       () => ({ default: { init: jest.fn() } }));
jest.mock('../models/league',          () => ({ default: { init: jest.fn(), hasOne: jest.fn(), hasMany: jest.fn() } }));
jest.mock('../models/team',            () => ({ default: { init: jest.fn() } }));

jest.mock('../middleware/requireAuth', () => (req: any, res: any, next: any) => next());
jest.mock('../repositories/playerRepository', () => ({ findAllPlayers: jest.fn() }));
jest.mock('../repositories/apiUserRepository', () => ({
    findApiUserByEmail: jest.fn(),
    incrementApiUserUsage: jest.fn()
}));

jest.mock('../controllers/accountController', () => ({
    create: jest.fn((req: any, res: any) => res.status(200).json({})),
    login:  jest.fn((req: any, res: any) => res.status(200).json({}))
}));

// Mock the poller so we control what getTransactionHistory returns
jest.mock('../services/transactionPoller', () => ({
    attachWSS: jest.fn(),
    startPoller: jest.fn(),
    getTransactionHistory: jest.fn(),
    broadcast: jest.fn()
}));

import request from 'supertest';
import app from '../app';
import * as transactionPoller from '../services/transactionPoller';

const mockedPoller = transactionPoller as jest.Mocked<typeof transactionPoller>;

const mockTransaction = {
    id: 1,
    typeCode: 'TR',
    description: 'Test transaction',
    date: '2026-01-01'
};

beforeEach(() => jest.clearAllMocks());

// --- GET /api/transactions ---
describe('GET /api/transactions', () => {
    it('returns 200 with transaction history', async () => {
        mockedPoller.getTransactionHistory.mockReturnValue([mockTransaction] as any);

        const response = await request(app).get('/api/transactions');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('transactions');
        expect(response.body.transactions).toHaveLength(1);
        expect(response.body.transactions[0]).toHaveProperty('id', 1);
    });

    it('returns empty array when no transactions', async () => {
        mockedPoller.getTransactionHistory.mockReturnValue([]);

        const response = await request(app).get('/api/transactions');

        expect(response.status).toBe(200);
        expect(response.body.transactions).toHaveLength(0);
    });
});

// --- POST /api/transactions/test-broadcast ---
describe('POST /api/transactions/test-broadcast', () => {
    it('returns 200 and calls broadcast', async () => {
        const response = await request(app)
            .post('/api/transactions/test-broadcast')
            .send({});

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('ok', true);
        expect(mockedPoller.broadcast).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'NEW_TRANSACTION' })
        );
    });

    it('broadcast is called with correct transaction shape', async () => {
        await request(app).post('/api/transactions/test-broadcast').send({});

        const callArg = mockedPoller.broadcast.mock.calls[0][0] as any;
        expect(callArg.transaction).toHaveProperty('typeCode', 'TR');
        expect(callArg.transaction).toHaveProperty('player');
        expect(callArg.transaction).toHaveProperty('fromTeam');
        expect(callArg.transaction).toHaveProperty('toTeam');
    });
});