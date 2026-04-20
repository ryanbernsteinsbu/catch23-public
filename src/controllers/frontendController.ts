import { Request, Response } from 'express';
import path from 'path';

export const showHTML = async (req: Request, res: Response) => {
    try{
        res.status(200).sendFile(path.join(__dirname, '../web/index.html'));
    } catch (error) {
        res.status(500).send('Error showing page');
    }

}
