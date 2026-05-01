import { Request, Response } from 'express';
import { getAllPlayerRanks, getAllUpdatedPlayerRanks } from '../services/rankingService';
import League from '../models/league'

export const getPlayerRankController = async (req: Request, res: Response) => {
    try {
        const playerInformation = await getAllPlayerRanks();
        return res.status(200).json(playerInformation);

    } catch (err: any) {
        res.status(404).json({ error: err.message });
    }
}

export const getDynamicPlayerRankController = async (req: Request, res: Response) => {
    try {
        const league: League = req.body;
        const playerInformation = await getAllUpdatedPlayerRanks(league);
        return res.status(200).json(playerInformation);

    } catch (err: any) {
        res.status(404).json({ error: err.message });
    }
}