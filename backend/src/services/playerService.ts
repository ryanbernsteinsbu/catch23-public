import * as playerRepository from '../repositories/playerRepository';
import Player, { Position, Status } from '../models/player';

/* 
create player, find all, find by id, find by mlb id, find by position, 
find by status, update a player, delete a player
*/

// POST /api/players/create
export const createPlayer = async (
    mlbPlayerId: string,
    age: number,
    firstName: string,
    lastName: string,
    isHitter: boolean,
    playablePositions: Position[],
    lastYearStats: Record<string, number>,
    threeYearAvg: Record<string, number>,
    projectedStats: Record<string, number>,
    status: Status,
    seasonsLeft: number,
    realTeam: string,
    realLeague: string
): Promise<Player> => {
    const existing = await playerRepository.findPlayerByMlbId(mlbPlayerId);
    if (existing) throw new Error('Player already exists');

    return await playerRepository.createPlayer(mlbPlayerId, age, firstName, lastName, isHitter, playablePositions,
        lastYearStats, threeYearAvg, projectedStats, status, seasonsLeft, realTeam, realLeague );
}

// GET /api/players/all
export const getAllPlayers = async (): Promise<Player[] | null> => {
    const players = await playerRepository.findAllPlayers();
    if (!players) throw new Error('No players found');
    return players;
}

// GET /api/players/:id
export const getPlayerById = async (id: number): Promise<Player | null> => {
    const player = await playerRepository.findPlayerById(id);
    if (!player) throw new Error('Player not found');
    return player;
}

// GET /api/players/:mlbId
export const getPlayerByMlbId = async (mlbId: string): Promise<Player | null> => {
    const player = await playerRepository.findPlayerByMlbId(mlbId);
    if (!player) throw new Error('Player not found');
    return player;
}

// GET /api/players/:position
export const getPlayersByPosition = async (position: Position): Promise<Player[] | null> => {
    const players = await playerRepository.findPlayerByPosition(position);
    if (!players) throw new Error('Players not found');
    return players;
}

// GET /api/players/:status
export const getPlayersByStatus = async (status: Status): Promise<Player[] | null> => {
    const players = await playerRepository.findPlayerByStatus(status);
    if (!players) throw new Error('Players not found');
    return players;
}

// PUT /api/players/:id
export const updatePlayer = async (id: number, updates: Partial<Player>): Promise<Player | null> => {
    return await playerRepository.updatePlayer(id, updates);
}

// DELETE /api/players/:id
export const deletePlayer = async (id: number): Promise<boolean> => {
    return await playerRepository.deletePlayer(id);
}
