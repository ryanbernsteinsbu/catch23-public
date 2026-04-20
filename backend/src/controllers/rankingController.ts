import { Request, Response } from 'express';
import { getAllPlayerRanks } from '../services/rankingService';

export const getPlayerRankController = async (req: Request, res: Response) => {
    try {
        const rank = await getAllPlayerRanks();
        return res.status(200).json(rank);

    } catch (err: any) {
        res.status(404).json({ error: err.message });
    }
}