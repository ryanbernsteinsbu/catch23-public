// Mocks - same ones as rankingService tests
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

jest.mock('../models/scoringSettings', () => ({ default: { init: jest.fn() } }));
jest.mock('../models/rosterSettings',  () => ({ default: { init: jest.fn() } }));
jest.mock('../models/draftSettings',   () => ({ default: { init: jest.fn() } }));
jest.mock('../models/league',          () => ({ default: { init: jest.fn(), hasOne: jest.fn(), hasMany: jest.fn() } }));
jest.mock('../models/team',            () => ({ default: { init: jest.fn() } }));

// Mock requireAuth to skip token validation
jest.mock('../middleware/requireAuth', () => (req: any, res: any, next: any) => next());

// Mock the repository so we don't hit the DB
jest.mock('../repositories/playerRepository', () => ({
    findAllPlayers: jest.fn()
}));

import request from 'supertest';
import app from '../index';
import * as playerRepository from '../repositories/playerRepository';
import { Position, Status } from '../models/player';

const mockedRepo = playerRepository as jest.Mocked<typeof playerRepository>;

// Minimal valid player for ranking
const mockPlayer = (overrides = {}) => ({
    id: 1,
    mlbPlayerId: 101,
    firstName: 'John',
    lastName: 'Doe',
    age: 28,
    isHitter: true,
    playablePositions: [Position.CATCHER],
    status: Status.ACTIVE,
    seasonsLeft: 3,
    realTeam: 'NYY',
    realLeague: 'AL',
    lastYearStats:  { HR: 30, RBI: 90, SB: 15, AVG: 0.360, R: 85 },
    threeYearAvg:   { HR: 25, RBI: 80, SB: 12, AVG: 0.340, R: 78 },
    projectedStats: { HR: 28, RBI: 85, SB: 14, AVG: 0.350, R: 80 },
    ...overrides
});

beforeEach(() => jest.clearAllMocks());

// --- POST /api/ranking/rank ---
describe('POST /api/ranking/rank', () => {
    it('returns 200 with ranked players', async () => {
        mockedRepo.findAllPlayers.mockResolvedValue([mockPlayer()] as any);

        const response = await request(app).post('/api/ranking/rank').send({});

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body[0]).toHaveProperty('mlbPlayerId');
        expect(response.body[0]).toHaveProperty('rank');
        expect(response.body[0]).toHaveProperty('cost');
    });

    it('returns 404 when repository throws', async () => {
        mockedRepo.findAllPlayers.mockRejectedValue(new Error('DB error'));

        const response = await request(app).post('/api/ranking/rank').send({});

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error');
    });
});

// --- POST /api/ranking/ranks/dynamic ---
describe('POST /api/ranking/ranks/dynamic', () => {
    const mockLeagueBody = {
        teams: undefined,
        playerSettings: { division: 'MIXED' },
        draftSettings: { budget: 260 },
        scoringSettings: {
            hrWeight: 0.175, rbiWeight: 0.155, sbWeight: 0.125,
            avgWeight: 0.150, runsWeight: 0.125, eraWeight: 0.200,
            whipWeight: 0.200, winsWeight: 0.100, strikeoutsWeight: 0.150,
            savesWeight: 0.100, useLastYear: true, useThreeYearAvg: true, useProjected: true
        },
        rosterSettings: {
            numCatchers: 2, numFirstBase: 1, numSecondBase: 1, numThirdBase: 1,
            numShortstop: 1, numCornerInfield: 1, numMiddleInfield: 1,
            numOutfield: 5, numUtility: 1, numPitchers: 9
        }
    };

    it('returns 200 with ranked players for a valid league', async () => {
        mockedRepo.findAllPlayers.mockResolvedValue([mockPlayer()] as any);

        const response = await request(app)
            .post('/api/ranking/ranks/dynamic')
            .send(mockLeagueBody);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body[0]).toHaveProperty('mlbPlayerId');
        expect(response.body[0]).toHaveProperty('rank');
        expect(response.body[0]).toHaveProperty('cost');
    });

    it('returns 404 when repository throws', async () => {
        mockedRepo.findAllPlayers.mockRejectedValue(new Error('DB error'));

        const response = await request(app)
            .post('/api/ranking/ranks/dynamic')
            .send(mockLeagueBody);

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error');
    });

    it('returns 200 with AL division filter applied', async () => {
        const alPlayer  = mockPlayer({ realLeague: 'AL' });
        const nlPlayer  = mockPlayer({ mlbPlayerId: 102, realLeague: 'NL' });
        mockedRepo.findAllPlayers.mockResolvedValue([alPlayer, nlPlayer] as any);

        const response = await request(app)
            .post('/api/ranking/ranks/dynamic')
            .send({ ...mockLeagueBody, playerSettings: { division: 'AL' } });

        expect(response.status).toBe(200);
        const ids = response.body.map((p: any) => p.mlbPlayerId);
        expect(ids).toContain(101);
        expect(ids).not.toContain(102);
    });
});