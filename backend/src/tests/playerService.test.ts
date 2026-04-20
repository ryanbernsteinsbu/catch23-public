// Mocks
jest.mock('../config/database', () => ({
  default: { define: jest.fn(), authenticate: jest.fn(), sync: jest.fn(), query: jest.fn() }
}));

jest.mock('../models/player', () => ({
  default: { init: jest.fn(), findAll: jest.fn(), findOne: jest.fn(), create: jest.fn(), update: jest.fn(), destroy: jest.fn() },
  Position: { CATCHER: 'CATCHER', FIRST: 'FIRST', SECOND: 'SECOND', THIRD: 'THIRD', SHORTSTOP: 'SHORTSTOP', OUTFIELD: 'OUTFIELD', PITCHER: 'PITCHER', UTILITY: 'UTILITY' },
  Status: { ACTIVE: 'ACTIVE', IL_10: 'IL_10', IL_15: 'IL_15', IL_60: 'IL_60', MINORS: 'MINORS', OUT: 'OUT' }
}));

// Imports
import * as playerService from '../services/playerService';
import * as playerRepository from '../repositories/playerRepository';
import Player, { Position, Status } from '../models/player';


jest.mock('../repositories/playerRepository'); // Mocking the repo so we aren't touching actual DB
const mockedRepo = playerRepository as jest.Mocked<typeof playerRepository>

const mockPlayer = {
    id: 1,
    mlbPlayerId: "123",
    age: 25,
    firstName: "Richard",
    lastName: "McKenna",
    isHitter: true,
    playablePositions: [Position.FIRST],
    lastYearStats: {HR: 30, RBI: 90},
    threeYearAvg: {HR: 25, RBI: 80},
    projectedStats: {HR: 28, RBI: 85},
    status: Status.ACTIVE,
    seasonsLeft: 3,
    realTeam: "NYY",
    realLeague: "AL"
} as unknown as Player;

beforeEach(() => {
    jest.clearAllMocks();
});

// Testing: createPlayer
describe('createPlayer', () => {
    it('creates a player given the player does not already exist', async() => {
        mockedRepo.findPlayerByMlbId.mockResolvedValue(null); // faking what the database would return
        mockedRepo.createPlayer.mockResolvedValue(mockPlayer); // pretending that the DB successfully created + returned the mock player

        const result = await playerService.createPlayer(
            "123", 25, "Richard", "McKenna", true, [Position.FIRST],
            { HR: 30, RBI: 90 }, { HR: 25, RBI: 80 }, { HR: 28, RBI: 85 },
            Status.ACTIVE, 3, "NYY", "AL"
        );

        expect(result).toEqual(mockPlayer);
        expect(mockedRepo.createPlayer).toHaveBeenCalledTimes(1); // verifying logic flow to ensure we only call createPlayer once
    })

    it('throw error if player already exists', async() => {
        mockedRepo.findPlayerByMlbId.mockResolvedValue(mockPlayer); // faking what the database would return

        await expect(playerService.createPlayer(
            "123", 25, "Richard", "McKenna", true, [Position.FIRST],
            { HR: 30, RBI: 90 }, { HR: 25, RBI: 80 }, { HR: 28, RBI: 85 },
            Status.ACTIVE, 3, "NYY", "AL"
        )).rejects.toThrow('Player already exists');
    });
});

// Testing: getAllPlayers
describe('getAllPlayers', () => {
    it('should return all players', async() => {
        mockedRepo.findAllPlayers.mockResolvedValue([mockPlayer]);

        const result = await playerService.getAllPlayers();
        expect(result).toEqual([mockPlayer]);
    });

    it('should throw if no players found', async() => {
        mockedRepo.findAllPlayers.mockResolvedValue(null as any);

        await expect(playerService.getAllPlayers()).rejects.toThrow('No players found');
    })
})

// Testing: getPlayerById
describe('getPlayerById', () => {
    it('return a player by id', async() => {
        mockedRepo.findPlayerById.mockResolvedValue(mockPlayer);

        const result = await playerService.getPlayerById(1);
        expect(result).toEqual(mockPlayer);
    });

    it('throw error if player not found', async() => {
        mockedRepo.findPlayerById.mockResolvedValue(null);

        await expect(playerService.getPlayerById(999)).rejects.toThrow('Player not found');
    });
});

// Testing: getPlayerByMlbId
describe('getPlayerByMlbId', () => {
    it('return a player by MLB id', async() => {
        mockedRepo.findPlayerByMlbId.mockResolvedValue(mockPlayer);

        const result = await playerService.getPlayerByMlbId("123");
        expect(result).toEqual(mockPlayer);
    });

    it('throw error if player not found', async() => {
        mockedRepo.findPlayerByMlbId.mockResolvedValue(null);

        await expect(playerService.getPlayerByMlbId("999")).rejects.toThrow('Player not found');
    });
});

// Testing: getPlayersByPosition
describe('getPlayersByPosition', () => {
    it('return a player by position', async() => {
        mockedRepo.findPlayerByPosition.mockResolvedValue([mockPlayer]);

        const result = await playerService.getPlayersByPosition(Position.FIRST);
        expect(result).toEqual([mockPlayer]);
    });

    it('throw error if player not found', async() => {
        mockedRepo.findPlayerByPosition.mockResolvedValue(null as any);

        await expect(playerService.getPlayersByPosition(Position.FIRST)).rejects.toThrow('Players not found');
    });
});

// Testing: getPlayersByStatus
describe('getPlayersByStatus', () => {
    it('return a player by status', async() => {
        mockedRepo.findPlayerByStatus.mockResolvedValue([mockPlayer]);

        const result = await playerService.getPlayersByStatus(Status.ACTIVE);
        expect(result).toEqual([mockPlayer]);
    });

    it('throw error if player not found', async() => {
        mockedRepo.findPlayerByStatus.mockResolvedValue(null as any);

        await expect(playerService.getPlayersByStatus(Status.ACTIVE)).rejects.toThrow('Players not found');
    });
});

// Testing: updatePlayer
describe('updatePlayer', () => {
    it('should update a player', async() => {
        const updated = {...mockPlayer, age:26} as unknown as Player;
        mockedRepo.updatePlayer.mockResolvedValue(updated);

        const result = await playerService.updatePlayer(1, {age: 26});
        expect(result).toEqual(updated)
        expect(mockedRepo.updatePlayer).toHaveBeenCalledWith(1, {age: 26});
    });
});

// Testing: deletePlayer
describe('deletePlayer', () => {
    it('should delete a player and return true', async() => {
        mockedRepo.deletePlayer.mockResolvedValue(true);

        const result = await playerService.deletePlayer(1);
        expect(result).toBe(true);
    });

    it('return false if player did not exist', async() => {
        mockedRepo.deletePlayer.mockResolvedValue(false);

        const result = await playerService.deletePlayer(999);
        expect(result).toBe(false);
    })
})