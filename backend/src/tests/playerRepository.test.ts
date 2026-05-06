jest.mock('../config/database', () => ({
    default: { define: jest.fn(), authenticate: jest.fn(), sync: jest.fn(), query: jest.fn() }
}));

jest.mock('../models/player', () => ({
    __esModule: true,
    default: {
        findAll: jest.fn(),
        findOne: jest.fn(),
        findByPk: jest.fn(),
        create: jest.fn()
    },
    Position: { FIRST: 'FIRST', CATCHER: 'CATCHER' },
    Status: { ACTIVE: 'ACTIVE' }
}));

import * as playerRepository from '../repositories/playerRepository';
import Player, { Position, Status } from '../models/player';

const mockedPlayer = Player as any;
const mockPlayer = {
    id: 1, mlbPlayerId: '123', firstName: 'John', lastName: 'Doe',
    age: 28, isHitter: true, playablePositions: [Position.FIRST],
    lastYearStats: { HR: 30 }, threeYearAvg: { HR: 25 }, projectedStats: { HR: 28 },
    status: Status.ACTIVE, seasonsLeft: 3, realTeam: 'NYY', realLeague: 'AL',
    update: jest.fn(), destroy: jest.fn()
};

beforeEach(() => jest.clearAllMocks());

describe('playerRepository', () => {

    describe('getPlayerStats', () => {
        it('returns correct shape for a hitter', async () => {
            mockedPlayer.findByPk.mockResolvedValue(mockPlayer as any);
            const result = await playerRepository.getPlayerStats(1);
            expect(result).toEqual({
                type: 'hitter',
                lastYearStats: mockPlayer.lastYearStats,
                threeYearAvg: mockPlayer.threeYearAvg,
                projectedStats: mockPlayer.projectedStats
            });
        });

        it('returns pitcher type for non-hitter', async () => {
            mockedPlayer.findByPk.mockResolvedValue({ ...mockPlayer, isHitter: false } as any);
            const result = await playerRepository.getPlayerStats(1);
            expect(result.type).toBe('pitcher');
        });

        it('throws when player not found', async () => {
            mockedPlayer.findByPk.mockResolvedValue(null);
            await expect(playerRepository.getPlayerStats(999))
                .rejects.toThrow('Player is null.');
        });
    });

    describe('updatePlayer', () => {
        it('returns null when player not found', async () => {
            mockedPlayer.findByPk.mockResolvedValue(null);
            const result = await playerRepository.updatePlayer(999, { age: 30 });
            expect(result).toBeNull();
        });

        it('calls update with correct fields', async () => {
            mockedPlayer.findByPk.mockResolvedValue(mockPlayer as any);
            mockPlayer.update.mockResolvedValue({ ...mockPlayer, age: 30 } as any);
            await playerRepository.updatePlayer(1, { age: 30 });
            expect(mockPlayer.update).toHaveBeenCalledWith({ age: 30 });
        });
    });

    describe('deletePlayer', () => {
        it('returns false when player not found', async () => {
            mockedPlayer.findByPk.mockResolvedValue(null);
            const result = await playerRepository.deletePlayer(999);
            expect(result).toBe(false);
        });

        it('returns true and calls destroy when player exists', async () => {
            mockedPlayer.findByPk.mockResolvedValue(mockPlayer as any);
            mockPlayer.destroy.mockResolvedValue(undefined as any);
            const result = await playerRepository.deletePlayer(1);
            expect(result).toBe(true);
            expect(mockPlayer.destroy).toHaveBeenCalled();
        });
    });
});