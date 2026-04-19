import { Request, Response } from 'express';
import * as playerService from '../services/playerService';
import { Position, Status } from '../models/player';


/* 
create player, find all, find by id, find by mlb id, find by position, 
find by status, update a player, delete a player
*/
/* 
    public id!: number; ignore
    public mlbPlayerId!: string; // use for syncing with MLB database
    public firstName!: string;
    public lastName!: string;
    public isHitter!: boolean;
    public playablePositions!: Position[];
    public lastYearStats!: Record<string, number>;
    public threeYearAvg!: Record<string, number>;
    public projectedStats!: Record<string, number>;
    public status!: Status;
    public seasonsLeft!: number; 
    public realTeam!: string;
    public realLeague!: string;
*/

// POST /api/players/create
export const create = async (req: Request, res: Response): Promise<void> => {
    try {
        const { mlbPlayerId, age, firstName, lastName, isHitter, playablePositions, 
            lastYearStats, threeYearAvg, projectedStats, status, seasonsLeft, realTeam, realLeague } = req.body;
        const player = await playerService.createPlayer(mlbPlayerId, age, firstName, lastName, isHitter, playablePositions, 
            lastYearStats, threeYearAvg, projectedStats, status, seasonsLeft, realTeam, realLeague);
        res.status(201).json({
            mlbPlayerId: player.mlbPlayerId,
            age: player.age,
            firstName: player.firstName,
            lastName: player.lastName,
            isHitter: player.isHitter,
            realTeam: player.realTeam,
            realLeague: player.realLeague,
            seasonsLeft: player.seasonsLeft,
            status: player.status,
            playablePositions: player.playablePositions,
            lastYearStats: player.lastYearStats,
            threeYearAvg: player.threeYearAvg,
            projectedStats: player.projectedStats,
        });
    } catch (err: any) {
        res.status(400).json({error: err.message});
    }
}


// GET /api/players/all
export const getAllPlayers = async (req: Request, res: Response): Promise<void> => {
    try {
        const players = await playerService.getAllPlayers();
        res.status(200).json(players);
    } catch (err: any) {
        res.status(404).json({ error: err.message });
    }
}

// GET /api/players/:id
export const getPlayer = async (req: Request, res: Response): Promise<void> => {
    try {
        const player = await playerService.getPlayerById(Number(req.params.id));
        res.status(200).json(player);
    } catch (err: any) {
        res.status(404).json({ error: err.message });
    }
}

// GET /api/players/:mlbPlayerId
export const getPlayerByMlbId = async (req: Request, res: Response): Promise<void> => {
    try {
        const player = await playerService.getPlayerByMlbId(req.params.mlbPlayerId as string);
        res.status(200).json(player);
    } catch (err: any) {
        res.status(404).json({ error: err.message });
    }
}


// GET /api/players/:position
export const getPlayerByPosition = async (req: Request, res: Response): Promise<void> => {
    try {
        const players = await playerService.getPlayersByPosition(req.params.position as Position);
        res.status(200).json(players);

    } catch (err: any) {
        res.status(404).json({ error: err.message });
    }
}

// GET /api/players/:status
export const getPlayerByStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const players = await playerService.getPlayersByStatus(req.params.status as Status);
        res.status(200).json(players);
    } catch (err: any) {
        res.status(404).json({ error: err.message });
    }
}


// PUT /api/players/:id
export const updatePlayer = async (req: Request, res: Response): Promise<void> => {
    try {
        const player = await playerService.updatePlayer(Number(req.params.id), req.body);
        res.status(200).json(player);
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
}

// DELETE /api/players/:id
export const deletePlayer = async(req: Request, res: Response): Promise<void> => {
    try {
        await playerService.deletePlayer(Number(req.params.id));
        res.status(204).send();
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
}
