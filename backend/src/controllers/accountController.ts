import { Request, Response } from 'express';
import { createApiUser } from '../repositories/apiUserRepository';
import ApiUser from '../models/apiUser';
export const create = async (req: Request, res: Response): Promise<void> => {
    try{
        const {email, passwordHash} = req.body;
        const apiUser = await createApiUser(email, passwordHash);
        res.status(201).json(apiUser.apiKey);
    } catch (err: any) {
        res.status(400).json({error: err.message});
    }
}
