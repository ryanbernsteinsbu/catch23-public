import { Request, Response } from 'express';

export const showHTML = async (req: Request, res: Response) => {
    try{
        res.status(200).send(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Catch23 API</title>
                </head>
                <body>
                    <h1>The Page is working</h1>
                    <p>SIGN UP FOR API HERE</p>
                </body>
            </html>
        `);
    } catch (error) {
        res.status(500).send('Error showing page');
    }

}
