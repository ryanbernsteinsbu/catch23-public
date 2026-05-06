// Mocks
jest.mock('../config/database', () => ({
    default: { define: jest.fn(), authenticate: jest.fn(), sync: jest.fn(), query: jest.fn() }
}));

jest.mock('../models/player', () => ({
    default: { init: jest.fn(), findAll: jest.fn(), findOne: jest.fn(), create: jest.fn(), update: jest.fn(), destroy: jest.fn() },
    Position: { CATCHER: 'CATCHER', FIRST: 'FIRST', SECOND: 'SECOND', THIRD: 'THIRD', SHORTSTOP: 'SHORTSTOP', OUTFIELD: 'OUTFIELD', PITCHER: 'PITCHER', UTILITY: 'UTILITY' },
    Status: { ACTIVE: 'ACTIVE', IL_10: 'IL_10', IL_15: 'IL_15', IL_60: 'IL_60', MINORS: 'MINORS', OUT: 'OUT' }
}));

jest.mock('../models/draftPick', () => ({
    RosterPosition: {
        CATCHER: 'CATCHER', FIRST: 'FIRST', SECOND: 'SECOND', THIRD: 'THIRD',
        SHORTSTOP: 'SHORTSTOP', CORNER: 'CORNER', MIDDLE: 'MIDDLE',
        OUTFIELD: 'OUTFIELD', UTILITY: 'UTILITY', PITCHER: 'PITCHER'
    }
}));

jest.mock('../models/playerSettings', () => ({
    default: { init: jest.fn() },
    Division: { MIXED: 'MIXED', AL: 'AL', NL: 'NL' }
}));

jest.mock('../models/scoringSettings',   () => ({ default: { init: jest.fn() } }));
jest.mock('../models/rosterSettings',    () => ({ default: { init: jest.fn() } }));
jest.mock('../models/draftSettings',     () => ({ default: { init: jest.fn() } }));
jest.mock('../models/draftPrep',         () => ({ default: { init: jest.fn() } }));
jest.mock('../models/apiUser',           () => ({ default: { init: jest.fn() } }));
jest.mock('../models/league',            () => ({ default: { init: jest.fn(), hasOne: jest.fn(), hasMany: jest.fn() } }));
jest.mock('../models/team',              () => ({ default: { init: jest.fn() } }));

jest.mock('../middleware/requireAuth', () => (req: any, res: any, next: any) => next());

jest.mock('../services/transactionPoller', () => ({
    attachWSS: jest.fn(),
    startPoller: jest.fn()
}));

jest.mock('../controllers/accountController', () => ({
    create: jest.fn((req: any, res: any) => res.status(200).json({})),
    login:  jest.fn((req: any, res: any) => res.status(200).json({}))
}));

jest.mock('../repositories/playerRepository', () => ({
    findAllPlayers: jest.fn(),
    findPlayerById: jest.fn(),
    findPlayerByMlbId: jest.fn(),
    findPlayerByPosition: jest.fn(),
    findPlayerByStatus: jest.fn(),
    createPlayer: jest.fn(),
    updatePlayer: jest.fn(),
    deletePlayer: jest.fn(),
}));

import request from 'supertest';
import app from '../app';
import * as playerRepository from '../repositories/playerRepository';
import { Position, Status } from '../models/player';

const mockedRepo = playerRepository as jest.Mocked<typeof playerRepository>;

const mockPlayer = {
    id: 1,
    mlbPlayerId: '123',
    age: 25,
    firstName: 'Richard',
    lastName: 'McKenna',
    isHitter: true,
    playablePositions: [Position.FIRST],
    lastYearStats:  { HR: 30, RBI: 90 },
    threeYearAvg:   { HR: 25, RBI: 80 },
    projectedStats: { HR: 28, RBI: 85 },
    status: Status.ACTIVE,
    seasonsLeft: 3,
    realTeam: 'NYY',
    realLeague: 'AL'
};

beforeEach(() => jest.clearAllMocks());

describe('GET /api/public/player/:id', () => {
    it('returns 200 with player data', async () => {
        mockedRepo.findPlayerById.mockResolvedValue(mockPlayer as any);

        const response = await request(app).get('/api/public/player/1');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('mlbPlayerId', '123');
        expect(response.body).toHaveProperty('firstName', 'Richard');
    });

    it('returns 404 when player not found', async () => {
        mockedRepo.findPlayerById.mockRejectedValue(new Error('Player not found'));

        const response = await request(app).get('/api/public/player/999');

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'Player not found');
    });

    it('passes the correct id to the service', async () => {
        mockedRepo.findPlayerById.mockResolvedValue(mockPlayer as any);

        await request(app).get('/api/public/player/1');

        expect(mockedRepo.findPlayerById).toHaveBeenCalledWith(1);
    });
});