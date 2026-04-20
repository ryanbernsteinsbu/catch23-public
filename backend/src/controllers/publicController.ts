import { Request, Response } from 'express';
import * as playerService from '../services/playerService';

//get player by id
export const getPlayer = async (req: Request, res: Response): Promise<void> => {
    try {
        const player = await playerService.getPlayerById(Number(req.params.id));
        res.status(200).json(player);
    } catch (err: any) {
        res.status(404).json({ error: err.message });
    }
}

export const test = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log("test")
        res.status(200).json({message: "yay"});
    } catch (err: any) {
        res.status(404).json({ error: err.message });
    }
}
