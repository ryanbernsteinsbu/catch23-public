import { Request, Response } from 'express';
import { createApiUser, findApiUserByEmail } from '../repositories/apiUserRepository';
import ApiUser from '../models/apiUser';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const create = async (req: Request, res: Response): Promise<void> => {
    try{
        const {email, password} = req.body;
        if(!email || !password) {
            res.status(400).json({error: "Email and password required"});
            return;
        }
        const passwordHash = await bcrypt.hash(password, 10);
        console.log(passwordHash);
        const apiUser = await createApiUser(email, passwordHash);
        res.status(201).json(apiUser.apiKey);
    } catch (err: any) {
        res.status(400).json({error: err.message});
    }
}

export const login = async(req: Request, res: Response): Promise<void> => {
    try {
        console.log('Login body:', req.body);
        const { email, password } = req.body;
        if(!email || !password) {
            res.status(400).json({message: "Email and password required" });
            return;
        }
    

    const user = await findApiUserByEmail(email);
    console.log('Full user object:', JSON.stringify(user));
    if(!user) {
        res.status(400).json({ message: "Invalid email or password"});
        return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    // const valid = password === user.passwordHash;
    console.log('password:', password);
    console.log('hash:', user.passwordHash);
    console.log('valid:', valid);
    
    if(!valid) {
        res.status(400).json({ message: "Invalid email or password" });
        return;
    }

    const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET!,
        {expiresIn: '7d'}
    );

    res.status(200).json({token, user_id: user.id});
    } catch (err: any){
        res.status(400).json({error: err.message});
    }
};

export const getUserByEmail = async(req: Request, res: Response) => {
    try{
        const email = decodeURIComponent(req.params.email as string);
        console.log("params:", req.params);
        console.log("email:", req.params.email);
        const user = await findApiUserByEmail(email);
        console.log("user:", user);
        if(!user) return res.status(404).json({ error: "User not found" });

        res.json({
            key: user.apiKey,
            usage: user.usage,
            email: user.email
        })
    } catch (err: any) {
        res.status(400).json({error: err.message});
    }
}