import { Request, Response, NextFunction } from "express";
import {findApiUserByKey, incrementApiUserUsage} from '../repositories/apiUserRepository';
import crypto from "crypto";

export default async function requireAuth(req: Request, res: Response, next: NextFunction) {
    try{
        const apiKey = req.headers["x-api-key"] as string;
        const signature = req.headers["x-signature"] as string;

        if (!apiKey || !signature) {
            return res.status(400).send("Missing headers");
        }


        //check if user exists from apiKey
        const user = await findApiUserByKey(apiKey);
        if (!user) {
            return res.status(401).send("Invalid API key");
        }

        //validate key with hash

        const secret = user.apiKey;

        const payload = JSON.stringify(req.body);

        const expectedSignature = crypto
            .createHmac("sha256", secret)
            .update(payload)
            .digest("hex");

        if (expectedSignature !== signature) {
            return res.status(401).send("Invalid signature");
        }

        //update useage
        await incrementApiUserUsage(user.id)
        next();
    } catch (err) {
        console.error(err);
        return res.status(500).send("Server error");
    }
}
