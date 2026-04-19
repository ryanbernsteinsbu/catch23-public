// Used AI for syntax help

import { Request, Response } from 'express';
import User from '../models/user';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Register user
export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, displayName } = req.body;

        // Check if email already has an associated account
        const existing = await User.findOne({ where: { email } });
        if(existing) throw new Error('Email is connected to existing account');

        // Hashing the password
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            email, hashedPassword, displayName
        })

        res.status(201).json( { email, displayName } );
    } catch (error) {
        res.status(500).json({ message: 'Error registering new user', error });
    }
};

// Login user
export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: 'Invalid user credentials' });
        }

        const valid = await bcrypt.compare(password, user.hashedPassword);
        if (!valid) {
            return res.status(401).json({ message: 'Invalid user credentials' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET as string,
            { expiresIn: '75d' }
        );

        res.status(200).json(token);
    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ message: 'An error has occurred.' });
    }
};

// Getting User
export const getUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = await User.findByPk(Number(req.params.id));
        if(!user) throw new Error('User not found');
        
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error getting user', error });
    }
};

// Update User
export const updateUser = async (req: Request, res: Response): Promise<void> => {
    try {        
        const user = await User.findByPk(Number(req.params.id));
        if(!user) throw new Error('User not found');

        await user.update(req.body);
        
        res.status(200).json( user.email );
    } catch (error) {
        res.status(500).json({ message: 'Error updating user', error });
    }
};

// Delete User
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = await User.findByPk(Number(req.params.id));

        if(!user) throw new Error('User not found');

        await user.destroy();

        res.status(200).json({ message: 'User deleted successfully '});
    } catch (error) {
        res.status(500).json({ message: 'Error deleting user', error });
    }
};