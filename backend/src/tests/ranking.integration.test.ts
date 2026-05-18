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
jest.mock('../models/apiUser', () => ({ default: { init: jest.fn() } }));
jest.mock('../models/draftPrep', () => ({ default: { init: jest.fn() } }));
jest.mock('../models/draftSettings', () => ({ default: { init: jest.fn() } }));

jest.mock('../services/transactionPoller', () => ({
    attachWSS: jest.fn(),
    startPoller: jest.fn()
}));

jest.mock('../controllers/accountController', () => ({
    create:           jest.fn((req: any, res: any) => res.status(200).json({})),
    login:            jest.fn((req: any, res: any) => res.status(200).json({})),
    getUserByEmail:   jest.fn((req: any, res: any) => res.status(200).json({})),
    getLoggedInInfo:  jest.fn((req: any, res: any) => res.status(200).json({})),
    deleteAccount:    jest.fn((req: any, res: any) => res.status(200).json({})),
}));

// Mock requireAuth to skip token validation
jest.mock('../middleware/requireAuth', () => (req: any, res: any, next: any) => next());

// Mock the repository so we don't hit the DB
jest.mock('../repositories/playerRepository', () => ({
    findAllPlayers: jest.fn()
}));

import request from 'supertest';
import app from '../app';
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

// ... all mocks stay exactly the same ...

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

    const mockTeams = [
        { id: 1, players: [] },
        { id: 2, players: [] }
    ];

    it('returns 200 with ranked players for a valid league (no teams)', async () => {
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

    it('returns 200 with ranked players when teams are present', async () => {
        mockedRepo.findAllPlayers.mockResolvedValue([mockPlayer()] as any);

        const response = await request(app)
            .post('/api/ranking/ranks/dynamic')
            .send({ ...mockLeagueBody, teams: mockTeams });

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body[0]).toHaveProperty('mlbPlayerId');
        expect(response.body[0]).toHaveProperty('rank');
        expect(response.body[0]).toHaveProperty('cost');
        expect(response.body[0]).toHaveProperty('name');
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
        const alPlayer = mockPlayer({ realLeague: 'AL' });
        const nlPlayer = mockPlayer({ id: 2, mlbPlayerId: 102, realLeague: 'NL' });
        mockedRepo.findAllPlayers.mockResolvedValue([alPlayer, nlPlayer] as any);

        const response = await request(app)
            .post('/api/ranking/ranks/dynamic')
            .send({ 
                ...mockLeagueBody,
                teams: mockTeams,  // use teams with actual length so numTeams > 0
                playerSettings: { division: 'AL' } 
            });

        expect(response.status).toBe(200);
        const ids = response.body.map((p: any) => p.mlbPlayerId);
        expect(ids).toContain(101);
        expect(ids).not.toContain(102);
    });

    it('excludes already drafted players when teams have players', async () => {
        const player1 = mockPlayer({ mlbPlayerId: 101 });
        const player2 = mockPlayer({ id: 2, mlbPlayerId: 102 });
        mockedRepo.findAllPlayers.mockResolvedValue([player1, player2] as any);

        const teamsWithDraftedPlayer = [
            { id: 1, players: [{ player_id: 102, rosterPosition: 'CATCHER' }] },
            { id: 2, players: [] }
        ];

        const response = await request(app)
            .post('/api/ranking/ranks/dynamic')
            .send({ ...mockLeagueBody, teams: teamsWithDraftedPlayer });

        expect(response.status).toBe(200);
        const ids = response.body.map((p: any) => p.mlbPlayerId);
        expect(ids).toContain(101);
        expect(ids).not.toContain(102);
    });
});